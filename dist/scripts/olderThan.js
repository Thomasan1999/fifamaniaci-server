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
    await pg.query(`SELECT * FROM matches WHERE result_written IS NULL`).then((result) => {
        const matches = modules_1.Tomwork.queryParse(result).rows;
        const matchesFiltered = matches.filter((match) => {
            return match.resultWritten < Moment(`2019-04-30T23:59:59.999+02:00`).toDate();
        }).sort((match, match1) => {
            return match.resultWritten.valueOf() - match1.resultWritten.valueOf();
        });
        console.log(matchesFiltered[0], Moment(matchesFiltered[0].created).format());
        // console.log(
        //     Moment(matchesFiltered[matchesFiltered.length - 1].created).format(),
        //     Moment(matchesFiltered[0].created).format()
        // );
    }).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} SELECT matches`, err });
    }).finally(async () => {
        process.exit();
    });
})();
//# sourceMappingURL=olderThan.js.map