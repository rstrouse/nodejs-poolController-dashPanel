import * as path from 'path';
import * as fs from 'fs';
import * as extend from 'extend';
import { logger } from '../logger/Logger';
class Config {
    private cfgPath: string;
    private _cfg: any;
    private _isInitialized: boolean = false;
    constructor() {
        // Use relative joins so we stay inside the working directory (e.g., /app inside container)
        this.cfgPath = path.join(process.cwd(), 'config.json');
        const legacyRootCfg = path.sep + 'config.json';
        const defaultPath = path.join(process.cwd(), 'defaultConfig.json');
        const packagePath = path.join(process.cwd(), 'package.json');
        try {
            // Read defaults and package first
            const def = JSON.parse(fs.readFileSync(defaultPath, 'utf8').trim());
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8').trim());
            let existing: any = {};
            if (fs.existsSync(this.cfgPath)) {
                const attemptRead = () => {
                    const raw = fs.readFileSync(this.cfgPath, 'utf8');
                    return JSON.parse(raw);
                }
                try {
                    existing = attemptRead();
                } catch (parseErr) {
                    // Try stale tmp file if present (previous atomic write crash)
                    const tmpPath = this.cfgPath + '.tmp';
                    if (fs.existsSync(tmpPath)) {
                        try {
                            const rawTmp = fs.readFileSync(tmpPath, 'utf8');
                            existing = JSON.parse(rawTmp);
                            console.warn('Recovered configuration from temporary file.');
                        } catch {
                            // fall through to rebuild
                        }
                    }
                    if (!existing || Object.keys(existing).length === 0) {
                        console.warn(`config.json corrupt or unreadable (${parseErr}). Rebuilding from defaults.`);
                        // Backup bad file for inspection
                        try {
                            fs.writeFileSync(this.cfgPath + '.corrupt', fs.readFileSync(this.cfgPath));
                        } catch { /* ignore */ }
                        existing = {};
                    }
                }
            } else if (fs.existsSync(legacyRootCfg)) {
                // Legacy location migration (/config.json at filesystem root)
                try {
                    const raw = fs.readFileSync(legacyRootCfg, 'utf8');
                    existing = JSON.parse(raw);
                    console.log('Migrating legacy /config.json to working directory.');
                } catch (e) {
                    console.warn(`Failed to read legacy /config.json (${e}). Ignoring.`);
                }
            }
            this._cfg = extend(true, {}, def, existing, { appVersion: { installed: packageJson.version } });
            this._isInitialized = true;
            this.getEnvVariables();
            this.update();
        } catch (err) {
            console.log(`Error reading configuration information.  Aborting startup: ${err}`);
            throw err;
        }
    }
    public update() {
        // Don't overwrite the configuration if we failed during the initialization.
        try {
            if (!this._isInitialized) return;
            // Atomic write: write to temp then rename so we don't end up with truncated JSON
            const tmpPath = this.cfgPath + '.tmp';
            const data = JSON.stringify(this._cfg, undefined, 2);
            try {
                fs.writeFileSync(tmpPath, data, { encoding: 'utf8' });
                fs.renameSync(tmpPath, this.cfgPath);
                console.log(`Updated configuration file`);
            } catch (e) {
                // Clean up temp file if rename failed
                try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch { /* ignore */ }
                throw e;
            }
        }
        catch (err) { console.log(`Error writing configuration file ${err}`); }
    }
    public setSection(section: string, val) {
        let c = this._cfg;
        if (section.indexOf('.') !== -1) {
            let arr = section.split('.');
            for (let i = 0; i < arr.length - 1; i++) {
                if (typeof c[arr[i]] === 'undefined')
                    c[arr[i]] = {};
                c = c[arr[i]];
            }
            section = arr[arr.length - 1];
        }
        if (JSON.stringify(c[section]) === JSON.stringify(val)) {
            logger.silly(`setSection: Config section and val are identical.  Not updating.`)
        }
        else {
            c[section] = val;
            this.update();
        }
    }

