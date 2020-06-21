import * as Pg         from 'pg';
import {DivisionValue} from '../row/Division';

export type DivisionsQueryResult = Merge<Pg.QueryResult, { rows: DivisionValue[] }>
