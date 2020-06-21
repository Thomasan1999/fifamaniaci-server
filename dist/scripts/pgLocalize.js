"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const modules_1 = require("../modules");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const child_process_1 = require("child_process");
(async () => {
    await child_process_1.spawn(`psql`, [`--set`, `ON_ERROR_STOP=on`, `fifamaniaci`, `c:\\users\\tomas\\webstormprojects\\fifamaniaci\\server\\backup\\fifamaniaci`], { shell: true });
    setTimeout(async () => {
        dotenv.config({ path: `${__dirname}/../.env` });
        const dirname = path.basename(__dirname);
        const filename = path.basename(__filename, `.js`);
        const pathRelative = path.join(dirname, filename);
        const pg = await modules_1.PgClient.connect();
        const password = await bcrypt.hash(`123456`, 10);
        await Promise.all([
            pg.query(`UPDATE users SET email = LOWER(REPLACE(username, ' ', '_')) || '@email.com', password = $1 RETURNING *`, [password]),
            pg.query(`DELETE FROM messages_tabs`),
            pg.query(`DELETE FROM messages WHERE addressee_id IS NOT NULL`)
        ]).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} UPDATE users`, err });
            return Promise.reject(err);
        });
        process.exit();
    }, 2500);
})();
//# sourceMappingURL=pgLocalize.js.map