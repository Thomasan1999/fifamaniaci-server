import * as path                                              from 'path';
import * as dotenv                                            from 'dotenv';
import * as Pg                                                from 'pg';
import * as pgFormat                                          from 'pg-format';
import * as Moment                                            from 'moment-timezone';
import {LeagueTableRecord}                                    from '../modules/row';
import {LeagueSeasonQueryResult, LeagueSeasonValue}           from '../modules/row/LeagueSeason';
import {ErrorCustom, PgClient, Tomwork}                       from '../modules';
import {LeagueRegistrationValue}                              from '../modules/row/LeagueRegistration';
import {LeagueSeasonsDivisionValue}                           from '../modules/row/LeagueSeasonsDivision';
import {LeagueTableRecordQueryResult, LeagueTableRecordValue} from '../modules/row/LeagueTableRecord';
import {LeagueSeasons}                                        from '../modules/table/LeagueSeasons';
import {LeagueRegistrations}                                  from '../modules/table/LeagueRegistrations';
import {PlayerQueryResult, PlayerValue}                       from '../modules/row/Player';
import {WebSocketCustom}                                      from '../app';
import {LeagueSeasonsDivisionsQueryResult}                    from 'modules/table/LeagueSeasonsDivisions';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});
    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    const seasonLast: LeagueSeasonValue = await new LeagueSeasons({pg}).findLast({seasonStart: {$lte: new Date()}});

    (await pg.query(pgFormat(`SELECT league_registrations.id, canceled, league_registrations.category_id, completed, dnf_after_weeks, league_registrations.created, final_position.position AS penalty_points, position, player.rating, league_registrations.season_id, league_registrations.user_id, league_registrations.updated FROM league_registrations
                                     %s
                                     INNER JOIN players ON players.category_id = league_registrations.category_id AND players.user_id = league_registrations.user_id
                                     INNER JOIN users ON users.id = league_registrations.user_id AND users.verification_code IS NULL
                                     WHERE league_registrations.season_id = $1 `,
        await LeagueRegistrations.finalPositionLookup({pg, query: {seasonId: seasonLast.id}})
        )
    ).then((result: Merge<Pg.QueryResult, { rows: Merge<LeagueRegistrationValue, { finalPosition: number }>[] }>) =>
    {
        return result.rows;
    })).sort((leagueRegistrationA, leagueRegistrationB) =>
    {
        const timestampA: Moment.Moment = Moment(leagueRegistrationA.completed);
        const timestampB: Moment.Moment = Moment(leagueRegistrationB.completed);
        const leagueStart: Moment.Moment = Moment(seasonLast.seasonStart);

        if (timestampA.diff(leagueStart) >= 0 || timestampB.diff(leagueStart) >= 0 || leagueRegistrationA.rating === leagueRegistrationB.rating)
        {
            return timestampA.diff(timestampB);
        }

        const finalPositionA: number = leagueRegistrationA.finalPosition || Number.MAX_SAFE_INTEGER;
        const finalPositionB: number = leagueRegistrationB.finalPosition || Number.MAX_SAFE_INTEGER;

        if (finalPositionA === finalPositionB)
        {
            return (leagueRegistrationB.rating || 0) - (leagueRegistrationA.rating || 0);
        }

        return finalPositionA - finalPositionB;
    }).reduce((a, {categoryId, seasonId, userId}) =>
    {
        return a.then(async () =>
        {
            const leagueTableRecord: LeagueTableRecordValue = await pg.query(
                    `SELECT * FROM league_table_records WHERE category_id = $1 AND season_id = $2 AND user_id = $3`,
                [categoryId, seasonId, userId]
            ).then((result: LeagueTableRecordQueryResult) =>
            {
                return Tomwork.queryParse(result).rows[0];
            });

            if (!leagueTableRecord)
            {
                return;
            }

            const player: PlayerValue = await pg.query(
                    `SELECT * FROM players WHERE category_id = $1 AND user_id = $2`,
                [categoryId, userId]
            ).then((result: PlayerQueryResult) =>
            {
                return Tomwork.queryParse(result).rows[0];
            });

            await pg.query(
                    `UPDATE league_registrations SET rating = COALESCE($1, 0) WHERE category_id = $2 AND season_id = $3 AND user_id = $4`,
                [player.rating, categoryId, seasonId, userId]
            ).catch((err) =>
            {
                new ErrorCustom({at: `${pathRelative} leagueRegistrations.toArray().map() UPDATE league_registrations`, err});
                return Promise.reject(err);
            });

            return await new LeagueTableRecord({
                //@ts-ignore
                io: {
                    emitCustom()
                    {
                    }
                } as unknown as WebSocketCustom,
                pg,
                res: {},
                value: leagueTableRecord
            }).validate().catch((err) =>
            {
                new ErrorCustom({at: `${pathRelative} leagueRegistrations.toArray().reduce() LeagueTableRecord.validate()`, err});
            });
        });
    }, Promise.resolve()).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} leagueRegistrations.toArray().reduce()`, err});
    });

    await Promise.all((await pg.query(`SELECT league_seasons_divisions.id, COUNT(league_seasons_divisions.id) as league_table_records_count FROM league_seasons_divisions 
                                                        INNER JOIN league_table_records ON league_table_records.division_id = league_seasons_divisions.division_id AND league_table_records.season_id = league_seasons_divisions.season_id
                                                        INNER JOIN users ON users.id = league_table_records.user_id AND users.verification_code IS NULL 
                                                        WHERE season_id = $1 GROUP BY league_seasons_divisions.id HAVING COUNT(league_seasons_divisions.id) >= 4`,
        [seasonLast.id]).then((result: LeagueSeasonsDivisionsQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    }) as (LeagueSeasonsDivisionValue & { leagueTableRecords: LeagueTableRecordValue[] })[]).map(async (leagueSeasonsDivision) =>
    {
        const {leagueTableRecords} = leagueSeasonsDivision;

        const teamsLength: number = leagueTableRecords.length;

        const season: LeagueSeasonValue = await pg.query(
                `SELECT * FROM league_seasons WHERE id = $1`,
            [leagueSeasonsDivision.seasonId]
        ).then((result: LeagueSeasonQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0];
        });

        const leagueWeekCount: number = Moment(season.playOffStart).diff(season.seasonStart, `w`);

        const matches: [number, number][] = require(`./matchesScheduleCreate`)({divisionSize: season.divisionSize, teamsLength}).flat();

        const matchesPerWeek: number = Math.ceil(matches.length / leagueWeekCount);

        const matchesSchedule: [number, number][][] = Array(leagueWeekCount).fill(null).map((_, index) =>
        {
            return matches.slice(index * matchesPerWeek, index * matchesPerWeek + matchesPerWeek);
        });

        // if (leagueTableRecords.length === 3)
        // {
        //     console.log(matchesPairs);
        //     console.log(matchesSchedule);
        // }

        return await Promise.all(matchesSchedule.map(async (weekMatches, week) =>
        {
            return await Promise.all(weekMatches.map(async ([homeIndex, awayIndex], doubleMatchOrder) =>
            {
                const awayId = leagueTableRecords[awayIndex].userId;
                const {divisionId} = leagueSeasonsDivision;
                const homeId = leagueTableRecords[homeIndex].userId;
                const matchOrder = doubleMatchOrder * 2;
                const seasonId = seasonLast.id;

                return await pg.query(
                        `INSERT INTO matches(away_id, division_id, home_id, match_order, season_id, week) VALUES($1, $2, $3, $4, $5, $6),($3, $2, $1, $4 + 1, $5, $6)`,
                    [awayId, divisionId, homeId, matchOrder, seasonId, week]
                ).catch((err) =>
                {
                    new ErrorCustom({at: `${pathRelative} leagueSeasonsDivisions.toArray().map()  Promise.all(matchesSchedule) Promise.all(weekMatches) INSERT INTO matches`, err});
                });
            })).catch((err) =>
            {
                new ErrorCustom({at: `${pathRelative} leagueSeasonsDivisions.toArray().map()  Promise.all(matchesSchedule) Promise.all(weekMatches)`, err});
            });
        })).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} leagueSeasonsDivisions.toArray().map() Promise.all(matchesSchedule)`, err});
        });
    })).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} leagueSeasonsDivisions.toArray().map()`, err});
    }).finally(() =>
    {
        process.exit();
    });
})();
