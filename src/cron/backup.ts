import * as cron                    from 'node-cron';
import * as Moment                  from 'moment-timezone';
import {promises as fs, pathExists} from 'fs-extra';
import * as path                    from 'path';
import {spawn}                      from 'child_process';

module.exports = cron.schedule(`0 0 4 * * *`, async () =>
{
    const date: string = Moment().add(-1, `d`).utc().format(`YYYY-MM-DD`);

    const logDirPath: string = `/var/www/backup/${date}`;

    if (!(await pathExists(logDirPath)))
    {
        await fs.mkdir(logDirPath);
    }

    spawn(`pg_dumpall`, [`-l`, `fifamaniaci`, `--file=${path.join(logDirPath, `${date}.sql`)}`, `-U`, `postgres`, `-h`, `localhost`, `--no-password`]);
}, {timezone: `Europe/Bratislava`});
