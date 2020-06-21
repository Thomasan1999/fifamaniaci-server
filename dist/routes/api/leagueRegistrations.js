"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const table_1 = require("../../modules/table");
const modules_1 = require("../../modules");
const row_1 = require("../../modules/row");
const LeagueSeasons_1 = require("../../modules/table/LeagueSeasons");
module.exports = ({ app, io, pg, route }) => {
    app.get(route, async (req, res) => {
        const params = {
            categoryId: {},
            seasonId: { required: false }
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const seasonThisId = query.value.seasonId || (await new LeagueSeasons_1.LeagueSeasons({ pg }).findLast()).id;
        const table = new table_1.Table({
            res,
            value: await pg.query(`SELECT league_registrations.*, league_final_positions.position AS final_position, CASE WHEN dnf_after_weeks IS NULL THEN NULL ELSE penalty_points END, users.verification_code IS NULL AS valid FROM league_registrations
                    LEFT JOIN league_final_positions ON league_final_positions.category_id = league_registrations.category_id AND league_final_positions.season_id = $2 AND league_final_positions.user_id = league_registrations.user_id
                     LEFT JOIN users ON users.id = league_registrations.user_id
                     WHERE canceled IS NOT TRUE AND league_registrations.season_id = $1 AND league_registrations.category_id = $3
`, [seasonThisId, seasonThisId - 1, query.value.categoryId]).then((result) => {
                return result.rows;
            })
        });
        table.send();
    });
    app.post(route, async (req, res) => {
        const params = {
            categoryId: {}
        };
        const query = new modules_1.Query({ params, query: req.body, res });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, query: { id: query.createdById }, res });
        if (!await user.authenticate({ verifiedOnly: false })) {
            return;
        }
        await user.find().catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}.post() User.find()`, err });
        });
        const leagueRegistration = new row_1.LeagueRegistration({ io, pg, res, user, value: { ...query.value, userId: query.createdById } });
        await leagueRegistration.insert().then(({ rows: [{ id, categoryId, userId }] }) => {
            res.json({ id, categoryId, userId });
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}.post() LeagueRegistration.insert()`, err });
        });
    });
    app.delete(route, async (req, res) => {
        const params = {
            categoryId: {}
        };
        const query = new modules_1.Query({ params, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, query: { id: query.createdById }, res });
        if (!await user.authenticate({})) {
            return;
        }
        await user.find().catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}.post() User.find()`, err });
        });
        const leagueRegistration = new row_1.LeagueRegistration({ io, pg, res, user, value: { ...query.value, userId: query.createdById } });
        await leagueRegistration.cancel().then(({ rows: [{ id }] }) => {
            res.json({ id });
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}.post() LeagueRegistration.cancel()`, err });
        });
    });
};
//# sourceMappingURL=leagueRegistrations.js.map