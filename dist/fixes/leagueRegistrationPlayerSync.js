"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const modules_1 = require("../modules");
const row_1 = require("../modules/row");
const path = require("path");
(async () => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    const leagueRegistrationsArray = await pg.query(`SELECT * FROM league_registrations`).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    });
    await Promise.all(leagueRegistrationsArray.map(async ({ categoryId, userId }) => {
        const player = new row_1.Player({
            //@ts-ignore
            io: {
                emitCustom() {
                }
            },
            pg,
            value: {
                categoryId,
                userId
            }
        });
        return await player.init().then(async () => {
            return await player.upsert().then(async () => {
            }).catch((err) => {
                new modules_1.ErrorCustom({ at: `${pathRelative} Player.init() Player.upsert()`, err });
            });
        }).catch((err) => {
            new modules_1.ErrorCustom({ at: `${pathRelative} Player.init()`, err });
        });
    })).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} Promise.all()`, err });
    }).finally(() => {
        process.exit();
    });
})();
//# sourceMappingURL=leagueRegistrationPlayerSync.js.map