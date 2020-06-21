import * as Pg     from 'pg';
import {Table}     from './Table';
import {UserValue} from '../row/User';

export type UsersQueryResult = Merge<Pg.QueryResult, { rows: UserValue[] }>;

export class Users extends Table
{
    public static onlineLookup(): object[]
    {
        return [
            {
                $lookup: {
                    from: `usersOnline`,
                    localField: `id`,
                    foreignField: `userId`,
                    as: `online`
                }
            }
        ];
    }

    public static usernamesInGameLookup(): object[]
    {
        return [
            {
                $lookup: {
                    from: `usersUsernamesInGame`,
                    let: {
                        userId: `$id`
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [`$userId`, `$$userId`]
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            $sort: {
                                id: 1
                            }
                        },
                        {
                            $lookup: {
                                from: `platforms`,
                                localField: `platformId`,
                                foreignField: `id`,
                                as: `platform`
                            }
                        },
                        {
                            $addFields: {
                                platform: {$arrayElemAt: [`$platform`, 0]}
                            }
                        }
                    ],
                    as: `usernamesInGame`
                }
            }
        ];
    }
}
