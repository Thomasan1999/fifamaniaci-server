"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cron = require("node-cron");
const path = require("path");
const modules_1 = require("../modules");
const Moment = require("moment-timezone");
const LeagueSeasons_1 = require("../modules/table/LeagueSeasons");
module.exports = cron.schedule(`0 0 0 * * 1`, async () => {
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    const playersPenaltyPoints = {};
    const seasonLast = await new LeagueSeasons_1.LeagueSeasons({ pg }).findLast({ seasonStart: { $lte: new Date() } });
    const divisionsArray = await pg.query(`SELECT * FROM divisions WHERE level IS NOT NULL`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    }).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} SELECT divisions`, err });
    });
    if (!divisionsArray) {
        return;
    }
    const divisions = divisionsArray.reduce((a, division) => {
        a[division.id] = division.categoryId;
        return a;
    }, {});
    const matchesArray = await pg.query(`SELECT * FROM matches WHERE result_written IS NULL AND season_id = $1 AND WEEK IS NOT NULL`, [seasonLast.id]).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    }).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} SELECT matches`, err });
    });
    if (!matchesArray) {
        return;
    }
    matchesArray.filter((match) => {
        return (match.resultWritten || Date.now()) >= Moment(seasonLast.seasonStart).add(match.week + 1, `w`).toDate();
    }).forEach((match) => {
        [`awayId`, `homeId`].forEach((side) => {
            const player = match[side];
            if (!playersPenaltyPoints[player]) {
                playersPenaltyPoints[player] = {};
            }
            if (!playersPenaltyPoints[player][match.divisionId]) {
                playersPenaltyPoints[player][match.divisionId] = 0;
            }
            playersPenaltyPoints[player][match.divisionId] += 1;
        });
    });
    await Promise.all(Object.entries(playersPenaltyPoints).map(async ([playerId, playerDivisions]) => {
        return await Promise.all(Object.entries(playerDivisions).map(async ([playerDivisionId, penaltyPoints]) => {
            return await pg.query(`UPDATE league_registrations SET penalty_points = $1 WHERE category_id = $2 AND canceled IS NOT TRUE AND season_id = $3 AND user_id = $4 RETURNING *`, [penaltyPoints, divisions[playerDivisionId], seasonLast.id, playerId]).then((result) => {
                return modules_1.Tomwork.queryParse(result);
            }).catch((err) => {
                new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all(playersPenaltyPoints) Promise.all(playerDivisions) UPDATE league_registrations`, err });
            });
        })).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all(playersPenaltyPoints) Promise.all(playerDivisions)`, err });
        });
    })).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative}`, err });
    }).finally(async () => {
        process.exit();
    });
}, { timezone: `Europe/Bratislava` });
//# sourceMappingURL=matchesPenaltyPointsCheck.js.map