    public getSection(section?: string, opts?: any): any {
        if (typeof (section) === 'undefined') return this._cfg;
        var c: any = this._cfg;
        if (section.indexOf('.') !== -1) {
            var arr = section.split('.');
            for (let i = 0; i < arr.length; i++) {
                if (typeof (c[arr[i]]) === 'undefined') {
                    c = null;
                    break;
                }
                else
                    c = c[arr[i]];
            }
        }
        else
            c = c[section];
        return extend(true, {}, opts || {}, c || {});
    }
    public init() {
        let baseDir = process.cwd();
        this.ensurePath(baseDir + '/data/');
        this.ensurePath(baseDir + '/data/outQueues/');
    }
    private ensurePath(dir: string) {
        fs.mkdir(dir, { recursive: true }, (err) => {
            if (err) console.log(`Error creating directory: ${dir} - ${err}`);
        });
    }
    
    private getEnvVariables() {
        // set docker env variables to config.json, if they are set
        let env = process.env;
        // Legacy simple overrides (backward compatibility)
        if (typeof env.POOL_HTTP_IP !== 'undefined' && env.POOL_HTTP_IP !== this._cfg.web.services.ip) {
            this._cfg.web.services.ip = env.POOL_HTTP_IP;
        }
        if (typeof env.POOL_HTTP_PORT !== 'undefined') {
            const port = parseInt(env.POOL_HTTP_PORT, 10);
            if (!isNaN(port) && port !== this._cfg.web.services.port) this._cfg.web.services.port = port;
        }

        // Expanded hierarchical overrides using POOL_WEB_* naming convention
        // Examples expected from docker-compose comments:
        //   POOL_WEB_SERVERS_HTTP_PORT=5150
        //   POOL_WEB_SERVERS_HTTPS_PORT=5151
        //   POOL_WEB_SERVICES_IP=127.0.0.1
        //   POOL_WEB_SERVICES_PORT=4200
        //   POOL_WEB_SERVICES_PROTOCOL=http://
        // Mapping strategy: POOL_WEB_ prefix removed, remaining path split by '_' and applied to this._cfg.web.*
        Object.keys(env)
            .filter(k => k.startsWith('POOL_WEB_'))
            .forEach(k => {
                try {
                    const raw = env[k];
                    if (typeof raw === 'undefined') return;
                    const pathParts = k.replace('POOL_WEB_', '').toLowerCase().split('_');
                    // Special handling for servers.http.port and servers.https.port
                    // Recognize patterns: SERVERS_HTTP_PORT / SERVERS_HTTPS_PORT
                    let target = this._cfg.web;
                    if (pathParts[0] === 'servers') {
                        // servers.http.port => this._cfg.web.servers.http.port
                        if (pathParts.length >= 3) {
                            const proto = pathParts[1]; // http / https / http2
                            const field = pathParts[2]; // port or enabled etc.
                            if (!target.servers) target.servers = {};
                            if (!target.servers[proto]) target.servers[proto] = {};
                            if (field === 'port') {
                                const v = parseInt(raw, 10);
                                if (!isNaN(v)) target.servers[proto].port = v;
                            }
                            else if (field === 'enabled') {
                                target.servers[proto].enabled = ['true','1','yes','on'].includes(raw.toLowerCase());
                            }
                            else {
                                target.servers[proto][field] = raw;
                            }
                        }
                        return; // handled
                    }
                    // services.* mapping: SERVICES_IP, SERVICES_PORT, SERVICES_PROTOCOL
                    if (pathParts[0] === 'services') {
                        if (!target.services) target.services = {};
                        if (pathParts.length >= 2) {
                            const field = pathParts[1];
                            if (field === 'port') {
                                const v = parseInt(raw, 10);
                                if (!isNaN(v)) target.services.port = v;
                            }
                            else {
                                target.services[field] = raw;
                            }
                        }
                        return;
                    }
                } catch (e) {
                    logger.warn(`Failed to apply env override ${k}: ${e}`);
                }
            });
    }
}
export var config: Config = new Config();