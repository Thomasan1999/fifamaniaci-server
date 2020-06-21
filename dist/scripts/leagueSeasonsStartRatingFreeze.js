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
    const seasonLast = await new LeagueSeasons_1.LeagueSeasons({ pg }).findLast({ seasonStart: { $lte: new Date() } });
    await Promise.all((await pg.query(`SELECT league_registrations.id as id, category_id, canceled, league_registrations.created, completed, rating, season_id, user_id FROM league_registrations
                    INNER JOIN users ON users.id = league_registrations.user_id
                    WHERE canceled IS NOT TRUE AND dnf_after_weeks IS NULL AND season_id = $1 users.verification_code IS NULL`, [seasonLast.id]).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    })).map(async ({ id, categoryId, userId }) => {
        const { rating } = await pg.query(`SELECT * FROM players WHERE category_id = $1 AND user_id = $2`, [categoryId, userId]).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows[0];
        });
        return await pg.query(`UPDATE league_registrations SET rating = COALESCE($1, 0) WHERE id = $2 RETURNING *`, [rating, id]).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} SELECT league_registrations.rows.map() UPDATE league_registrations`, err });
            return Promise.reject(err);
        });
    })).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} SELECT league_registrations.rows.map()`, err });
    }).finally(() => {
        process.exit();
    });
})();
//# sourceMappingURL=leagueSeasonsStartRatingFreeze.js.map