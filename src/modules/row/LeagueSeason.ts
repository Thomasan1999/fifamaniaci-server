import {RowValue} from './Row';
import * as Pg    from 'pg';

export type LeagueSeasonQueryResult = Merge<Pg.QueryResult, { rows: [LeagueSeasonValue] }>;
export type LeagueSeasonValue = Merge<RowValue, {
    divisionSize: 10 | 20,
    seasonEnd: Date;
    month: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
    playOffEnd: Date;
    playOffStart: Date;
    playOffRoundsLimit: 2 | 3;
    playOffWinsLimit: 2 | 3;
    quarter?: 0 | 1 | 2 | 3;
    registrationTo: Date;
    seasonStart: Date;
}>
