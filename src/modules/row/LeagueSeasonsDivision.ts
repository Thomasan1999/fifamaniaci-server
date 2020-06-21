import {ErrorCustom}   from '..';
import {Row, RowValue} from './Row';
import * as Pg         from 'pg';
import * as WebSocket  from 'ws';
import * as Express    from 'express';

export type LeagueSeasonsDivisionValue = Merge<RowValue, {
    divisionId: number;
    seasonId: number;
}>

export type LeagueSeasonsDivisionQueryResult = Merge<Pg.QueryResult, { rows: [LeagueSeasonsDivisionValue] }>;

export class LeagueSeasonsDivision extends Row
{
    value: LeagueSeasonsDivisionValue;

    constructor({io, pg, res, value}: {
        io: WebSocket.Server,
        pg: Pg.Client,
        res: Express.Response,
        value: {
            divisionId: number,
            seasonId: number
        }
    })
    {
        super({io, pg, res, value});
    }

    public async upsert(): Promise<LeagueSeasonsDivisionQueryResult>
    {
        return await this.pg.query(
                `INSERT INTO league_seasons_divisions(division_id, season_id) VALUES($1, $2) ON CONFLICT (division_id, season_id) DO NOTHING RETURNING *`,
            [this.value.divisionId, this.value.seasonId]
        ).then(async (upsertedRecord: LeagueSeasonsDivisionQueryResult) =>
        {
            this.value = {...this.value, ...upsertedRecord.rows[0]};

            if (upsertedRecord.rowCount)
            {
                this.io.emitCustom(`leagueSeasonsDivisionPost`, this.valuePublic);
            }

            return Promise.resolve(upsertedRecord);
        }).catch((err) =>
        {
            new ErrorCustom({at: `LeagueSeasonsDivision.upsert() LeagueSeasonsDivision.findOneAndUpdate()`, err});
            return Promise.reject(err);
        });
    }

    public get valuePublic(): { divisionId: number, seasonId: number }
    {
        return (({divisionId, seasonId}) =>
        {
            return {
                divisionId,
                seasonId
            };
        })(this.value);
    }
}
