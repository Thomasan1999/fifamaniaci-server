import * as path                        from 'path';
import * as dotenv                      from 'dotenv';
import * as Pg                          from 'pg';
import * as Moment                      from 'moment-timezone';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {MatchValue}                     from '../modules/row/Match';
import {MatchesQueryResult}             from 'modules/table/Matches';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    const matchesArray: MatchValue[] = await pg.query(`SELECT * FROM matches WHERE result_written IS NOT NULL`).then((result: MatchesQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    });

    matchesArray.pop();

    await matchesArray.reduce((a, match) =>
    {
        return a.then(async () =>
        {
            return await pg.query(
                    `UPDATE matches SET played_at = $1 WHERE id = $2 RETURNING *`,
                [match.id, Moment(match.playedAt).add(1, `d`).toDate()]
            ).then((result: MatchesQueryResult) =>
            {
                return Tomwork.queryParse(result).rows;
            }).catch((err) =>
            {
                new ErrorCustom({at: `${pathRelative} matchesArray.reduce() UPDATE matches`, err});
            });
        });
    }, Promise.resolve()).catch(async (err) =>
    {
        new ErrorCustom({at: `${pathRelative} Promise.all()`, err});
    }).finally(() =>
    {
        process.exit();
    });
})();
