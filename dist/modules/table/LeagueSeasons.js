"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Table_1 = require("./Table");
class LeagueSeasons extends Table_1.Table {
    constructor({ io, pg, res }) {
        super({ io, name: `leagueSeasons`, pg, res });
    }
    static divisionsLookup() {
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
exports.LeagueSeasons = LeagueSeasons;
//# sourceMappingURL=LeagueSeasons.js.map