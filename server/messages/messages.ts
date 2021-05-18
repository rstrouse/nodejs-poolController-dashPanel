import * as path from 'path';
import * as fs from 'fs';
import * as extend from 'extend';
import { logger } from '../logger/Logger';
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
                let kb: any = { keyBytes: messages[key].keyBytes, shortName: msg.shortName };
                if (typeof msg.payloadKeys !== 'undefined') {
                    kb.payloadKeys = {};
                    for (let pkey in msg.payloadKeys) {
                        let pb = msg.payloadKeys[pkey];
                        if (typeof pb.shortName !== 'undefined') kb.payloadKeys[pkey] = { shortName: pb.shortName };
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
    constructor() { this.id = Message._messageId < 80000 ? ++Message._messageId : Message._messageId = 0; }

    // Internal Storage
    protected _complete: boolean = false;
    private _id: number = -1;
    // Fields
    public static _messageId: number = 0;
    public ts: string = '';
    public dir: string;
    public proto: string;
    public pkt = [[], [], [], [], []];
    public id: number;
    public get padding(): number[] { return this.pkt[0]; };
    public get preamble(): number[] { return this.pkt[1]; };
    public get header(): number[] { return this.pkt[2]; };
    public get payload(): number[] { return this.pkt[3]; };
    public get term(): number[] { return this.pkt[4] };
    public for = [];
    public isValid: boolean = true;
    // Properties
    public get sub(): number { return this.header.length > 1 ? this.header[1] : -1; }
    public get dest(): number {
        if (this.proto === 'chlorinator') {
            return this.header[2] >= 80 ? this.header[2] - 79 : 0;
        }
        if (this.header.length > 2) return this.header[2];
        else return -1;
    }
    public get source(): number {
        if (this.proto === 'chlorinator') {
            return this.header[2] >= 80 ? 0 : 1;
            // have to assume incoming packets with header[2] >= 80 (sent to a chlorinator)
            // are from controller (0);
            // likewise, if the destination is 0 (controller) we
            // have to assume it was sent from the 1st chlorinator (1)
            // until we learn otherwise.  
        }
        if (this.header.length > 3) return this.header[3];
        else return -1;
    }
    public get action(): number {
        if (this.proto === 'chlorinator') return this.header[3];
        if (this.header.length > 5) return this.header[4];
        else return -1;
    }

    public get datalen(): number { return this.proto === 'chlorinator' ? this.payload.length : this.header.length > 5 ? this.header[5] : -1; }
    public get chkHi(): number { return this.proto === 'chlorinator' ? 0 : this.term.length > 0 ? this.term[0] : -1; }
    public get chkLo(): number { return this.proto === 'chlorinator' ? this.term[0] : this.term[1]; }
    public get checksum(): number {
        var sum = 0;
        for (let i = 0; i < this.header.length; i++) sum += this.header[i];
        for (let i = 0; i < this.payload.length; i++) sum += this.payload[i];
        return sum;
    }
    public parseV5(msg) {
        this.dir = msg.direction === 'inbound' ? 'in' : 'out';
        this.ts = msg.timestamp;
        this.readPacket(msg.packet);
    }
    private testChlorHeader(bytes: number[], ndx: number): boolean { return (ndx + 1 < bytes.length && bytes[ndx] === 16 && bytes[ndx + 1] === 2); }
    private testBroadcastHeader(bytes: number[], ndx: number): boolean { return ndx < bytes.length - 3 && bytes[ndx] === 255 && bytes[ndx + 1] === 0 && bytes[ndx + 2] === 255 && bytes[ndx + 3] === 165; }
    private testUnidentifiedHeader(bytes: number[], ndx: number): boolean { return ndx < bytes.length - 3 && bytes[ndx] === 255 && bytes[ndx + 1] === 0 && bytes[ndx + 2] === 255 && bytes[ndx + 3] !== 165; }
    private testChlorTerm(bytes: number[], ndx: number): boolean { return ndx < bytes.length - 2 && bytes[ndx + 1] === 16 && bytes[ndx + 2] === 3; }
    private pushBytes(target: number[], bytes: number[], ndx: number, length: number): number {
        let end = ndx + length;
        while (ndx < bytes.length && ndx < end)
            target.push(bytes[ndx++]);
        return ndx;
    }
    // Methods
    private isValidChecksum(): boolean {
        if (this.proto === 'chlorinator') return this.checksum % 256 === this.chkLo;
        return (this.chkHi * 256) + this.chkLo === this.checksum;
    }

    public readPacket(bytes: number[]): number {
        var ndx = this.readHeader(bytes, 0);
        if (this.isValid && this.header.length > 0) ndx = this.readPayload(bytes, ndx);
        if (this.isValid && this.header.length > 0) ndx = this.readChecksum(bytes, ndx);
        return ndx;
    }
    public mergeBytes(bytes) {
        var ndx = 0;
        if (this.header.length === 0) ndx = this.readHeader(bytes, ndx);
        if (this.isValid && this.header.length > 0) ndx = this.readPayload(bytes, ndx);
        if (this.isValid && this.header.length > 0) ndx = this.readChecksum(bytes, ndx);
        return ndx;
    }
    public readHeader(bytes: number[], ndx: number): number {
        // start over to include the padding bytes.
        let ndxStart = ndx;
        while (ndx < bytes.length) {
            if (this.testChlorHeader(bytes, ndx)) {
                this.proto = 'chlorinator';
                break;
            }
            if (this.testBroadcastHeader(bytes, ndx)) {
                this.proto = 'broadcast';
                break;
            }
            else if (this.testUnidentifiedHeader(bytes, ndx)) {
                this.proto = 'unidentified';
                break;
            }
            this.padding.push(bytes[ndx++]);
        }
        let ndxHeader = ndx;
        switch (this.proto) {
            case 'pump':
            case 'intelliChem':
            case 'intelliValve':
            case 'broadcast':
            case 'heater':
            case 'unidentified':
                ndx = this.pushBytes(this.preamble, bytes, ndx, 3);
                ndx = this.pushBytes(this.header, bytes, ndx, 6);
                if (this.source >= 96 && this.source <= 111) this.proto = 'pump';
                else if (this.dest >= 96 && this.dest <= 111) this.proto = 'pump';
                else if (this.dest >= 144 && this.dest <= 158) this.proto = 'intelliChem';
                else if (this.source >= 144 && this.source <= 158) this.proto = 'intelliChem';
                else if (this.source == 12 || this.dest == 12) this.proto = 'intelliValve';
                else if (this.source >= 112 || this.source <= 127) this.proto = 'heater';
                else if (this.dest >= 112 || this.dest <= 127) this.proto = 'heater';
                if (this.datalen > 75) {
                    this.isValid = false;
                }
                break;
            case 'chlorinator':
                // RKS: 06-06-20 We occasionally get messages where the 16, 2 is interrupted.  The message below
                // has an IntelliValve broadcast embedded within as well as a chlorinator status request. So
                // in the instance below we have two messages being tossed because something on the bus interrupted
                // the chlorinator.  The first 240 byte does not belong to the chlorinator nor does it belong to
                // the IntelliValve
                //[][16, 2, 240][255, 0, 255, 165, 1, 16, 12, 82, 8, 0, 128, 216, 128, 57, 64, 25, 166, 4, 44, 16, 2, 80, 17, 0][115, 16, 3]
                //[][16, 2, 80, 17][0][115, 16, 3]
                ndx = this.pushBytes(this.header, bytes, ndx, 4);
                //if (this.header.length < 4) {
                //    // We actually don't have a complete header yet so just return.
                //    // we will pick it up next go around.
                //    logger.verbose(`We have an incoming chlorinator message but the serial port hasn't given a complete header. [${this.padding}][${this.preamble}][${this.header}]`);
                //    this.preamble = [];
                //    this.header = [];
                //    return ndxHeader;
                //}
                break;
            default:
                // We didn't get a message signature. don't do anything with it.
                //logger.verbose(`Message Signature could not be found in ${bytes}. Resetting.`);
                ndx = ndxStart;
                if (bytes.length > 24) {
                    // 255, 255, 255, 0, 255
                    ndx = bytes.length - 3;
                    let arr = bytes.slice(0, ndx);
                    // Remove all but the last 4 bytes.  This will result in nothing anyway.
                }
                //this.padding = [];
                break;
        }
        return ndx;
    }
    public readPayload(bytes: number[], ndx: number): number {
        //if (!this.isValid) return bytes.length;
        if (!this.isValid) return ndx;
        switch (this.proto) {
            case 'broadcast':
            case 'pump':
            case 'intelliChem':
            case 'intelliValve':
            case 'heater':
            case 'unidentified':
                if (this.datalen - this.payload.length <= 0) return ndx; // We don't need any more payload.
                ndx = this.pushBytes(this.payload, bytes, ndx, this.datalen - this.payload.length);
                break;
            case 'chlorinator':
                // We need to deal with chlorinator packets where the terminator is actually split meaning only the first byte or
                // two of the total payload is provided for the term.  We need at least 3 bytes to make this determination.
                while (ndx + 3 <= bytes.length && !this.testChlorTerm(bytes, ndx)) {
                    this.payload.push(bytes[ndx++]);
                    if (this.payload.length > 25) {
                        this.isValid = false; // We have a runaway packet.  Some collision occurred so lets preserve future packets.
                        logger.verbose(`Chlorinator message marked as invalid after not finding 16,3 in payload after ${this.payload.length} bytes`);
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
        switch (this.proto) {
            case 'broadcast':
            case 'pump':
            case 'intelliValve':
            case 'intelliChem':
            case 'heater':
            case 'unidentified':
                // If we don't have enough bytes to make the terminator then continue on and
                // hope we get them on the next go around.
                if (this.payload.length >= this.datalen && ndx + 2 <= bytes.length) {
                    this._complete = true;
                    ndx = this.pushBytes(this.term, bytes, ndx, 2);
                    this.isValid = this.isValidChecksum();
                }
                break;
            case 'chlorinator':
                if (ndx + 3 <= bytes.length && this.testChlorTerm(bytes, ndx)) {
                    this._complete = true;
                    ndx = this.pushBytes(this.term, bytes, ndx, 3);
                    this.isValid = this.isValidChecksum();
                }
                break;
        }
        return ndx;
    }
}