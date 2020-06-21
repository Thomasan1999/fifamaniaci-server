import * as Pg             from 'pg';
import {LoginSessionValue} from '../row/LoginSession';

export type LoginSessionsQueryResult = Merge<Pg.QueryResult, {rows: LoginSessionValue[]}>;
