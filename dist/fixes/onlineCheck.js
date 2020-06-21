"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
const pgFormat = require("pg-format");
const modules_1 = require("../modules");
(async ({ io } = {}) => {
    dotenv.config({ path: `${__dirname}/../.env` });
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const pg = await modules_1.PgClient.connect();
    const ids = [...io.clients].filter((socket) => {
        return socket.cookies && socket.cookies.value.id;
    }).map((socket) => {
        return socket.cookies.value.id;
    });
    const idsOffline = await pg.query(pgFormat(`SELECT * FROM users WHERE id NOT IN (%s) AND online IS NOT NULL`, ids.join(`,`))).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows;
    });
    await Promise.all([
        pg.query(pgFormat(`UPDATE users SET online = NULL WHERE id NOT IN (%s) AND online IS NOT NULL RETURNING *`, ids.join(`,`))).then((result) => {
            return modules_1.Tomwork.queryParse(result);
        }),
        pg.query(pgFormat(`UPDATE login_sessions SET online = NULL WHERE online IS NOT NULL AND user_id IS NOT IN (%s)`, ids.join(`,`))).then((result) => {
            return modules_1.Tomwork.queryParse(result);
        })
    ]).then(async () => {
        return idsOffline.reduce((a, { id }) => {
            return a.then(async () => {
                return io.emitCustom(`connectivityUpdate`, { id });
            });
        }, Promise.resolve());
    }).catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} UPDATE login_sessions`, err });
    }).finally(() => {
        process.exit();
    });
})();
//# sourceMappingURL=onlineCheck.js.map