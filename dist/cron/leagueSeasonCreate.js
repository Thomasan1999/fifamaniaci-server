"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modules_1 = require("../modules");
const Moment = require("moment-timezone");
const LeagueSeasons_1 = require("../modules/table/LeagueSeasons");
(async () => {
    const pg = await modules_1.PgClient.connect();
    const leagueSeasonPrevious = await new LeagueSeasons_1.LeagueSeasons({ pg }).findLast();
    const leagueSeasonDuration = [1, `m`];
    const toDateIncremented = (moment) => {
        return moment.add(...leagueSeasonDuration).toDate();
    };
    const leagueSeasonNext = {
        divisionSize: 10,
        playOffEnd: toDateIncremented(Moment(leagueSeasonPrevious.playOffEnd)),
        playOffRoundsLimit: 2,
        playOffStart: toDateIncremented(Moment(leagueSeasonPrevious.playOffStart)),
        playOffWinsLimit: 2,
        registrationTo: toDateIncremented(Moment(leagueSeasonPrevious.registrationTo)),
        seasonEnd: toDateIncremented(Moment(leagueSeasonPrevious.seasonEnd)),
        seasonStart: toDateIncremented(Moment(leagueSeasonPrevious.seasonStart))
    };
    return await pg.query(`INSERT INTO league_seasons(division_size, play_off_end, play_off_rounds_limit, play_off_start, play_off_wins_limit, registration_to, season_end, season_start)
                          VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [
        leagueSeasonNext.divisionSize, leagueSeasonNext.playOffEnd, leagueSeasonNext.playOffRoundsLimit,
        leagueSeasonNext.playOffStart, leagueSeasonNext.playOffWinsLimit, leagueSeasonNext.registrationTo,
        leagueSeasonNext.seasonEnd, leagueSeasonNext.seasonStart
    ]).then(( /*result: LeagueSeasonQueryResult*/) => {
    }).catch((err) => {
        new modules_1.ErrorCustom({ at: `cron/leagueSeasonCreate INSERT INTO league_seasons`, err });
        return Promise.reject(err);
    }).finally(() => {
        process.exit();
    });
})();
//# sourceMappingURL=leagueSeasonCreate.js.map