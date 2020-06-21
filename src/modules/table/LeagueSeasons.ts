import {Table}             from './Table';
import {LeagueSeasonValue} from '../row/LeagueSeason';
import * as Express        from 'express';
import * as WebSocket      from 'ws';
import * as Pg             from 'pg';

export type LeagueSeasonsQueryResult = Merge<Pg.QueryResult, { rows: LeagueSeasonValue[] }>;


export class LeagueSeasons extends Table
{
    public value: LeagueSeasonValue[];

    constructor({io, pg, res}: { io?: WebSocket.Server, pg?: Pg.Client, res?: Express.Response })
    {
        super({io, name: `leagueSeasons`, pg, res});
    }

    public static divisionsLookup(): object[]
    {
        return [
            {
                $lookup: {
                    from: `leagueSeasonsDivisions`,
                    as: `divisions`,
                    let: {
                        leagueSeasonId: `$id`
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [`$$leagueSeasonId`, `$seasonId`]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: `divisions`,
                                as: `division`,
                                localField: `divisionId`,
                                foreignField: `id`
                            }
                        },
                        {
                            $addFields: {
                                division: {
                                    $arrayElemAt: [`$division`, 0]
                                }
                            }
                        },
                        {
                            $addFields: {
                                categoryId: `$division.categoryId`
                            }
                        },
                        {
                            $lookup: {
                                from: `matchTypes`,
                                localField: `division.matchTypeId`,
                                foreignField: `id`,
                                as: `matchType`
                            }
                        },
                        {
                            $addFields: {
                                matchType: {
                                    $arrayElemAt: [`$matchType`, 0]
                                }
                            }
                        },
                        {
                            $match: {
                                'matchType.name': `league`
                            }
                        },
                        {
                            $project: {
                                division: false,
                                divisionSize: false,
                                matchType: false,
                                updated: false
                            }
                        }
                    ]
                }
            }
        ];
    }
}
