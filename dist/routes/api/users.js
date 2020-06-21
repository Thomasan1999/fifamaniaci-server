"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const table_1 = require("../../modules/table");
const modules_1 = require("../../modules");
const row_1 = require("../../modules/row");
const pgFormat = require("pg-format");
const types_1 = require("../../modules/types");
module.exports = ({ app, io, pg, route }) => {
    app.get(route, async (req, res) => {
        const params = {
            email: { required: false },
            fbLink: { required: false },
            username: { required: false }
            // usernamesInGamePs4: {required: false},
            // usernamesInGameXboxOne: {required: false},
            // usernamesInGamePc: {required: false}
        };
        const projection = {
            admin: { value: true },
            email: { auth: true, value: true },
            fbLink: { value: true },
            id: { value: true },
            money: { auth: true, value: true },
            online: { value: true },
            username: { value: true },
            usernamesInGame: { value: true },
            variableSymbol: { auth: true, value: true }
        };
        const query = new modules_1.Query({ authRequired: false, params, projection, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const table = new table_1.Table({
            res
        });
        const user = new row_1.User({ auth: query.auth, io, pg, res });
        const authenticated = await user.authenticate({ res: false });
        const columnList = (() => {
            const projection = authenticated ? query.projectionAuth : query.projectionAuthNot;
            return modules_1.Tomwork.columnListGet(projection, {
                online: `COALESCE((SELECT DISTINCT ARRAY_AGG(category_id) FROM users_online WHERE users_online.user_id = users.id AND users.verification_code IS NULL), array[]::integer[]) as online`,
                usernamesInGame: `(SELECT array_agg(array[platforms.name, users_usernames_in_game.username]) FROM users_usernames_in_game 
INNER JOIN platforms ON users_usernames_in_game.platform_id = platforms.id
 WHERE users_usernames_in_game.user_id = users.id) AS usernames_in_game`
            });
        })();
        const querySingleFieldIs = Object.keys(query.params).some((param) => {
            return query.value[param];
        });
        if (querySingleFieldIs) {
            const userValue = await (async () => {
                const userQuery = (() => {
                    const userQueryKey = Object.keys(query.value)[0];
                    switch (userQueryKey) {
                        case `email`:
                        case `username`:
                            return `LOWER(${new types_1.VueString(userQueryKey).caseSnakeTo().toString()}) = LOWER('${query.value[userQueryKey]}')`;
                        case `fbLink`:
                            return `LOWER('${query.value.fbLink.match(/[^/]+$/)[0]}') = LOWER(fb_link)`;
                        default:
                            return `${new types_1.VueString(userQueryKey).caseSnakeTo().toString()} = ${query.value[userQueryKey]}`;
                    }
                })();
                if (!userQuery) {
                    res.status(422).json({ message: `User not found` });
                    return;
                }
                return await pg.query(pgFormat(`SELECT %s FROM users WHERE %s LIMIT 1`, columnList, userQuery)).then((result) => {
                    if (!result.rows[0]) {
                        return null;
                    }
                    const resultParsed = modules_1.Tomwork.queryParse(result);
                    const user = resultParsed.rows[0];
                    return {
                        ...user,
                        ...(user && user.usernamesInGame && {
                            usernamesInGame: user.usernamesInGame.reduce((a, [platformName, username]) => {
                                a[platformName] = username;
                                return a;
                            }, {})
                        })
                    };
                });
            })();
            if (!userValue) {
                res.status(422).json({ message: `User not found` });
                return;
            }
            res.json(new row_1.User({ usernamesInGame: userValue.usernamesInGame, value: userValue }).valueFind);
        }
        else {
            table.value = await pg.query(pgFormat(`SELECT %s FROM users WHERE users.verification_code IS NULL`, columnList)).then((result) => {
                return modules_1.Tomwork.queryParse(result).rows.map((row) => {
                    return {
                        ...row,
                        ...(row.usernamesInGame && {
                            usernamesInGame: row.usernamesInGame.reduce((a, [platformName, username]) => {
                                a[platformName] = username;
                                return a;
                            }, {})
                        })
                    };
                });
            });
            if (!table.value) {
                res.status(422).json({ message: `Users not found` });
                return;
            }
            table.send();
        }
    });
    app.post(route, async (req, res) => {
        const params = {
            categoryId: { required: false },
            email: {},
            leagueRegistration: { required: false },
            password: {},
            username: {}
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.body, res });
        if (!query.valid) {
            return;
        }
        new row_1.User({ io, pg, res, value: query.value }).insert().then((user) => {
            res.json(user);
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}.post()`, err });
        });
    });
    app.post(`${route}/login`, async (req, res) => {
        const params = {
            categoryId: {},
            email: {},
            password: {}
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.body, res });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ io, pg, query: { email: query.value.email }, req, res });
        user.login({ categoryId: query.value.categoryId, password: query.value.password }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}/login.post()`, err });
        });
    });
    app.patch(`${route}/logout`, async (req, res) => {
        const params = {};
        const query = new modules_1.Query({ params, query: req.body, res });
        if (!query.valid) {
            return;
        }
        new row_1.User({ auth: query.auth, io, pg, res }).logout().then(() => {
            return res.status(204).end();
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}/logout.patch()`, err });
        });
    });
    app.patch(`${route}/online`, async (req, res) => {
        const params = {
            categoryIdOld: { required: false },
            categoryIdNew: { required: false }
        };
        const query = new modules_1.Query({ query: req.body, res, params });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, query: { id: query.auth.id }, req, res });
        if (!await user.authenticate({ verifiedOnly: false })) {
            return;
        }
        await user.find().catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}/online.patch()`, err });
        });
        const { categoryIdOld, categoryIdNew } = query.value;
        await Promise.all([
            ...((categoryIdOld && categoryIdOld !== categoryIdNew) ? [user.connectivitySet({ categoryId: categoryIdOld, connectivity: `offline` })] : []),
            ...((categoryIdNew) ? [user.connectivitySet({ categoryId: categoryIdNew, connectivity: `online` })] : [])
        ]).then(async () => {
            res.status(204).end();
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}/online.patch()`, err });
        });
    });
    app.post(`${route}/passwordReset`, async (req, res) => {
        const params = {
            email: {},
            passwordNew: {},
            passwordResetToken: {}
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.body, res });
        if (!query.valid) {
            return;
        }
        const { email, passwordNew: password, passwordResetToken } = query.value;
        new row_1.User({ io, pg, res, query: { email } }).passwordReset({ password, passwordResetToken }).then(() => {
            res.status(204).end();
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}/passwordReset.post()`, err });
        });
    });
    app.post(`${route}/passwordResetEmail`, async (req, res) => {
        const params = {
            email: {}
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.body, res });
        if (!query.valid) {
            return;
        }
        new row_1.User({ io, pg, res, query: { email: query.value.email } }).passwordResetEmailSend().then(() => {
            res.status(204).end();
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}/passwordResetEmail.post()`, err });
        });
    });
    app.patch(`${route}/propsUpdate`, async (req, res) => {
        const params = {
            email: { required: false },
            fbLink: { required: false },
            passwordCurrent: {},
            passwordNew: { required: false },
            usernamesInGamePs: { required: false },
            usernamesInGameXbox: { required: false },
            usernamesInGamePc: { required: false }
        };
        const query = new modules_1.Query({ params, query: req.body, res });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, res });
        if (!await user.authenticate()) {
            return;
        }
        user.update({ propsNew: query.value }).then(() => {
            res.status(204).end();
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}/propsUpdate.patch()`, err });
        });
    });
    app.get(`${route}/verify`, async (req, res) => {
        const params = {
            verificationCode: {}
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const hostname = process.env.FM_HOSTNAME === `localhost` ? `127.0.0.1:8080` : process.env.FM_HOSTNAME;
        new row_1.User({ io, pg, res, query: { verificationCode: query.value.verificationCode } }).verify().then(() => {
            res.redirect(307, `https://${hostname}?verified=true`);
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}/verify.get()`, err });
            res.redirect(307, `https://${hostname}?verified=false`);
        });
    });
    app.get(`${route}/retrieveId`, async (req, res) => {
        if (typeof req.query._id !== `string` || req.query._id.length !== 24) {
            res.status(400).json({ message: `Invalid input format` });
            return;
        }
        const id = await pg.query(`SELECT users.id FROM users INNER JOIN users_objectids ON users.username = users_objectids.username AND users_objectids.objectid = $1`, [req.query._id]).then((result) => {
            const resultParsed = modules_1.Tomwork.queryParse(result);
            if (!resultParsed.rows[0].id) {
                return -1;
            }
            return resultParsed.rows[0].id;
        });
        if (id === -1) {
            res.status(400).json({ message: `User not found` });
            return;
        }
        res.json({ id });
    });
};
//# sourceMappingURL=users.js.map