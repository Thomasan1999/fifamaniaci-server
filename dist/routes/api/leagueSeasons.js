"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const table_1 = require("../../modules/table");
const modules_1 = require("../../modules");
module.exports = ({ app, pg, route }) => {
    app.get(route, async (req, res) => {
        const table = new table_1.Table({
            res,
            value: await pg.query(`SELECT division_size, league_seasons.id, month, COALESCE((SELECT array_agg(array[divisions.id, category_id]) FROM divisions                
                    INNER JOIN league_seasons_divisions ON league_seasons_divisions.season_id = league_seasons.id 
                    INNER JOIN categories ON divisions.category_id = categories.id
                    INNER JOIN matches_types ON divisions.match_type_id = matches_types.id
                    WHERE matches_types.name = 'league' AND league_seasons_divisions.division_id = divisions.id), array[]::integer[][]) AS divisions, 
play_off_end, play_off_rounds_limit, play_off_start, play_off_wins_limit, quarter, registration_to, season_end, season_start FROM league_seasons WHERE league_seasons.id < 4
`).then((result) => {
                return modules_1.Tomwork.queryParse(result).rows.map((row) => {
                    return {
                        ...row,
                        ...(row.divisions && {
                            divisions: row.divisions.reduce((a, leagueSeasonDivision) => {
                                if (!a[leagueSeasonDivision[1]]) {
                                    a[leagueSeasonDivision[1]] = [];
                                }
                                a[leagueSeasonDivision[1]].push(leagueSeasonDivision[0]);
                                return a;
                            }, {})
                        })
                    };
                });
            })
        });
        table.send();
    });
};
//# sourceMappingURL=leagueSeasons.js.map