import * as WebSocket from 'ws';
import * as Express   from 'express';
import * as Pg        from 'pg';

export type RouteArguments = { app: Express.Router, io: WebSocket.Server, pg: Pg.Client, route: string };
