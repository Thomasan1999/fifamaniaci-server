"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = void 0;
const Table_1 = require("./Table");
class Messages extends Table_1.Table {
    static tabLookup({ query }) {
        return [
            {
                $lookup: {
                    from: `messagesTabs`,
                    let: {
                        messageAddresseeId: `$addresseeId`,
                        messageCreatedById: `$createdById`
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $ifNull: [`$$messageAddresseeId`, false]
                                        },
                                        {
                                            $eq: [`$categoryId`, query.categoryId]
                                        },
                                        {
                                            $or: [
                                                {
                                                    $and: [
                                                        { $eq: [`$addresseeId`, `$$messageAddresseeId`] },
                                                        { $eq: [`$createdById`, `$$messageCreatedById`] }
                                                    ]
                                                },
                                                {
                                                    $and: [
                                                        { $eq: [`$addresseeId`, `$$messageCreatedById`] },
                                                        { $eq: [`$createdById`, `$$messageAddresseeId`] }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: `tab`
                }
            }
        ];
    }
}
exports.Messages = Messages;
//# sourceMappingURL=Messages.js.map