import * as dotenv                      from 'dotenv';
import * as Express                     from 'express';
import * as WebSocket                   from 'ws';
import * as Pg                          from 'pg';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {LeagueRegistration, User}       from '../modules/row';
import {UserValue}                      from '../modules/row/User';
import {QueryResultId}                  from 'types/pg';
import {UsersQueryResult}               from 'modules/table/Users';

module.exports = ({app, route, io}: { app: Express.Application, route: string, io: WebSocket.Server }) =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    app.post(route, async (req, res) =>
    {
        const pg: Pg.Client = await PgClient.connect();

        const categoryId: number = await pg.query(
                `SELECT * FROM categories WHERE name = 'xboxOneFut'`
        ).then((result: QueryResultId) =>
        {
            return Tomwork.queryParse(result).rows[0].id;
        });

        (await pg.query(
                `SELECT * FROM users WHERE verification_code IS NULL`
        ).then((result: UsersQueryResult) =>
        {
            return Tomwork.queryParse(result).rows;
        })).reduce((a: Promise<any>, userValue: UserValue) =>
        {
            return a.then(async () =>
            {
                const user: User = new User({io, pg, res, value: userValue});

                const leagueRegistration: LeagueRegistration = new LeagueRegistration({io, pg, res, user, value: {categoryId, userId: user.value.id}});

                await leagueRegistration.init().catch((err) =>
                {
                    new ErrorCustom({at: `${route}.post() users.reduce() LeagueRegistration.init()`, err});
                });

                return await leagueRegistration.insert().catch((err) =>
                {
                    new ErrorCustom({at: `${route}.post() users.reduce() LeagueRegistration.upsert()`, err});
                });
            });
        }, Promise.resolve()).catch((err) =>
        {
            new ErrorCustom({at: `${route}.post() users.reduce()`, err});
        });
    });
};
