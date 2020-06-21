import {ErrorCustom, Tomwork}                     from '..';
import {Row, RowValue}                            from './Row';
import {MatchesTypeQueryResult, MatchesTypeValue} from './MatchesType';
import * as Pg                                    from 'pg';
import * as Express                               from 'express';
import * as WebSocket                             from 'ws';
import {LeagueSeasonsDivision}                    from './LeagueSeasonsDivision';
import {LeagueSeasons}                            from '../table/LeagueSeasons';
import {LeagueSeasonValue}                        from './LeagueSeason';
import {QueryResultCount}                         from 'types/pg';

export type DivisionValue = Merge<RowValue, {
    categoryId: number;
    index?: number;
    level?: number;
    matchTypeId: number;
}>

export type DivisionQueryResult = Merge<Pg.QueryResult, { rows: [DivisionValue] }>;

export class Division extends Row
{
    public initialized: boolean = false;
    public matchType: MatchesTypeValue;
    public season: LeagueSeasonValue;
    public value: DivisionValue;

    constructor({io, pg, res, value}: {
        io?: WebSocket.Server,
        pg?: Pg.Client,
        res?: Express.Response,
        value: Partial<DivisionValue>
    })
    {
        super({io, pg, res, value});
    }

    public async init(): Promise<void>
    {
        this.initialized = true;
        this.season = await new LeagueSeasons({pg: this.pg}).findLast() as LeagueSeasonValue;
        this.matchType = await this.pg.query(
                `SELECT * FROM matches_types WHERE id = $1`,
            [this.value.matchTypeId]
        ).then((result: MatchesTypeQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0];
        });

        if (this.matchType.name === `league`)
        {
            const {index, level} = await this.orderCalc().catch((err) =>
            {
                new ErrorCustom({at: `Division.init() Division.orderCalc()`, err});
                return Promise.reject(err);
            });

            this.value.index = index;
            this.value.level = level;
        }
    }

    public async orderCalc(): Promise<{ index: number, level: number }>
    {
        const usersCount: number = await this.usersCount();

        const order: number = Math.floor(usersCount / this.size);

        let c: number = 0,
            level: number = 0;

        while ((c + 4 ** level) <= order)
        {
            c += 4 ** level;
            level += 1;
        }

        return {index: (usersCount - c * this.size) % (4 ** level), level};
    }

    public get size(): 10 | 20
    {
        return this.season.divisionSize;
    }

    public async upsert(): Promise<DivisionQueryResult>
    {
        if (!this.initialized)
        {
            await this.init().catch((err) =>
            {
                new ErrorCustom({at: `Division.upsert() Division.init()`, err});
                return Promise.reject(err);
            });
        }

        const {categoryId, matchTypeId} = this.value;
        const index: number = typeof this.value.index === `undefined` ? null : this.value.index;
        const level: number = typeof this.value.level === `undefined` ? null : this.value.level;

        return await this.pg.query(
            `INSERT INTO divisions(category_id, index, level, match_type_id) VALUES($1, $2, $3, $4)
                            ON CONFLICT(category_id, index, level, match_type_id) DO NOTHING RETURNING *`,
            [
                categoryId, 
                index,
                level, 
                matchTypeId
            ]
        ).then(async (result: DivisionQueryResult) =>
        {
            const resultParsed = Tomwork.queryParse(result);

            if (resultParsed.rowCount)
            {
                this.value = {...this.value, ...resultParsed.rows[0]};
            }
            else
            {
				await this.pg.query(`SELECT * FROM divisions WHERE category_id = $1 AND index = $2 AND level = $3 AND match_type_id = $4`, [
                    categoryId, 
                    index,
                    level, 
                    matchTypeId
                ]).then(async (result: DivisionQueryResult) =>
                {
                    const resultParsed2 = Tomwork.queryParse(result);
                    this.value = {...this.value, ...resultParsed2.rows[0]};
                });
            
                this.io.emitCustom(`fieldPost`, {
                    categoryId: this.value.categoryId,
                    divisions: new Row({value: this.valuePublic}).valueIndexed
                });
            }

            console.log(this.value);

            if (this.matchType.name === `playOff`)
            {
                await new LeagueSeasonsDivision({
                    io: this.io,
                    pg: this.pg,
                    res: this.res,
                    value: {divisionId: this.value.id, seasonId: (await new LeagueSeasons({pg: this.pg}).findLast()).id}
                }).upsert().catch((err) =>
                {
                    new ErrorCustom({at: `Division.upsert() LeagueSeasonsDivision.upsert()`, err});
                    return Promise.reject(err);
                });
            }

            return Promise.resolve(resultParsed);
        }).catch((err) =>
        {
            new ErrorCustom({at: `Division.upsert() Division.findOneAndUpdate()`, err});
            return Promise.reject(err);
        });
    }

    public async usersCount(): Promise<number>
    {
        return await this.pg.query(
                `SELECT COALESCE(COUNT(*)::integer, 0) FROM league_table_records
                        INNER JOIN divisions ON divisions.id = league_table_records.division_id
                        INNER JOIN league_seasons season_last ON season_last.id = league_table_records.season_id
                        WHERE divisions.category_id = $1`,
            [this.value.categoryId]
        ).then((result: QueryResultCount) =>
        {
            return Tomwork.queryParse(result).rows[0].count;
        });
    }

    public get valuePublic(): { id: number, index?: number, level?: number, matchTypeId: number }
    {
        return (({id, index, level, matchTypeId}: { id: number, index?: number, level?: number, matchTypeId: number }) =>
        {
            return {
                id,
                ...(index && {index}),
                ...(level && {level}),
                matchTypeId
            };
        })(this.value);
    }
}
