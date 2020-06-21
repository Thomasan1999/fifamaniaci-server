"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Row_1 = require("../document/Row");
const types_1 = require("../types");
class Collection {
    constructor({ collection, db, io, limit = parseInt(process.env.FM_LAZY_LOADING_LIMIT), nested = false, defaults, pg, res, tabCondition, value = [] }) {
        this.collection = collection;
        this.db = db;
        this.defaults = defaults;
        this.limit = limit;
        this.nested = nested;
        this.pg = pg;
        this.res = res;
        this.tabCondition = tabCondition;
        this.value = value;
    }
    async findLast(query = {}) {
        return await this.pg.query(`SELECT * FROM ${this.collection} ORDER BY id DESC LIMIT 1`).then((result) => {
            return result.rows[0];
        });
    }
    get finished() {
        if (this.nested) {
            return this._finishedNested;
        }
        return this.value.length <= this.limit ? [`default`] : [];
    }
    get _finishedNested() {
        const tabsC = {};
        return this.value.reduce((a, record) => {
            const tabId = record.tab && record.tab.length > 0 ? this.tabCondition(record) : `default`;
            if (tabsC[tabId] === this.limit - 1) {
                a.push(tabId.toString());
            }
            tabsC[tabId] = (tabsC[tabId] || 0) + 1;
            return a;
        }, []);
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
            return this.value.reduce((a, record) => {
                const tabId = record.tab && record.tab.length > 0 ? this.tabCondition(record) : `default`;
                delete record.tab;
                if (tabsC[tabId] === this.limit - 1) {
                    return a;
                }
                tabsC[tabId] = (tabsC[tabId] || 0) + 1;
                const aliasesObject = Object.entries(this.aliases || {}).reduce((a, [alias, field]) => {
                    a[alias] = record[field];
                    return a;
                }, {});
                if (this.defaults) {
                    Object.entries(this.defaults).filter(([, fieldName]) => {
                        return typeof record[fieldName] === `undefined`;
                    }).forEach(([fieldName, defaultValue]) => {
                        record[fieldName] = defaultValue;
                    });
                }
                return { ...a, ...new Row_1.Row({ value: { ...record, ...aliasesObject, tabId: tabId === `default` ? undefined : tabId } }).valueIndexed };
            }, {});
        }
        return this.value.reduce((a, record) => {
            const aliasesObject = Object.entries(this.aliases || {}).reduce((a, [alias, document]) => {
                a[alias] = record[document];
                return a;
            }, {});
            if (this.defaults) {
                Object.entries(this.defaults).filter(([fieldName]) => {
                    return typeof record[fieldName] === `undefined`;
                }).forEach(([fieldName, defaultValue]) => {
                    record[fieldName] = defaultValue;
                });
            }
            const recordCamelCase = new types_1.VueObject(record).camelCaseTo();
            return { ...a, ...new Row_1.Row({ value: { ...recordCamelCase, ...aliasesObject } }).valueIndexed };
        }, {});
    }
}
exports.Collection = Collection;
//# sourceMappingURL=Collection.js.map