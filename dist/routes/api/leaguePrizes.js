"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const table_1 = require("../../modules/table");
const modules_1 = require("../../modules");
module.exports = ({ app, pg, route }) => {
    app.get(route, async (req, res) => {
        const params = {
            divisionId: {},
            seasonId: {}
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const table = new table_1.Table({
            res,
            value: await pg.query(`SELECT * FROM money_transactions AS m
                    INNER JOIN divisions AS d ON d.id = $1 
                    WHERE m.transaction_type_id = 2 AND m.season_id = $2 AND d.category_id = m.category_id`, [query.value.divisionId, query.value.seasonId]).then(async (result) => {
                const resultParsed = modules_1.Tomwork.queryParse(result);
                const leaguePrizes = new table_1.LeaguePrizes({
                    divisionId: query.value.divisionId,
                    playersRegistered: resultParsed.rowCount,
                    pg,
                    seasonId: query.value.seasonId
                });
                await leaguePrizes.init();
                return leaguePrizes.rows;
            })
        });
        table.send();
    });
};
//# sourceMappingURL=leaguePrizes.js.map