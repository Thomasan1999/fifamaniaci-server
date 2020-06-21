"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cron = require("node-cron");
const modules_1 = require("../modules");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const readline = require("readline");
const util = require("util");
module.exports = cron.schedule(`0 0 4 * * *`, async () => {
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const parentDir = `${__dirname}/../..`;
    const logDir = `${parentDir}/logs`;
    const log = { err: `app_err.log`, log: `app_log.log`, out: `app_out.log` };
    const logStream = await fs_extra_1.pathExists(`${logDir}/${log.out}`) ? fs_extra_1.createReadStream(`${logDir}/${log.out}`) : process.exit();
    const logInterface = readline.createInterface({
        input: logStream,
        crlfDelay: Infinity
    });
    const streams = {};
    logInterface.on(`line`, (line) => {
        const [date] = (line.match(/^[\d|-]+(?=T)/) || []);
        if (!date) {
            return;
        }
        if (!streams[date]) {
            streams[date] = fs_extra_1.createWriteStream(`${logDir}/${date}.log`, { flags: `a` });
        }
        streams[date].write(`${line.replace(/^[\d|-]+tt[T]/, ``)}\n`);
    });
    logInterface.on(`close`, async () => {
        Object.values(streams).forEach((stream) => {
            stream.end();
        });
        const filePaths = Object.values(log).map((logFilename) => {
            return `${logDir}/${logFilename}`;
        });
        await Promise.all(filePaths.filter((filePath) => {
            return fs_extra_1.existsSync(filePath);
        }).map(async (filePath) => {
            const truncateAsync = util.promisify(fs_extra_1.promises.truncate);
            //@ts-ignore
            return await truncateAsync(filePath, 0, (err) => {
                if (err) {
                    new modules_1.ErrorCustom({ at: `${pathRelative} filePaths.forEach() fs.truncate()`, err });
                    return Promise.reject(err);
                }
                return Promise.resolve();
            });
        })).finally(() => {
            process.exit();
        });
    });
}, { timezone: `Europe/Bratislava` });
//# sourceMappingURL=log.js.map