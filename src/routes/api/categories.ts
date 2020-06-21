import * as Pg          from 'pg';
import {Table}          from '../../modules/table';
import {RouteArguments} from '../../types/routes';
import {CategoryValue}  from '../../modules/row/Category';

module.exports = ({app, pg, route}: RouteArguments) =>
{
    app.get(route, async (req, res) =>
    {
        type TableThisValue = Omit<CategoryValue, 'updated'>;
        type TableThis = Merge<Table, { value?: TableThisValue[] }>;

        const table: TableThis = new Table({
            res,
            value: await pg.query(`SELECT id, name FROM categories`).then((result: Pg.QueryResult<Pick<CategoryValue, 'id' | 'name'>>) =>
            {
                return result.rows;
            })
        }) as TableThis;

        table.send();
    });
};
