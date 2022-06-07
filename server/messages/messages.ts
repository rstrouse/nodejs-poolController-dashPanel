import * as path from 'path';
import * as fs from 'fs';
import * as extend from 'extend';
import { logger } from '../logger/Logger';

import { protocol } from 'socket.io-client';
export enum Direction {
    In = 'in',
    Out = 'out'
}
export enum Protocol {
    Unknown = 'unknown',
    Broadcast = 'broadcast',
    Pump = 'pump',
    Chlorinator = 'chlorinator',
    IntelliChem = 'intellichem',
    IntelliValve = 'intellivalve',
    Heater = 'heater',
    AquaLink = 'aqualink',
    Hayward = 'hayward',
    Unidentified = 'unidentified'
}
export class Timestamp {
    private _dt: Date;
    constructor(dt?: Date | string) {
        if (typeof dt === 'string') this._dt = new Date(dt);
        else this._dt = dt || new Date();
    }
    private _isUpdating: boolean = false;
    public static get now(): Timestamp { return new Timestamp(); }
    public toDate() { return this._dt; }
    public set isUpdating(val: boolean) { this._isUpdating = val; }
    public get isUpdating(): boolean { return this._isUpdating; }
    public get hours(): number { return this._dt.getHours(); }
    public set hours(val: number) {
        if (this.hours !== val) {
            this._dt.setHours(val);
        }
    }
    public get minutes(): number { return this._dt.getMinutes(); }
    public set minutes(val: number) {
        if (this.minutes !== val) {
            this._dt.setMinutes(val);
        }
    }
    public get seconds(): number { return this._dt.getSeconds(); }
    public set seconds(val: number) {
        if (this.seconds !== val) {
            this._dt.setSeconds(val);
            // No need to emit this change as Intellicenter only
            // reports to the minute.
            //this.emitter.emit('change');
        }
    }
    public get milliseconds(): number { return this._dt.getMilliseconds(); }
    public set milliseconds(val: number) { this._dt.setMilliseconds(val); }
    public get fullYear(): number { return this._dt.getFullYear(); }
    public set fullYear(val: number) { this._dt.setFullYear(val); }
    public get year(): number { return this._dt.getFullYear(); }
    public set year(val: number) {
        let y = val < 100 ? (Math.floor(this._dt.getFullYear() / 100) * 100) + val : val;
        if (y !== this.year) {
            this._dt.setFullYear(y);
        }
    }
    public get month(): number { return this._dt.getMonth() + 1; }
    public set month(val: number) {
        if (this.month !== val) {
            this._dt.setMonth(val - 1);
        }
    }
    public get date(): number { return this._dt.getDate(); }
    public set date(val: number) {
        if (this.date !== val) {
            this._dt.setDate(val);
        }
    }
    public getDay(): number { return this._dt.getDay(); }
    public getTime() { return this._dt.getTime(); }
    public format(): string { return Timestamp.toISOLocal(this._dt); }
    public static toISOLocal(dt): string {
        let tzo = dt.getTimezoneOffset();
        var pad = function (n) {
            var t = Math.floor(Math.abs(n));
            return (t < 10 ? '0' : '') + t;
        };
        return new Date(dt.getTime() - (tzo * 60000)).toISOString().slice(0, -1) + (tzo > 0 ? '-' : '+') + pad(tzo / 60) + pad(tzo % 60)
    }
    public calcTZOffset(): { tzOffset: number, adjustDST: boolean } {
        let obj = { tzOffset: 0, adjustDST: false };
        let dateJan = new Date(this._dt.getFullYear(), 0, 1, 2);
        let dateJul = new Date(this._dt.getFullYear(), 6, 1, 2);
        obj.tzOffset = dateJan.getTimezoneOffset() / 60 * -1;
        obj.adjustDST = dateJan.getTimezoneOffset() - dateJul.getTimezoneOffset() > 0;
        return obj;
    }
    public addHours(hours: number, minutes: number = 0, seconds: number = 0, milliseconds: number = 0) {
        let interval = hours * 3600000;
        interval += minutes * 60000;
        interval += seconds * 1000;
        interval += milliseconds;
        this._dt.setMilliseconds(this._dt.getMilliseconds() + interval);
        return this;
    }
    public addMinutes(minutes: number, seconds?: number, milliseconds?: number): Timestamp { return this.addHours(0, minutes, seconds, this.milliseconds); }
    public addSeconds(seconds: number, milliseconds: number = 0): Timestamp { return this.addHours(0, 0, seconds, milliseconds); }
    public addMilliseconds(milliseconds: number): Timestamp { return this.addHours(0, 0, 0, milliseconds); }
    public static today() {
        let dt = new Date();
        dt.setHours(0, 0, 0, 0);
        return new Timestamp(dt);
    }
    public startOfDay() {
        // This makes the returned timestamp immutable.
        let dt = new Date(this._dt.getTime());
        dt.setHours(0, 0, 0, 0);
        return new Timestamp(dt);
    }
    public clone() { return new Timestamp(new Date(this._dt)); }
    public static locale() { return Intl.DateTimeFormat().resolvedOptions().locale; }
}
export class MessageDocs {
    public static docPath: string = path.posix.join(process.cwd(), 'server/messages/docs/');
    public static getConstants() {
        // Don't overwrite the configuration if we failed during the initialization.
        let consts = {};
        let data = fs.readFileSync(MessageDocs.docPath + 'constants.json', 'utf8').trim();
        consts = JSON.parse(data);
        return consts;
    }
    public static loadMessages() {
        let messages = {};
        let data = fs.readFileSync(MessageDocs.docPath + 'messageDoc.json', 'utf8').trim();
        messages = JSON.parse(data);
        return messages;
    }
    public static findMessageByKey(key:string) {
        let messages = MessageDocs.loadMessages();
        return messages[key];
    }
    public static getKeyBytes() {
        let messages = MessageDocs.loadMessages();
        let keys = {};
        for (let key in messages) {
            let msg = messages[key];
            //console.log(`key:${key} bytes:${messages[key].keyBytes}`);
            if (typeof msg.keyBytes !== 'undefined') {
                let kb: any = { keyBytes: messages[key].keyBytes, shortName: msg.shortName, hasCategories: msg.hasCategories, category: msg.category, minLength: msg.minLength };
                if (typeof msg.payloadKeys !== 'undefined') {
                    kb.payloadKeys = {};
                    for (let pkey in msg.payloadKeys) {
                        let pb = msg.payloadKeys[pkey];
                        if (typeof pb !== 'undefined') kb.payloadKeys[pkey] = { shortName: pb.shortName, category: pb.category };
                    }
                }
                keys[key] = kb;
            }
            else {
                keys[key] = { shortName: msg.shortName };
            }
        }
        return keys;
    }
}
export class Message {
    constructor() { }
    public collisions: number = 0;

