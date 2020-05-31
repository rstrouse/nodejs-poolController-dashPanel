import * as express from 'express';
import * as extend from 'extend';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

import { config } from '../../server/config/Config';
import { logger } from '../../server/logger/Logger';

export class UploadRoute {
    public static initRoutes(app: express.Application) {
        app.post('/upload/logfile', logUpload.upload.single('logFile'), (req, res, next) => {



        });
    }
}
export class LogUpload {
    constructor() {
        let cfg = config.getSection('uploads.logFile', { uploads: { logFile: { path: 'uploads/' } } });
        try {
            if (!fs.existsSync(cfg.path)) {
                fs.mkdirSync(cfg.path);
            }
            this._multer = multer({ dest: cfg.path });
        } catch (err) { logger.error(err); }
    }
    private _multer = multer({});
    public get upload() { return this._multer; }
    public static logFilter(req, file, cb) {
        if (!file.originalname.match(/\.(log)$/)) {
            return cb(new Error('Only .log files are allowed!'), false);
        }
        cb(null, true);
    }
}
const logUpload = new LogUpload();