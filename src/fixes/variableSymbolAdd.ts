import * as dotenv                      from 'dotenv';
import * as Pg                          from 'pg';
import * as path                        from "path";
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {UserQueryResult, UserValue}     from '../modules/row/User';
import {UsersQueryResult}               from '../modules/table/Users';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});
    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    let c: number = 0;
    await Promise.all((await pg.query(`SELECT * FROM USERS ORDER BY id ASC`).then((result: UsersQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    })).map((user: UserValue) =>
    {
        c += 1;

        return pg.query(
                `UPDATE users SET variable_symbol = $1 WHERE id = $2 RETURNING *`,
            [user.id, c]
        ).then((result: UserQueryResult) =>
        {
            return Tomwork.queryParse(result);
        }).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} SELECT users Promise.all() UPDATE users`, err});
        });
    })).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} SELECT users Promise.all()`, err});
    });
    process.exit();
})();
