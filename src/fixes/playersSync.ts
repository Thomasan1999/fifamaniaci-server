import * as path                        from 'path';
import * as dotenv                      from 'dotenv';
import * as Pg                          from 'pg';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {Match}                          from '../modules/row';
import {MatchValue}                     from '../modules/row/Match';
import {LeagueTableRecordValue}         from '../modules/row/LeagueTableRecord';
import {MatchesQueryResult}             from '../modules/table/Matches';
import {PlayerValue}                    from '../modules/row/Player';
import {PlayersQueryResult}             from '../modules/table/Players';
import {LeagueTableRecordsQueryResult}  from '../modules/table/LeagueTableRecords';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    await Promise.all([
        pg.query(`SELECT matches.id, away_id, away_goals, canceled_at, canceled_by, divisions.category_id as category_id, created_by, division_id, home_id, home_goals, leg, match_order, overtime, played_at, result_written, round, season_id, series, divisions.match_type_id as type_id, week, matches.created, matches.updated FROM matches
                                    LEFT JOIN divisions ON divisions.id = matches.division_id
                                    WHERE result_written IS NOT NULL ORDER BY result_written ASC`).then((result: MatchesQueryResult) =>
        {
            return Tomwork.queryParse(result).rows;
        }),
        pg.query(
                `UPDATE players SET rating = 0, rating_previous = NULL WHERE rating != 0 RETURNING *`
        ).then((result: PlayersQueryResult) =>
        {
            return Tomwork.queryParse(result).rows;
        }),
        pg.query(
            `UPDATE league_table_records SET draws = 0, goals_against = 0, goals_for = 0, losses = 0, matches = 0, overtime_losses = 0, overtime_wins = 0, points = 0, wins = 0 RETURNING *`
        ).then((result: LeagueTableRecordsQueryResult) =>
        {
            return Tomwork.queryParse(result).rows;
        })
    ]).then(async ([matchesArray, ,]: [MatchValue[], PlayerValue[], LeagueTableRecordValue[]]) =>
    {
        await pg.query(`DELETE FROM matches WHERE result_written IS NOT NULL`).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} DELETE FROM matches Promise.all(first)`, err});
        });

        return matchesArray.reduce((a, matchValue) =>
        {
            return a.then(async () =>
            {
                const match: Match = new Match({
                    io: {
                        //@ts-ignore
                        emitCustom()
                        {
                        }
                    },
                    pg,
                    query: {auth: {id: matchValue[`${matchValue.createdBy}Id`], token: ``}},
                    syncing: true,
                    value: {...matchValue, playedAt: matchValue.playedAt.toISOString()}
                });

                return await match.upsert().catch(async (err) =>
                {
                    new ErrorCustom({at: `${pathRelative} Promise.all(first) matchesArray.reduce() Match.upsert()`, err});
                    process.exit();
                });
            });
        }, Promise.resolve()).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} Promise.all(first) matchesArray.reduce()`, err});
        });
    }).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} Promise.all(first)`, err});
    }).finally(async () =>
    {
        process.exit();
    });
})();
