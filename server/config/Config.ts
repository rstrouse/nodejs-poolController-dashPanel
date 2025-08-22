import * as path from 'path';
import * as fs from 'fs';
import * as extend from 'extend';
import { logger } from '../logger/Logger';
class Config {
    private cfgPath: string;
    private _cfg: any;
    private _isInitialized: boolean = false;
    constructor() {
        this.cfgPath = path.posix.join(process.cwd(), "data/config.json");
        // RKS 05-18-20: This originally had multiple points of failure where it was not in the try/catch.
        try {
            if (fs.existsSync(this.cfgPath)) {
                this._cfg = JSON.parse(fs.readFileSync(this.cfgPath, "utf8").replace(/^\uFEFF/, ''));
            } else if (fs.existsSync(path.posix.join(process.cwd(), "/config.json"))) {
                // If we don't have the latest split config location, check in old location
                this._cfg = JSON.parse(fs.readFileSync(path.posix.join(process.cwd(), "/config.json"), "utf8").replace(/^\uFEFF/, ''));
            } else {
                this._cfg = {};
            }
            const def = JSON.parse(fs.readFileSync(path.join(process.cwd(), "/defaultConfig.json"), "utf8").replace(/^\uFEFF/, '').trim());
            const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "/package.json"), "utf8").replace(/^\uFEFF/, '').trim());
            this._cfg = extend(true, {}, def, this._cfg, { appVersion: { installed: packageJson.version } });
            this._isInitialized = true;
            this.getEnvVariables();
            this.update();
        } catch (err) {
            console.log(`Error reading configuration information.  Aborting startup: ${err}`);
            // Rethrow this error so we exit the app with the appropriate pause in the console.
            throw err;
        }
    }
    public update() {
        // Don't overwrite the configuration if we failed during the initialization.
        try {
            if (!this._isInitialized) return;
            fs.writeFileSync(
                this.cfgPath,
                JSON.stringify(this._cfg, undefined, 2)
            );
            console.log(`Updated configuration file`);
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
        if (typeof env.POOL_HTTP_IP !== 'undefined' && env.POOL_HTTP_IP !== this._cfg.web.services.ip) {
            this._cfg.web.services.ip = env.POOL_HTTP_IP;
        }
        if (typeof env.POOL_HTTP_PORT !== 'undefined' && parseInt(env.POOL_HTTP_PORT, 10) !== this._cfg.web.services.port) {
            this._cfg.web.services.port = parseInt(env.POOL_HTTP_PORT, 10);
        }
    }
}
export var config: Config = new Config();