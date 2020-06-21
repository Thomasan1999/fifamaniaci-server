import * as path        from 'path';
import {promises as fs} from 'fs-extra';
import * as Express     from 'express';
import * as WebSocket   from 'ws';
import * as Pg          from 'pg';

module.exports = async ({app, io, pg, subdomain = true}: { app: Express.Router, io: WebSocket.Server, pg: Pg.Client, subdomain?: boolean }) =>
{
    const parentDir: string[] = await fs.readdir(path.dirname(__filename));

    parentDir.filter((filename) =>
    {
        return path.extname(filename) !== `.map` && filename !== `index.js`;
    }).forEach((filename) =>
    {
        const fileDir: string = path.resolve(__dirname, filename);
        const parentRoute: string = `/${path.relative(`${__dirname}${subdomain ? `` : `/..`}`, fileDir)}`;

        require(`./${filename}`)({app, io, pg, route: parentRoute.replace(`\\`, `/`).split(`.`)[0]});
    });
};
