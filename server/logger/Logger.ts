import * as path from 'path';
import * as fs from 'fs';
import * as winston from 'winston';
import * as os from 'os';
import { config } from '../config/Config';
class Logger {
    constructor() {
        this.cfg = config.getSection('log');
    }
    private cfg;
    private _logger: winston.Logger;
    public init() {
        logger._logger = winston.createLogger({
            level: logger.cfg.app.level,
            format: winston.format.combine(winston.format.colorize(), winston.format.splat(), winston.format.simple()),
            transports: [new winston.transports.Console()]
        });
    }
    public info(...args: any[]) { logger._logger.info.apply(logger._logger, arguments); }
    public warn(...args: any[]) { logger._logger.warn.apply(logger._logger, arguments); }
    public verbose(...args: any[]) { logger._logger.verbose.apply(logger._logger, arguments); }
    public error(...args: any[]) { logger._logger.error.apply(logger._logger, arguments); }
    public silly(...args: any[]) { logger._logger.silly.apply(logger._logger, arguments); }
    private isIncluded(byte: number, arr: number[]): boolean {
        if (typeof(arr) === 'undefined' || !arr || arr.length === 0) return true;
        if (arr.indexOf(byte) !== -1) return true;
        return false;
    }
    private isExcluded(byte: number, arr: number[]): boolean {
        if (typeof (arr) === 'undefined' || !arr) return false;
        if (arr && arr.length === 0) return false;
        if (arr.indexOf(byte) !== -1) return true;
        return false;
    }
    public flushLogs() {
    }
}
export var logger = new Logger();