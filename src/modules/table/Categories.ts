import * as Pg         from 'pg';
import {CategoryValue} from '../row/Category';

export type CategoriesQueryResult = Merge<Pg.QueryResult, {rows: CategoryValue[]}>;
