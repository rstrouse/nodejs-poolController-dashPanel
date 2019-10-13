"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const express = require("express");
const Config_1 = require("../server/config/Config");
const Logger_1 = require("../server/logger/Logger");
const http = require("http");
// This class serves data and pages for
// external interfaces as well as an internal dashboard.
class WebServer {
    constructor() {
        this._servers = [];
    }
    init() {
        let cfg = Config_1.config.getSection('web');
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
    emitToClients(evt, ...data) {
        for (let i = 0; i < this._servers.length; i++) {
            this._servers[i].emitToClients(evt, ...data);
        }
    }
}
exports.WebServer = WebServer;
class ProtoServer {
    constructor() {
        // base class for all servers.
        this.isRunning = false;
    }
    emitToClients(evt, ...data) { }
}
class Http2Server extends ProtoServer {
    init(cfg) {
        if (cfg.enabled) {
            this.app = express();
            // TODO: create a key and cert at some time but for now don't fart with it.
        }
    }
}
exports.Http2Server = Http2Server;
class HttpServer extends ProtoServer {
    init(cfg) {
        if (cfg.enabled) {
            this.app = express();
            //this.app.use();
            this.server = http.createServer(this.app);
            if (cfg.httpsRedirect) {
                var cfgHttps = Config_1.config.getSection('web.server.https');
                this.app.get('*', (res, req) => {
                    let host = res.get('host');
                    host = host.replace(/:\d+$/, ':' + cfgHttps.port);
                    return res.redirect('https://' + host + req.url);
                });
            }
            else {
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
            // start our server on port
            this.server.listen(cfg.port, cfg.ip, function () {
                Logger_1.logger.info('Server is now listening on %s:%s', cfg.ip, cfg.port);
            });
            this.app.use('/socket.io-client', express.static(path.join(process.cwd(), '/node_modules/socket.io-client/dist/'), { maxAge: '60d' }));
            this.app.use('/jquery', express.static(path.join(process.cwd(), '/node_modules/jquery/'), { maxAge: '60d' }));
            this.app.use('/jquery-ui', express.static(path.join(process.cwd(), '/node_modules/jquery-ui-dist/'), { maxAge: '60d' }));
            this.app.use('/jquery-ui-touch-punch', express.static(path.join(process.cwd(), '/node_modules/jquery-ui-touch-punch-c/'), { maxAge: '60d' }));
            this.app.use('/font-awesome', express.static(path.join(process.cwd(), '/node_modules/@fortawesome/fontawesome-free/'), { maxAge: '60d' }));
            this.app.use('/scripts', express.static(path.join(process.cwd(), '/scripts/'), { maxAge: '60d' }));
            this.app.use('/themes', express.static(path.join(process.cwd(), '/themes/'), { maxAge: '60d' }));
            this.app.get('/config/:section', (req, res) => { return res.status(200).send(Config_1.config.getSection(req.params.section)); });
            this.isRunning = true;
        }
    }
}
exports.HttpServer = HttpServer;
class SspdServer extends ProtoServer {
}
exports.SspdServer = SspdServer;
class MdnsServer extends ProtoServer {
}
exports.MdnsServer = MdnsServer;
exports.webApp = new WebServer();
//# sourceMappingURL=Server.js.map