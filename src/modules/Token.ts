import {Rand} from '.';

export class Token
{
    value: string;

    constructor(length: number = 64)
    {
        const alphanumerical: string = `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`;

        this.value = Array(length).fill(null).map(() =>
        {
            return alphanumerical[Rand.int({max: alphanumerical.length - 1})];
        }).join(``);
    }
}
