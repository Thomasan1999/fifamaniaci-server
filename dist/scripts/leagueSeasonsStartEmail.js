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
    const categoryPs4FutId = (await pg.query(`SELECT id FROM categories WHERE name = 'ps4Fut'`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows[0];
    })).id;
    const leagueRegistrations = await pg.query(`SELECT * FROM league_registrations 
                        INNER JOIN users ON users.id = league_registrations.user_id
                        WHERE category_id != $1 AND canceled IS NOT TRUE AND season_id = $2 AND users.verification_code IS NULL`, [categoryPs4FutId, seasonLast.id]).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    }).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} SELECT league_registrations`, err });
        return Promise.reject(err);
    });
    const leagueSeasonsStartEmail = require(`../routes/mail/leagueSeasonsStart`);
    await Promise.all(leagueRegistrations.map(async ({ categoryId, userId }) => {
        const { email, username, variableSymbol } = await pg.query(`SELECT * FROM users WHERE id = $1`, [userId]).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows[0];
        });
        return leagueSeasonsStartEmail({ categoryId, email, pg, username, variableSymbol: variableSymbol.toString().padStart(10, `0`) }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} leagueRegistrations.toArray().map() leagueSeasonsStartEmail`, err });
        });
    })).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} leagueRegistrations.toArray().map()`, err });
    }).finally(() => {
        process.exit();
    });
})();
//# sourceMappingURL=leagueSeasonsStartEmail.js.map