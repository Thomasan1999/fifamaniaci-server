import {RowValue} from './Row';

export type UserEmailValue =  Merge<RowValue, {
    email: string,
    userId: number,
}>;
