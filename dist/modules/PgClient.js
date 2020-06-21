"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Pg = require("pg");
const dotenv = require("dotenv");
class PgClient {
    static connect() {
        dotenv.config({ path: `${__dirname}/../.env` });
        return (async () => {
            const pgClient = new Pg.Client({
                host: `localhost`,
                port: 5432,
                user: `postgres`,
                password: process.env.PG_PASSWORD,
                database: `fifamaniaci`
            });
            await pgClient.connect().catch((err) => {
                console.error(err);
            });
            return pgClient;
        })();
    }
}
exports.PgClient = PgClient;
//# sourceMappingURL=PgClient.js.map