"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
const modules_1 = require("../modules");
const LeagueSeasons_1 = require("../modules/table/LeagueSeasons");
(async () => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    const divisions = await pg.query(`SELECT * FROM divisions WHERE level IS NOT NULL`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    });
    await divisions.reduce((a, division) => {
        return a.then(async () => {
            const seasonId = (await new LeagueSeasons_1.LeagueSeasons({ pg }).findLast()).id;
            return await pg.query(`INSERT INTO league_seasons_divisions(division_id, season_id) VALUES($1, $2) ON CONFLICT DO NOTHING RETURNING *`, [division.id, seasonId]);
        });
    }, Promise.resolve()).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all()`, err });
    }).finally(async () => {
        process.exit();
    });
})();
//# sourceMappingURL=leagueSeasonsDivisionsCreate.js.map