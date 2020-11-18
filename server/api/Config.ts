import * as express from "express";
import { ApiError } from '../Errors';
import { UploadRoute, BackgroundUpload } from "../upload/upload";
import { Client } from "node-ssdp";
import { config } from "../config/Config";
import { logger } from "../logger/Logger";

export class ConfigRoute {
    public static initRoutes(app: express.Application) {
        app.get('/config/findPoolControllers', async (req, res, next) => {
            let prom = new Promise((resolve, reject) => {
                let ssdpClient = new Client({});
                let servers = [];
                try {
                    ssdpClient.on('response', (headers, statusCode, rinfo) => {
                        if (statusCode === 200) {
                            let url = new URL(headers.LOCATION);
                            if (typeof servers.find(elem => url.origin === elem.origin) === 'undefined') {
                                servers.push({ origin: url.origin, username: url.username, password: url.password, protocol: url.protocol, host: url.host, hostname: url.hostname, port: url.port, hash: url.hash });
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