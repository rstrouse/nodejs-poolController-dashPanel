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
