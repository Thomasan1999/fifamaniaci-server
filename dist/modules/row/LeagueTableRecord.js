"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const _1 = require(".");
const Moment = require("moment-timezone");
const Row_1 = require("./Row");
const LeagueSeasons_1 = require("../table/LeagueSeasons");
const pgFormat = require("pg-format");
const types_1 = require("../types");
class LeagueTableRecord extends Row_1.Row {
    constructor({ form, io, match, pg, season, side, valid = true, value }) {
        super({
            io,
            pg,
            value: {
                ...value,
                ...(match && {
                    divisionId: match.value.divisionId,
                    userId: value.userId || match.value[`${side}Id`]
                })
            }
        });
        this.initialized = false;
        this.valid = true;
        this.form = form;
        this.match = match;
        this.season = season;
        this.side = side;
        this.valid = valid;
    }
    async delete() {
        return await this.pg.query(`DELETE FROM league_table_records WHERE category_id = $1 AND season_id = $2 AND user_id = $3`, [this.value.categoryId, this.value.seasonId, this.value.userId]).catch((err) => {
            new __1.ErrorCustom({ at: `LeagueTableRecord.delete() DELETE FROM league_table_records`, err });
            return Promise.reject(err);
        });
    }
    get fieldsFutRelated() {
        return {
            ...(this.fut && {
                overtimeLosses: 0,
                overtimeWins: 0
            }),
            ...(!this.fut && {
                draws: 0
            })
        };
    }
    async formUpdate() {
        this.form = await this.pg.query(`SELECT ARRAY_AGG(result_get($1, home_id, away_id, home_goals, away_goals, overtime)) AS form FROM (SELECT * FROM matches 
                              WHERE $1 IN (away_id, home_id) AND division_id = $2 AND season_id = $3 AND result_written IS NOT NULL ORDER BY result_written DESC LIMIT 5) AS form_matches`, [this.value.userId, this.value.divisionId, this.value.seasonId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0].form;
        });
        return Promise.resolve(this.form);
    }
    async futIs() {
        const categoryId = this.division ? this.division.value.categoryId : this.value.categoryId;
        return await this.pg.query(`SELECT * FROM categories WHERE id = $1`, [categoryId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0].name.includes(`Fut`);
        });
    }
    async init() {
        this.initialized = true;
        if (!this.season) {
            this.season = await (this.value.seasonId ? this.pg.query(`SELECT * FROM league_seasons WHERE id = $1`, [this.value.seasonId]).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0];
            }) : new LeagueSeasons_1.LeagueSeasons({ pg: this.pg }).findLast(this.value.divisionId ? {} : { seasonStart: { $lte: new Date() } }));
        }
        this.value.seasonId = this.season.id;
        if (!this.value.divisionId) {
            const { categoryId } = this.value;
            const matchTypeId = (await this.pg.query(`SELECT * FROM matches_types WHERE name = 'league'`).then((result) => {
                return __1.Tomwork.queryParse(result).rows[0];
            })).id;
            this.division = await (async () => {
                if (this.valid === false || !this.seasonStartedIs) {
                    return null;
                }
                const divisionFound = new _1.Division({ io: this.io, pg: this.pg, res: this.res, value: { categoryId, matchTypeId } });
                await divisionFound.init().catch((err) => {
                    new __1.ErrorCustom({ at: `LeagueTableRecord.init() Division.init()`, err });
                    return Promise.reject(err);
                });
                await divisionFound.upsert().catch((err) => {
                    new __1.ErrorCustom({ at: `LeagueTableRecord.init() Division.upsert()`, err });
                    return Promise.reject(err);
                });
                this.value.divisionId = divisionFound.value.id;
                return divisionFound;
            })();
            this.fut = await this.futIs();
        }
    }
    get matchResult() {
        const goals = this.match.value[`${this.side}Goals`];
        const goalsOther = this.match.value[`${this.side === `home` ? `away` : `home`}Goals`];
        const goalComparison = (() => {
            if (goals > goalsOther) {
                return `win`;
            }
            else if (goals === goalsOther) {
                return `draw`;
            }
            return `loss`;
        })();
        const { overtime } = this.match.value;
        return `${overtime ? `overtime` : ``}${overtime ? goalComparison[0].toUpperCase() : goalComparison[0]}${goalComparison.slice(1)}`;
    }
    get matchResultColumnName() {
        return {
            draw: `draws`,
            loss: `losses`,
            overtimeLoss: `overtimeLosses`,
            overtimeWin: `overtimeWins`,
            win: `wins`
        }[this.matchResult];
    }
    get seasonStartedIs() {
        return Moment().diff(Moment(this.season.seasonStart)) >= 0;
    }
    get sideOther() {
        return { away: `home`, home: `away` }[this.side];
    }
    async upsert() {
        if (!this.initialized) {
            await this.init().catch((err) => {
                new __1.ErrorCustom({ at: `LeagueTableRecord.upsert() LeagueTableRecord.init()`, err });
                return Promise.reject(err);
            });
        }
        const { io, pg, res, value: { divisionId, seasonId } } = this;
        const matchColumns = this.match ? {
            goalsAgainst: this.match.value[`${this.sideOther}Goals`],
            goalsFor: this.match.value[`${this.side}Goals`],
            matches: 1,
            [this.matchResultColumnName]: 1,
            points: { draw: 1, loss: 0, overtimeLoss: 1, overtimeWin: 2, win: 3 }[this.matchResult]
        } : null;
        const insertValue = {
            ...((!this.seasonStartedIs || this.valid === false) && {
                categoryId: this.value.categoryId || null
            }),
            ...(this.seasonStartedIs && this.valid !== false && {
                divisionId: (this.match && this.match.value.divisionId) || this.value.divisionId || null
            }),
            ...(this.match && { ...matchColumns }),
            seasonId,
            userId: this.value.userId
        };
        // @ts-ignore
        const promises = await Promise.all([
            this.pg.query(pgFormat(`INSERT INTO league_table_records(%s) VALUES(%s)
                                ON CONFLICT(COALESCE(category_id, -1), COALESCE(division_id, -1), season_id, user_id) DO %s RETURNING *`, __1.Tomwork.columnListGet(Object.keys(insertValue)), __1.Tomwork.insertValuesGet(Object.values(insertValue)), matchColumns ? `UPDATE SET ${__1.Tomwork.updateSetGet(matchColumns, { onConflict: true, tableName: `leagueTableRecords` })}` : `NOTHING`)).then((result) => {
                return __1.Tomwork.queryParse(result);
            }),
            ...(this.value.divisionId ? [new _1.LeagueSeasonsDivision({ io, pg, res, value: { divisionId, seasonId } }).upsert()] : [])
        ]).catch((err) => {
            new __1.ErrorCustom({ at: `LeagueTableRecord.upsert() Promise.all()`, err });
            return Promise.reject(err);
        });
        this.value = { ...this.value, ...promises[0].rows[0] };
        return promises[0];
    }
    async validate() {
        if (!this.initialized) {
            await this.init().catch((err) => {
                new __1.ErrorCustom({ at: `LeagueTableRecord.upsert() LeagueTableRecord.init()`, err });
                return Promise.reject(err);
            });
        }
        const { id } = this.value;
        const fieldsFutRelatedSetList = Object.entries(this.fieldsFutRelated).map(([fieldFutRelatedKey, fieldFutRelatedValue]) => {
            return `${new types_1.VueString(fieldFutRelatedKey).caseSnakeTo().toString()} = ${fieldFutRelatedValue}`;
        }).join(`, `);
        return this.pg.query(pgFormat(`UPDATE league_table_records SET %s WHERE id = $1 RETURNING *`, this.seasonStartedIs ? pgFormat(`division_id = %s, %s, category_id = NULL`, this.value.divisionId, fieldsFutRelatedSetList) : ``), [id]).then(async (result) => {
            this.value = { ...this.value, ...result.rows[0] };
            const { io, pg, res } = this;
            const { divisionId, seasonId } = this.value;
            if (this.seasonStartedIs) {
                await new _1.LeagueSeasonsDivision({ io, pg, res, value: { divisionId, seasonId } }).upsert().catch((err) => {
                    new __1.ErrorCustom({ at: `leagueTableRecords.updateOne() LeagueSeasonsDivisions.upsert()`, err });
                });
            }
            return Promise.resolve(result);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `leagueTableRecords.updateOne()`, err });
            return Promise.reject(err);
        });
    }
    get valuePublic() {
        return (({ id, divisionId, dnfAfterWeeks, draws, goalsAgainst, goalsFor, losses, matches, overtimeLosses, overtimeWins, points, seasonId, userId, wins }) => {
            return {
                id,
                divisionId,
                ...(typeof dnfAfterWeeks === `number` && { dnfAfterWeeks }),
                ...(typeof draws !== `undefined` && { draws }),
                form: this.form,
                goalDifference: goalsFor - goalsAgainst,
                losses,
                matches,
                ...(typeof overtimeLosses !== `undefined` && { overtimeLosses }),
                ...(typeof overtimeWins !== `undefined` && { overtimeWins }),
                points,
                score: [goalsFor, goalsAgainst],
                seasonId,
                userId,
                wins
            };
        })(this.value);
    }
}
exports.LeagueTableRecord = LeagueTableRecord;
//# sourceMappingURL=LeagueTableRecord.js.map