"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const modules_1 = require("../modules");
const row_1 = require("../modules/row");
module.exports = ({ app, route, io }) => {
    dotenv.config({ path: `${__dirname}/../.env` });
    app.post(route, async (req, res) => {
        const pg = await modules_1.PgClient.connect();
        const categoryId = await pg.query(`SELECT * FROM categories WHERE name = 'xboxOneFut'`).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows[0].id;
        });
        (await pg.query(`SELECT * FROM users WHERE verification_code IS NULL`).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows;
        })).reduce((a, userValue) => {
            return a.then(async () => {
                const user = new row_1.User({ io, pg, res, value: userValue });
                const leagueRegistration = new row_1.LeagueRegistration({ io, pg, res, user, value: { categoryId, userId: user.value.id } });
                await leagueRegistration.init().catch((err) => {
                    new modules_1.ErrorCustom({ at: `${route}.post() users.reduce() LeagueRegistration.init()`, err });
                });
                return await leagueRegistration.insert().catch((err) => {
                    new modules_1.ErrorCustom({ at: `${route}.post() users.reduce() LeagueRegistration.upsert()`, err });
                });
            });
        }, Promise.resolve()).catch((err) => {
            new modules_1.ErrorCustom({ at: `${route}.post() users.reduce()`, err });
        });
    });
};
//# sourceMappingURL=leagueRegistrationsFill.js.map