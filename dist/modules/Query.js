"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = void 0;
const Param_1 = require("./param/Param");
const Moment = require("moment-timezone");
const types_1 = require("./types");
class Query {
    constructor({ authRequired = true, params, projection, query, res }) {
        this.authRequired = authRequired;
        this.params = new types_1.VueObject({
            ...(query.id && { id: {} }),
            ...(query.limit && { limit: {} }),
            ...(query.lastId && { lastId: { required: false } }),
            ...params
        }).map(([paramName, param]) => {
            return new Param_1.Param({ name: paramName, ...param });
        }).value;
        this.res = res;
        this.limit = parseInt(process.env.FM_LAZY_LOADING_LIMIT);
        this.value = {};
        Object.values(this.params).forEach((param) => {
            param.required = param.required !== false;
        });
        Object.entries(this.params).filter(([paramName, param]) => {
            return param.required || typeof query[paramName] !== `undefined`;
        }).forEach(([paramName, param]) => {
            const value = query[paramName];
            this.value[paramName] = (() => {
                if (!param.required && value === null) {
                    return null;
                }
                switch (param.type) {
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
        [`categoryId`, `categoryIdOld`, `categoryIdNew`].filter((paramName) => {
            const appTypeParamName = paramName.replace(`category`, `appType`);
            return this.params[paramName] && !this.value[paramName] && query[appTypeParamName];
        }).forEach((paramName) => {
            const appTypeParamName = paramName.replace(`category`, `appType`);
            const value = query[appTypeParamName];
            this.value[paramName] = (() => {
                if (!value) {
                    return null;
                }
                return value;
            })();
        });
        if (this.value.limit) {
            this.limit = this.value.limit;
        }
        if (query.auth && query.auth.id && query.auth.token) {
            this.auth = { id: parseInt(query.auth.id), token: query.auth.token };
            this.paramsExtra = new types_1.VueObject({
                ...{
                    id: {},
                    createdById: {},
                    token: {}
                }
            }).map(([paramName, param]) => {
                return new Param_1.Param({ name: paramName, ...param });
            }).value;
            this.createdById = this.auth.id;
        }
        const queryProjection = new types_1.VueObject({ ...query.projection }).map(([, param]) => {
            return { value: param };
        }).value;
        const projectionCache = Object.entries({ ...queryProjection, ...projection }).filter(([paramName, param]) => {
            return (param.value === true && projection[paramName].value === true) || param.value === false;
        }).reduce((a, [paramName, param]) => {
            a[paramName] = param;
            return a;
        }, {});
        this.projectionAuthNot = Object.entries(projectionCache).filter(([, param]) => {
            return !param.auth;
        }).reduce((a, [paramName, param]) => {
            a[paramName] = param.value;
            return a;
        }, {});
        this.projectionAuth = new types_1.VueObject(projectionCache).map(([, param]) => {
            return param.value;
        }).value;
        if (this.value.lastId) {
            this.olderThanLast = {
                id: { $lt: this.value.lastId }
            };
        }
    }
    get paramsAll() {
        return { ...this.params, ...this.paramsExtra };
    }
    paramValidate([name, value]) {
        const param = this.paramsAll[name];
        const { type, validateRegex } = param;
        if (typeof value === `undefined` || value === null || (value.length < param.length.min) || (value.length > param.length.max)) {
            return false;
        }
        switch (type) {
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
    get valid() {
        const paramsValidatable = Object.entries(this.value).filter(([paramName, param]) => {
            return !(!this.paramsAll[paramName].required && param === null);
        });
        const resCache = (() => {
            if (Object.values(this.value).every((param) => {
                return param === null;
            }) && Object.values(this.params).some((param) => {
                return param.required;
            })) {
                return { message: `Empty query string`, status: 400 };
            }
            else if (!paramsValidatable.every(([, param]) => {
                return param !== null && typeof param !== `undefined`;
            })) {
                return { message: `Missing required query parameters`, status: 400 };
            }
            else if (!paramsValidatable.every(([paramName, param]) => {
                return this.paramValidate([paramName, (param && param.value) || param]) || (!this.params[paramName].required && param === null);
            })) {
                return { message: `Invalid input format`, status: 400 };
            }
            else if (this.authRequired && !this.auth) {
                return { message: `Missing authentication`, status: 400 };
            }
            else if (this.authRequired && !Object.entries(this.auth).every((authProp) => {
                return this.paramValidate(authProp);
            })) {
                return { message: `Invalid authentication format`, status: 400 };
            }
            return {};
        })();
        const { message, status } = resCache;
        if (message && status && this.res) {
            this.res.status(status).json({ message });
        }
        return !(message && status);
    }
}
exports.Query = Query;
//# sourceMappingURL=Query.js.map