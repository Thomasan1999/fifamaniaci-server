import {Table} from './Table';

export class Messages extends Table
{
    public static tabLookup({query}: {query: {categoryId: number}}): object[]
    {
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
                                                        {$eq: [`$addresseeId`, `$$messageAddresseeId`]},
                                                        {$eq: [`$createdById`, `$$messageCreatedById`]}
                                                    ]
                                                },
                                                {
                                                    $and: [
                                                        {$eq: [`$addresseeId`, `$$messageCreatedById`]},
                                                        {$eq: [`$createdById`, `$$messageAddresseeId`]}
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
