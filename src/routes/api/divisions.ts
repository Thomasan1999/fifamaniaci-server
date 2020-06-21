import * as Pg                           from 'pg';
import {Table}                           from '../../modules/table';
import {Query}                           from '../../modules';
import {RouteArguments}                  from '../../types/routes';
import {QueryParamsArgument, QueryValue} from '../../modules/Query';
import {DivisionValue}                   from '../../modules/row/Division';

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

        type TableThis = Merge<Table, { value?: Omit<DivisionValue, 'updated'>[] }>;

        const table: TableThis = new Table({
            res,
            value: await pg.query(
                    `SELECT id, category_id, index, level, match_type_id FROM divisions WHERE category_id = $1 AND level IS NOT NULL`,
                [query.value.categoryId]
            ).then((result: Pg.QueryResult<Pick<DivisionValue, 'id' | 'categoryId' | 'index' | 'level' | 'matchTypeId'>>) =>
            {
                return result.rows;
            }) as DivisionValue[]
        }) as TableThis;

        table.send();
    });
};
