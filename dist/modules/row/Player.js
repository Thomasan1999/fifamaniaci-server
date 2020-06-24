"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const __1 = require("..");
const Row_1 = require("./Row");
class Player extends Row_1.Row {
    constructor({ match, pg, side, value }) {
        super({
            pg,
            value: match ? { ...value, categoryId: match.categoryId, userId: match.value[`${side}Id`] } : value,
        });
        this.initialized = false;
        this.match = match;
        this.side = side;
    }
    cacheClear() {
        this.value.rating = this.ratingNew;
        delete this.ratingNew;
    }
    async init() {
        this.initialized = true;
        const player = { ...await this.pg.query(`SELECT *, (CASE WHEN rating = 0 THEN 1500 ELSE rating END) AS rating FROM players WHERE category_id = $1 AND user_id = $2`, [this.value.categoryId, this.value.userId]).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0];
            })
        };
        this.value = { ...this.value, ...player };
        return player;
    }
    get matchGoals() {
        return this.match.value[`${this.side}Goals`];
    }
    async ratingNewCalc() {
        const { goalDiffFactor, typeFactor } = this.match;
        const playerOther = this.match.players[this.side === `home` ? `away` : `home`];
        const matchIndex = await this.pg.query(`SELECT COUNT(*)::integer FROM matches
                                INNER JOIN divisions ON divisions.id = matches.division_id
                                WHERE divisions.category_id = $1 AND result_written IS NOT NULL AND result_written < $2 AND $3 IN (away_id, home_id)`, [this.match.categoryId, this.match.value.resultWritten, this.value.userId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0].count;
        });
        const resultFactor = (() => {
            const resultSign = Math.sign(this.matchGoals - playerOther.matchGoals);
            const overtimeFactor = Number(Boolean(this.match.value.overtime));
            return (3 + (resultSign * 3) + (overtimeFactor * -resultSign * 2)) / 6;
        })();
        const matchIndexFactor = 1 + (3 * (.9 ** matchIndex));
        const k = typeFactor * matchIndexFactor * goalDiffFactor;
        const ratingDiff = playerOther.value.rating - this.value.rating;
        const expectedResultFactor = 1 / (1 + (10 ** (ratingDiff / 400)));
        return this.value.rating + (k * (resultFactor - expectedResultFactor));
    }
    async ratingUpdate() {
        this.ratingNew = await this.ratingNewCalc();
        if (this.value.id) {
            return await this.pg.query(`UPDATE players SET rating = $2, rating_previous = $3
                                    FROM users 
                                    WHERE users.id = players.user_id AND category_id = $1 AND user_id = $4 AND users.verification_code IS NULL RETURNING *`, [this.value.categoryId, this.ratingNew, this.value.rating || null, this.value.userId]).then((result) => {
                return __1.Tomwork.queryParse(result);
            }).catch((err) => {
                new __1.ErrorCustom({ at: `Player.ratingUpdate() UPDATE players`, err });
                return Promise.reject(err);
            });
        }
        return await this.pg.query(`INSERT INTO players(category_id, rating, rating_previous, user_id) VALUES($1, $2, $3, $4) ON CONFLICT(category_id, user_id) DO NOTHING RETURNING *`, [this.value.categoryId, this.ratingNew || 0, this.value.rating || null, this.value.userId]).then((insertedPlayer) => {
            this.value.id = __1.Tomwork.queryParse(insertedPlayer).rows[0].id;
            return Promise.resolve(insertedPlayer);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `Player.ratingUpdate() INSERT INTO players`, err });
            return Promise.reject(err);
        });
    }
    async upsert() {
        return await this.pg.query(`INSERT INTO players(category_id, user_id) VALUES($1, $2) ON CONFLICT(category_id, user_id) DO NOTHING RETURNING *`, [this.value.categoryId, this.value.userId]).then((insertedPlayer) => {
            const resultParsed = __1.Tomwork.queryParse(insertedPlayer);
            if (!resultParsed.rowCount) {
                return Promise.resolve({ ...resultParsed, rows: [this.value] });
            }
            this.value.id = resultParsed.rows[0].id;
            return Promise.resolve(resultParsed);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `Player.upsert() INSERT INTO players`, err });
            return Promise.reject(err);
        });
    }
    get valuePublic() {
        return (({ id, rating, /*ratingPrevious,*/ userId }) => {
            return {
                id,
                // ...(ratingPrevious && {ratingPrevious}),
                rating: rating || 0,
                userId
            };
        })(this.value);
    }
}
exports.Player = Player;
//# sourceMappingURL=Player.js.map