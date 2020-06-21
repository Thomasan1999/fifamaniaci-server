import * as path                                  from 'path';
import * as dotenv                                from 'dotenv';
import * as Pg                                    from 'pg';
import {ErrorCustom, PgClient, Tomwork}           from '../modules';
import {DivisionQueryResult, DivisionValue}       from '../modules/row/Division';
import {LeagueSeasonValue}                        from '../modules/row/LeagueSeason';
import {LeagueTableRecordsQueryResult}            from '../modules/table/LeagueTableRecords';
import {MatchesTypeQueryResult, MatchesTypeValue} from '../modules/row/MatchesType';
import {MatchesPlayOff}                           from '../modules/table/MatchesPlayOff';
import {MatchValue}                               from '../modules/row/Match';
import {LeagueFinalPositions}                     from '../modules/table/LeagueFinalPositions';
import {LeagueSeasonsQueryResult}                 from '../modules/table/LeagueSeasons';
import {DivisionsQueryResult}                     from '../modules/table/Divisions';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    const leagueSeasons: LeagueSeasonValue[] = await pg.query(
            `SELECT * FROM league_seasons WHERE season_start < CURRENT_TIMESTAMP`
    ).then((result: LeagueSeasonsQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    });

    const matchTypeLeague: MatchesTypeValue = await pg.query(
            `SELECT * FROM match_types WHERE name = 'league'`
    ).then((result: MatchesTypeQueryResult) =>
    {
        return Tomwork.queryParse(result).rows[0];
    });

    const matchTypePlayOff: MatchesTypeValue = await pg.query(
            `SELECT * FROM match_types WHERE name = 'playOff'`
    ).then((result: MatchesTypeQueryResult) =>
    {
        return Tomwork.queryParse(result).rows[0];
    });

    await Promise.all(leagueSeasons.map(async ({id: seasonId}) =>
    {
        const divisions: DivisionValue[] = await pg.query(
                `SELECT * FROM divisions WHERE match_type_id = $1 AND index = 0 AND level = 0`,
            [matchTypeLeague.id]
        ).then((result: DivisionsQueryResult) =>
        {
            return Tomwork.queryParse(result).rows;
        });

        return await Promise.all(divisions.map(async (divisionLeague) =>
        {
            const divisionPlayOff: DivisionValue = await pg.query(
                    `SELECT * FROM divisions WHERE category_id = $1 AND match_type_id = $2 AND index = 0 AND level = 0`,
                [divisionLeague.categoryId, matchTypePlayOff.id]
            ).then((result: DivisionQueryResult) =>
            {
                return Tomwork.queryParse(result).rows[0];
            });

            if (!divisionPlayOff)
            {
                return;
            }

            const matchesPlayOff: MatchesPlayOff = new MatchesPlayOff({divisionLeague, divisionPlayOff, pg, seasonId});

            await matchesPlayOff.init();

            if (matchesPlayOff.value.length === 0)
            {
                return;
            }

            const final: MatchValue[] = matchesPlayOff.value.filter((match) =>
            {
                return match.round === 0 && match.series === 0;
            });

            const firstId: void | number = matchesPlayOff.seriesWinnerGet(final);

            if (!firstId)
            {
                return;
            }

            const leagueFinalPositions: LeagueFinalPositions = new LeagueFinalPositions({categoryId: divisionLeague.categoryId, pg, seasonId});

            await Promise.all([
                leagueFinalPositions.insertOne({position: 1, userId: firstId}),
                leagueFinalPositions.insertOne({position: 2, userId: firstId === final[0].homeId ? final[0].awayId : final[0].homeId})
            ]);

            return await Promise.all(
                (await pg.query(
                        `SELECT league_table_records.* FROM league_table_records
                              INNER JOIN divisions ON divisions.id = league_table_records.division_id
                              INNER JOIN league_registrations ON league_registrations.category_id = divisions.category_id AND league_registrations.dnf_after_weeks IS NULL AND league_registrations.season_id = league_table_records.season_id AND league_registrations.user_id = league_table_records.user_id
                              INNER JOIN league_seasons ON league_seasons.id = league_table_records.season_id
                              LEFT JOIN league_final_positions ON league_final_positions.category_id = divisions.category_id AND league_final_positions.season_id = league_table_records.season_id AND league_final_positions.user_id = league_table_records.user_id
                              WHERE division_id = $1 and league_table_records.season_id = $2 
                              ORDER BY COALESCE(league_registrations.dnf_after_weeks, 100000) DESC, 
                              CASE WHEN league_registrations.dnf_after_weeks IS NOT NULL AND league_registrations.completed > league_seasons.season_start THEN league_registrations.completed END ASC, 
                              CASE WHEN league_registrations.dnf_after_weeks IS NOT NULL THEN COALESCE(league_final_positions.position, 100000) END ASC, 
                              CASE WHEN league_registrations.dnf_after_weeks IS NOT NULL THEN league_registrations.rating END DESC,
                              points DESC, goals_for - goals_against DESC, goals_for DESC`,
                    [divisionLeague.id, seasonId]
                ).then((result: LeagueTableRecordsQueryResult) =>
                {
                    return Tomwork.queryParse(result).rows;
                })).filter((leagueTableRecord) =>
                {
                    return leagueTableRecord.userId !== final[0].homeId && leagueTableRecord.userId !== final[0].awayId;
                }).map(async ({userId}, position) =>
                {
                    return await leagueFinalPositions.insertOne({
                        position: position + 2 + 1,
                        userId
                    }).catch((err) =>
                    {
                        new ErrorCustom({at: `${pathRelative} LeagueFinalPositions.find().map()`, err});
                    });
                })).catch((err) =>
            {
                new ErrorCustom({at: `${pathRelative} LeagueFinalPositions.find().map() Promise.all()`, err});
            });
        }));
    }));

    process.exit();
})();
