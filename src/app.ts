#!/usr/local/bin node
import * as dotenv                            from 'dotenv';
import {promises as fs}                       from 'fs-extra';
import * as path                              from 'path';
import * as cookieParser                      from 'cookie-parser';
import * as compression                       from 'compression';
import * as cors                              from 'cors';
import * as http                              from 'http';
import * as https                             from 'https';
import * as morgan                            from 'morgan';
import * as subdomain                         from 'express-subdomain';
import * as Express                           from 'express';
import * as WebSocket                         from 'ws';
import * as Pg                                from 'pg';
import {ErrorCustom, PgClient, SocketCookies} from './modules';
import {User}                                 from './modules/row';
import {ScheduledTask}                        from 'node-cron';

declare global
{
    interface Array<T>
    {
        lastItem: T,
        lastIndex: number
    }
}

export interface WebSocketServerCustom extends WebSocket.Server
{
    clients: Set<WebSocketCustom>
    emitCustom(eventName: string, data: any): void;
}

export interface WebSocketCustom extends WebSocket
{
    cookies: SocketCookies,
    emitCustom(eventName: string, data?: any): void;
}

(async () =>
{
    const pg: Pg.Client = await PgClient.connect();

    dotenv.config({path: `${__dirname}/.env`});

    require(`./proposals/proposal-array-last.js`);

    const app: Express.Application = Express();

    const sslDir: string = `${__dirname}/ssl/`;

    http.createServer((req, res) =>
    {
        res.writeHead(301, `https://${process.env.FM_HOSTNAME}${req.url}`);
        res.end();
    }).listen((process.env.NODE_ENV === `production` ? 8000 : 0) + 80);

    if (process.env.NODE_ENV === `development`)
    {
        app.set(`subdomain offset`, 1);
    }

    const server: https.Server = https.createServer({
        ca: [
            await fs.readFile(`${sslDir}ca_bundle.crt`)
        ],
        cert: await fs.readFile(`${sslDir}certificate.crt`),
        key: await fs.readFile(`${sslDir}private.key`)
    }, app).listen((process.env.NODE_ENV === `production` ? 8000 : 0) + 443);

    const io: WebSocketServerCustom = new WebSocket.Server({server}) as WebSocketServerCustom;

    app.use(compression());
    app.use(cors());

    app.set(`view engine`, `ejs`);
    app.set(`trust proxy`, 1);

    function logFormatGet({req, res, token}: { req: Express.Request, res: Express.Response, token: morgan.TokenIndexer }): string[]
    {
        const date: string = token.date(req, res, `iso`);
        const remoteUser: string = token[`remote-user`](req, res) || `0`;
        const method: string = token.method(req, res);
        const url: string = token.url(req, res);
        const httpVersion: string = `HTTP/${token[`http-version`](req, res)}`;
        const status: string = token.status(req, res);
        const contentLength: string = `${token.res(req, res, `content-length`) || `0`}B`;
        const responseTime: string = `${token[`response-time`](req, res)}ms`;

        return {
            development: [
                date,
                remoteUser,
                method,
                url,
                httpVersion,
                status,
                contentLength,
                responseTime
            ],
            production: [
                date,
                token[`remote-addr`](req, res),
                `-`,
                remoteUser,
                method,
                url,
                httpVersion,
                status,
                contentLength,
                responseTime
            ]
        }[process.env.NODE_ENV];
    }

    app.use(morgan((token, req, res) =>
    {
        return logFormatGet({req, res, token}).join(` `);
    }));

    app.use(Express.json());
    app.use(Express.urlencoded({extended: true}));
    app.use(cookieParser());

    const apiRouter: Express.Router = Express.Router();
    require(`./routes/api`)({app: apiRouter, io, pg});

    app.use(subdomain(`api`, apiRouter));
    app.use(subdomain(`*`, (req, res, next) =>
    {
        if (!req.subdomains.length)
        {
            next();
            return;
        }

        const hostname: string = req.subdomains.reduce((a: string, subdomain: string) =>
        {
            return a.replace(`${subdomain}.`, ``);
        }, req.hostname);

        res.redirect(307, `https://${hostname}${req.originalUrl}`);
    }));

    app.use(Express.static(`${__dirname}/public`));

    app.get(`*`, (req, res) =>
    {
        const userAgent: string = req.headers[`user-agent`];

        if (/~MSIE|Internet Explorer~i/.test(userAgent) || /Trident\/7.0; rv:11.0/.test(userAgent))
        {
            res.redirect(`ie/index_sk.html`);
        }
        else
        {
            res.sendFile(`${__dirname}/public/index.html`);
        }
    });

    app.use((req, res, next) =>
    {
        next(res.status(404));
    });

// eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) =>
    {
        res.status(err.statusCode || 500).json({message: `Page not found`});
    });

    io.emitCustom = (eventName, data) =>
    {
        io.clients.forEach((socket: WebSocketCustom) =>
        {
            socket.send(JSON.stringify([eventName, data]));
        });
    };

    io.on(`connection`, async (socket: WebSocketCustom) =>
    {
        socket.cookies = new SocketCookies({io, pg});

        socket.emitCustom = (eventName, data) =>
        {
            socket.send(JSON.stringify([eventName, data]));
        };

        socket.on(`message`, (dataRaw) =>
        {
            const [eventName, data] = JSON.parse(dataRaw.toString());

            if (!on[eventName])
            {
                return;
            }

            on[eventName](data);
        });

        const on: { [s: string]: Function } = {
            logout()
            {
                socket.cookies.userPropsDelete();
            },
            async userPropsUpdate({cookies})
            {
                socket.cookies.update({value: cookies});

                await socket.cookies.validate().catch((err) =>
                {
                    new ErrorCustom({at: `socket.on(userPropsUpdate) socket.cookies.validate()`, err});
                    return Promise.reject(err);
                });
            }
        };

        socket.on(`close`, async () =>
        {
            const {id, categoriesActive, token} = socket.cookies.value;

            if (!id || !token)
            {
                socket.cookies.value = {};
                return;
            }

            await new User({auth: {id, token}, io, pg, value: {categoryId: categoriesActive}}).connectivitySet({connectivity: `offline`}).catch((err) =>
            {
                new ErrorCustom({at: `socket.on(disconnect) User.connectivitySet()`, err});
            }).finally(() =>
            {
                socket.cookies.value = {};
            });
        });
    });

    if (process.env.NODE_ENV === `production`)
    {
        const cronDirPath: string = path.resolve(__dirname, `cron`);
        const cronDir: string[] = await fs.readdir(cronDirPath);
        const crons: ScheduledTask[] = [];

        cronDir.filter((filename) =>
        {
            return path.extname(filename) !== `.map`;
        }).forEach((filename) =>
        {
            const cron: ScheduledTask = require(path.resolve(cronDirPath, filename));

            if (Object.keys(cron).length === 0)
            {
                return;
            }

            cron.start();
            crons.push(cron);
        });

        process.on(`exit`, () =>
        {
            crons.forEach((cron) =>
            {
                cron.destroy();
            });
        });

        process.on(`uncaughtException`, () =>
        {
            crons.forEach((cron) =>
            {
                cron.destroy();
            });
        });

        process.on(`SIGINT`, () =>
        {
            crons.forEach((cron) =>
            {
                cron.destroy();
            });

            process.exit();
        });
    }
})();

export {};
