import {Row, RowValue}                                    from './Row';
import * as WebSocket                                     from 'ws';
import * as Express                                       from 'express';
import * as Pg                                            from 'pg';
import {ErrorCustom}                                      from '../ErrorCustom';
import {PlatformName, PlatformQueryResult, PlatformValue} from './Platform';
import {Tomwork}                                          from '..';

export type UserUsernameInGameValue = Merge<RowValue, {
    platformId: number,
    userId: number,
    username: string
}>;

export type UserUsernameInGameQueryResult = Merge<Pg.QueryResult, { rows: [UserUsernameInGameValue] }>;

export class UserUsernameInGame extends Row
{
    public initialized: boolean = false;
    public platform?: PlatformValue;
    public platformName?: PlatformName;
    public value: UserUsernameInGameValue;

    constructor({io, platformName, pg, req, res, value}: { io?: WebSocket.Server, platformName?: PlatformName, pg?: Pg.Client, req?: Express.Request, res?: Express.Response, value: Partial<UserUsernameInGameValue> })
    {
        super({io, pg, req, res, value});
        this.platformName = platformName;
    }

    public async init(): Promise<void>
    {
        this.initialized = true;
        this.platform = await this.pg.query(`SELECT * FROM platforms WHERE name = $1`, [this.platformName]).then((result: PlatformQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0];
        }).catch((err)=>
        {
            new ErrorCustom({at: `UserUsernamesInGame.init() SELECT platforms`, err});
            return Promise.reject(err);
        });
        this.value.platformId = this.platform.id;
    }

    public async insert(): Promise<UserUsernameInGameQueryResult>
    {
        if (!this.initialized)
        {
            await this.init().catch((err) =>
            {
                this.error({message: err, status: 422});
                return Promise.reject(err);
            });
        }

        const usernameDocumentCurrent: UserUsernameInGameValue = await this.pg.query(
            `SELECT * FROM users_usernames_in_game WHERE platform_id = $1 AND user_id = $2 ORDER BY id DESC LIMIT 1`,
            [this.value.platformId, this.value.userId]
        ).then((result: UserUsernameInGameQueryResult)=>
        {
            return Tomwork.queryParse(result).rows[0];
        }).catch((err)=>
        {
            new ErrorCustom({at: `UserUsernamesInGame.insert() SELECT users_usernames_in_game`, err});
            return Promise.reject(err);
        });

        if (usernameDocumentCurrent && this.value.username === usernameDocumentCurrent.username)
        {
            const err: string = `Username identical to the current one`;
            new ErrorCustom({at: `UserUsernamesInGame.insert() SELECT users_usernames_in_game`, err});
            return Promise.reject(err);
        }

        return await this.pg.query(
            `INSERT INTO users_usernames_in_game(platform_id, user_id, username) VALUES($1, $2, $3) RETURNING *`,
            [this.value.platformId, this.value.userId, this.value.username]
        ).then((result: UserUsernameInGameQueryResult) =>
        {
            return Tomwork.queryParse(result);
        }).catch((err) =>
        {
            new ErrorCustom({at: `UserUsernamesInGame.insert() INSERT INTO users_usernames_in_game`, err});
            return Promise.reject(err);
        });
    }
}
