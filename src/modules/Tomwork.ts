import * as equalIs           from 'fast-deep-equal';
import * as Moment            from 'moment-timezone';
import * as Pg                from 'pg';
import {VueObject, VueString} from './types';

export class Tomwork
{
    public static columnListGet(projection: { [s: string]: boolean } | string[], valuesCustom: { [s: string]: string } = {}): string
    {
        const columns: string[] = projection instanceof Array ? projection : Object.entries(projection).filter(([, include]) =>
        {
            return include;
        }).map(([columnName]) =>
        {
            return columnName;
        });

        return columns.map((columnName) =>
        {
            return valuesCustom[columnName] || new VueString(columnName).caseSnakeTo().toString();
        }).join(`,`);
    }

    public static clone<T>(obj: T): T
    {
        if (typeof obj !== `object` || obj === null)
        {
            return obj;
        }

        if (obj instanceof Date)
        {
            return new Date(obj.valueOf()) as unknown as T;
        }

        if (obj instanceof Moment)
        {
            return (obj as unknown as Moment.Moment).clone() as unknown as T;
        }

        if (obj instanceof RegExp)
        {
            return new RegExp(obj) as unknown as T;
        }

        const clone: any[] | Object = obj instanceof Array ? [] : {};

        Object.keys(obj).forEach((i) =>
        {
            clone[i] = Tomwork.clone(obj[i]);
        });

        return clone as unknown as T;
    }

    public static emptyIs(val: any = {}): boolean
    {
        if (val === null)
        {
            return true;
        }

        if (typeof val === `number`)
        {
            return false;
        }

        if (val instanceof Array)
        {
            return !val.length;
        }

        return !Object.keys(val).length;
    }

    public static equalIs = equalIs;

    public static insertValuesGet(values: any[]): string
    {
        return values.map(Tomwork.queryValueParse).join(`,`);
    }

    public static merge<T1, T2>(obj1: T1, obj2: T2): Merge<T1, T2>
    {
        if (typeof obj1 === `undefined`)
        {
            return Tomwork.clone(obj2) as unknown as Merge<T1, T2>;
        }

        const objMerged: any = Tomwork.clone(obj1);

        if (typeof obj2 === `undefined`)
        {
            return objMerged;
        }

        Object.entries(obj2).filter(([, value]: [string, any]) =>
        {
            return typeof value !== `undefined`;
        }).forEach(([key, value]: [string, any]) =>
        {
            if (obj2 instanceof Array)
            {
                objMerged[key] = [...objMerged[key], ...value];
            }

            if (value instanceof Date || value instanceof Moment || value instanceof RegExp)
            {
                objMerged[key] = Tomwork.clone(value);
                return;
            }

            if (typeof value !== `object` || value === null)
            {
                objMerged[key] = value;
                return;
            }

            objMerged[key] = Tomwork.merge(obj1[key], value);
        });

        return objMerged;
    }

    public static queryParse<T>(result: T): T
    {
        return {
            ...result,
            rows: (result as unknown as Pg.QueryResult).rows.map((row) =>
            {
                return new VueObject(row).camelCaseTo();
            })
        } as unknown as T;
    }

    public static selectClauseGet(values: { [s: string]: any }): string
    {
        return Object.entries(values).map(([columnName, value]) =>
        {
            const valueRaw: any = (() =>
            {
                const valueNested: any = value.$lte || value.$lt || value.$gt || value.$gte;

                return typeof valueNested !== `undefined` ? valueNested : value;
            })();

            const comparisonOperator: string = (() =>
            {
                if (typeof value.$lte !== `undefined`)
                {
                    return `<=`;
                }

                if (typeof value.$lt !== `undefined`)
                {
                    return `<`;
                }

                if (typeof value.$gte !== `undefined`)
                {
                    return `>=`;
                }

                if (typeof value.$gt !== `undefined`)
                {
                    return `>`;
                }

                return `=`;
            })();

            return `${new VueString(columnName).caseSnakeTo()} ${comparisonOperator} ${Tomwork.queryValueParse(valueRaw)}`;
        }).join(` AND `);
    }

    public static queryValueParse(value: any): string
    {
        if (typeof value === `string`)
        {
            return `'${value}'`;
        }

        if (value instanceof Date)
        {
            return `'${value.toISOString()}'`;
        }

        return `${value}`;
    }

    public static updateSetGet(obj: { [s: string]: any }, {onConflict = false, tableName = ``}: {onConflict?: boolean, tableName?: string} = {}): string
    {
        const tableNameSnake: string = new VueString(tableName).caseSnakeTo().toString();

        return Object.entries(obj).map(([columnName, value]) =>
        {
            const columnNameSnake: string = new VueString(columnName).caseSnakeTo().toString();

            return `${columnNameSnake} = ${onConflict ? `${tableNameSnake}.${columnNameSnake} + ` : ``}${Tomwork.queryValueParse(value)}`;
        }).join(`,`);
    }
}
