"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const table_1 = require("../../modules/table");
const modules_1 = require("../../modules");
const row_1 = require("../../modules/row");
module.exports = ({ app, pg, route }) => {
    app.get(route, async (req, res) => {
        const params = {
            categoryId: { required: false },
            divisionId: { required: false },
            seasonId: { required: false }
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const table = new table_1.Table({
            res,
            value: await pg.query(`SELECT league_table_records.*, league_registrations.dnf_after_weeks, users.verification_code IS NULL AS valid,
COALESCE((SELECT ARRAY_AGG(result_get(league_table_records.user_id, home_id, away_id, home_goals, away_goals, overtime)) FROM (SELECT * FROM matches
                  WHERE league_table_records.user_id = ANY(ARRAY[home_id, away_id]) AND 
                  result_written IS NOT NULL AND
                  league_table_records.division_id = division_id AND 
                  league_registrations.dnf_after_weeks IS NULL AND 
                  league_table_records.season_id = matches.season_id AND 
                  (SELECT EXISTS(SELECT * FROM league_registrations AS league_registrations_other WHERE ((CASE WHEN matches.home_id = league_table_records.user_id THEN matches.away_id ELSE matches.home_id END) = user_id) 
                                 AND league_registrations_other.category_id = divisions.category_id 
                                 AND season_id = matches.season_id 
                                 AND dnf_after_weeks IS NULL))
                  ORDER BY result_written DESC LIMIT 5) AS form_matches), ARRAY[]::varchar[]) AS form FROM league_table_records
LEFT JOIN divisions ON league_table_records.division_id = divisions.id
INNER JOIN league_registrations ON league_registrations.season_id = league_table_records.season_id AND league_registrations.user_id = league_table_records.user_id  AND (CASE WHEN league_table_records.division_id IS NULL THEN (league_registrations.category_id = league_table_records.category_id) ELSE league_registrations.category_id = divisions.category_id END)
LEFT JOIN users ON users.id = league_table_records.user_id
        WHERE league_table_records.division_id = $1 AND league_table_records.season_id = $2 AND users.verification_code IS NULL`, [query.value.divisionId, query.value.seasonId]).then((result) => {
                return modules_1.Tomwork.queryParse(result).rows.map((leagueTableRecord) => {
                    return new row_1.LeagueTableRecord({ form: leagueTableRecord.form, value: leagueTableRecord }).valuePublic;
                });
            })
        });
        table.send();
    });
};
//# sourceMappingURL=leagueTableRecords.js.map