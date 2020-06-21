import * as Pg     from 'pg';
import * as dotenv from 'dotenv';

export class PgClient
{
    public static connect(): Promise<Pg.Client>
    {
        dotenv.config({path: `${__dirname}/../.env`});

        return (async () =>
        {
            const pgClient: Pg.Client = new Pg.Client({
                host: `localhost`,
                port: 5432,
                user: `postgres`,
                password: process.env.PG_PASSWORD,
                database: `fifamaniaci`
            });

            await pgClient.connect().catch((err) =>
            {
                console.error(err);
            });

            return pgClient;
        })();
    }
}
