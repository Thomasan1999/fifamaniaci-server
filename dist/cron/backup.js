"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cron = require("node-cron");
const Moment = require("moment-timezone");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const child_process_1 = require("child_process");
module.exports = cron.schedule(`0 0 4 * * *`, async () => {
    const date = Moment().add(-1, `d`).utc().format(`YYYY-MM-DD`);
    const logDirPath = `/var/www/backup/${date}`;
    if (!(await fs_extra_1.pathExists(logDirPath))) {
        await fs_extra_1.promises.mkdir(logDirPath);
    }
    child_process_1.spawn(`pg_dumpall`, [`-l`, `fifamaniaci`, `--file=${path.join(logDirPath, `${date}.sql`)}`, `-U`, `postgres`, `-h`, `localhost`, `--no-password`]);
}, { timezone: `Europe/Bratislava` });
//# sourceMappingURL=backup.js.map