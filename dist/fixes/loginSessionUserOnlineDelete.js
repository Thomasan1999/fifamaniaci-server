"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
const modules_1 = require("../modules");
(async () => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    await Promise.all([
        pg.query(`UPDATE users SET online = NULL WHERE online IS NOT NULL`)
    ]).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} loginSessions updateMany()`, err });
    }).finally(() => {
        process.exit();
    });
})();
//# sourceMappingURL=loginSessionUserOnlineDelete.js.map