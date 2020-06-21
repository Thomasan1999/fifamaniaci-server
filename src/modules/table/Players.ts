import * as Pg         from 'pg';
import {PlayerValue}   from 'modules/row/Player';

export type PlayersQueryResult = Pg.QueryResult<PlayerValue>;
