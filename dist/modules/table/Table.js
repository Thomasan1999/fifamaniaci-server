"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
const pgFormat = require("pg-format");
const Row_1 = require("../row/Row");
const types_1 = require("../types");
const __1 = require("..");
class Table {
    constructor({ io, limit = parseInt(process.env.FM_LAZY_LOADING_LIMIT), nested = false, pg, defaults, res, tabCondition, value = [] }) {
        this.defaults = defaults;
        this.io = io;
        this.limit = limit;
        this.nested = nested;
        this.pg = pg;
        this.res = res;
        this.tabCondition = tabCondition;
        this.value = value;
    }
    async findLast(query = {}) {
        return await this.pg.query(pgFormat(`SELECT * FROM %s %s ORDER BY id DESC LIMIT 1`, new types_1.VueString(this.constructor.name).decapitalize().caseSnakeTo().toString(), __1.Tomwork.emptyIs(query) ? `` : `WHERE ${__1.Tomwork.selectClauseGet(query)}`)).then((result) => {
            return __1.Tomwork.queryParse(result).rows[0];
        });
    }
    get finished() {
        if (this.nested) {
            return this._finishedNested;
        }
        return this.value.length <= this.limit ? [0] : [];
    }
    get _finishedNested() {
        const tabsC = {};
        const a = this.value.reduce((a, row) => {
            const tabId = row.tab && row.tab.length > 0 ? this.tabCondition(row) : 0;
            if (tabsC[tabId] === this.limit - 1) {
                a.push(tabId);
            }
            tabsC[tabId] = (tabsC[tabId] || 0) + 1;
            return a;
        }, []);
        return a;
    }
    get last() {
        if (this.nested) {
            return this._finishedNested;
        }
        return this.value.length <= this.limit;
    }
    send(aliases) {
        this.aliases = aliases;
        this.res.set({
            [`Access-Control-Expose-Headers`]: `Finished, Last`,
            [`Finished`]: JSON.stringify(this.finished),
            [`Last`]: JSON.stringify(this.last)
        });
        this.res.json(this.valueIndexed);
    }
    get valueIndexed() {
        if (this.nested) {
            const tabsC = {};
            return this.value.reduce((a, row) => {
                const tabId = row.tab && row.tab.length > 0 ? this.tabCondition(row) : 0;
                delete row.tab;
                if (tabsC[tabId] === this.limit - 1) {
                    return a;
                }
                tabsC[tabId] = (tabsC[tabId] || 0) + 1;
                const aliasesObject = Object.entries(this.aliases || {}).reduce((a, [alias, field]) => {
                    a[alias] = row[field];
                    return a;
                }, {});
                if (this.defaults) {
                    Object.entries(this.defaults).filter(([, fieldName]) => {
                        return typeof row[fieldName] === `undefined`;
                    }).forEach(([fieldName, defaultValue]) => {
                        row[fieldName] = defaultValue;
                    });
                }
                const recordCamelCase = new types_1.VueObject(row).camelCaseTo();
                return { ...a, ...new Row_1.Row({ value: { ...recordCamelCase, ...aliasesObject, tabId: tabId === 0 ? undefined : tabId } }).valueIndexed };
            }, {});
        }
        return this.value.reduce((a, record) => {
            const aliasesObject = Object.entries(this.aliases || {}).reduce((a, [alias, row]) => {
                a[alias] = record[row];
                return a;
            }, {});
            if (this.defaults) {
                Object.entries(this.defaults).filter(([columnName]) => {
                    return typeof record[columnName] === `undefined`;
                }).forEach(([fieldName, defaultValue]) => {
                    record[fieldName] = defaultValue;
                });
            }
            const recordCamelCase = new types_1.VueObject(record).camelCaseTo();
            return { ...a, ...new Row_1.Row({ value: { ...recordCamelCase, ...aliasesObject } }).valueIndexed };
        }, {});
    }
}
exports.Table = Table;
//# sourceMappingURL=Table.js.map