"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
const Division_1 = require("../modules/row/Division");
const modules_1 = require("../modules");
const MatchesPlayOff_1 = require("../modules/table/MatchesPlayOff");
const LeagueSeasons_1 = require("../modules/table/LeagueSeasons");
(async () => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    const categoriesArray = await pg.query(`SELECT * FROM categories`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    });
    const matchTypeLeague = await pg.query(`SELECT * FROM matches_types WHERE name = 'league'`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows[0];
    });
    const matchTypePlayOff = await pg.query(`SELECT * FROM matches_types WHERE name = 'playOff'`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows[0];
    });
    const seasonId = (await new LeagueSeasons_1.LeagueSeasons({ pg }).findLast({ seasonStart: { $lte: new Date() } })).id;
    await Promise.all(categoriesArray.map(async (category) => {
        const divisionsArray = await pg.query(`SELECT * FROM divisions WHERE category_id = $1 AND match_type_id = $2`, [category.id, matchTypeLeague.id]).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows;
        });
        const categoryId = category.id;
        return await Promise.all(divisionsArray.map(async (divisionLeague) => {
            if (!await pg.query(`SELECT COUNT(*)::integer FROM matches WHERE division_id = $1 AND result_written IS NOT NULL`, [divisionsArray[0].id]).then((result) => {
                return modules_1.Tomwork.queryParse(result).rows[0].count;
            })) {
                return;
            }
            const divisionPlayOff = new Division_1.Division({
                io: {
                    //@ts-ignore
                    emitCustom() {
                    }
                },
                pg,
                value: { categoryId, index: divisionLeague.index, level: divisionLeague.level, matchTypeId: matchTypePlayOff.id }
            });
            await divisionPlayOff.upsert();
            const matchesPlayOff = new MatchesPlayOff_1.MatchesPlayOff({ divisionLeague, divisionPlayOff: divisionPlayOff.value, pg, seasonId });
            await matchesPlayOff.roundPush();
        }));
    }));
    process.exit();
})();
//# sourceMappingURL=leaguePlayOffCreate.js.map