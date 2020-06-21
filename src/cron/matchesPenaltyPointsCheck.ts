import * as cron                        from 'node-cron';
import * as path                        from 'path';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import * as Moment                      from 'moment-timezone';
import * as Pg                          from 'pg';
import {LeagueSeasonValue}              from '../modules/row/LeagueSeason';
import {DivisionValue}                  from '../modules/row/Division';
import {MatchValue}                     from '../modules/row/Match';
import {LeagueSeasons}                  from '../modules/table/LeagueSeasons';
import {DivisionsQueryResult}           from 'modules/table/Divisions';
import {MatchesQueryResult}             from 'modules/table/Matches';
import {LeagueRegistrationQueryResult}  from 'modules/row/LeagueRegistration';

module.exports = cron.schedule(`0 0 0 * * 1`, async () =>
{
    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    const playersPenaltyPoints: any = {};
    const seasonLast: LeagueSeasonValue = await new LeagueSeasons({pg}).findLast({seasonStart: {$lte: new Date()}});

    const divisionsArray: DivisionValue[] | void = await pg.query(`SELECT * FROM divisions WHERE level IS NOT NULL`).then((result: DivisionsQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    }).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} SELECT divisions`, err});
    });

    if (!divisionsArray)
    {
        return;
    }

    const divisions: { [s: string]: number } = divisionsArray.reduce((a, division) =>
    {
        a[division.id] = division.categoryId;
        return a;
    }, {});

    const matchesArray: MatchValue[] | void = await pg.query(
            `SELECT * FROM matches WHERE result_written IS NULL AND season_id = $1 AND WEEK IS NOT NULL`,
        [seasonLast.id]
    ).then((result: MatchesQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    }).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} SELECT matches`, err});
    });

    if (!matchesArray)
    {
        return;
    }

    matchesArray.filter((match) =>
    {
        return (match.resultWritten || Date.now()) >= Moment(seasonLast.seasonStart).add(match.week + 1, `w`).toDate();
    }).forEach((match) =>
    {
        [`awayId`, `homeId`].forEach((side) =>
        {
            const player = match[side];

            if (!playersPenaltyPoints[player])
            {
                playersPenaltyPoints[player] = {};
            }

            if (!playersPenaltyPoints[player][match.divisionId])
            {
                playersPenaltyPoints[player][match.divisionId] = 0;
            }

            playersPenaltyPoints[player][match.divisionId] += 1;
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
                return Tomwork.queryParse(result);
            }).catch((err) =>
            {
                new ErrorCustom({at: `${pathRelative} Promise.all(playersPenaltyPoints) Promise.all(playerDivisions) UPDATE league_registrations`, err});
            });
        })).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} Promise.all(playersPenaltyPoints) Promise.all(playerDivisions)`, err});
        });
    })).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative}`, err});
    }).finally(async () =>
    {
        process.exit();
    });
}, {timezone: `Europe/Bratislava`});
