// import {RowValue} from './Row';
import * as Pg    from 'pg';

export type LeaguePrizeQueryResult = Merge<Pg.QueryResult, { rows: [LeaguePrizeValue] }>;
export type LeaguePrizeValue = {
    id: number,
    divisionId: number,
    money: number,
    seasonId: number
}
