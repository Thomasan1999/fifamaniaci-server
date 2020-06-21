import {Param}                     from './param/Param';
import * as Express                from 'express';
import * as Moment                 from 'moment-timezone';
import {VueObject}                 from './types';
import {MatchSide}                 from './row/Match';
import {MoneyTransactionsTypeName} from './row/MoneyTransactionsType';
import {CategoryName}              from './row/Category';
import {param}                     from '../modules/index';

export type QueryAuth = {
    id: number,
    token: string
}

export type QueryProjectionValue = {
    auth?: boolean,
    value?: boolean
}

export type QueryProjection = {
    [s: string]: QueryProjectionValue
}

type Projection = {
    [s: string]: boolean
}

export type QueryParamsArgument = {
    [s: string]: { required?: boolean }
}

export type QueryValue = {
    id?: number;
    addresseeId?: number;
    awayId?: number;
    categoryId?: number;
    categoryIdNew?: number;
    categoryIdOld?: number;
    categoryName: CategoryName;
    awayGoals?: number;
    canceledAt?: number;
    canceledBy?: MatchSide;
    createdBy?: MatchSide;
    createdById?: number;
    divisionId?: number;
    email?: string;
    fbLink?: string;
    homeId?: number;
    homeGoals?: number;
    lang?: string;
    lastId?: number;
    leagueRegistration?: boolean;
    limit?: number;
    message?: string;
    money?: number;
    overtime?: boolean;
    password?: string;
    passwordCurrent?: string;
    passwordNew?: string;
    passwordResetToken?: string;
    place?: number;
    playedAt?: string;
    seasonId?: number;
    tabId?: number;
    transactionType?: MoneyTransactionsTypeName;
    typeId?: number;
    username?: string;
    usernamesInGamePs4?: string;
    usernamesInGameXboxOne?: string;
    usernamesInGamePc?: string;
    variableSymbol?: number;
    verificationCode?: string;
}

export class Query
{
    public auth?: QueryAuth;

    public authRequired: boolean;

    public createdById: number;

    public limit: number;

    public olderThanLast: {
        id: { $lt: number }
    };

    public params: {
        [s: string]: Param
    };

    public paramsExtra: {
        [s: string]: Param
    };

    public projection: QueryProjection;

    public projectionAuth: Projection;

    public projectionAuthNot: Projection;

    public res: Express.Response;

    public value: Partial<QueryValue>;

