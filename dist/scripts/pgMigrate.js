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
    const mongodbCollectionsOrder = {
        categories: 0,
        divisions: 1,
        leagueSeasons: 1,
        matchTypes: 0,
        messagesTabs: 1,
        moneyTransactionsTypes: 1,
        platforms: 0,
        users: 0
    };
    const mongodbCollections = (await mongodbClient.listCollections().toArray()).sort((collectionA, collectionB) => {
        const orderGet = (order = 2) => {
            return order;
        };
        return orderGet(mongodbCollectionsOrder[collectionA.name]) - orderGet(mongodbCollectionsOrder[collectionB.name]);
    });
    // await pgClient.query(
    //     `DROP SCHEMA public CASCADE;CREATE SCHEMA public;GRANT ALL ON SCHEMA public TO postgres;GRANT ALL ON SCHEMA public TO public;COMMENT ON SCHEMA public IS 'standard
    // public schema';`);
    await pgClient.query(pgFormat(`SELECT truncate_tables(%L);`, process.env.NODE_ENV === `production` ? `admin` : `postgres`));
    const _idsIds = new Map();
    await Promise.all(mongodbCollections.map(async (collection) => {
        return await mongodbClient.collection(collection.name).find({}).toArray().then((result) => {
            result.forEach((row, index) => {
                _idsIds.set(row._id.toHexString(), index + 1);
            });
        });
    }));
    // const enumTypeName: string = `match_side`;
    1;
    // await pgClient.query(`CREATE TYPE ${enumTypeName} AS ENUM('home', 'away')`);
    await mongodbCollections.reduce((a, collection) => {
        return a.then(async () => {
            const { $jsonSchema } = collection.options.validator;
            const tableName = collection.name === `matchTypes` ? `matches_types` : new types_1.VueString(collection.name).caseSnakeTo().toString();
            const columnNameGet = ((propName) => {
                switch (propName) {
                    case `_id`:
                        return `id`;
                    case `end`:
                        return `season_end`;
                    case `from`:
                        return `session_from`;
                    case `order`:
                        return `match_order`;
                    case `start`:
                        return `season_start`;
                    case `to`:
                        return `session_to`;
                    default:
                        return new types_1.VueString(propName).caseSnakeTo().toString();
                }
            });
            const columnsOrder = {
                created: 999,
                id: 0,
                _id: 1,
                updated: 1000
            };
            const columnsCompareFn = (propA, propB) => {
                if (columnsOrder[propA] || columnsOrder[propB]) {
                    return (columnsOrder[propA] || 100) - (columnsOrder[propB] || 100);
                }
                return propA.localeCompare(propB);
            };
            // const props: string = (Object.entries({...$jsonSchema.properties, created: {bsonType: `date`}}) as [string, JsonSchemaProperty][]).sort(
            //     ([propA], [propB]) =>
            //     {
            //         return columnsCompareFn(propA, propB);
            //     }).map(([propName, prop]) =>
            // {
            //     const propType: string = (() =>
            //     {
            //         if (propName === `_id`)
            //         {
            //             return `serial unique`;
            //         }
            //
            //         if (prop.enum)
            //         {
            //             return `match_side`;
            //         }
            //
            //         if (propName === `password` || propName.includes(`token`) || propName === `verificationCode`)
            //         {
            //             return `char(60)`;
            //         }
            //
            //         switch (prop.bsonType)
            //         {
            //             case `date`:
            //                 return `timestamp with time zone`;
            //             case `int`:
            //             case `objectId`:
            //                 return `integer`;
            //             case `double`:
            //                 return `double precision`;
            //             case `bool`:
            //                 return `boolean`;
            //             case `string`:
            //                 return `varchar(${propName === `message` ? 1024 : prop.maxLength || 128})`;
            //             case `decimal`:
            //                 return `decimal(12,2)`;
            //             case `long`:
            //                 return `bigint`;
            //             case `array`:
            //                 return `varchar(128)[]`;
            //         }
            //     })();
            //
            //     const columnName: string = columnNameGet(propName);
            //
            //     const primary: string = propName === `id` ? `PRIMARY KEY` : ``;
            //
            //     const required: string = $jsonSchema.required.includes(propName) ? `NOT NULL` : ``;
            //
            //     const checks: string = (() =>
            //     {
            //         const constraints: string[] = (() =>
            //         {
            //             switch (prop.bsonType)
            //             {
            //                 case `decimal`:
            //                 case `double`:
            //                 case `int`:
            //                 case `long`:
            //                     return [
            //                         ...(prop.minimum ? [`${columnName} >= ${prop.minimum}`] : []),
            //                         ...(prop.maximum ? [`${columnName} <= ${prop.maximum}`] : [])
            //                     ];
            //                 case `string`:
            //                     return [
            //                         ...(prop.minLength ? [`length(${columnName}) >= ${prop.minLength}`] : [])
            //                     ];
            //             }
            //
            //             return [];
            //         })();
            //
            //         return constraints.map((constraint) =>
            //         {
            //             return `CHECK (${constraint})`;
            //         }).join(`,\n`);
            //     })();
            //
            //     const referenceTableGet: (columnName: string) => string = (columnName: string) =>
            //     {
            //         return {
            //             addressee_id: `users`,
            //             away_id: `users`,
            //             category_id: `categories`,
            //             created_by_id: `users`,
            //             division_id: `divisions`,
            //             home_id: `users`,
            //             match_type_id: `matches_types`,
            //             platform_id: `platforms`,
            //             season_id: `league_seasons`,
            //             tab_id: `messages_tabs`,
            //             transaction_type_id: `money_transactions_types`,
            //             user_id: `users`
            //         }[columnName];
            //     };
            //
            //     const referencesString: string = columnName.includes(`_id`) && columnName !== `fb_id` ? `REFERENCES ${referenceTableGet(columnName)}(id)` : ``;
            //
            //     return [
            //         columnName,
            //         propType,
            //         ...(primary ? [primary] : []),
            //         ...(required ? [required] : []),
            //         ...(checks ? [`,${checks}`] : []),
            //         ...(referencesString ? [referencesString] : []),
            //         ...(columnName === `created` ? [`DEFAULT now()`] : [])
            //     ].join(` `);
            // }, `\n`).join(`,\n`);
            // const comments: string = (() =>
            // {
            //     return Object.entries($jsonSchema.properties).filter(([, prop]) =>
            //     {
            //         return prop.description;
            //     }).map(([propName, prop]) =>
            //     {
            //         return `COMMENT ON COLUMN ${tableName}.${columnNameGet(propName)} IS '${prop.description.replace(/'/g, `''`)}';\n`;
            //     }).join(``);
            // })();
            // await pgClient.query(`CREATE TABLE ${tableName} (${props});\n ${comments}`, []).catch((err) =>
            // {
            //     console.error(err);
            //     console.log(`CREATE TABLE ${tableName} (${props});\n ${comments}`);
            //     process.exit(1);
            // });
            const columns = [...Object.keys($jsonSchema.properties), `created`].sort(columnsCompareFn);
            const insertColumns = columns.filter((columnName) => {
                return columnName !== `_id` && columnName !== `valid` && !(columnName === `matchType_id` && [`leagueRegistrations`, `leagueTableRecords`].includes(collection.name));
            });
            const rows = await mongodbClient.collection(collection.name).find({}).toArray();
            if (!rows.length) {
                return;
            }
            const values = rows.filter((row) => {
                return Object.entries(row).filter(([columnName]) => {
                    return columnName.includes(`_id`) && columnName !== `fb_id`;
                }).every(([, column]) => {
                    return _idsIds.get(column.toHexString());
                });
            }).map((row) => {
                return `(${insertColumns.sort((columnNameA, columnNameB) => {
                    return insertColumns.indexOf(columnNameA) - insertColumns.indexOf(columnNameB);
                }).map((columnName) => {
                    const column = row[columnName];
                    if (typeof column == `undefined`) {
                        if (columnName === `created`) {
                            return `to_timestamp(${row._id.getTimestamp().valueOf()} / 1000)`;
                        }
                        if ([`admin`, `canceled`].includes(columnName)) {
                            return `false`;
                        }
                        return `null`;
                    }
                    switch ($jsonSchema.properties[columnName].bsonType) {
                        case 'string':
                            return `'${column}'`;
                        case `date`:
                            return `to_timestamp(${column.valueOf()} / 1000.0)`;
                        case `array`:
                            return `'{${column.map((element) => {
                                return `"${element}"`;
                            }).join(`,`)}}'`;
                        case `objectId`:
                            return _idsIds.get(column.toHexString());
                        default:
                            return column;
                    }
                }).join(`,`)})`;
            }).join(`,`);
            const insertColumnsString = insertColumns.map((columnName) => {
                return columnNameGet(columnName);
            }).join(`,`);
            const insertQuery = `INSERT INTO ${tableName}(${insertColumnsString}) VALUES${values} ON CONFLICT DO NOTHING;`;
            return await pgClient.query(insertQuery, []).catch((err) => {
                console.error(err);
                console.log(insertQuery);
                process.exit(1);
            });
        });
    }, Promise.resolve());
    process.exit();
})();
//# sourceMappingURL=pgMigrate.js.map