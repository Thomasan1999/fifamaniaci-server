"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path = require("path");
const modules_1 = require("../modules");
(async () => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    let c = 0;
    await Promise.all((await pg.query(`SELECT * FROM USERS ORDER BY id ASC`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    })).map((user) => {
        c += 1;
        return pg.query(`UPDATE users SET variable_symbol = $1 WHERE id = $2 RETURNING *`, [user.id, c]).then((result) => {
            return modules_1.Tomwork.queryParse(result);
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} SELECT users Promise.all() UPDATE users`, err });
        });
    })).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} SELECT users Promise.all()`, err });
    });
    process.exit();
})();
//# sourceMappingURL=variableSymbolAdd.js.map