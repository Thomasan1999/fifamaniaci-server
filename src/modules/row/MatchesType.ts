import {RowValue} from './Row';
import * as Pg    from 'pg';

export type MatchesTypeName = 'friendly' | 'qualification' | 'league' | 'playOff';

export type MatchesTypeValue = Merge<RowValue, {
    name: MatchesTypeName
    weight: 10 | 25 | 40 | 60;
}>

export type MatchesTypeQueryResult = Merge<Pg.QueryResult, { rows: [MatchesTypeValue] }>;
