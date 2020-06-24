"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeagueRegistrations = void 0;
const pgFormat = require("pg-format");
const index_1 = require(".//index");
const LeagueSeasons_1 = require("./LeagueSeasons");
const __1 = require("..");
class LeagueRegistrations extends index_1.Table {
    constructor({ pg }) {
        super({ pg });
    }
    async finalPositionGet({ categoryId, seasonId, userId }) {
        const leagueFinalPosition = await this.pg.query(`SELECT * FROM league_final_positions WHERE category_id = $1 AND season_id = $2 AND user_id = $3`, [categoryId, seasonId, userId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        });
        if (leagueFinalPosition === null) {
            return;
        }
        return leagueFinalPosition.position;
    }
    static async finalPositionLookup({ pg, query }) {
        const seasonPreviousId = (await new LeagueSeasons_1.LeagueSeasons({ pg }).findLast({
            id: { $lt: query.seasonId }
        }) || { id: null }).id;
        if (!seasonPreviousId) {
            return ``;
        }
        return pgFormat(`INNER JOIN league_final_positions final_position ON category_id = league_registrations.category_id AND season_id = %s AND user_id = league_registrations.user_id`, seasonPreviousId);
    }
}
exports.LeagueRegistrations = LeagueRegistrations;
//# sourceMappingURL=LeagueRegistrations.js.map