import {Match, MatchForm, MatchResult, MatchResultColumnName, MatchSide} from './Match';
import {ErrorCustom, Tomwork}                                            from '..';
import {Division, LeagueSeasonsDivision}                                 from '.';
import {LeagueSeasonQueryResult, LeagueSeasonValue}                      from './LeagueSeason';
import * as Moment                                                       from 'moment-timezone';
import * as WebSocket                                                    from 'ws';
import * as Pg                                                           from 'pg';
import {MatchesTypeQueryResult, MatchesTypeValue}                        from './MatchesType';
import {LeagueSeasonsDivisionQueryResult}                                from './LeagueSeasonsDivision';
import {Row, RowValue}                                                   from './Row';
import {CategoryQueryResult}                                             from './Category';
import {LeagueSeasons}                                                   from '../table/LeagueSeasons';
import * as pgFormat                                                     from 'pg-format';
import {VueString}                                                       from '../types';

export type LeagueTableRecordValue = Merge<RowValue, {
    categoryId?: number;
    divisionId?: number;
    dnfAfterWeeks?: number;
    draws?: number;
    goalsAgainst: number;
    goalsFor: number;
    losses: number;
    matches: number;
    overtimeLosses?: number;
    overtimeWins?: number;
    points: number;
    seasonId: number;
    userId: number;
    wins: number;
}>;

export type LeagueTableRecordValuePublic = {
    id: number,
    divisionId: number,
    dnfAfterWeeks?: number,
    draws: number,
    form: MatchForm,
    goalDifference?: number,
    losses: number,
    matches: number,
    overtimeLosses: number,
    overtimeWins: number,
    points: number,
    score: [number, number],
    seasonId: number,
    userId: number,
    wins: number
};

export type LeagueTableRecordQueryResult = Merge<Pg.QueryResult, { rows: [LeagueTableRecordValue] }>;

export class LeagueTableRecord extends Row
{
    public division?: Division;
    public form?: MatchForm;
    public fut?: boolean;
    public initialized: boolean = false;
    public match: Match;
    public season: LeagueSeasonValue;
    public side: MatchSide;
    public valid: boolean = true;
    public value: LeagueTableRecordValue;

    constructor({form, io, match, pg, season, side, valid = true, value}: { form?: MatchForm, io?: WebSocket.Server, match?: Match, pg?: Pg.Client, season?: LeagueSeasonValue, side?: MatchSide, valid?: boolean, value: Partial<LeagueTableRecordValue> })
    {
        super({
            io,
            pg,
            value: {
                ...value,
                ...(match && {
                    divisionId: match.value.divisionId,
                    userId: value.userId || match.value[`${side}Id`]
                })
            }
        });
        this.form = form;
        this.match = match;
        this.season = season;
        this.side = side;
        this.valid = valid;
    }

    public async delete(): Promise<Pg.QueryResult>
    {
        return await this.pg.query(
                `DELETE FROM league_table_records WHERE category_id = $1 AND season_id = $2 AND user_id = $3`,
            [this.value.categoryId, this.value.seasonId, this.value.userId]
        ).catch((err) =>
        {
            new ErrorCustom({at: `LeagueTableRecord.delete() DELETE FROM league_table_records`, err});
            return Promise.reject(err);
        });
    }

    public get fieldsFutRelated(): { draws?: number, goalsAgainst?: number, goalsFor?: number }
    {
        return {
            ...(this.fut && {
                overtimeLosses: 0,
                overtimeWins: 0
            }),
            ...(!this.fut && {
                draws: 0
            })
        };
    }

    public async formUpdate(): Promise<MatchForm>
    {
        this.form = await this.pg.query(
                `SELECT ARRAY_AGG(result_get($1, home_id, away_id, home_goals, away_goals, overtime)) AS form FROM (SELECT * FROM matches 
                              WHERE $1 IN (away_id, home_id) AND division_id = $2 AND season_id = $3 AND result_written IS NOT NULL ORDER BY result_written DESC LIMIT 5) AS form_matches`,
            [this.value.userId, this.value.divisionId, this.value.seasonId]
        ).then((result: Merge<Pg.QueryResult, { rows: [{ form: MatchForm }] }>) =>
        {
            return Tomwork.queryParse(result).rows[0].form;
        });

        return Promise.resolve(this.form);
    }

