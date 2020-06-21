"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
const Moment = require("moment-timezone");
const modules_1 = require("../modules");
const LeagueSeasons_1 = require("../modules/table/LeagueSeasons");
(async () => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    const playersPenaltyPoints = {};
    const divisions = await pg.query(`SELECT * FROM divisions WHERE level IS NOT NULL`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows.reduce((a, division) => {
            a[division.id] = division.categoryId;
            return a;
        }, {});
    });
    await Promise.all([
        pg.query(`SELECT * FROM matches WHERE week IS NOT NULL`).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows;
        }),
        new LeagueSeasons_1.LeagueSeasons({ pg }).findLast({ seasonStart: { $lte: new Date() } })
    ]).then(async ([matches, seasonLast]) => {
        matches.filter((match) => {
            return (match.resultWritten || Date.now()) >= Moment(seasonLast.seasonStart).add(match.week + 1, `w`).toDate();
        }).forEach((match) => {
            const matchPenaltyPoints = Math.ceil(Moment(match.resultWritten || Date.now()).diff(Moment(seasonLast.seasonStart).add(match.week + 1, `w`), `w`, true));
            [`awayId`, `homeId`].forEach((side) => {
                const player = match[side];
                if (!playersPenaltyPoints[player]) {
                    playersPenaltyPoints[player] = {};
                }
                if (!playersPenaltyPoints[player][match.divisionId]) {
                    playersPenaltyPoints[player][match.divisionId] = 0;
                }
                playersPenaltyPoints[player][match.divisionId] += matchPenaltyPoints;
            });
        });
        await Promise.all(Object.entries(playersPenaltyPoints).map(async ([playerId, playerDivisions]) => {
            return await Promise.all(Object.entries(playerDivisions).map(async ([playerDivisionId, penaltyPoints]) => {
                return await pg.query(`UPDATE league_registrations SET penalty_points = $1 WHERE category_id = $2 AND canceled IS NOT TRUE AND season_id = $3 AND user_id = $4 RETURNING *`, [penaltyPoints, divisions[playerDivisionId], seasonLast.id, playerId]).then((result) => {
                    return modules_1.Tomwork.queryParse(result).rows;
                }).catch((err) => {
                    new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all() Promise.all() Promise.all() UPDATE league_registrations`, err });
                });
            })).catch((err) => {
                new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all() Promise.all() Promise.all()`, err });
            });
        })).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all() Promise.all()`, err });
        });
    }).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all()`, err });
    }).finally(async () => {
        process.exit();
    });
})();
//# sourceMappingURL=matchesPenaltyPointsCheck.js.map