import * as path from 'path';
import * as fs from 'fs';
import * as extend from 'extend';
import { logger } from '../logger/Logger';
class outboundQueueCollection extends Array<outboundQueue> {
    private _queuePath: string;
    private _isInitialized: boolean = false;
    constructor(...items) {
        super(...items);
        this._queuePath = path.posix.join(process.cwd(), '/data/outQueues/');
        this._isInitialized = true;
        this.loadDescriptors();
    }
    private loadDescriptors() {
        let data = [];
        if (fs.existsSync(this.queuePath + 'outQueues.json')) {
            try {
                data = JSON.parse(fs.readFileSync(this.queuePath + 'outQueues.json', 'utf8') || '[]');
            }
            catch (err) {
                logger.error(err);
            }
        }
        this.length = 0;
        for (let i = 0; i < data.length; i++) {
            this.push(Object.assign(new outboundQueue(), data[i]));
        }
        let nextId = this.getNextId();

        // List all the files in the directory
        try {
            fs.readdirSync(outQueues.queuePath).forEach(file => {
                if (path.extname(file) === '.out') {
                    let name = path.parse(file).name;
                    let q = this.find(elem => { return elem.fileName === name });
                    if (typeof q === 'undefined') {
                        q = new outboundQueue();
                        q.fileName = name;
                        q.name = name.replace('_', ' ');
                        q.id = nextId++;
                    }
                }
            });
        }
        catch (err) {

        }
        // We should have the descriptors matched up with the queues.  Now sort them by name.
        this.sort((a, b) => { return a.name.localeCompare(b.name); })
    }
    public get queuePath(): string { return this._queuePath; }
    public getNextId(): number {
        let maxId = 0;
        this.forEach(q => { maxId = Math.max(q.id, maxId); })
        return maxId + 1;
    }
    public async saveQueue(queue: any): Promise<outboundQueue> {
        // First things first.  See if we have a queue with the id.
        let oldq;
        if (typeof queue.id !== 'undefined') {
            // This is an existing queue.  We are simply renaming it.
            oldq = this.find(q => { return queue.id === q.id });
            if (typeof oldq === 'undefined') return Promise.reject(new Error(`Queue does not exist. Could not find queue for id# ${queue.id}.`));
            if (typeof queue.name !== 'undefined') oldq.name = queue.name;
            if (typeof queue.description !== 'undefined') oldq.description = queue.description;
            if (typeof queue.fileName !== 'undefined' && queue.fileName !== oldq.fileName && fs.existsSync(this.queuePath + oldq.fileName)) {
                // We need to rename the file.
                try {
                    fs.renameSync(this.queuePath + oldq.fileName, this.queuePath + queue.fileName);
                    oldq.fileName = queue.fileName;
                }
                catch (err) { return Promise.reject(err); }
            }
        }
        else {
            // Make sure we don't have any naming conflicts.
            if (typeof queue.name === 'undefined') return Promise.reject(new Error(`Queues must have a valid name.`));
            oldq = this.find(q => { return queue.name === q.name });
            if (typeof oldq !== 'undefined') return Promise.reject(new Error(`Names must be unique. ${queue.name} aldready exists.`));
            let fname: string = queue.fileName || this.makeFileName(queue.name);
            oldq = this.find(q => { return queue.fileName === fname });
            if (typeof oldq !== 'undefined') return Promise.reject(new Error(`File names must be unique. The filename ${fname} is already used.`));
            oldq = new outboundQueue();
            oldq.name = queue.name;
            oldq.description = queue.description;
            oldq.filename = fname;
            oldq.id = this.getNextId();
            this.push(oldq);
        }
        this.update((err) => { if (err) return Promise.reject(err); });
        // If the messages have been provided then we need to update the file.
        if (typeof queue.messages !== 'undefined') {
            oldq.saveMessagesSync(queue.messages, (err) => { if (err) return Promise.reject(err); });
        }
        return Promise.resolve(oldq);
    }
    public update(cb: (err?) => {}) {
        try {
            fs.writeFileSync(this.queuePath + 'outQueues.json', JSON.stringify(this));
            if (typeof cb !== 'undefined') cb();
        }
        catch (err) {
            if (typeof cb !== 'undefined') cb(err);
        }
    }
    public findQueue(q: outboundQueue) {
        return this.find(queue => {
            if (typeof q.id !== 'undefined' && queue.id === q.id) return true;
            return false;
        });
    }
    public makeFileName(name: string) { return name.replace(/[&\/\\#,+$~%.'":*?<>{}]/g, '_') + '.out'; }
}
class outboundQueue {
    private _fileName: string;
    constructor() {
    }
    public id: number;
    public name: string;
    public description: string;
    public messages: any[];
    public get fileName(): string { return typeof this._fileName === 'undefined' ? this.name.replace(' ', '_') + '.out' : this.fileName; }
    public set fileName(val: string) { this._fileName = val; }
    public saveMessagesSync(msgs, cb): boolean {
        let fd;
        let eol = require('os').EOL;
        try {
            let file = outQueues.queuePath + this.fileName;
            if (fs.existsSync(file)) fs.unlinkSync(file);
            fd = fs.openSync(file, 'a');
            for (let i = 0; i < msgs.length; i++) {
                (i !== 0) ? fs.appendFileSync(fd, eol + JSON.stringify(msgs[i]), 'utf8') : fs.appendFileSync(fd, JSON.stringify(msgs[i]), 'utf8');
            }
            if(typeof cb !== 'undefined') cb();
        }
        catch (err) {
            logger.error(err);
            if (typeof cb !== 'undefined') cb(err); return false;
        }
        finally {
            if (typeof fd !== 'undefined') fs.closeSync(fd);
        }
        return true;
    }
    public loadMessages(cb?: (err?) => {}): any {
        let msgs = [];
        let eol = require('os').EOL;
        try {
            let file = outQueues.queuePath + this.fileName;
            let arr = fs.readFileSync(file).toString().split(eol);
            for (let i = 0; i < arr.length; i++) {
                let msg = JSON.parse(arr[i].trim());
                msgs.push(msg);
            }
            if (typeof (cb) !== 'undefined') cb();

        }
        catch (err) {
            if (typeof (cb) !== 'undefined') cb(err);
        }
        return msgs;
    }
}
export var outQueues: outboundQueueCollection = new outboundQueueCollection();