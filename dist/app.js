#!/usr/local/bin node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");
const http = require("http");
const https = require("https");
const morgan = require("morgan");
const subdomain = require("express-subdomain");
const Express = require("express");
const WebSocket = require("ws");
const modules_1 = require("./modules");
const row_1 = require("./modules/row");
(async () => {
    const pg = await modules_1.PgClient.connect();
    dotenv.config({ path: `${__dirname}/.env` });
    require(`./proposals/proposal-array-last.js`);
    const app = Express();
    const sslDir = `${__dirname}/ssl/`;
    http.createServer((req, res) => {
        res.writeHead(301, `https://${process.env.FM_HOSTNAME}${req.url}`);
        res.end();
    }).listen((process.env.NODE_ENV === `production` ? 8000 : 0) + 80);
    if (process.env.NODE_ENV === `development`) {
        app.set(`subdomain offset`, 1);
    }
    const server = https.createServer({
        ca: [
            await fs_extra_1.promises.readFile(`${sslDir}ca_bundle.crt`)
        ],
        cert: await fs_extra_1.promises.readFile(`${sslDir}certificate.crt`),
        key: await fs_extra_1.promises.readFile(`${sslDir}private.key`)
    }, app).listen((process.env.NODE_ENV === `production` ? 8000 : 0) + 443);
    const io = new WebSocket.Server({ server });
    app.use(compression());
    app.use(cors());
    app.set(`view engine`, `ejs`);
    app.set(`trust proxy`, 1);
    function logFormatGet({ req, res, token }) {
        const date = token.date(req, res, `iso`);
        const remoteUser = token[`remote-user`](req, res) || `0`;
        const method = token.method(req, res);
        const url = token.url(req, res);
        const httpVersion = `HTTP/${token[`http-version`](req, res)}`;
        const status = token.status(req, res);
        const contentLength = `${token.res(req, res, `content-length`) || `0`}B`;
        const responseTime = `${token[`response-time`](req, res)}ms`;
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
    app.use(morgan((token, req, res) => {
        return logFormatGet({ req, res, token }).join(` `);
    }));
    app.use(Express.json());
    app.use(Express.urlencoded({ extended: true }));
    app.use(cookieParser());
    const apiRouter = Express.Router();
    require(`./routes/api`)({ app: apiRouter, io, pg });
    app.use(subdomain(`api`, apiRouter));
    app.use(subdomain(`*`, (req, res, next) => {
        if (!req.subdomains.length) {
            next();
            return;
        }
        const hostname = req.subdomains.reduce((a, subdomain) => {
            return a.replace(`${subdomain}.`, ``);
        }, req.hostname);
        res.redirect(307, `https://${hostname}${req.originalUrl}`);
    }));
    app.use(Express.static(`${__dirname}/public`));
    app.get(`*`, (req, res) => {
        const userAgent = req.headers[`user-agent`];
        if (/~MSIE|Internet Explorer~i/.test(userAgent) || /Trident\/7.0; rv:11.0/.test(userAgent)) {
            res.redirect(`ie/index_sk.html`);
        }
        else {
            res.sendFile(`${__dirname}/public/index.html`);
        }
    });
    app.use((req, res, next) => {
        next(res.status(404));
    });
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({ message: `Page not found` });
    });
    io.emitCustom = (eventName, data) => {
        io.clients.forEach((socket) => {
            socket.send(JSON.stringify([eventName, data]));
        });
    };
    io.on(`connection`, async (socket) => {
        socket.cookies = new modules_1.SocketCookies({ io, pg });
        socket.emitCustom = (eventName, data) => {
            socket.send(JSON.stringify([eventName, data]));
        };
        socket.on(`message`, (dataRaw) => {
            const [eventName, data] = JSON.parse(dataRaw.toString());
            if (!on[eventName]) {
                return;
            }
            on[eventName](data);
        });
        const on = {
            logout() {
                socket.cookies.userPropsDelete();
            },
            async userPropsUpdate({ cookies }) {
                socket.cookies.update({ value: cookies });
                await socket.cookies.validate().catch((err) => {
                    new modules_1.ErrorCustom({ at: `socket.on(userPropsUpdate) socket.cookies.validate()`, err });
                    return Promise.reject(err);
                });
            }
        };
        socket.on(`close`, async () => {
            const { id, categoriesActive, token } = socket.cookies.value;
            if (!id || !token) {
                socket.cookies.value = {};
                return;
            }
            await new row_1.User({ auth: { id, token }, io, pg, value: { categoryId: categoriesActive } }).connectivitySet({ connectivity: `offline` }).catch((err) => {
                new modules_1.ErrorCustom({ at: `socket.on(disconnect) User.connectivitySet()`, err });
            }).finally(() => {
                socket.cookies.value = {};
            });
        });
    });
    if (process.env.NODE_ENV === `production`) {
        const cronDirPath = path.resolve(__dirname, `cron`);
        const cronDir = await fs_extra_1.promises.readdir(cronDirPath);
        const crons = [];
        cronDir.filter((filename) => {
            return path.extname(filename) !== `.map`;
        }).forEach((filename) => {
            const cron = require(path.resolve(cronDirPath, filename));
            if (Object.keys(cron).length === 0) {
                return;
            }
            cron.start();
            crons.push(cron);
        });
        process.on(`exit`, () => {
            crons.forEach((cron) => {
                cron.destroy();
            });
        });
        process.on(`uncaughtException`, () => {
            crons.forEach((cron) => {
                cron.destroy();
            });
        });
        process.on(`SIGINT`, () => {
            crons.forEach((cron) => {
                cron.destroy();
            });
            process.exit();
        });
    }
})();
//# sourceMappingURL=app.js.map