import * as Express                                                  from 'express';
import * as WebSocket                                                from 'ws';
import * as bcrypt                                                   from 'bcrypt';
import * as Pg                                                       from 'pg';
import * as pgFormat                                                 from 'pg-format';
import {ErrorCustom, Token, Tomwork}                                 from '..';
import {Row}                                                         from './Row';
import {LeagueRegistration, LeagueTableRecord, LoginSession, Player} from '.';
import {VueObject, VueString}                                        from '../types';
import {LeagueTableRecordValue}                                      from './LeagueTableRecord';
import {LeagueRegistrationValue}                                     from './LeagueRegistration';
import {PlayerValue}                                                 from './Player';
import {CategoryValue}                          from './Category';
import {UserOnlineQueryResult, UserOnlineValue} from './UserOnline';
import {QueryAuth}                              from '../Query';
import {RowValue}                               from './Row';
import {UserUsernameInGame}                     from './UserUsernameInGame';
import {PlatformName}                           from './Platform';
import {WebSocketCustom}                        from 'app';
import {LeagueTableRecordsQueryResult}          from '../table/LeagueTableRecords';
import {CategoriesQueryResult}                  from '../table/Categories';
import {UsersOnlineQueryResult}                 from '../table/UsersOnline';
import {LeagueRegistrationsQueryResult}         from '../table/LeagueRegistrations';
import {PlayersQueryResult}                     from 'modules/table/Players';

export type UserValue = Merge<RowValue, {
    admin?: boolean;
    email: string;
    fbLink: string;
    money: number;
    password: string;
    passwordResetToken?: string;
    username: string;
    variableSymbol: number;
    verificationCode?: string;
}>

export type UserValueFind = {
    id?: number,
    admin?: boolean,
    email?: string,
    fbLink?: string,
    money?: number,
    username?: string,
    variableSymbol?: number,
    verified?: boolean
}

export type UserValueLogin = {
    id: number,
    admin?: boolean,
    email: string,
    fbLink?: string,
    money: number,
    token: string,
    username: string,
    variableSymbol: number,
    verified: boolean
}

export type UserQuery = {
    id?: number;
    email?: string;
    username?: string;
    verificationCode?: string;
}

export type UserGetQueryValue = Merge<UserValue, { online: number[], usernamesInGame: ['ps4' | 'xbox' | 'pc', string][] }>;
export type UserGetValue = Merge<UserValue, { online: number[], usernamesInGame: UserUsernamesInGame }>;
export type UserQueryResult = Merge<Pg.QueryResult, { rows: [UserValue] }>

export type UserValueArgument = Merge<Partial<UserValue>, { categoryId?: number, leagueRegistration?: boolean }>

export type UserUsernamesInGame = { [k in PlatformName]: string }[];

export class User extends Row
{
    public categoryId?: number;
    public leagueRegistration?: LeagueRegistration;
    public leagueRegistrationIncluded?: boolean;
    public tokenPlain: string;
    public usernamesInGame?: UserUsernamesInGame;
    public value: UserValue;

    constructor({auth, io, pg, query, req, res, usernamesInGame, value}: { auth?: QueryAuth, io?: WebSocket.Server, pg?: Pg.Client, query?: UserQuery, req?: Express.Request, res?: Express.Response, usernamesInGame?: UserUsernamesInGame, value?: UserValueArgument })
    {
        super({io, pg, query, req, res});
        const valueClone: UserValueArgument = Tomwork.clone(value) || {};
        this.categoryId = valueClone.categoryId;
        delete valueClone.categoryId;
        this.leagueRegistrationIncluded = valueClone.leagueRegistration;
        delete valueClone.leagueRegistration;
        this.usernamesInGame = usernamesInGame;

        if (auth)
        {
            valueClone.id = auth.id;
            this.tokenPlain = auth.token;
        }

        this.value = valueClone as UserValue;
    }

