import * as Pg      from 'pg';
import * as Express from 'express';
import {Table}      from './Table';
import {MatchValue} from '../row/Match';

export type MatchesQueryResult = Merge<Pg.QueryResult, { rows: MatchValue[] }>;

export class Matches extends Table
{
    public value: MatchValue[];

    constructor({pg, res}: { pg: Pg.Client, res?: Express.Response })
    {
        super({pg, res});
    }
}
