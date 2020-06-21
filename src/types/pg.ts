import * as Pg from 'pg';

export type QueryResultCount = Merge<Pg.QueryResult, { rows: [{ count: number }] }>;
export type QueryResultId = Merge<Pg.QueryResult, { rows: [{ id: number }] }>;
