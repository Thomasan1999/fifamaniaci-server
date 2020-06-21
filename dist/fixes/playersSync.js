"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
const modules_1 = require("../modules");
const row_1 = require("../modules/row");
(async () => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    await Promise.all([
        pg.query(`SELECT matches.id, away_id, away_goals, canceled_at, canceled_by, divisions.category_id as category_id, created_by, division_id, home_id, home_goals, leg, match_order, overtime, played_at, result_written, round, season_id, series, divisions.match_type_id as type_id, week, matches.created, matches.updated FROM matches
                                    LEFT JOIN divisions ON divisions.id = matches.division_id
                                    WHERE result_written IS NOT NULL ORDER BY result_written ASC`).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows;
        }),
        pg.query(`UPDATE players SET rating = 0, rating_previous = NULL WHERE rating != 0 RETURNING *`).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows;
        }),
        pg.query(`UPDATE league_table_records SET draws = 0, goals_against = 0, goals_for = 0, losses = 0, matches = 0, overtime_losses = 0, overtime_wins = 0, points = 0, wins = 0 RETURNING *`).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows;
        })
    ]).then(async ([matchesArray, ,]) => {
        await pg.query(`DELETE FROM matches WHERE result_written IS NOT NULL`).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} DELETE FROM matches Promise.all(first)`, err });
        });
        return matchesArray.reduce((a, matchValue) => {
            return a.then(async () => {
                const match = new row_1.Match({
                    io: {
                        //@ts-ignore
                        emitCustom() {
                        }
                    },
                    pg,
                    query: { auth: { id: matchValue[`${matchValue.createdBy}Id`], token: `` } },
                    syncing: true,
                    value: { ...matchValue, playedAt: matchValue.playedAt.toISOString() }
                });
                return await match.upsert().catch(async (err) => {
                    new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all(first) matchesArray.reduce() Match.upsert()`, err });
                    process.exit();
                });
            });
        }, Promise.resolve()).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all(first) matchesArray.reduce()`, err });
        });
    }).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all(first)`, err });
    }).finally(async () => {
        process.exit();
    });
})();
//# sourceMappingURL=playersSync.js.map