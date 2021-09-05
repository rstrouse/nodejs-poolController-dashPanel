import * as express from "express";
import * as extend from 'extend';
import * as dns from 'dns';
import { ApiError } from '../Errors';
import { UploadRoute, BackgroundUpload } from "../upload/upload";
import { Client } from "node-ssdp";
import { config } from "../config/Config";
import { logger } from "../logger/Logger";
import { versionCheck } from '../config/VersionCheck';
import { njsPCRelay } from "../relay/relayRoute";
export class ConfigRoute {
    public static initRoutes(app: express.Application) {
        app.get('/config/serviceUri', (req, res, next) => {
            try {
                let srv = config.getSection('web.services');
                if (srv.useProxy) {
                    //console.log({ protocol: `${req.protocol}://`, ip: `${req.hostname}:${req.socket.localPort}`, useProxy: true });
                }
                res.status(200).send(srv);
            }
            catch (err) { next(err); }
        });
        app.put('/config/serviceUri', async (req, res, next) => {
            try {
                let srv = extend(true, {}, config.getSection('web.services'), req.body);
                config.setSection('web.services', srv);
                njsPCRelay.init();
                return res.status(200).send(config.getSection(req.body.section));
            }
            catch (err) { next(err); }
        });
        app.get('/config/findPoolControllers', async (req, res, next) => {
            let prom = new Promise<void>((resolve, reject) => {
                let ssdpClient = new Client({});
                let servers = [];
                try {
                    ssdpClient.on('response', (headers, statusCode, rinfo) => {
                        if (statusCode === 200) {
                            let url = new URL(headers.LOCATION);
                            if (typeof servers.find(elem => url.origin === elem.origin) === 'undefined') {
                                let server = { origin: url.origin, username: url.username, password: url.password, protocol: url.protocol, host: url.host, hostname: url.hostname, port: url.port, hash: url.hash, hostnames: [] };
                                servers.push(server);
                                (async () => {
                                    try {
                                        server.hostnames = await dns.promises.reverse(url.hostname);
                                    } catch (err) { logger.error(`Error resolving host names: ${err.message}`) }
                                })();
                            }
                        }
                    });
                    ssdpClient.search('urn:schemas-upnp-org:device:PoolController:1');
                    setTimeout(() => {
                        resolve();
                        ssdpClient.stop(); console.log('done searching for poolController');
                        return res.status(200).send(servers);
                    }, 5000);
                }
                catch (err) { reject(err); };
            });
        });
        app.get('/config/findREMControllers', async (req, res, next) => {
            let prom = new Promise<void>((resolve, reject) => {
                let ssdpClient = new Client({});
                let servers = [];
                try {
                    ssdpClient.on('response', (headers, statusCode, rinfo) => {
                        if (statusCode === 200) {
                            let url = new URL(headers.LOCATION);
                            if (typeof servers.find(elem => url.origin === elem.origin) === 'undefined') {
                                let server = { origin: url.origin, username: url.username, password: url.password, protocol: url.protocol, host: url.host, hostname: url.hostname, port: url.port, hash: url.hash, hostnames: [] };
                                servers.push(server);
                                (async () => {
                                    try {
                                        server.hostnames = await dns.promises.reverse(url.hostname);
                                    } catch(err) { logger.error(`Error resolving host names: ${err.message}`)}
                                })();
                            }
                        }
                    });
                    ssdpClient.search('urn:schemas-upnp-org:device:REMController:1');
                    setTimeout(() => {
                        resolve();
                        ssdpClient.stop(); console.log('done searching for REM Controller');
                        return res.status(200).send(servers);
                    }, 5000);
                }
                catch (err) { reject(err); };
            });
        });
        app.get('/config/appVersion', (req, res) => {
            try {
                let v = versionCheck.checkGitRemote();
                return res.status(200).send(v);
            }
            catch (err) { console.log(err); return res.status(500).send(err); }
        });
        app.get('/config/:section', (req, res) => { return res.status(200).send(config.getSection(req.params.section)); });
        app.put('/config/:section', (req, res) => {
            try {
                config.setSection(req.params.section, req.body);
            }
            catch (err) { return res.status(400).send(new Error(err)); }
            return res.status(200).send(config.getSection(req.params.section));
        });
        app.get('/options', (req, res) => {
            let opts = {
                web: config.getSection('web'),
                backgrounds: BackgroundUpload.getBackgrounds()
            }
            return res.status(200).send(opts);
        });
    }
}