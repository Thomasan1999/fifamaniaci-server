export type ErrorCustomType = {at: string, err: string};

export class ErrorCustom
{
    value: ErrorCustomType;

    constructor({at, err}: ErrorCustomType)
    {
        this.value = {at, err};
        console.log(`${new Date().toISOString()} Error at ${at}: ${err}`);
    }
}
