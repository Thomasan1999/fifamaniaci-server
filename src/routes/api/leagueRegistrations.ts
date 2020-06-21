import * as Pg                           from 'pg';
import {Table}                           from '../../modules/table';
import {ErrorCustom, Query}              from '../../modules';
import {LeagueRegistration, User}        from '../../modules/row';
import {RouteArguments}                  from '../../types/routes';
import {QueryParamsArgument, QueryValue} from '../../modules/Query';
import {LeagueRegistrationValue}         from '../../modules/row/LeagueRegistration';
import {LeagueSeasons}                   from '../../modules/table/LeagueSeasons';

module.exports = ({app, io, pg, route}: RouteArguments) =>
{
    app.get(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            categoryId: {},
            seasonId: {required: false}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'categoryId' | 'seasonId'> }>

        const query: QueryThis = new Query({authRequired: false, params, query: req.query, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const seasonThisId: number = query.value.seasonId || (await new LeagueSeasons({pg}).findLast()).id;

        type TableThisValue = Merge<Omit<LeagueRegistrationValue, 'categoryId' | 'updated'>, { finalPosition?: number }>;
        type TableThis = Merge<Table, { value: TableThisValue[] }>;

        const table: TableThis = new Table({
            res,
            value: await pg.query(
                    `SELECT league_registrations.*, league_final_positions.position AS final_position, CASE WHEN dnf_after_weeks IS NULL THEN NULL ELSE penalty_points END, users.verification_code IS NULL AS valid FROM league_registrations
                    LEFT JOIN league_final_positions ON league_final_positions.category_id = league_registrations.category_id AND league_final_positions.season_id = $2 AND league_final_positions.user_id = league_registrations.user_id
                     LEFT JOIN users ON users.id = league_registrations.user_id
                     WHERE canceled IS NOT TRUE AND league_registrations.season_id = $1 AND league_registrations.category_id = $3
`,
                [seasonThisId, seasonThisId - 1, query.value.categoryId]
            ).then((result: Pg.QueryResult<Merge<LeagueRegistrationValue, {finalPosition: number, penaltyPoints?: number, valid: boolean}>>) =>
            {
                return result.rows;
            })
        }) as TableThis;

        table.send();
    });

    app.post(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            categoryId: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'categoryId'> }>

        const query: QueryThis = new Query({params, query: req.body, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const user: User = new User({auth: query.auth, io, pg, query: {id: query.createdById}, res});

        if (!await user.authenticate({verifiedOnly: false}))
        {
            return;
        }

        await user.find().catch((err) =>
        {
            new ErrorCustom({at: `${route}.post() User.find()`, err});
        });

        const leagueRegistration: LeagueRegistration = new LeagueRegistration({io, pg, res, user, value: {...query.value, userId: query.createdById}});

        await leagueRegistration.insert().then(({rows: [{id, categoryId, userId}]}) =>
        {
            res.json({id, categoryId, userId});
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}.post() LeagueRegistration.insert()`, err});
        });
    });

    app.delete(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            categoryId: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'categoryId'> }>

        const query: QueryThis = new Query({params, query: req.query, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const user: User = new User({auth: query.auth, io, pg, query: {id: query.createdById}, res});

        if (!await user.authenticate({}))
        {
            return;
        }

        await user.find().catch((err: string) =>
        {
            new ErrorCustom({at: `${route}.post() User.find()`, err});
        });

        const leagueRegistration: LeagueRegistration = new LeagueRegistration({io, pg, res, user, value: {...query.value, userId: query.createdById}});

        await leagueRegistration.cancel().then(({rows: [{id}]}) =>
        {
            res.json({id});
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}.post() LeagueRegistration.cancel()`, err});
        });
    });
};
