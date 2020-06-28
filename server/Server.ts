import * as path from "path";
import * as express from "express";
import { config } from "../server/config/Config";
import { logger } from "../server/logger/Logger";
import * as http2 from "http2";
import * as http from "http";
import * as https from "https";
import { outQueues } from "./queues/outboundQueue";
import * as extend from 'extend';
import { ApiError } from './Errors';
import { UploadRoute } from "./upload/upload";
import { MessageDocs } from "./messages/messages";

// This class serves data and pages for
// external interfaces as well as an internal dashboard.
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
}
class ProtoServer {
    // base class for all servers.
    public isRunning: boolean = false;
    public emitToClients(evt: string, ...data: any) {}
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
                    host = host.replace(/:\d+$/, ':' + cfgHttps.port);
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
            this.app.get('/config/:section', (req, res) => { return res.status(200).send(config.getSection(req.params.section)); });
            this.app.put('/config/:section', (req, res) => {
                return res.status(200).send(config.getSection(req.params.section));
            });
            this.app.put('/messages/queue', async (req, res, next) => {
                try {
                    console.log(`request:  ${JSON.stringify(req.body)}...`);
                    let queue = await outQueues.saveQueue(req.body);
                    return res.status(200).send(queue);
                }
                catch (err) {
                    next(err);
                }
            });
            this.app.get('/messages/queue/:id', (req, res, next) => {
                try {
                    console.log(`Getting Queue request:  ${JSON.stringify(req.params)}...`);
                    let id = parseInt(req.params.id, 10);
                    let queue = outQueues.find(q => { return q.id === id });
                    if (typeof queue === 'undefined') next(new ApiError(`Outbound queue id:${id} not found.`, 100, 404));
                    let out = extend(true, {}, queue);
                    out.messages = queue.loadMessages();
                    return res.status(200).send(out);
                }
                catch (err) { next(err); }
            });
            this.app.get('/messages/queues', async (req, res, next) => {
                try {
                    outQueues.loadDescriptors();
                    console.log(`request:  ${JSON.stringify(req.body)}...`);
                    return res.status(200).send(outQueues);
                }
                catch (err) {
                    next(err);
                }
            });
            this.app.get('/messages/docs/constants', (req, res, next) => {
                try {
                    return res.status(200).send(MessageDocs.getConstants());
                }
                catch (err) {
                    next(err);
                }

            });
            this.app.get('/messages/docs/keyBytes', (req, res, next) => {
                try {
                    return res.status(200).send(MessageDocs.getKeyBytes());
                }
                catch (err) {
                    next(err);
                }
            });
            this.app.get('/messages/docs/:key', (req, res, next) => {
                try {
                    return res.status(200).send(MessageDocs.findMessageByKey(req.params.key) || { docKey: req.params.key });
                }
                catch (err) {
                    next(err);
                }
            });
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


        }
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
