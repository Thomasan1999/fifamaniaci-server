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
    const leagueMatches = await pg.query(`SELECT * FROM matches WHERE season_id = 2 AND week IS NOT NULL`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    }).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} SELECT matches`, err });
        return Promise.reject(err);
    });
    const leagueMatchesOpponents = leagueMatches.map((leagueMatch) => {
        return `${leagueMatch.divisionId.toString()}${leagueMatch.homeId.toString()}${leagueMatch.awayId.toString()}`;
    });
    const leagueMatchesOpponentsCounter = {};
    leagueMatchesOpponents.forEach((leagueMatchOpponents) => {
        leagueMatchesOpponentsCounter[leagueMatchOpponents] = (leagueMatchesOpponentsCounter[leagueMatchOpponents] || 0) + 1;
    });
    console.log(leagueMatchesOpponents.length - new Set(leagueMatchesOpponents).size);
    process.exit();
})();
//# sourceMappingURL=matchesDuplicatesCheck.js.map