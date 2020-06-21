import * as Express           from 'Express';
import * as Pg                from 'pg';
import * as WebSocket         from 'ws';
import * as pgFormat   from 'pg-format';
import {Row, RowValue} from '../row/Row';
import {FilterQuery}   from 'mongodb';
import {VueObject, VueString} from '../types';
import {Tomwork}              from '..';

type AliasesObject = { [s: string]: string };
type TabCounter = { [s: string]: number };

export class Table
{
    public aliases: { [s: string]: string };
    public defaults: { [s: string]: any };
    public io?: WebSocket.Server;
    public limit?: number;
    public nested?: boolean;
    public pg?: Pg.Client;
    public res: Express.Response;
    public tabCondition: (record: any) => number;
    public value: any[];

    constructor({
                    io, limit = parseInt(process.env.FM_LAZY_LOADING_LIMIT), nested = false, pg, defaults, res, tabCondition, value = []
                }: {
        name?: string, field?: Partial<Row>, io?: WebSocket.Server, limit?: number, nested?: boolean, defaults?: { [s: string]: any }, pg?: Pg.Client, res?: Express.Response, tabCondition?: (record: any) => number, value?: any[]
    })
    {
        this.defaults = defaults;
        this.io = io;
        this.limit = limit;
        this.nested = nested;
        this.pg = pg;
        this.res = res;
        this.tabCondition = tabCondition;
        this.value = value;
    }

    public async findLast(query: FilterQuery<any> = {}): Promise<this['value'][0]>
    {
        return await this.pg.query(pgFormat(
                `SELECT * FROM %s %s ORDER BY id DESC LIMIT 1`,
            new VueString(this.constructor.name).decapitalize().caseSnakeTo().toString(),
            Tomwork.emptyIs(query) ? ``: `WHERE ${Tomwork.selectClauseGet(query)}`
        )).then((result: Merge<Pg.QueryResult, {rows: [RowValue]}>) =>
        {
            return Tomwork.queryParse(result).rows[0];
        });
    }

    public get finished(): number[] | boolean
    {
        if (this.nested)
        {
            return this._finishedNested;
        }

        return this.value.length <= this.limit ? [0] : [];
    }

    public get _finishedNested(): number[]
    {
        const tabsC: TabCounter = {};

        const a = this.value.reduce((a, row) =>
        {
            const tabId: number = row.tab && row.tab.length > 0 ? this.tabCondition(row) : 0;

            if (tabsC[tabId] === this.limit - 1)
            {
                a.push(tabId);
            }

            tabsC[tabId] = (tabsC[tabId] || 0) + 1;

            return a;
        }, []);

        return a;
    }

    public get last(): number[] | boolean
    {
        if (this.nested)
        {
            return this._finishedNested;
        }

        return this.value.length <= this.limit;
    }

    public send(aliases?: { [s: string]: string }): void
    {
        this.aliases = aliases;

        this.res.set({
            [`Access-Control-Expose-Headers`]: `Finished, Last`,
            [`Finished`]: JSON.stringify(this.finished),
            [`Last`]: JSON.stringify(this.last)
        });

        this.res.json(this.valueIndexed);
    }

    public get valueIndexed(): { [s: string]: any }
    {
        if (this.nested)
        {
            const tabsC: TabCounter = {};

            return this.value.reduce((a, row) =>
            {
                const tabId: number = row.tab && row.tab.length > 0 ? this.tabCondition(row) : 0;

                delete row.tab;

                if (tabsC[tabId] === this.limit - 1)
                {
                    return a;
                }

                tabsC[tabId] = (tabsC[tabId] || 0) + 1;

                const aliasesObject: AliasesObject = Object.entries(this.aliases || {}).reduce((a, [alias, field]) =>
                {
                    a[alias] = row[field];
                    return a;
                }, {});

                if (this.defaults)
                {
                    Object.entries(this.defaults).filter(([, fieldName]) =>
                    {
                        return typeof row[fieldName] === `undefined`;
                    }).forEach(([fieldName, defaultValue]) =>
                    {
                        row[fieldName] = defaultValue;
                    });
                }

                const recordCamelCase = new VueObject(row).camelCaseTo();

                return {...a, ...new Row({value: {...recordCamelCase, ...aliasesObject, tabId: tabId === 0 ? undefined : tabId}}).valueIndexed};
            }, {});
        }

        return this.value.reduce((a, record) =>
        {
            const aliasesObject: AliasesObject = Object.entries(this.aliases || {}).reduce((a, [alias, row]) =>
            {
                a[alias] = record[row];
                return a;
            }, {});

            if (this.defaults)
            {
                Object.entries(this.defaults).filter(([columnName]) =>
                {
                    return typeof record[columnName] === `undefined`;
                }).forEach(([fieldName, defaultValue]) =>
                {
                    record[fieldName] = defaultValue;
                });
            }

            const recordCamelCase = new VueObject(record).camelCaseTo();

            return {...a, ...new Row({value: {...recordCamelCase, ...aliasesObject}}).valueIndexed};
        }, {});
    }
}
