import {ErrorCustom} from './ErrorCustom';
import {VueString} from './types';
import {createTransport, SentMessageInfo, Transporter} from 'nodemailer';
import * as dotenv from 'dotenv';

export type MailOptions = {
    from?: string,
    html?: string,
    subject?: string,
    to?: string
}

export class Mail
{
    public filename: string;
    private readonly options: MailOptions = {
        from: `"FIFA maniaci" <ahoj@fifamaniaci.sk>`,
    };

    private readonly styles : {
        [s: string]: string
    } = {
        button: `background-color: #14aede; border: none; border-radius: 2px; color: #ffffff; font-family: sans-serif, Helvetica, Arial; font-size: 15px; padding: 12px 14px;`,
        main: `font-size: 13px; line-height: 1.5;`,
        p: `margin: 1.5em 0;`
    };

    private transporter: Transporter;

    constructor({filename, options}: {filename: string, options: MailOptions})
    {
        dotenv.config({path: `${__dirname}/../.env`});

        this.filename = filename;
        this.options = {...this.options, ...options};
        this.options.subject = new VueString(options.subject).htmlParse().toString();

        this.transporter = createTransport({
            host: `smtp.websupport.sk`,
            port: 587,
            secure: false,
            auth: {
                user: `ahoj@fifamaniaci.sk`,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        if (process.env.NODE_ENV === `development`)
        {
            this.options.to = `ahoj@tomaskudlac.sk`;
        }

        this.htmlParse();
    }

    private htmlParse(): void
    {
        this.options.html = new VueString(`<div style="${this.styles.main}">${[`p`, `button`].reduce((a, tag) =>
        {
            return a.replace(new RegExp(`<${tag}>`, `g`), `<${tag} style="${this.styles[tag]}">`);
        }, this.options.html)}</div>`).htmlParse().toString();
    };

    public async send(): Promise<SentMessageInfo>
    {
        return await this.transporter.sendMail(this.options).then((res) =>
        {
            console.log(`${new Date().toISOString()} Email sent: ${res.response}`);
            return Promise.resolve(res);
        }).catch((err) =>
        {
            new ErrorCustom({at: `mail/${this.filename} Mail.send()`, err});
            return Promise.reject(err);
        });
    }
}
