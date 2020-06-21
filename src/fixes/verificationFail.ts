import * as path                               from 'path';
import * as dotenv                             from 'dotenv';
import * as bcrypt                             from 'bcrypt';
import * as Pg                                 from 'pg';
import {/*UserQueryResult,*/ UserValue}        from '../modules/row/User';
import {ErrorCustom, PgClient, Token, Tomwork} from '../modules';
import {UsersQueryResult}                      from '../modules/table/Users';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    process.env.FM_HOSTNAME = `fifamaniaci.app`;

    const pg: Pg.Client = await PgClient.connect();

    const users: UserValue[] = await pg.query(`SELECT * FROM USERS where id = 5 AND verification_code IS NOT NULL`).then((result: UsersQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    });

    await Promise.all(users.map(async ({id, email, username}: UserValue) =>
    {
        const verificationCode: string = new Token(10).value;

        const verificationCodeHash: string = await bcrypt.hash(verificationCode, 10);

        return await pg.query(
                `UPDATE users SET verification_code = $1 WHERE id = $2 RETURNING *`,
            [id, verificationCodeHash]
        ).then(async (/*result: UserQueryResult*/) =>
        {
            return await require(`../routes/mail/verify`)({email, username, verificationCode}).catch((err) =>
            {
                new ErrorCustom({at: `${pathRelative} mail/verify Mail.send()`, err});
            });
        }).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} UPDATE users`, err});
        });
    })).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} Promise.all()`, err});
    }).finally(() =>
    {
        process.exit();
    });
})();