    public async authenticate({res = true, verifiedOnly = true}: { res?: boolean, verifiedOnly?: boolean } = {}): Promise<boolean>
    {
        const loginSession: LoginSession = new LoginSession({...this, tokenPlain: this.tokenPlain, value: {...this.value, ...this.query}});

        if (!loginSession.user.id || !loginSession.tokenPlain)
        {
            return Promise.resolve(false);
        }

        return await loginSession.find({res, verifiedOnly}).then(async () =>
        {
            return await this.pg.query(
                `SELECT * FROM users WHERE id = $1`,
                [loginSession.value.userId]
            ).then((result: UserQueryResult) =>
            {
                const resultParsed = Tomwork.queryParse(result);

                const value: UserValue = resultParsed.rows[0];
                this.value = {...value, ...this.value};
                return Promise.resolve(Boolean(value));
            }).catch((err) =>
            {
                new ErrorCustom({at: `User.authenticate() LoginSession.find() SELECT * FROM USERS`, err});
                return Promise.resolve(false);
            });
        }).catch(async (err) =>
        {
            new ErrorCustom({at: `User.authenticate() LoginSession.find() SELECT * FROM USERS`, err});
            return Promise.resolve(false);
        });
    }

    public async connectivityCheck(): Promise<void>
    {
        const socketsLogout: WebSocketCustom[] = [...this.io.clients].filter((socket: WebSocketCustom) =>
        {
            return this.value.id === socket.cookies.value.id && this.tokenPlain === socket.cookies.value.token;
        }) as WebSocketCustom[];

        const categoryIdsLogout: number[] = [...new Set(socketsLogout.map((socket) =>
        {
            return socket.cookies.value.categoriesActive;
        }))];

        socketsLogout.forEach((socket) =>
        {
            socket.emitCustom(`logout`);
            socket.cookies.userPropsDelete();
        });

        return await categoryIdsLogout.reduce(async (a: Promise<any>, categoryId: number) =>
        {
            return a.then(async () =>
            {
                return await this.connectivitySet({categoryId, connectivity: `offline`}).catch((err) =>
                {
                    new ErrorCustom({at: `User.logout() User.connectivitySet() Set.forEach()`, err});
                    return Promise.reject(err);
                });
            });
        }, Promise.resolve());
    }

    public async connectivitySet({categoryId = this.categoryId, connectivity}: {
        categoryId?: number,
        connectivity: 'online' | 'offline'
    }): Promise<Merge<Pg.QueryResult, { rows: [UserOnlineValue] }> | void>
    {
        if (connectivity === `online`)
        {
            if (!this.value.verificationCode)
            {
                this.io.emitCustom(`connectivityUpdate`, {id: this.value.id, categoryId, connectivity});
            }

            return await this.pg.query(
                    `INSERT INTO users_online(category_id, user_id) VALUES($1, $2) ON CONFLICT (category_id, user_id) DO NOTHING RETURNING *`,
                [categoryId, this.value.id]
            ).then((result: UserOnlineQueryResult) =>
            {
                if (!result.rowCount)
                {
                    return;
                }

                return Promise.resolve(result);
            }).catch((err) =>
            {
                new ErrorCustom({at: `User.connectivitySet() online`, err});
                return Promise.reject(err);
            });
        }

        const onlineIs: boolean = [...this.io.clients].filter((socket) =>
        {
            return socket.cookies && this.value.id === socket.cookies.value.id && socket.cookies.value.categoriesActive === categoryId;
        }).length >= 1;

        if (onlineIs)
        {
            return;
        }

        this.io.emitCustom(`connectivityUpdate`, {id: this.value.id, categoryId, connectivity});

        return await this.pg.query(
                `DELETE FROM users_online WHERE category_id = $1 AND user_id = $2 RETURNING *`,
            [categoryId, this.value.id]
        ).then((result: UserOnlineQueryResult) =>
        {
            return Promise.resolve(result);
        }).catch((err) =>
        {
            new ErrorCustom({at: `User.connectivitySet() offline`, err});
            return Promise.reject(err);
        });
    }

    public async find(): Promise<UserValue>
    {
        const foundUser: UserValue = await this.pg.query(pgFormat(`SELECT * FROM users WHERE %s`, Object.entries(this.query).map(([paramName, param]) =>
        {
            if ([`email`, `username`].includes(paramName))
            {
                return pgFormat(`LOWER(${paramName}) LIKE LOWER(${typeof param === `string` ? `'${param}'` : param})`);
            }

            return `${paramName} = ${typeof param === `string` ? `'${param}'` : param}`;
        }).join(` AND `))).then((result: UserQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0];
        });

        if (foundUser)
        {
            this.value = {...this.value, ...foundUser};
            return Promise.resolve(this.value);
        }

