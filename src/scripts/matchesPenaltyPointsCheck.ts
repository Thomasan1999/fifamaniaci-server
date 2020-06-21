import * as path                        from 'path';
import * as dotenv                      from 'dotenv';
import * as Moment                      from 'moment-timezone';
import * as Pg                          from 'pg';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {LeagueSeasonValue}              from '../modules/row/LeagueSeason';
import {MatchValue}                     from '../modules/row/Match';
import {LeagueSeasons}                  from '../modules/table/LeagueSeasons';
import {DivisionsQueryResult}           from 'modules/table/Divisions';
import {MatchesQueryResult}             from 'modules/table/Matches';
import {LeagueRegistrationQueryResult}  from 'modules/row/LeagueRegistration';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();
    const playersPenaltyPoints: { [s: string]: { [s: string]: number } } = {};
    const divisions: { [s: string]: number } = await pg.query(`SELECT * FROM divisions WHERE level IS NOT NULL`).then((result: DivisionsQueryResult) =>
    {
        return Tomwork.queryParse(result).rows.reduce((a, division) =>
        {
            a[division.id] = division.categoryId;
            return a;
        }, {});
    });

    await Promise.all([
        pg.query(`SELECT * FROM matches WHERE week IS NOT NULL`).then((result: MatchesQueryResult) =>
        {
            return Tomwork.queryParse(result).rows;
        }),
        new LeagueSeasons({pg}).findLast({seasonStart: {$lte: new Date()}})
    ]).then(async ([matches, seasonLast]: [MatchValue[], LeagueSeasonValue]) =>
    {
        matches.filter((match: MatchValue) =>
        {
            return (match.resultWritten || Date.now()) >= Moment(seasonLast.seasonStart).add(match.week + 1, `w`).toDate();
        }).forEach((match: MatchValue) =>
        {
            const matchPenaltyPoints: number = Math.ceil(Moment(match.resultWritten || Date.now()).diff(Moment(seasonLast.seasonStart).add(match.week + 1, `w`), `w`, true));

            [`awayId`, `homeId`].forEach((side) =>
            {
                const player: number = match[side];

                if (!playersPenaltyPoints[player])
                {
                    playersPenaltyPoints[player] = {};
                }

                if (!playersPenaltyPoints[player][match.divisionId])
                {
                    playersPenaltyPoints[player][match.divisionId] = 0;
                }

                playersPenaltyPoints[player][match.divisionId] += matchPenaltyPoints;
            });
        });

        await Promise.all(Object.entries(playersPenaltyPoints).map(async ([playerId, playerDivisions]) =>
        {
            return await Promise.all(Object.entries(playerDivisions).map(async ([playerDivisionId, penaltyPoints]) =>
            {
                return await pg.query(
                        `UPDATE league_registrations SET penalty_points = $1 WHERE category_id = $2 AND canceled IS NOT TRUE AND season_id = $3 AND user_id = $4 RETURNING *`,
                    [penaltyPoints, divisions[playerDivisionId], seasonLast.id, playerId]
                ).then((result: LeagueRegistrationQueryResult) =>
                {
                    return Tomwork.queryParse(result).rows;
                }).catch((err) =>
                {
                    new ErrorCustom({at: `${pathRelative} Promise.all() Promise.all() Promise.all() UPDATE league_registrations`, err});
                });
            })).catch((err) =>
            {
                new ErrorCustom({at: `${pathRelative} Promise.all() Promise.all() Promise.all()`, err});
            });
        })).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} Promise.all() Promise.all()`, err});
        });
    }).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} Promise.all()`, err});
    }).finally(async () =>
    {
        process.exit();
    });
})();
