"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
const Moment = require("moment-timezone");
const modules_1 = require("../modules");
(async () => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    const matchesArray = await pg.query(`SELECT * FROM matches WHERE result_written IS NOT NULL`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    });
    matchesArray.pop();
    await matchesArray.reduce((a, match) => {
        return a.then(async () => {
            return await pg.query(`UPDATE matches SET played_at = $1 WHERE id = $2 RETURNING *`, [match.id, Moment(match.playedAt).add(1, `d`).toDate()]).then((result) => {
                return modules_1.Tomwork.queryParse(result).rows;
            }).catch((err) => {
                new modules_1.ErrorCustom({ at: `${pathRelative} matchesArray.reduce() UPDATE matches`, err });
            });
        });
    }, Promise.resolve()).catch(async (err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all()`, err });
    }).finally(() => {
        process.exit();
    });
})();
//# sourceMappingURL=matchesDayAdd.js.map