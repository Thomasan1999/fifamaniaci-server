import * as Pg                                      from 'pg';
import * as pgFormat                                from 'pg-format';
import * as Express                                        from 'express';
import {MatchQueryResult, MatchSide, MatchValue}           from '../row/Match';
import {Matches, MatchesQueryResult}                       from './Matches';
import {LeagueSeasonQueryResult, LeagueSeasonValue}        from '../row/LeagueSeason';
import {MatchesTypeValue}                                  from '../row/MatchesType';
import {DivisionQueryResult, DivisionValue}                from '../row/Division';
import {LeagueTableRecordValue}                            from '../row/LeagueTableRecord';
import {LeagueTableRecords, LeagueTableRecordsQueryResult} from './LeagueTableRecords';
import {LeagueSeasons}                                     from './LeagueSeasons';
import {Tomwork}                                           from '..';
import {LeagueRegistrationsQueryResult}                    from 'modules/table/LeagueRegistrations';

export type MatchesPlayOffSeries = MatchValue[];
export type MatchesPlayOffRound = MatchesPlayOffSeries[];

export class MatchesPlayOff extends Matches
{
    public divisionLeague?: DivisionValue;
    public divisionPlayOff: DivisionValue;
    public initialized: boolean = false;
    public leagueTableRecords?: LeagueTableRecordValue[];
    public rounds: MatchesPlayOffRound[];
    public season?: LeagueSeasonValue;
    public seasonId?: number;
    public seriesWinners: (number | void)[][];
    public value: MatchValue[];

    constructor({pg, divisionLeague, divisionPlayOff, seasonId, res}: { pg: Pg.Client, divisionLeague?: DivisionValue, divisionPlayOff: DivisionValue, res?: Express.Response, seasonId?: number })
    {
        super({pg, res});
        this.divisionLeague = divisionLeague;
        this.divisionPlayOff = divisionPlayOff;
        this.seasonId = seasonId;
    }

    public async init(): Promise<void>
    {
        this.initialized = true;

        if (!this.divisionLeague)
        {
            const {categoryId, index, level} = this.divisionPlayOff;
            this.divisionLeague = (await this.pg.query(
                    `SELECT * FROM divisions
                                    INNER JOIN matches_types ON matches_types.name = 'league'
                                    WHERE category_id = $1 AND index = $2 AND level = $3`,
                [categoryId, index, level]
            ).then((result: DivisionQueryResult) =>
            {
                return Tomwork.queryParse(result).rows[0];
            }) as DivisionValue);
        }

        if (this.seasonId)
        {
            this.season = (await this.pg.query(
                    `SELECT * FROM league_seasons WHERE id = $1`,
                [this.seasonId]
            ).then((result: LeagueSeasonQueryResult) =>
            {
                return Tomwork.queryParse(result).rows[0];
            }) as LeagueSeasonValue);
        }
        else
        {
            this.season = (await new LeagueSeasons({pg: this.pg}).findLast({seasonStart: {$lte: new Date()}}) as LeagueSeasonValue);
            this.seasonId = this.season.id;
        }

        this.rounds = Array(this.roundsLimit).fill(null).map((_, roundIndex) =>
        {
            return Array(2 ** roundIndex).fill(null).map(() =>
            {
                return [];
            });
        });

        this.seriesWinners = Array(this.roundsLimit).fill(null).map(() =>
        {
            return [];
        });

        this.value = await this.pg.query(
                `SELECT * FROM matches WHERE division_id = $1 AND leg IS NOT NULL AND round IS NOT NULL AND series IS NOT NULL AND season_id = $2 ORDER BY round DESC, series ASC, leg ASC`,
            [this.divisionPlayOff.id, this.seasonId]
        ).then((result: MatchesQueryResult) =>
        {
            return Tomwork.queryParse(result).rows;
        });

        this.leagueTableRecords = await this.pg.query(
            `SELECT league_table_records.* FROM league_table_records
                              INNER JOIN divisions ON divisions.id = league_table_records.division_id
                              INNER JOIN league_registrations ON league_registrations.category_id = divisions.category_id AND league_registrations.dnf_after_weeks IS NULL AND league_registrations.season_id = league_table_records.season_id AND league_registrations.user_id = league_table_records.user_id
                              WHERE division_id = $1 and league_table_records.season_id = $2 ORDER BY points DESC, goals_for - goals_against DESC, goals_for DESC LIMIT $3`,
            [this.divisionLeague.id, this.seasonId, 2 ** this.roundsLimit]
        ).then((result: LeagueTableRecordsQueryResult) =>
        {
            return Tomwork.queryParse(result).rows;
        });

        this.value.forEach((match) =>
        {
            this.rounds[match.round][match.series][match.leg] = match;
        });

        [...this.rounds].reverse().forEach((round, roundIndexReversed) =>
        {
            const roundIndex: number = this.rounds.length - 1 - roundIndexReversed;

            round.forEach((series, seriesIndex) =>
            {
                this.seriesWinners[roundIndex][seriesIndex] = (() =>
                {
                    if (!series[0])
                    {
                        if (roundIndex >= this.roundLast)
                        {
                            const userIndex: number = MatchesPlayOff.userIndexGet({seriesCount: round.length, seriesIndex});
                            const userOtherIndex: number = MatchesPlayOff.userOtherIndexGet({seriesCount: MatchesPlayOff.seriesCountGet(roundIndex), userIndex});

                            return (this.leagueTableRecords[userIndex] && this.leagueTableRecords[userIndex].userId) || (this.leagueTableRecords[userOtherIndex] && this.leagueTableRecords[userOtherIndex].userId);
                        }

                        return;
                    }

                    return this.seriesWinnerGet(series);
                })();
            });
        });
    }

