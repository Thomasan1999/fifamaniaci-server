import {Table}            from '../../modules/table';
import {RouteArguments}   from '../../types/routes';
import {MatchesTypeValue} from '../../modules/row/MatchesType';

module.exports = ({app, pg, route}: RouteArguments) =>
{
    app.get(route, async (req, res) =>
    {
        type TableThisValue = Omit<MatchesTypeValue, 'updated'>;
        type TableThis = Merge<Table, { value?: TableThisValue[] }>;

        const table: TableThis = new Table({
            res,
            value: await pg.query(`SELECT id, name, weight FROM matches_types ORDER BY weight ASC`).then((result)=>
            {
                return result.rows;
            })
        }) as TableThis;

        table.send();
    });
};
