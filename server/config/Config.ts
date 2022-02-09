import * as path from 'path';
import * as fs from 'fs';
import * as extend from 'extend';
import { logger } from '../logger/Logger';
class Config {
    private cfgPath: string;
    private _cfg: any;
    private _isInitialized: boolean = false;
    constructor() {
        this.cfgPath = path.posix.join(process.cwd(), "/config.json");
        // RKS 05-18-20: This originally had multiple points of failure where it was not in the try/catch.
        try {
            this._cfg = fs.existsSync(this.cfgPath) ? JSON.parse(fs.readFileSync(this.cfgPath, "utf8")) : {};
            const def = JSON.parse(fs.readFileSync(path.join(process.cwd(), "/defaultConfig.json"), "utf8").trim());
            const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "/package.json"), "utf8").trim());
            this._cfg = extend(true, {}, def, this._cfg, { appVersion: {installed: packageJson.version }});
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
        if (JSON.stringify(c[section]) === JSON.stringify(val)){
            logger.silly(`setSection: Config section and val are identical.  Not updating.`)
        }
        else {
            c[section] = val;
            this.update();
        }
    }

    public getSection(section?: string, opts?: any) : any {
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
        if (!fs.existsSync(dir)) {
            fs.mkdir(dir, (err) => {
                // Logger will not be initialized by the time we reach here so we must
                // simply log these to the console.
                if (err) console.log(`Error creating directory: ${dir} - ${err}`);
            });
        }
    }
    private getEnvVariables(){
        // set docker env variables to config.json, if they are set
        let env = process.env;
        if (typeof env.POOL_HTTP_IP !== 'undefined' && env.POOL_HTTP_IP !== this._cfg.web.services.ip) {
            this._cfg.web.services.ip = env.POOL_HTTP_IP;
        }
        if (typeof env.POOL_HTTP_PORT !== 'undefined' && parseInt(env.POOL_HTTP_PORT,10) !== this._cfg.web.services.port) {
            this._cfg.web.services.port = parseInt(env.POOL_HTTP_PORT,10);
        }
    }
}
export var config:Config = new Config();