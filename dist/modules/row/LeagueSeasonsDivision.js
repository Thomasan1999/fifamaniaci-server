"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeagueSeasonsDivision = void 0;
const __1 = require("..");
const Row_1 = require("./Row");
class LeagueSeasonsDivision extends Row_1.Row {
    constructor({ io, pg, res, value }) {
        super({ io, pg, res, value });
    }
    async upsert() {
        return await this.pg.query(`INSERT INTO league_seasons_divisions(division_id, season_id) VALUES($1, $2) ON CONFLICT (division_id, season_id) DO NOTHING RETURNING *`, [this.value.divisionId, this.value.seasonId]).then(async (upsertedRecord) => {
            this.value = { ...this.value, ...upsertedRecord.rows[0] };
            if (upsertedRecord.rowCount) {
                this.io.emitCustom(`leagueSeasonsDivisionPost`, this.valuePublic);
            }
            return Promise.resolve(upsertedRecord);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `LeagueSeasonsDivision.upsert() LeagueSeasonsDivision.findOneAndUpdate()`, err });
            return Promise.reject(err);
        });
    }
    get valuePublic() {
        return (({ divisionId, seasonId }) => {
            return {
                divisionId,
                seasonId
            };
        })(this.value);
    }
}
exports.LeagueSeasonsDivision = LeagueSeasonsDivision;
//# sourceMappingURL=LeagueSeasonsDivision.js.map