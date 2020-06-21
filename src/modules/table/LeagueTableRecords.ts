import {Table}                  from './Table';
import {LeagueTableRecordValue} from '../row/LeagueTableRecord';
import * as WebSocket           from 'ws';
import * as Express             from 'express';
import * as Pg                  from 'pg';

export type LeagueTableRecordsQueryResult = Merge<Pg.QueryResult, { rows: LeagueTableRecordValue[] }>

export class LeagueTableRecords extends Table
{
    public value: LeagueTableRecordValue[];

    constructor({io, pg, res}: { io?: WebSocket.Server, pg?: Pg.Client, res?: Express.Response })
    {
        super({io, pg, res});
    }
}
