import * as express from 'express';
import * as extend from 'extend';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

import { config } from '../../server/config/Config';
import { logger } from '../../server/logger/Logger';

export class UploadRoute {
    public static initRoutes(app: express.Application) {
        app.post('/upload/logfile', (req, res, next) => {
            var upload = logUpload.upload.single('logFile');
            upload(req, res, function (err) {
                if (err) {
                    console.log(err);
                    res.status(500).send(err);
                }
                else {
                    res.status(200).send(LogUpload.readLogFile(path.posix.join(process.cwd(), req.file.path)));
                }
            });
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
            this._multer = multer({
                dest: cfg.path,
                storage: multer.diskStorage({
                    destination: (req, file, cb) => {
                        if (!fs.existsSync(cfg.path)) {
                            fs.mkdirSync(cfg.path);
                        }
                        cb(null, cfg.path);
                    },
                    filename: (req, file, cb) => {
                        let target = path.posix.join(process.cwd(), cfg.path, file.originalname);
                        let p = path.parse(target);
                        let ord = 1;
                        if (this.preserveFile) {
                            while (fs.existsSync(target)) {
                                //console.log(p);
                                var name = p.name;
                                if (name.endsWith('_' + (ord - 1))) {
                                    name = name.substring(0, name.lastIndexOf('_' + (ord - 1)));
                                }
                                target = path.posix.join(process.cwd(), cfg.path, name + '_' + ord + p.ext);
                                p = path.posix.parse(target);
                                ord++;
                            }
                        }
                        cb(null, p.name + p.ext);
                    }
                })
            });
        } catch (err) { logger.error(err); }
    }
    private _multer = multer({});
    public preserveFile: boolean = false;
    public get upload() { return this._multer; }
    public static logFilter(req, file, cb) {
        if (!file.originalname.match(/\.(log)$/)) {
            return cb(new Error('Only .log files are allowed!'), false);
        }
        cb(null, true);
    }
    public static readLogFile(filePath) {
        let lines = fs.readFileSync(filePath, "utf8").split(/[\n\r]/).filter(Boolean);
        let arr = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.indexOf('][') !== -1) line = line.replace(/\]\[/g, '],[');
            arr.push(JSON.parse(line));
        }
        return arr;
    }
}
const logUpload = new LogUpload();
