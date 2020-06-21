"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const table_1 = require("../../modules/table");
const modules_1 = require("../../modules");
const row_1 = require("../../modules/row");
module.exports = ({ app, io, pg, route }) => {
    app.get(route, async (req, res) => {
        const params = {
            categoryId: {},
            tabId: { required: false }
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, res });
        const table = new table_1.Table({
            nested: true,
            res,
            tabCondition(record) {
                return (record.tab.find((tab) => {
                    return query.auth.id === tab.createdById;
                }) || { id: null }).id;
            }
        });
        if (query.auth && await user.authenticate({ res: false })) {
            table.value = await pg.query(`SELECT messages.addressee_id, messages.created, messages.created_by_id, messages.id, message FROM messages
LEFT JOIN messages_tabs ON (messages.addressee_id = messages_tabs.addressee_id AND messages.created_by_id = messages_tabs.created_by_id)
OR (messages.addressee_id = messages_tabs.created_by_id AND messages.created_by_id = messages_tabs.addressee_id)
WHERE (messages.addressee_id IS NULL OR messages_tabs.created_by_id = $1) AND messages.category_id = $2 AND (CASE WHEN $3::NUMERIC = $3 THEN messages.id < $3 ELSE TRUE END)
  ORDER BY id DESC LIMIT $4`, [query.createdById, query.value.categoryId, query.value.lastId, query.limit]).then((result) => {
                return result.rows;
            });
        }
        else {
            table.value = await pg.query(`SELECT addressee_id, created, created_by_id, id, message FROM messages
 WHERE addressee_id IS NULL AND category_id = $1 AND (CASE WHEN $2::NUMERIC = $2 THEN id < $2 ELSE TRUE END) ORDER BY id DESC LIMIT $3`, [query.value.categoryId, query.value.lastId, query.limit]).then((result) => {
                return result.rows;
            });
        }
        table.send();
    });
    app.post(route, async (req, res) => {
        const params = {
            addresseeId: { required: false },
            categoryId: {},
            message: {}
        };
        const query = new modules_1.Query({ params, query: req.body, res });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, res });
        if (!await user.authenticate()) {
            return;
        }
        await new row_1.Message({ io, pg, res, value: { createdById: query.createdById, ...query.value } }).insert().then((insertedMessage) => {
            res.json(insertedMessage);
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}.post()`, err });
        });
    });
};
//# sourceMappingURL=messages.js.map