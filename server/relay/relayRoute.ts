import * as express from "express";
import * as http from "http";
import * as url from "url";
import * as extend from 'extend';
import { ApiError } from '../Errors';
import { config } from "../config/Config";
import { logger } from "../logger/Logger";
import { utils } from "../../server/Constants";
import { io as sockClient, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io-client/build/typed-events";
import { webApp } from "../Server";

export class RelayRoute {
    public static initRoutes(app: express.Application) {
        app.get('/njsPC/*', async (req, res, next) => {
            try {
                // Lets route this back to njsPC.
                await njsPCRelay.relayRequest(req, res, next);
               
            }
            catch (err) { next(err); };
        });
        app.put('/njsPC/*', async (req, res, next) => {
            try {
                await njsPCRelay.relayRequest(req, res, next);
            }
            catch (err) { next(err); }
        });
        app.search('/njsPC/*', async (req, res, next) => {
            try {
                await njsPCRelay.relayRequest(req, res, next);
            }
            catch (err) { next(err); }
        });
        app.delete('/njsPC/*', async (req, res, next) => {
            try {
                await njsPCRelay.relayRequest(req, res, next);
            }
            catch (err) { next(err); }
        });
        app.head('/njsPC/*', async (req, res, next) => {
            try {
                await njsPCRelay.relayRequest(req, res, next);
            }
            catch (err) { next(err); }
        });
        app.patch('/njsPC/*', async (req, res, next) => {
            try {
                await njsPCRelay.relayRequest(req, res, next);
            }
            catch (err) { next(err); }
        });


    }

}
class ServiceRelay {
    public prefix = '/njsPC';
    public useProxy = false;
    public service: { protocol?: string, hostname?: string, port?: number, options?: any } = {};
    public socket: { protocol?: string, hostname?: string, port?: number, options?: any } = {};
    protected _sockClient: Socket<DefaultEventsMap, DefaultEventsMap>;
    public init() {
        let cfg = config.getSection('web.services');
        this.service.protocol = cfg.protocol;
        this.service.hostname = cfg.ip;
        this.service.port = cfg.port;
        this.useProxy = utils.makeBool(cfg.useProxy);
        this.socket.protocol = cfg.socket.protocol || this.service.protocol;
        this.socket.hostname = cfg.socket.hostname || this.service.hostname;
        this.socket.port = cfg.socket.port || this.service.port;
        this.socket.options = extend(true, { reconnectionDelay: 2000, reconnection: true, reconnectionDelayMax: 20000, transports: ['websocket'], upgrade: true, }, this.socket.options);
        this.initSockets();
    }
    public get socketUrl() { return `${this.socket.protocol}${this.socket.hostname}${typeof this.socket.port !== 'undefined' ? ':' + this.socket.port : ''}` }
    public get serviceUrl() { return `${this.service.protocol}${this.service.hostname}${typeof this.service.port !== 'undefined' ? ':' + this.service.port : ''}` };
    private initSockets() {
        if (typeof this._sockClient !== 'undefined') {
            if (!this._sockClient.disconnected) this._sockClient.disconnect();
            this._sockClient = undefined;
        }
        if (this.useProxy) {
            this._sockClient = sockClient(this.socketUrl, this.socket.options);
            if (typeof this._sockClient == 'undefined') {
                logger.warn(`Cannot open njsPC socket ${this.socketUrl}`);
                return;
            }
            this._sockClient.on('connect_error', (err) => { logger.error(`njsPC socket connection error: ${err}`); });
            this._sockClient.on('connect_timeout', () => { logger.error(`njsPC socket connection timeout`); });
            this._sockClient.on('reconnect', (attempts) => { logger.info(`njsPC socket reconnected after ${attempts}`); });
            this._sockClient.on('reconnect_attempt', () => { logger.warn(`njsPC socket attempting to reconnect`); });
            this._sockClient.on('reconnecting', (attempts) => { logger.warn(`njsPC socket attempting to reconnect: ${attempts}`); });
            this._sockClient.on('reconnect_failed', (err) => { logger.warn(`njsPC socket failed to reconnect: ${err}`); });
            this._sockClient.on('close', () => { logger.info(`njsPC socket closed`); });
            this._sockClient.on('connect', () => {
                logger.info(`njsPC socket connected`);
                this._sockClient.onAny((evt, data) => {
                    //logger.info(`Received ${evt}`);
                    switch (evt) {
                        case 'rs485Stats':
                            webApp.emitToChannel('rs485PortStats', evt, data);
                            break;
                        case 'logMessage':
                            webApp.emitToChannel('msgLogger', evt, data);
                            break;
                        default:
                            webApp.emitToClients(evt, data);
                            break;
                    }
                });
            });
            logger.info(`Opening socket ${this.socketUrl}`);
        }
    }
    public relaySocket(evt, ...data) {
        this._sockClient.emit(evt, data);
    }
    public async relayRequest(req, res, next: express.NextFunction) {
        try {
            let proxyUrl = `${this.serviceUrl}${req.url.replace('/njsPC', '')}`;
            logger.info(`Relaying request: ${proxyUrl}`);
            let uri = url.parse(proxyUrl);
            let headers = {};
            if (typeof req.headers.connection !== 'undefined') headers['connection'] = req.headers.connection;
            if (typeof req.headers.accept !== 'undefined') headers['accept'] = req.headers.accept;
            if (typeof req.headers['user-agent'] !== 'undefined') headers['user-agent'] = req.headers['user-agent'];
            if (typeof req.headers['content-type'] !== 'undefined') headers['content-type'] = req.headers['content-type'];
            if (typeof req.headers['content-length'] !== 'undefined') headers['content-length'] = req.headers['content-length'];
            let opts = {
                protocol: uri.protocol, hostname: uri.hostname, path: uri.path, port: uri.port,
                headers: headers,
                method: req.method,
                agent: false
            };
            opts = extend(true, opts, this.service.options);
            await new Promise<void>((resolve, reject) => {
                try {
                    let reqProxy = http.request(opts, respProxy => {
                        respProxy.pipe(res);
                        resolve();
                    });
                    reqProxy.on('error', (err) => { logger.error(err); });
                    if (typeof req.body !== 'undefined') reqProxy.write(JSON.stringify(req.body), (err) => {
                        if(err) logger.error(err);
                    });
                    reqProxy.end();
                } catch (err) { logger.error(err); }
            });
        }
        catch (err) { next(err); }
    }
}
export let njsPCRelay = new ServiceRelay();