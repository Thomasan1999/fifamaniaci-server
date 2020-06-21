"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const table_1 = require("../../modules/table");
const modules_1 = require("../../modules");
const row_1 = require("../../modules/row");
module.exports = ({ app, io, pg, route }) => {
    app.get(route, async (req, res) => {
        const params = {};
        const projection = {
            updated: { value: false }
        };
        const query = new modules_1.Query({ params, projection, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, res });
        if (await user.authenticate() && user.value.admin) {
            const table = new table_1.Table({
                res,
                value: (await pg.query(`SELECT category_id, created, id, money, place, season_id, transaction_type_id, user_id FROM money_transactions`).then((result) => {
                    return modules_1.Tomwork.queryParse(result).rows;
                }).catch((err) => {
                    new modules_1.ErrorCustom({ at: `${route}.get() SELECT ...columns FROM moneyTransactions`, err });
                    res.status(500).json({ message: err });
                }))
            });
            if (!table.value) {
                const err = `Money transactions not found`;
                new modules_1.ErrorCustom({ at: `${route}.get() moneyTransactions`, err });
                res.status(422).json({ message: err });
                return;
            }
            table.send();
            return;
        }
        const err = `Invalid authentication data`;
        new modules_1.ErrorCustom({ at: `${route}.get() moneyTransactions`, err });
        res.status(422).json({ message: err });
    });
    app.post(route, async (req, res) => {
        const params = {
            categoryName: { required: false },
            money: {},
            place: { required: false },
            transactionType: {},
            username: {}
        };
        const query = new modules_1.Query({ params, query: req.body, res });
        if (!query.valid) {
            return;
        }
        if (typeof query.value.username === `undefined`) {
            const err = `Username not defined`;
            new modules_1.ErrorCustom({ at: `${route}.post()`, err });
            res.status(422).json({ message: err });
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, res });
        const authenticated = await user.authenticate();
        if (!authenticated) {
            return;
        }
        if (authenticated || user.value.admin) {
            const { categoryName, money, place, transactionType: transactionTypeName, username } = query.value;
            return new row_1.MoneyTransaction({ categoryName, io, pg, res, transactionTypeName, username, value: { money, place } }).insert().then((insertInfo) => {
                const [insertedMoneyTransaction] = insertInfo.rows;
                res.json({ ...insertedMoneyTransaction, money: insertedMoneyTransaction.money });
            }).catch((err) => {
                new modules_1.ErrorCustom({ at: `${route}.post() MoneyTransaction.insert()`, err });
            });
        }
        const err = `Invalid authentication data`;
        new modules_1.ErrorCustom({ at: `${route}.post()`, err });
        res.status(422).json({ message: err });
    });
};
//# sourceMappingURL=moneyTransactions.js.map