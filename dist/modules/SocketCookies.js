"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketCookies = void 0;
const _1 = require(".");
const row_1 = require("./row");
class SocketCookies extends _1.Cookies {
    constructor({ io, pg, value }) {
        super({ value });
        this.userProps = [`id`, `email`, `token`, `username`];
        this.io = io;
        this.pg = pg;
    }
    userPropsDelete() {
        this.userProps.forEach((prop) => {
            delete this.value[prop];
        });
    }
    async validate() {
        const { id, token } = this.value;
        if (id && token) {
            await new row_1.User({ auth: { id, token }, io: this.io, pg: this.pg }).authenticate({ res: false }).then((authenticated) => {
                if (authenticated) {
                    return;
                }
                this.userPropsDelete();
            }).catch((err) => {
                new _1.ErrorCustom({ at: `socket on connection`, err });
                return Promise.reject(err);
            });
        }
        else {
            this.userPropsDelete();
        }
    }
}
exports.SocketCookies = SocketCookies;
//# sourceMappingURL=SocketCookies.js.map