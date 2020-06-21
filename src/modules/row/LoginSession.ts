import {ErrorCustom, Token, Tomwork} from '..';
import {UserValue}                   from './User';
import * as Express                  from 'express';
import * as bcrypt                   from 'bcrypt';
import * as Pg                       from 'pg';
import {Row, RowValue}               from './Row';
import {VueObject}                   from '../types';
import {QueryResultCount}            from 'types/pg';
import {LoginSessionsQueryResult}    from 'modules/table/LoginSessions';

export type LoginSessionValue = Merge<RowValue, {
    sessionFrom: Date;
    sessionTo?: Date;
    token: string;
    userId: number;
}>

export type LoginSessionQueryResult = Merge<Pg.QueryResult, { rows: [LoginSessionValue] }>;

export class LoginSession extends Row
{
    tokenPlain: string;
    user: UserValue;
    value: LoginSessionValue;

    constructor({pg, res, tokenPlain, value}: { pg?: Pg.Client, res?: Express.Response, tokenPlain, value: UserValue })
    {
        super({pg, res, value: {}});
        this.tokenPlain = tokenPlain;
        this.user = value;
    }

    public async end(): Promise<void>
    {
        await this.find({verifiedOnly: false}).then(async (loginSession) =>
        {
            await this.pg.query(
                    `UPDATE login_sessions SET session_to = CURRENT_TIMESTAMP WHERE token = $1 AND user_id = $2`,
                [loginSession.token, this.user.id]
            );
        }).catch((err) =>
        {
            new ErrorCustom({at: `LoginSession.end()`, err});
            return Promise.reject(err);
        });
    }

    public async find({res = true, verifiedOnly = true}: { res?: boolean, verifiedOnly?: boolean } = {}): Promise<LoginSessionValue>
    {
        const loginSessionFound: LoginSessionValue = await this.pg.query(
                `SELECT * FROM login_sessions WHERE session_to IS NULL AND user_id = $1`,
            [this.user.id]
        ).then(async (result: LoginSessionsQueryResult) =>
        {
            const resultParsed = Tomwork.queryParse(result);

            return await Promise.all((resultParsed.rows).map(async (loginSession) =>
            {
                if (await bcrypt.compare(this.tokenPlain, loginSession.token))
                {
                    this.value = new VueObject(loginSession).camelCaseTo();
                    return Promise.reject(loginSession);
                }
            })).then(() =>
            {
                return Promise.reject(null);
            }).catch((loginSession) =>
            {
                return Promise.resolve(loginSession);
            });
        });

        if (verifiedOnly && await this.pg.query(
            `SELECT COUNT(*)::integer FROM users WHERE id = $1 AND verification_code IS NOT NULL`,
            [this.user.id]
        ).then((result: QueryResultCount) =>
        {
            return Tomwork.queryParse(result).rows[0].count;
        }))
        {
            const err: string = `Email address not verified`;

            if (res)
            {
                this.error({message: err, status: 422});
            }

            new ErrorCustom({at: `LoginSession.find()`, err});
            return Promise.reject(err);
        }

        if (loginSessionFound)
        {
            return loginSessionFound;
        }

        const err: string = `Invalid authentication data`;

        if (res)
        {
            this.error({message: err, status: 422});
        }

        new ErrorCustom({at: `LoginSession.find()`, err});
        return Promise.reject(err);
    }

    public async insert(): Promise<LoginSessionQueryResult>
    {
        this.tokenPlain = new Token().value;

        const loginSessionNew: {
            sessionFrom: Date,
            token: string,
            userId: number,
        } = {
            sessionFrom: new Date(),
            token: await bcrypt.hash(this.tokenPlain, 10),
            userId: this.user.id
        };

        return await this.pg.query(
                `INSERT INTO login_sessions(session_from, token, user_id) VALUES($1, $2, $3) RETURNING *`,
            [loginSessionNew.sessionFrom, loginSessionNew.token, loginSessionNew.userId]
        ).catch((err) =>
        {
            this.error({message: `Login session not created`, status: 500});
            new ErrorCustom({at: `LoginSession.insert()`, err});
            return Promise.reject(err);
        }) as LoginSessionQueryResult;
    }
}
