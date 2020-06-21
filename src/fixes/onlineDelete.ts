import * as path               from 'path';
import * as dotenv             from 'dotenv';
import * as Pg                 from 'pg';
import {ErrorCustom, PgClient} from '../modules';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    await Promise.all([
        pg.query(`UPDATE login_sessions SET session_to = CURRENT_TIMESTAMP WHERE session_to IS NULL RETURNING *`),
        pg.query(`UPDATE users SET online = NULL WHERE online IS NOT NULL`)
    ]).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} Promise.all()`, err});
    }).finally(() =>
    {
        process.exit();
    });
})();
