"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pgFormat = require("pg-format");
const Matches_1 = require("./Matches");
const LeagueSeasons_1 = require("./LeagueSeasons");
const __1 = require("..");
class MatchesPlayOff extends Matches_1.Matches {
    constructor({ pg, divisionLeague, divisionPlayOff, seasonId, res }) {
        super({ pg, res });
        this.initialized = false;
        this.divisionLeague = divisionLeague;
        this.divisionPlayOff = divisionPlayOff;
        this.seasonId = seasonId;
    }
    async init() {
        this.initialized = true;
        if (!this.divisionLeague) {
            const { categoryId, index, level } = this.divisionPlayOff;
            this.divisionLeague = await this.pg.query(`SELECT * FROM divisions
                                    INNER JOIN matches_types ON matches_types.name = 'league'
                                    WHERE category_id = $1 AND index = $2 AND level = $3`, [categoryId, index, level]).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0];
            });
        }
        if (this.seasonId) {
            this.season = await this.pg.query(`SELECT * FROM league_seasons WHERE id = $1`, [this.seasonId]).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0];
            });
        }
        else {
            this.season = await new LeagueSeasons_1.LeagueSeasons({ pg: this.pg }).findLast({ seasonStart: { $lte: new Date() } });
            this.seasonId = this.season.id;
        }
        this.rounds = Array(this.roundsLimit).fill(null).map((_, roundIndex) => {
            return Array(2 ** roundIndex).fill(null).map(() => {
                return [];
            });
        });
        this.seriesWinners = Array(this.roundsLimit).fill(null).map(() => {
            return [];
        });
        this.value = await this.pg.query(`SELECT * FROM matches WHERE division_id = $1 AND leg IS NOT NULL AND round IS NOT NULL AND series IS NOT NULL AND season_id = $2 ORDER BY round DESC, series ASC, leg ASC`, [this.divisionPlayOff.id, this.seasonId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows;
        });
        this.leagueTableRecords = await this.pg.query(`SELECT league_table_records.* FROM league_table_records
                              INNER JOIN divisions ON divisions.id = league_table_records.division_id
                              INNER JOIN league_registrations ON league_registrations.category_id = divisions.category_id AND league_registrations.dnf_after_weeks IS NULL AND league_registrations.season_id = league_table_records.season_id AND league_registrations.user_id = league_table_records.user_id
                              WHERE division_id = $1 and league_table_records.season_id = $2 ORDER BY points DESC, goals_for - goals_against DESC, goals_for DESC LIMIT $3`, [this.divisionLeague.id, this.seasonId, 2 ** this.roundsLimit]).then((result) => {
            return __1.Tomwork.queryParse(result).rows;
        });
        this.value.forEach((match) => {
            this.rounds[match.round][match.series][match.leg] = match;
        });
        [...this.rounds].reverse().forEach((round, roundIndexReversed) => {
            const roundIndex = this.rounds.length - 1 - roundIndexReversed;
            round.forEach((series, seriesIndex) => {
                this.seriesWinners[roundIndex][seriesIndex] = (() => {
                    if (!series[0]) {
                        if (roundIndex >= this.roundLast) {
                            const userIndex = MatchesPlayOff.userIndexGet({ seriesCount: round.length, seriesIndex });
                            const userOtherIndex = MatchesPlayOff.userOtherIndexGet({ seriesCount: MatchesPlayOff.seriesCountGet(roundIndex), userIndex });
                            return (this.leagueTableRecords[userIndex] && this.leagueTableRecords[userIndex].userId) || (this.leagueTableRecords[userOtherIndex] && this.leagueTableRecords[userOtherIndex].userId);
                        }
                        return;
                    }
                    return this.seriesWinnerGet(series);
                })();
            });
        });
    }
    matchesOwnGet(userIds) {
        return this.value.filter((match) => {
            return userIds.some((userId) => {
                return userId === match.homeId;
            }) && userIds.some((userId) => {
                return userId === match.awayId;
            });
        });
    }
    get roundsLimit() {
        return this.season.playOffRoundsLimit;
    }
    get roundFirst() {
        return this.value.length === 0 ? Math.ceil(Math.log2(this.leagueTableRecords.length)) : this.value[0].round;
    }
    get roundLast() {
        return this.value.length === 0 ? this.roundFirst : this.value[this.value.length - 1].round;
    }
    async roundPush() {
        const playedPreviously = this.value.length > 0;
        if (!this.initialized) {
            await this.init();
        }
        if (this.roundLast === 0) {
            return;
        }
        if (this.leagueTableRecords.length === 0) {
            return;
        }
        if (playedPreviously && this.seriesWinners[this.roundLast].some((seriesWinner) => {
            return !seriesWinner;
        })) {
            return;
        }
        const outputPromises = [];
        const roundIndex = this.roundLast - 1;
        const seriesCount = MatchesPlayOff.seriesCountGet(roundIndex);
        const seriesMidpoint = seriesCount / 2;
        for (let seriesGenerateOrder = 0; seriesGenerateOrder < seriesCount; seriesGenerateOrder += 1) {
            const userIndex = MatchesPlayOff.userIndexGet({ seriesCount, seriesGenerateOrder });
            const userOtherIndex = MatchesPlayOff.userOtherIndexGet({ seriesCount, userIndex });
            const userIds = (() => {
                if (this.seriesWinners[roundIndex + 1]) {
                    return [this.seriesWinners[roundIndex + 1][userIndex * 2], this.seriesWinners[roundIndex + 1][(userIndex * 2) + 1]];
                }
                if (!this.leagueTableRecords[userIndex] || !this.leagueTableRecords[userOtherIndex]) {
                    return [];
                }
                return [this.leagueTableRecords[userIndex].userId, this.leagueTableRecords[userOtherIndex].userId];
            })();
            if (!userIds[0] || !userIds[1]) {
                continue;
            }
            const week = await this.pg.query(`SELECT week FROM matches WHERE division_id = $1 AND result_written IS NOT NULL AND season_id = $2 ORDER BY week DESC LIMIT 1`, [this.divisionLeague.id, this.seasonId]).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0].week;
            }) + 1;
            const matchesInsertTo = Array(this.winsLimit).fill(null).map((_, leg) => {
                return {
                    [leg % 2 === 0 ? `homeId` : `awayId`]: userIds[0],
                    divisionId: this.divisionPlayOff.id,
                    [leg % 2 === 1 ? `homeId` : `awayId`]: userIds[1],
                    leg,
                    matchOrder: 0,
                    round: roundIndex,
                    seasonId: this.seasonId,
                    series: (seriesGenerateOrder < seriesCount / 2) ? seriesGenerateOrder * 2 : seriesCount - 1 - ((seriesGenerateOrder - seriesMidpoint) * 2),
                    week
                };
            });
            outputPromises.push(await this.pg.query(pgFormat(`INSERT INTO(%s) VALUES%s RETURNING *`, __1.Tomwork.columnListGet(Object.keys(matchesInsertTo[0])), matchesInsertTo.map((match) => {
                return `(${__1.Tomwork.insertValuesGet(Object.values(match))})`;
            }).join(`,`))).then((result) => {
                return __1.Tomwork.queryParse(result);
            }));
            this.value.push(...outputPromises[0].rows);
        }
        this.initialized = false;
        return outputPromises;
    }
    static seriesCountGet(roundIndex) {
        return 2 ** roundIndex;
    }
    seriesWinnerGet(series) {
        if (!series[0]) {
            return;
        }
        const user1Id = series[0].homeId;
        const user2Id = series[0].awayId;
        const [user1Wins, user2Wins] = series.reduce((a, match) => {
            const winner = match.homeGoals > match.awayGoals ? `home` : `away`;
            if (user1Id === match[`${winner}Id`]) {
                a[0] += 1;
            }
            else {
                a[1] += 1;
            }
            return a;
        }, [0, 0]);
        if (user1Wins === this.winsLimit) {
            return user1Id;
        }
        if (user2Wins === this.winsLimit) {
            return user2Id;
        }
    }
    static userIndexGet({ seriesCount, seriesIndex, seriesGenerateOrder }) {
        if (typeof seriesGenerateOrder === `undefined`) {
            return seriesIndex % 2 === 0 ? seriesIndex / 2 : MatchesPlayOff.userOtherIndexGet({ seriesCount: seriesCount / 2, userIndex: (seriesIndex - 1) / 2 });
        }
        return seriesGenerateOrder;
    }
    static userOtherIndexGet({ seriesCount, userIndex }) {
        return (seriesCount * 2) - 1 - userIndex;
    }
    get winsLimit() {
        return this.season.playOffWinsLimit;
    }
}
exports.MatchesPlayOff = MatchesPlayOff;
//# sourceMappingURL=MatchesPlayOff.js.map