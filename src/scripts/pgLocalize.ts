import * as path               from 'path';
import {ErrorCustom, PgClient} from '../modules';
import * as bcrypt             from 'bcrypt';
import * as dotenv             from 'dotenv';
import * as Pg                 from 'pg';
import {spawn}                 from 'child_process';

(async () =>
{
    await spawn(`psql`, [`--set`, `ON_ERROR_STOP=on`, `fifamaniaci`, `c:\\users\\tomas\\webstormprojects\\fifamaniaci\\server\\backup\\fifamaniaci`], {shell: true});

    setTimeout(async () =>
    {
        dotenv.config({path: `${__dirname}/../.env`});

        const dirname: string = path.basename(__dirname);
        const filename: string = path.basename(__filename, `.js`);
        const pathRelative: string = path.join(dirname, filename);

        const pg: Pg.Client = await PgClient.connect();

        const password: string = await bcrypt.hash(`123456`, 10);

        await Promise.all([
            pg.query(
                    `UPDATE users SET email = LOWER(REPLACE(username, ' ', '_')) || '@email.com', password = $1 RETURNING *`,
                [password]
            ),
            pg.query(`DELETE FROM messages_tabs`),
            pg.query(`DELETE FROM messages WHERE addressee_id IS NOT NULL`)
        ]).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} UPDATE users`, err});
            return Promise.reject(err);
        });

        process.exit();
    }, 2500);
})();
