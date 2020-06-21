import {Tomwork} from '..';
import params from './params';
import types from './types';

export type ParamLength = {
    min: number,
    max: number
}

export type ParamType =
    | 'alphabetical'
    | 'alphanumerical'
    | 'any'
    | 'boolean'
    | 'date'
    | 'email'
    | 'float'
    | 'integer'
    | 'hexadecimal'
    | 'integer'
    | 'message'
    | 'password'
    | 'string';


export class Param
{
    public length: ParamLength;
    public min?: number;
    public max?: number;
    public name: string;
    public required: boolean;
    public type: string;
    public validateRegex: RegExp;
    public value: any;

    constructor({length, max, min, name, required = true, type}: { length: ParamLength, max?: number, min?: number, name: string, required?: boolean, type: ParamType })
    {
        this.name = name;
        this.type = type || (params[name] && params[name].type) || this._type;

        this.required = required;

        Object.entries(Tomwork.merge(types.any, types[this.type])).forEach(([prop, value]) =>
        {
            this[prop] = value;
        });
        Object.entries(params[name] || {}).forEach(([prop, value]) =>
        {
            this[prop] = value;
        });

        this.length = {...this.length, ...length};

        if (this.type === `integer` || this.type === `float`)
        {
            if (typeof this.min === `undefined`)
            {
                this.min = min || types[this.type].min || 0;
            }

            if (typeof this.max === `undefined`)
            {
                this.max = max || types[this.type].max;
            }
        }
    }

    public get _type(): ParamType
    {
        if (this.name.match(/^id$|Id/))
        {
            return `integer`;
        }

        if (this.name.match(/token/i))
        {
            return `hexadecimal`;
        }

        return `any`;
    }
}
