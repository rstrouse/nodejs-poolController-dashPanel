import * as path from "path";
import * as express from "express";
import { URL } from "url";
import { Client } from "node-ssdp";
import { config } from "../server/config/Config";
import { logger } from "../server/logger/Logger";
import * as http2 from "http2";
import * as http from "http";
import * as https from "https";
import * as extend from 'extend';
import { ApiError } from './Errors';
import { UploadRoute, BackgroundUpload } from "./upload/upload";
import { setTimeout } from "timers";
import { ConfigRoute } from "./api/Config";
import { MessagesRoute } from "./api/Messages";
import { RelayRoute, njsPCRelay } from "./relay/relayRoute";
import { Namespace, RemoteSocket, Server as SocketIoServer, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

// This class serves data and pages for
export class WebServer {
    private _servers: ProtoServer[] = []; 
    constructor() { }
    public init() {
        let cfg = config.getSection('web');
        let srv;
        for (let s in cfg.servers) {
            let c = cfg.servers[s];
            switch (s) {
                case 'http':
                    srv = new HttpServer();
                    this._servers.push(srv);
                    srv.init(c);
                    break;
                case 'https':
                    srv = new Http2Server();
                    this._servers.push(srv);
                    srv.init(cfg.servers[s]);
                    break;
            }
        }
    }
    public emitToClients(evt: string, ...data: any) {
        for (let i = 0; i < this._servers.length; i++) {
            this._servers[i].emitToClients(evt, ...data);
        }
    }
    public emitToChannel(channel: string, evt: string, ...data: any) {
        for (let i = 0; i < this._servers.length; i++) {
            this._servers[i].emitToChannel(channel, evt, ...data);
        }
    }
}
class ProtoServer {
    // base class for all servers.
    public isRunning: boolean = false;
    public emitToClients(evt: string, ...data: any) {}
    public emitToChannel(channel: string, evt: string, ...data: any) { }
}
export class Http2Server extends ProtoServer {
    public server: http2.Http2Server;
    public app: express.Application;
    public init(cfg) {
        if (cfg.enabled) {
            this.app = express();
            // TODO: create a key and cert at some time but for now don't fart with it.
        }
    }
}
export class HttpServer extends ProtoServer {
    // Http protocol
    public app: express.Application;
    public server: http.Server;
    public init(cfg) {
        if (cfg.enabled) {
            this.app = express();

            //this.app.use();
            this.server = http.createServer(this.app);
            if (cfg.httpsRedirect) {
                var cfgHttps = config.getSection('web.server.https');
                this.app.get('*', (res: express.Response, req: express.Request) => {
                    let host = res.get('host');
                    host = typeof cfgHttps.port !== 'undefined' ? host.replace(/:\d+$/, ':' + cfgHttps.port) : host;
                    return res.redirect('https://' + host + req.url);
                });
            }
            this.app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
                if ('OPTIONS' === req.method) {
                    res.sendStatus(200);
                }
                else {
                    console.log(`${req.ip} ${req.method} ${req.url}`);
                    next();
                }
            });
            this.app.use(express.static(path.join(process.cwd(), 'pages'), { maxAge: '1d' }));
            this.app.use(express.json());
            // Put in a custom replacer so that we can send error messages to the client.  If we don't do this the base properties of Error
            // are omitted from the output.
            this.app.set('json replacer', (key, value) => {
                if (value instanceof Error) {
                    var err = {};
                    Object.getOwnPropertyNames(value).forEach((prop) => { err[prop] = value[prop]; });
                    //console.log('We have an error');
                    //console.log(err);
                    return err;
                }
                return value;
            });
            this.initSockets();
            // start our server on port
            let self = this;
            this.server.listen(cfg.port, cfg.ip, function () {
                //console.log(self);
                logger.info('Server is now listening on %s:%s', cfg.ip, cfg.port);
            });
            this.app.use('/socket.io-client', express.static(path.join(process.cwd(), '/node_modules/socket.io-client/dist/'), { maxAge: '60d' }));
            this.app.use('/jquery', express.static(path.join(process.cwd(), '/node_modules/jquery/'), { maxAge: '60d' }));
            this.app.use('/jquery-ui', express.static(path.join(process.cwd(), '/node_modules/jquery-ui-dist/'), { maxAge: '60d' }));
            this.app.use('/jquery-ui-touch-punch', express.static(path.join(process.cwd(), '/node_modules/jquery-ui-touch-punch-c/'), { maxAge: '60d' }));
            this.app.use('/font-awesome', express.static(path.join(process.cwd(), '/node_modules/@fortawesome/fontawesome-free/'), { maxAge: '60d' }));
            this.app.use('/scripts', express.static(path.join(process.cwd(), '/scripts/'), { maxAge: '1d' }));
            this.app.use('/themes', express.static(path.join(process.cwd(), '/themes/'), { maxAge: '1d' }));
            RelayRoute.initRoutes(this.app);
            ConfigRoute.initRoutes(this.app);
            MessagesRoute.initRoutes(this.app);
            UploadRoute.initRoutes(this.app);
            // This is last so that it is picked up when we have an error.
            this.app.use((error, req, res, next) => {
                logger.error(error);
                if (!res.headersSent) {
                    let httpCode = error.httpCode || 500;
                    res.status(httpCode).send(error);
                }
            });
            this.isRunning = true;
            njsPCRelay.init();
        }
    }
    public sockServer: SocketIoServer<DefaultEventsMap, DefaultEventsMap>;
    private _sockets: RemoteSocket<DefaultEventsMap>[] = [];
    public emitToClients(evt: string, ...data: any) {
        if (this.isRunning) {
            this.sockServer.emit(evt, ...data);
        }
    }
    public emitToChannel(channel: string, evt: string, ...data: any) {
        //console.log(`Emitting to channel ${channel} - ${evt}`)
        if (this.isRunning) {
            this.sockServer.to(channel).emit(evt, ...data);
        }
    }
    protected initSockets() {
        let options = {
            allowEIO3: true,
            cors: {
                origin: true,
                methods: ["GET", "POST"],
                credentials: true
            }
        }
        this.sockServer = new SocketIoServer(this.server, options);
        this.sockServer.on("connection", (sock: Socket) => {
            logger.info(`New socket client connected ${sock.id} -- ${sock.client.conn.remoteAddress}`);
            this.socketHandler(sock);
            sock.on('connect_error', (err) => {
                logger.error('Socket server error %s', err.message);
            });
            sock.on('reconnect_failed', (err) => {
                logger.error('Failed to reconnect with socket %s', err.message);
            });
            sock.on('sendRS485PortStats', (sendPortStatus: boolean) => {
                console.log(`sendRS485PortStats set to ${sendPortStatus}`);
                // When we receive this we need to relay this.
                if (!sendPortStatus) sock.leave('rs485PortStats');
                else sock.join('rs485PortStats');
                njsPCRelay.relaySocket('sendRS485PortStats', sendPortStatus);
            });
            sock.on('sendLogMessages', (sendMessages: boolean) => {
                console.log(`sendLogMessages set to ${sendMessages}`);
                if (!sendMessages) sock.leave('msgLogger');
                else sock.join('msgLogger');
                njsPCRelay.relaySocket('sendLogMessages', sendMessages);
            });
            sock.on('sendOutboundMessage', (data) => {
                njsPCRelay.relaySocket('sendOutboundMessage', data);
            });

        });
        this.app.use('/socket.io-client', express.static(path.join(process.cwd(), '/node_modules/socket.io-client/dist/'), { maxAge: '60d' }));
    }
    private socketHandler(sock: Socket) {
        let self = this;
        setTimeout(async () => {
            // refresh socket list with every new socket
            self._sockets = await self.sockServer.fetchSockets();
        }, 100)
        sock.on('error', (err) => {
            logger.error('Error with socket: %s', err);
        });
        sock.on('close', async (id) => {
            logger.info('Socket diconnecting %s', id);
            self._sockets = await self.sockServer.fetchSockets();
        });
        sock.on('echo', (msg) => { sock.emit('echo', msg); });
    }
}
export class SspdServer extends ProtoServer {
    // Simple service discovery protocol
    public server: any;
}
export class MdnsServer extends ProtoServer {
    // Multi-cast DNS server
    public server: any;
}
export const webApp = new WebServer();
