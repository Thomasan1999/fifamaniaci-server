import {Table}                                            from '../../modules/table';
import {ErrorCustom, Query, Tomwork}                      from '../../modules';
import {User}                                             from '../../modules/row';
import {RouteArguments}                                   from '../../types/routes';
import * as Pg                                            from 'pg';
import * as pgFormat                                      from 'pg-format';
import * as Express                                       from 'express';
import {QueryParamsArgument, QueryProjection, QueryValue} from '../../modules/Query';
import {UserGetQueryValue, UserValue, UserGetValue}       from '../../modules/row/User';
import {VueObject, VueString}                             from '../../modules/types';
import {QueryResultId}                                    from 'types/pg';
import {QueryResult}                                      from 'pg';

module.exports = ({app, io, pg, route}: RouteArguments) =>
{
    app.get(route, async (req, res: Express.Response) =>
    {
        const params: QueryParamsArgument = {
            email: {required: false},
            fbLink: {required: false},
            username: {required: false}
            // usernamesInGamePs4: {required: false},
            // usernamesInGameXboxOne: {required: false},
            // usernamesInGamePc: {required: false}
        };

        const projection: QueryProjection = {
            admin: {value: true},
            email: {auth: true, value: true},
            fbLink: {value: true},
            id: {value: true},
            money: {auth: true, value: true},
            online: {value: true},
            username: {value: true},
            usernamesInGame: {value: true},
            variableSymbol: {auth: true, value: true}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'email' | 'fbLink' | 'username' | 'usernamesInGamePs4' | 'usernamesInGameXboxOne' | 'usernamesInGamePc'> }>

        const query: QueryThis = new Query({authRequired: false, params, projection, query: req.query, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        type TableThis = Merge<Table, { value?: Merge<Pick<UserValue, 'admin' | 'email' | 'money' | 'username' | 'variableSymbol'>, { money: number, online: number[] }>[] }>;
        const table: TableThis = new Table({
            res
        }) as TableThis;

        const user: User = new User({auth: query.auth, io, pg, res});
        const authenticated: boolean = await user.authenticate({res: false});

        const columnList: string = (() =>
        {
            const projection: { [s: string]: boolean } = authenticated ? query.projectionAuth : query.projectionAuthNot;

            return Tomwork.columnListGet(projection, {
                online: `COALESCE((SELECT DISTINCT ARRAY_AGG(category_id) FROM users_online WHERE users_online.user_id = users.id AND users.verification_code IS NULL), array[]::integer[]) as online`,
                usernamesInGame: `(SELECT array_agg(array[platforms.name, users_usernames_in_game.username]) FROM users_usernames_in_game 
INNER JOIN platforms ON users_usernames_in_game.platform_id = platforms.id
 WHERE users_usernames_in_game.user_id = users.id) AS usernames_in_game`
            });
        })();

        const querySingleFieldIs: boolean = Object.keys(query.params).some((param) =>
        {
            return query.value[param];
        });

        if (querySingleFieldIs)
        {
            const userValue: UserGetValue | null = await (async () =>
            {
                const userQuery: string = (() =>
                {
                    const userQueryKey: string = Object.keys(query.value)[0];

                    switch (userQueryKey)
                    {
                        case `email`:
                        case `username`:
                            return `LOWER(${new VueString(userQueryKey).caseSnakeTo().toString()}) = LOWER('${query.value[userQueryKey]}')`;
                        case `fbLink`:
                            return `LOWER('${query.value.fbLink.match(/[^/]+$/)[0]}') = LOWER(fb_link)`;
                        default:
                            return `${new VueString(userQueryKey).caseSnakeTo().toString()} = ${query.value[userQueryKey]}`;
                    }
                })();

                if (!userQuery)
                {
                    res.status(422).json({message: `User not found`});
                    return;
                }

                return await pg.query(pgFormat(`SELECT %s FROM users WHERE %s LIMIT 1`, columnList, userQuery)).then((result: QueryResult<UserGetQueryValue>) =>
                {
                    if (!result.rows[0])
                    {
                        return null;
                    }

                    const resultParsed = Tomwork.queryParse(result);

                    const user = resultParsed.rows[0];

                    return {
                        ...user,
                        ...(user && user.usernamesInGame && {
                            usernamesInGame: user.usernamesInGame.reduce((a, [platformName, username]) =>
                            {
                                a[platformName] = username;
                                return a;
                            }, {})
                        })
                    } as UserGetValue;
                });
            })();

            if (!userValue)
            {
                res.status(422).json({message: `User not found`});
                return;
            }

            res.json(new User({usernamesInGame: userValue.usernamesInGame, value: userValue}).valueFind);
        }
        else
        {
            table.value = await pg.query(
                pgFormat(`SELECT %s FROM users WHERE users.verification_code IS NULL`, columnList)
            ).then((result: Merge<Pg.QueryResult, { rows: UserGetQueryValue[] }>) =>
            {
                return Tomwork.queryParse(result).rows.map((row) =>
                {
                    return {
                        ...row,
                        ...(row.usernamesInGame && {
                            usernamesInGame: row.usernamesInGame.reduce((a, [platformName, username]) =>
                            {
                                a[platformName] = username;
                                return a;
                            }, {})
                        })
                    };
                });
            });

            if (!table.value)
            {
                res.status(422).json({message: `Users not found`});
                return;
            }

            table.send();
        }
    });

    app.post(route, async (req, res: Express.Response) =>
    {
        const params: QueryParamsArgument = {
            categoryId: {required: false},
            email: {},
            leagueRegistration: {required: false},
            password: {},
            username: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'categoryId' | 'email' | 'leagueRegistration' | 'password' | 'username'> }>

        const query: QueryThis = new Query({authRequired: false, params, query: req.body, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        new User({io, pg, res, value: query.value}).insert().then((user) =>
        {
            res.json(user);
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}.post()`, err});
        });
    });

    app.post(`${route}/login`, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            categoryId: {},
            email: {},
            password: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'categoryId' | 'email' | 'password'> }>

        const query: QueryThis = new Query({authRequired: false, params, query: req.body, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const user: User = new User({io, pg, query: {email: query.value.email}, req, res});

        user.login({categoryId: query.value.categoryId, password: query.value.password}).catch((err) =>
        {
            new ErrorCustom({at: `${route}/login.post()`, err});
        });
    });

    app.patch(`${route}/logout`, async (req, res: Express.Response) =>
    {
        const params: QueryParamsArgument = {};

        type QueryThis = Merge<Query, { value: {} }>

        const query: QueryThis = new Query({params, query: req.body, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        new User({auth: query.auth, io, pg, res}).logout().then(() =>
        {
            return res.status(204).end();
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}/logout.patch()`, err});
        });
    });

    app.patch(`${route}/online`, async (req, res: Express.Response) =>
    {
        const params: QueryParamsArgument = {
            categoryIdOld: {required: false},
            categoryIdNew: {required: false}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'categoryIdOld' | 'categoryIdNew'> }>

        const query: QueryThis = new Query({query: req.body, res, params}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const user: User = new User({auth: query.auth, io, pg, query: {id: query.auth.id}, req, res});

        if (!await user.authenticate({verifiedOnly: false}))
        {
            return;
        }

        await user.find().catch((err) =>
        {
            new ErrorCustom({at: `${route}/online.patch()`, err});
        });

        const {categoryIdOld, categoryIdNew} = query.value;

        await Promise.all([
            ...((categoryIdOld && categoryIdOld !== categoryIdNew) ? [user.connectivitySet({categoryId: categoryIdOld, connectivity: `offline`})] : []),
            ...((categoryIdNew) ? [user.connectivitySet({categoryId: categoryIdNew, connectivity: `online`})] : [])
        ]).then(async () =>
        {
            res.status(204).end();
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}/online.patch()`, err});
        });
    });

    app.post(`${route}/passwordReset`, async (req, res: Express.Response) =>
    {
        const params: QueryParamsArgument = {
            email: {},
            passwordNew: {},
            passwordResetToken: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'email' | 'passwordNew' | 'passwordResetToken'> }>

        const query: QueryThis = new Query({authRequired: false, params, query: req.body, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const {email, passwordNew: password, passwordResetToken} = query.value;

        new User({io, pg, res, query: {email}}).passwordReset({password, passwordResetToken}).then(() =>
        {
            res.status(204).end();
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}/passwordReset.post()`, err});
        });
    });

    app.post(`${route}/passwordResetEmail`, async (req, res: Express.Response) =>
    {
        const params: QueryParamsArgument = {
            email: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'email'> }>

        const query: QueryThis = new Query({authRequired: false, params, query: req.body, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        new User({io, pg, res, query: {email: query.value.email}}).passwordResetEmailSend().then(() =>
        {
            res.status(204).end();
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}/passwordResetEmail.post()`, err});
        });
    });

    app.patch(`${route}/propsUpdate`, async (req, res: Express.Response) =>
    {
        const params: QueryParamsArgument = {
            email: {required: false},
            fbLink: {required: false},
            passwordCurrent: {},
            passwordNew: {required: false},
            usernamesInGamePs: {required: false},
            usernamesInGameXbox: {required: false},
            usernamesInGamePc: {required: false}
        };

        type QueryThis = Merge<Query, { value: Merge<Pick<QueryValue, 'email' | 'passwordCurrent' | 'passwordNew' | 'usernamesInGamePs4' | 'usernamesInGameXboxOne' | 'usernamesInGamePc'>, { passwordCurrent: string }> }>

        const query: QueryThis = new Query({params, query: req.body, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const user: User = new User({auth: query.auth, io, pg, res});

        if (!await user.authenticate())
        {
            return;
        }

        user.update({propsNew: query.value}).then(() =>
        {
            res.status(204).end();
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}/propsUpdate.patch()`, err});
        });
    });

    app.get(`${route}/verify`, async (req, res: Express.Response) =>
    {
        const params: QueryParamsArgument = {
            verificationCode: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'verificationCode'> }>

        const query: QueryThis = new Query({authRequired: false, params, query: req.query, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const hostname: string = process.env.FM_HOSTNAME === `localhost` ? `127.0.0.1:8080` : process.env.FM_HOSTNAME;

        new User({io, pg, res, query: {verificationCode: query.value.verificationCode}}).verify().then(() =>
        {
            res.redirect(307, `https://${hostname}?verified=true`);
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}/verify.get()`, err});
            res.redirect(307, `https://${hostname}?verified=false`);
        });
    });

    app.get(`${route}/retrieveId`, async (req, res: Express.Response) =>
    {
        if (typeof req.query._id !== `string` || req.query._id.length !== 24)
        {
            res.status(400).json({message: `Invalid input format`});
            return;
        }

        const id: number = await pg.query(
                `SELECT users.id FROM users INNER JOIN users_objectids ON users.username = users_objectids.username AND users_objectids.objectid = $1`,
            [req.query._id]
        ).then((result: QueryResultId) =>
        {
            const resultParsed = Tomwork.queryParse(result);

            if (!resultParsed.rows[0].id)
            {
                return -1;
            }

            return resultParsed.rows[0].id;
        });

        if (id === -1)
        {
            res.status(400).json({message: `User not found`});
            return;
        }

        res.json({id});
    });
};
