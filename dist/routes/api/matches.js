"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const table_1 = require("../../modules/table");
const modules_1 = require("../../modules");
const row_1 = require("../../modules/row");
module.exports = ({ app, io, pg, route }) => {
    app.get(route, async (req, res) => {
        const params = {
            categoryId: {}
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const table = new table_1.Table({
            res,
            value: await pg.query(`
SELECT matches.id,away_id,away_goals,canceled_at,canceled_by,division_id,home_id,home_goals,leg,match_order,overtime,played_at,result_written,round,matches.season_id,series,divisions.match_type_id AS type_id, week FROM matches
INNER JOIN divisions ON divisions.id = matches.division_id
LEFT JOIN league_seasons ON league_seasons.id = matches.season_id
LEFT JOIN league_registrations ON divisions.category_id = league_registrations.category_id AND league_registrations.canceled IS NOT TRUE AND league_registrations.category_id = divisions.category_id AND league_registrations.season_id = matches.season_id AND league_registrations.dnf_after_weeks IS NOT NULL AND league_registrations.user_id = ANY(array[matches.home_id, matches.away_id])
WHERE divisions.category_id = $1 AND (matches.week IS NULL OR ((league_seasons.season_start + (matches.week ||' weeks')::interval) < current_timestamp)) AND league_registrations IS NULL
`, [query.value.categoryId]).then((result) => {
                return result.rows;
            })
        });
        table.send();
    });
    app.post(route, async (req, res) => {
        const params = {
            awayId: {},
            awayGoals: {},
            categoryId: {},
            canceledAt: { required: false },
            canceledBy: { required: false },
            createdBy: { required: false },
            homeId: {},
            homeGoals: {},
            overtime: { required: false },
            playedAt: {},
            typeId: {}
        };
        const query = new modules_1.Query({ params, query: req.body, res });
        if (!query.valid) {
            return;
        }
        const user = new row_1.User({ auth: query.auth, io, pg, res });
        if (!await user.authenticate()) {
            return;
        }
        const match = new row_1.Match({ createdById: query.createdById, io, pg, query: { auth: query.auth }, res, value: query.value });
        if (!await match.validityGet()) {
            return;
        }
        await match.upsert().then(() => {
            res.status(204).end();
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}.post()`, err });
        });
    });
};
//# sourceMappingURL=matches.js.map