"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const __1 = require("..");
const _1 = require(".");
const categories_1 = require("../../locales/sk/categories");
const requestPromiseNative = require("request-promise-native");
const html_entities_1 = require("html-entities");
const Row_1 = require("./Row");
const types_1 = require("../types");
class Message extends Row_1.Row {
    constructor({ io, pg, req, res, value }) {
        super({ io, pg, req, res, value });
    }
    async botPost() {
        const data = {
            categoryName: categories_1.default[await this.pg.query(`SELECT name FROM categories id = $1`, [this.value.categoryId]).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0].name;
            })],
            createdBy: await this.pg.query(`SELECT username FROM users WHERE id = $1`, [this.value.createdById]).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0].username;
            }),
            message: html_entities_1.AllHtmlEntities.decode(this.value.message)
        };
        return requestPromiseNative({
            form: data,
            method: `POST`,
            url: `https://bot.fifamaniaci.sk`
        }).catch((err) => {
            new __1.ErrorCustom({ at: `Message.botPost() requestPromiseNative.post()`, err });
            return Promise.reject(err);
        });
    }
    async insert() {
        if (this.value.addresseeId) {
            if (!await this.pg.query(`SELECT COUNT(*)::integer FROM users WHERE id = $1 AND verification_code IS NULL`, [this.value.addresseeId]).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0].count;
            })) {
                const err = `Addressee not found`;
                this.error({ message: err, status: 422 });
                new __1.ErrorCustom({ at: `Message.insert()`, err });
                return Promise.reject(err);
            }
        }
        this.value.message = html_entities_1.AllHtmlEntities.encode(this.value.message).trim();
        if (!this.value.message.length) {
            const err = `Message is empty`;
            this.error({ message: err, status: 422 });
            new __1.ErrorCustom({ at: `Message.insert()`, err });
            return Promise.reject(err);
        }
        return await this.pg.query(`INSERT INTO messages(addressee_id, category_id, created_by_id, message) VALUES($1, $2, $3, $4) RETURNING *`, [this.value.addresseeId || null, this.value.categoryId, this.value.createdById, this.value.message]).then(async (insertedMessage) => {
            [this.value] = insertedMessage.rows.map((row) => {
                return new types_1.VueObject(row).camelCaseTo();
            });
            if (!insertedMessage.rowCount) {
                const err = `Message not added`;
                this.error({ message: err, status: 422 });
                new __1.ErrorCustom({ at: `Message.insert()`, err });
                return Promise.reject(err);
            }
            const message = new Row_1.Row({ value: this.valuePublic });
            const { addresseeId, categoryId, createdById } = this.value;
            if (addresseeId) {
                const { io, pg, req, res } = this;
                await Promise.all([
                    new _1.MessagesTab({ io, pg, req, res, value: { addresseeId: createdById, categoryId: categoryId, createdById: addresseeId } }).insert(),
                    this.pg.query(`SELECT * FROM messages_tabs WHERE addressee_id = $1 AND category_id = $2 AND created_by_id = $3`, [addresseeId, categoryId, createdById]).then((result) => {
                        return __1.Tomwork.queryParse(result).rows[0];
                    })
                ]).then(async ([insertedMessagesTab, createdByMessagesTab]) => {
                    const sockets = [...this.io.clients].filter((socket) => {
                        return socket.cookies.value.id && socket.cookies.value.token &&
                            (addresseeId === socket.cookies.value.id || createdById === socket.cookies.value.id);
                    });
                    if (sockets.length === 0) {
                        return;
                    }
                    sockets.forEach((socket) => {
                        const createdByIs = createdById === socket.cookies.value.id;
                        const tabId = createdByIs ? createdByMessagesTab.id : insertedMessagesTab.rows[0].id;
                        socket.emitCustom(`fieldPost`, {
                            categoryId,
                            createdById,
                            messages: new Row_1.Row({ value: { ...message.value, tabId } }).valueIndexed,
                            ...(!createdByIs && {
                                messagesTabs: new Row_1.Row({
                                    value: insertedMessagesTab.rows[0]
                                }).valueIndexed
                            })
                        });
                    });
                    return Promise.resolve(Boolean(insertedMessagesTab.rowCount));
                }).catch((err) => {
                    new __1.ErrorCustom({ at: `Message.insert() MessagesTab.insert()`, err });
                    return Promise.reject(err);
                });
            }
            else // !addresseeId
             {
                this.io.emitCustom(`fieldPost`, { categoryId, createdById, messages: message.valueIndexed });
                if (process.env.NODE_ENV === `production`) {
                    this.botPost().catch((err) => {
                        new __1.ErrorCustom({ at: `Message.insert() Message.botPost()`, err });
                        return Promise.reject(err);
                    });
                }
            }
            return Promise.resolve({ categoryId, createdById, value: message.valueIndexed });
        }).catch((err) => {
            new __1.ErrorCustom({ at: `Message.insert() messages.insertOne()`, err });
            return Promise.reject(err);
        });
    }
    get valuePublic() {
        return (({ id, addresseeId, created, createdById, message }) => {
            return {
                id,
                ...(addresseeId && { addresseeId }),
                created,
                createdById,
                message
            };
        })(this.value);
    }
}
exports.Message = Message;
//# sourceMappingURL=Message.js.map