    public matchesOwnGet(userIds: number[]): MatchValue[]
    {
        return this.value.filter((match) =>
        {
            return userIds.some((userId) =>
            {
                return userId === match.homeId;
            }) && userIds.some((userId) =>
            {
                return userId === match.awayId;
            });
        });
    }

    public get roundsLimit(): number
    {
        return this.season.playOffRoundsLimit;
    }

    public get roundFirst(): number
    {
        return this.value.length === 0 ? Math.ceil(Math.log2(this.leagueTableRecords.length)) : this.value[0].round;
    }

    public get roundLast(): number
    {
        return this.value.length === 0 ? this.roundFirst : this.value[this.value.length - 1].round;
    }

    public async roundPush(): Promise<MatchesQueryResult[]>
    {
        const playedPreviously: boolean = this.value.length > 0;

        if (!this.initialized)
        {
            await this.init();
        }

        if (this.roundLast === 0)
        {
            return;
        }

        if (this.leagueTableRecords.length === 0)
        {
            return;
        }

        if (playedPreviously && this.seriesWinners[this.roundLast].some((seriesWinner) =>
        {
            return !seriesWinner;
        }))
        {
            return;
        }

        const outputPromises: MatchesQueryResult[] = [];

        const roundIndex: number = this.roundLast - 1;
        const seriesCount: number = MatchesPlayOff.seriesCountGet(roundIndex);
        const seriesMidpoint: number = seriesCount / 2;

        for (let seriesGenerateOrder: number = 0; seriesGenerateOrder < seriesCount; seriesGenerateOrder += 1)
        {
            const userIndex: number = MatchesPlayOff.userIndexGet({seriesCount, seriesGenerateOrder});
            const userOtherIndex: number = MatchesPlayOff.userOtherIndexGet({seriesCount, userIndex});

            const userIds: (number | void)[] = (() =>
            {
                if (this.seriesWinners[roundIndex + 1])
                {
                    return [this.seriesWinners[roundIndex + 1][userIndex * 2], this.seriesWinners[roundIndex + 1][(userIndex * 2) + 1]];
                }

                if (!this.leagueTableRecords[userIndex] || !this.leagueTableRecords[userOtherIndex])
                {
                    return [];
                }

                return [this.leagueTableRecords[userIndex].userId, this.leagueTableRecords[userOtherIndex].userId];
            })();

            if (!userIds[0] || !userIds[1])
            {
                continue;
            }

            type InsertValueType = {
                awayId?: number,
                divisionId: number,
                homeId?: number,
                leg: number,
                matchOrder: number,
                round: number,
                seasonId: number,
                series: number,
                week: number
            };

            const week: number = await this.pg.query(
                    `SELECT week FROM matches WHERE division_id = $1 AND result_written IS NOT NULL AND season_id = $2 ORDER BY week DESC LIMIT 1`,
                [this.divisionLeague.id, this.seasonId]
            ).then((result: Merge<Pg.QueryResult, { rows: [Pick<MatchValue, 'week'>] }>) =>
            {
                return Tomwork.queryParse(result).rows[0].week;
            }) + 1;

            const matchesInsertTo: InsertValueType[] = Array(this.winsLimit).fill(null).map((_, leg) =>
            {
                return {
                    [leg % 2 === 0 ? `homeId` : `awayId`]: userIds[0],
                    divisionId: this.divisionPlayOff.id,
                    [leg % 2 === 1 ? `homeId` : `awayId`]: userIds[1],
                    leg,
                    matchOrder: 0,
                    round: roundIndex,
                    seasonId: this.seasonId,
                    series: (seriesGenerateOrder < seriesCount / 2) ? seriesGenerateOrder * 2 : seriesCount - 1 - ((seriesGenerateOrder - seriesMidpoint) * 2),
                    week
                } as InsertValueType;
            }) as InsertValueType[];

            outputPromises.push(await this.pg.query(
                pgFormat(
                    `INSERT INTO(%s) VALUES%s RETURNING *`,
                    Tomwork.columnListGet(Object.keys(matchesInsertTo[0])),
                    matchesInsertTo.map((match) =>
                    {
                        return `(${Tomwork.insertValuesGet(Object.values(match))})`;
                    }).join(`,`)
                )
            ).then((result: MatchesQueryResult) =>
            {
                return Tomwork.queryParse(result);
            }));

            this.value.push(...outputPromises[0].rows);
        }

        this.initialized = false;
        return outputPromises;
    }

