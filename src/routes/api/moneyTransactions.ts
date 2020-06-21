import {Table}                                              from '../../modules/table';
import {ErrorCustom, Query, Tomwork}                        from '../../modules';
import {MoneyTransaction, User}                             from '../../modules/row';
import {RouteArguments}                                     from '../../types/routes';
import {MoneyTransactionQueryResult, MoneyTransactionValue} from '../../modules/row/MoneyTransaction';
import {QueryParamsArgument, QueryProjection, QueryValue}   from '../../modules/Query';

module.exports = ({app, io, pg, route}: RouteArguments) =>
{
    app.get(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {};

        const projection: QueryProjection = {
            updated: {value: false}
        };

        type QueryThis = Merge<Query, { value: {} }>

        const query: QueryThis = new Query({params, projection, query: req.query, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const user: User = new User({auth: query.auth, io, pg, res});

        if (await user.authenticate() && user.value.admin)
        {
            type TableThisValue = Omit<MoneyTransactionValue, | 'updated'>;
            type TableThis = Merge<Table, { value?: TableThisValue[] }>

            const table: TableThis = new Table({
                res,
                value: (await pg.query(
                    `SELECT category_id, created, id, money, place, season_id, transaction_type_id, user_id FROM money_transactions`
                ).then((result: MoneyTransactionQueryResult) =>
                {
                    return Tomwork.queryParse(result).rows;
                }).catch((err) =>
                {
                    new ErrorCustom({at: `${route}.get() SELECT ...columns FROM moneyTransactions`, err});
                    res.status(500).json({message: err});
                })) as TableThisValue[]
            }) as TableThis;

            if (!table.value)
            {
                const err: string = `Money transactions not found`;
                new ErrorCustom({at: `${route}.get() moneyTransactions`, err});
                res.status(422).json({message: err});
                return;
            }

            table.send();
            return;
        }

        const err: string = `Invalid authentication data`;
        new ErrorCustom({at: `${route}.get() moneyTransactions`, err});
        res.status(422).json({message: err});
    });

    app.post(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            categoryName: {required: false},
            money: {},
            place: {required: false},
            transactionType: {},
            username: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'categoryName' | 'money' | 'place' | 'transactionType' | 'username'> }>

        const query: QueryThis = new Query({params, query: req.body, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        if (typeof query.value.username === `undefined`)
        {
            const err: string = `Username not defined`;
            new ErrorCustom({at: `${route}.post()`, err});
            res.status(422).json({message: err});
            return;
        }

        const user: User = new User({auth: query.auth, io, pg, res});

        const authenticated: boolean = await user.authenticate();

        if (!authenticated)
        {
            return;
        }

        if (authenticated || user.value.admin)
        {
            const {categoryName, money, place, transactionType: transactionTypeName, username} = query.value;

            return new MoneyTransaction({categoryName, io, pg, res, transactionTypeName, username, value: {money, place}}).insert().then((insertInfo) =>
            {
                const [insertedMoneyTransaction] = insertInfo.rows;
                res.json({...insertedMoneyTransaction, money: insertedMoneyTransaction.money});
            }).catch((err) =>
            {
                new ErrorCustom({at: `${route}.post() MoneyTransaction.insert()`, err});
            });
        }

        const err: string = `Invalid authentication data`;
        new ErrorCustom({at: `${route}.post()`, err});
        res.status(422).json({message: err});
    });
};