    // Internal Storage
    protected _complete: boolean = false;
    private _id: number = -1;
    // Fields
    public static _messageId: number = 0;
    public static get nextMessageId(): number { return this._messageId < 80000 ? ++this._messageId : this._messageId = 0; }
    public responseFor: number[] = [];
    public port: number = 0;
    public timestamp: Date = new Date();
    public direction: Direction = Direction.In;
    public protocol: Protocol = Protocol.Unknown;
    public padding: number[] = [];
    public preamble: number[] = [];
    public header: number[] = [];
    public payload: number[] = [];
    public term: number[] = [];
    public packetCount: number = 0;
    public get id(): number { return this._id; }
    public set id(val: number) { this._id = val; }
    public isValid: boolean = true;
    public scope: string;
    // Properties
    public get isComplete(): boolean { return this._complete; }
    public get sub(): number { return this.header.length > 1 ? this.header[1] : -1; }
    public get dest(): number {
        if (this.header.length > 2) {
            if (this.protocol === Protocol.Chlorinator || this.protocol === Protocol.AquaLink) {
                return this.header.length > 2 ? (this.header[2] >= 80 ? this.header[2] - 79 : 0) : -1;
            }
            else if (this.protocol === Protocol.Hayward) {
                //            src   act   dest             
                //0x10, 0x02, 0x00, 0x0C, 0x00, 0x00, 0x2D, 0x02, 0x36, 0x00, 0x83, 0x10, 0x03 -- Response from pump
                return this.header.length > 4 ? this.header[2] : -1;
            }
            else return this.header.length > 2 ? this.header[2] : -1;
        }
        else return -1;
    }
    public get source(): number {
        if (this.protocol === Protocol.Chlorinator) {
            return this.header.length > 2 ? (this.header[2] >= 80 ? 0 : 1) : -1;
            // have to assume incoming packets with header[2] >= 80 (sent to a chlorinator)
            // are from controller (0);
            // likewise, if the destination is 0 (controller) we
            // have to assume it was sent from the 1st chlorinator (1)
            // until we learn otherwise.  
        }
        else if (this.protocol === Protocol.AquaLink) {
            // Once we decode the devices we will be able to tell where it came from based upon the commands.
            return 0;
        }
        else if (this.protocol === Protocol.Hayward) {
            //            src   act   dest             
            //0x10, 0x02, 0x00, 0x0C, 0x00, 0x00, 0x2D, 0x02, 0x36, 0x00, 0x83, 0x10, 0x03 -- Response from pump
            //0x10, 0x02, 0x0C, 0x01, 0x02, 0x2D, 0x00, 0x4E, 0x10, 0x03 -- Command to AUX2 Pump
            return this.header.length > 4 ? this.header[4] : -1;
        }
        if (this.header.length > 3) return this.header[3];
        else return -1;
    }
    public get action(): number {
        // The action byte is actually the 4th byte in the header the destination address is the 5th byte.
        if (this.protocol === Protocol.Chlorinator ||
            this.protocol === Protocol.AquaLink) return this.header.length > 3 ? this.header[3] : -1;
        else if (this.protocol === Protocol.Hayward) {
            //            src   act   dest             
            //0x10, 0x02, 0x00, 0x0C, 0x00, 0x00, 0x2D, 0x02, 0x36, 0x00, 0x83, 0x10, 0x03 -- Response from pump
            //0x10, 0x02, 0x0C, 0x01, 0x02, 0x2D, 0x00, 0x4E, 0x10, 0x03 -- Command to AUX2 Pump
            return this.header.length > 3 ? this.header[3] || this.header[2] : -1;
        }
        if (this.header.length > 4) return this.header[4];
        else return -1;
    }
    public get datalen(): number { return this.protocol === Protocol.Chlorinator || this.protocol === Protocol.AquaLink || this.protocol === Protocol.Hayward ? this.payload.length : this.header.length > 5 ? this.header[5] : -1; }
    public get chkHi(): number { return this.protocol === Protocol.Chlorinator || this.protocol === Protocol.AquaLink ? 0 : this.term.length > 0 ? this.term[0] : -1; }
    public get chkLo(): number { return this.protocol === Protocol.Chlorinator || this.protocol === Protocol.AquaLink ? this.term[0] : this.term[1]; }
    public get checksum(): number {
        var sum = 0;
        for (let i = 0; i < this.header.length; i++) sum += this.header[i];
        for (let i = 0; i < this.payload.length; i++) sum += this.payload[i];
        return sum;
    }

