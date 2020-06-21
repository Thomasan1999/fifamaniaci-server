import {VueString} from './VueString';

export class VueObject
{
    public value: any;

    constructor(object: any = {})
    {
        this.value = object;
    }

    public camelCaseTo(): this['value']
    {
        return Object.entries(this.value).reduce((a, [columnName, column]) =>
        {
            a[new VueString(columnName).caseCamelTo().toString()] = column;
            return a;
        }, {}) as unknown as this['value'];
    }

    public entries(): [string, any][]
    {
        return Object.entries(this.value);
    }

    public filter(callback: ([key, value, ...args]: [string, any, any]) => any): VueObject
    {
        return new VueObject(Object.entries(this.value).filter((...args) =>
        {
            //@ts-ignore
            return callback(...args);
        }).reduce((a, [key, value]) =>
        {
            a[key] = value;
            return a;
        }, {}));
    }

    public findNested(nestedValues: string[]): any
    {
        return nestedValues.reduce((a, nestedValue) =>
        {
            return a && a[nestedValue];
        }, this.value);
    }

    public keys(): string[]
    {
        return Object.keys(this.value);
    }

    public map(callback: ([key, value, ...args]: [string, any, any]) => any): VueObject
    {
        return new VueObject(Object.entries(this.value).reduce((a, [key, value], ...args) =>
        {
            //@ts-ignore
            a[key] = callback([key, value], ...args);
            return a;
        }, {}));
    }

    public unwrap(): any
    {
        return this.value[Object.keys(this.value)[0]];
    }

    public values(): any[]
    {
        return Object.values(this.value);
    }
}
