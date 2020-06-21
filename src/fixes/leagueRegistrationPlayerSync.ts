import * as dotenv                      from 'dotenv';
import * as Pg                          from 'pg';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {Player}                         from '../modules/row';
import {LeagueRegistrationValue}        from '../modules/row/LeagueRegistration';
import * as path                        from 'path';
import {LeagueRegistrationsQueryResult} from 'modules/table/LeagueRegistrations';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    const leagueRegistrationsArray: LeagueRegistrationValue[] = await pg.query(`SELECT * FROM league_registrations`).then((result: LeagueRegistrationsQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    });

    await Promise.all(leagueRegistrationsArray.map(async ({categoryId, userId}) =>
    {
        const player = new Player({
            //@ts-ignore
            io: {
                emitCustom()
                {
                }
            },
            pg,
            value: {
                categoryId,
                userId
            }
        });

        return await player.init().then(async () =>
        {
            return await player.upsert().then(async () =>
            {
            }).catch((err) =>
            {
                new ErrorCustom({at: `${pathRelative} Player.init() Player.upsert()`, err});
            });
        }).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} Player.init()`, err});
        });
    })).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} Promise.all()`, err});
    }).finally(() =>
    {
        process.exit();
    });
})();
