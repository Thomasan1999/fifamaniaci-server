import * as cron                        from 'node-cron';
import * as Pg                          from 'pg';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {CategoryValue}                  from '../modules/row/Category';
import {PlayerValue}                    from '../modules/row/Player';
import {CategoriesQueryResult}          from '../modules/table/Categories';
import {QueryResultId}                  from 'types/pg';
import {PlayersQueryResult}             from 'modules/table/Players';
import {UserQueryResult}                from 'modules/row/User';
import {MoneyTransactionQueryResult}    from 'modules/row/MoneyTransaction';

module.exports = cron.schedule(`0 0 0 1 * *`, async () =>
{
    const pg: Pg.Client = await PgClient.connect();

    const categoriesArray: CategoryValue[] = await pg.query(`SELECT * FROM categories`).then((result: CategoriesQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    });
    const transactionTypeId: number = (await pg.query(
            `SELECT id FROM money_transactions_types WHERE name = 'rankingsMonthlyPrize'`
    ).then((result: QueryResultId) =>
    {
        return Tomwork.queryParse(result).rows[0].id;
    }));

    const prizes: number[] = [10, 5, 3];

    await Promise.all(categoriesArray.map(async ({id: categoryId}) =>
    {
        const winningPlayers: PlayerValue[] = await pg.query(
                `SELECT * FROM players WHERE category_id = $1 AND rating > 0 ORDER BY rating DESC LIMIT $2`,
            [categoryId, prizes.length]
        ).then((result: PlayersQueryResult) =>
        {
            return Tomwork.queryParse(result).rows;
        });

        return await Promise.all(winningPlayers.map(async ({userId}: PlayerValue, rank: number) =>
        {
            const money: number = prizes[rank];

            return await Promise.all([
                pg.query(`UPDATE users SET money = money + $1 WHERE id = $2 RETURNING *`, [money, userId]).then((result: UserQueryResult) =>
                {
                    return Tomwork.queryParse(result);
                }),
                pg.query(
                        `INSERT INTO money_transactions(category_id, money, transaction_type_id, user_id)`,
                    [categoryId, money, transactionTypeId, userId]
                ).then((result: MoneyTransactionQueryResult) =>
                {
                    return Tomwork.queryParse(result);
                })
            ]).catch((err) =>
            {
                new ErrorCustom({at: `categoriesArray.map() winningPlayers.map() UPDATE users`, err});
                return Promise.reject(err);
            });
        })).catch((err) =>
        {
            new ErrorCustom({at: `categoriesArray.map() winningPlayers.map()`, err});
            return Promise.reject(err);
        });
    })).catch((err) =>
    {
        new ErrorCustom({at: `categoriesArray.map()`, err});
    }).finally(() =>
    {
        process.exit();
    });
}, {timezone: `Europe/Bratislava`});
