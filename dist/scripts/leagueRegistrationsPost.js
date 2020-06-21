"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const row_1 = require("../modules/row");
const modules_1 = require("../modules");
(async () => {
    const pg = await modules_1.PgClient.connect();
    const route = `leagueRegistrations`;
    const categoryId = (await pg.query(`SELECT id FROM categories WHERE name = 'xboxOne'`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows[0];
    })).id;
    const user = new row_1.User({
        pg,
        value: await pg.query(`SELECT * FROM users WHERE username = 'alcashlee'`).then((result) => {
            return modules_1.Tomwork.queryParse(result).rows[0];
        })
    });
    const leagueRegistration = new row_1.LeagueRegistration({
        //@ts-ignore
        io: {
            emitCustom() {
            },
            status() {
            }
        },
        pg,
        res: {
            json() {
            },
            status() {
            }
        },
        user,
        value: {
            categoryId,
            seasonId: await pg.query(`SELECT * FROM league_seasons WHERE month = 9`).then((result) => {
                return modules_1.Tomwork.queryParse(result).rows[0].id;
            }),
            userId: user.value.id
        }
    });
    await leagueRegistration.insert().then(({ rows: [{ id, categoryId, userId }] }) => {
        console.log(`Successful`);
    }).catch((err) => {
        new modules_1.ErrorCustom({ at: `${route}.post() LeagueRegistration.upsert()`, err });
    });
    process.exit();
})();
//# sourceMappingURL=leagueRegistrationsPost.js.map