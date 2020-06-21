"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Moment = require("moment-timezone");
const pgFormat = require("pg-format");
const _1 = require(".");
const Row_1 = require("./Row");
const __1 = require("..");
const types_1 = require("../../modules/types");
const MatchesPlayOff_1 = require("../table/MatchesPlayOff");
const LeagueSeasons_1 = require("../table/LeagueSeasons");
class Match extends Row_1.Row {
    constructor({ createdById, io, pg, query, res, syncing = false, value }) {
        super({ io, pg, res, query });
        this.initialized = false;
        this.leagueTableRecords = {};
        this.players = {};
        this.syncing = false;
        const valueCopy = __1.Tomwork.clone(value);
        this.categoryId = valueCopy.categoryId;
        delete valueCopy.categoryId;
        this.typeId = valueCopy.typeId;
        delete valueCopy.typeId;
        this.createdById = valueCopy.createdById || createdById;
        delete valueCopy.createdById;
        this.syncing = syncing;
        this.value = {
            ...valueCopy,
            createdBy: value.createdBy || Match.sides.find((side) => {
                return query.auth.id === (value[`${side}Id`]);
            }),
            playedAt: Moment(value.playedAt).add(Moment.parseZone(Moment(value.playedAt)).utcOffset(), `m`).utc().startOf(`d`).toDate()
        };
    }
    async divisionFind() {
        if (this.value.divisionId) {
            return await this.pg.query(`SELECT * FROM divisions WHERE id = $1`, [this.value.divisionId]).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0];
            }).catch((err) => {
                new __1.ErrorCustom({ at: `Match.divisionFind() this.value.divisionId`, err });
                return Promise.reject(err);
            });
        }
        if (Match.leagueTypes.includes(this.type.name)) {
            return await this.pg.query(pgFormat(`SELECT divisions.id, divisions.category_id, divisions.created, divisions.index, divisions.level, divisions.match_type_id FROM divisions
INNER JOIN matches_types matches_types_league ON matches_types_league.name = 'league'
INNER JOIN divisions divisions_league ON matches_types_league.id = divisions_league.match_type_id AND divisions_league.index = divisions.index AND divisions_league.level = divisions.level AND divisions_league.category_id = divisions.category_id
INNER JOIN league_table_records ON league_table_records.division_id = divisions_league.id AND season_id = $1 AND user_id = $2
INNER JOIN matches_types matches_types_play_off ON matches_types_play_off.name = 'playOff'
WHERE divisions.category_id = $3 AND %I.id = divisions.match_type_id`, `matches_types_${new types_1.VueString(this.type.name).caseSnakeTo().toString()}`), [this.value.seasonId, this.createdById, this.categoryId]).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0];
            }).catch((err) => {
                new __1.ErrorCustom({ at: `Match.divisionFind() Match.leagueTypes`, err });
                return Promise.reject(err);
            });
        }
        return await this.pg.query(`SELECT id, category_id, created, index, level, match_type_id FROM divisions WHERE category_id = $1 AND match_type_id = $2`, [this.categoryId, this.typeId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        }).catch((err) => {
            new __1.ErrorCustom({ at: `Match.divisionFind() !Match.leagueTypes`, err });
            return Promise.reject(err);
        });
    }
    async errorGet() {
        const futIs = await this.pg.query(`SELECT COUNT(*)::integer FROM categories WHERE id = $1 AND name LIKE '%Fut'`, [this.categoryId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0].count;
        }) === 1;
        if (!this.value.divisionId) {
            return { message: `Division not found`, status: 422 };
        }
        else if (!this.type) {
            return { message: `Match type not found`, status: 422 };
        }
        else if (this.value.canceledBy) {
            const userCancellingGoals = this.value[`${this.value.canceledBy}Goals`];
            const userNonCancellingGoals = this.value[`${this.userNonCancelling}Goals`];
            if (!Match.sides.includes(this.value.canceledBy)) {
                return { message: `Cancelling user not found`, status: 422 };
            }
            else if (userCancellingGoals > (userNonCancellingGoals - this.restGoals)) {
                return { message: `Cancelling user is the winner`, status: 422 };
            }
            else if (userNonCancellingGoals - this.restGoals < 0) {
                return { message: `Invalid number of the goals of the non-cancelling user`, status: 422 };
            }
        }
        else if (!Match.sides.includes(this.value.createdBy)) {
            return { message: `Creator not found in the match`, status: 422 };
        }
        else if (Moment(this.value.playedAt).diff(Moment().tz(`Europe/Bratislava`).startOf(`d`), `m`) > Moment().tz(`Europe/Bratislava`).utcOffset()) {
            return { message: `Invalid date`, status: 400 };
        }
        else if (this.value.overtime) {
            if (this.value.homeGoals === this.value.awayGoals) {
                return { message: `Draw is not possible in an overtime match`, status: 422 };
            }
            else if (this.type.name !== `playOff` && (!futIs || this.value.canceledAt > 90)) {
                return { message: `Overtime not supported in the match type`, status: 422 };
            }
        }
        else if (this.value.homeGoals === this.value.awayGoals && futIs) {
            return { message: `Draw is not possible in the match type`, status: 422 };
        }
        else if (await this.pg.query(pgFormat(`SELECT COUNT(*)::integer FROM users WHERE id IN(%s) AND verification_code IS NULL`, this.userIds.join(`,`))).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0].count;
        }) < 2) {
            return { message: `User not found`, status: 422 };
        }
        else if (this.type.name === `league`) {
            const matches = await this.pg.query(pgFormat(`SELECT * FROM matches WHERE %s`, __1.Tomwork.selectClauseGet(this.findValue))).then((result) => {
                return __1.Tomwork.queryParse(result).rows;
            });
            if (!matches.length) {
                return { message: `Match not found`, status: 422 };
            }
            else if (matches.every((match) => {
                return match.resultWritten;
            })) {
                return { message: `Match already played`, status: 422 };
            }
        }
        else if (this.type.name === `playOff`) {
            if (this.value.round > this.matchesPlayOff.roundLast) {
                return { message: `Round already played`, status: 422 };
            }
            const matchesPlayOffOwn = this.matchesPlayOff.matchesOwnGet(this.userIds).filter((match) => {
                return match.round === this.value.round;
            });
            if (matchesPlayOffOwn.length === 0) {
                return { message: `Users not in the same play-off series`, status: 422 };
            }
            const matchesPlayOffOwnPlayed = matchesPlayOffOwn.filter((match) => {
                return match.resultWritten;
            });
            if (this.matchesPlayOff.seriesWinnerGet(matchesPlayOffOwnPlayed)) {
                return { message: `No matches left to play`, status: 422 };
            }
            if (this.value.homeGoals === this.value.awayGoals) {
                return { message: `Draw is not possible in a play-off match`, status: 422 };
            }
            const first = { awayId: matchesPlayOffOwn[0].awayId, homeId: matchesPlayOffOwn[0].homeId };
            if (first.homeId === this.value[this.value.leg % 2 === 0 ? `awayId` : `homeId`]) {
                return { message: `Away and home user are reversed`, status: 422 };
            }
        }
    }
    get findValue() {
        const { awayId, divisionId, homeId, leg, round, seasonId } = this.value;
        return {
            awayId,
            divisionId,
            homeId,
            ...(this.type.name === `playOff` && { leg }),
            ...(this.type.name === `playOff` && { round }),
            ...(Match.leagueTypes.includes(this.type.name) && { seasonId }),
            ...(Match.leagueTypes.includes(this.type.name) && { week: { $lte: this.weekCurrent } })
        };
    }
    get goalDiff() {
        return Math.abs(this.players.home.matchGoals - this.players.away.matchGoals);
    }
    get goalDiffFactor() {
        return 2 - (1 / (2 ** (Math.max(1, this.goalDiff) - 1)));
    }
    ;
    async init() {
        this.initialized = true;
        //@ts-ignore
        return await Promise.all([
            this.pg.query(`SELECT * FROM matches_types WHERE id = $1`, [this.typeId]).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0];
            }),
            ...(this.value.seasonId ? [
                this.pg.query(`SELECT * FROM league_seasons WHERE id = $1`, [this.value.seasonId]).then((result) => {
                    return __1.Tomwork.queryParse(result).rows[0];
                })
            ] : [
                new LeagueSeasons_1.LeagueSeasons({ pg: this.pg }).findLast({ id: { $lt: 4 }, seasonStart: { $lte: new Date() } })
            ])
        ]).then(async ([type, season]) => {
            this.type = type;
            this.season = season;
            this.value.seasonId = season.id;
            this.division = await this.divisionFind().catch((err) => {
                new __1.ErrorCustom({ at: `Match.init() Match.divisionFind()`, err });
                return Promise.reject(err);
            });
            this.value.divisionId = this.division.id;
            if (this.type.name === `playOff`) {
                this.matchesPlayOff = new MatchesPlayOff_1.MatchesPlayOff({ pg: this.pg, divisionPlayOff: this.division, seasonId: this.value.seasonId });
                await this.matchesPlayOff.init().catch((err) => {
                    new __1.ErrorCustom({ at: `Match.init() MatchesPlayOff.init()`, err });
                    return Promise.reject(err);
                });
                const matchesPlayOffOwn = this.matchesPlayOff.matchesOwnGet(this.userIds);
                if (matchesPlayOffOwn.length === 0) {
                    return;
                }
                const { round, series, week } = matchesPlayOffOwn[0];
                const matchesPlayOffOwnPlayed = matchesPlayOffOwn.filter((match) => {
                    return match.resultWritten;
                });
                this.value.leg = matchesPlayOffOwnPlayed.length;
                this.value.round = round;
                this.value.series = series;
                this.value.week = week;
            }
        }).catch((err) => {
            new __1.ErrorCustom({ at: `Match.init()`, err });
            return Promise.reject(err);
        });
    }
    static get leagueTypes() {
        return [`league`, `playOff`];
    }
    async playersInit() {
        const promises = Match.sides.map((side) => {
            this.players[side] = new _1.Player({ match: this, pg: this.pg, side, value: {} });
            return this.players[side].init();
        });
        return await Promise.all(promises).catch((err) => {
            new __1.ErrorCustom({ at: `Match.playersInit()`, err });
            return Promise.reject(err);
        });
    }
    async playersRatingUpdate() {
        const updatePromises = Object.values(this.players).map((player) => {
            return player.ratingUpdate();
        });
        return await Promise.all(updatePromises).then(() => {
            Object.keys(this.players).forEach((playerName) => {
                this.players[playerName].cacheClear();
            });
        }).catch((err) => {
            new __1.ErrorCustom({ at: `Match.playersRatingUpdate()`, err });
            return Promise.reject(err);
        });
    }
    get restGoals() {
        return Math.ceil((91 - this.value.canceledAt) / 10);
    }
    ;
    static get sides() {
        return [`home`, `away`];
    }
    async tablesSync() {
        if (this.type.name === `playOff`) {
            this.matchesPlayOff.value.push(this.value);
            this.matchesPlayOff.initialized = false;
            const matchesPlayOffOwn = this.matchesPlayOff.matchesOwnGet(this.userIds).filter((match) => {
                return match.round === this.value.round;
            });
            const matchesPlayOffOwnPlayed = matchesPlayOffOwn.filter((match) => {
                return match.resultWritten;
            });
            if (!this.syncing && this.matchesPlayOff.seriesWinnerGet(matchesPlayOffOwnPlayed) && this.value.round > 0) {
                await this.matchesPlayOff.roundPush();
            }
        }
        await this.playersInit().catch((err) => {
            new __1.ErrorCustom({ at: `Match.upsert() Match.playersInit()`, err });
        });
        await this.playersRatingUpdate().catch((err) => {
            new __1.ErrorCustom({ at: `Match.upsert() Match.playersRatingUpdate()`, err });
            return Promise.reject(err);
        });
        const recordUpsertPromises = [];
        if (this.type.name === `league` && await this.pg.query(pgFormat(`SELECT COUNT(*)::integer FROM league_registrations WHERE category_id = $1 AND dnf_after_weeks IS NOT NULL AND season_id = $2 AND user_id IN (%s)`, this.userIds.join(`,`)), [this.categoryId, this.value.seasonId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0].count;
        }) === 0) {
            Match.sides.forEach((side) => {
                this.leagueTableRecords[side] = new _1.LeagueTableRecord({
                    io: this.io,
                    match: this,
                    pg: this.pg,
                    side,
                    value: { divisionId: this.value.divisionId, seasonId: this.value.seasonId }
                });
                recordUpsertPromises.push(this.leagueTableRecords[side].upsert());
            });
        }
        await Promise.all(recordUpsertPromises).catch((err) => {
            new __1.ErrorCustom({ at: `Match.upsert() Promise.all(recordUpsertPromises)`, err });
            return Promise.reject(err);
        });
    }
    get typeFactor() {
        return this.type.weight;
    }
    async upsert() {
        if (!this.initialized) {
            await this.init().catch((err) => {
                new __1.ErrorCustom({ at: `Match.upsert() Match.init()`, err });
                return Promise.reject(err);
            });
        }
        const upsertValueEntries = Object.entries(this.upsertValue);
        const matchExists = await (async () => {
            if (this.type.name === `playOff`) {
                return await this.pg.query(`SELECT * FROM matches WHERE season_id = $1 AND division_id = $2 AND round = $3 AND series = $4 AND leg = $5`, [this.value.seasonId, this.value.divisionId, this.value.round, this.value.series, this.value.leg]).then((result) => {
                    return Boolean(result.rowCount);
                });
            }
            return false;
        })();
        const queryString = (() => {
            if (this.type.name === `league`) {
                return pgFormat(`INSERT INTO matches(%s) VALUES(%s) ON CONFLICT (id)
                        DO UPDATE SET %s WHERE EXCLUDED.away_id = $1 AND EXCLUDED.home_id = $2 AND EXCLUDED.season_id = $3 AND EXCLUDED.division_id = $4 AND EXCLUDED.result_written IS NULL RETURNING *
`, __1.Tomwork.columnListGet(upsertValueEntries.map(([columnName]) => {
                    return columnName;
                })), __1.Tomwork.insertValuesGet(upsertValueEntries.map(([, value]) => {
                    return value;
                })), __1.Tomwork.updateSetGet(Object.fromEntries(upsertValueEntries)));
            }
            if (this.type.name === `playOff`) {
                if (matchExists) {
                    return pgFormat(`UPDATE matches SET %s WHERE season_id = $1 AND division_id = $2 AND round = $3 AND series = $4 AND leg = $5 RETURNING *`, __1.Tomwork.updateSetGet(Object.fromEntries(upsertValueEntries)));
                }
                return pgFormat(`INSERT INTO matches(%s) VALUES(%s) ON CONFLICT (id)
                        DO UPDATE SET %s WHERE EXCLUDED.season_id = $1 AND EXCLUDED.division_id = $2 AND EXCLUDED.round = $3 AND EXCLUDED.series = $4 AND EXCLUDED.leg = %5 RETURNING *
`, __1.Tomwork.columnListGet(upsertValueEntries.map(([columnName]) => {
                    return columnName;
                })), __1.Tomwork.insertValuesGet(upsertValueEntries.map(([, value]) => {
                    return value;
                })), __1.Tomwork.updateSetGet(Object.fromEntries(upsertValueEntries)));
            }
            return pgFormat(`INSERT INTO matches(%s) SELECT %s WHERE NOT EXISTS (SELECT 1 FROM matches WHERE %s AND week IS NOT NULL AND leg IS NULL AND result_written IS NOT NULL) RETURNING *`, __1.Tomwork.columnListGet(upsertValueEntries.map(([columnName]) => {
                return columnName;
            })), __1.Tomwork.insertValuesGet(upsertValueEntries.map(([, value]) => {
                return value;
            })), __1.Tomwork.selectClauseGet(this.findValue));
        })();
        const values = (() => {
            switch (this.type.name) {
                case `league`:
                    return [this.value.awayId, this.value.homeId, this.value.seasonId, this.value.divisionId];
                case `playOff`:
                    return [this.value.seasonId, this.value.divisionId, this.value.round, this.value.series, this.value.leg];
            }
        })();
        return await this.pg.query(queryString, values).then(async (matchUpserted) => {
            const resultParsed = __1.Tomwork.queryParse(matchUpserted);
            if (!resultParsed.rows[0]) {
                return Promise.reject(`Match not added`);
            }
            this.value = { ...resultParsed.rows[0], ...this.value };
            await this.tablesSync().catch((err) => {
                new __1.ErrorCustom({ at: `Match.upsert() matches.findOneAndUpdate()`, err });
                return Promise.reject(err);
            });
            const players = Object.values(this.players).reduce((a, player) => {
                return { ...a, ...new Row_1.Row({ value: player.valuePublic }).valueIndexed };
            }, {});
            await Promise.all(Object.values(this.leagueTableRecords).map(async (leagueTableRecord) => {
                return leagueTableRecord.formUpdate();
            })).catch((err) => {
                new __1.ErrorCustom({ at: `Match.upsert() Promise.all(leagueTableRecord.formUpdate())`, err });
                return Promise.reject(err);
            });
            const leagueTableRecords = Object.values(this.leagueTableRecords).reduce((a, leagueTableRecord) => {
                return { ...a, ...new Row_1.Row({ value: leagueTableRecord.valuePublic }).valueIndexed };
            }, {});
            this.io.emitCustom(`fieldPost`, {
                categoryId: this.categoryId,
                createdById: this.createdById,
                ...(!__1.Tomwork.emptyIs(this.leagueTableRecords) && { leagueTableRecords }),
                matches: new Row_1.Row({ value: this.valuePublic }).valueIndexed,
                players
            });
            return Promise.resolve(resultParsed);
        }).catch(async (err) => {
            console.log(queryString);
            console.log(values);
            this.error({ message: `Match not added`, status: 500 });
            new __1.ErrorCustom({ at: `Match.upsert()`, err });
            return Promise.reject(err);
        });
    }
    get upsertValue() {
        return (({ id, awayId, awayGoals, canceledAt, canceledBy, createdBy, divisionId, homeId, homeGoals, leg, matchOrder, overtime, playedAt, resultWritten = new Date(), round, seasonId, series, updated, week }) => {
            return {
                ...(typeof id !== `undefined` && { id }),
                awayId,
                awayGoals,
                ...(typeof canceledAt !== `undefined` && { canceledAt }),
                ...(typeof canceledBy !== `undefined` && { canceledBy }),
                createdBy,
                divisionId,
                homeId,
                homeGoals,
                ...(typeof leg !== `undefined` && { leg }),
                ...(typeof matchOrder !== `undefined` && { matchOrder }),
                ...(overtime && { overtime }),
                playedAt,
                resultWritten,
                ...(typeof round !== `undefined` && { round }),
                ...(Match.leagueTypes.includes(this.type.name) && { seasonId }),
                ...(typeof series !== `undefined` && { series }),
                ...(typeof updated !== `undefined` && { updated }),
                ...(typeof week !== `undefined` && { week })
            };
        })(this.value);
    }
    get userIds() {
        return [this.value.homeId, this.value.awayId];
    }
    get userNonCancelling() {
        return { away: `home`, home: `away` }[this.value.canceledBy];
    }
    async validityGet() {
        if (!this.initialized) {
            await this.init().catch((err) => {
                new __1.ErrorCustom({ at: `Match.validityGet() Match.init()`, err });
                return Promise.reject(err);
            });
        }
        const error = await this.errorGet();
        if (error) {
            new __1.ErrorCustom({ at: `Match.validityGet()`, err: error.message });
            this.error(error);
        }
        return Promise.resolve(!error);
    }
    get valuePublic() {
        return (({ id, awayId, awayGoals, canceledAt, canceledBy, divisionId, homeId, homeGoals, leg, matchOrder, overtime, playedAt, resultWritten, round, seasonId, series, week }) => {
            return {
                id,
                awayId,
                awayGoals,
                ...(typeof canceledAt !== `undefined` && { canceledAt }),
                ...(typeof canceledBy !== `undefined` && { canceledBy }),
                divisionId,
                homeId,
                homeGoals,
                ...(typeof leg !== `undefined` && { leg }),
                ...(typeof matchOrder !== `undefined` && { matchOrder }),
                ...(overtime && { overtime }),
                playedAt,
                resultWritten,
                ...(typeof round !== `undefined` && { round }),
                ...(Match.leagueTypes.includes(this.type.name) && { seasonId }),
                ...(typeof series !== `undefined` && { series }),
                typeId: this.typeId,
                ...(typeof week !== `undefined` && { week })
            };
        })(this.value);
    }
    get weekCurrent() {
        return Moment().diff(Moment(this.season.seasonStart), `w`);
    }
}
exports.Match = Match;
//# sourceMappingURL=Match.js.map