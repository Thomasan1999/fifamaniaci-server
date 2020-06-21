import * as Pg                 from 'pg';
import {LeagueSeasonsDivision} from 'modules/row';

export type LeagueSeasonsDivisionsQueryResult = Merge<Pg.QueryResult, {rows: LeagueSeasonsDivision[]}>;