    constructor({authRequired = true, params, projection, query, res}: { authRequired?: boolean, params: { [s: string]: any }, projection?: QueryProjection, res: Express.Response, query: any })
    {
        this.authRequired = authRequired;

        this.params = new VueObject({
            ...(query.id && {id: {}}),
            ...(query.limit && {limit: {}}),
            ...(query.lastId && {lastId: {required: false}}),
            ...params
        }).map(([paramName, param]) =>
        {
            return new Param({name: paramName, ...param});
        }).value;

        this.res = res;
        this.limit = parseInt(process.env.FM_LAZY_LOADING_LIMIT);
        this.value = {};

        Object.values(this.params).forEach((param) =>
        {
            param.required = param.required !== false;
        });

        Object.entries(this.params).filter(([paramName, param]) =>
        {
            return param.required || typeof query[paramName] !== `undefined`;
        }).forEach(([paramName, param]) =>
        {
            const value = query[paramName];

            this.value[paramName] = (() =>
            {
                if (!param.required && value === null)
                {
                    return null;
                }

                switch (param.type)
                {
                    case `money`:
                        return parseFloat(value);
                    case `integer`:
                        return parseInt(value);
                    case `float`:
                        return parseFloat(value);
                    default:
                        return value;
                }
            })();
        });

        [`categoryId`, `categoryIdOld`, `categoryIdNew`].filter((paramName) =>
        {
            const appTypeParamName: string = paramName.replace(`category`, `appType`);

            return this.params[paramName] && !this.value[paramName] && query[appTypeParamName];
        }).forEach((paramName) =>
        {
            const appTypeParamName: string = paramName.replace(`category`, `appType`);

            const value: string = query[appTypeParamName];

            this.value[paramName] = (() =>
            {
                if (!value)
                {
                    return null;
                }

                return value;
            })();
        });

        if (this.value.limit)
        {
            this.limit = this.value.limit;
        }

        if (query.auth && query.auth.id && query.auth.token)
        {
            this.auth = {id: parseInt(query.auth.id), token: query.auth.token};

            this.paramsExtra = new VueObject({
                ...{
                    id: {},
                    createdById: {},
                    token: {}
                }
            }).map(([paramName, param]) =>
            {
                return new Param({name: paramName, ...param});
            }).value;

            this.createdById = this.auth.id;
        }

        const queryProjection = new VueObject({...query.projection}).map(([, param]) =>
        {
            return {value: param};
        }).value;

        const projectionCache: QueryProjection = Object.entries({...queryProjection, ...projection}).filter(([paramName, param]: [string, QueryProjectionValue]) =>
        {
            return (param.value === true && projection[paramName].value === true) || param.value === false;
        }).reduce((a, [paramName, param]) =>
        {
            a[paramName] = param;
            return a;
        }, {});

        this.projectionAuthNot = Object.entries(projectionCache).filter(([, param]) =>
        {
            return !param.auth;
        }).reduce((a, [paramName, param]) =>
        {
            a[paramName] = param.value;
            return a;
        }, {});

        this.projectionAuth = new VueObject(projectionCache).map(([, param]) =>
        {
            return param.value;
        }).value;

        if (this.value.lastId)
        {
            this.olderThanLast = {
                id: {$lt: this.value.lastId}
            };
        }
    }

    public get paramsAll(): {
        [s: string]: Param
    }
    {
        return {...this.params, ...this.paramsExtra};
    }

    private paramValidate([name, value]): boolean
    {
        const param = this.paramsAll[name];
        const {type, validateRegex} = param;

        if (typeof value === `undefined` || value === null || (value.length < param.length.min) || (value.length > param.length.max))
        {
            return false;
        }

        switch (type)
        {
            case `boolean`:
                return typeof value === `boolean`;
            case `date`:
                return Moment(value).isValid();
            case `float`:
                return validateRegex.test(value) && parseFloat(value) === value && !(value < param.min) && !(value > param.max);
            case `integer`:
                return validateRegex.test(value) && parseInt(value) === value && !(value < param.min) && !(value > param.max);
            case `money`:
                return validateRegex.test(value.toString());
            default:
                return validateRegex.test(value);
        }
    }

    public get valid(): boolean
    {
        const paramsValidatable: any[] = Object.entries(this.value).filter(([paramName, param]) =>
        {
            return !(!this.paramsAll[paramName].required && param === null);
        });

        const resCache: { message?: string, status?: number } = (() =>
        {
            if (Object.values(this.value).every((param) =>
            {
                return param === null;
            }) && Object.values(this.params).some((param) =>
            {
                return param.required;
            }))
            {
                return {message: `Empty query string`, status: 400};
            }
            else if (!paramsValidatable.every(([, param]) =>
            {
                return param !== null && typeof param !== `undefined`;
            }))
            {
                return {message: `Missing required query parameters`, status: 400};
            }
            else if (!paramsValidatable.every(([paramName, param]) =>
            {
                return this.paramValidate([paramName, (param && param.value) || param]) || (!this.params[paramName].required && param === null);
            }))
            {
                return {message: `Invalid input format`, status: 400};
            }
            else if (this.authRequired && !this.auth)
            {
                return {message: `Missing authentication`, status: 400};
            }
            else if (this.authRequired && !Object.entries(this.auth).every((authProp) =>
            {
                return this.paramValidate(authProp);
            }))
            {
                return {message: `Invalid authentication format`, status: 400};
            }

            return {};
        })();

        const {message, status} = resCache;

        if (message && status && this.res)
        {
            this.res.status(status).json({message});
        }

        return !(message && status);
    }
}
