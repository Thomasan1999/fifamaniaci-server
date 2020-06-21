"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt");
const pgFormat = require("pg-format");
const __1 = require("..");
const Row_1 = require("./Row");
const _1 = require(".");
const types_1 = require("../types");
const UserUsernameInGame_1 = require("./UserUsernameInGame");
class User extends Row_1.Row {
    constructor({ auth, io, pg, query, req, res, usernamesInGame, value }) {
        super({ io, pg, query, req, res });
        const valueClone = __1.Tomwork.clone(value) || {};
        this.categoryId = valueClone.categoryId;
        delete valueClone.categoryId;
        this.leagueRegistrationIncluded = valueClone.leagueRegistration;
        delete valueClone.leagueRegistration;
        this.usernamesInGame = usernamesInGame;
        if (auth) {
            valueClone.id = auth.id;
            this.tokenPlain = auth.token;
        }
        this.value = valueClone;
    }
    async authenticate({ res = true, verifiedOnly = true } = {}) {
        const loginSession = new _1.LoginSession({ ...this, tokenPlain: this.tokenPlain, value: { ...this.value, ...this.query } });
        if (!loginSession.user.id || !loginSession.tokenPlain) {
            return Promise.resolve(false);
        }
        return await loginSession.find({ res, verifiedOnly }).then(async () => {
            return await this.pg.query(`SELECT * FROM users WHERE id = $1`, [loginSession.value.userId]).then((result) => {
                const resultParsed = __1.Tomwork.queryParse(result);
                const value = resultParsed.rows[0];
                this.value = { ...value, ...this.value };
                return Promise.resolve(Boolean(value));
            }).catch((err) => {
                new __1.ErrorCustom({ at: `User.authenticate() LoginSession.find() SELECT * FROM USERS`, err });
                return Promise.resolve(false);
            });
        }).catch(async (err) => {
            new __1.ErrorCustom({ at: `User.authenticate() LoginSession.find() SELECT * FROM USERS`, err });
            return Promise.resolve(false);
        });
    }
    async connectivityCheck() {
        const socketsLogout = [...this.io.clients].filter((socket) => {
            return this.value.id === socket.cookies.value.id && this.tokenPlain === socket.cookies.value.token;
        });
        const categoryIdsLogout = [...new Set(socketsLogout.map((socket) => {
                return socket.cookies.value.categoriesActive;
            }))];
        socketsLogout.forEach((socket) => {
            socket.emitCustom(`logout`);
            socket.cookies.userPropsDelete();
        });
        return await categoryIdsLogout.reduce(async (a, categoryId) => {
            return a.then(async () => {
                return await this.connectivitySet({ categoryId, connectivity: `offline` }).catch((err) => {
                    new __1.ErrorCustom({ at: `User.logout() User.connectivitySet() Set.forEach()`, err });
                    return Promise.reject(err);
                });
            });
        }, Promise.resolve());
    }
    async connectivitySet({ categoryId = this.categoryId, connectivity }) {
        if (connectivity === `online`) {
            if (!this.value.verificationCode) {
                this.io.emitCustom(`connectivityUpdate`, { id: this.value.id, categoryId, connectivity });
            }
            return await this.pg.query(`INSERT INTO users_online(category_id, user_id) VALUES($1, $2) ON CONFLICT (category_id, user_id) DO NOTHING RETURNING *`, [categoryId, this.value.id]).then((result) => {
                if (!result.rowCount) {
                    return;
                }
                return Promise.resolve(result);
            }).catch((err) => {
                new __1.ErrorCustom({ at: `User.connectivitySet() online`, err });
                return Promise.reject(err);
            });
        }
        const onlineIs = [...this.io.clients].filter((socket) => {
            return socket.cookies && this.value.id === socket.cookies.value.id && socket.cookies.value.categoriesActive === categoryId;
        }).length >= 1;
        if (onlineIs) {
            return;
        }
        this.io.emitCustom(`connectivityUpdate`, { id: this.value.id, categoryId, connectivity });
        return await this.pg.query(`DELETE FROM users_online WHERE category_id = $1 AND user_id = $2 RETURNING *`, [categoryId, this.value.id]).then((result) => {
            return Promise.resolve(result);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `User.connectivitySet() offline`, err });
            return Promise.reject(err);
        });
    }
    async find() {
        const foundUser = await this.pg.query(pgFormat(`SELECT * FROM users WHERE %s`, Object.entries(this.query).map(([paramName, param]) => {
            if ([`email`, `username`].includes(paramName)) {
                return pgFormat(`LOWER(${paramName}) LIKE LOWER(${typeof param === `string` ? `'${param}'` : param})`);
            }
            return `${paramName} = ${typeof param === `string` ? `'${param}'` : param}`;
        }).join(` AND `))).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        });
        if (foundUser) {
            this.value = { ...this.value, ...foundUser };
            return Promise.resolve(this.value);
        }
        this.error({ message: `User not found`, status: 422 });
        return Promise.reject(`User not found`);
    }
    async insert() {
        this.value.verificationCode = new __1.Token(10).value;
        return await this.pg.query(`INSERT INTO users(email, money, password, username, variable_symbol, verification_code) VALUES($1, 0, $2, $3,  (SELECT MAX(id) + 1 FROM users), $4) RETURNING *`, [this.value.email, await bcrypt.hash(this.value.password, 10), this.value.username.trim(), await bcrypt.hash(this.value.verificationCode, 10)]).then(async (result) => {
            if (!result.rowCount) {
                this.error({ message: `Username or email taken`, status: 409 });
                return Promise.reject(`Username or email taken`);
            }
            const user = result.rows[0];
            require(`../../routes/mail/verify`)({ ...user, verificationCode: this.value.verificationCode });
            this.value.id = user.id;
            const loginSession = new _1.LoginSession(this);
            await loginSession.insert();
            this.tokenPlain = loginSession.tokenPlain;
            this.value = { ...user, ...this.value };
            if (this.leagueRegistrationIncluded) {
                const { categoryId, io, pg } = this;
                this.leagueRegistration = new _1.LeagueRegistration({ io, pg, user: this, value: { categoryId, userId: this.value.id, valid: false } });
                await this.leagueRegistration.init().catch((err) => {
                    new __1.ErrorCustom({ at: `users.post() User.insert() LeagueRegistration.init()`, err });
                });
                this.leagueRegistration.insert().catch((err) => {
                    new __1.ErrorCustom({ at: `users.post() User.insert() LeagueRegistration.upsert()`, err });
                });
            }
            return Promise.resolve(this.valueLogin);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `User.insert()`, err });
            return Promise.reject(err);
        });
    }
    async login({ categoryId, password }) {
        await this.find().catch((err) => {
            new __1.ErrorCustom({ at: `User.login() User.find()`, err });
            return Promise.reject(err);
        });
        await this.passwordCheck(password).catch((err) => {
            new __1.ErrorCustom({ at: `User.login() User.passwordCheck()`, err });
            return Promise.reject(err);
        });
        const loginSession = new _1.LoginSession(this);
        await loginSession.insert().catch((err) => {
            new __1.ErrorCustom({ at: `User.login() LoginSession.insert()`, err });
            return Promise.reject(err);
        });
        this.tokenPlain = loginSession.tokenPlain;
        this.res.json(this.valueLogin);
        return await this.connectivitySet({
            categoryId: categoryId || this.req.cookies.categoryId,
            connectivity: `online`
        });
    }
    async logout() {
        return await new _1.LoginSession(this).end().then(async () => {
            return await this.connectivityCheck().catch((err) => {
                new __1.ErrorCustom({ at: `User.logout() LoginSession.end() User.connectivityCheck()`, err });
            });
        }).catch((err) => {
            new __1.ErrorCustom({ at: `User.logout() LoginSession.end()`, err });
            return Promise.reject(err);
        });
    }
    async passwordCheck(password) {
        if (!this.value.password) {
            this.error({ message: `Undefined password`, status: 400 });
            return Promise.reject(`Undefined password`);
        }
        const validPassword = await bcrypt.compare(password, this.value.password);
        if (!validPassword) {
            this.error({ message: `Incorrect password`, status: 422 });
            return Promise.reject(`Incorrect password`);
        }
        return Promise.resolve(validPassword);
    }
    async passwordReset({ password, passwordResetToken }) {
        return await this.find().then(async () => {
            const tokenValid = await bcrypt.compare(passwordResetToken, this.value.passwordResetToken).catch((err) => {
                new __1.ErrorCustom({ at: `User.passwordReset() User.find() bcrypt.compare()`, err });
                this.error({ message: `Password reset token invalid`, status: 422 });
                return Promise.reject(`Password reset token invalid`);
            });
            if (!tokenValid) {
                return tokenValid;
            }
            return await this.pg.query(`UPDATE users SET password = $1, password_reset_token = NULL WHERE id = $1`, [await bcrypt.hash(password, 10)]).then((result) => {
                return __1.Tomwork.queryParse(result);
            }).catch((err) => {
                new __1.ErrorCustom({ at: `User.passwordReset() User.find() users.findOneAndUpdate()`, err });
                this.error({ message: `User not found`, status: 422 });
                return Promise.reject(`User not found`);
            });
        }).catch((err) => {
            new __1.ErrorCustom({ at: `User.passwordReset() User.find()`, err });
            this.error({ message: err, status: 422 });
            return Promise.reject(err);
        });
    }
    async passwordResetEmailSend() {
        const passwordResetToken = new __1.Token().value;
        const passwordResetTokenHash = await bcrypt.hash(passwordResetToken, 10);
        return await this.pg.query(`UPDATE users SET password_reset_token = $2 WHERE email = $1`, [this.query.email, passwordResetTokenHash]).then((result) => {
            const resultParsed = __1.Tomwork.queryParse(result);
            this.value = resultParsed.rows[0];
            const { email, username } = this.value;
            require(`../../routes/mail/passwordReset`)({ email, passwordResetToken, username });
            return Promise.resolve(passwordResetToken);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `User.passwordResetEmailSend()`, err });
            this.error({ message: `Email not found`, status: 422 });
            return Promise.reject(err);
        });
    }
    get sockets() {
        return [...this.io.clients].filter((socket) => {
            return this.value.id === socket.cookies.value.id && socket.cookies.value.token && socket.cookies.value.token.length === 64;
        });
    }
    async update({ propsNew }) {
        if (__1.Tomwork.emptyIs(propsNew)) {
            const err = `Empty query string`;
            new __1.ErrorCustom({ at: `User.update()`, err });
            this.error({ message: err, status: 422 });
            return Promise.reject(err);
        }
        if (!await this.passwordCheck(propsNew.passwordCurrent)) {
            const err = `Incorrect password`;
            new __1.ErrorCustom({ at: `User.update()`, err });
            this.error({ message: err, status: 422 });
            return Promise.reject(err);
        }
        const promises = [];
        if (propsNew.email || propsNew.fbLink || propsNew.passwordNew) {
            promises.push(this.pg.query(pgFormat(`UPDATE users SET %s WHERE id = $1 RETURNING *`, __1.Tomwork.updateSetGet({
                ...(propsNew.email && { email: propsNew.email }),
                ...(propsNew.fbLink && { fbLink: propsNew.fbLink.match(/[^/]+$/)[0] }),
                ...(propsNew.passwordNew && { password: await bcrypt.hash(propsNew.passwordNew, 10) })
            })), [this.value.id]).then(async (userData) => {
                const resultParsed = __1.Tomwork.queryParse(userData);
                const valueOld = __1.Tomwork.clone(this.value);
                this.value = resultParsed.rows[0];
                if (propsNew.email && propsNew.email !== valueOld.email) {
                    await this.pg.query(`INSERT INTO users_emails(email, user_id) VALUES($1, $2)`, [valueOld.email, this.value.id]).catch((err) => {
                        new __1.ErrorCustom({ at: `User.update() UPDATE users INSERT INTO users_emails`, err });
                        this.error({ message: err, status: 422 });
                        return Promise.reject(err);
                    });
                }
                if (propsNew.fbLink && propsNew.fbLink !== valueOld.fbLink && valueOld.fbLink) {
                    await this.pg.query(`INSERT INTO users_fb_links(fb_link, user_id) VALUES($1, $2)`, [valueOld.fbLink, this.value.id]).catch((err) => {
                        new __1.ErrorCustom({ at: `User.update() UPDATE users INSERT INTO users_fb_links`, err });
                        this.error({ message: err, status: 422 });
                        return Promise.reject(err);
                    });
                }
                this.sockets.map((socket) => {
                    socket.emitCustom(`userPropsUpdate`, {
                        props: {
                            email: this.value.email,
                            ...(this.value.fbLink && { fbLink: this.value.fbLink })
                        }
                    });
                });
                return Promise.resolve(resultParsed);
            }).catch((err) => {
                new __1.ErrorCustom({ at: `User.update() UPDATE users`, err });
                return Promise.reject(err);
            }));
        }
        if (Object.keys(propsNew).some((propName) => {
            return propName.includes(`usernamesInGame`);
        })) {
            const { io, pg, res } = this;
            await Promise.all(Object.entries(propsNew).filter(([propName, prop]) => {
                return propName.includes(`usernamesInGame`) && prop;
            }).map(async ([propName, username]) => {
                const platformName = new types_1.VueString(propName.replace(`usernamesInGame`, ``)).decapitalize().toString();
                const usersUsernameInGame = new UserUsernameInGame_1.UserUsernameInGame({
                    io,
                    platformName,
                    pg,
                    res,
                    value: { userId: this.value.id, username }
                });
                promises.push(usersUsernameInGame.insert());
            }));
        }
        await Promise.all(promises).catch((err) => {
            new __1.ErrorCustom({ at: `User.update()`, err });
            this.error({ message: err, status: 422 });
            return Promise.reject(err);
        });
    }
    get valueFind() {
        return (({ id, admin, email, fbLink, money, username, variableSymbol }) => {
            return {
                id,
                ...(admin && { admin }),
                email,
                ...(fbLink && { fbLink }),
                money,
                username,
                usernamesInGame: this.usernamesInGame,
                variableSymbol,
                verified: !this.value.verificationCode
            };
        })(this.value);
    }
    get valueLogin() {
        return (({ id, admin, email, fbLink, money, username, variableSymbol }) => {
            return {
                id,
                ...(admin && { admin }),
                email,
                ...(fbLink && { fbLink }),
                money: parseFloat(money.toString()),
                token: this.tokenPlain,
                username,
                variableSymbol,
                verified: !this.value.verificationCode
            };
        })(this.value);
    }
    async verify() {
        const usersNotVerified = await this.pg.query(`SELECT id, email, username, verification_code FROM users WHERE verification_code IS NOT NULL ORDER BY id DESC`).then((result) => {
            return __1.Tomwork.queryParse(result).rows;
        });
        return await usersNotVerified.reduce(async (a, user) => {
            return a.then(async () => {
                if (await bcrypt.compare(this.query.verificationCode, user.verificationCode)) {
                    const userId = user.id;
                    this.pg.query(`UPDATE users SET verification_code = NULL WHERE id = $1`, [userId]).catch((err) => {
                        new __1.ErrorCustom({ at: `User.verify() UPDATE users SET verification_code = NULL`, err });
                    });
                    await this.pg.query(`UPDATE league_registrations SET completed = CURRENT_TIMESTAMP WHERE id = $1`, [userId]).catch((err) => {
                        new __1.ErrorCustom({ at: `User.verify() UPDATE league_registrations SET completed = CURRENT_TIMESTAMP`, err });
                    });
                    const leagueTableRecordsRows = await this.pg.query(`SELECT * FROM league_table_records WHERE id = $1`, [userId]).then((result) => {
                        return __1.Tomwork.queryParse(result).rows;
                    }).catch((err) => {
                        new __1.ErrorCustom({ at: `User.verify() SELECT * FROM league_table_records`, err });
                        throw new Error(`User.verify() SELECT * FROM league_table_records`);
                    });
                    if (!leagueTableRecordsRows) {
                        return leagueTableRecordsRows;
                    }
                    await leagueTableRecordsRows.reduce((a, leagueTableRecord) => {
                        return a.then(async () => {
                            return await new _1.LeagueTableRecord({ io: this.io, pg: this.pg, value: leagueTableRecord }).validate().catch((err) => {
                                new __1.ErrorCustom({ at: `User.verify() leagueTableRecordsFields.reduce() LeagueTableRecords.validate()`, err });
                                throw new Error(`User.verify() SELECT * FROM league_table_records`);
                            });
                        });
                    }, Promise.resolve()).catch((err) => {
                        new __1.ErrorCustom({ at: `User.verify() leagueTableRecordsFields.reduce()`, err });
                    });
                    const output = {};
                    output.players = (await this.pg.query(`SELECT * FROM players WHERE user_id = $1`, [userId]).then((result) => {
                        return __1.Tomwork.queryParse(result);
                    })).reduce((a, player) => {
                        if (!a[player.categoryId]) {
                            a[player.categoryId] = {};
                        }
                        a[player.categoryId] = { ...a[player.categoryId], ...new Row_1.Row({ value: new _1.Player({ value: player }).valuePublic }).valueIndexed };
                        return a;
                    }, {});
                    output.leagueTableRecords = (await this.pg.query(`SELECT league_table_records.id, division_id, draws, goals_against, goals_for, losses, matches, overtime_losses, overtime_wins, points, season_id, user_id, wins, (SELECT category_id FROM divisions WHERE divisions.id = league_table_records.division_id) as category_id FROM league_table_records
                                              WHERE user_id = $1`, [userId]).then((result) => {
                        return __1.Tomwork.queryParse(result).rows;
                    })).reduce((a, leagueTableRecord) => {
                        if (!a[leagueTableRecord.categoryId]) {
                            a[leagueTableRecord.categoryId] = {};
                        }
                        a[leagueTableRecord.categoryId] = {
                            ...a[leagueTableRecord.categoryId],
                            ...new Row_1.Row({ value: new _1.LeagueTableRecord({ value: leagueTableRecord }).valuePublic }).valueIndexed
                        };
                        return a;
                    }, {});
                    output.leagueRegistrations = (await this.pg.query(`SELECT * FROM league_registrations WHERE user_id = $1`, [userId]).then((result) => {
                        return __1.Tomwork.queryParse(result);
                    })).reduce((a, leagueRegistration) => {
                        const { categoryId } = leagueRegistration;
                        const categoryIdString = categoryId.toString();
                        if (!a[categoryIdString]) {
                            a[categoryIdString] = {};
                            require(`../../routes/mail/leagueRegistration`)({ categoryId: categoryId, pg: this.pg, ...user });
                        }
                        a[categoryIdString] = {
                            ...a[categoryIdString],
                            ...new Row_1.Row({ value: new _1.LeagueRegistration({ value: leagueRegistration }).valuePublic }).valueIndexed
                        };
                        return a;
                    }, {});
                    const online = await this.pg.query(`SELECT * FROM users_online WHERE user_id = $1`, [userId]).then((result) => {
                        return __1.Tomwork.queryParse(result).rows.map((row) => {
                            return row.categoryId;
                        });
                    });
                    let usersPosted = false;
                    (await this.pg.query(`SELECT * FROM categories`).then((result) => {
                        return __1.Tomwork.queryParse(result);
                    })).filter((category, index) => {
                        return Object.values(output).some((table) => {
                            return table[category.id];
                        }) || index === 0;
                    }).forEach((category) => {
                        this.io.emitCustom(`fieldPost`, {
                            categoryId: category.id,
                            createdById: userId,
                            ...(new types_1.VueObject(output).filter(([, table]) => {
                                return table[category.id];
                            })).map(([, table]) => {
                                return table[category.id];
                            }).value,
                            ...(!usersPosted && { users: new Row_1.Row({ value: { id: userId, online, username: user.username } }).valueIndexed })
                        });
                        usersPosted = true;
                    });
                    return Promise.reject(this.query.verificationCode);
                }
            });
        }, Promise.resolve()).then(() => {
            const err = `Verification code not found`;
            new __1.ErrorCustom({ at: `User.verify()`, err });
            return Promise.reject(err);
        }).catch((err) => {
            if (err === `Verification code not found`) {
                return Promise.reject(err);
            }
            return Promise.resolve(err);
        });
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map