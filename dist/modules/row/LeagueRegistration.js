"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeagueRegistration = void 0;
const __1 = require("..");
const _1 = require(".");
const Row_1 = require("./Row");
const Moment = require("moment-timezone");
const LeagueSeasons_1 = require("../table/LeagueSeasons");
class LeagueRegistration extends Row_1.Row {
    constructor({ io, pg, req, res, user, value }) {
        super({ io, pg, req, res, value });
        this.initialized = false;
        this.user = user;
        this.valid = Boolean(typeof value.valid === `undefined` ? !(this.user && this.user.value.verificationCode) : value.valid);
    }
    async cancel() {
        if (!this.initialized) {
            await this.init().catch((err) => {
                new __1.ErrorCustom({ at: `LeagueRegistration.cancel() User.find()`, err });
                return Promise.reject(err);
            });
        }
        if (Moment(this.season.registrationTo).diff(Moment()) < 0) {
            const err = `Registration expired`;
            new __1.ErrorCustom({ at: `LeagueRegistration.upsert() User.find()`, err });
            this.res.status(422).json({ message: err });
            return Promise.reject(err);
        }
        const { categoryId, seasonId, userId } = this.value;
        const promises = await Promise.all([
            this.pg.query(`UPDATE league_registrations SET canceled = TRUE WHERE category_id = $1 AND canceled IS NOT TRUE AND season_id = $2 AND user_id = $3 RETURNING *`, [categoryId, seasonId, userId]).then((result) => {
                return __1.Tomwork.queryParse(result);
            }),
            new _1.LeagueTableRecord({ io: this.io, pg: this.pg, value: { categoryId, seasonId, userId } }).delete()
        ]).then(([leagueRegistrationCanceled, leagueTableRecordDeleted]) => {
            this.value = { ...leagueRegistrationCanceled.rows[0], ...this.value };
            this.io.emitCustom(`fieldDelete`, {
                leagueRegistrations: {
                    [this.value.id]: {
                        categoryId: this.value.categoryId,
                        seasonId: this.value.seasonId
                    }
                }
            });
            return Promise.resolve([leagueRegistrationCanceled, leagueTableRecordDeleted]);
        }).catch((err) => {
            new __1.ErrorCustom({ at: `LeagueRegistration.cancel()`, err });
            this.res.status(422).json({ message: err });
            return Promise.reject(err);
        });
        return promises[0];
    }
    // async disqualify(): Promise<void>
    // {
    //     if (!this.initialized)
    //     {
    //         await this.user.find().catch((err) =>
    //         {
    //             new ErrorCustom({at: `LeagueRegistration.insert() User.find()`, err});
    //             return Promise.reject(err);
    //         });
    //     }
    //
    //     const {categoryId, userId} = this.value;
    //     const seasonId = this.season.id;
    //
    //     await Promise.all([
    //         this.pg.query(
    //             `UPDATE league_registrations SET dnf_after_weeks = $1 WHERE category_id = $2 AND user_id = $3 AND season_di = $4`,
    //             [/*dnfAfterWeeksGet*/, categoryId, userId, seasonId]
    //         ).then((result: LeagueRegistrationQueryResult) =>
    //         {
    //             return Tomwork.queryParse(result);
    //         })
    //     ]).catch((err) =>
    //     {
    //         new ErrorCustom({at: `LeagueRegistration.disqualify() Promise.all()`, err});
    //         return Promise.reject(err);
    //     });
    // }
    async init() {
        this.initialized = true;
        this.season = await (this.value.seasonId ? this.pg.query(`SELECT * FROM league_seasons WHERE id = $1`, [this.value.seasonId]).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        }) : new LeagueSeasons_1.LeagueSeasons({ pg: this.pg }).findLast());
        this.value.seasonId = this.season.id;
    }
    async insert() {
        if (!this.initialized) {
            await this.init().catch((err) => {
                new __1.ErrorCustom({ at: `LeagueRegistration.insert() LeagueRegistration.init()`, err });
                return Promise.reject(err);
            });
        }
        const { io, pg, season } = this;
        if (Moment(season.registrationTo).diff(Moment()) < 0) {
            const err = `Registration expired`;
            new __1.ErrorCustom({ at: `LeagueRegistration.insert() Moment(season.registrationTo).diff()`, err });
            this.res.status(422).json({ message: err });
            return Promise.reject(err);
        }
        if (!this.user.value.id) {
            await this.user.find().catch((err) => {
                new __1.ErrorCustom({ at: `LeagueRegistration.insert() User.find()`, err });
                return Promise.reject(err);
            });
        }
        const { id: userId } = this.user.value;
        const { categoryId } = this.value;
        return await Promise.all([
            this.pg.query(`INSERT INTO league_registrations(category_id, completed, season_id, user_id) 
                            SELECT $1, $2, $3, $4 WHERE NOT EXISTS (SELECT 1 FROM league_registrations 
                            WHERE category_id = $1 AND canceled IS NOT TRUE AND season_id = $3 AND user_id = $4) RETURNING *`, [categoryId, this.valid ? new Date() : null, season.id, userId]),
            new _1.LeagueTableRecord({
                io,
                pg,
                season,
                value: { ...this.value, categoryId, userId, ...(!this.valid && { valid: this.valid }) }
            }).upsert()
        ]).then(async ([leagueRegistrationInserted, leagueTableInserted]) => {
            const leagueRegistrationResult = __1.Tomwork.queryParse(leagueRegistrationInserted);
            this.value = { ...this.value, ...leagueRegistrationResult.rows[0] };
            return await new _1.Player({
                pg,
                value: { categoryId: this.value.categoryId, userId: this.value.userId, ...(!this.valid && { valid: this.valid }) }
            }).upsert().then(async (playerUpsertInfo) => {
                const leagueRegistrationIndexed = new Row_1.Row({ value: { ...this.valuePublic, createdById: this.value.userId } }).valueIndexed;
                const output = {
                    categoryId: categoryId,
                    createdById: userId,
                    leagueRegistrations: { ...leagueRegistrationIndexed }
                };
                if (this.valid) {
                    const player = playerUpsertInfo.rows[0];
                    delete player.categoryId;
                    const playerIndexed = new Row_1.Row({ value: player }).valueIndexed;
                    output.players = { ...playerIndexed };
                    require(`../../routes/mail/leagueRegistration`)({
                        categoryId: categoryId,
                        pg,
                        ...this.user.value,
                        variableSymbol: this.user.value.variableSymbol.toString().padStart(10, `0`)
                    });
                }
                if (leagueTableInserted.rows[0].divisionId) {
                    const leagueTableRecordIndexed = new Row_1.Row({ value: new _1.LeagueTableRecord({ value: leagueTableInserted.rows[0] }).valuePublic }).valueIndexed;
                    output.leagueTableRecords = { ...leagueTableRecordIndexed };
                }
                this.io.emitCustom(`fieldPost`, output);
                return Promise.resolve(leagueRegistrationResult);
            }).catch((err) => {
                new __1.ErrorCustom({ at: `LeagueRegistration.insert() Promise.all() Player.upsert()`, err });
                return Promise.reject(err);
            });
        }).catch((err) => {
            new __1.ErrorCustom({ at: `LeagueRegistration.insert() Promise.all()`, err });
            return Promise.reject(err);
        });
    }
    get seasonStartedIs() {
        return Moment().diff(Moment(this.season.seasonStart)) >= 0;
    }
    get valuePublic() {
        return (({ id, completed, dnfAfterWeeks, seasonId, userId }) => {
            return {
                id,
                ...(typeof completed !== `undefined` && { completed }),
                ...(typeof dnfAfterWeeks !== `undefined` && { dnfAfterWeeks }),
                seasonId,
                userId,
                valid: this.valid
            };
        })(this.value);
    }
}
exports.LeagueRegistration = LeagueRegistration;
//# sourceMappingURL=LeagueRegistration.js.map