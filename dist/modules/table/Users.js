"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Table_1 = require("./Table");
class Users extends Table_1.Table {
    static onlineLookup() {
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
    static usernamesInGameLookup() {
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
                                platform: { $arrayElemAt: [`$platform`, 0] }
                            }
                        }
                    ],
                    as: `usernamesInGame`
                }
            }
        ];
    }
}
exports.Users = Users;
//# sourceMappingURL=Users.js.map