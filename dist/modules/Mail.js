"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorCustom_1 = require("./ErrorCustom");
const types_1 = require("./types");
const nodemailer_1 = require("nodemailer");
const dotenv = require("dotenv");
class Mail {
    constructor({ filename, options }) {
        this.options = {
            from: `"FIFA maniaci" <ahoj@fifamaniaci.sk>`,
        };
        this.styles = {
            button: `background-color: #14aede; border: none; border-radius: 2px; color: #ffffff; font-family: sans-serif, Helvetica, Arial; font-size: 15px; padding: 12px 14px;`,
            main: `font-size: 13px; line-height: 1.5;`,
            p: `margin: 1.5em 0;`
        };
        dotenv.config({ path: `${__dirname}/../.env` });
        this.filename = filename;
        this.options = { ...this.options, ...options };
        this.options.subject = new types_1.VueString(options.subject).htmlParse().toString();
        this.transporter = nodemailer_1.createTransport({
            host: `smtp.websupport.sk`,
            port: 587,
            secure: false,
            auth: {
                user: `ahoj@fifamaniaci.sk`,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        if (process.env.NODE_ENV === `development`) {
            this.options.to = `ahoj@tomaskudlac.sk`;
        }
        this.htmlParse();
    }
    htmlParse() {
        this.options.html = new types_1.VueString(`<div style="${this.styles.main}">${[`p`, `button`].reduce((a, tag) => {
            return a.replace(new RegExp(`<${tag}>`, `g`), `<${tag} style="${this.styles[tag]}">`);
        }, this.options.html)}</div>`).htmlParse().toString();
    }
    ;
    async send() {
        return await this.transporter.sendMail(this.options).then((res) => {
            console.log(`${new Date().toISOString()} Email sent: ${res.response}`);
            return Promise.resolve(res);
        }).catch((err) => {
            new ErrorCustom_1.ErrorCustom({ at: `mail/${this.filename} Mail.send()`, err });
            return Promise.reject(err);
        });
    }
}
exports.Mail = Mail;
//# sourceMappingURL=Mail.js.map