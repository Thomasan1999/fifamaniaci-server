import * as Pg                           from 'pg';
import {Table}                           from '../../modules/table';
import {ErrorCustom, Query}              from '../../modules';
import {Message, User}                   from '../../modules/row';
import {RouteArguments}                  from '../../types/routes';
import {QueryParamsArgument, QueryValue} from '../../modules/Query';
import {MessageValue}                    from '../../modules/row/Message';
import {MessagesTabValue}                from '../../modules/row/MessagesTab';

module.exports = ({app, io, pg, route}: RouteArguments) =>
{
    app.get(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            categoryId: {},
            tabId: {required: false}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'categoryId' | 'lastId' | 'tabId'> }>

        const query: QueryThis = new Query({authRequired: false, params, query: req.query, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const user: User = new User({auth: query.auth, io, pg, res});

        type TableThisValue = Merge<Omit<MessageValue, 'categoryId' | 'updated'>, { tab?: MessagesTabValue[] }>;
        type TableThis = Merge<Table, { value?: TableThisValue[] }>;

        const table: TableThis = new Table({
            nested: true,
            res,
            tabCondition(record: TableThisValue)
            {
                return (record.tab.find((tab) =>
                {
                    return query.auth.id === tab.createdById;
                }) || {id: null}).id;
            }
        }) as TableThis;

        if (query.auth && await user.authenticate({res: false}))
        {
            table.value = await pg.query(
                    `SELECT messages.addressee_id, messages.created, messages.created_by_id, messages.id, message FROM messages
LEFT JOIN messages_tabs ON (messages.addressee_id = messages_tabs.addressee_id AND messages.created_by_id = messages_tabs.created_by_id)
OR (messages.addressee_id = messages_tabs.created_by_id AND messages.created_by_id = messages_tabs.addressee_id)
WHERE (messages.addressee_id IS NULL OR messages_tabs.created_by_id = $1) AND messages.category_id = $2 AND (CASE WHEN $3::NUMERIC = $3 THEN messages.id < $3 ELSE TRUE END)
  ORDER BY id DESC LIMIT $4`,
                [query.createdById, query.value.categoryId, query.value.lastId, query.limit]
            ).then((result: Pg.QueryResult<Pick<MessageValue, 'addresseeId' | 'created' | 'createdById' | 'id' | 'message'>>) =>
            {
                return result.rows;
            });
        }
        else
        {
            table.value = await pg.query(
                    `SELECT addressee_id, created, created_by_id, id, message FROM messages
 WHERE addressee_id IS NULL AND category_id = $1 AND (CASE WHEN $2::NUMERIC = $2 THEN id < $2 ELSE TRUE END) ORDER BY id DESC LIMIT $3`,
                [query.value.categoryId, query.value.lastId, query.limit]
            ).then((result: Pg.QueryResult<Pick<MessageValue, 'addresseeId' | 'created' | 'createdById' | 'id' | 'message'>>) =>
            {
                return result.rows;
            });
        }

        table.send();
    });

    app.post(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            addresseeId: {required: false},
            categoryId: {},
            message: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'addresseeId' | 'categoryId' | 'message'> }>

        const query: QueryThis = new Query({params, query: req.body, res});

        if (!query.valid)
        {
            return;
        }

        const user: User = new User({auth: query.auth, io, pg, res});

        if (!await user.authenticate())
        {
            return;
        }

        await new Message({io, pg, res, value: {createdById: query.createdById, ...query.value}}).insert().then((insertedMessage) =>
        {
            res.json(insertedMessage);
        }).catch((err) =>
        {
            new ErrorCustom({at: `${route}.post()`, err});
        });
    });
};
