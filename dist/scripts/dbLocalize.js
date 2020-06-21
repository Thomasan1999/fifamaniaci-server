"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const bcrypt = require("bcrypt");
const Mongodb = require("mongodb");
const dotenv = require("dotenv");
const modules_1 = require("../modules");
const child_process_1 = require("child_process");
(async () => {
    class Db {
        static connect() {
            return (async () => {
                const client = await Mongodb.MongoClient.connect(`mongodb://127.0.0.1:27017`, { useNewUrlParser: true });
                return client.db(`fifamaniaci`);
            })();
        }
    }
    await child_process_1.spawn(`mongorestore`, [`--drop`, `--db`, `fifamaniaci`, `c:\\users\\tomas\\webstormprojects\\fifamaniaci\\server\\backup\\fifamaniaci`], { shell: true });
    setTimeout(async () => {
        dotenv.config({ path: `${__dirname}/../.env` });
        const dirname = path.basename(__dirname);
        const filename = path.basename(__filename, `.js`);
        const pathRelative = path.join(dirname, filename);
        const db = await Db.connect();
        const password = await bcrypt.hash(`123456`, 10);
        const users = await db.collection(`users`).find({}).toArray();
        const promises = [];
        promises.push(Promise.all(users.map(async ({ id, username }) => {
            return await db.collection(`users`).updateOne({
                id
            }, {
                $currentDate: { updated: true },
                $set: { email: `${username.replace(/ /g, `_`).toLowerCase()}@email.com`, password }
            }).catch((err) => {
                new modules_1.ErrorCustom({ at: `${pathRelative} users.updateOne()`, err });
                return Promise.reject(err);
            });
        })));
        promises.push(db.collection(`messagesTabs`).deleteMany({}).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} messagesTabs.deleteMany()`, err });
        }));
        promises.push(db.collection(`messages`).deleteMany({ addresseeId: { $exists: true } }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} messages.deleteMany()`, err });
        }));
        await Promise.all(promises).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all()`, err });
        });
        process.exit();
    }, 2500);
})();
//# sourceMappingURL=dbLocalize.js.map