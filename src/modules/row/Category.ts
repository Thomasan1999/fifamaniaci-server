import {RowValue} from './Row';
import * as Pg    from 'pg';

export type CategoryName = 'ps4' | 'ps4Fut' | 'xboxOne' | 'xboxOneFut' | 'pc' | 'pcFut';

export type CategoryQueryResult = Merge<Pg.QueryResult, { rows: [CategoryValue] }>;

export type CategoryValue = Merge<RowValue, {
    name: CategoryName;
}>
