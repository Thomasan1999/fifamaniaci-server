import {RouteArguments}                                       from '../../types/routes';
import {Table}                                                from '../../modules/table';
import {Query, Tomwork}                                       from '../../modules';
import {LeagueTableRecord}                                    from '../../modules/row';
import {QueryParamsArgument, QueryValue}                      from '../../modules/Query';
import * as Pg                                                from 'pg';
import {LeagueTableRecordValue, LeagueTableRecordValuePublic} from '../../modules/row/LeagueTableRecord';
import {MatchForm}                                            from '../../modules/row/Match';

module.exports = ({app, pg, route}: RouteArguments) =>
{
    app.get(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            categoryId: {required: false},
            divisionId: {required: false},
            seasonId: {required: false}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'categoryId' | 'divisionId' | 'seasonId'> }>

        const query: QueryThis = new Query({authRequired: false, params, query: req.query, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        type TableThisValue = LeagueTableRecordValuePublic
        type TableThis = Merge<Table, { value?: TableThisValue[] }>;

        const table: TableThis = new Table({
            res,
            value: await pg.query(
                    `SELECT league_table_records.*, league_registrations.dnf_after_weeks, users.verification_code IS NULL AS valid,
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
        WHERE league_table_records.division_id = $1 AND league_table_records.season_id = $2 AND users.verification_code IS NULL`,
                [query.value.divisionId, query.value.seasonId]
            ).then((result: Merge<Pg.QueryResult, {rows: Merge<LeagueTableRecordValue, { form: MatchForm }>[]}>) =>
            {
                return Tomwork.queryParse(result).rows.map((leagueTableRecord) =>
                {
                    return new LeagueTableRecord({form: leagueTableRecord.form, value: leagueTableRecord}).valuePublic;
                });
            })
        }) as TableThis;

        table.send();
    });
};
