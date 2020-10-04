import * as express from 'express';
import * as extend from 'extend';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

import { config } from '../../server/config/Config';
import { logger } from '../../server/logger/Logger';
import { Message } from '../../server/messages/messages';
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
        app.post('/upload/backgroundFile', (req, res, next) => {
            let upload = backgroundUpload.upload.single('backgroundFile');
            upload(req, res, function (err) {
                if (err) {
                    console.log(err);
                    res.status(500).send(err);
                }
                else {
                    let backgrounds = BackgroundUpload.getBackgrounds();
                    res.status(200).send({
                        uploaded: backgrounds.find(elem => elem.name === req.file.filename),
                        backgrounds: backgrounds
                    });
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
        if (!file.originalname.match(/\.(log|)$/)) {
            return cb(new Error('Only .log files are allowed!'), false);
        }
        cb(null, true);
    }
    public static parsePacket(msg) {
        let m: Message = new Message();
        m.parseV5(msg);
        return m;
    }
    public static fromVer5(msg) {
        if (msg.type === 'packet') {
            return LogUpload.parsePacket(msg);
        }
        else if (msg.type === 'url') {
            return {
                id: ++Message._messageId,
                proto: 'api',
                dir: msg.direction === 'inbound' ? 'in' : 'out',
                requestor: '',
                method: '',
                path: msg.url,
                body: undefined,
                ts: msg.timestamp
            };
        }
    }
    public static readLogFile(filePath) {
        let lines = fs.readFileSync(filePath, "utf8").split(/[\n\r]/).filter(Boolean);
        let arr = [];
        Message._messageId = 0;
        let cmsg = null;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.indexOf('][') !== -1) line = line.replace(/\]\[/g, '],[');
            try {
                let msg = JSON.parse(line);
                if (typeof msg.level !== 'undefined') {
                    if (cmsg !== null && cmsg.valid && !cmsg._complete)
                        cmsg.mergeBytes(msg.packet);
                    else
                        cmsg = LogUpload.fromVer5(msg);
                    if (cmsg._complete || cmsg.proto === 'api') {
                        if(cmsg.proto !== 'api') arr.push(cmsg); // Kill these for now as they really don't tell us anything.
                        cmsg = null;
                    }
                }
                else
                    arr.push(msg);
            }
            catch (err) {
                logger.error(err);
                logger.error(line);
            }
        }
        return arr;
    }
}
export class BackgroundUpload {
    public path = path.posix.join(process.cwd(), 'themes/Images');
    constructor() {
        try {
            this._multer = multer({
                dest: this.path,
                storage: multer.diskStorage({
                    destination: (req, file, cb) => {
                        cb(null, this.path);
                    },
                    filename: (req, file, cb) => {
                        let target = path.posix.join(process.cwd(), this.path, file.originalname);
                        let p = path.parse(target);
                        let ord = 1;
                        if (this.preserveFile) {
                            while (fs.existsSync(target)) {
                                //console.log(p);
                                var name = p.name;
                                if (name.endsWith('_' + (ord - 1))) {
                                    name = name.substring(0, name.lastIndexOf('_' + (ord - 1)));
                                }
                                target = path.posix.join(process.cwd(), this.path, name + '_' + ord + p.ext);
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
    public static getBackgrounds(): { name: string, ext: string, size: number, url: string }[] {
        let arr = [];
        let dir = path.posix.join(process.cwd(), 'themes/Images');
        let files = fs.readdirSync(dir, { withFileTypes: true });
        for (let i = 0; i < files.length; i++) {
            let f = files[i];
            if (f.isFile()) {
                let ext = path.extname(f.name).toLocaleLowerCase();
                if (['.jpg', '.gif', '.png', '.bmp', '.tiff'].includes(ext)) {
                    let stat = fs.statSync(path.posix.join(dir, f.name));
                    arr.push({ name: f.name, ext: ext, size: stat.size, url:`/themes/Images/${f.name}` });
                }
            }
        }
        return arr;
    }
}
const logUpload = new LogUpload();
const backgroundUpload = new BackgroundUpload();
