import {Table}                    from './Table';
import * as Express               from 'express';
import * as Pg                    from 'pg';
import * as WebSocket             from 'ws';
import {LeagueFinalPositionValue} from '../row/LeagueFinalPosition';
import {ErrorCustom, Tomwork}     from '..';

export type LeagueFinalPositionsQueryResult = Merge<Pg.QueryResult, { rows: LeagueFinalPositionValue[] }>;

export class LeagueFinalPositions extends Table
{
    public categoryId: number;
    public seasonId: number;
    public value: LeagueFinalPositionValue[];

    constructor({categoryId, io, pg, res, seasonId}: { categoryId: number, io?: WebSocket.Server, pg?: Pg.Client, res?: Express.Response, seasonId: number })
    {
        super({io, pg, res});
        this.categoryId = categoryId;
        this.seasonId = seasonId;
    }

    public async insertOne({position, userId}: { position: number, userId: number }): Promise<void | LeagueFinalPositionsQueryResult>
    {
        return await this.pg.query(
            `INSERT INTO league_final_positions(category_id, position, season_id, user_id) VALUES($1, $2, $3, $4)`,
            [this.categoryId, position, this.seasonId, userId]
        ).then((result)=>
        {
            const resultParsed = Tomwork.queryParse(result);

            this.value.push(result.rows[0]);
            return Promise.resolve(resultParsed);
        }).catch((err) =>
        {
            new ErrorCustom({at: `LeagueFinalPositions.insert()`, err});
        });
    }
}
