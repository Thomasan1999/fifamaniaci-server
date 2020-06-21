import {ErrorCustom, Tomwork}                                                                    from '..';
import {UserQueryResult, UserValue}                                                              from './User';
import * as Express                                                                              from 'express';
import * as WebSocket                                                                            from 'ws';
import * as Pg                                                                                   from 'pg';
import {MoneyTransactionsTypeName, MoneyTransactionsTypeQueryResult, MoneyTransactionsTypeValue} from './MoneyTransactionsType';
import {Row, RowValue}                                                                           from './Row';
import {CategoryName, CategoryValue}                                                             from './Category';
import {LeagueSeasons}                                                                           from '../table/LeagueSeasons';
import {VueObject}                                                                               from '../types';
import {LoginSession}                                                                            from './LoginSession';

export type MoneyTransactionValue = Merge<RowValue, {
    categoryId?: number;
    money: number;
    place?: number;
    seasonId?: number;
    transactionTypeId: number;
    userId: number;
}>

export type MoneyTransactionInsertValue = {
    categoryId?: number,
    money: number,
    place?: number,
    seasonId?: number,
    transactionTypeId: number,
    userId: number
};

export type MoneyTransactionQueryResult = Merge<Pg.QueryResult, { rows: [MoneyTransactionValue] }>

export class MoneyTransaction extends Row
{
    public categoryName: CategoryName;
    public initialized: boolean = false;
    public transactionType: Partial<MoneyTransactionsTypeValue> = {};
    public user: UserValue;
    public username: string;
    public value: MoneyTransactionValue;

    constructor({categoryName, io, pg, req, res, transactionTypeName, username, value}: {
        categoryName: CategoryName,
        io: WebSocket.Server,
        pg: Pg.Client,
        req?: Express.Request,
        res: Express.Response,
        transactionTypeName: MoneyTransactionsTypeName,
        username: string,
        value: Partial<MoneyTransactionValue>
    })
    {
        super({io, pg, req, res, value: {...value, money: value.money}});
        this.categoryName = categoryName;
        this.transactionType.name = transactionTypeName;
        this.username = username;
    }

    public async init(): Promise<void>
    {
        this.initialized = true;

        this.transactionType = await this.pg.query(
                `SELECT * FROM money_transactions_types WHERE name = $1`,
            [this.transactionType.name]
        ).then((result: MoneyTransactionsTypeQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0] as MoneyTransactionsTypeValue;
        });
        this.user = await this.pg.query(
                `SELECT * FROM users WHERE LOWER(username) = LOWER($1)`,
            [this.username]
        ).then((result: UserQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0] as UserValue;
        });
    }

    public async insert(): Promise<MoneyTransactionQueryResult>
    {
        if (!this.initialized)
        {
            await this.init().catch((err) =>
            {
                new ErrorCustom({at: `MoneyTransaction.upsert() MoneyTransaction.init()`, err});
                return Promise.reject(err);
            });
        }

        const insertValue: MoneyTransactionInsertValue = await this.insertValue();

        return await this.pg.query(
                `INSERT INTO money_transactions(category_id, money, place, season_id, transaction_type_id, user_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
            [insertValue.categoryId || null, insertValue.money, insertValue.place || null, insertValue.seasonId || null, insertValue.transactionTypeId, insertValue.userId]
        ).then(async (result: MoneyTransactionQueryResult) =>
        {
            const resultParsed: MoneyTransactionQueryResult = Tomwork.queryParse(result);

            this.value = {...result.rows[0], ...this.value};

            const {money, place} = this.value;
            const {username} = this;

            await this.pg.query(
                    `UPDATE users SET money = money + $1 WHERE username = $2 RETURNING *`,
                [money, username]
            ).then((resultUser: UserQueryResult) =>
            {
                const resultUserParsed = Tomwork.queryParse(resultUser);

                [this.user] = resultUserParsed.rows;
                return Promise.resolve(resultUserParsed);
            }).catch((err) =>
            {
                new ErrorCustom({at: `MoneyTransaction.upsert() users.updateOne()`, err});
                return Promise.reject(err);
            });

            await [...this.io.clients].filter((socket) =>
            {
                return this.user.id === socket.cookies.value.id && socket.cookies.value.token && socket.cookies.value.token.length === 64;
            }).reduce(async (a, socket) =>
            {
                await a;
                if (await new LoginSession({pg: this.pg, tokenPlain: socket.cookies.value.token, value: this.user}).find({res: false, verifiedOnly: false}))
                {
                    socket.emitCustom(`userPropsUpdate`, {
                        props: this.user,
                        transaction: {categoryName: this.categoryName, money, place, type: this.transactionType.name}
                    });
                }
            }, Promise.resolve());

            return Promise.resolve(resultParsed);
        }).catch((err) =>
        {
            new ErrorCustom({at: `MoneyTransaction.upsert() INSERT INTO money_transactions(...columns) VALUES(...values)`, err});
            return Promise.reject(err);
        });
    }

    public async insertValue(): Promise<MoneyTransactionInsertValue>
    {
        return (async ({money, place}) =>
        {
            const {categoryName, username} = this;

            if (!this.transactionType.id)
            {
                const err: string = `Transaction type not found`;

                new ErrorCustom({at: `MoneyTransaction.insertValue()`, err});
                this.error({message: err, status: 422});
                return Promise.reject(err);
            }

            if (!this.user.id)
            {
                const err: string = `${username ? `Username` : `Variable symbol`} not found`;

                new ErrorCustom({at: `MoneyTransaction.insertValue()`, err});
                this.error({message: err, status: 422});
                return Promise.reject(err);
            }

            return {
                ...(this.transactionType.fields && this.transactionType.fields.includes(`categoryId`) && {
                    categoryId: (await this.pg.query(
                            `SELECT id FROM categories WHERE name = $1`,
                        [categoryName]
                    ).then((result: Merge<Pg.QueryResult, Pick<CategoryValue, 'id'>>) =>
                    {
                        return new VueObject(result.rows[0]).camelCaseTo() as CategoryValue;
                    })).id
                }),
                money,
                ...(this.transactionType.fields && this.transactionType.fields.includes(`place`) && {place}),
                transactionTypeId: this.transactionType.id,
                ...(this.transactionType.fields && this.transactionType.fields.includes(`seasonId`) && {
                    seasonId: (await new LeagueSeasons({pg: this.pg}).findLast({seasonStart: {$lte: new Date()}})).id
                }),
                userId: this.user.id
            };
        })(this.value);
    }
}
