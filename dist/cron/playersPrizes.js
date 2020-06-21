"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cron = require("node-cron");
const modules_1 = require("../modules");
module.exports = cron.schedule(`0 0 0 1 * *`, async () => {
    const pg = await modules_1.PgClient.connect();
    const categoriesArray = await pg.query(`SELECT * FROM categories`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    });
    const transactionTypeId = (await pg.query(`SELECT id FROM money_transactions_types WHERE name = 'rankingsMonthlyPrize'`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows[0].id;
    }));
    const prizes = [10, 5, 3];
    await Promise.all(categoriesArray.map(async ({ id: categoryId }) => {
        const winningPlayers = await pg.query(`SELECT * FROM players WHERE category_id = $1 AND rating > 0 ORDER BY rating DESC LIMIT $2`, [categoryId, prizes.length]).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows;
        });
        return await Promise.all(winningPlayers.map(async ({ userId }, rank) => {
            const money = prizes[rank];
            return await Promise.all([
                pg.query(`UPDATE users SET money = money + $1 WHERE id = $2 RETURNING *`, [money, userId]).then((result) => {
                    return modules_1.Tomwork.queryParse(result);
                }),
                pg.query(`INSERT INTO money_transactions(category_id, money, transaction_type_id, user_id)`, [categoryId, money, transactionTypeId, userId]).then((result) => {
                    return modules_1.Tomwork.queryParse(result);
                })
            ]).catch((err) => {
                new modules_1.ErrorCustom({ at: `categoriesArray.map() winningPlayers.map() UPDATE users`, err });
                return Promise.reject(err);
            });
        })).catch((err) => {
            new modules_1.ErrorCustom({ at: `categoriesArray.map() winningPlayers.map()`, err });
            return Promise.reject(err);
        });
    })).catch((err) => {
        new modules_1.ErrorCustom({ at: `categoriesArray.map()`, err });
    }).finally(() => {
        process.exit();
    });
}, { timezone: `Europe/Bratislava` });
//# sourceMappingURL=playersPrizes.js.map