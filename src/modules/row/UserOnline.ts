import {RowValue} from './Row';
import * as Pg from 'pg';

export type UserOnlineQueryResult = Merge<Pg.QueryResult, {rows: [UserOnlineValue]}>;
export type UserOnlineValue = Merge<RowValue, {
    categoryId: number,
    userId: number
}>;
