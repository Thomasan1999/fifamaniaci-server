"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSession = void 0;
const __1 = require("..");
const bcrypt = require("bcrypt");
const Row_1 = require("./Row");
const types_1 = require("../types");
class LoginSession extends Row_1.Row {
    constructor({ pg, res, tokenPlain, value }) {
        super({ pg, res, value: {} });
        this.tokenPlain = tokenPlain;
        this.user = value;
    }
    async end() {
        await this.find({ verifiedOnly: false }).then(async (loginSession) => {
            await this.pg.query(`UPDATE login_sessions SET session_to = CURRENT_TIMESTAMP WHERE token = $1 AND user_id = $2`, [loginSession.token, this.user.id]);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `LoginSession.end()`, err });
            return Promise.reject(err);
        });
    }
    async find({ res = true, verifiedOnly = true } = {}) {
        const loginSessionFound = await this.pg.query(`SELECT * FROM login_sessions WHERE session_to IS NULL AND user_id = $1`, [this.user.id]).then(async (result) => {
            const resultParsed = __1.Tomwork.queryParse(result);
            return await Promise.all((resultParsed.rows).map(async (loginSession) => {
                if (await bcrypt.compare(this.tokenPlain, loginSession.token)) {
                    this.value = new types_1.VueObject(loginSession).camelCaseTo();
                    return Promise.reject(loginSession);
                }
            })).then(() => {
                return Promise.reject(null);
            }).catch((loginSession) => {
                return Promise.resolve(loginSession);
            });
        });
        if (verifiedOnly && await this.pg.query(`SELECT COUNT(*)::integer FROM users WHERE id = $1 AND verification_code IS NOT NULL`, [this.user.id]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0].count;
        })) {
            const err = `Email address not verified`;
            if (res) {
                this.error({ message: err, status: 422 });
            }
            new __1.ErrorCustom({ at: `LoginSession.find()`, err });
            return Promise.reject(err);
        }
        if (loginSessionFound) {
            return loginSessionFound;
        }
        const err = `Invalid authentication data`;
        if (res) {
            this.error({ message: err, status: 422 });
        }
        new __1.ErrorCustom({ at: `LoginSession.find()`, err });
        return Promise.reject(err);
    }
    async insert() {
        this.tokenPlain = new __1.Token().value;
        const loginSessionNew = {
            sessionFrom: new Date(),
            token: await bcrypt.hash(this.tokenPlain, 10),
            userId: this.user.id
        };
        return await this.pg.query(`INSERT INTO login_sessions(session_from, token, user_id) VALUES($1, $2, $3) RETURNING *`, [loginSessionNew.sessionFrom, loginSessionNew.token, loginSessionNew.userId]).catch((err) => {
            this.error({ message: `Login session not created`, status: 500 });
            new __1.ErrorCustom({ at: `LoginSession.insert()`, err });
            return Promise.reject(err);
        });
    }
}
exports.LoginSession = LoginSession;
//# sourceMappingURL=LoginSession.js.map