"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Pg = require("pg");
class Db {
    static connect() {
        return (async () => {
            const pgClient = new Pg.Client({
                host: process.env.FM_HOSTNAME,
                port: 5433,
                user: `postgres`,
                password: `p5L43PF4XPTmybCE`,
                database: `fifamaniaci`
            });
            await pgClient.connect().catch((err) => {
                console.error(err);
            });
            return pgClient;
        })();
    }
}
exports.Db = Db;
//# sourceMappingURL=Pg.js.map