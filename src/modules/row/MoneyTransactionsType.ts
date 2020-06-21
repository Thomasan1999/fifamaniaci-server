import {RowValue} from './Row';
import * as Pg    from 'pg';

export type MoneyTransactionsTypeName =
    'bankTransfer'
    | 'leaguePrize'
    | 'leagueRegistration'
    | 'loyaltyReward'
    | 'loyaltyRewardAnullment'
    | 'rankingsMonthlyPrize'
    | 'regularSeasonWinPrize';

export type MoneyTransactionsTypeQueryResult = Merge<Pg.QueryResult, { rows: [MoneyTransactionsTypeValue] }>;

export type MoneyTransactionsTypeValue = Merge<RowValue, {
    fields?: ('categoryId' | 'place' | 'seasonId')[];
    name: MoneyTransactionsTypeName;
}>
