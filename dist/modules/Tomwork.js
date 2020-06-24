"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tomwork = void 0;
const equalIs = require("fast-deep-equal");
const Moment = require("moment-timezone");
const types_1 = require("./types");
class Tomwork {
    static columnListGet(projection, valuesCustom = {}) {
        const columns = projection instanceof Array ? projection : Object.entries(projection).filter(([, include]) => {
            return include;
        }).map(([columnName]) => {
            return columnName;
        });
        return columns.map((columnName) => {
            return valuesCustom[columnName] || new types_1.VueString(columnName).caseSnakeTo().toString();
        }).join(`,`);
    }
    static clone(obj) {
        if (typeof obj !== `object` || obj === null) {
            return obj;
        }
        if (obj instanceof Date) {
            return new Date(obj.valueOf());
        }
        if (obj instanceof Moment) {
            return obj.clone();
        }
        if (obj instanceof RegExp) {
            return new RegExp(obj);
        }
        const clone = obj instanceof Array ? [] : {};
        Object.keys(obj).forEach((i) => {
            clone[i] = Tomwork.clone(obj[i]);
        });
        return clone;
    }
    static emptyIs(val = {}) {
        if (val === null) {
            return true;
        }
        if (typeof val === `number`) {
            return false;
        }
        if (val instanceof Array) {
            return !val.length;
        }
        return !Object.keys(val).length;
    }
    static insertValuesGet(values) {
        return values.map(Tomwork.queryValueParse).join(`,`);
    }
    static merge(obj1, obj2) {
        if (typeof obj1 === `undefined`) {
            return Tomwork.clone(obj2);
        }
        const objMerged = Tomwork.clone(obj1);
        if (typeof obj2 === `undefined`) {
            return objMerged;
        }
        Object.entries(obj2).filter(([, value]) => {
            return typeof value !== `undefined`;
        }).forEach(([key, value]) => {
            if (obj2 instanceof Array) {
                objMerged[key] = [...objMerged[key], ...value];
            }
            if (value instanceof Date || value instanceof Moment || value instanceof RegExp) {
                objMerged[key] = Tomwork.clone(value);
                return;
            }
            if (typeof value !== `object` || value === null) {
                objMerged[key] = value;
                return;
            }
            objMerged[key] = Tomwork.merge(obj1[key], value);
        });
        return objMerged;
    }
    static queryParse(result) {
        return {
            ...result,
            rows: result.rows.map((row) => {
                return new types_1.VueObject(row).camelCaseTo();
            })
        };
    }
    static selectClauseGet(values) {
        return Object.entries(values).map(([columnName, value]) => {
            const valueRaw = (() => {
                const valueNested = value.$lte || value.$lt || value.$gt || value.$gte;
                return typeof valueNested !== `undefined` ? valueNested : value;
            })();
            const comparisonOperator = (() => {
                if (typeof value.$lte !== `undefined`) {
                    return `<=`;
                }
                if (typeof value.$lt !== `undefined`) {
                    return `<`;
                }
                if (typeof value.$gte !== `undefined`) {
                    return `>=`;
                }
                if (typeof value.$gt !== `undefined`) {
                    return `>`;
                }
                return `=`;
            })();
            return `${new types_1.VueString(columnName).caseSnakeTo()} ${comparisonOperator} ${Tomwork.queryValueParse(valueRaw)}`;
        }).join(` AND `);
    }
    static queryValueParse(value) {
        if (typeof value === `string`) {
            return `'${value}'`;
        }
        if (value instanceof Date) {
            return `'${value.toISOString()}'`;
        }
        return `${value}`;
    }
    static updateSetGet(obj, { onConflict = false, tableName = `` } = {}) {
        const tableNameSnake = new types_1.VueString(tableName).caseSnakeTo().toString();
        return Object.entries(obj).map(([columnName, value]) => {
            const columnNameSnake = new types_1.VueString(columnName).caseSnakeTo().toString();
            return `${columnNameSnake} = ${onConflict ? `${tableNameSnake}.${columnNameSnake} + ` : ``}${Tomwork.queryValueParse(value)}`;
        }).join(`,`);
    }
}
exports.Tomwork = Tomwork;
Tomwork.equalIs = equalIs;
//# sourceMappingURL=Tomwork.js.map