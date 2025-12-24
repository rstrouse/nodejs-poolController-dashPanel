// Lets create a good old fashioned js object using prototype methods.  This should get us a good
// Message mangler.
var msgManager = {
    constants: {},
    keyBytes: {},
    configCategoryMap: null,
    init: function () {
        this.loadConstants();
        this.loadKeyBytes();
        this.loadConfigCategoryMap();
        console.log('Messages loaded');
        console.log(this);
    },
    loadConstants: function (cb) {
        var self = this;
        $.getLocalService('/messages/docs/constants', undefined, function (data, status, xhr) {
            self.constants = data;
            if (typeof cb === 'function') cb(data);
        });
    },
    loadKeyBytes: function (cb) {
        var self = this;
        $.getLocalService('/messages/docs/keyBytes', undefined, function (data, status, xhr) {
            console.log(data);
            self.keyBytes = data;
            if (typeof cb === 'function') cb(data);
        });
    },
    loadConfigCategoryMap: function (cb) {
        var self = this;
        if (self.configCategoryMap && typeof self.configCategoryMap === 'object') {
            if (typeof cb === 'function') cb(self.configCategoryMap);
            return;
        }
        // This doc contains payload[0].values mapping config category byte -> label
        $.getLocalService('/messages/docs/165_P_BC_CP_222', undefined, function (docs, status, xhr) {
            try {
                let map = {};
                if (docs && Array.isArray(docs.payload) && docs.payload.length > 0) {
                    // Prefer "Config Category" entry, otherwise assume first payload descriptor
                    let cat = docs.payload.find(p => (p && (p.name === 'Config Category' || p.start === 0))) || docs.payload[0];
                    if (cat && typeof cat.values === 'object' && !Array.isArray(cat.values)) {
                        map = cat.values;
                    }
                }
                self.configCategoryMap = map;
                if (typeof cb === 'function') cb(map);
            } catch (err) {
                console.log(err);
                self.configCategoryMap = {};
                if (typeof cb === 'function') cb(self.configCategoryMap);
            }
        });
    },
    createKeyContext: function(msg) {
        var proto = this.constants.protocols.find(elem => elem.name === msg.protocol) || { name: 'undefined' };
        var key = proto.keyFormat || 'XXX_<controller>_<dest>_<source>_<action>';
        var source = msg.source || this.extractSourceByte(msg) || 0;
        var dest = msg.dest || this.extractDestByte(msg) || 0;
        var controller = msg.controller || this.extractControllerByte(msg) || 0;
        var action = msg.action || this.extractActionByte(msg) || 0;
        var addrSource = this.constants.addresses.find(elem => {
            if (elem.val === source) {
                if (elem.protocol.indexOf(`!${msg.protocol}`) >= 0) return false;
                else if (elem.protocol.indexOf(msg.protocol) >= 0) return true;
                else if (elem.protocol.indexOf(`any`) >= 0) return true;
            }
            return false;
        }) || { val: source || 0, key: source || 0, name: 'unk[' + source + ']' };
        var addrDest = this.constants.addresses.find(elem => {
            if (elem.val === dest) {
                if (elem.protocol.indexOf(`!${msg.protocol}`) >= 0) return false;
                else if (elem.protocol.indexOf(msg.protocol) >= 0) return true;
                else if (elem.protocol.indexOf(`any`) >= 0) return true;
            }
            return false;

        }) || { val: dest || 0, key: dest || 0, name: 'unk[' + dest + ']' };
        //var addrSource = { val: source, key: source };
        //var addrDest = { val: dest, key: dest };
        var length = msg.payloadLength;
        length = typeof length === 'undefined' && typeof msg.payload !== 'undefined' ? msg.payload.length : 0;
        return {
            keyFormat: key, protocol: proto, sourceByte: source, destByte: dest, controllerByte: controller,
            actionByte: action, sourceAddr: addrSource, destAddr: addrDest, payloadLength: length
        };
    },
    makeDocKey: function (msg, context) {
        context = context || this.createKeyContext(msg);
        var key = context.keyFormat;
        //key = key.replace(/\<controller\>/g, context.controllerByte);
        key = key.replace(/\<controller\>/g, 'P');
        key = key.replace(/\<source\>/g, context.sourceAddr.key);
        key = key.replace(/\<dest\>/g, context.destAddr.key);
        key = key.replace(/\<action\>/g, context.actionByte);
        key = key.replace(/\<length\>/g, context.payloadLength);
        var ms = key.match(/\<payload\[\d+\]\>/g);
        if (key.indexOf('payload') !== -1) {
            console.log(ms);
            console.log(key);
        }
        if (ms && typeof ms !== 'undefined') {
            console.log(ms);
            for (var i = 0; i < ms.length; i++) {
                var m = ms[i];
                var ndx = parseInt(m.match(/\d+/));
                console.log(`Making payload key ${m} ndx: ${ndx}`);
                if (!isNaN(ndx) && msg.payload.length > ndx) key = key.replace(new RegExp(`\<payload[${ndx}]\>`, 'g'), msg.payload[ndx]);
            }
        }
        return key;
    },
    makeMessageKey: function (msg, context) {
        context = context || this.createKeyContext(msg);
        var docKey = this.makeDocKey(msg, context);
        var msgKey = context.keyFormat;
        msgKey = msgKey.replace(/\<controller\>/g, context.controllerByte);
        msgKey = msgKey.replace(/\<source\>/g, context.sourceByte);
        msgKey = msgKey.replace(/\<dest\>/g, context.destByte);
        msgKey = msgKey.replace(/\<action\>/g, context.actionByte);
        msgKey = msgKey.replace(/\<length\>/g, context.payloadLength);
        var key = this.keyBytes[docKey];
        
        // Fallback: If specific key not found, try BC (Broadcast) version.
        // This handles v3.004+ IntelliCenter messages that are addressed to specific devices
        // (njsPC=33, WL=36, etc.) rather than broadcast (15). The packet format/payloadKeys
        // are identical - only the destination address differs between v1 (broadcast) and v3 (unicast).
        // See .plan/MESSAGE_KEY_FALLBACK.md for details.
        if (typeof key === 'undefined' && docKey.indexOf('_CP_CP_') !== -1) {
            var fallbackKey = docKey.replace('_CP_CP_', '_BC_CP_');
            key = this.keyBytes[fallbackKey];
        }
        
        if (typeof key !== 'undefined' && typeof key.minLength !== 'undefined') {
            if (context.payloadLength < key.minLength) {
                docKey += `_${context.payloadLength}`;
                key = this.keyBytes[docKey];
            }
        }
        var actionName = context.actionByte.toString();
        var actionExt = '';
        var payloadKey;
        var category = context.category;
        if (typeof key !== 'undefined') {
            actionName = key.shortName || actionName;
            if (typeof key.keyBytes !== 'undefined') {
                //console.log({ key: key, context: context });
                var pkey = '';
                for (var i = 0; i < key.keyBytes.length; i++) {
                    val = this.extractByte(msg.payload, key.keyBytes[i], 512);
                    if(i !== 0) pkey += '_';
                    pkey += val.toString();
                }
                msgKey += ':' + pkey;
                let xkey = typeof key.payloadKeys !== 'undefined' ? key.payloadKeys[pkey] : undefined;
                if (typeof xkey !== 'undefined') {
                    actionExt = xkey.shortName;
                    category = xkey.category;
                }
                else actionExt = pkey;
                payloadKey = pkey;
                //console.log({ context: context, key: key, actionExt:actionExt });
            }
            //if (typeof key.payloadKeys !== 'undefined')
            //    actionName = key.payloadKeys[pkey] || actionName;
        }
        return { messageKey: msgKey, docKey: docKey, actionName: actionName, actionExt: actionExt, payloadKey: payloadKey, category:category };
    },
    getListContext: function (msg) {
        let context = this.createKeyContext(msg);
        return $.extend(true, {}, context, this.makeMessageKey(msg, context));
    },
    isMessageDiff: function(msg1, msg2, context) {
        context = context || this.createKeyContext(msg1);
        var keyBytes = context.keyBytes !== 'undefined' ? context.keyBytes || [] : [];
        for (var i = 0; i < Math.max(msg1.payload.length, msg2.payload.length); i++) {
            if (keyBytes.includes(i)) continue;
            if (this.extractByte(msg1.payload, i, -1) !== this.extractByte(msg2.payload, i, -1)) return true;
        }
        return false;
    },
    isArrayDiff: function (arr1, arr2) {
        if (arr1.length !== arr2.length) return true;
        for (var i = 0; i < arr1.length; i++) { if(arr1[i] !== arr2[i]) return true; }
        return false;
    },
    toDocMessage: function (msg, sig, ctx) {
        ctx = ctx || this.getListContext(msg);
        var len = Math.max(msg.payload.length, sig.payloadLength || 0);
        var payload = [];
        
        // Get the payload definition - could be at top level or inside payloadKeys for subcategorized actions
        var sigPayload = sig.payload;
        var sigName = sig.name;
        var sigDesc = sig.desc;
        var sigShortName = sig.shortName;
        
        // For actions with subcategories (like Action 30), the payload is inside payloadKeys
        if (!sigPayload && sig.payloadKeys && ctx.payloadKey) {
            var subKey = sig.payloadKeys[ctx.payloadKey];
            if (subKey) {
                sigPayload = subKey.payload;
                sigName = subKey.name || sigName;
                sigDesc = subKey.desc || sigDesc;
                sigShortName = subKey.shortName || sigShortName;
            }
        }
        
        for (var i = 0; i < len; i++) {
            var pl = sigPayload ? sigPayload.find(elem => elem.start === i) : undefined;
            if (typeof pl !== 'undefined') {
                payload.push(pl);
                if (pl.length > 1) i += pl.length - 1;
            }
            else {
                payload.push({
                    start: i,
                    length: 1,
                    dataType: 'byte',
                    values: msg.payload[i]
                });
            }
        }
        return {
            protocol: msg.protocol,
            source: ctx.sourceByte,
            dest: ctx.destByte,
            action: ctx.actionByte,
            messageType: sig.messageType,
            docKey: ctx.docKey,
            payloadLength: len,
            shortName: sigShortName,
            name: sigName,
            desc: sigDesc,
            keyBytes: sig.keyBytes,
            payload: payload,
            minLength: sig.minLength
        };
    },
    extractActionByte: function (msg) {
        if (msg.protocol === 'chlorinator' || msg.protocol === 'aqualink') return this.extractByte(msg.header, 3);
        return this.extractByte(msg.header, 4);
    },
    extractSourceByte: function (msg) {
        if (msg.protocol === 'aqualink') {
            let val = this.extractByte(msg.header, 2);
            return 0;
        }
        else if (msg.protocol === 'hayward') {
            return this.extractByte(msg.header, 2);
        }
        else if (msg.protocol === 'screenlogic') return msg.dir === 'in' ? 16 : 34
        else if (msg.protocol !== 'chlorinator') return this.extractByte(msg.header, 3);
        else {
            var val = this.extractByte(msg.header, 2);
            return (val >= 80) ? 16 : val + 80;
        }
    },
    extractDestByte: function (msg) {
        if (msg.protocol === 'hayward') return this.extractByte(msg.header, 4);
        else if (msg.protocol === 'screenlogic') return msg.dir === 'in' ? 34 : 16;
        else if (msg.protocol !== 'chlorinator') return this.extractByte(msg.header, 2);
        var val = this.extractByte(msg.header, 2);
        return val >= 80 ? val : 16;
    },
    extractControllerByte: function (msg) { return msg.protocol === 'chlorinator' || msg.protocol === 'aqualink' ? 0 : msg.protocol === 'screenlogic' ? msg.controllerId : this.extractByte(msg.header, 1); },
    extractByte: function (arr, ndx, def) { return arr.length > ndx ? arr[ndx] : def; },
    toAscii: function (byte) { return (byte < 127 && byte > 31) ? String.fromCharCode(byte) : '.'; },
    toHex: function (byte, pad) {
        var hex = byte.toString(16);
        pad = typeof pad === 'undefined' || pad === null ? 2 : pad;
        while (hex.length < pad) hex = '0' + hex;
        return hex.toUpperCase();
    },
    sumArray: function (arr) {
        var sum = 0;
        for (var i = 0; i < arr.length; i++) sum += arr[i];
        return sum;
    },
    calcChecksum: function (msg) {
        if (msg.protocol !== 'chlorinator' && msg.protocol !== 'aqualink') {
            msg.header[5] = msg.payload.length;
            var checksum = this.sumArray(msg.header) + this.sumArray(msg.payload);
            msg.term = [Math.floor(checksum / 256), checksum - (Math.floor(checksum / 256) * 256)];
        }
    },
    copyToClipboard: msg => {
        var str = '[' + msg.preamble.join(', ') + '][' + msg.header.join(', ') + '][' + msg.payload.join(', ') + '][' + msg.term.join(', ') + ']';
        var el = document.createElement('textarea');  // Create a <textarea> element
        el.value = str;                                 // Set its value to the string that you want copied
        el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
        el.style.position = 'absolute';
        el.style.left = '-9999px';                      // Move outside the screen to make it invisible
        document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
        var selected =
            document.getSelection().rangeCount > 0        // Check if there is any content selected previously
                ? document.getSelection().getRangeAt(0)     // Store selection if found
                : false;                                    // Mark as false to know no selection existed before
        el.select();                                    // Select the <textarea> content
        document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
        document.body.removeChild(el);                  // Remove the <textarea> element
        if (selected) {                                 // If a selection existed before copying
            document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
            document.getSelection().addRange(selected);   // Restore the original selection
        }
    }


};
$(document).ready(function () { msgManager.init(); });
