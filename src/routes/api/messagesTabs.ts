import {QueryParamsArgument, QueryValue} from '../../modules/Query';
import {Table}                           from '../../modules/table';
import {ErrorCustom, Query}              from '../../modules';
import {Row, MessagesTab, User}          from '../../modules/row';
import {MessagesTabValue}                from '../../modules/row/MessagesTab';
import * as Pg                           from 'pg';

// type TableThis = Merge<Table, { value?: MessagesTabValue[] }>;

module.exports = ({app, io, pg, route}) =>
{
    app.get(route, async (req, res) =>
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

        const user: User = new User({auth: query.auth, io, pg, res});

        if (!await user.authenticate())
        {
            return;
        }

        type TableThisValue = Omit<MessagesTabValue, 'createdById' | 'updated'>;
        type TableThis = Merge<Table, { value: TableThisValue[] }>;

        const table: TableThis = new Table({
            res,
            value: await pg.query(
                    `SELECT addressee_id, category_id, id FROM messages_tabs WHERE category_id = $1 AND created_by_id = $2`,
                [query.value.categoryId, query.createdById]
            ).then((result: Merge<Pg.QueryResult, {rows: Pick<MessagesTabValue, 'addresseeId' | 'categoryId'>[]}>) =>
            {
                return result.rows;
            })
        }) as TableThis;

        table.send();
    });

    app.post(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            addresseeId: {},
            categoryId: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'addresseeId' | 'categoryId'> }>

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

        await new MessagesTab({io, pg, res, value: {createdById: query.createdById, ...query.value}}).insert().then((messagesTabUpserted) =>
        {
            res.json(new Row({value: messagesTabUpserted.rows[0]}).valueIndexed);
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}.post()`, err});
        });
    });

    app.delete(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            id: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'id'> }>

        const query: QueryThis = new Query({params, query: req.query, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const user: User = new User({auth: query.auth, io, pg, res});

        if (!await user.authenticate())
        {
            return;
        }

        await pg.query(`DELETE FROM messages_tabs WHERE id = $1`, [query.value.id]).then((deleteResponse: Merge<Pg.QueryResult, { rows: [] }>) =>
        {
            if (!deleteResponse.rowCount)
            {
                res.status(500).json({message: `Messages tab not deleted`});
                return;
            }

            res.status(204).end();
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route} DELETE FROM messages_tabs`, err});
        });
    });
};
