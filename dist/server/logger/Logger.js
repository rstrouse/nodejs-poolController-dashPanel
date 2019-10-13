"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
const Config_1 = require("../config/Config");
class Logger {
    constructor() {
        this.cfg = Config_1.config.getSection('log');
    }
    init() {
        exports.logger._logger = winston.createLogger({
            level: exports.logger.cfg.app.level,
            format: winston.format.combine(winston.format.colorize(), winston.format.splat(), winston.format.simple()),
            transports: [new winston.transports.Console()]
        });
    }
    info(...args) { exports.logger._logger.info.apply(exports.logger._logger, arguments); }
    warn(...args) { exports.logger._logger.warn.apply(exports.logger._logger, arguments); }
    verbose(...args) { exports.logger._logger.verbose.apply(exports.logger._logger, arguments); }
    error(...args) { exports.logger._logger.error.apply(exports.logger._logger, arguments); }
    silly(...args) { exports.logger._logger.silly.apply(exports.logger._logger, arguments); }
    isIncluded(byte, arr) {
        if (typeof (arr) === 'undefined' || !arr || arr.length === 0)
            return true;
        if (arr.indexOf(byte) !== -1)
            return true;
        return false;
    }
    isExcluded(byte, arr) {
        if (typeof (arr) === 'undefined' || !arr)
            return false;
        if (arr && arr.length === 0)
            return false;
        if (arr.indexOf(byte) !== -1)
            return true;
        return false;
    }
    flushLogs() {
    }
}
exports.logger = new Logger();
//# sourceMappingURL=Logger.js.map