import * as cron                                                                     from 'node-cron';
import {ErrorCustom}                                                                 from '../modules';
import {createReadStream, createWriteStream, existsSync, pathExists, promises as fs} from 'fs-extra';
import * as path                                                                     from 'path';
import * as readline                                                                 from 'readline';
import * as util                                                                     from 'util';

module.exports = cron.schedule(`0 0 4 * * *`, async () =>
{
    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const parentDir: string = `${__dirname}/../..`;
    const logDir: string = `${parentDir}/logs`;
    const log: {
        err: string,
        log: string,
        out: string
    } = {err: `app_err.log`, log: `app_log.log`, out: `app_out.log`};

    const logStream: NodeJS.ReadableStream = await pathExists(`${logDir}/${log.out}`) ? createReadStream(`${logDir}/${log.out}`) : process.exit();

    const logInterface: readline.Interface = readline.createInterface({
        input: logStream,
        crlfDelay: Infinity
    });

    const streams: { [s: string]: NodeJS.WritableStream } = {};

    logInterface.on(`line`, (line) =>
    {
        const [date]: RegExpMatchArray = (line.match(/^[\d|-]+(?=T)/) || []);

        if (!date)
        {
            return;
        }

        if (!streams[date])
        {
            streams[date] = createWriteStream(`${logDir}/${date}.log`, {flags: `a`});
        }

        streams[date].write(`${line.replace(/^[\d|-]+tt[T]/, ``)}\n`);
    });

    logInterface.on(`close`, async () =>
    {
        Object.values(streams).forEach((stream) =>
        {
            stream.end();
        });

        const filePaths: string[] = Object.values(log).map((logFilename) =>
        {
            return `${logDir}/${logFilename}`;
        });

        await Promise.all(filePaths.filter((filePath) =>
        {
            return existsSync(filePath);
        }).map(async (filePath) =>
        {
            const truncateAsync = util.promisify(fs.truncate);

            //@ts-ignore
            return await truncateAsync(filePath, 0, (err) =>
            {
                if (err)
                {
                    new ErrorCustom({at: `${pathRelative} filePaths.forEach() fs.truncate()`, err});
                    return Promise.reject(err);
                }

                return Promise.resolve();
            });
        })).finally(() =>
        {
            process.exit();
        });
    });
}, {timezone: `Europe/Bratislava`});