        this.error({message: `User not found`, status: 422});
        return Promise.reject(`User not found`);
    }

    public async insert(): Promise<UserValueLogin>
    {
        this.value.verificationCode = new Token(10).value;

        return await this.pg.query(
                `INSERT INTO users(email, money, password, username, variable_symbol, verification_code) VALUES($1, 0, $2, $3,  (SELECT MAX(id) + 1 FROM users), $4) RETURNING *`,
            [this.value.email, await bcrypt.hash(this.value.password, 10), this.value.username.trim(), await bcrypt.hash(this.value.verificationCode, 10)]
        ).then(async (result: UserQueryResult) =>
        {
            if (!result.rowCount)
            {
                this.error({message: `Username or email taken`, status: 409});
                return Promise.reject(`Username or email taken`);
            }

            const user: UserValue = result.rows[0];

            require(`../../routes/mail/verify`)({...user, verificationCode: this.value.verificationCode});
            this.value.id = user.id;
            const loginSession: LoginSession = new LoginSession(this);

            await loginSession.insert();

            this.tokenPlain = loginSession.tokenPlain;
            this.value = {...user, ...this.value};

            if (this.leagueRegistrationIncluded)
            {
                const {categoryId, io, pg} = this;

                this.leagueRegistration = new LeagueRegistration({io, pg, user: this, value: {categoryId, userId: this.value.id, valid: false}});

                await this.leagueRegistration.init().catch((err) =>
                {
                    new ErrorCustom({at: `users.post() User.insert() LeagueRegistration.init()`, err});
                });

                this.leagueRegistration.insert().catch((err) =>
                {
                    new ErrorCustom({at: `users.post() User.insert() LeagueRegistration.upsert()`, err});
                });
            }

            return Promise.resolve(this.valueLogin);
        }).catch((err) =>
        {
            new ErrorCustom({at: `User.insert()`, err});
            return Promise.reject(err);
        });
    }

    public async login({categoryId, password}: { categoryId: number, password: string }): Promise<any>
    {
        await this.find().catch((err) =>
        {
            new ErrorCustom({at: `User.login() User.find()`, err});
            return Promise.reject(err);
        });

        await this.passwordCheck(password).catch((err) =>
        {
            new ErrorCustom({at: `User.login() User.passwordCheck()`, err});
            return Promise.reject(err);
        });

        const loginSession: LoginSession = new LoginSession(this);

        await loginSession.insert().catch((err) =>
        {
            new ErrorCustom({at: `User.login() LoginSession.insert()`, err});
            return Promise.reject(err);
        });

        this.tokenPlain = loginSession.tokenPlain;
        this.res.json(this.valueLogin);

        return await this.connectivitySet({
            categoryId: categoryId || this.req.cookies.categoryId,
            connectivity: `online`
        });
    }

    public async logout(): Promise<void>
    {
        return await new LoginSession(this).end().then(async () =>
        {
            return await this.connectivityCheck().catch((err) =>
            {
                new ErrorCustom({at: `User.logout() LoginSession.end() User.connectivityCheck()`, err});
            });
        }).catch((err) =>
        {
            new ErrorCustom({at: `User.logout() LoginSession.end()`, err});
            return Promise.reject(err);
        });
    }

    public async passwordCheck(password: string): Promise<boolean>
    {
        if (!this.value.password)
        {
            this.error({message: `Undefined password`, status: 400});
            return Promise.reject(`Undefined password`);
        }

        const validPassword: boolean = await bcrypt.compare(password, this.value.password);

        if (!validPassword)
        {
            this.error({message: `Incorrect password`, status: 422});
            return Promise.reject(`Incorrect password`);
        }

        return Promise.resolve(validPassword);
    }

    public async passwordReset({password, passwordResetToken}: { password: string, passwordResetToken: string }): Promise<boolean | UserQueryResult>
    {
        return await this.find().then(async () =>
        {
            const tokenValid: boolean = await bcrypt.compare(passwordResetToken, this.value.passwordResetToken).catch((err) =>
            {
                new ErrorCustom({at: `User.passwordReset() User.find() bcrypt.compare()`, err});
                this.error({message: `Password reset token invalid`, status: 422});
                return Promise.reject(`Password reset token invalid`);
            });

            if (!tokenValid)
            {
                return tokenValid;
            }

            return await this.pg.query(
                    `UPDATE users SET password = $1, password_reset_token = NULL WHERE id = $1`,
                [await bcrypt.hash(password, 10)]
            ).then((result: UserQueryResult) =>
            {
                return Tomwork.queryParse(result);
            }).catch((err) =>
            {
                new ErrorCustom({at: `User.passwordReset() User.find() users.findOneAndUpdate()`, err});
                this.error({message: `User not found`, status: 422});
                return Promise.reject(`User not found`);
            });
        }).catch((err) =>
        {
            new ErrorCustom({at: `User.passwordReset() User.find()`, err});
            this.error({message: err, status: 422});
            return Promise.reject(err);
        });
    }

    public async passwordResetEmailSend(): Promise<string>
    {
        const passwordResetToken: string = new Token().value;
        const passwordResetTokenHash: string = await bcrypt.hash(passwordResetToken, 10);

        return await this.pg.query(
                `UPDATE users SET password_reset_token = $2 WHERE email = $1`,
            [this.query.email, passwordResetTokenHash]
        ).then((result: UserQueryResult) =>
        {
            const resultParsed = Tomwork.queryParse(result);

            this.value = resultParsed.rows[0];

            const {email, username} = this.value;

            require(`../../routes/mail/passwordReset`)({email, passwordResetToken, username});

            return Promise.resolve(passwordResetToken);
        }).catch((err) =>
        {
            new ErrorCustom({at: `User.passwordResetEmailSend()`, err});
            this.error({message: `Email not found`, status: 422});
            return Promise.reject(err);
        });
    }

    public get sockets(): WebSocketCustom[]
    {
        return [...this.io.clients].filter((socket) =>
        {
            return this.value.id === socket.cookies.value.id && socket.cookies.value.token && socket.cookies.value.token.length === 64;
        });
    }

    public async update({propsNew}: { propsNew: { email?: string, fbLink?: string, passwordCurrent: string, passwordNew?: string, usernamesInGamePs?: string, usernamesInGameXbox?: string, usernamesInGamePc?: string } }): Promise<any>
    {
        if (Tomwork.emptyIs(propsNew))
        {
            const err: string = `Empty query string`;

            new ErrorCustom({at: `User.update()`, err});
            this.error({message: err, status: 422});
            return Promise.reject(err);
        }

        if (!await this.passwordCheck(propsNew.passwordCurrent))
        {
            const err: string = `Incorrect password`;

            new ErrorCustom({at: `User.update()`, err});
            this.error({message: err, status: 422});
            return Promise.reject(err);
        }

        const promises: any[] = [];

        if (propsNew.email || propsNew.fbLink || propsNew.passwordNew)
        {
            promises.push(this.pg.query(
                pgFormat(`UPDATE users SET %s WHERE id = $1 RETURNING *`,
                    Tomwork.updateSetGet({
                        ...(propsNew.email && {email: propsNew.email}),
                        ...(propsNew.fbLink && {fbLink: propsNew.fbLink.match(/[^/]+$/)[0]}),
                        ...(propsNew.passwordNew && {password: await bcrypt.hash(propsNew.passwordNew, 10)})
                    })),
                    [this.value.id]
            ).then(async (userData: UserQueryResult) =>
            {
                const resultParsed: UserQueryResult = Tomwork.queryParse(userData);
                const valueOld: UserValue = Tomwork.clone(this.value);

                this.value = resultParsed.rows[0];

                if (propsNew.email && propsNew.email !== valueOld.email)
                {
                    await this.pg.query(
                            `INSERT INTO users_emails(email, user_id) VALUES($1, $2)`,
                        [valueOld.email, this.value.id]
                    ).catch((err) =>
                    {
                        new ErrorCustom({at: `User.update() UPDATE users INSERT INTO users_emails`, err});
                        this.error({message: err, status: 422});
                        return Promise.reject(err);
                    });
                }

                if (propsNew.fbLink && propsNew.fbLink !== valueOld.fbLink && valueOld.fbLink)
                {
                    await this.pg.query(
                            `INSERT INTO users_fb_links(fb_link, user_id) VALUES($1, $2)`,
                        [valueOld.fbLink, this.value.id]
                    ).catch((err) =>
                    {
                        new ErrorCustom({at: `User.update() UPDATE users INSERT INTO users_fb_links`, err});
                        this.error({message: err, status: 422});
                        return Promise.reject(err);
                    });
                }

                this.sockets.map((socket) =>
                {
                    socket.emitCustom(`userPropsUpdate`, {
                        props: {
                            email: this.value.email,
                            ...(this.value.fbLink && {fbLink: this.value.fbLink})
                        }
                    });
                });

                return Promise.resolve(resultParsed);
            }).catch((err) =>
            {
                new ErrorCustom({at: `User.update() UPDATE users`, err});
                return Promise.reject(err);
            }));
        }

        if (Object.keys(propsNew).some((propName) =>
        {
            return propName.includes(`usernamesInGame`);
        }))
        {
            const {io, pg, res} = this;

            await Promise.all(Object.entries(propsNew).filter(([propName, prop]) =>
            {
                return propName.includes(`usernamesInGame`) && prop;
            }).map(async ([propName, username]) =>
            {
                const platformName: PlatformName = new VueString(propName.replace(`usernamesInGame`, ``)).decapitalize().toString() as PlatformName;

                const usersUsernameInGame: UserUsernameInGame = new UserUsernameInGame({
                    io,
                    platformName,
                    pg,
                    res,
                    value: {userId: this.value.id, username}
                });

                promises.push(usersUsernameInGame.insert());
            }));
        }

        await Promise.all(promises).catch((err) =>
        {
            new ErrorCustom({at: `User.update()`, err});
            this.error({message: err, status: 422});
            return Promise.reject(err);
        });
    }

    public get valueFind(): UserValueFind
    {
        return (({id, admin, email, fbLink, money, username, variableSymbol}) =>
        {
            return {
                id,
                ...(admin && {admin}),
                email,
                ...(fbLink && {fbLink}),
                money,
                username,
                usernamesInGame: this.usernamesInGame,
                variableSymbol,
                verified: !this.value.verificationCode
            };
        })(this.value);
    }

    public get valueLogin(): UserValueLogin
    {
        return (({id, admin, email, fbLink, money, username, variableSymbol}) =>
        {
            return {
                id,
                ...(admin && {admin}),
                email,
                ...(fbLink && {fbLink}),
                money: parseFloat(money.toString()),
                token: this.tokenPlain,
                username,
                variableSymbol,
                verified: !this.value.verificationCode
            };
        })(this.value);
    }

    public async verify(): Promise<string>
    {
        const usersNotVerified: Pick<UserValue, 'id' | 'email' | 'username' | 'verificationCode'>[] = await this.pg.query(
                `SELECT id, email, username, verification_code FROM users WHERE verification_code IS NOT NULL ORDER BY id DESC`
        ).then((result: Merge<Pg.QueryResult, { rows: Pick<UserValue, 'id' | 'email' | 'username' | 'verificationCode'>[] }>) =>
        {
            return Tomwork.queryParse(result).rows;
        });

        return await usersNotVerified.reduce(async (a: Promise<any>, user) =>
        {
            return a.then(async () =>
            {
                if (await bcrypt.compare(this.query.verificationCode, user.verificationCode))
                {
                    const userId: number = user.id;

                    this.pg.query(
                            `UPDATE users SET verification_code = NULL WHERE id = $1`,
                        [userId]
                    ).catch((err) =>
                    {
                        new ErrorCustom({at: `User.verify() UPDATE users SET verification_code = NULL`, err});
                    });

                    await this.pg.query(
                            `UPDATE league_registrations SET completed = CURRENT_TIMESTAMP WHERE id = $1`,
                        [userId]
                    ).catch((err) =>
                    {
                        new ErrorCustom({at: `User.verify() UPDATE league_registrations SET completed = CURRENT_TIMESTAMP`, err});
                    });

                    const leagueTableRecordsRows: LeagueTableRecordValue[] | void = await this.pg.query(
                            `SELECT * FROM league_table_records WHERE id = $1`,
                        [userId]
                    ).then((result: LeagueTableRecordsQueryResult) =>
                    {
                        return Tomwork.queryParse(result).rows;
                    }).catch((err) =>
                    {
                        new ErrorCustom({at: `User.verify() SELECT * FROM league_table_records`, err});
                        throw new Error(`User.verify() SELECT * FROM league_table_records`);
                    });

                    if (!leagueTableRecordsRows)
                    {
                        return leagueTableRecordsRows;
                    }

                    await leagueTableRecordsRows.reduce((a, leagueTableRecord) =>
                    {
                        return a.then(async () =>
                        {
                            return await new LeagueTableRecord({io: this.io, pg: this.pg, value: leagueTableRecord}).validate().catch((err) =>
                            {
                                new ErrorCustom({at: `User.verify() leagueTableRecordsFields.reduce() LeagueTableRecords.validate()`, err});
                                throw new Error(`User.verify() SELECT * FROM league_table_records`);
                            });
                        });
                    }, Promise.resolve()).catch((err) =>
                    {
                        new ErrorCustom({at: `User.verify() leagueTableRecordsFields.reduce()`, err});
                    });

                    const output: {
                        leagueRegistrations?: { [s: string]: { [s: string]: LeagueRegistrationValue } }
                        leagueTableRecords?: { [s: string]: { [s: string]: LeagueTableRecordValue } }
                        players?: { [s: string]: { [s: string]: PlayerValue } }
                    } = {};

                    output.players = (await this.pg.query(
                            `SELECT * FROM players WHERE user_id = $1`,
                        [userId]
                    ).then((result: PlayersQueryResult) =>
                    {
                        return Tomwork.queryParse(result);
                    }) as PlayerValue[]).reduce((a, player) =>
                    {
                        if (!a[player.categoryId])
                        {
                            a[player.categoryId] = {};
                        }

                        a[player.categoryId] = {...a[player.categoryId], ...new Row({value: new Player({value: player}).valuePublic}).valueIndexed};

                        return a;
                    }, {});


                    output.leagueTableRecords = (await this.pg.query(
                            `SELECT league_table_records.id, division_id, draws, goals_against, goals_for, losses, matches, overtime_losses, overtime_wins, points, season_id, user_id, wins, (SELECT category_id FROM divisions WHERE divisions.id = league_table_records.division_id) as category_id FROM league_table_records
                                              WHERE user_id = $1`,
                        [userId]
                    ).then((result: LeagueTableRecordsQueryResult) =>
                    {
                        return Tomwork.queryParse(result).rows;
                    })).reduce((a, leagueTableRecord) =>
                    {
                        if (!a[leagueTableRecord.categoryId])
                        {
                            a[leagueTableRecord.categoryId] = {};
                        }

                        a[leagueTableRecord.categoryId] = {
                            ...a[leagueTableRecord.categoryId],
                            ...new Row({value: new LeagueTableRecord({value: leagueTableRecord}).valuePublic}).valueIndexed
                        };

                        return a;
                    }, {});

                    output.leagueRegistrations = (await this.pg.query(
                            `SELECT * FROM league_registrations WHERE user_id = $1`,
                        [userId]
                    ).then((result: LeagueRegistrationsQueryResult) =>
                    {
                        return Tomwork.queryParse(result);
                    }) as LeagueRegistrationValue[]).reduce((a, leagueRegistration) =>
                    {
                        const {categoryId} = leagueRegistration;

                        const categoryIdString: string = categoryId.toString();

                        if (!a[categoryIdString])
                        {
                            a[categoryIdString] = {};
                            require(`../../routes/mail/leagueRegistration`)({categoryId: categoryId, pg: this.pg, ...user});
                        }

                        a[categoryIdString] = {
                            ...a[categoryIdString],
                            ...new Row({value: new LeagueRegistration({value: leagueRegistration}).valuePublic}).valueIndexed
                        };
                        return a;
                    }, {});

                    const online: number[] = await this.pg.query(
                            `SELECT * FROM users_online WHERE user_id = $1`,
                        [userId]
                    ).then((result: UsersOnlineQueryResult) =>
                    {
                        return Tomwork.queryParse(result).rows.map((row: UserOnlineValue) =>
                        {
                            return row.categoryId;
                        });
                    });

                    let usersPosted: boolean = false;

                    (await this.pg.query(`SELECT * FROM categories`).then((result: CategoriesQueryResult) =>
                    {
                        return Tomwork.queryParse(result);
                    }) as CategoryValue[]).filter((category, index) =>
                    {
                        return Object.values(output).some((table) =>
                        {
                            return table[category.id];
                        }) || index === 0;
                    }).forEach((category) =>
                    {
                        this.io.emitCustom(`fieldPost`, {
                            categoryId: category.id,
                            createdById: userId,
                            ...(new VueObject(output).filter(([, table]) =>
                            {
                                return table[category.id];
                            })).map(([, table]) =>
                            {
                                return table[category.id];
                            }).value,
                            ...(!usersPosted && {users: new Row({value: {id: userId, online, username: user.username}}).valueIndexed})
                        });

                        usersPosted = true;
                    });

                    return Promise.reject(this.query.verificationCode);
                }
            });
        }, Promise.resolve()).then(() =>
        {
            const err: string = `Verification code not found`;
            new ErrorCustom({at: `User.verify()`, err});

            return Promise.reject(err);
        }).catch((err) =>
        {
            if (err === `Verification code not found`)
            {
                return Promise.reject(err);
            }

            return Promise.resolve(err);
        });
    }
}
