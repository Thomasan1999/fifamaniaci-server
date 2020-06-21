import {Cookies, ErrorCustom} from '.';
import {User}                 from './row';
import * as WebSocket         from 'ws';
import * as Pg                from 'pg';

export class SocketCookies extends Cookies
{
    public io: WebSocket.Server;
    public pg: Pg.Client;
    public readonly userProps: string[] = [`id`, `email`, `token`, `username`];

    constructor({io, pg, value}: { io: WebSocket.Server, pg: Pg.Client, value?: string })
    {
        super({value});
        this.io = io;
        this.pg = pg;
    }

    userPropsDelete(): void
    {
        this.userProps.forEach((prop) =>
        {
            delete this.value[prop];
        });
    }

    async validate(): Promise<void>
    {
        const {id, token} = this.value;

        if (id && token)
        {
            await new User({auth: {id, token}, io: this.io, pg: this.pg}).authenticate({res: false}).then((authenticated) =>
            {
                if (authenticated)
                {
                    return;
                }

                this.userPropsDelete();
            }).catch((err) =>
            {
                new ErrorCustom({at: `socket on connection`, err});
                return Promise.reject(err);
            });
        }
        else
        {
            this.userPropsDelete();
        }
    }
}
