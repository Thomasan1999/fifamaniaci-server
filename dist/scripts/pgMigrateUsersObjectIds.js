"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Pg = require("pg");
const Mongodb = require("mongodb");
const dotenv = require("dotenv");
const pgFormat = require("pg-format");
const types_1 = require("../modules/types");
dotenv.config({ path: `${__dirname}/../.env` });
(async () => {
    class Db {
        static connect() {
            return (async () => {
                const client = await Mongodb.MongoClient.connect(`mongodb://127.0.0.1:27017`, { useNewUrlParser: true });
                return client.db(`fifamaniaci`);
            })();
        }
    }
    const mongodbClient = await Db.connect();
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
    const columnNameGet = ((propName) => {
        if (propName === `_id`) {
            return `objectid`;
        }
        return new types_1.VueString(propName).caseSnakeTo().toString();
    });
    const insertColumns = [`objectid`, `username`];
    const rows = await mongodbClient.collection(`users`).find({}).project({ _id: true, username: true }).toArray();
    if (!rows.length) {
        return;
    }
    const values = rows.map((row) => {
        return `(${insertColumns.sort((columnNameA, columnNameB) => {
            return insertColumns.indexOf(columnNameA) - insertColumns.indexOf(columnNameB);
        }).map((columnName) => {
            switch (columnName) {
                case `username`:
                    return `'${row.username}'`;
                case `objectid`:
                    return `'${row._id.toHexString()}'`;
            }
        }).join(`,`)})`;
    }).join(`,`);
    const insertColumnsString = insertColumns.map((columnName) => {
        return columnNameGet(columnName);
    }).join(`,`);
    await pgClient.query(pgFormat(`INSERT INTO users_objectids (%s) VALUES%s;`, insertColumnsString, values)).catch((err) => {
        console.error(err);
        console.log(`INSERT INTO users_objectids (${insertColumnsString}) VALUES${values};`);
        process.exit(1);
    });
    process.exit();
})();
//# sourceMappingURL=pgMigrateUsersObjectIds.js.map