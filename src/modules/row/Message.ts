import {ErrorCustom, Tomwork}                     from '..';
import {MessagesTab}             from '.';
import categories                from '../../locales/sk/categories';
import * as requestPromiseNative from 'request-promise-native';
import {AllHtmlEntities}                          from 'html-entities';
import * as WebSocket                             from 'ws';
import * as Express                               from 'express';
import * as Pg                                    from 'pg';
import {UserValue}                                from './User';
import {CategoryValue}                            from './Category';
import {MessagesTabQueryResult, MessagesTabValue} from './MessagesTab';
import {Row, RowValue}                            from './Row';
import {WebSocketCustom}                          from 'app';
import {VueObject}                                from '../types';
import {QueryResultCount}                         from 'types/pg';

export type MessageValue = Merge<RowValue, {
    addresseeId?: number;
    categoryId: number;
    createdById: number;
    message: string;
}>

export type MessageQueryResult = Merge<Pg.QueryResult, {rows: [MessageValue]}>;

export type MessageValuePublic = { id: number, addresseeId?: number, created: Date, createdById: number, message: string };

export class Message extends Row
{
    public value: MessageValue;

    constructor({io, pg, req, res, value}: {
        io: WebSocket.Server,
        pg: Pg.Client,
        req?: Express.Request,
        res: Express.Response,
        value: Partial<MessageValue>
    })
    {
        super({io, pg, req, res, value});
    }

    public async botPost(): Promise<any> // Promise<Request.RequestPromise>
    {
        const data: {
            categoryName: string,
            createdBy: string,
            message: string
        } = {
            categoryName: categories[await this.pg.query(
                `SELECT name FROM categories id = $1`,
                [this.value.categoryId]
            ).then((result: Merge<Pg.QueryResult, {rows: [Pick<CategoryValue, 'name'>]}>)=>
            {
                return Tomwork.queryParse(result).rows[0].name;
            })],
            createdBy: await this.pg.query(
                `SELECT username FROM users WHERE id = $1`,
                [this.value.createdById]
            ).then((result: Merge<Pg.QueryResult, {rows: [Pick<UserValue, 'username'>]}>)=>
            {
                return Tomwork.queryParse(result).rows[0].username;
            }),
            message: AllHtmlEntities.decode(this.value.message)
        };

        return requestPromiseNative({
            form: data,
            method: `POST`,
            url: `https://bot.fifamaniaci.sk`
        }).catch((err) =>
        {
            new ErrorCustom({at: `Message.botPost() requestPromiseNative.post()`, err});
            return Promise.reject(err);
        });
    }

    public async insert(): Promise<{ categoryId: number, createdById: number, value: { [s: string]: Omit<MessageValue, 'id'> } }>
    {
        if (this.value.addresseeId)
        {
            if (!await this.pg.query(
                    `SELECT COUNT(*)::integer FROM users WHERE id = $1 AND verification_code IS NULL`,
                [this.value.addresseeId]
            ).then((result: QueryResultCount) =>
            {
                return Tomwork.queryParse(result).rows[0].count;
            }))
            {
                const err: string = `Addressee not found`;
                this.error({message: err, status: 422});
                new ErrorCustom({at: `Message.insert()`, err});
                return Promise.reject(err);
            }
        }

        this.value.message = AllHtmlEntities.encode(this.value.message).trim();

        if (!this.value.message.length)
        {
            const err: string = `Message is empty`;
            this.error({message: err, status: 422});
            new ErrorCustom({at: `Message.insert()`, err});
            return Promise.reject(err);
        }

        return await this.pg.query(
                `INSERT INTO messages(addressee_id, category_id, created_by_id, message) VALUES($1, $2, $3, $4) RETURNING *`,
            [this.value.addresseeId || null, this.value.categoryId, this.value.createdById, this.value.message]
        ).then(async (insertedMessage: MessageQueryResult) =>
        {
            [this.value] = insertedMessage.rows.map((row)=>
            {
                return new VueObject(row).camelCaseTo();
            });

            if (!insertedMessage.rowCount)
            {
                const err: string = `Message not added`;
                this.error({message: err, status: 422});
                new ErrorCustom({at: `Message.insert()`, err});
                return Promise.reject(err);
            }

            const message: Merge<Row, { value: MessageValuePublic }> = new Row({value: this.valuePublic}) as Merge<Row, { value: MessageValuePublic }>;

            const {addresseeId, categoryId, createdById} = this.value;

            if (addresseeId)
            {
                const {io, pg, req, res} = this;

                await Promise.all([
                    new MessagesTab({io, pg, req, res, value: {addresseeId: createdById, categoryId: categoryId, createdById: addresseeId}}).insert(),
                    this.pg.query(
                            `SELECT * FROM messages_tabs WHERE addressee_id = $1 AND category_id = $2 AND created_by_id = $3`,
                        [addresseeId, categoryId, createdById]
                    ).then((result: MessagesTabQueryResult) =>
                    {
                        return Tomwork.queryParse(result).rows[0];
                    })
                ]).then(async ([insertedMessagesTab, createdByMessagesTab]: [MessagesTabQueryResult, MessagesTabValue]) =>
                {
                    const sockets: WebSocketCustom[] = [...this.io.clients].filter((socket) =>
                    {
                        return socket.cookies.value.id && socket.cookies.value.token &&
                            (addresseeId === socket.cookies.value.id || createdById === socket.cookies.value.id);
                    });

                    if (sockets.length === 0)
                    {
                        return;
                    }

                    sockets.forEach((socket) =>
                    {
                        const createdByIs: boolean = createdById === socket.cookies.value.id;
                        const tabId: number = createdByIs ? createdByMessagesTab.id : insertedMessagesTab.rows[0].id;

                        socket.emitCustom(`fieldPost`, {
                            categoryId,
                            createdById,
                            messages: new Row({value: {...message.value, tabId}}).valueIndexed,
                            ...(!createdByIs && {
                                messagesTabs: new Row({
                                    value: insertedMessagesTab.rows[0]
                                }).valueIndexed
                            })
                        });
                    });

                    return Promise.resolve(Boolean(insertedMessagesTab.rowCount));
                }).catch((err) =>
                {
                    new ErrorCustom({at: `Message.insert() MessagesTab.insert()`, err});
                    return Promise.reject(err);
                });
            }
            else // !addresseeId
            {
                this.io.emitCustom(`fieldPost`, {categoryId, createdById, messages: message.valueIndexed});

                if (process.env.NODE_ENV === `production`)
                {
                    this.botPost().catch((err) =>
                    {
                        new ErrorCustom({at: `Message.insert() Message.botPost()`, err});
                        return Promise.reject(err);
                    });
                }
            }

            return Promise.resolve({categoryId, createdById, value: message.valueIndexed});
        }).catch((err) =>
        {
            new ErrorCustom({at: `Message.insert() messages.insertOne()`, err});
            return Promise.reject(err);
        });
    }

    public get valuePublic(): MessageValuePublic
    {
        return (({id, addresseeId, created, createdById, message}) =>
        {
            return {
                id,
                ...(addresseeId && {addresseeId}),
                created,
                createdById,
                message
            };
        })(this.value);
    }
}