    // Methods
    public toPacket(): number[] {
        const pkt = [];
        pkt.push(...this.padding);
        pkt.push(...this.preamble);
        pkt.push(...this.header);
        pkt.push(...this.payload);
        pkt.push(...this.term);
        return pkt;
    }
    public toShortPacket(): number[] {
        const pkt = [];
        pkt.push(...this.header);
        pkt.push(...this.payload);
        pkt.push(...this.term);
        return pkt;
    }
    public toLog() {
        if (this.responseFor.length > 0)
            return `{"id":${this.id},"valid":${this.isValid},"dir":"${this.direction}","proto":"${this.protocol}","for":${JSON.stringify(this.responseFor)},"pkt":[${JSON.stringify(this.padding)},${JSON.stringify(this.preamble)},${JSON.stringify(this.header)},${JSON.stringify(this.payload)},${JSON.stringify(this.term)}],"ts": "${Timestamp.toISOLocal(this.timestamp)}"}`;
        return `{"id":${this.id},"valid":${this.isValid},"dir":"${this.direction}","proto":"${this.protocol}","pkt":[${JSON.stringify(this.padding)},${JSON.stringify(this.preamble)},${JSON.stringify(this.header)},${JSON.stringify(this.payload)},${JSON.stringify(this.term)}],"ts": "${Timestamp.toISOLocal(this.timestamp)}"}`;
    }
    public toLogObject() {
        return {
            id: this.id,
            valid: this.isValid,
            dir: this.direction.toString().toLowerCase(),
            proto: this.protocol.toString().toLowerCase(),
            for: this.responseFor.length > 0 ? JSON.stringify(this.responseFor) : undefined,
            pkt: [this.padding, this.preamble, this.header, this.payload, this.term],
            ts: Timestamp.toISOLocal(this.timestamp)
        };
    }
    public parseV5(msg) {
        this.direction = msg.direction === 'inbound' ? Direction.In : Direction.Out;
        this.timestamp = msg.timestamp;
        this.readPacket(msg.packet);
    }
    private testChlorHeader(bytes: number[], ndx: number): boolean {
        // if packets have 16,2 (eg status=16,2,29) in them and they come as partial packets, they would have
        // prev been detected as chlor packets;
        // valid chlor packets should have 16,2,0 or 16,2,[80-96];
        // this should reduce the number of false chlor packets
        // For any of these 16,2 type headers we need at least 5 bytes to determine the routing.
        //63,15,16,2,29,9,36,0,0,0,0,0,16,0,32,0,0,2,0,75,75,32,241,80,85,24,241,16,16,48,245,69,45,100,186,16,2,80,17,0,115,16,3
        if (bytes.length > ndx + 4) {
            if (bytes[ndx] === 16 && bytes[ndx + 1] === 2) {
                let dst = bytes[ndx + 2];
                let act = bytes[ndx + 3];
                // For now the dst byte will always be 0 or 80.
                if (![0, 16, 80, 81, 82, 83].includes(dst)) {
                    //logger.info(`Sensed chlorinator header but the dst byte is ${dst}`);
                    return false;
                }
                else if (dst === 0 && [1, 18, 3].includes(act))
                    return true;
                else if (![0, 17, 19, 20, 21, 22].includes(act)) {
                    //logger.info(`Sensed out chlorinator header but the dst byte is ${dst} ${act} ${JSON.stringify(bytes)}`);
                    return false;
                }
                return true;
            }
        }
        return false;
    }
    private testAquaLinkHeader(bytes: number[], ndx: number): boolean {
        if (bytes.length > ndx + 4) {
            if (bytes[ndx] === 16 && bytes[ndx + 1] === 2) {
                return true;
            }
        }
        return false;
    }
    private testHaywardHeader(bytes: number[], ndx: number): boolean {
        //0x10, 0x02, 0x0C, 0x01, 0x00, 0x2D, 0x00, 0x4C, 0x10, 0x03 -- Command to pump
        //[16,2,12,1,0]
        //0x10, 0x02, 0x0C, 0x01, 0x00, 0x2D, 0x00, 0x4C, 0x10, 0x03 -- Command to Filter Pump
        //[16,2,12,1,0]
        //0x10, 0x02, 0x0C, 0x01, 0x02, 0x2D, 0x00, 0x4E, 0x10, 0x03 -- Command to AUX2 Pump
        //[16,2,12,1,2]
        //            src   act   dest             
        //0x10, 0x02, 0x00, 0x0C, 0x00, 0x00, 0x2D, 0x02, 0x36, 0x00, 0x83, 0x10, 0x03 -- Response from pump
        //[16,2,0,12,0] --> Response
        //[16,2,0,12,0]
        if (bytes.length > ndx + 4) {
            if (bytes[ndx] === 16 && bytes[ndx + 1] === 2) {
                let dst = bytes[ndx + 3];
                let src = bytes[ndx + 2];
                if (dst === 12 || src === 12) return true;
            }
        }
        return false;
    }
    private testBroadcastHeader(bytes: number[], ndx: number): boolean {
        // We are looking for [255,0,255,165]
        if (bytes.length > ndx + 3) {
            if (bytes[ndx] === 255 && bytes[ndx + 1] === 0 && bytes[ndx + 2] === 255 && bytes[ndx + 3] === 165) return true;
            return false;
        }
        //return ndx < bytes.length - 3 && bytes[ndx] === 255 && bytes[ndx + 1] === 0 && bytes[ndx + 2] === 255 && bytes[ndx + 3] === 165;
        return false;
    }
    private testUnidentifiedHeader(bytes: number[], ndx: number): boolean {
        if (bytes.length > ndx + 3) {
            if (bytes[ndx] === 255 && bytes[ndx + 1] === 0 && bytes[ndx + 2] === 255 && bytes[ndx + 3] !== 165) return true;
            return false;
        }
        //return ndx < bytes.length - 3 && bytes[ndx] === 255 && bytes[ndx + 1] === 0 && bytes[ndx + 2] === 255 && bytes[ndx + 3] !== 165;
        return false;
    }
    private testChlorTerm(bytes: number[], ndx: number): boolean { return ndx + 2 < bytes.length && bytes[ndx + 1] === 16 && bytes[ndx + 2] === 3; }
    private testAquaLinkTerm(bytes: number[], ndx: number): boolean { return ndx + 2 < bytes.length && bytes[ndx + 1] === 16 && bytes[ndx + 2] === 3; }
    private testHaywardTerm(bytes: number[], ndx: number): boolean { return ndx + 3 < bytes.length && bytes[ndx + 2] === 16 && bytes[ndx + 3] === 3; }
    private pushBytes(target: number[], bytes: number[], ndx: number, length: number): number {
        let end = ndx + length;
        while (ndx < bytes.length && ndx < end)
            target.push(bytes[ndx++]);
        return ndx;
    }
    // Methods
    public rewind(bytes: number[], ndx: number): number {
        let buff = [];
        //buff.push(...this.padding);
        //buff.push(...this.preamble);
        buff.push(...this.header);
        buff.push(...this.payload);
        buff.push(...this.term);
        // Add in the remaining bytes.
        if (ndx < bytes.length - 1) buff.push(...bytes.slice(ndx, bytes.length - 1));
        this.padding.push(...this.preamble);
        this.preamble.length = 0;
        this.header.length = 0;
        this.payload.length = 0;
        this.term.length = 0;
        buff.shift();
        this.protocol = Protocol.Unknown;
        this._complete = false;
        this.isValid = true;

        this.collisions++;
        logger.info(`rewinding message collision ${this.collisions} ${ndx} ${bytes.length} ${JSON.stringify(buff)}`);
        this.readPacket(buff);
        return ndx;
        //return this.padding.length + this.preamble.length;
    }
    public readPacket(bytes: number[]): number {
        var ndx = this.readHeader(bytes, 0);
        if (this.isValid && this.header.length > 0) ndx = this.readPayload(bytes, ndx);
        if (this.isValid && this.header.length > 0) ndx = this.readChecksum(bytes, ndx);
        //if (this.isComplete && !this.isValid) return this.rewind(bytes, ndx);
        return ndx;
    }
    public mergeBytes(bytes) {
        var ndx = 0;
        if (this.header.length === 0) ndx = this.readHeader(bytes, ndx);
        if (this.isValid && this.header.length > 0) ndx = this.readPayload(bytes, ndx);
        if (this.isValid && this.header.length > 0) ndx = this.readChecksum(bytes, ndx);
        //if (this.isComplete && !this.isValid) return this.rewind(bytes, ndx);
        return ndx;
    }
    public readHeader(bytes: number[], ndx: number): number {
        // start over to include the padding bytes.
        //if (this.protocol !== Protocol.Unknown) {
        //    logger.warn(`${this.protocol} resulted in an empty message header ${JSON.stringify(this.header)}`);
        //}
        let ndxStart = ndx;
        // RKS: 05-30-22 -- OMG we have not been dealing with short headers.  As a result it was restarting
        // the header process even after it had identified it.
        if (this.protocol === Protocol.Unknown) {
            while (ndx < bytes.length) {
                if (this.testBroadcastHeader(bytes, ndx)) {
                    this.protocol = Protocol.Broadcast;
                    break;
                }
                if (this.testUnidentifiedHeader(bytes, ndx)) {
                    this.protocol = Protocol.Unidentified;
                    break;
                }
                if (this.testChlorHeader(bytes, ndx)) {
                    this.protocol = Protocol.Chlorinator;
                    break;
                }
                if (this.testAquaLinkHeader(bytes, ndx)) {
                    this.protocol = Protocol.AquaLink;
                    break;
                }
                if (this.testHaywardHeader(bytes, ndx)) {
                    this.protocol = Protocol.Hayward;
                    break;
                }
                this.padding.push(bytes[ndx++]);
            }
        }
        // When the code above finds a protocol, ndx will be at the start of that
        // header.  If it is not identified then it will rewind to the initial
        // start position until we get more bytes.  This is the default case below.
        let ndxHeader = ndx;
        switch (this.protocol) {
            case Protocol.Pump:
            case Protocol.IntelliChem:
            case Protocol.IntelliValve:
            case Protocol.Broadcast:
            case Protocol.Heater:
            case Protocol.Unidentified:
                ndx = this.pushBytes(this.preamble, bytes, ndx, 3);
                ndx = this.pushBytes(this.header, bytes, ndx, 6);
                if (this.header.length < 6) {
                    // We actually don't have a complete header yet so just return.
                    // we will pick it up next go around.
                    // logger.debug(`We have an incoming message but the serial port hasn't given a complete header. [${this.padding}][${this.preamble}][${this.header}]`);
                    //logger.info(`We don't have a complete header ${JSON.stringify(this.header)}`);
                    this.preamble = [];
                    this.header = [];
                    return ndxHeader;
                }
                if (this.source >= 96 && this.source <= 111) this.protocol = Protocol.Pump;
                else if (this.dest >= 96 && this.dest <= 111) this.protocol = Protocol.Pump;
                else if (this.source >= 112 && this.source <= 127) this.protocol = Protocol.Heater;
                else if (this.dest >= 112 && this.dest <= 127) this.protocol = Protocol.Heater;
                else if (this.dest >= 144 && this.dest <= 158) this.protocol = Protocol.IntelliChem;
                else if (this.source >= 144 && this.source <= 158) this.protocol = Protocol.IntelliChem;
                else if (this.source == 12 || this.dest == 12) this.protocol = Protocol.IntelliValve;
                if (this.datalen > 75) {
                    //this.isValid = false;
                    logger.debug(`Broadcast length ${this.datalen} exceeded 75 bytes for ${this.protocol} message. Message rewound ${this.header}`);
                    this.padding.push(...this.preamble);
                    this.padding.push(...this.header.slice(0, 1));
                    this.preamble = [];
                    this.header = [];
                    this.collisions++;
                    return ndxHeader + 1;
                }
                break;
            case Protocol.Chlorinator:
                // RKS: 06-06-20 We occasionally get messages where the 16, 2 is interrupted.  The message below
                // has an IntelliValve broadcast embedded within as well as a chlorinator status request. So
                // in the instance below we have two messages being tossed because something on the bus interrupted
                // the chlorinator.  The first 240 byte does not belong to the chlorinator nor does it belong to
                // the IntelliValve
                //[][16, 2, 240][255, 0, 255, 165, 1, 16, 12, 82, 8, 0, 128, 216, 128, 57, 64, 25, 166, 4, 44, 16, 2, 80, 17, 0][115, 16, 3]
                //[][16, 2, 80, 17][0][115, 16, 3]
                ndx = this.pushBytes(this.header, bytes, ndx, 4);
                if (this.header.length < 4) {
                    // We actually don't have a complete header yet so just return.
                    // we will pick it up next go around.
                    logger.debug(`We have an incoming chlorinator message but the serial port hasn't given a complete header. [${this.padding}][${this.preamble}][${this.header}]`);
                    this.preamble = [];
                    this.header = [];
                    return ndxHeader;
                }
                break;
            case Protocol.Hayward:
                ndx = this.pushBytes(this.header, bytes, ndx, 5);
                if (this.header.length < 4) {
                    // We actually don't have a complete header yet so just return.
                    // we will pick it up next go around.
                    logger.debug(`We have an incoming Hayward message but the serial port hasn't given a complete header. [${this.padding}][${this.preamble}][${this.header}]`);
                    this.preamble = [];
                    this.header = [];
                    return ndxHeader;
                }
                break;
            case Protocol.AquaLink:
                ndx = this.pushBytes(this.header, bytes, ndx, 5);
                if (this.header.length < 5) {
                    // We actually don't have a complete header yet so just return.
                    // we will pick it up next go around.
                    logger.debug(`We have an incoming AquaLink message but the serial port hasn't given a complete header. [${this.padding}][${this.preamble}][${this.header}]`);
                    this.preamble = [];
                    this.header = [];
                    return ndxHeader;
                }
                break;
            default:
                // We didn't get a message signature. don't do anything with it.
                ndx = ndxStart;
                if (bytes.length > 24) {
                    // The length of the incoming bytes have exceeded 24 bytes.  This is very likely
                    // flat out garbage on the serial port.  Strip off all but the last 5 preamble + signature bytes and move on.  Heck we aren't even
                    // going to keep them.
                    // 255, 255, 255, 0, 255
                    ndx = bytes.length - 5;
                    let arr = bytes.slice(0, ndx);
                    // Remove all but the last 4 bytes.  This will result in nothing anyway.
                    logger.verbose(`Tossed Inbound Bytes ${arr} due to an unrecoverable collision.`);
                }
                this.padding = [];
                break;
        }
        return ndx;
    }
    public readPayload(bytes: number[], ndx: number): number {
        //if (!this.isValid) return bytes.length;
        if (!this.isValid) return ndx;
        switch (this.protocol) {
            case Protocol.Broadcast:
            case Protocol.Pump:
            case Protocol.IntelliChem:
            case Protocol.IntelliValve:
            case Protocol.Heater:
            case Protocol.Unidentified:
                if (this.datalen - this.payload.length <= 0) {
                    let buff = bytes.slice(ndx - 1);
                    //logger.info(`We don't need any more payload ${this.datalen - this.payload.length} ${ndx} ${JSON.stringify(buff)};`);
                    return ndx; // We don't need any more payload.
                }
                ndx = this.pushBytes(this.payload, bytes, ndx, this.datalen - this.payload.length);
                break;
            case Protocol.Chlorinator:
                // We need to deal with chlorinator packets where the terminator is actually split meaning only the first byte or
                // two of the total payload is provided for the term.  We need at least 3 bytes to make this determination.
                while (ndx + 3 <= bytes.length && !this.testChlorTerm(bytes, ndx)) {
                    this.payload.push(bytes[ndx++]);
                    if (this.payload.length > 25) {
                        this.isValid = false; // We have a runaway packet.  Some collision occurred so lets preserve future packets.
                        logger.debug(`Chlorinator message marked as invalid after not finding 16,3 in payload after ${this.payload.length} bytes`);
                        break;
                    }
                }
                break;
            case Protocol.AquaLink:
                // We need to deal with AquaLink packets where the terminator is actually split meaning only the first byte or
                // two of the total payload is provided for the term.  We need at least 3 bytes to make this determination.
                while (ndx + 3 <= bytes.length && !this.testAquaLinkTerm(bytes, ndx)) {
                    this.payload.push(bytes[ndx++]);
                    if (this.payload.length > 25) {
                        this.isValid = false; // We have a runaway packet.  Some collision occurred so lets preserve future packets.
                        logger.debug(`AquaLink message marked as invalid after not finding 16,3 in payload after ${this.payload.length} bytes`);
                        break;
                    }
                }
                break;
            case Protocol.Hayward:
                // We need to deal with AquaLink packets where the terminator is actually split meaning only the first byte or
                // two of the total payload is provided for the term.  We need at least 3 bytes to make this determination.
                while (ndx + 4 <= bytes.length && !this.testHaywardTerm(bytes, ndx)) {
                    this.payload.push(bytes[ndx++]);
                    if (this.payload.length > 25) {
                        this.isValid = false; // We have a runaway packet.  Some collision occurred so lets preserve future packets.
                        logger.debug(`Hayward message marked as invalid after not finding 16,3 in payload after ${this.payload.length} bytes`);
                        break;
                    }
                }
                break;

        }
        return ndx;
    }
    public readChecksum(bytes: number[], ndx: number): number {
        if (!this.isValid) return bytes.length;
        if (ndx >= bytes.length) return ndx;
        switch (this.protocol) {
            case Protocol.Broadcast:
            case Protocol.Pump:
            case Protocol.IntelliValve:
            case Protocol.IntelliChem:
            case Protocol.Heater:
            case Protocol.Unidentified:
                // If we don't have enough bytes to make the terminator then continue on and
                // hope we get them on the next go around.
                if (this.payload.length >= this.datalen && ndx + 2 <= bytes.length) {
                    this._complete = true;
                    ndx = this.pushBytes(this.term, bytes, ndx, 2);
                    this.isValid = this.isValidChecksum();
                }
                break;
            case Protocol.Chlorinator:
                if (ndx + 3 <= bytes.length && this.testChlorTerm(bytes, ndx)) {
                    this._complete = true;
                    ndx = this.pushBytes(this.term, bytes, ndx, 3);
                    this.isValid = this.isValidChecksum();
                }
                break;
            case Protocol.AquaLink:
                if (ndx + 3 <= bytes.length && this.testAquaLinkTerm(bytes, ndx)) {
                    this._complete = true;
                    ndx = this.pushBytes(this.term, bytes, ndx, 3);
                    this.isValid = this.isValidChecksum();
                }
                break;
            case Protocol.Hayward:
                if (ndx + 4 <= bytes.length && this.testHaywardTerm(bytes, ndx)) {
                    this._complete = true;
                    ndx = this.pushBytes(this.term, bytes, ndx, 4);
                    this.isValid = this.isValidChecksum();
                }
                break;

        }
        return ndx;
    }
    private isValidChecksum(): boolean {
        if (this.protocol === Protocol.Chlorinator || this.protocol === Protocol.AquaLink) return this.checksum % 256 === this.chkLo;
        return (this.chkHi * 256) + this.chkLo === this.checksum;
    }
}
export class Inbound extends Message {
    // /usr/bin/socat TCP-LISTEN:9801,fork,reuseaddr FILE:/dev/ttyUSB0,b9600,raw
    // /usr/bin/socat TCP-LISTEN:9801,fork,reuseaddr FILE:/dev/ttyUSB0,b9600,cs8,cstopb=1,parenb=0,raw
    // /usr/bin / socat TCP - LISTEN: 9801,fork,reuseaddr FILE:/dev/ttyUSB0, b9600, cs8, cstopb = 1, parenb = 0, raw
    constructor() {
        super();
        this.direction = Direction.In;
    }
    // Factory
    public responseFor: number[] = [];
    public isProcessed: boolean = false;
  
}