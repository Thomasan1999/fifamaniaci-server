"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Row_1 = require("./Row");
const ErrorCustom_1 = require("../ErrorCustom");
const __1 = require("..");
class UsersUsernameInGame extends Row_1.Row {
    constructor({ io, platformName, pg, req, res, value }) {
        super({ io, pg, req, res, value });
        this.initialized = false;
        this.platformName = platformName;
    }
    async init() {
        this.initialized = true;
        this.platform = await this.pg.query(`SELECT * FROM platforms WHERE name = $1`, [this.platformName]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        });
        this.value.platformId = this.platform.id;
    }
    async insert() {
        if (!this.initialized) {
            await this.init().catch((err) => {
                this.error({ message: err, status: 422 });
                return Promise.reject(err);
            });
        }
        const usernameDocumentCurrent = await this.pg.query(`SELECT * FROM users_usernames_in_game WHERE platform_id = $1 AND user_id = $2 ORDER BY id DESC LIMIT 1`, [this.value.platformId, this.value.userId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        });
        if (usernameDocumentCurrent && this.value.username === usernameDocumentCurrent.username) {
            const err = `Username identical to the current one`;
            new ErrorCustom_1.ErrorCustom({ at: `UsersUsernamesInGame.findOneAndUpdate()`, err });
            return Promise.reject(err);
        }
        return await this.pg.query(`INSERT INTO users_usernames_in_game(platform_id, user_id, username) VALUES($1, $2, $3) RETURNING *`, [this.value.platformId, this.value.userId, this.value.username]).then((result) => {
            return __1.Tomwork.queryParse(result);
        }).catch((err) => {
            new ErrorCustom_1.ErrorCustom({ at: `UsersUsernamesInGame.insert() INSERT INTO users_usernames_in_game`, err });
            return Promise.reject(err);
        });
    }
}
exports.UsersUsernameInGame = UsersUsernameInGame;
//# sourceMappingURL=UsersUsernameInGame.js.map