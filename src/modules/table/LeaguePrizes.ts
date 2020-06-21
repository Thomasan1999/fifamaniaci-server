import {Table}             from './Table';
import {LeaguePrizeValue}  from '../row/LeaguePrize';
import * as Express        from 'express';
import * as WebSocket      from 'ws';
import * as Pg             from 'pg';
import * as NumericRange   from 'numeric-range';
import { LeagueSeasonValue, LeagueSeasonQueryResult } from '../row/LeagueSeason';
import { CategoryValue, CategoryQueryResult } from '../row/Category';
import { Tomwork } from '..';

export type LeaguePrizesQueryResult = Merge<Pg.QueryResult, { rows: LeaguePrizeValue[] }>;

export class LeaguePrizes extends Table
{
    public category: CategoryValue;
    public divisionId: number;
    public initialized: boolean = false;
    public playersRegistered: number;
    public season: LeagueSeasonValue;
    public seasonId: number;
    public value: LeaguePrizeValue[];

    constructor({divisionId, io, pg, playersRegistered, res, seasonId}: { divisionId: number, io?: WebSocket.Server, pg: Pg.Client, playersRegistered: number, res?: Express.Response, seasonId: number })
    {
        super({io, name: `leaguePrizes`, pg, res});
        this.divisionId = divisionId;
        this.playersRegistered = playersRegistered;
        this.seasonId = seasonId;
    }

    public async init(): Promise<void>
    {
        this.initialized = true;

        this.category = await this.pg.query(
            `SELECT * FROM categories AS c INNER JOIN divisions AS d ON d.id = $1 WHERE c.id = d.category_id`, 
            [this.divisionId]
        ).then((result: CategoryQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0];
        });

        this.season = await this.pg.query(
            `SELECT * FROM league_seasons AS s WHERE s.id = $1`, 
            [this.seasonId]
        ).then((result: LeagueSeasonQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0];
        });
    }

    public get prizeFirst(): number
    {
        const sum: number = this.rowsRange.reduce((a, place) =>
        {
            return a + (1 / place);
        }, 0);


        return (1 / sum) * (this.pool * .7);
    }

    
    public rowsSortCompareFn([, prizeA]: [string, LeaguePrizeValue], [, prizeB]: [string, LeaguePrizeValue]): number
    {
        return prizeB.money - prizeA.money;
    }

    public entrance: number = parseFloat(process.env.FM_LEAGUE_REGISTRATION_MONEY);

    public get playersWinning(): number
    {
        return this.playersRegistered === 0 ? 0 : Math.max(1, Math.round(this.playersRegistered * .2));
    }

    public get pool(): number
    {
        return this.entrance * this.playersRegistered;
    }

    public get rows(): LeaguePrizeValue[]
    {
        if (!this.initialized)
        {
            throw new Error(`League prizes not initalized`);
        }

        if (this.seasonId === 1)
        {
            const money: number = (() =>
            {
                switch (this.category.name)
                {
                    case `xboxOne`:
                    case `xboxOneFut`:
                        return 50;
                    case `ps4`:
                        return 52;
                }
            })();

            return [{id: 1, divisionId: this.divisionId, money, seasonId: this.seasonId}];
        }

        return this.rowsRange.map((place, index) =>
        {
            return {id: index + 1, divisionId: this.divisionId, money: Math.round(this.prizeFirst / place), seasonId: this.seasonId};
        });
    }

    public get rowsRange(): number[]
    {
        switch (this.playersWinning)
        {
            case 0:
                return [];
            case 1:
                return [1];
            default:
                // @ts-ignore
                return new NumericRange(1, this.playersWinning).enumerate();
        }
    }
}