    public static seriesCountGet(roundIndex: number): number
    {
        return 2 ** roundIndex;
    }

    public seriesWinnerGet(series: MatchValue[]): number | void
    {
        if (!series[0])
        {
            return;
        }

        const user1Id: number = series[0].homeId;
        const user2Id: number = series[0].awayId;

        const [user1Wins, user2Wins]: [number, number] = series.reduce((a: [number, number], match: MatchValue) =>
        {
            const winner: MatchSide = match.homeGoals > match.awayGoals ? `home` : `away`;

            if (user1Id === match[`${winner}Id`])
            {
                a[0] += 1;
            }
            else
            {
                a[1] += 1;
            }

            return a;
        }, [0, 0]);

        if (user1Wins === this.winsLimit)
        {
            return user1Id;
        }

        if (user2Wins === this.winsLimit)
        {
            return user2Id;
        }
    }

    public static userIndexGet({seriesCount, seriesIndex, seriesGenerateOrder}: { seriesCount: number, seriesIndex?: number, seriesGenerateOrder?: number }): number
    {
        if (typeof seriesGenerateOrder === `undefined`)
        {
            return seriesIndex % 2 === 0 ? seriesIndex / 2 : MatchesPlayOff.userOtherIndexGet({seriesCount: seriesCount / 2, userIndex: (seriesIndex - 1) / 2});
        }

        return seriesGenerateOrder;
    }

    public static userOtherIndexGet({seriesCount, userIndex}: { seriesCount: number, userIndex: number }): number
    {
        return (seriesCount * 2) - 1 - userIndex;
    }

    public get winsLimit(): number
    {
        return this.season.playOffWinsLimit;
    }
}

