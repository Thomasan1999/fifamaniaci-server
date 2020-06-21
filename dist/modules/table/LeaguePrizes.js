"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Table_1 = require("./Table");
const NumericRange = require("numeric-range");
const __1 = require("..");
class LeaguePrizes extends Table_1.Table {
    constructor({ divisionId, io, pg, playersRegistered, res, seasonId }) {
        super({ io, name: `leaguePrizes`, pg, res });
        this.initialized = false;
        this.entrance = parseFloat(process.env.FM_LEAGUE_REGISTRATION_MONEY);
        this.divisionId = divisionId;
        this.playersRegistered = playersRegistered;
        this.seasonId = seasonId;
    }
    async init() {
        this.initialized = true;
        this.category = await this.pg.query(`SELECT * FROM categories AS c INNER JOIN divisions AS d ON d.id = $1 WHERE c.id = d.category_id`, [this.divisionId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        });
        this.season = await this.pg.query(`SELECT * FROM league_seasons AS s WHERE s.id = $1`, [this.seasonId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        });
    }
    get prizeFirst() {
        const sum = this.rowsRange.reduce((a, place) => {
            return a + (1 / place);
        }, 0);
        return (1 / sum) * (this.pool * .7);
    }
    rowsSortCompareFn([, prizeA], [, prizeB]) {
        return prizeB.money - prizeA.money;
    }
    get playersWinning() {
        return this.playersRegistered === 0 ? 0 : Math.max(1, Math.round(this.playersRegistered * .2));
    }
    get pool() {
        return this.entrance * this.playersRegistered;
    }
    get rows() {
        if (!this.initialized) {
            throw new Error(`League prizes not initalized`);
        }
        if (this.seasonId === 1) {
            const money = (() => {
                switch (this.category.name) {
                    case `xboxOne`:
                    case `xboxOneFut`:
                        return 50;
                    case `ps4`:
                        return 52;
                }
            })();
            return [{ id: 1, divisionId: this.divisionId, money, seasonId: this.seasonId }];
        }
        return this.rowsRange.map((place, index) => {
            return { id: index + 1, divisionId: this.divisionId, money: Math.round(this.prizeFirst / place), seasonId: this.seasonId };
        });
    }
    get rowsRange() {
        switch (this.playersWinning) {
            case 0:
                return [];
            case 1:
                return [1];
            default:
                // @ts-ignore
                return new NumericRange(1, this.playersWinning).enumerate();
        }
    }
}
exports.LeaguePrizes = LeaguePrizes;
//# sourceMappingURL=LeaguePrizes.js.map