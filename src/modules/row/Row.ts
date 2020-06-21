import * as Express            from 'express';
import * as WebSocket          from 'ws';
import * as Pg                 from 'pg';
import {Tomwork}               from '../Tomwork';
import {WebSocketServerCustom} from '../../app';

export type RowValue = {
    id: number,
    created: Date,
    updated?: Date
};

export class Row
{
    public io: WebSocketServerCustom;
    public pg: Pg.Client;
    public query?: any;
    public req?: Express.Request;
    public res: Express.Response;
    public value?: RowValue;

    constructor({io, pg, query = {}, req, res, value = {}}: {
        createdById?: number,
        io?: WebSocket.Server;
        pg?: Pg.Client,
        query?: any;
        req?: Express.Request;
        res?: Express.Response;
        value?: any
    } = {})
    {
        this.io = io as WebSocketServerCustom;
        this.pg = pg;
        this.query = query;
        this.req = req;
        this.res = res;
        this.value = value;
    }

    public error({message, status = 500}: { message: string, status?: number }): void
    {
        if (this.res && message)
        {
            this.res.status(status).json({message});
        }
    }

    public get valueIndexed(): { [s: string]: any }
    {
        const copy: this['value'] = Tomwork.clone(this.value);
        delete copy.id;
        return {[this.value.id]: copy as Omit<this['value'], 'id'>};
    }
}
