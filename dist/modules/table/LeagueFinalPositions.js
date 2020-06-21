"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Table_1 = require("./Table");
const __1 = require("..");
class LeagueFinalPositions extends Table_1.Table {
    constructor({ categoryId, io, pg, res, seasonId }) {
        super({ io, pg, res });
        this.categoryId = categoryId;
        this.seasonId = seasonId;
    }
    async insertOne({ position, userId }) {
        return await this.pg.query(`INSERT INTO league_final_positions(category_id, position, season_id, user_id) VALUES($1, $2, $3, $4)`, [this.categoryId, position, this.seasonId, userId]).then((result) => {
            const resultParsed = __1.Tomwork.queryParse(result);
            this.value.push(result.rows[0]);
            return Promise.resolve(resultParsed);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `LeagueFinalPositions.insert()`, err });
        });
    }
}
exports.LeagueFinalPositions = LeagueFinalPositions;
//# sourceMappingURL=LeagueFinalPositions.js.map