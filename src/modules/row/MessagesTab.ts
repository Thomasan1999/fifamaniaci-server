import {ErrorCustom, Tomwork} from '..';
import * as WebSocket         from 'ws';
import * as Express           from 'express';
import * as Pg                from 'pg';
import {Row, RowValue}        from './Row';
import {VueObject}            from '../types';
import {QueryResultCount}     from 'types/pg';

export type MessagesTabValue = Merge<RowValue, {
    addresseeId: number;
    categoryId: number;
    createdById: number;
}>;

export type MessagesTabQueryResult = Merge<Pg.QueryResult, { rows: [MessagesTabValue] }>;

export class MessagesTab extends Row
{
    public value: MessagesTabValue;

    constructor({io, pg, req, res, value}: { io?: WebSocket.Server, pg?: Pg.Client, req?: Express.Request, res?: Express.Response, value: Partial<MessagesTabValue> })
    {
        super({io, pg, req, res, value});
    }

    public async insert(): Promise<MessagesTabQueryResult>
    {
        if (!await this.pg.query(
                `SELECT COUNT(*)::integer  FROM users WHERE id = $1 AND verification_code IS NULL`,
            [this.value.addresseeId]
        ).then((result: QueryResultCount) =>
        {
            return Tomwork.queryParse(result).rows[0].count;
        }))
        {
            const err: string = `Addressee not found`;
            this.error({message: err, status: 422});
            new ErrorCustom({at: `MessagesTab.insert()`, err});
            return Promise.reject(err);
        }

        return await this.pg.query(
                `INSERT INTO messages_tabs(addressee_id, category_id, created_by_id) VALUES($1, $2, $3) ON CONFLICT(addressee_id, category_id, created_by_id) DO NOTHING RETURNING *`,
            [this.value.addresseeId, this.value.categoryId, this.value.createdById]
        ).then(async (messagesTabUpserted: MessagesTabQueryResult) =>
        {
            return Promise.resolve({
                ...messagesTabUpserted,
                rows: messagesTabUpserted.rows.map((row) =>
                {
                    return new VueObject(row).camelCaseTo();
                }) as [MessagesTabValue]
            });
        }).catch((err) =>
        {
            new ErrorCustom({at: `MessagesTab.insert() INSERT INTO messages_tabs`, err});
            return Promise.reject(err);
        });
    }

    public get valuePublic(): { id: number, addresseeId?: number, createdById: number }
    {
        return (({id, addresseeId, createdById}) =>
        {
            return {
                id,
                ...(addresseeId && {addresseeId}),
                createdById
            };
        })(this.value);
    }
}
