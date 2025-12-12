(function () {
    // Shared helpers for Message Manager list-related widgets.
    // Extracted from `scripts/messages/messageList.js`.

    // NOTE: These are intentionally globals (var) because the project uses plain script tags
    // without a bundler/module system.

    var valveMessages = {
        cancelled: false,
        msg: { "direction": "out", "protocol": "intellivalve", "padding": [], "preamble": [255, 0, 255], "header": [165, 1, 12, 16, 81, 8], "payload": [0, 128, 216, 128, 57, 64, 25, 166], "term": [4, 44], "key": "165_1_16_12_82_8", "delay": 1000 },
        processNextMessage: function () {
            var self = this;
            self.msg.payload[0]++;
            if (self.cancelled) return;
            if (self.msg.payload[0] <= 256) {
                var mm = $('div.picMessageManager')[0];
                setTimeout(function () {
                    mm.sendOutboundMessage(self.msg);
                    self.processNextMessage();
                }, (self.msg.delay || 0));
            }
        },
        receiveMessages: function (msg, prev) {

        }
    };

    var mhelper = {
        extractByte: function (arr, ndx, def) { return arr.length > ndx ? arr[ndx] : def; },
        mapAddress: function (byte) {
            if (byte >= 144 && byte <= 158) return 'Chem[' + (byte - 143) + ']';
            else if (byte >= 95 && byte <= 110) return 'Pump[' + (byte - 95) + ']';
            switch (byte) {
                case 12: return 'Valve';
                case 15: return 'Broadcast';
                case 16: return 'Panel';
            }
            return 'Unk[' + byte + ']';

        },
        mapSourceByte: function (msg) { return msg.protocol === 'chlorinator' ? '' : this.extractByte(msg.header, 3); },
        mapDestByte: function (msg) { return this.extractByte(msg.header, 2); },
        mapActionByte: function (msg) { return msg.protocol === 'chlorinator' ? this.extractByte(msg.header, 3) : this.extractByte(msg.header, 4); },
        mapSource: function (msg) { return msg.protocol === 'chlorinator' ? 'chlor' : this.mapAddress(this.extractByte(msg.header, 3)); },
        mapDest: function (msg) { return msg.protocol === 'chlorinator' ? 'chlor' : this.mapAddress(this.extractByte(msg.header, 2)); },
        mapChlorinatorAction: function (msg) {
            switch (this.extractByte(msg.header, 3)) {
                case 0:
                    return 'Get[status]';
                case 1:
                    return 'Set[status]';
                case 17:
                    return 'Get[options]';
                case 18:
                    return 'Set[options]';
                case 20:
                    return 'Get[name]';
                case 3:
                    return 'Set[name]';
            }
            return '----';
        },
        mapIntelliCenterAction: function (msg) {
            var action = this.extractByte(msg.header, 4);
            switch (action) {
                case 204:
                    return 'Heartbeat';
                case 30:
                    var cfg = this.extractByte(msg.payload, 0);
                    switch (cfg) {
                        case 0: return 'Cfg[options]';
                        case 1: return 'Cfg[cicuits]';
                        case 2: return 'Cfg[features]';
                        case 3: return 'Cfg[schedules]';
                        case 4: return 'Cfg[pumps]';
                        case 5: return 'Cfg[remotes]';
                        case 6: return 'Cfg[groups]';
                        case 7: return 'Cfg[chlor]';
                        case 8: return 'Cfg[chem]';
                        case 9: return 'Cfg[valves]';
                        case 10: return 'Cfg[heaters]';
                        case 11: return 'Cfg[secure]';
                        case 12: return 'Cfg[general]';
                        case 13: return 'Cfg[equipment]';
                        case 14: return 'Cfg[covers]';
                        case 15: return 'Cfg[state]';
                    }
                    return 'Cfg[' + this.extractByte(msg.payload, 0) + ']';
                case 164: return 'Versions';
                case 168:
                    var set = this.extractByte(msg.payload, 0);
                    switch (set) {
                        case 0: return 'Set[option]';
                        case 1: return 'Set[circuit]';
                        case 2: return 'Set[feature]';
                        case 3: return 'Set[schedule]';
                        case 4: return 'Set[pump]';
                        case 5: return 'Set[remote]';
                        case 6: return 'Set[group]';
                        case 7: return 'Set[chlor]';
                        case 8: return 'Set[chem]';
                        case 9: return 'Set[valve]';
                        case 10: return 'Set[heater]';
                        case 11: return 'Set[security]';
                        case 12:
                            var sub = this.extractByte(msg.payload, 2);
                            switch (sub) {
                                case 0: return 'Set[pool]';
                                case 1:
                                case 7:
                                case 8:
                                case 9:
                                case 10:
                                case 11:
                                case 12:
                                case 13:
                                    return 'Set[location]';
                                case 2:
                                case 3:
                                case 4:
                                case 5:
                                case 6:
                                    return 'Set[owner]';
                                default:
                                    return 'Set[12][pool-unk]';
                            }
                        case 13: return 'Set[body]';
                        case 14: return 'Set[cover]';
                        case 15: return 'Set[states]';
                    }
                    return 'Set[' + this.extractByte(msg.payload, 0) + ']';
                case 222:
                    var c = this.extractByte(msg.payload, 0);
                    switch (c) {
                        case 0: return 'Get[options]';
                        case 1: return 'Get[cicuits]';
                        case 2: return 'Get[features]';
                        case 3: return 'Get[schedules]';
                        case 4: return 'Get[pumps]';
                        case 5: return 'Get[remotes]';
                        case 6: return 'Get[groups]';
                        case 7: return 'Get[chlor]';
                        case 8: return 'Get[chem]';
                        case 9: return 'Get[valves]';
                        case 10: return 'Get[heaters]';
                        case 11: return 'Get[secure]';
                        case 12: return 'Get[general]';
                        case 13: return 'Get[equipment]';
                        case 14: return 'Get[covers]';
                        case 15: return 'Get[state]';
                    }
                    return 'Get[' + this.extractByte(msg.payload, 0) + ']';
            }
        },
        mapTouchAction: function (msg) {
            var action = this.extractByte(msg.header, 4);
            switch (action) {
                case 5: return 'Get[dateTime]';
                case 8: return 'Get[heatTemp]';
                case 10: return 'Get[customNames]';
                case 11: return 'Get[circuits]';
                case 17: return 'Get[schedules]';
                case 22: return 'Get[remotes]';
                case 23: return 'Get[pumpStatus]';
                case 24: return 'Get[pumpConfig]';
                case 25: return 'Get[chlor]';
                case 27: return 'Get[pumpConfig-ext]';
                case 29: return 'Get[valves]';
                case 30: return 'Get[hs-circuits]';
                case 32: return 'Get[remote]';
                case 34: return 'Get[hpump-solar]';
                case 35: return 'Get[delays]';
                case 39: return 'Get[light-pos]';
                case 40: return 'Get[options]';
                case 41: return 'Get[macros]';
                case 96: return 'Set[color]';
                case 114: return 'Set[h-pump]';
                case 131: return 'cancelDelay';
                case 133: return 'Set[date]';
                case 134: return 'Set[circuit]';
                case 136: return 'Set[bodyTemp]';
                case 137: return 'Set[h-pump]';
                case 138: return 'Set[cust-name]';
                case 139: return 'Set[circ-func]';
                case 144: return 'Set[h-pump2]';
                case 145: return 'Set[schedule]';
                case 146: return 'Set[chem]';
                case 147: return 'Set[chem]';
                case 150: return 'Set[remote]';
                case 152: return 'Set[pump]';
                case 153: return 'Set[chlor]';
                case 155: return 'Set[pump-ext]';
                case 157: return 'Set[valve]';
                case 158: return 'Set[hs-circuit]';
                case 160: return 'Set[remote-isXX]';
                case 161: return 'Set[remote-qt]';
                case 162: return 'Set[solar-hpump]';
                case 163: return 'Set[delay]';
                case 167: return 'Set[light-pos]';
                case 168: return 'Set[body-heatmode]';
                case 197: return 'Get[date]';
                case 200: return 'Get[body-temp]';
                case 202: return 'Get[cust-names]';
                case 203: return 'Get[circuits]';
                case 209: return 'Get[schedules]';
                case 214: return 'Get[remotes]';
                case 215: return 'Get[pump-status]';
                case 216: return 'Get[pumps]';
                case 217: return 'Get[chlor]';
                case 221: return 'Get[valves]';
                case 222: return 'Get[hs-circuits]';
                case 224: return 'Get[remotes-isXX]';
                case 226: return 'Get[solar-hpump]';
                case 227: return 'Get[delays]';
                case 231: return 'Get[light-pos]';
                case 232: return 'Get[options]';
                case 233: return 'Get[circuit-groups]';
                case 252: return 'Get[version]';
                case 253: return 'Get[versions]';
            }
            return action.toString();
        },
        mapIntelliChemAction: function (msg) {
            var action = this.extractByte(msg.header, 4);
            switch (action) {
                case 147:
                case 146:
                    return 'Set[chem-settings]';
                case 211:
                case 210:
                    return 'Get[chem-settings]';
                case 19:
                case 18:
                    return 'Ret[chem-settings]';
            }
            return 'chem[' + action + ']';
        },
        mapBroadcastAction: function (msg) {
            var action = this.extractByte(msg.header, 4);
            switch (action) {
                case 2: return 'Status';
            }
            return $('body').attr('data-controllertype') === 'intellicenter' ? this.mapIntelliCenterAction(msg) : this.mapTouchAction(msg);
        },
        mapIntelliValveAction: function (msg) {
            var action = this.extractByte(msg.header, 4);
            switch (action) {
                case 82: return 'ping[address]';
            }
            return 'ivalve[' + action + ']';
        },
        mapPumpAction: function (msg) {
            if (this.getSourceByte(msg) >= 95) {
                switch (this.getActionByte(msg)) {
                    case 7:
                        return 'Set[status]';
                    case 1:
                        return 'Set[drive]';
                    case 4:
                        return 'Set[control]';
                }
                return 'Unk[' + this.getActionByte(msg) + ']';
            }
            else {
                switch (this.getActionByte(msg)) {
                    case 7:
                        return 'Get[status]';
                    case 1:
                        return 'Get[drive]';
                    case 4:
                        return 'Get[control]';
                }
                return 'Unk[' + this.getActionByte(msg) + ']';
            }
        },
        getActionByte: function (msg) {
            if (msg.protocol === 'chlorinator') return this.extractByte(msg.payload, 0);
            return this.extractByte(msg.header, 4);
        },
        getSourceByte: function (msg) { return msg.protocol === 'chlorinator' ? 0 : this.extractByte(msg.header, 3); },
        getDestByte: function (msg) { return msg.protocol === 'chlorinator' ? 0 : this.extractByte(msg.header, 2); },
        getControllerByte: function (msg) { return msg.protocol === 'chlorinator' ? 0 : this.extractByte(msg.header, 1); },
        mapAction: function (msg) {
            if (msg.protocol === 'broadcast') return this.mapBroadcastAction(msg);
            else if (msg.protocol === 'chlorinator') return this.mapChlorinatorAction(msg);
            else if (msg.protocol === 'intellichem') return this.mapIntelliChemAction(msg);
            else if (msg.protocol === 'intellivalve') return this.mapIntelliValveAction(msg);
            else if (msg.protocol === 'pump') return this.mapPumpAction(msg);
        },
        isMessageDiff: function (msg1, msg2) {
            if (!msg1.isValid || !msg2.isValid) return false;
            if (msg1.payload.length !== msg2.payload.length) return true;
            for (var i = 0; i < msg1.payload.length; i++) {
                if (msg1.payload[i] !== msg2.payload[i]) return true;
            }
            return false;
        },
        toAscii: function (byte) { return (byte < 127 && byte > 31) ? String.fromCharCode(byte) : '.'; },
        toHex: function (byte, pad) {
            var hex = byte.toString(16);
            pad = typeof pad === 'undefined' || pad === null ? 2 : pad;
            while (hex.length < pad) hex = '0' + hex;
            return hex.toUpperCase();
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
        },
        pumpAddrs: [],
        chemAddrs: [],
        chlorAddrs: [{ val: 0, desc: 'Unspecified' }, { val: 80, desc: 'Chlorinator #1' }, { val: 81, desc: 'Chlorinator #2' }, { val: 82, desc: 'Chlorinator #3' }, { val: 83, desc: 'Chlorinator #4' }],
        controllerBytes: [{ val: 0, desc: 'Unspecified' }, { val: 23, desc: '*Touch' }, { val: 34, desc: 'ScreenLogic' }, { val: 63, desc: 'IntelliCenter' }],
        valveAddrs: [{ val: 12, desc: 'IntelliValve' }, { val: 15, desc: 'Broadcast' }, { val: 16, desc: 'Panel' }],
        broadcastAddrs: [{ val: 15, desc: 'Broadcast' }, { val: 16, desc: 'Panel' }],
        broadcastActions: [{ val: 2, desc: 'Status' }],
        touchActions: [
            { val: 5, desc: 'Get[dateTime]' },
            { val: 8, desc: 'Get[heatTemp]' },
            { val: 10, desc: 'Get[customNames]' },
            { val: 11, desc: 'Get[circuits]' },
            { val: 17, desc: 'Get[schedules]' },
            { val: 22, desc: 'Get[remotes]' },
            { val: 23, desc: 'Get[pumpStatus]' },
            { val: 24, desc: 'Get[pumpConfig]' },
            { val: 25, desc: 'Get[chlor]' },
            { val: 27, desc: 'Get[pumpConfig-ext]' },
            { val: 29, desc: 'Get[valves]' },
            { val: 30, desc: 'Get[hs-circuits]' },
            { val: 32, desc: 'Get[remote]' },
            { val: 34, desc: 'Get[hpump-solar]' },
            { val: 35, desc: 'Get[delays]' },
            { val: 39, desc: 'Get[light-pos]' },
            { val: 40, desc: 'Get[options]' },
            { val: 41, desc: 'Get[macros]' },
            { val: 96, desc: 'Set[color]' },
            { val: 114, desc: 'Set[h-pump]' },
            { val: 131, desc: 'cancelDelay' },
            { val: 133, desc: 'Set[date]' },
            { val: 134, desc: 'Set[circuit]' },
            { val: 136, desc: 'Set[bodyTemp]' },
            { val: 137, desc: 'Set[h-pump]' },
            { val: 138, desc: 'Set[cust-name]' },
            { val: 139, desc: 'Set[circ-func]' },
            { val: 144, desc: 'Set[h-pump2]' },
            { val: 145, desc: 'Set[schedule]' },
            { val: 146, desc: 'Set[chem]' },
            { val: 147, desc: 'Set[chem]' },
            { val: 150, desc: 'Set[remote]' },
            { val: 152, desc: 'Set[pumpConfig]' },
            { val: 153, desc: 'Set[chlor]' },
            { val: 155, desc: 'Set[pumpConfig-ext]' },
            { val: 157, desc: 'Set[valve]' },
            { val: 158, desc: 'Set[hs-circuit]' },
            { val: 160, desc: 'Set[remote-isXX]' },
            { val: 161, desc: 'Set[remote-qt]' },
            { val: 162, desc: 'Set[solar-hpump]' },
            { val: 163, desc: 'Set[delay]' },
            { val: 167, desc: 'Set[light-pos]' },
            { val: 168, desc: 'Set[body-heatmode]' },
            { val: 197, desc: 'Get[date]' },
            { val: 200, desc: 'Get[body-temp]' },
            { val: 202, desc: 'Get[cust-names]' },
            { val: 203, desc: 'Get[circuits]' },
            { val: 209, desc: 'Get[schedules]' },
            { val: 214, desc: 'Get[remotes]' },
            { val: 215, desc: 'Get[pump-status]' },
            { val: 216, desc: 'Get[pumpConfig]' },
            { val: 217, desc: 'Get[chlor]' },
            { val: 219, desc: 'Get[pumpConfig-ext]' },
            { val: 221, desc: 'Get[valves]' },
            { val: 222, desc: 'Get[hs-circuits]' },
            { val: 224, desc: 'Get[remotes-isXX]' },
            { val: 226, desc: 'Get[solar-hpump]' },
            { val: 227, desc: 'Get[delays]' },
            { val: 231, desc: 'Get[light-pos]' },
            { val: 232, desc: 'Get[options]' },
            { val: 233, desc: 'Get[circuit-groups]' },
            { val: 252, desc: 'Get[version]' },
            { val: 253, desc: 'Get[versions]' }
        ],
        centerActions: [
            { val: 30, desc: 'Config Item' },
            { val: 164, desc: 'Versions' },
            { val: 168, desc: 'Set Config Item' },
            { val: 204, desc: 'Heartbeat' },
            { val: 222, desc: 'Get Config Item' }
        ],
        chemActions: [
            { val: 18, desc: 'Ret[chem-settings]' },
            { val: 19, desc: 'Ret[chem-settings]' },
            { val: 146, desc: 'Set[chem-settings]' },
            { val: 147, desc: 'Set[chem-settings]' },
            { val: 210, desc: 'Get[chem-settings]' },
            { val: 211, desc: 'Get[chem-settings]' },
        ],
        chlorActions: [
            { val: 3, desc: 'Set[name]' },
            { val: 0, desc: 'Get[status]' },
            { val: 1, desc: 'Set[status]' },
            { val: 17, desc: 'Get[options]' },
            { val: 18, desc: 'Set[options]' },
            { val: 20, desc: 'Get[name]' }
        ],
        valveActions: [{ val: 0, desc: 'Unknown' }, { val: 82, desc: 'Ping Address' }],
        pumpActions: [
            { val: 1, desc: 'Get/Set Speed' },
            { val: 7, desc: 'Get/Set Status' },
            { val: 4, desc: 'Set Run State/Control' },
            { val: 10, desc: 'Get/Set Drive State' }
        ],
        setMessageTerm: function (msg) {
            var sum = 0;
            for (let i = 0; i < msg.header.length; i++) sum += this.extractByte(msg.header, i, 0);
            for (let i = 0; i < msg.payload.length; i++) sum += this.extractByte(msg.payload, i, 0);
            if (msg.protocol === 'chlorinator') {
                msg.term = [sum, 16, 3];
            }
            else {
                var chkHi = Math.floor(sum / 256);
                msg.term = [chkHi, (sum - (chkHi * 256))];
            }
        },
        init: function () {
            this.pumpAddrs = $.extend(true, [], this.broadcastAddrs);
            for (var i = 0; i < 16; i++) {
                this.pumpAddrs.push({ val: i + 95, desc: 'Pump #' + (i + 1) });
            }
            this.chemAddrs = $.extend(true, [], this.broadcastAddrs);
            for (var l = 0; l < 16; l++) {
                this.chemAddrs.push({ val: l + 144, desc: 'Chem #' + (l + 1) });
            }
        }
    };
    mhelper.init();

    // Publish globals explicitly (in case this file becomes wrapped/processed in the future).
    window.valveMessages = valveMessages;
    window.mhelper = mhelper;
})();


