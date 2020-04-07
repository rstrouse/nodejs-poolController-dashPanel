"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const extend = require("extend");
const Logger_1 = require("../logger/Logger");
class Config {
    constructor() {
        this.cfgPath = path.posix.join(process.cwd(), '/config.json');
        let cfgText = fs.existsSync(this.cfgPath) ? fs.readFileSync(this.cfgPath, 'utf8') : '{}';
        try {
            this._cfg = JSON.parse(cfgText);
        }
        catch (err) {
            console.log('Cannot parse config file: ' + err);
            this._cfg = {};
        }
        var def = JSON.parse(fs.readFileSync(path.join(process.cwd(), '/defaultConfig.json'), 'utf8').trim());
        this._cfg = extend(true, {}, def, this._cfg);
    }
    update() {
        // Don't overwrite the configuration if we failed during the initialization.
        if (typeof (this._cfg) === 'undefined' || !this._cfg === null || typeof (this._cfg.appVersion) === 'undefined')
            return;
        return fs.writeFile(this.cfgPath, JSON.stringify(this._cfg, undefined, 2), function (err) { if (err)
            Logger_1.logger.error('Error writing configuration file %s', err); });
    }
    getSection(section, opts) {
        if (typeof (section) === 'undefined')
            return this._cfg;
        var c = this._cfg;
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
    init() {
        this.update();
    }
}
exports.config = new Config();
//# sourceMappingURL=Config.js.map