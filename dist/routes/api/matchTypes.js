"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const table_1 = require("../../modules/table");
module.exports = ({ app, pg, route }) => {
    app.get(route, async (req, res) => {
        const table = new table_1.Table({
            res,
            value: await pg.query(`SELECT id, name, weight FROM matches_types ORDER BY weight ASC`).then((result) => {
                return result.rows;
            })
        });
        table.send();
    });
};
//# sourceMappingURL=matchTypes.js.map