"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const table_1 = require("../../modules/table");
const modules_1 = require("../../modules");
module.exports = ({ app, pg, route }) => {
    app.get(route, async (req, res) => {
        const params = {
            categoryId: {}
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const table = new table_1.Table({
            res,
            value: await pg.query(`SELECT id, category_id, index, level, match_type_id FROM divisions WHERE category_id = $1 AND level IS NOT NULL`, [query.value.categoryId]).then((result) => {
                return result.rows;
            })
        });
        table.send();
    });
};
//# sourceMappingURL=divisions.js.map