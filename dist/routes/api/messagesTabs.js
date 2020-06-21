"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const table_1 = require("../../modules/table");
const modules_1 = require("../../modules");
const row_1 = require("../../modules/row");
// type TableThis = Merge<Table, { value?: MessagesTabValue[] }>;
module.exports = ({ app, io, pg, route }) => {
    app.get(route, async (req, res) => {
        const params = {
            categoryId: {}
        };
        const query = new modules_1.Query({ params, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, res });
        if (!await user.authenticate()) {
            return;
        }
        const table = new table_1.Table({
            res,
            value: await pg.query(`SELECT addressee_id, category_id, id FROM messages_tabs WHERE category_id = $1 AND created_by_id = $2`, [query.value.categoryId, query.createdById]).then((result) => {
                return result.rows;
            })
        });
        table.send();
    });
    app.post(route, async (req, res) => {
        const params = {
            addresseeId: {},
            categoryId: {}
        };
        const query = new modules_1.Query({ params, query: req.body, res });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, res });
        if (!await user.authenticate()) {
            return;
        }
        await new row_1.MessagesTab({ io, pg, res, value: { createdById: query.createdById, ...query.value } }).insert().then((messagesTabUpserted) => {
            res.json(new row_1.Row({ value: messagesTabUpserted.rows[0] }).valueIndexed);
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}.post()`, err });
        });
    });
    app.delete(route, async (req, res) => {
        const params = {
            id: {}
        };
        const query = new modules_1.Query({ params, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, res });
        if (!await user.authenticate()) {
            return;
        }
        await pg.query(`DELETE FROM messages_tabs WHERE id = $1`, [query.value.id]).then((deleteResponse) => {
            if (!deleteResponse.rowCount) {
                res.status(500).json({ message: `Messages tab not deleted` });
                return;
            }
            res.status(204).end();
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route} DELETE FROM messages_tabs`, err });
        });
    });
};
//# sourceMappingURL=messagesTabs.js.map