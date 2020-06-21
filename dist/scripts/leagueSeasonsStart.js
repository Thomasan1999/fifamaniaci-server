"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
const pgFormat = require("pg-format");
const Moment = require("moment-timezone");
const row_1 = require("../modules/row");
const modules_1 = require("../modules");
const LeagueSeasons_1 = require("../modules/table/LeagueSeasons");
const LeagueRegistrations_1 = require("../modules/table/LeagueRegistrations");
(async () => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    const seasonLast = await new LeagueSeasons_1.LeagueSeasons({ pg }).findLast({ seasonStart: { $lte: new Date() } });
    (await pg.query(pgFormat(`SELECT league_registrations.id, canceled, league_registrations.category_id, completed, dnf_after_weeks, league_registrations.created, final_position.position AS penalty_points, position, player.rating, league_registrations.season_id, league_registrations.user_id, league_registrations.updated FROM league_registrations
                                     %s
                                     INNER JOIN players ON players.category_id = league_registrations.category_id AND players.user_id = league_registrations.user_id
                                     INNER JOIN users ON users.id = league_registrations.user_id AND users.verification_code IS NULL
                                     WHERE league_registrations.season_id = $1 `, await LeagueRegistrations_1.LeagueRegistrations.finalPositionLookup({ pg, query: { seasonId: seasonLast.id } }))).then((result) => {
        return result.rows;
    })).sort((leagueRegistrationA, leagueRegistrationB) => {
        const timestampA = Moment(leagueRegistrationA.completed);
        const timestampB = Moment(leagueRegistrationB.completed);
        const leagueStart = Moment(seasonLast.seasonStart);
        if (timestampA.diff(leagueStart) >= 0 || timestampB.diff(leagueStart) >= 0 || leagueRegistrationA.rating === leagueRegistrationB.rating) {
            return timestampA.diff(timestampB);
        }
        const finalPositionA = leagueRegistrationA.finalPosition || Number.MAX_SAFE_INTEGER;
        const finalPositionB = leagueRegistrationB.finalPosition || Number.MAX_SAFE_INTEGER;
        if (finalPositionA === finalPositionB) {
            return (leagueRegistrationB.rating || 0) - (leagueRegistrationA.rating || 0);
        }
        return finalPositionA - finalPositionB;
    }).reduce((a, { categoryId, seasonId, userId }) => {
        return a.then(async () => {
            const leagueTableRecord = await pg.query(`SELECT * FROM league_table_records WHERE category_id = $1 AND season_id = $2 AND user_id = $3`, [categoryId, seasonId, userId]).then((result) => {
                return modules_1.Tomwork.queryParse(result).rows[0];
            });
            if (!leagueTableRecord) {
                return;
            }
            const player = await pg.query(`SELECT * FROM players WHERE category_id = $1 AND user_id = $2`, [categoryId, userId]).then((result) => {
                return modules_1.Tomwork.queryParse(result).rows[0];
            });
            await pg.query(`UPDATE league_registrations SET rating = COALESCE($1, 0) WHERE category_id = $2 AND season_id = $3 AND user_id = $4`, [player.rating, categoryId, seasonId, userId]).catch((err) => {
                new modules_1.ErrorCustom({ at: `${pathRelative} leagueRegistrations.toArray().map() UPDATE league_registrations`, err });
                return Promise.reject(err);
            });
            return await new row_1.LeagueTableRecord({
                //@ts-ignore
                io: {
                    emitCustom() {
                    }
                },
                pg,
                res: {},
                value: leagueTableRecord
            }).validate().catch((err) => {
                new modules_1.ErrorCustom({ at: `${pathRelative} leagueRegistrations.toArray().reduce() LeagueTableRecord.validate()`, err });
            });
        });
    }, Promise.resolve()).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} leagueRegistrations.toArray().reduce()`, err });
    });
    await Promise.all((await pg.query(`SELECT league_seasons_divisions.id, COUNT(league_seasons_divisions.id) as league_table_records_count FROM league_seasons_divisions 
                                                        INNER JOIN league_table_records ON league_table_records.division_id = league_seasons_divisions.division_id AND league_table_records.season_id = league_seasons_divisions.season_id
                                                        INNER JOIN users ON users.id = league_table_records.user_id AND users.verification_code IS NULL 
                                                        WHERE season_id = $1 GROUP BY league_seasons_divisions.id HAVING COUNT(league_seasons_divisions.id) >= 4`, [seasonLast.id]).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    })).map(async (leagueSeasonsDivision) => {
        const { leagueTableRecords } = leagueSeasonsDivision;
        const teamsLength = leagueTableRecords.length;
        const season = await pg.query(`SELECT * FROM league_seasons WHERE id = $1`, [leagueSeasonsDivision.seasonId]).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows[0];
        });
        const leagueWeekCount = Moment(season.playOffStart).diff(season.seasonStart, `w`);
        const matches = require(`./matchesScheduleCreate`)({ divisionSize: season.divisionSize, teamsLength }).flat();
        const matchesPerWeek = Math.ceil(matches.length / leagueWeekCount);
        const matchesSchedule = Array(leagueWeekCount).fill(null).map((_, index) => {
            return matches.slice(index * matchesPerWeek, index * matchesPerWeek + matchesPerWeek);
        });
        // if (leagueTableRecords.length === 3)
        // {
        //     console.log(matchesPairs);
        //     console.log(matchesSchedule);
        // }
        return await Promise.all(matchesSchedule.map(async (weekMatches, week) => {
            return await Promise.all(weekMatches.map(async ([homeIndex, awayIndex], doubleMatchOrder) => {
                const awayId = leagueTableRecords[awayIndex].userId;
                const { divisionId } = leagueSeasonsDivision;
                const homeId = leagueTableRecords[homeIndex].userId;
                const matchOrder = doubleMatchOrder * 2;
                const seasonId = seasonLast.id;
                return await pg.query(`INSERT INTO matches(away_id, division_id, home_id, match_order, season_id, week) VALUES($1, $2, $3, $4, $5, $6),($3, $2, $1, $4 + 1, $5, $6)`, [awayId, divisionId, homeId, matchOrder, seasonId, week]).catch((err) => {
                    new modules_1.ErrorCustom({ at: `${pathRelative} leagueSeasonsDivisions.toArray().map()  Promise.all(matchesSchedule) Promise.all(weekMatches) INSERT INTO matches`, err });
                });
            })).catch((err) => {
                new modules_1.ErrorCustom({ at: `${pathRelative} leagueSeasonsDivisions.toArray().map()  Promise.all(matchesSchedule) Promise.all(weekMatches)`, err });
            });
        })).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} leagueSeasonsDivisions.toArray().map() Promise.all(matchesSchedule)`, err });
        });
    })).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} leagueSeasonsDivisions.toArray().map()`, err });
    }).finally(() => {
        process.exit();
    });
})();
//# sourceMappingURL=leagueSeasonsStart.js.map