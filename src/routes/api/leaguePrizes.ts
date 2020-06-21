import {RouteArguments}                                       from '../../types/routes';
import {LeaguePrizes, Table}                                                from '../../modules/table';
import {Query, Tomwork}                                       from '../../modules';
import {QueryParamsArgument, QueryValue}                      from '../../modules/Query';
import {LeaguePrizeValue} from '../../modules/row/LeaguePrize';
import { LeaguePrizesQueryResult } from 'modules/table/LeaguePrizes';

module.exports = ({app, pg, route}: RouteArguments) =>
{
    app.get(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            divisionId: {},
            seasonId: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, | 'divisionId' | 'seasonId'> }>

        const query: QueryThis = new Query({authRequired: false, params, query: req.query, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        type TableThisValue = LeaguePrizeValue[];
        type TableThis = Merge<Table, { value?: TableThisValue[] }>;

        const table: TableThis = new Table({
            res,
            value: await pg.query(
                    `SELECT * FROM money_transactions AS m
                    INNER JOIN divisions AS d ON d.id = $1 
                    WHERE m.transaction_type_id = 2 AND m.season_id = $2 AND d.category_id = m.category_id`,
                [query.value.divisionId, query.value.seasonId]
            ).then(async (result: LeaguePrizesQueryResult) =>
            {
                const resultParsed = Tomwork.queryParse(result);
            
                const leaguePrizes: LeaguePrizes = new LeaguePrizes({
                    divisionId: query.value.divisionId, 
                    playersRegistered: resultParsed.rowCount, 
                    pg,
                    seasonId: query.value.seasonId
                });

                await leaguePrizes.init();

                return leaguePrizes.rows;
            })
        }) as TableThis;

        table.send();
    });
};
