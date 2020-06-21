"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const Row_1 = require("./Row");
const LeagueSeasonsDivision_1 = require("./LeagueSeasonsDivision");
const LeagueSeasons_1 = require("../table/LeagueSeasons");
class Division extends Row_1.Row {
    constructor({ io, pg, res, value }) {
        super({ io, pg, res, value });
        this.initialized = false;
    }
    async init() {
        this.initialized = true;
        this.season = await new LeagueSeasons_1.LeagueSeasons({ pg: this.pg }).findLast();
        this.matchType = await this.pg.query(`SELECT * FROM matches_types WHERE id = $1`, [this.value.matchTypeId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        });
        if (this.matchType.name === `league`) {
            const { index, level } = await this.orderCalc().catch((err) => {
                new __1.ErrorCustom({ at: `Division.init() Division.orderCalc()`, err });
                return Promise.reject(err);
            });
            this.value.index = index;
            this.value.level = level;
        }
    }
    async orderCalc() {
        const usersCount = await this.usersCount();
        const order = Math.floor(usersCount / this.size);
        let c = 0, level = 0;
        while ((c + 4 ** level) <= order) {
            c += 4 ** level;
            level += 1;
        }
        return { index: (usersCount - c * this.size) % (4 ** level), level };
    }
    get size() {
        return this.season.divisionSize;
    }
    async upsert() {
        if (!this.initialized) {
            await this.init().catch((err) => {
                new __1.ErrorCustom({ at: `Division.upsert() Division.init()`, err });
                return Promise.reject(err);
            });
        }
        const { categoryId, matchTypeId } = this.value;
        const index = typeof this.value.index === `undefined` ? null : this.value.index;
        const level = typeof this.value.level === `undefined` ? null : this.value.level;
        return await this.pg.query(`INSERT INTO divisions(category_id, index, level, match_type_id) VALUES($1, $2, $3, $4)
                            ON CONFLICT(category_id, index, level, match_type_id) DO NOTHING RETURNING *`, [
            categoryId,
            index,
            level,
            matchTypeId
        ]).then(async (result) => {
            const resultParsed = __1.Tomwork.queryParse(result);
            if (resultParsed.rowCount) {
                this.value = { ...this.value, ...resultParsed.rows[0] };
            }
            else {
                await this.pg.query(`SELECT * FROM divisions WHERE category_id = $1 AND index = $2 AND level = $3 AND match_type_id = $4`, [
                    categoryId,
                    index,
                    level,
                    matchTypeId
                ]).then(async (result) => {
                    const resultParsed2 = __1.Tomwork.queryParse(result);
                    this.value = { ...this.value, ...resultParsed2.rows[0] };
                });
                this.io.emitCustom(`fieldPost`, {
                    categoryId: this.value.categoryId,
                    divisions: new Row_1.Row({ value: this.valuePublic }).valueIndexed
                });
            }
            console.log(this.value);
            if (this.matchType.name === `playOff`) {
                await new LeagueSeasonsDivision_1.LeagueSeasonsDivision({
                    io: this.io,
                    pg: this.pg,
                    res: this.res,
                    value: { divisionId: this.value.id, seasonId: (await new LeagueSeasons_1.LeagueSeasons({ pg: this.pg }).findLast()).id }
                }).upsert().catch((err) => {
                    new __1.ErrorCustom({ at: `Division.upsert() LeagueSeasonsDivision.upsert()`, err });
                    return Promise.reject(err);
                });
            }
            return Promise.resolve(resultParsed);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `Division.upsert() Division.findOneAndUpdate()`, err });
            return Promise.reject(err);
        });
    }
    async usersCount() {
        return await this.pg.query(`SELECT COALESCE(COUNT(*)::integer, 0) FROM league_table_records
                        INNER JOIN divisions ON divisions.id = league_table_records.division_id
                        INNER JOIN league_seasons season_last ON season_last.id = league_table_records.season_id
                        WHERE divisions.category_id = $1`, [this.value.categoryId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0].count;
        });
    }
    get valuePublic() {
        return (({ id, index, level, matchTypeId }) => {
            return {
                id,
                ...(index && { index }),
                ...(level && { level }),
                matchTypeId
            };
        })(this.value);
    }
}
exports.Division = Division;
//# sourceMappingURL=Division.js.map