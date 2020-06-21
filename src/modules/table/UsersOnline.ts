import * as Pg           from 'pg';
import {UserOnlineValue} from '../row/UserOnline';

export type UsersOnlineQueryResult = Merge<Pg.QueryResult, {rows: [UserOnlineValue]}>;
