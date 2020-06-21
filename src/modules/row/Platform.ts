import {RowValue} from './Row';
import * as Pg    from 'pg';

export type PlatformName = 'ps' | 'xbox' | 'pc';

export type PlatformQueryResult = Merge<Pg.QueryResult, { rows: [PlatformValue] }>;

export type PlatformValue = Merge<RowValue, {
    name: PlatformName
}>;
