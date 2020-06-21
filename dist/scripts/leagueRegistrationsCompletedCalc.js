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
    await Promise.all((await pg.query(`SELECT * FROM leagueRegistrations WHERE completed IS NULL`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    })).map(async ({ id, created }) => {
        return await pg.query(`UPDATE league_registrations SET completed = $1 WHERE id = $2`, [created, id]).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} SELECT league_registrations.rows.map() Promise.all()`, err });
        });
    })).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} SELECT league_registrations.rows.map() Promise.all()`, err });
    }).finally(() => {
        process.exit();
    });
})();
//# sourceMappingURL=leagueRegistrationsCompletedCalc.js.map