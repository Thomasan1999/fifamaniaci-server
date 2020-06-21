import * as path                                from 'path';
import * as dotenv                              from 'dotenv';
import * as Pg                                  from 'pg';
import * as pgFormat                            from 'pg-format';
import {ErrorCustom, PgClient, Tomwork}         from '../modules';
import {UserValue}                              from '../modules/row/User';
import {WebSocketCustom, WebSocketServerCustom} from 'app';
import {UsersQueryResult}                       from '../modules/table/Users';
import {LoginSessionsQueryResult}               from 'modules/table/LoginSessions';

(async ({io}: { io?: WebSocketServerCustom } = {}) =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    const ids: number[] = [...io.clients].filter((socket: WebSocketCustom) =>
    {
        return socket.cookies && socket.cookies.value.id;
    }).map((socket: WebSocketCustom) =>
    {
        return socket.cookies.value.id;
    });

    const idsOffline: UserValue[] = await pg.query(
        pgFormat(`SELECT * FROM users WHERE id NOT IN (%s) AND online IS NOT NULL`, ids.join(`,`))
    ).then((result: UsersQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    });

    await Promise.all([
        pg.query(
            pgFormat(`UPDATE users SET online = NULL WHERE id NOT IN (%s) AND online IS NOT NULL RETURNING *`, ids.join(`,`))
        ).then((result: UsersQueryResult) =>
        {
            return Tomwork.queryParse(result);
        }),
        pg.query(
            pgFormat(`UPDATE login_sessions SET online = NULL WHERE online IS NOT NULL AND user_id IS NOT IN (%s)`, ids.join(`,`))
        ).then((result: LoginSessionsQueryResult) =>
        {
            return Tomwork.queryParse(result);
        })
    ]).then(async () =>
    {
        return idsOffline.reduce((a, {id}) =>
        {
            return a.then(async () =>
            {
                return io.emitCustom(`connectivityUpdate`, {id});
            });
        }, Promise.resolve());
    }).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} UPDATE login_sessions`, err});
    }).finally(() =>
    {
        process.exit();
    });
})();
