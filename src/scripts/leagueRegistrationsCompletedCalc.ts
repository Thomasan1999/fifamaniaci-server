import * as path                        from 'path';
import * as dotenv                      from 'dotenv';
import * as Pg                          from 'pg';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {LeagueRegistrationsQueryResult} from 'modules/table/LeagueRegistrations';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    await Promise.all((await pg.query(
            `SELECT * FROM leagueRegistrations WHERE completed IS NULL`
    ).then((result: LeagueRegistrationsQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    })).map(async ({id, created}) =>
    {
        return await pg.query(
                `UPDATE league_registrations SET completed = $1 WHERE id = $2`,
            [created, id]
        ).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} SELECT league_registrations.rows.map() Promise.all()`, err});
        });
    })).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} SELECT league_registrations.rows.map() Promise.all()`, err});
    }).finally(() =>
    {
        process.exit();
    });
})();
