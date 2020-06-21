"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const modules_1 = require("../modules");
(async () => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    process.env.FM_HOSTNAME = `fifamaniaci.app`;
    const pg = await modules_1.PgClient.connect();
    const users = await pg.query(`SELECT * FROM USERS where id = 5 AND verification_code IS NOT NULL`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    });
    await Promise.all(users.map(async ({ id, email, username }) => {
        const verificationCode = new modules_1.Token(10).value;
        const verificationCodeHash = await bcrypt.hash(verificationCode, 10);
        return await pg.query(`UPDATE users SET verification_code = $1 WHERE id = $2 RETURNING *`, [id, verificationCodeHash]).then(async ( /*result: UserQueryResult*/) => {
            return await require(`../routes/mail/verify`)({ email, username, verificationCode }).catch((err) => {
                new modules_1.ErrorCustom({ at: `${pathRelative} mail/verify Mail.send()`, err });
            });
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} UPDATE users`, err });
        });
    })).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all()`, err });
    }).finally(() => {
        process.exit();
    });
})();
//# sourceMappingURL=verificationFail.js.map