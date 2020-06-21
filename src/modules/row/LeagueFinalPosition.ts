import {RowValue} from './Row';
import * as Pg    from 'pg';

export type LeagueFinalPositionQueryResult = Merge<Pg.QueryResult, { rows: [LeagueFinalPositionValue] }>;

export type LeagueFinalPositionValue = Merge<RowValue, {
    categoryId: number,
    position: number,
    seasonId: number,
    userId: number
}>
