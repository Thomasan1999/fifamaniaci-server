import * as Pg                           from 'pg';
import {Table}                           from '../../modules/table';
import {Query}                           from '../../modules';
import {RouteArguments}                  from '../../types/routes';
import {QueryParamsArgument, QueryValue} from '../../modules/Query';
import {PlayerValue}                     from '../../modules/row/Player';

module.exports = ({app, pg, route}: RouteArguments) =>
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

        type TableThisValue = Omit<PlayerValue, 'categoryId' | 'updated'>
        type TableThis = Merge<Table, { value?: TableThisValue[] }>;

        const table: TableThis = new Table({
            res,
            value: await pg.query(
                    `SELECT players.id, COALESCE(rating, 0) AS rating, user_id FROM players INNER JOIN users ON users.id = players.user_id WHERE category_id = $1 AND users.verification_code IS NULL`,
                [query.value.categoryId]
            ).then((result: Pg.QueryResult<Pick<PlayerValue, 'id' | 'rating' | 'userId'>>) =>
            {
                return result.rows;
            })
        }) as TableThis;

        table.send();
    });
};