    public async futIs(): Promise<boolean>
    {
        const categoryId: number = this.division ? this.division.value.categoryId : this.value.categoryId;

        return await this.pg.query(
                `SELECT * FROM categories WHERE id = $1`,
            [categoryId]
        ).then((result: CategoryQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0].name.includes(`Fut`);
        });
    }

    public async init(): Promise<void>
    {
        this.initialized = true;

        if (!this.season)
        {
            this.season = await (this.value.seasonId ? this.pg.query(
                    `SELECT * FROM league_seasons WHERE id = $1`,
                [this.value.seasonId]
            ).then((result: LeagueSeasonQueryResult) =>
            {
                return Tomwork.queryParse(result).rows[0];
            }) : new LeagueSeasons({pg: this.pg}).findLast(this.value.divisionId ? {} : {seasonStart: {$lte: new Date()}})) as LeagueSeasonValue;
        }

        this.value.seasonId = this.season.id;

        if (!this.value.divisionId)
        {
            const {categoryId} = this.value;
            const matchTypeId: number = (await this.pg.query(`SELECT * FROM matches_types WHERE name = 'league'`).then((result: MatchesTypeQueryResult) =>
            {
                return Tomwork.queryParse(result).rows[0] as MatchesTypeValue;
            })).id;

            this.division = await (async () =>
            {
                if (this.valid === false || !this.seasonStartedIs)
                {
                    return null;
                }

                const divisionFound: Division = new Division({io: this.io, pg: this.pg, res: this.res, value: {categoryId, matchTypeId}});

                await divisionFound.init().catch((err) =>
                {
                    new ErrorCustom({at: `LeagueTableRecord.init() Division.init()`, err});
                    return Promise.reject(err);
                });

                await divisionFound.upsert().catch((err) =>
                {
                    new ErrorCustom({at: `LeagueTableRecord.init() Division.upsert()`, err});
                    return Promise.reject(err);
                });

                this.value.divisionId = divisionFound.value.id;
                return divisionFound;
            })();

            this.fut = await this.futIs();
        }
    }

    public get matchResult(): MatchResult
    {
        const goals: number = this.match.value[`${this.side}Goals`];
        const goalsOther: number = this.match.value[`${this.side === `home` ? `away` : `home`}Goals`];

        const goalComparison: 'win' | 'draw' | 'loss' = (() =>
        {
            if (goals > goalsOther)
            {
                return `win`;
            }
            else if (goals === goalsOther)
            {
                return `draw`;
            }

            return `loss`;
        })();

        const {overtime} = this.match.value;

        return `${overtime ? `overtime` : ``}${overtime ? goalComparison[0].toUpperCase() : goalComparison[0]}${goalComparison.slice(1)}` as MatchResult;
    }

    public get matchResultColumnName(): MatchResultColumnName
    {
        return {
            draw: `draws`,
            loss: `losses`,
            overtimeLoss: `overtimeLosses`,
            overtimeWin: `overtimeWins`,
            win: `wins`
        }[this.matchResult] as MatchResultColumnName;
    }

    public get seasonStartedIs(): boolean
    {
        return Moment().diff(Moment(this.season.seasonStart)) >= 0;
    }

    public get sideOther(): MatchSide
    {
        return {away: `home`, home: `away`}[this.side] as MatchSide;
    }

    public async upsert(): Promise<LeagueTableRecordQueryResult>
    {
        if (!this.initialized)
        {
            await this.init().catch((err) =>
            {
                new ErrorCustom({at: `LeagueTableRecord.upsert() LeagueTableRecord.init()`, err});
                return Promise.reject(err);
            });
        }

        const {io, pg, res, value: {divisionId, seasonId}} = this;

        type MatchColumns = {
            draws?: 1,
            goalsAgainst?: number,
            goalsFor?: number,
            losses?: 1,
            matches?: 1,
            overtimeLosses?: 1,
            overtimeWins?: 1,
            points?: 0 | 1 | 2 | 3
            wins?: 1
        };

        const matchColumns: MatchColumns = this.match ? {
            goalsAgainst: this.match.value[`${this.sideOther}Goals`],
            goalsFor: this.match.value[`${this.side}Goals`],
            matches: 1,
            [this.matchResultColumnName]: 1,
            points: {draw: 1, loss: 0, overtimeLoss: 1, overtimeWin: 2, win: 3}[this.matchResult] as 0 | 1 | 2 | 3
        } : null;

        const insertValue: Merge<Partial<MatchColumns>, {
            categoryId?: number,
            divisionId?: number,
            seasonId: number,
            userId: number
        }> = {
            ...((!this.seasonStartedIs || this.valid === false) && {
                categoryId: this.value.categoryId || null
            }),
            ...(this.seasonStartedIs && this.valid !== false && {
                divisionId: (this.match && this.match.value.divisionId) || this.value.divisionId || null
            }),
            ...(this.match && {...matchColumns}),
            seasonId,
            userId: this.value.userId
        };

        // @ts-ignore
        const promises: [LeagueTableRecordQueryResult, LeagueSeasonsDivisionQueryResult] = await Promise.all([
            this.pg.query(
                pgFormat(`INSERT INTO league_table_records(%s) VALUES(%s)
                                ON CONFLICT(COALESCE(category_id, -1), COALESCE(division_id, -1), season_id, user_id) DO %s RETURNING *`,
                    Tomwork.columnListGet(Object.keys(insertValue)),
                    Tomwork.insertValuesGet(Object.values(insertValue)),
                    matchColumns ? `UPDATE SET ${Tomwork.updateSetGet(matchColumns, {onConflict: true, tableName: `leagueTableRecords`})}` : `NOTHING`)
            ).then((result: LeagueTableRecordQueryResult) =>
            {
                return Tomwork.queryParse(result);
            }),
            ...(this.value.divisionId ? [new LeagueSeasonsDivision({io, pg, res, value: {divisionId, seasonId}}).upsert()] : [])
        ]).catch((err) =>
        {
            new ErrorCustom({at: `LeagueTableRecord.upsert() Promise.all()`, err});
            return Promise.reject(err);
        });

        this.value = {...this.value, ...promises[0].rows[0]};

        return promises[0];
    }

    public async validate(): Promise<Merge<Pg.QueryResult, { rows: [LeagueTableRecordValue] }>>
    {
        if (!this.initialized)
        {
            await this.init().catch((err) =>
            {
                new ErrorCustom({at: `LeagueTableRecord.upsert() LeagueTableRecord.init()`, err});
                return Promise.reject(err);
            });
        }

        const {id} = this.value;

        const fieldsFutRelatedSetList: string = Object.entries(this.fieldsFutRelated).map(([fieldFutRelatedKey, fieldFutRelatedValue]) =>
        {
            return `${new VueString(fieldFutRelatedKey).caseSnakeTo().toString()} = ${fieldFutRelatedValue}`;
        }).join(`, `);

        return this.pg.query(
            pgFormat(
                    `UPDATE league_table_records SET %s WHERE id = $1 RETURNING *`,
                this.seasonStartedIs ? pgFormat(`division_id = %s, %s, category_id = NULL`, this.value.divisionId, fieldsFutRelatedSetList) : ``
            ),
            [id]
        ).then(async (result: LeagueTableRecordQueryResult) =>
        {
            this.value = {...this.value, ...result.rows[0]};

            const {io, pg, res} = this;
            const {divisionId, seasonId} = this.value;

            if (this.seasonStartedIs)
            {
                await new LeagueSeasonsDivision({io, pg, res, value: {divisionId, seasonId}}).upsert().catch((err) =>
                {
                    new ErrorCustom({at: `leagueTableRecords.updateOne() LeagueSeasonsDivisions.upsert()`, err});
                });
            }

            return Promise.resolve(result);
        }).catch((err) =>
        {
            new ErrorCustom({at: `leagueTableRecords.updateOne()`, err});
            return Promise.reject(err);
        });
    }

    public get valuePublic(): LeagueTableRecordValuePublic
    {
        return (({id, divisionId, dnfAfterWeeks, draws, goalsAgainst, goalsFor, losses, matches, overtimeLosses, overtimeWins, points, seasonId, userId, wins}: LeagueTableRecordValue) =>
        {
            return {
                id,
                divisionId,
                ...(typeof dnfAfterWeeks === `number` && {dnfAfterWeeks}),
                ...(typeof draws !== `undefined` && {draws}),
                form: this.form,
                goalDifference: goalsFor - goalsAgainst,
                losses,
                matches,
                ...(typeof overtimeLosses !== `undefined` && {overtimeLosses}),
                ...(typeof overtimeWins !== `undefined` && {overtimeWins}),
                points,
                score: [goalsFor, goalsAgainst] as [number, number],
                seasonId,
                userId,
                wins
            };
        })(this.value);
    }
}
