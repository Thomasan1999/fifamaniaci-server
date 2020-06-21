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
            value: await pg.query(`SELECT players.id, COALESCE(rating, 0) AS rating, user_id FROM players INNER JOIN users ON users.id = players.user_id WHERE category_id = $1 AND users.verification_code IS NULL`, [query.value.categoryId]).then((result) => {
                return result.rows;
            })
        });
        table.send();
    });
};
//# sourceMappingURL=players.js.map