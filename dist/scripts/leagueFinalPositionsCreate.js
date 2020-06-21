"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
const modules_1 = require("../modules");
const MatchesPlayOff_1 = require("../modules/table/MatchesPlayOff");
const LeagueFinalPositions_1 = require("../modules/table/LeagueFinalPositions");
(async () => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    const leagueSeasons = await pg.query(`SELECT * FROM league_seasons WHERE season_start < CURRENT_TIMESTAMP`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    });
    const matchTypeLeague = await pg.query(`SELECT * FROM match_types WHERE name = 'league'`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows[0];
    });
    const matchTypePlayOff = await pg.query(`SELECT * FROM match_types WHERE name = 'playOff'`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows[0];
    });
    await Promise.all(leagueSeasons.map(async ({ id: seasonId }) => {
        const divisions = await pg.query(`SELECT * FROM divisions WHERE match_type_id = $1 AND index = 0 AND level = 0`, [matchTypeLeague.id]).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows;
        });
        return await Promise.all(divisions.map(async (divisionLeague) => {
            const divisionPlayOff = await pg.query(`SELECT * FROM divisions WHERE category_id = $1 AND match_type_id = $2 AND index = 0 AND level = 0`, [divisionLeague.categoryId, matchTypePlayOff.id]).then((result) => {
                return modules_1.Tomwork.queryParse(result).rows[0];
            });
            if (!divisionPlayOff) {
                return;
            }
            const matchesPlayOff = new MatchesPlayOff_1.MatchesPlayOff({ divisionLeague, divisionPlayOff, pg, seasonId });
            await matchesPlayOff.init();
            if (matchesPlayOff.value.length === 0) {
                return;
            }
            const final = matchesPlayOff.value.filter((match) => {
                return match.round === 0 && match.series === 0;
            });
            const firstId = matchesPlayOff.seriesWinnerGet(final);
            if (!firstId) {
                return;
            }
            const leagueFinalPositions = new LeagueFinalPositions_1.LeagueFinalPositions({ categoryId: divisionLeague.categoryId, pg, seasonId });
            await Promise.all([
                leagueFinalPositions.insertOne({ position: 1, userId: firstId }),
                leagueFinalPositions.insertOne({ position: 2, userId: firstId === final[0].homeId ? final[0].awayId : final[0].homeId })
            ]);
            return await Promise.all((await pg.query(`SELECT league_table_records.* FROM league_table_records
                              INNER JOIN divisions ON divisions.id = league_table_records.division_id
                              INNER JOIN league_registrations ON league_registrations.category_id = divisions.category_id AND league_registrations.dnf_after_weeks IS NULL AND league_registrations.season_id = league_table_records.season_id AND league_registrations.user_id = league_table_records.user_id
                              INNER JOIN league_seasons ON league_seasons.id = league_table_records.season_id
                              LEFT JOIN league_final_positions ON league_final_positions.category_id = divisions.category_id AND league_final_positions.season_id = league_table_records.season_id AND league_final_positions.user_id = league_table_records.user_id
                              WHERE division_id = $1 and league_table_records.season_id = $2 
                              ORDER BY COALESCE(league_registrations.dnf_after_weeks, 100000) DESC, 
                              CASE WHEN league_registrations.dnf_after_weeks IS NOT NULL AND league_registrations.completed > league_seasons.season_start THEN league_registrations.completed END ASC, 
                              CASE WHEN league_registrations.dnf_after_weeks IS NOT NULL THEN COALESCE(league_final_positions.position, 100000) END ASC, 
                              CASE WHEN league_registrations.dnf_after_weeks IS NOT NULL THEN league_registrations.rating END DESC,
                              points DESC, goals_for - goals_against DESC, goals_for DESC`, [divisionLeague.id, seasonId]).then((result) => {
                return modules_1.Tomwork.queryParse(result).rows;
            })).filter((leagueTableRecord) => {
                return leagueTableRecord.userId !== final[0].homeId && leagueTableRecord.userId !== final[0].awayId;
            }).map(async ({ userId }, position) => {
                return await leagueFinalPositions.insertOne({
                    position: position + 2 + 1,
                    userId
                }).catch((err) => {
                    new modules_1.ErrorCustom({ at: `${pathRelative} LeagueFinalPositions.find().map()`, err });
                });
            })).catch((err) => {
                new modules_1.ErrorCustom({ at: `${pathRelative} LeagueFinalPositions.find().map() Promise.all()`, err });
            });
        }));
    }));
    process.exit();
})();
//# sourceMappingURL=leagueFinalPositionsCreate.js.map