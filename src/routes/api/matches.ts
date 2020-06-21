import * as Pg                           from 'pg';
import {Table}                           from '../../modules/table';
import {ErrorCustom, Query}              from '../../modules';
import {Match, User}                     from '../../modules/row';
import {QueryParamsArgument, QueryValue} from '../../modules/Query';
import {MatchValue}                      from '../../modules/row/Match';
import {RouteArguments}                  from '../../types/routes';

module.exports = ({app, io, pg, route}: RouteArguments) =>
{
    app.get(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            categoryId: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'categoryId'> }>

        const query: QueryThis = new Query({authRequired: false, params, query: req.query, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        type TableThisValue = Merge<Omit<MatchValue, 'categoryId' | 'createdBy' | 'divisionId' | 'updated'>, { typeId: number }>
        type TableThis = Merge<Table, { value?: TableThisValue[] }>;

        const table: TableThis = new Table({
            res,
            value: await pg.query(`
SELECT matches.id,away_id,away_goals,canceled_at,canceled_by,division_id,home_id,home_goals,leg,match_order,overtime,played_at,result_written,round,matches.season_id,series,divisions.match_type_id AS type_id, week FROM matches
INNER JOIN divisions ON divisions.id = matches.division_id
LEFT JOIN league_seasons ON league_seasons.id = matches.season_id
LEFT JOIN league_registrations ON divisions.category_id = league_registrations.category_id AND league_registrations.canceled IS NOT TRUE AND league_registrations.category_id = divisions.category_id AND league_registrations.season_id = matches.season_id AND league_registrations.dnf_after_weeks IS NOT NULL AND league_registrations.user_id = ANY(array[matches.home_id, matches.away_id])
WHERE divisions.category_id = $1 AND (matches.week IS NULL OR ((league_seasons.season_start + (matches.week ||' weeks')::interval) < current_timestamp)) AND league_registrations IS NULL
`, [query.value.categoryId]).then((result: Pg.QueryResult<Merge<Pick<MatchValue, 'id' | 'awayId' | 'awayGoals' | 'canceledAt' | 'canceledBy' | 'divisionId' | 'homeId' | 'homeGoals' | 'leg' | 'matchOrder' | 'overtime' | 'playedAt' | 'resultWritten' | 'round' | 'seasonId' | 'series' | 'week'>, {typeId: number}>>) =>
            {
                return result.rows;
            })
        }) as TableThis;

        table.send();
    });

    app.post(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            awayId: {},
            awayGoals: {},
            categoryId: {},
            canceledAt: {required: false},
            canceledBy: {required: false},
            createdBy: {required: false},
            homeId: {},
            homeGoals: {},
            overtime: {required: false},
            playedAt: {},
            typeId: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'categoryId' | 'awayId' | 'awayGoals' | 'canceledAt' | 'canceledBy' | 'createdBy' | 'createdBy' | 'createdById' | 'homeId' | 'homeGoals' | 'overtime' | 'playedAt' | 'typeId'> }>

        const query: QueryThis = new Query({params, query: req.body, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const user: User = new User({auth: query.auth, io, pg, res});

        if (!await user.authenticate())
        {
            return;
        }

        const match: Match = new Match({createdById: query.createdById, io, pg, query: {auth: query.auth}, res, value: query.value});

        if (!await match.validityGet())
        {
            return;
        }

        await match.upsert().then(() =>
        {
            res.status(204).end();
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}.post()`, err});
        });
    });
};
