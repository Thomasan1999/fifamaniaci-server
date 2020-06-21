import {LeagueRegistration, User}       from '../modules/row';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import * as Express                     from 'express';
import * as Pg                          from 'pg';
import {WebSocketCustom}                from 'app';
import {QueryResultId}                  from 'types/pg';
import {UserQueryResult}                from 'modules/row/User';

(async () =>
{
    const pg: Pg.Client = await PgClient.connect();
    const route: string = `leagueRegistrations`;
    const categoryId: number = (await pg.query(`SELECT id FROM categories WHERE name = 'xboxOne'`).then((result: QueryResultId) =>
    {
        return Tomwork.queryParse(result).rows[0];
    })).id;

    const user: User = new User({
        pg,
        value: await pg.query(`SELECT * FROM users WHERE username = 'alcashlee'`).then((result: UserQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0];
        })
    });

    const leagueRegistration: LeagueRegistration = new LeagueRegistration({
        //@ts-ignore
        io: {
            emitCustom()
            {
            },
            status()
            {
            }
        } as unknown as WebSocketCustom,
        pg,
        res: {
            json()
            {

            },
            status()
            {

            }
        } as unknown as Express.Response,
        user,
        value: {
            categoryId,
            seasonId: await pg.query(`SELECT * FROM league_seasons WHERE month = 9`).then((result: QueryResultId) =>
            {
                return Tomwork.queryParse(result).rows[0].id;
            }),
            userId: user.value.id
        }
    });

    await leagueRegistration.insert().then(({rows: [{id, categoryId, userId}]}) =>
    {
        console.log(`Successful`);
    }).catch((err) =>
    {
        new ErrorCustom({at: `${route}.post() LeagueRegistration.upsert()`, err});
    });

    process.exit();
})();
