"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const Row_1 = require("./Row");
const types_1 = require("../types");
class MessagesTab extends Row_1.Row {
    constructor({ io, pg, req, res, value }) {
        super({ io, pg, req, res, value });
    }
    async insert() {
        if (!await this.pg.query(`SELECT COUNT(*)::integer  FROM users WHERE id = $1 AND verification_code IS NULL`, [this.value.addresseeId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0].count;
        })) {
            const err = `Addressee not found`;
            this.error({ message: err, status: 422 });
            new __1.ErrorCustom({ at: `MessagesTab.insert()`, err });
            return Promise.reject(err);
        }
        return await this.pg.query(`INSERT INTO messages_tabs(addressee_id, category_id, created_by_id) VALUES($1, $2, $3) ON CONFLICT(addressee_id, category_id, created_by_id) DO NOTHING RETURNING *`, [this.value.addresseeId, this.value.categoryId, this.value.createdById]).then(async (messagesTabUpserted) => {
            return Promise.resolve({
                ...messagesTabUpserted,
                rows: messagesTabUpserted.rows.map((row) => {
                    return new types_1.VueObject(row).camelCaseTo();
                })
            });
        }).catch((err) => {
            new __1.ErrorCustom({ at: `MessagesTab.insert() INSERT INTO messages_tabs`, err });
            return Promise.reject(err);
        });
    }
    get valuePublic() {
        return (({ id, addresseeId, createdById }) => {
            return {
                id,
                ...(addresseeId && { addresseeId }),
                createdById
            };
        })(this.value);
    }
}
exports.MessagesTab = MessagesTab;
//# sourceMappingURL=MessagesTab.js.map