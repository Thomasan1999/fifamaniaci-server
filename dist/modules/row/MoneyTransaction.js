"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const Row_1 = require("./Row");
const LeagueSeasons_1 = require("../table/LeagueSeasons");
const types_1 = require("../types");
const LoginSession_1 = require("./LoginSession");
class MoneyTransaction extends Row_1.Row {
    constructor({ categoryName, io, pg, req, res, transactionTypeName, username, value }) {
        super({ io, pg, req, res, value: { ...value, money: value.money } });
        this.initialized = false;
        this.transactionType = {};
        this.categoryName = categoryName;
        this.transactionType.name = transactionTypeName;
        this.username = username;
    }
    async init() {
        this.initialized = true;
        this.transactionType = await this.pg.query(`SELECT * FROM money_transactions_types WHERE name = $1`, [this.transactionType.name]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        });
        this.user = await this.pg.query(`SELECT * FROM users WHERE LOWER(username) = LOWER($1)`, [this.username]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        });
    }
    async insert() {
        if (!this.initialized) {
            await this.init().catch((err) => {
                new __1.ErrorCustom({ at: `MoneyTransaction.upsert() MoneyTransaction.init()`, err });
                return Promise.reject(err);
            });
        }
        const insertValue = await this.insertValue();
        return await this.pg.query(`INSERT INTO money_transactions(category_id, money, place, season_id, transaction_type_id, user_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`, [insertValue.categoryId || null, insertValue.money, insertValue.place || null, insertValue.seasonId || null, insertValue.transactionTypeId, insertValue.userId]).then(async (result) => {
            const resultParsed = __1.Tomwork.queryParse(result);
            this.value = { ...result.rows[0], ...this.value };
            const { money, place } = this.value;
            const { username } = this;
            await this.pg.query(`UPDATE users SET money = money + $1 WHERE username = $2 RETURNING *`, [money, username]).then((resultUser) => {
                const resultUserParsed = __1.Tomwork.queryParse(resultUser);
                [this.user] = resultUserParsed.rows;
                return Promise.resolve(resultUserParsed);
            }).catch((err) => {
                new __1.ErrorCustom({ at: `MoneyTransaction.upsert() users.updateOne()`, err });
                return Promise.reject(err);
            });
            await [...this.io.clients].filter((socket) => {
                return this.user.id === socket.cookies.value.id && socket.cookies.value.token && socket.cookies.value.token.length === 64;
            }).reduce(async (a, socket) => {
                await a;
                if (await new LoginSession_1.LoginSession({ pg: this.pg, tokenPlain: socket.cookies.value.token, value: this.user }).find({ res: false, verifiedOnly: false })) {
                    socket.emitCustom(`userPropsUpdate`, {
                        props: this.user,
                        transaction: { categoryName: this.categoryName, money, place, type: this.transactionType.name }
                    });
                }
            }, Promise.resolve());
            return Promise.resolve(resultParsed);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `MoneyTransaction.upsert() INSERT INTO money_transactions(...columns) VALUES(...values)`, err });
            return Promise.reject(err);
        });
    }
    async insertValue() {
        return (async ({ money, place }) => {
            const { categoryName, username } = this;
            if (!this.transactionType.id) {
                const err = `Transaction type not found`;
                new __1.ErrorCustom({ at: `MoneyTransaction.insertValue()`, err });
                this.error({ message: err, status: 422 });
                return Promise.reject(err);
            }
            if (!this.user.id) {
                const err = `${username ? `Username` : `Variable symbol`} not found`;
                new __1.ErrorCustom({ at: `MoneyTransaction.insertValue()`, err });
                this.error({ message: err, status: 422 });
                return Promise.reject(err);
            }
            return {
                ...(this.transactionType.fields && this.transactionType.fields.includes(`categoryId`) && {
                    categoryId: (await this.pg.query(`SELECT id FROM categories WHERE name = $1`, [categoryName]).then((result) => {
                        return new types_1.VueObject(result.rows[0]).camelCaseTo();
                    })).id
                }),
                money,
                ...(this.transactionType.fields && this.transactionType.fields.includes(`place`) && { place }),
                transactionTypeId: this.transactionType.id,
                ...(this.transactionType.fields && this.transactionType.fields.includes(`seasonId`) && {
                    seasonId: (await new LeagueSeasons_1.LeagueSeasons({ pg: this.pg }).findLast({ seasonStart: { $lte: new Date() } })).id
                }),
                userId: this.user.id
            };
        })(this.value);
    }
}
exports.MoneyTransaction = MoneyTransaction;
//# sourceMappingURL=MoneyTransaction.js.map