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
    broadcastActions: [ {val: 2, desc: 'Status'}],
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
        { val: 30, desc: 'Config Item'},
        { val: 164, desc: 'Versions'},
        { val: 168, desc: 'Set Config Item'},
        { val: 204, desc: 'Heartbeat' },
        { val: 222, desc: 'Get Config Item'}
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
        { val: 0, desc: 'Get[status]'},
        { val: 1, desc: 'Set[status]'},
        { val: 17, desc: 'Get[options]'},
        { val: 18, desc: 'Set[options]'},
        { val: 20, desc: 'Get[name]'}
    ],
    valveActions: [{ val: 0, desc: 'Unknown' }, { val: 82, desc: 'Ping Address' }],
    pumpActions: [
        { val: 1, desc: 'Get/Set Speed'},
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

(function ($) {
    $.widget("pic.messageList", {
        options: {
            receivingMessages: false, pinScrolling: false, changesOnly: false, messageKeys: {}, contexts: {}, messages: {}, portFilters: [], filters: [], rowIds: [], ports: [], expandedRows: {}
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initList = function (data) { self._initList(); };
            el[0].addMessage = function (msg, autoSelect) { self.addMessage(msg, autoSelect); };
            el[0].addBulkMessage = function (msg) { self.addBulkMessage(msg); };
            el[0].addBulkApiCall = function (call) { self.addBulkApiCall(call); };
            el[0].commitBulkMessages = function () { self.commitBulkMessages(); };
            el[0].receivingMessages = function (val) { return self.receivingMessages(val); };
            el[0].cancelBulkMessages = function () { };
            el[0].clear = function () { self.clear(); };
            el[0].clearOutbound = function () { self.clearOutbound(); };
            el[0].pinSelection = function (val) {
                if (typeof val !== 'undefined') {
                    var pin = el.find('div.picScrolling:first');
                    if (makeBool(val)) {
                        if (!pin.hasClass('selected')) pin.addClass('selected');
                    }
                    else pin.removeClass('selected');
                    o.pinScrolling = val;
                }
                return o.pinScrolling;
            };
            el[0].logMessages = function (val) {
                if (typeof val !== 'undefined') {
                    var btn = el.find('div.picStartLogs:first');
                    if (makeBool(val)) {
                        if (!btn.hasClass('selected')) btn.addClass('selected');
                    }
                    else btn.removeClass('selected');
                    var mm = $('div.picMessageManager')[0];
                    //o.receivingMessages = val;
                    mm.receiveLogMessages(val);
                }
                return o.receivingMessages;
            };
            self._initList();
        },
        _resetHeight: function () {
            var self = this, o = self.options, el = self.element;
            var rect = el[0].getBoundingClientRect();
            var docHeight = document.documentElement.clientHeight;
            var height = docHeight - rect.top - 70;
            //console.log({ docHeight: docHeight, rect: rect, pos: el.offset() });
            el.css({ height: height + 'px' });
        },
        _calcMessageFilter: function (obj) {
            var self = this, o = self.options, el = self.element;
            if (o.changesOnly && obj.hasChanged === false) return true;
            let msg = o.messages[`m${obj.rowId}`];
            if (o.portFilters.includes(msg.portId)) return true;
            if (o.filters.includes(msg.messageKey)) return true;
            return false;
        },
        _initList: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            var tblOuter = $('<table class="msgList-container"></table>').appendTo(el);
            var tbody = $('<tbody></tbody>').appendTo(tblOuter);
            var row = $('<tr></tr>').appendTo(tbody);
            var td = $('<td></td>').appendTo(row);
            div = $('<div class="picMessageListTitle picControlPanelTitle control-panel-title"></div>').appendTo(td);
            $('<span>Messages</span><div class="picStartLogs mmgrButton picIconRight" title="Start/Stop Log"><i class="far fa-list-alt"></i></div>').appendTo(div);
            $('<div class="picScrolling mmgrButton picIconRight" title="Pin Selection"><i class="fas fa-thumbtack"></i></div>').appendTo(div);
            $('<div class="picChangesOnly mmgrButton picIconRight" title="Show only changes"><i class="fas fa-not-equal"></i></div>').appendTo(div);
            $('<div class="picClearMessages mmgrButton picIconRight" title="Clear Messages"><i class="fas fa-broom"></i></div>').appendTo(div);
            $('<div class="picFilter mmgrButton picIconRight" title="Filter Display"><i class="fas fa-filter"></i></div>').appendTo(div);
            $('<div class="picUploadLog mmgrButton picIconRight" title="Upload a Log File"><i class="fas fa-upload"></i></div>').appendTo(div);
            $('<div class="picReplayLog mmgrButton picIconRight" title="Replay List To njsPC"><i class="fas fa-paper-plane"></i></div>').appendTo(div)
                .on('click', (evt) => { self._promptReplayList(); });


            row = $('<tr></tr>').addClass('msgList-body').appendTo(tbody);
            td = $('<td></td>').addClass('msgList-body').appendTo(row);
            
            // Add empty state placeholder
            var emptyPlaceholder = $('<div class="msgList-empty-placeholder"></div>').appendTo(td).show();
            $('<div class="empty-icon"><i class="fas fa-inbox"></i></div>').appendTo(emptyPlaceholder);
            $('<div class="empty-message">Start or load a message capture.</div>').appendTo(emptyPlaceholder);
            $('<div class="empty-message">Click on any row to bring up more details.</div>').appendTo(emptyPlaceholder);
            
            var vlist = $('<div></div>').css({ width: '100%', height: '100%' }).appendTo(td).virtualList({
                selectionType: 'single',
                columns: [
                    { header: { label: '' }, data: { elem: $('<i></i>').addClass('far fa-clipboard').appendTo($('<span></span>')) } },
                    { header: { label: 'Port', attrs: { title: 'Port\r\nID 0, 1, etc' } } },
                    { header: { label: 'Id' } },
                    { header: { label: 'Dir', attrs: { title: 'The direction of the message\r\nEither in or out' } } },
                    { header: { label: 'Chg', attrs: { title: 'Indicates whether the message is\r\n1. A new message\r\n2. A change from previous\r\n3. A duplicate of the previous instance' } } },
                    { header: { label: 'Proto' } },
                    { header: { label: 'Source' } },
                    { header: { label: 'Dest' } },
                    { header: { label: 'Action' } },
                    { header: { label: 'Payload' } }
                ]
            });
            vlist.on('bindrow', function (evt) { self._bindVListRow(evt.row, evt.rowData); });
            
            // Handle close button clicks on expansion content
            el.on('click', 'div.expansion-close-btn', function(evt) {
                evt.stopPropagation();
                var container = $(evt.currentTarget).closest('div.inline-expansion-content');
                var row = container.closest('tr.msgRow');
                var rowId = row.attr('data-rowid');
                
                // Close the expansion
                row.removeClass('row-expanded');
                container.remove();
                delete o.expandedRows[rowId];
                
                // Update stored HTML
                var vlistWidget = el.find('div.picVirtualList:first');
                self._updateStoredRowHtml(vlistWidget, rowId, row);
            });
            
            vlist.on('selchanged', function (evt) {
                var pnlDetail = $('div.picMessageDetail');
                var msg = o.messages['m' + evt.newRow.attr('data-rowid')];
                var ndx = parseInt(evt.newRow.attr('data-rowid'), 10);
                var msgKey = evt.newRow.attr('data-msgkey');
                var docKey = evt.newRow.attr('data-dockey');
                var prev;
                var forMsg;
                for (var i = ndx - 1; i >= 0; i--) {
                    var p = $(evt.allRows[i].row);
                    if (p.attr('data-msgkey') === msgKey) {
                        prev = o.messages['m' + p.attr('data-rowid')];
                        break;
                    }
                }
                if (typeof msg.responseFor !== 'undefined' && msg.responseFor.length > 0) {
                    let id = msg.responseFor[0];
                    let rid = o.rowIds.find(elem => elem.msgId === id);
                    if (typeof rid !== 'undefined')
                        forMsg = o.messages['m' + rid.rowId];
                }
                
                // Get context - try both docKey and msgKey
                var context = o.contexts[docKey] || o.contexts[msgKey];
                
                // Toggle inline expansion
                self._toggleInlineExpansion(evt.newRow, msg, prev, forMsg, context);
                
                // Hide the bottom detail panel since we're using inline expansion
                pnlDetail.slideUp(200);
            });
            el.on('click', 'div.picStartLogs', function (evt) {
                var mm = $('div.picMessageManager')[0];
                mm.receiveLogMessages(!o.receivingMessages);
            });
            el.on('click', 'div.picScrolling', function (evt) {
                o.pinScrolling = !o.pinScrolling;
                //console.log(evt);
                if (!o.pinScrolling) $(evt.currentTarget).removeClass('selected');
                else $(evt.currentTarget).addClass('selected');
            });
            el.on('click', 'div.picChangesOnly', function (evt) {
                o.changesOnly = !o.changesOnly;
                if (o.changesOnly) {
                    el.addClass('changesOnly');
                    $(evt.currentTarget).addClass('selected');
                }
                else {
                    $(evt.currentTarget).removeClass('selected');
                    el.removeClass('changesOnly');
                }
                self._filterMessages();
            });
            el.on('click', 'div.picFilter', function (evt) {
                let filt = { ports: [], protocols: [] };
                //console.log(o.contexts);
                console.log(o.portFilters);
                console.log(o.ports);
                for (let i = 0; i < o.ports.length; i++) {
                    filt.ports.push({ port: o.ports[i], filtered: o.portFilters.includes(o.ports[i]) });
                }
                for (var s in o.contexts) {
                    let c = o.contexts[s];
                    let p = filt.protocols.find(elem => elem.name === c.protocol.name);
                    if (typeof p === 'undefined') {
                        p = { name: c.protocol.name, desc: c.protocol.desc, actions: [] };
                        filt.protocols.push(p);
                    }
                    if (typeof c.actionByte !== 'undefined') {
                        let act = p.actions.find(elem => elem.val === c.actionByte);
                        if (typeof act === 'undefined') {
                            act = { val: c.actionByte, name: c.actionName, filters: [], sources: [], dests: [] };
                            p.actions.push(act);
                        }
                        // Check to see if we have a filter defined.
                        if (typeof act.filters.find(elem => elem.key === c.messageKey) === 'undefined') {
                            act.filters.push({
                                key: c.messageKey,
                                filtered: o.filters.includes(c.messageKey),
                                actionExt: c.actionExt,
                                payloadKey: c.payloadKey,
                                category: c.category,
                                context: c,
                                source: { val: c.sourceAddr.val, name: c.sourceAddr.name },
                                dest: { val: c.destAddr.val, name: c.destAddr.name }
                            });
                        }
                    }
                    else if (typeof c.requestor !== 'undefined') {
                        let act = p.actions.find(elem => elem.name === o.endpoint);
                        if (typeof act === 'undefined') {
                            act = { val: 1, name: c.endpoint, filters: [], sources: [], dests: [] };
                            p.actions.push(act);
                        }
                        if (typeof act.filters.find(elem => elem.key === s) === 'undefined') {
                            act.filters.push({
                                key: s,
                                filtered: o.filters.includes(s),
                                category: 'API Call',
                                actionExt: '',
                                context: c,
                                source: { val: null, name: c.requestor }
                            });
                        }

                    }
                }
                // We should have a complete list of what is contained in this so lets show a filter dialog.
                // Protocol --> Action --> Source / Dest
                //console.log(filt);
                self._createFilterDialog(filt);
            });

            el.on('click', 'div.picClearMessages', function (evt) { self.clear(); });
            el.on('click', 'i.fa-clipboard', function (evt) {
                var row = $(evt.currentTarget).parents('tr.msgRow:first');
                msgManager.copyToClipboard(o.messages['m' + row.attr('data-rowid')]);
            });
            el.on('click', 'div.picUploadLog', function (evt) {
                var pnl = $(evt.currentTarget).parents('div.picSendMessageQueue');
                var divPopover = $('<div></div>');
                divPopover.appendTo(el.parent().parent());
                divPopover.on('initPopover', function (e) {
                    $('<div></div>').appendTo(e.contents()).uploadLog();
                    e.stopImmediatePropagation();
                });
                divPopover.popover({ autoClose: false, title: 'Upload Log File', popoverStyle: 'modal', placement: { target: $('div.picMessageListTitle:first') } });
                divPopover[0].show($('div.picMessageListTitle:first'));
                evt.preventDefault();
                evt.stopImmediatePropagation();

            });
            //el.on('click', 'tr.msgRow', function (evt) {
            //    self._selectRow($(evt.currentTarget));
            //});
            self._resetHeight();
            $(window).on('resize', function (evt) {
                self._resetHeight();
            });
        },
        _promptReplayList: function () {
            let self = this, o = self.options, el = self.element;
            let dlg = $.pic.modalDialog.createDialog('dlgReplayList', {
                width: '357px',
                height: 'auto',
                title: `Replay Messages to njsPC`,
                position: { my: "center top", at: "center top", of: el },
                buttons: [
                    {
                        text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                        click: function () {
                            divControls.attr('data-mode', 'stop');
                            $.pic.modalDialog.closeDialog(this);
                        }
                    }
                ]
            });
            let mm = $('.picMessageManager:first')[0];
            let div = $('<div></div>').appendTo(dlg);
            let divMessage = $('<div></div>').appendTo(div).css({ textAlign: 'center' }).text('Stopped');
            $('<hr></hr>').appendTo(div).css({ margin: '2px' });
            let divControls = $('<div></div>').attr('data-mode', 'stopped').appendTo(div).css({ textAlign: 'center' });
            let divSlider = $('<div></div>').appendTo(div).css({ paddingLeft: '27px', paddingRight: '27px', paddingTop:'7px' });
            let slider = $('<input></input>').attr('type', 'range').attr('min', -100).attr('max', 100).attr('value', 0).appendTo(divSlider).css({ width: '100%' });
            let divSLabel = $('<div></div>').appendTo(divSlider).css({ fontSize: '.7rem', width: 'calc(100% + 14px)', height: '17px', marginLeft:'-7px' });
            $('<span></span>').text('Faster').appendTo(divSLabel).css({ float: 'left'});
            $('<span></span>').text('Slower').appendTo(divSLabel).css({ float: 'right' });
            
            el[0].pinSelection(true);
            el[0].logMessages(false);

            let fnCreateButton = (title, icon) => {
                let btn = $('<span></span>').attr('title', title).addClass('btn').appendTo(divControls).css({ display: 'inline-block', width: '3rem', textAlign: 'center' });
                $('<i></i>').appendTo(btn).addClass(icon);
                return btn;
            };
            let fnGetNextMessage = () => {
                if (currIndex >= vlist[0].totalRows()) return;
                let obj = vlist[0].objByIndex(currIndex);
                let msg = o.messages['m' + obj.rowId];
                if (!obj.hidden && msg.isValid && msg.direction === 'in') {
                    return msg;
                }
                if (currIndex + 1 >= vlist[0].totalRows()) return;
                return fnGetNextMessage(++currIndex);
            };
            let fnGetPrevMessage = () => {
                if (currIndex < 0) return;
                let obj = vlist[0].objByIndex(currIndex);
                let msg = o.messages['m' + obj.rowId];
                if (!obj.hidden && msg.isValid && msg.direction === 'in') {
                    return msg;
                }
                if (currIndex - 1 < 0) return;
                return fnGetPrevMessage(--currIndex);
            };

            let playTimer = null;
            let fnProcessMessage = async (msg) => {
                if (typeof msg === 'undefined') return;
                if (playTimer) {
                    clearTimeout(playTimer);
                    playTimer = null;
                }
                try {
                    divMessage.text(`Processing Message ${msg._id || currIndex}`);
                    let m = $.extend(true, {}, msg);
                    m.direction = 'out';
                    delete m.isValid;
                    delete m.packetCount;
                    delete m.complete;
                    delete m.timestamp;
                    delete m._complete;
                    delete m.messageKey;
                    delete m.rowId;
                    vlist[0].selectedIndex(currIndex, true);
                    mm.sendInboundMessage(m);
                } catch (err) { console.log(`Error processing message ${err}`); }
                finally {
                    switch (divControls.attr('data-mode')) {
                        case 'play':
                            currIndex++;
                            let next = fnGetNextMessage();
                            if (typeof next !== 'undefined') {
                                let tspan = (new Date(next.timestamp) - new Date(msg.timestamp).getTime());
                                let t = tspan + (tspan * (slider.val() / 100));
                                console.log({ text: 'Next', timeout: t, next: next, tspan: tspan });
                                playTimer = setTimeout(async () => { await fnProcessMessage(next); }, t);
                            }
                            else {
                                divControls.attr('data-mode', 'stopped');
                                btnPrev.removeClass('disabled');
                                btnNext.removeClass('disabled');
                                btnPlay.removeClass('disabled');
                                btnPause.removeClass('flicker-animated');
                                if (!btnPause.hasClass('disabled')) btnPause.addClass('disabled');
                                if (!btnStop.hasClass('disabled')) btnStop.addClass('disabled');
                            }
                            break;
                    }
                }
            };
            let vlist = el.find('div.picVirtualList:first');
            let currIndex = vlist[0].selectedIndex();
            let btnPrev = fnCreateButton('Previous Message', 'fas fa-backward-step').on('click', (evt) => {
                if ($(evt.target).hasClass('disabled')) return;
                if (playTimer) {
                    clearTimeout(playTimer);
                    playTimer = null;
                }
                if (currIndex > 0) {
                    currIndex--;
                    divControls.attr('data-mode', 'prev');
                    let msg = fnGetPrevMessage();
                    if (typeof msg !== 'undefined') playTimer = setTimeout(async () => { await fnProcessMessage(msg); }, 100);
                }
            });
            let btnPlay = fnCreateButton('Play from Selected', 'fas fa-play').on('click', (evt) => {
                if ($(evt.target).hasClass('disabled')) return;
                if (!btnPrev.hasClass('disabled')) btnPrev.addClass('disabled');
                if (!btnNext.hasClass('disabled')) btnNext.addClass('disabled');
                let msg = fnGetNextMessage();
                if (playTimer) {
                    clearTimeout(playTimer);
                    playTimer = null;
                }
                if (typeof msg !== 'undefined') {
                    btnPause.removeClass('flicker-animated');
                    btnPause.removeClass('disabled');
                    btnStop.removeClass('disabled');
                    btnPlay.addClass('disabled');
                    divControls.attr('data-mode', 'play');
                    playTimer = setTimeout(async () => { await fnProcessMessage(msg); }, 100);
                }

            });
            let btnNext = fnCreateButton('Next Message', 'fas fa-forward-step').on('click', (evt) => {
                if ($(evt.target).hasClass('disabled')) return;
                if (playTimer) {
                    clearTimeout(playTimer);
                    playTimer = null;
                }
                if (currIndex < vlist[0].totalRows()) {
                    currIndex++;
                    divControls.attr('data-mode', 'next');
                    let msg = fnGetNextMessage();
                    if (typeof msg !== 'undefined') playTimer = setTimeout(async () => { await fnProcessMessage(msg); }, 100);
                }
            });
            let btnPause = fnCreateButton('Pause Replay', 'fas fa-pause').addClass('disabled').on('click', (evt) => {
                if ($(evt.target).hasClass('disabled')) return;
                if (playTimer) {
                    clearTimeout(playTimer);
                    playTimer = null;
                }
                let mode = divControls.attr('data-mode');
                if (mode === 'paused' || mode === 'next' || mode === 'prev') {
                    // Start playing again.
                    btnPause.removeClass('flicker-animated');
                    if (!btnPrev.hasClass('disabled')) btnPrev.addClass('disabled');
                    if (!btnNext.hasClass('disabled')) btnNext.addClass('disabled');
                    btnPlay.addClass('disabled');
                    btnPause.removeClass('disabled');
                    btnStop.removeClass('disabled');
                    divControls.attr('data-mode', 'play');
                    let msg = fnGetNextMessage();
                    if (typeof msg !== 'undefined') playTimer = setTimeout(async () => { await fnProcessMessage(msg); }, 100);
                }
                else {
                    if (!btnPause.hasClass('flicker-animated')) btnPause.addClass('flicker-animated');
                    divMessage.text('Paused');
                    divControls.attr('data-mode', 'paused');
                    btnStop.removeClass('disabled');
                    btnPrev.removeClass('disabled');
                    btnNext.removeClass('disabled');
                    btnPlay.removeClass('disabled');
                }
            });
            let btnStop = fnCreateButton('Stop Replay', 'fas fa-stop').addClass('disabled').on('click', (evt) => {
                if ($(evt.target).hasClass('disabled')) return;
                divControls.attr('data-mode', 'stopped');
                divMessage.text('Stopped');
                if (playTimer) {
                    clearTimeout(playTimer);
                    playTimer = null;
                }
                btnPrev.removeClass('disabled');
                btnNext.removeClass('disabled');
                btnPlay.removeClass('disabled');
                btnPause.removeClass('flicker-animated');
                if(!btnPause.hasClass('disabled')) btnPause.addClass('disabled');
                if(!btnStop.hasClass('disabled')) btnStop.addClass('disabled');
            });
            if (currIndex === -1) {
                divControls.find('span').addClass('disabled');
                divMessage.text('No Starting Message Selected');
            }
            dlg.css({ overflow: 'visible' });
        },
        _filterMessages: function () {
            var self = this, o = self.options, el = self.element;
            let vlist = el.find('div.picVirtualList:first');
            //console.log(o.filters);
            vlist[0].applyFilter(function (obj) {
                obj.hidden = self._calcMessageFilter(obj);
                //if (obj.isApiCall === true) obj.hidden = false;
                //else obj.hidden = self._calcMessageFilter(obj);
            });
        },
        _createFilterDialog: function (filt) {
            var self = this, o = self.options, el = self.element;
            var dlg = $.pic.modalDialog.createDialog('dlgFilterMessages', {
                message: 'Filter Messages',
                width: '400px',
                height: 'auto',
                title: 'Filter Messages',
                buttons: [
                    {
                        text: 'Clear', icon: '<i class="fas fa-broom"></i>',
                        click: function () {
                            dlg.find('div.picCheckbox').each(function () { this.val(false); });
                        }
                    },
                    {
                        text: 'Apply', icon: '<i class="fas fa-save"></i>',
                        click: function () {
                            let keys = [];
                            dlg.find('div.picCheckbox.cb-filter').each(function () {
                                if (this.val()) keys.push($(this).attr('data-messageKey'));
                            });
                            //console.log(keys);
                            o.filters = keys;
                            let ports = [];
                            dlg.find('div.picCheckbox.cb-port').each(function () {
                                if (this.val()) ports.push(parseInt($(this).attr('data-port'), 10));
                            });
                            o.portFilters = ports;
                            self._filterMessages();
                        }
                    },
                    {
                        text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }
                ]
            });
            var outer = $('<div></div>').appendTo(dlg).addClass('pnl-protofilter').css({
                maxHeight: `calc(100vh - 177px)`, overflowY: 'auto'
            });
            console.log(filt);
            for (let i = 0; i < filt.ports.length; i++) {
                let p = filt.ports[i];
                let divP = $('<div></div>').appendTo(outer).addClass('pnl-port');
                $('<div></div>').appendTo(divP).css({ fontWeight: 'bold' });
                $('<div></div>').appendTo(divP).checkbox({ labelHtml: `<span>RS485 Port #${p.port}</span>`, value:p.filtered }).addClass('cb-port').css({ fontWeight: 'bold' }).attr('data-port', p.port);
            }
            let fnCalcChecks = (div) => {
                return {
                    checked: div.find('div.picCheckbox.cb-filter > input[type=checkbox]:checked'),
                    unchecked: div.find('div.picCheckbox.cb-filter > input[type=checkbox]:not(:checked)')
                };
            };
            for (let i = 0; i < filt.protocols.length; i++) {
                let f = filt.protocols[i];
                let divP = $('<div></div>').appendTo(outer).addClass('pnl-protocol');
                $('<div></div>').appendTo(divP).css({ fontWeight: 'bold' });
                $('<div></div>').appendTo(divP).checkbox({ labelHtml: `<span>${f.desc}</span>` }).addClass('cb-protocol').css({ fontWeight: 'bold' });
                for (let a = 0; a < f.actions.length; a++) {
                    let act = f.actions[a];
                    let divA = $('<div></div>').appendTo(divP).addClass('pnl-action');
                    $('<div></div>').appendTo(divA).checkbox({ labelHtml: `<span>[<span class="msg-detail-byte">${act.val}</span>]<span> ${act.name}</span>` })
                        .css({ marginLeft: '1rem', fontWeight: 'bold' }).addClass('cb-action');
                    for (let j = 0; j < act.filters.length; j++) {
                        let filter = act.filters[j];
                        let divFilter = $('<div></div>').css({ marginLeft: '2rem', fontSize: '.8rem' }).appendTo(divA);
                        if (typeof filter.dest !== 'undefined') {
                            $('<div></div>').checkbox({
                                labelHtml: `<span>[<span class="msg-detail-byte">${filter.source.val}</span>] ${filter.source.name} <i class="fas fa-arrow-right msg-detail-fromto"></i> [<span class="msg-detail-byte">${filter.dest.val}</span>] ${filter.dest.name} <span class="msg-detail-byte" title="${filter.category}:${filter.payloadKey}">${filter.actionExt}</span></span>`,
                                value: filter.filtered
                            }).appendTo(divFilter).attr('data-messageKey', filter.key).addClass('cb-filter');
                        }
                        else if (typeof filter.source !== 'undefined') {
                            $('<div></div>').checkbox({
                                labelHtml: `<span><span class="msg-detail-byte">${filter.source.name}</span></span></span>`,
                                value: filter.filtered
                            }).appendTo(divFilter).attr('data-messageKey', filter.key).addClass('cb-filter');
                        }
                    }
                    let achecks = fnCalcChecks(divA);
                    if (achecks.checked.length === 0) divA.find('div.picCheckbox.cb-action').each(function () { this.indeterminate(false); this.val(false); });
                    else if (achecks.checked.length > 0 && achecks.unchecked.length === 0) divA.find('div.picCheckbox.cb-action').each(function () { this.indeterminate(false); this.val(true); });
                    else divA.find('div.picCheckbox.cb-action').each(function () { this.indeterminate(true); });
                }
                let pchecks = fnCalcChecks(divP);
                if (pchecks.checked.length === 0) divP.find('div.picCheckbox.cb-protocol').each(function () { this.indeterminate(false); this.val(false); });
                else if (pchecks.checked.length > 0 && pchecks.unchecked.length === 0) divP.find('div.picCheckbox.cb-protocol').each(function () { this.indeterminate(false); this.val(true); });
                else divP.find('div.picCheckbox.cb-protocol').each(function () { this.indeterminate(true); });
            }
            outer.on('changed', 'div.picCheckbox.cb-protocol', function (evt) {
                let div = $(evt.currentTarget).parents('div.pnl-protocol:first');
                try {
                    dlg.attr('data-processing', true);
                    div.find('div.picCheckbox.cb-action').each(function () {
                        if (this.val() !== evt.newVal) {
                            this.val(evt.newVal);
                        }
                        this.indeterminate(false);
                    });
                } catch (err) { console.log(err); }
            });
            outer.on('changed', 'div.picCheckbox.cb-action', function (evt) {
                let div = $(evt.currentTarget).parents('div.pnl-action:first');
                try {
                    div.find('div.picCheckbox.cb-filter').each(function () { if (this.val() !== evt.newVal) this.val(evt.newVal); });
                    let divP = div.parents('div.pnl-protocol:first');
                    let checks = fnCalcChecks(divP);
                    if (checks.checked.length === 0) divP.find('div.picCheckbox.cb-protocol').each(function () {
                        if (this.val() !== false) this.val(false);
                        this.indeterminate(false);
                    });
                    else if (checks.checked.length > 0 && checks.unchecked.length === 0) divP.find('div.picCheckbox.cb-protocol').each(function () {
                        if (this.val() !== true) this.val(true);
                        this.indeterminate(false);
                    });
                    else divP.find('div.picCheckbox.cb-protocol').each(function () { this.indeterminate(true); });

                } catch (err) { console.log(err); }
            });
            outer.on('changed', 'div.picCheckbox.cb-filter', function (evt) {
                if (dlg.attr('data-processing') === true) return;
                let divA = $(evt.currentTarget).parents('div.pnl-action:first');
                let divP = divA.parents('div.pnl-protocol:first');
                let checks = fnCalcChecks(divA);
                if (checks.checked.length === 0) divA.find('div.picCheckbox.cb-action').each(function () { this.indeterminate(false); this.val(false); });
                else if (checks.checked.length > 0 && checks.unchecked.length === 0) divA.find('div.picCheckbox.cb-action').each(function () { this.indeterminate(false); this.val(true); });
                else divA.find('div.picCheckbox.cb-action').each(function () { this.indeterminate(true); });

                checks = fnCalcChecks(divP);
                if (checks.checked.length === 0) divP.find('div.picCheckbox.cb-protocol').each(function () { this.indeterminate(false); this.val(false); });
                else if (checks.checked.length > 0 && checks.unchecked.length === 0) divP.find('div.picCheckbox.cb-protocol').each(function () { this.indeterminate(false); this.val(true); });
                else divP.find('div.picCheckbox.cb-protocol').each(function () { this.indeterminate(true); });
            });
            
            dlg.parent().position({ my: 'center', at: 'center', of: window });

        },
        clear: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picVirtualList')[0].clear();
            o.messages = {};
            o.contexts = {};
            o.messageKeys = {};
            o.rowIds = [];
            o.ports = [];
            self._toggleEmptyPlaceholder(true);
        },
        clearOutbound: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picVirtualList')[0].clear(elem => elem.rowId < 1);
            var props = Object.getOwnPropertyNames(o.messages);
            for (var i = 0; i < props.length; i++) {
                if (props[i] === 'm1') continue;
                delete o.messages[props[i]];
            }
        },
        addMessage: function (msg) {
            var self = this, o = self.options, el = self.element;
            self._toggleEmptyPlaceholder(false);
            el.find('div.picVirtualList')[0].addRow(msg);
        },
        addApiCall: function (call) {
            var self = this, o = self.options, el = self.element;
            self._toggleEmptyPlaceholder(false);
            el.find('div.picVirtualList')[0].addRow(call);
        },
        addBulkMessage: function (msg) {
            var self = this, o = self.options, el = self.element;
            self._toggleEmptyPlaceholder(false);
            el.find('div.picVirtualList:first')[0].addRows([msg]);
        },
        addBulkApiCall: function (call) {
            var self = this, o = self.options, el = self.element;
            self._toggleEmptyPlaceholder(false);
            el.find('div.picVirtualList:first')[0].addRows([call]);
        },
        commitBulkMessages: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picVirtualList:first')[0].render(true);
        },
        _toggleEmptyPlaceholder: function(show) {
            var self = this, o = self.options, el = self.element;
            var placeholder = el.find('div.msgList-empty-placeholder');
            var vlist = el.find('div.picVirtualList');
            
            if (show) {
                placeholder.show();
                vlist.hide();
            } else {
                placeholder.hide();
                vlist.show();
            }
        },
        _scrollToRow: function (row) {
            var self = this, o = self.options, el = self.element;
            //var pos = row.position();
        },
        _selectRow: function (row, prev, ctx) {
            var self = this, o = self.options, el = self.element;
            //$('div.picMessageDetail')[0].bindMessage(msg, prev, ctx || o.contexts[docKey]);
        },
        _bindVListMessageRow(obj, msg, autoSelect) {
            var self = this, o = self.options, el = self.element;
            var row = obj.row;
            var r = row[0];
            row.attr('data-msgdir', msg.direction);
            row.attr('data-port', msg.portId);
            row.addClass('msgRow');
            var ctx = msgManager.getListContext(msg);
            o.contexts[ctx.messageKey] = ctx;
            if ((typeof msg.isValid !== 'undefined' && !msg.isValid) || (typeof msg.valid !== 'undefined' && !msg.valid)) row.addClass('invalid');

            $('<span></span>').text(msg.portId).appendTo(r.cells[1]);
            $('<span></span>').text(`${msg._id}${msg.tries>=1?'-'+msg.tries:''}`).appendTo(r.cells[2]);
            var dir = $('<i></i>').addClass('fas').addClass(msg.direction === 'out' ? 'fa-arrow-circle-left' : 'fa-arrow-circle-right');
            $('<span></span>').append(dir).appendTo(r.cells[3]);
            var spChg = $('<span class="changed"></span>').appendTo(r.cells[4]);
            var chg = $('<i class="fas"></i>').appendTo(spChg);
            $('<span></span>').text(ctx.protocol.name).appendTo(r.cells[5]);
            $('<span></span>').text(ctx.sourceAddr.name).appendTo(r.cells[6]);
            $('<span></span>').text(ctx.destAddr.name).appendTo(r.cells[7]);
            $('<span></span>').text(ctx.actionByte).appendTo(r.cells[8]);
            $(r.cells[8]).attr('title', ctx.actionName).addClass('msg-action');
            if (typeof msg.payload !== 'undefined' && typeof msg.payload.join === 'function') $('<span></span>').text(msg.payload.join(',')).appendTo(r.cells[9]);
            else console.log(msg);
            var prev = o.messageKeys[ctx.messageKey];
            var hasChanged = false;
            if (typeof prev === 'undefined')
                hasChanged = true;
            else if (msgManager.isMessageDiff(msg, prev, ctx))
                hasChanged = true;
            if (hasChanged) {
                row.addClass('changed');
                typeof prev === 'undefined' ? spChg.addClass('new') : spChg.addClass('changed');
                chg.addClass('fa-dot-circle');
            }
            else
                row.addClass('nochange');
            //if (o.changesOnly && !hasChanged) obj.hidden = true;

            o.messageKeys[ctx.messageKey] = msg;
            msg.rowId = obj.rowId;
            msg.messageKey = ctx.messageKey;
            //row.data('message', msg); Can't store jquery data. Create our own message cache.
            o.messages['m' + obj.rowId] = msg;
            o.rowIds.push({ rowId: obj.rowId, msgId: msg._id });
            if (typeof msg.portId !== 'undefined' && !o.ports.includes(msg.portId)) {
                o.ports.push(parseInt(msg.portId, 10));
            }
            row.attr('data-msgkey', ctx.messageKey);
            row.attr('data-dockey', ctx.docKey);
            row.attr('data-msgid', msg._id);
            obj.hasChanged = hasChanged;
            obj.hidden = self._calcMessageFilter(obj);
            if (typeof prev !== 'undefined') obj.prevId = prev.rowId;
            if (!o.pinScrolling) {
                if (!o.changesOnly || (o.changesOnly && hasChanged)) {
                    self.selectRowByIndex(obj.rowId, true);
                }
            }
        },
        _bindVListApiRow(obj, msg, autoSelect) {
            var self = this, o = self.options, el = self.element;
            var row = obj.row;
            var r = row[0];
            msg.messageKey = `${msg.requestor}${msg.path}`;
            o.contexts[msg.messageKey] = {
                protocol: { name: 'api', desc: 'API Call' }, requestor: msg.requestor, endpoint: msg.path };
            //keyFormat: key, protocol: proto, sourceByte: source, destByte: dest, controllerByte: controller,
            //    actionByte: action, sourceAddr: addrSource, destAddr: addrDest, payloadLength: length
            row.attr('data-msgdir', msg.direction);
            row.addClass('msgApiRow');
            row.attr('data-msgkey', `${msg.requestor}${msg.path}`);
            $('<span></span>').text('').appendTo(r.cells[1]);
            var dir = $('<i></i>').addClass('fas').addClass(msg.direction === 'out' ? 'fa-arrow-circle-left' : 'fa-arrow-circle-right');
            $('<span></span>').append(dir).appendTo(r.cells[2]);
            var spChg = $('<span class="changed"></span>').append('<i class="fas fa-poo"></i>').appendTo(r.cells[3]).css({ color: 'brown' });
            $(r.cells[4]).attr('colspan', 4).css({ width: '218px' });//.text(`${msg.requestor}${msg.path}`);
            $('<span></span>').text(`${msg.requestor}${msg.path}`).appendTo($(r.cells[4])).css({ width: '214px', textOverlow: 'ellipsis', whiteSpace: 'nowrap' });
            $(r.cells[7]).remove();
            $(r.cells[6]).remove();
            $(r.cells[5]).remove();
            $('<span></span>').text(JSON.stringify(msg.body)).appendTo(r.cells[5]);
            if (!o.pinScrolling) {
                if (!o.changesOnly || (o.changesOnly && hasChanged)) {
                    self.selectRowByIndex(obj.rowId, true);
                }
            }
            obj.hasChanged = true;
            obj.isApiCall = true;
            row.attr('data-msgid', msg._id);
            row.attr('data-portId', msg.portId);
            o.messages['m' + obj.rowId] = msg;
            obj.hidden = self._calcMessageFilter(obj);

        },
        _bindVListScreenLogicRow(obj, msg, autoSelect) {
            var self = this, o = self.options, el = self.element;
            var row = obj.row;
            var r = row[0];
            msg.messageKey = `${msg.systemName}${msg.action}`;
            o.contexts[msg.messageKey] = {
                protocol: { name: 'screenlogic', desc: 'ScreenLogic' }, 
                action: msg.action };
            row.attr('data-msgdir', msg.direction);
            // row.attr('data-port', msg.portId);
            row.addClass('msgRow');
            var ctx = msgManager.getListContext(msg);
            o.contexts[ctx.messageKey] = ctx;
            if ((typeof msg.isValid !== 'undefined' && !msg.isValid) || (typeof msg.valid !== 'undefined' && !msg.valid)) row.addClass('invalid');

            $('<span></span>').text(msg.controllerId).appendTo(r.cells[1]);
            $('<span></span>').text(`${msg._id}`).appendTo(r.cells[2]);
            var dir = $('<i></i>').addClass('fas').addClass(msg.direction === 'out' ? 'fa-arrow-circle-left' : 'fa-arrow-circle-right');
            $('<span></span>').append(dir).appendTo(r.cells[3]);
            var spChg = $('<span class="changed"></span>').appendTo(r.cells[4]);
            var chg = $('<i class="fas"></i>').appendTo(spChg);
            $('<span></span>').text(ctx.protocol.name).appendTo(r.cells[5]);
            $('<span></span>').text(ctx.sourceAddr.name).appendTo(r.cells[6]);
            $('<span></span>').text(ctx.destAddr.name).appendTo(r.cells[7]);
            $('<span></span>').text(ctx.actionByte).appendTo(r.cells[8]);
            $(r.cells[8]).attr('title', ctx.actionName).addClass('msg-action');
            if (typeof msg.payload !== 'undefined' && typeof msg.payload.join === 'function') $('<span></span>').text(msg.payload.join(',')).appendTo(r.cells[9]);
            else console.log(msg);
            var prev = o.messageKeys[ctx.messageKey];
            var hasChanged = false;
            if (typeof prev === 'undefined')
                hasChanged = true;
            else if (msgManager.isMessageDiff(msg, prev, ctx))
                hasChanged = true;
            if (hasChanged) {
                row.addClass('changed');
                typeof prev === 'undefined' ? spChg.addClass('new') : spChg.addClass('changed');
                chg.addClass('fa-dot-circle');
            }
            else
                row.addClass('nochange');
            //if (o.changesOnly && !hasChanged) obj.hidden = true;

            o.messageKeys[ctx.messageKey] = msg;
            msg.rowId = obj.rowId;
            msg.messageKey = ctx.messageKey;
            //row.data('message', msg); Can't store jquery data. Create our own message cache.
            o.messages['m' + obj.rowId] = msg;
            o.rowIds.push({ rowId: obj.rowId, msgId: msg._id });
            if (typeof msg.portId !== 'undefined' && !o.ports.includes(msg.portId)) {
                o.ports.push(parseInt(msg.portId, 10));
            }
            row.attr('data-msgkey', ctx.messageKey);
            row.attr('data-dockey', ctx.docKey);
            row.attr('data-msgid', msg._id);
            obj.hasChanged = hasChanged;
            obj.hidden = self._calcMessageFilter(obj);
            if (typeof prev !== 'undefined') obj.prevId = prev.rowId;
            if (!o.pinScrolling) {
                if (!o.changesOnly || (o.changesOnly && hasChanged)) {
                    self.selectRowByIndex(obj.rowId, true);
                }
            }


            obj.hasChanged = true;
            row.attr('data-msgid', msg._id);
            // row.attr('data-portId', msg.portId);
            o.messages['m' + obj.rowId] = msg;
            obj.hidden = self._calcMessageFilter(obj);

        },
        _bindVListRow(obj, msg, autoSelect) {
            var self = this, o = self.options, el = self.element;
            var row = obj.row;
            
            // BIND: Standard binding logic
            // Note: Expansion content is now stored as part of the row's HTML in the virtual list,
            // so it will be automatically restored when the virtual list re-renders from stored HTML.
            if (msg.protocol === 'api') self._bindVListApiRow(obj, msg, autoSelect);
            else if (msg.protocol === 'screenlogic') self._bindVListScreenLogicRow(obj, msg, autoSelect);
            else self._bindVListMessageRow(obj, msg, autoSelect);
        },
        selectRowByIndex: function (ndx, scroll) {
            var self = this, o = self.options, el = self.element;
            if (o.selectTimeout) clearTimeout(o.selectTimeout);
            o.selectTimeout = setTimeout(function () {
                el.find('div.picVirtualList:first')[0].selectedIndex(ndx, scroll);
            }, 1);
        },
        _bindMessage(row, msg, autoSelect) {
            var self = this, o = self.options, el = self.element;
            var inout = $('<span></span>').appendTo($('<td></td>').appendTo(row));
            $('<i class="fas"></i>').appendTo(inout).addClass(msg.direction === 'out' ? 'fa-arrow-circle-left' : 'fa-arrow-circle-right');
            var spChg = $('<span class="changed"></span>').appendTo($('<td></td>').appendTo(row));
            var chg = $('<i class="fas"></i>').appendTo(spChg);
            var ctx = msgManager.getListContext(msg);
            o.contexts[ctx.docKey] = ctx;
            row.attr('data-msgdir', msg.direction);
            row.attr('data-portId', msg.portId);
            (msg.direction === 'out') ? row.addClass('outbound') : row.addClass('inbound');
            $('<span></span>').text(ctx.protocol.name).appendTo($('<td></td>').appendTo(row));
            $('<span></span>').text(ctx.sourceAddr.name).appendTo($('<td></td>').appendTo(row));
            $('<span></span>').text(ctx.destAddr.name).appendTo($('<td></td>').appendTo(row));
            $('<span></span>').text(ctx.actionName).appendTo($('<td></td>').appendTo(row));
            $('<span></span>').text(msg.payload.join(',')).appendTo($('<td></td>').appendTo(row));
            if (typeof msg.isValid !== 'undefined' && !msg.isValid) row.addClass('invalid');
            var prev = o.messageKeys[ctx.messageKey];
            var hasChanged = false;
            if (typeof prev === 'undefined')
                hasChanged = true;
            else if (msgManager.isMessageDiff(msg, prev, ctx))
                hasChanged = true;

            if (hasChanged) {
                row.addClass('changed');
                typeof prev === 'undefined' ? spChg.addClass('new') : spChg.addClass('changed');
                chg.addClass('fa-dot-circle');
            }
            else
                row.addClass('nochange');
            row.addClass('changed');

            o.messageKeys[ctx.messageKey] = msg;
            row.attr('data-msgkey', ctx.messageKey);
            row.attr('data-dockey', ctx.docKey);
            row.data('message', msg);
            if (!o.pinScrolling && autoSelect !== false) {
                if (!o.changesOnly || (o.changesOnly && hasChanged)) {
                    self._scrollToRow(row);
                    self._selectRow(row, prev, ctx);
                }
            }
        },
        receivingMessages: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined') {
                o.receivingMessages = val;
                if (o.receivingMessages) {
                    el.find('div.picStartLogs > i').removeClass('far').addClass('fas');
                    el.find('div.picStartLogs').addClass('selected');
                }
                else {
                    el.find('div.picStartLogs > i').removeClass('fas').addClass('far');
                    el.find('div.picStartLogs').removeClass('selected');

                }
            }
            else {
                return o.receivingMessages;
            }
        },
        _toggleInlineExpansion: function (row, msg, prev, forMsg, context, forceOpen) {
            var self = this, o = self.options, el = self.element;
            var rowId = row.attr('data-rowid');
            
            // Check if expansion already exists WITHIN the row (new approach)
            var expansionDiv = row.find('div.inline-expansion-content');
            var isAlreadyOpen = expansionDiv.length > 0;
            
            // Get virtual list reference to update stored HTML
            var vlist = el.find('div.picVirtualList:first');
        
            // CASE 1: Row is already open
            if (isAlreadyOpen) {
                if (forceOpen) return; // It's already there, do nothing.
                
                // User Clicked -> Close it (Toggle)
                row.removeClass('row-expanded');
                expansionDiv.remove();
                delete o.expandedRows[rowId];
                
                // Update stored HTML in virtual list so it persists through re-renders
                self._updateStoredRowHtml(vlist, rowId, row);
                return;
            }
        
            // CASE 2: Row is closed -> Open it
            if (!forceOpen) {
                self._closeAllExpandedRows();
            }
            
            // Build expanded content as a div INSIDE the row's first cell (Port column)
            // This way it becomes part of the row's stored HTML and survives virtual list re-renders
            var firstCell = row.find('td:first');
            var container = $('<div class="inline-expansion-content"></div>');
            
            // Add action buttons in top-right corner
            var btnContainer = $('<div class="expansion-buttons"></div>');
            
            // Add to queue button
            var addToQueueBtn = $('<div class="expansion-addqueue-btn" title="Add to Send Queue"><i class="far fa-hand-point-up"></i></div>');
            addToQueueBtn.on('click', function(evt) {
                evt.stopPropagation();
                $('div.picSendMessageQueue')[0].addMessage(msg);
            });
            btnContainer.append(addToQueueBtn);
            
            // Close button
            var closeBtn = $('<div class="expansion-close-btn" title="Close"><i class="fas fa-times"></i></div>');
            btnContainer.append(closeBtn);
            
            container.append(btnContainer);
            
            // Hex Display section
            var hexSection = $('<div class="inline-hex-display"></div>');
            container.append(hexSection);
            
            // Payload Display section
            var payloadSection = $('<div class="inline-payload-section"></div>');
            container.append(payloadSection);
            
            // Append to first cell
            firstCell.append(container);
            
            // Build hex display (needs to be after container is in DOM for width calculations)
            self._buildCompactHexDisplay(hexSection, msg, prev, context);
        
            row.addClass('row-expanded');
            o.expandedRows[rowId] = true;
            
            // Update stored HTML immediately for the hex display
            self._updateStoredRowHtml(vlist, rowId, row);
            
            // Now bind payload descriptors (async) with a callback to update stored HTML again
            var pnlDetail = $('div.picMessageDetail');
            if (pnlDetail.length > 0 && typeof pnlDetail[0].bindPayloadDescriptors === 'function') {
                pnlDetail[0].bindPayloadDescriptors(payloadSection, msg, context, function() {
                    // Async callback: Update stored HTML again after payload table is built
                    // Need to re-find the row in case DOM changed during async call
                    var currentRow = el.find('tr.msgRow[data-rowid="' + rowId + '"]');
                    if (currentRow.length > 0) {
                        self._updateStoredRowHtml(vlist, rowId, currentRow);
                    }
                });
            }
        },
        _closeAllExpandedRows: function () {
            var self = this, o = self.options, el = self.element;
            var vlist = el.find('div.picVirtualList:first');
            
            // Find all expanded rows and close them
            el.find('tr.msgRow.row-expanded').each(function() {
                var $row = $(this);
                var rowId = $row.attr('data-rowid');
                
                $row.removeClass('row-expanded');
                $row.find('div.inline-expansion-content').remove();
                
                if (rowId) {
                    delete o.expandedRows[rowId];
                    // Update stored HTML so it persists through re-renders
                    self._updateStoredRowHtml(vlist, rowId, $row);
                }
            });
        },
        _updateStoredRowHtml: function(vlist, rowId, row) {
            // Update the stored outerHTML in the virtual list's rows array
            // This is critical - the virtual list stores rows as HTML strings and
            // completely replaces innerHTML on scroll. We must update the stored
            // string to include/exclude our expansion content.
            var ndx = parseInt(rowId, 10);
            if (vlist.length > 0 && typeof vlist[0].objByIndex === 'function') {
                var rowObj = vlist[0].objByIndex(ndx);
                if (rowObj) {
                    rowObj.row = row[0].outerHTML;
                }
            }
        },
        _buildCompactHexDisplay: function (container, msg, prev, context) {
            var self = this, o = self.options, el = self.element;
            
            // Validate context
            if (!context) {
                console.warn('No context provided to _buildCompactHexDisplay');
                container.append('<div class="compact-hex-header">Message information not available</div>');
                return;
            }
            
            // Add header with message info - Row 1
            var header = $('<div class="compact-hex-header"></div>');
            var row1 = $('<div class="hex-info-row"></div>').appendTo(header);
            
            // Protocol
            row1.append('<span class="hex-label">Protocol:</span> <span class="hex-value">' + (context.protocol ? context.protocol.name : 'Unknown') + '</span>');
            
            // Source with byte address
            row1.append('<span class="hex-label">Source:</span> ');
            if (context.sourceByte !== undefined) {
                row1.append('[<span class="hex-byte">' + context.sourceByte + '</span>] ');
            }
            row1.append('<span class="hex-value">' + (context.sourceAddr ? context.sourceAddr.name : 'Unknown') + '</span>');
            
            // Arrow
            row1.append(' <i class="fas fa-arrow-right hex-arrow"></i> ');
            
            // Dest with byte address
            row1.append('<span class="hex-label">Dest:</span> ');
            if (context.destByte !== undefined) {
                row1.append('[<span class="hex-byte">' + context.destByte + '</span>] ');
            }
            row1.append('<span class="hex-value">' + (context.destAddr ? context.destAddr.name : 'Unknown') + '</span>');
            
            // Action
            row1.append('<span class="hex-label">Action:</span> ');
            if (context.actionByte !== undefined) {
                row1.append('[<span class="hex-byte">' + context.actionByte + '</span>] ');
            }
            row1.append('<span class="hex-value">' + (context.actionName || 'Unknown') + '</span>');
            
            // Row 2 - Additional details
            var row2 = $('<div class="hex-info-row"></div>').appendTo(header);
            
            // Timestamp
            row2.append('<span class="hex-label">Timestamp:</span> <span class="hex-value">' + (msg.timestamp || '') + '</span>');
            
            // Data Length
            row2.append('<span class="hex-label">Length:</span> <span class="hex-value">' + (msg.payload ? msg.payload.length : 0) + ' bytes</span>');
            
            // Padding
            if (msg.padding && msg.padding.length > 0) {
                row2.append('<span class="hex-label">Padding:</span> <span class="hex-value">[' + msg.padding.join(',') + ']</span>');
            }
            
            // Header
            if (msg.header && msg.header.length > 0) {
                row2.append('<span class="hex-label">Header:</span> <span class="hex-value">[' + msg.header.join(',') + ']</span>');
            }
            
            // Term
            if (msg.term && msg.term.length > 0) {
                row2.append('<span class="hex-label">Term:</span> <span class="hex-value">[' + msg.term.join(',') + ']</span>');
            }
            
            container.append(header);
            
            // Add hex bytes in table format (like original)
            if (msg.payload && msg.payload.length > 0) {
                // Calculate how many bytes fit per row based on ACTUAL container width
                var containerWidth = container.width();
                if (!containerWidth || containerWidth < 100) {
                    // Container not rendered yet or too small, use parent or default
                    containerWidth = container.parent().width() || container.closest('.inline-message-detail').width() || 1200;
                }
                console.log('Container width for byte calculation:', containerWidth);
                
                // Each byte cell is ~26px (22px width + 2px padding + 2px border)
                var bytesPerRow = Math.floor((containerWidth - 20) / 26); // -20 for margins
                if (bytesPerRow < 10) bytesPerRow = 10; // Minimum 10 bytes per row
                if (bytesPerRow > msg.payload.length) bytesPerRow = msg.payload.length; // Don't exceed payload length
                
                console.log('Bytes per row:', bytesPerRow, 'for payload length:', msg.payload.length);
                
                var tbl = $('<table class="compact-payload-table"></table>');
                var tbody = $('<tbody></tbody>').appendTo(tbl);
                
                // Create rows for: header (index), decimal, ascii, hex
                var headerRow = $('<tr class="compact-payload-header"></tr>').appendTo(tbody);
                var decimalRow = $('<tr class="compact-payload-decimal"></tr>').appendTo(tbody);
                var asciiRow = $('<tr class="compact-payload-ascii"></tr>').appendTo(tbody);
                var hexRow = $('<tr class="compact-payload-hex"></tr>').appendTo(tbody);
                
                var p = (prev && prev.payload) ? prev.payload : [];
                
                for (var i = 0; i < msg.payload.length; i++) {
                    // Add new row set dynamically based on calculated width
                    if (i > 0 && i % bytesPerRow === 0) {
                        headerRow = $('<tr class="compact-payload-header"></tr>').appendTo(tbody);
                        decimalRow = $('<tr class="compact-payload-decimal"></tr>').appendTo(tbody);
                        asciiRow = $('<tr class="compact-payload-ascii"></tr>').appendTo(tbody);
                        hexRow = $('<tr class="compact-payload-hex"></tr>').appendTo(tbody);
                    }
                    
                    var byteVal = msg.payload[i];
                    var prevVal = (p && i < p.length) ? p[i] : undefined;
                    var isChanged = (prevVal !== undefined && prevVal !== byteVal);
                    
                    // Header cell (index)
                    var hCell = $('<td class="compact-byte-header"></td>').text(i);
                    hCell.attr('data-byte-index', i);
                    if (isChanged) hCell.addClass('byte-changed');
                    headerRow.append(hCell);
                    
                    // Decimal cell
                    var dCell = $('<td class="compact-byte-decimal"></td>').text(byteVal);
                    if (isChanged) dCell.addClass('byte-changed');
                    decimalRow.append(dCell);
                    
                    // ASCII cell
                    var asciiChar = (byteVal >= 32 && byteVal <= 126) ? String.fromCharCode(byteVal) : '.';
                    var aCell = $('<td class="compact-byte-ascii"></td>').text(asciiChar);
                    if (isChanged) aCell.addClass('byte-changed');
                    asciiRow.append(aCell);
                    
                    // Hex cell
                    var hexVal = byteVal.toString(16).toUpperCase().padStart(2, '0');
                    var xCell = $('<td class="compact-byte-hex"></td>').text(hexVal);
                    if (isChanged) xCell.addClass('byte-changed');
                    hexRow.append(xCell);
                }
                
                container.append(tbl);
                
                // Add click handler for bytes to highlight corresponding row
                tbl.on('click', 'td[data-byte-index]', function(e) {
                    e.stopPropagation();
                    var byteIndex = parseInt($(this).attr('data-byte-index'), 10);
                    self._highlightRowForByte(container, byteIndex);
                });
            }
        },
        _highlightRowForByte: function(container, byteIndex) {
            var self = this;
            // Find which payload descriptor row contains this byte
            var descriptorTable = container.closest('.inline-message-detail').find('table.payload-descriptor-table');
            var targetRow = null;
            
            descriptorTable.find('tr.payload-descriptor-row').each(function() {
                var start = parseInt($(this).attr('data-start'), 10);
                var length = parseInt($(this).attr('data-length'), 10);
                var end = start + length - 1;
                
                if (byteIndex >= start && byteIndex <= end) {
                    targetRow = $(this);
                    return false; // break
                }
            });
            
            if (targetRow) {
                // Clear previous selections
                descriptorTable.find('tr.selected').removeClass('selected');
                container.find('td.byte-selected').removeClass('byte-selected');
                
                // Select the row
                targetRow.addClass('selected');
                
                // Highlight the bytes
                var start = parseInt(targetRow.attr('data-start'), 10);
                var length = parseInt(targetRow.attr('data-length'), 10);
                for (var i = start; i < start + length; i++) {
                    container.find('td[data-byte-index="' + i + '"]').addClass('byte-selected');
                }
                
                // Scroll row into view
                targetRow[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    });
    $.widget("pic.messageDetail", {
        options: { message: null },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].bindMessage = function (msg, prev, msgFor, ctx) { self.bindMessage(msg, prev, msgFor, ctx); };
            el[0].bindPayloadDescriptors = function (container, msg, ctx, onComplete) { self.bindPayloadDescriptors(container, msg, ctx, onComplete); };
            self._initHeader();
            self._initMessageDetails();
            self._initApiCallDetails();
        },
        _initHeader: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            var div = $('<div class="picMessageListTitle picControlPanelTitle control-panel-title"></div>').appendTo(el);
            $('<span class="picMessageDirection" data-bind="direction"></span><span>Message Details</span>').appendTo(div);
            $('<div class="picAddToQueue mmgrButton picIconRight" title="Push to Send Queue"><i class="far fa-hand-point-up"></i></div>').appendTo(div).hide();
            $('<div class="picDocumentSignature mmgrButton picIconRight" title="Document this Message Signature"><i class="fas fa-file-signature"></i></div>').appendTo(div).hide();
        },
        _initApiCallDetails: function () {
            var self = this, o = self.options, el = self.element;
            var divOuter = $('<div class="api-detail-info" style="display:none;"></div>').appendTo(el);
            div = $('<div></div>').appendTo(divOuter).addClass('msg-detail-section').addClass('apiDetails');
            var line = $('<div class="dataline"><div>').appendTo(div);
            $('<label>Timestamp:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'timestamp');
            line = $('<div class="dataline"><div>').appendTo(div);
            $('<label>Requestor:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'requestor');
            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Method:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'method');
            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Path:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'path');
            $('<div></div>').appendTo(div).addClass('api-callbody');
        },
        _initMessageDetails: function () {
            var self = this, o = self.options, el = self.element;
            //[255, 0, 255][165, 63, 15, 16, 2, 29][9, 47, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 2, 0, 80, 80, 0, 241, 85, 105, 24, 246, 0, 0, 0, 0, 0, 255, 0][255, 165]
            var msgDiv = $('<div class="msg-detail-info"></div>').appendTo(el);
            var divOuter = $('<div class="msg-detail-panel" style="display:none;"></div>').appendTo(msgDiv);

            div = $('<div></div>').appendTo(divOuter).addClass('msg-detail-section').addClass('details');
            var line = $('<div class="dataline"><div>').appendTo(div);
            line = $('<div class="dataline"><div>').appendTo(div);
            $('<label>Port:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'portId');

            line = $('<div class="dataline"><div>').appendTo(div);
            $('<label>Protocol:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'protocol');

            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Source/Dest:</label>').appendTo(line);
            $('<span></span>').appendTo(line).text('[');
            $('<span></span>').appendTo(line).addClass('msg-detail-byte').attr('data-bind', 'sourceByte');
            $('<span></span>').appendTo(line).text('] ');
            $('<span></span>').appendTo(line).attr('data-bind', 'source');
            $('<i></i>').appendTo(line).addClass('fas').addClass('fa-arrow-right').addClass('msg-detail-fromto');
            $('<span></span>').appendTo(line).text('[');
            $('<span></span>').appendTo(line).addClass('msg-detail-byte').attr('data-bind', 'destByte');
            $('<span></span>').appendTo(line).text('] ');
            $('<span></span>').appendTo(line).attr('data-bind', 'dest');


            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Action:</label>').appendTo(line);
            $('<span></span>').appendTo(line).text('[');
            $('<span></span>').appendTo(line).addClass('msg-detail-byte').attr('data-bind', 'actionByte');
            $('<span></span>').appendTo(line).text('] ');
            $('<span></span>').appendTo(line).attr('data-bind', 'action');

            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Timestamp:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'timestamp');
            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Data Length:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'dataLen');

            div = $('<div></div>').appendTo(divOuter).addClass('msg-detail-section').addClass('bytearrays');
            line = $('<div class="dataline"></div>').appendTo(div).css({ textAlign: 'center' });
            $('<div class="msg-invalid-banner"></div>').appendTo(line).text('Invalid Message');

            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Padding:</label>').appendTo(line);
            $('<span></span>').appendTo(line).addClass('msg-detail-bytearray').attr('data-bind', 'padding');
            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Header:</label>').appendTo(line);
            $('<span></span>').appendTo(line).addClass('msg-detail-bytearray').attr('data-bind', 'header');
            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Term:</label>').appendTo(line);
            $('<span></span>').appendTo(line).addClass('msg-detail-bytearray').attr('data-bind', 'term');

            line = $('<div class="dataline msg-detail-response"></div>').appendTo(div).hide();
            $('<label title="Response For">Resp For:</label>').appendTo(line);
            $('<span></span>').appendTo(line).addClass('msg-detail-bytearray').attr('data-bind', 'responseFor');
            $('<span></span>').appendTo(line).attr('data-bind', 'responseTime').attr('data-fmttype', 'number').attr('data-fmtmask', '#,###').css({ marginLeft: '7px', verticalAlign:'top', display:'inline-block' });
            $('<span></span>').appendTo(line).text('ms').css({ verticalAlign: 'top', display: 'inline-block' });
            $('<div class="payloadBytes"></div>').appendTo(div);
            $('<div class="msg-payload"></div>').appendTo(msgDiv);
            div = $('<div></div>').appendTo(divOuter).addClass('msg-detail-section');
            el.on('click', 'div.picAddToQueue', function (evt) {
                if (typeof o.message !== 'undefined' && o.message) {
                    $('div.picSendMessageQueue')[0].addMessage(o.message);
                }
            });
            el.on('click', 'td.payload-byte', function (evt) {
                self.showByteDiff(evt.currentTarget);
                evt.stopImmediatePropagation();
                evt.preventDefault();
            });
            el.on('click', 'div.picDocumentSignature', function (evt) {
                console.log('Opening doc signature');
                $.getLocalService('/messages/docs/' + o.context.docKey, undefined, function (docs, status, xhr) {
                    console.log(docs);
                    var docMsg = msgManager.toDocMessage(o.message, docs, o.context);
                    console.log(docMsg);
                    var divPopover = $('<div></div>');
                    divPopover.appendTo(el.parent().parent());
                    divPopover.on('initPopover', function (e) {
                        var doc = $('<div></div>').appendTo(e.contents()).messageDoc({ message: o.message })[0].bindMessage(docMsg);
                        e.stopImmediatePropagation();
                    });
                    divPopover.popover({ autoClose: false, title: 'Edit Message Documentation', popoverStyle: 'modal', placement: { target: $('div.picMessageListTitle:first') } });
                    divPopover[0].show($('div.picMessageListTitle:first'));
                });
                evt.preventDefault();
                evt.stopImmediatePropagation();

            });
            el.on('click', function (evt) {
                el.find('tr.msg-payload-header > td.selected').removeClass('selected');
                el.find('div.msg-payload-bytediff').remove();
            });
        },
        _bindCallBody: function (level, obj, divObj) {
            var self = this, o = self.options, el = self.element;
            for (var s in obj) {
                var divVal = $('<div></div>').appendTo(divObj).addClass('callbody-value-outer');
                var val = obj[s];
                if (val === null) {
                    $('<label></label>').appendTo(divVal).addClass('callbody-name').text(s + ':');
                    $('<span></span>').appendTo(divVal).attr('data-type', 'null').addClass('callbody-value').text(`${val}`);
                    divVal.attr('data-expanded', true);
                }
                else if (typeof val === 'number' || typeof val === 'boolean') {
                    $('<label></label>').appendTo(divVal).addClass('callbody-name').text(s + ':');
                    $('<span></span>').appendTo(divVal).attr('data-type', typeof val).addClass('callbody-value').text(`${val}`);
                    divVal.attr('data-expanded', true);
                }
                else if (typeof val === 'string') {
                    $('<label></label>').appendTo(divVal).addClass('callbody-name').text(s + ':');
                    $('<span></span>').appendTo(divVal).attr('data-type', typeof val).addClass('callbody-value').text(`"${val}"`);
                    divVal.attr('data-expanded', true);
                }
                else if (typeof val === 'object' && Array.isArray(val)) {
                    $('<i class="fas fa-caret-right"></i>').appendTo(divVal).addClass('callbody-expand');
                    $('<label></label>').appendTo(divVal).attr('data-type', typeof val).addClass('callbody-name').text(s + ':');
                    divVal.attr('data-expanded', level === 0);

                    self._bindCallBody(level + 1, val, divVal);
                }
                else if (typeof val === 'object') {
                    $('<i class="fas fa-caret-right"></i>').appendTo(divVal).addClass('callbody-expand');
                    $('<label></label>').appendTo(divVal).attr('data-type', typeof val).addClass('callbody-name').text(s + ':');
                    divVal.attr('data-expanded', level === 0);
                    self._bindCallBody(level + 1, val, divVal);
               }
            }
        },
        _bindMessage: function (msg, prev, msgFor, ctx) {
            var self = this, o = self.options, el = self.element;
            el.find('div.msg-detail-info').show();
            el.find('div.api-detail-info').hide();
            var obj = {
                portId: 0,
                protocol: '',
                title: '',
                source: '',
                dest: '',
                action: '',
                timestamp: '',
                dataLen: '',
                direction: ''
            };
            if (typeof msg === 'undefined')
                el.find('div.msg-detail-panel').hide();
            else {
                el.find('div.msg-detail-panel').show();
                if (typeof ctx === 'undefined') ctx = msgManager.getListContext(msg);
                //ctx = msgManager.getListContext(msg);
                //console.log({ ctx: ctx, msg: msg });
                o.context = ctx;
                obj = {
                    isValid: msg.valid || msg.isValid,
                    portId: msg.portId,
                    protocol: ctx.protocol.desc,
                    source: ctx.sourceAddr.name,
                    sourceByte: ctx.sourceByte,
                    dest: ctx.destAddr.name,
                    destByte: ctx.destByte,
                    action: ctx.actionName,
                    actionByte: ctx.actionByte,
                    timestamp: msg.timestamp,
                    dataLen: msg.payload.length,
                    direction: msg.direction === 'in' ? 'Inbound ' : 'Outbound ',
                    header: typeof msg.header !== 'undefined' ? msg.header.join(',') : [],
                    padding: typeof msg.padding !== 'undefined' ? msg.padding.join(',') : [],
                    term: typeof msg.term !== 'undefined' ? msg.term.join(',') : [],
                    responseFor: ''
                };
                if (typeof msg.responseFor !== 'undefined' && msg.responseFor.length > 0 && typeof msgFor !== 'undefined') {
                    // Find the first message in the list.
                    obj.responseTime = Date.parse(msg.timestamp.trim()) - Date.parse(msgFor.timestamp.trim());
                }
                obj.responseFor = typeof msg.responseFor !== 'undefined' && msg.responseFor.length ? msg.responseFor.join(',') : '';
                // Delete all the dynamic styles for selection.
                var styleResp = $('#responseStyles');
                var sheet = styleResp[0].sheet;
                for (var rule = sheet.cssRules.length - 1; rule >= 0; rule--) sheet.deleteRule(rule);
                if (typeof msg.responseFor !== 'undefined') {
                    el.find('div.msg-detail-response').show();

                    // Add in all the rules where the reference is valid.
                    for (var n = 0; n < msg.responseFor.length; n++) {
                        sheet.addRule('tr.msgRow[data-msgid="' + (msg.responseFor[n]) + '"] > td.msg-action', 'background-color:yellow;font-weight:bold;');
                    }
                }
                else
                    el.find('div.msg-detail-response').hide();

                //console.log(sheet);
            }
            if (msg.isValid === false) {
                el.addClass('invalid');
                el.find('div.picDocumentSignature').hide();
            }
            else {
                el.find('div.picDocumentSignature').show();
                el.removeClass('invalid');
            }
            el.find('div.picAddToQueue').show();
            o.message = msg;

            dataBinder.bind(el, obj);
            self.bindPayload(msg, prev);
        },
        _bindApiCall: function (call) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picAddToQueue').hide();
            el.find('div.msg-detail-info').hide();
            el.find('div.api-detail-info').show();
            dataBinder.bind(el, call);
            var divBody = el.find('div.api-callbody');
            divBody.empty();
            self._bindCallBody(0, call.body, divBody);
        },
        bindMessage: function (msg, prev, ctx) {
            var self = this, o = self.options, el = self.element;
            //console.log(msg);
            if (msg.protocol === 'api') {
                self._bindApiCall(msg, prev, ctx);
            }
            else {
                self._bindMessage(msg, prev, ctx);
            }
        },
        showByteDiff: function (cell) {
            var self = this, o = self.options, el = self.element;
            var ndx = $(cell).attr('data-payload-byte-index');
            var divs = el.find('div.msg-payload-bytediff');
            if (divs.length > 0) {
                el.find('tr.msg-payload-header > td.selected').removeClass('selected');
                if (divs.attr('data-payload-byte-index') === ndx) {
                    divs.remove();
                    el.find('tr.msg-payload-header > td.selected').removeClass('selected');
                    return;
                }
                else divs.remove();
            }
            $(cell).parents('table.msg-payload:first').find('tbody > tr.msg-payload-header > td[data-payload-byte-index="' + ndx + '"]').each(function () {
                var bprev = parseInt($(this).attr('data-prevbyte'), 10);
                var bcurr = parseInt($(this).attr('data-byte'), 10);
                var diff = self._createByteDiff(ndx, bprev, bcurr).appendTo($(this));
                var p = {
                    my: 'left bottom',
                    at: 'left-10 top',
                    of: $(this),
                    collision: 'flipfit',
                    within: window
                };
                diff.attr('data-payload-byte-index', ndx);
                diff.position(p);
                $(this).addClass('selected');

                //diff.css({ top: (diff[0].offsetHeight - 15) + 'px' });
            });
        },
        _createByteDiff: function (ndx, bprev, bcurr) {
            var self = this, o = self.options, el = self.element;
            var diff = $('<div class="msg-payload-bytediff"></diff>');
            var tbody = $('<tbody></tbody>').appendTo($('<table class="msg-payload-bytediff"></table>').appendTo(diff));
            var rowHead = $('<tr></tr>').addClass('bytediff-header').appendTo(tbody);
            var rowCurr = $('<tr></tr>').addClass('bytediff-curr').appendTo(tbody);
            var makeBinaryTable = function (val) {
                var tbl = $('<table></table>').addClass('bytediff-bit');
                var tbody = $('<tbody></tbody>').appendTo(tbl);
                var row = $('<tr></tr>').appendTo(tbody);
                if (typeof val === 'undefined') row.addClass('bydiff-bit-header');
                for (var i = 7; i >= 0; i--) {
                    $('<td></td>').appendTo(row).text(typeof val === 'undefined' ? i + 1 : (0xFF & val & (1 << i)) > 0 ? 1 : 0);
                }
                return tbl;
            };
            $('<td></td>').addClass('bytediff-name').appendTo(rowHead).text(ndx);
            $('<td></td>').addClass('bytediff-name').appendTo(rowCurr).text('Current');
            $('<td></td>').addClass('bytediff-dec').appendTo(rowHead).text('dec');
            $('<td></td>').addClass('bytediff-dec').appendTo(rowCurr).text(bcurr);
            $('<td></td>').addClass('bytediff-ascii').appendTo(rowHead).text('ascii');
            $('<td></td>').addClass('bytediff-ascii').appendTo(rowCurr).text(msgManager.toAscii(bcurr));
            $('<td></td>').addClass('bytediff-hex').appendTo(rowHead).text('hex');
            $('<td></td>').addClass('bytediff-hex').appendTo(rowCurr).text(msgManager.toHex(bcurr));
            var cellBinHead = $('<td></td>').addClass('bytediff-binary').appendTo(rowHead);
            makeBinaryTable().appendTo($('<div></div>').appendTo(cellBinHead));
            makeBinaryTable(bcurr).appendTo($('<td></td>').appendTo(rowCurr));
            if (typeof bprev !== 'undefined' && !isNaN(bprev)) {
                var rowPrev = $('<tr></tr>').addClass('bytediff-prev').appendTo(tbody);
                $('<td></td>').addClass('bytediff-name').appendTo(rowPrev).text('Previous');
                $('<td></td>').addClass('bytediff-dec').appendTo(rowPrev).text(bprev);
                $('<td></td>').addClass('bytediff-ascii').appendTo(rowPrev).text(msgManager.toAscii(bprev));
                $('<td></td>').addClass('bytediff-hex').appendTo(rowPrev).text(msgManager.toHex(bprev));
                makeBinaryTable(bprev).appendTo($('<td></td>').appendTo(rowPrev));
            }
            return diff;
        },
        bindPayload: function (msg, prev) {
            var self = this, o = self.options, el = self.element;
            var div = el.find('div.msg-payload:first');
            div.empty();
            if (typeof msg === 'undefined') return;
            var tbl = $('<table class="msg-payload"><tbody></tbody></table>').appendTo(div);
            var header = $('<tr class="msg-payload-header"></tr>').appendTo(tbl.find('tbody:first'));
            var decimal = $('<tr class="msg-payload-decimal"></tr>').appendTo(tbl.find('tbody:first'));
            var ascii = $('<tr class="msg-payload-ascii"></tr>').appendTo(tbl.find('tbody:first'));
            var hex = $('<tr class="msg-payload-hex"></tr>').appendTo(tbl.find('tbody:first'));
            var p = typeof prev !== 'undefined' && typeof prev.payload !== 'undefined' ? prev.payload : [];
            for (var i = 0; i < msg.payload.length; i++) {
                var bdec = msg.payload[i];
                var pdec = msgManager.extractByte(p, i);
                var bascii = msgManager.toAscii(bdec);
                var bhex = msgManager.toHex(bdec);
                if (i % 20 === 0 && i > 0) {
                    header = $('<tr class="msg-payload-header"></tr>').appendTo(tbl.find('tbody:first'));
                    decimal = $('<tr class="msg-payload-decimal"></tr>').appendTo(tbl.find('tbody:first'));
                    ascii = $('<tr class="msg-payload-ascii"></tr>').appendTo(tbl.find('tbody:first'));
                    hex = $('<tr class="msg-payload-hex"></tr>').appendTo(tbl.find('tbody:first'));
                }
                var chead = $('<td></td>').appendTo(header).attr('data-payload-byte-index', i).text(i);
                var cdec = $('<td class="payload-byte"></td>').attr('data-payload-byte-index', i).appendTo(decimal).text(bdec);
                var cascii = $('<td class="payload-byte"></td>').attr('data-payload-byte-index', i).appendTo(ascii).text(bascii);
                var chex = $('<td class="payload-byte"></td>').attr('data-payload-byte-index', i).appendTo(hex).text(bhex);
                chead.attr('data-byte', bdec);
                if (typeof pdec !== 'undefined' && pdec !== bdec) {
                    chead.attr('data-prevbyte', pdec);
                    cdec.addClass('payload-change');//.attr('title', 'prev: ' + pdec);
                    chex.addClass('payload-change');//.attr('title', 'prev: ' +  msgManager.toHex(pdec));
                    cascii.addClass('payload-change');//.attr('title', 'prev: ' + msgManager.toAscii(pdec));
                }
            }
            
            // Add payload descriptor table if documentation exists
            self.bindPayloadDescriptors(div, msg, o.context);
        },
        bindPayloadDescriptors: function (container, msg, context, onComplete) {
            var self = this, o = self.options, el = self.element;
            
            // Get the documentation for this message
            $.getLocalService('/messages/docs/' + context.docKey, undefined, function (docs, status, xhr) {
                
                if (!docs || !docs.payload || docs.payload.length === 0) {
                    // Still call the callback even if no docs, so stored HTML gets updated
                    if (typeof onComplete === 'function') onComplete();
                    return;
                }
                
                var divDesc = $('<div class="payload-descriptors"></div>').appendTo(container);
                var tblDesc = $('<table class="payload-descriptor-table"><thead><tr><th>Start</th><th>Length</th><th>Name</th><th>Current</th><th>Previous</th><th>Decimal</th><th>ASCII</th><th>Binary</th><th>Decoded Value</th><th>Description</th><th>Desc 2</th></tr></thead><tbody></tbody></table>').appendTo(divDesc);
                var tbody = tblDesc.find('tbody');
                
                // Build descriptor rows
                for (var i = 0; i < docs.payload.length; i++) {
                    var pl = docs.payload[i];
                    var row = $('<tr class="payload-descriptor-row"></tr>').appendTo(tbody);
                    row.attr('data-start', pl.start);
                    row.attr('data-length', pl.length);
                    row.attr('data-payload-range', pl.start + '-' + (pl.start + pl.length - 1));
                    
                    $('<td class="desc-start"></td>').appendTo(row).text(pl.start);
                    $('<td class="desc-length"></td>').appendTo(row).text(pl.length);
                    $('<td class="desc-name"></td>').appendTo(row).text(pl.name || '');
                    
                    // Extract actual byte values from message payload
                    var currentBytes = [];
                    var previousBytes = [];
                    var decimalValue = '';
                    var asciiValue = '';
                    var binaryValue = '';
                    var decodedValue = '';
                    
                    if (msg.payload && pl.start < msg.payload.length) {
                        // Get current bytes
                        for (var b = 0; b < pl.length && (pl.start + b) < msg.payload.length; b++) {
                            var byteIdx = pl.start + b;
                            currentBytes.push(msg.payload[byteIdx]);
                        }
                        
                        // Get previous bytes if diff exists
                        if (msg.payloadDiff) {
                            for (var b = 0; b < pl.length && (pl.start + b) < msg.payloadDiff.length; b++) {
                                var byteIdx = pl.start + b;
                                previousBytes.push(msg.payloadDiff[byteIdx]);
                            }
                        }
                        
                        // Calculate values based on length
                        if (pl.length === 1) {
                            // Single byte
                            var byteVal = currentBytes[0];
                            decimalValue = byteVal.toString();
                            asciiValue = (byteVal >= 32 && byteVal <= 126) ? String.fromCharCode(byteVal) : '.';
                            binaryValue = byteVal.toString(2).padStart(8, '0');
                            
                            // Decode value based on descriptor values
                            if (typeof pl.values === 'object' && !Array.isArray(pl.values)) {
                                decodedValue = pl.values[byteVal] || pl.values[byteVal.toString()] || 'Unknown (' + byteVal + ')';
                            } else if (pl.dataType === 'bits') {
                                // Show bit representation
                                var bits = [];
                                for (var bit = 7; bit >= 0; bit--) {
                                    if (byteVal & (1 << bit)) bits.push('Bit' + bit);
                                }
                                decodedValue = bits.length > 0 ? bits.join(', ') : 'None';
                            } else {
                                decodedValue = byteVal.toString();
                            }
                        } else if (pl.length === 2) {
                            // 2-byte integer (big-endian)
                            var intVal = (currentBytes[0] << 8) | currentBytes[1];
                            decimalValue = intVal.toString();
                            binaryValue = intVal.toString(2).padStart(16, '0');
                            asciiValue = '-';
                            
                            // Decode value
                            if (typeof pl.values === 'object' && !Array.isArray(pl.values)) {
                                decodedValue = pl.values[intVal] || pl.values[intVal.toString()] || intVal.toString();
                            } else {
                                decodedValue = intVal.toString();
                            }
                        } else if (pl.length === 4) {
                            // 4-byte integer (big-endian)
                            var intVal = (currentBytes[0] << 24) | (currentBytes[1] << 16) | (currentBytes[2] << 8) | currentBytes[3];
                            decimalValue = intVal.toString();
                            asciiValue = '-';
                            binaryValue = intVal.toString(2);
                            decodedValue = intVal.toString();
                        } else {
                            // Multi-byte (show as string or hex sequence)
                            decimalValue = currentBytes.join(', ');
                            
                            // Try as ASCII string if dataType is string
                            if (pl.dataType === 'string') {
                                asciiValue = '';
                                for (var b = 0; b < currentBytes.length; b++) {
                                    var ch = currentBytes[b];
                                    asciiValue += (ch >= 32 && ch <= 126) ? String.fromCharCode(ch) : '.';
                                }
                                decodedValue = asciiValue.replace(/\./g, '').trim();
                            } else {
                                asciiValue = '-';
                                decodedValue = currentBytes.map(function(b) { return '0x' + b.toString(16).toUpperCase().padStart(2, '0'); }).join(' ');
                            }
                            binaryValue = '-';
                        }
                    }
                    
                    // Add data columns (after Name, before Description)
                    var currentCell = $('<td class="desc-current"></td>').appendTo(row);
                    if (currentBytes.length > 0) {
                        currentCell.text(currentBytes.map(function(b) { return '0x' + b.toString(16).toUpperCase().padStart(2, '0'); }).join(' '));
                    }
                    
                    var previousCell = $('<td class="desc-previous"></td>').appendTo(row);
                    if (previousBytes.length > 0) {
                        previousCell.text(previousBytes.map(function(b) { return '0x' + b.toString(16).toUpperCase().padStart(2, '0'); }).join(' '));
                        // Highlight if different
                        var isDifferent = false;
                        for (var b = 0; b < Math.min(currentBytes.length, previousBytes.length); b++) {
                            if (currentBytes[b] !== previousBytes[b]) {
                                isDifferent = true;
                                break;
                            }
                        }
                        if (isDifferent) {
                            currentCell.addClass('value-changed');
                            previousCell.addClass('value-changed');
                        }
                    }
                    
                    $('<td class="desc-decimal"></td>').appendTo(row).text(decimalValue);
                    $('<td class="desc-ascii"></td>').appendTo(row).text(asciiValue);
                    $('<td class="desc-binary"></td>').appendTo(row).text(binaryValue);
                    $('<td class="desc-decoded"></td>').appendTo(row).text(decodedValue);
                    
                    // Add description columns at the end
                    $('<td class="desc-description"></td>').appendTo(row).text(pl.desc || '');
                    
                    // Format Desc 2 column (formerly Values)
                    var valCell = $('<td class="desc-values"></td>').appendTo(row);
                    if (typeof pl.values === 'object' && !Array.isArray(pl.values)) {
                        // It's a lookup object
                        var valStr = [];
                        for (var key in pl.values) {
                            valStr.push(key + '=' + pl.values[key]);
                        }
                        valCell.text(valStr.join(', '));
                    } else {
                        valCell.text(pl.values || '');
                    }
                }
                
                // Add click handler for row selection
                tbody.on('click', 'tr.payload-descriptor-row', function(e) {
                    var $row = $(this);
                    var start = parseInt($row.attr('data-start'), 10);
                    var length = parseInt($row.attr('data-length'), 10);
                    
                    // Clear previous highlights in inline hex display
                    container.closest('.inline-message-detail').find('td.byte-selected').removeClass('byte-selected');
                    
                    // Toggle selection
                    if ($row.hasClass('selected')) {
                        $row.removeClass('selected');
                        self.clearPayloadHighlight();
                    } else {
                        tbody.find('tr.selected').removeClass('selected');
                        $row.addClass('selected');
                        
                        // Highlight bytes in inline compact hex display
                        for (var i = start; i < start + length; i++) {
                            container.closest('.inline-message-detail').find('td[data-byte-index="' + i + '"]').addClass('byte-selected');
                        }
                        
                        self.highlightPayloadBytes(start, length);
                    }
                });
                
                // Call the completion callback so caller can update stored HTML
                if (typeof onComplete === 'function') onComplete();
            });
        },
        highlightPayloadBytes: function (start, length) {
            var self = this, o = self.options, el = self.element;
            
            // Clear any existing highlights
            self.clearPayloadHighlight();
            
            // Highlight the specified byte range
            for (var i = start; i < start + length; i++) {
                var cells = el.find('td[data-payload-byte-index="' + i + '"]');
                cells.addClass('payload-highlighted');
            }
        },
        clearPayloadHighlight: function () {
            var self = this, o = self.options, el = self.element;
            el.find('td.payload-highlighted').removeClass('payload-highlighted');
        }
    });
    $.widget("pic.sendMessageQueue", {
        options: {},
        msgQueue: [],
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].bindQueue = function (queue) { self.bindQueue(queue); };
            el[0].newQueue = function () { self.newQueue(); };
            el[0].addMessage = function (msg) { self.addMessage(msg); };
            el[0].saveMessage = function (msg) { self.saveMessage(msg); };
            el[0].saveQueue = function () { self.saveQueue(); };
            el[0].loadQueue = function (id) { self.loadQueue(id); };
            self._initQueue();
        },
        _fromWindow: function(showError) {
            var self = this, o = self.options, el = self.element;
            var queue = dataBinder.fromElement(el);
            queue.messages = [];
            el.find('div.queue-send-list > div.queued-message').each(function () {
                queue.messages.push($(this).data('message'));
            });
            return queue;
        },
        _initQueue: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            div = $('<div class="picMessageListTitle picControlPanelTitle control-panel-title"></div>').appendTo(el);
            $('<span>Send Message Queue</span>').appendTo(div);
            $('<div class="picLoadQueue mmgrButton picIconRight" title="Load Saved Queue"><i class="far fa-folder-open"></i></div>').appendTo(div);
            $('<div class="picSaveQueue mmgrButton picIconRight" title="Save Queue"><i class="far fa-save"></i></div>').appendTo(div);
            $('<div class="picEditQueue mmgrButton picIconRight" title="Edit Queue"><i class="fas fa-edit"></i></div>').appendTo(div);
            $('<div class="picClearQueue mmgrButton picIconRight" title="New Queue"><i class="fas fa-bahai"></i></div>').appendTo(div);
            div = $('<div class="queue-detail-panel"></div>').appendTo(el);

            var line = $('<div class="dataline"></div>').appendTo(div);

            $('<input type="hidden" data-datatype="int" data-bind="id"></input>').appendTo(line);
            $('<label>Name:</label>').appendTo(line);
            $('<span data-bind="name"></span>').appendTo(line).attr('data-bind', 'name');
            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Description:</label>').appendTo(line);
            $('<span data-bind="description"></span>').appendTo(line).attr('data-bind', 'description');

            // Header for the queue list.
            div = $('<div class="queue-list-header"></div>').appendTo(el);
            $('<table class="queue-list-header"><tbody><tr><td></td><td>Proto</td><td>Src/Dest</td><td>Action</td><td>Payload</td><td>Delay</td><td></td></tr></tbody></table>').appendTo(div);
            div = $('<div class="queue-send-list"></div>').appendTo(el);
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
            $('<div></div>').attr('id', 'btnAddMessage').appendTo(btnPnl).actionButton({ text: 'Add Message', icon: '<i class="fas fa-plus" ></i>' }).on('click', function (e) {
                var controller = $(document.body).attr('data-controllertype') === 'intellicenter' ? 63 : 34;
                var msg = { protocol: 'broadcast', payload: [], header: [165, controller, 15, 16, 0, 0], term: [], delay:0 };
                var divPopover = $('<div></div>');
                divPopover.appendTo(el.parent().parent());
                divPopover.on('initPopover', function (e) {
                    $('<div></div>').appendTo(e.contents()).editMessage({ msgNdx: -1, message: msg });
                    e.stopImmediatePropagation();
                });
                divPopover.popover({ autoClose: false, title: 'Add Message to Queue', popoverStyle: 'modal', placement: { target: $('div.picMessageListTitle:first') } });
                divPopover[0].show($('div.picMessageListTitle:first'));
                e.preventDefault();
                e.stopImmediatePropagation();
            });
            $('<div></div>').attr('id', 'btnSendQueue').appendTo(btnPnl).actionButton({ text: 'Send Queue', icon: '<i class="far fa-paper-plane"></i>' }).on('click', function (e) {
                self.sendQueue();
            });
            $('<div></div>').attr('id', 'btnReplayQueue').appendTo(btnPnl).actionButton({ text: 'Replay (to app)', icon: '<i class="far fa-paper-plane"></i>' }).on('click', function (e) {
                self.replayQueue();
            });
            $('<div></div>').attr('id', 'btnRunTests').appendTo(btnPnl).actionButton({ text: 'Run Script', icon: '<i class="far fa-paper-plane"></i>' }).on('click', function (e) {
                el.addClass('processing');
                outModule.begin();
            }).hide();

            $('<div></div>').addClass('cancel-button').appendTo(btnPnl).actionButton({ text: 'Cancel Processing', icon: '<i class="fas fa-ban burst-animated" style="color:crimson;vertical-align:top;"></i>' }).on('click', function (e) {
                self.msgQueue.length = 0;
                el.removeClass('processing');
                outModule.cancel();
            });
            
            el.on('click', 'div.queued-message-remove', function (evt) {
                if (el.hasClass('processing')) return;
                $(evt.currentTarget).parents('div.queued-message:first').remove();
            });
            el.on('click', 'div.picLoadQueue', function (evt) {
                var pnl = $(evt.currentTarget).parents('div.picSendMessageQueue');
                var divPopover = $('<div></div>');
                divPopover.appendTo(el.parent().parent());
                divPopover.on('initPopover', function (e) {
                    $('<div></div>').appendTo(e.contents()).loadQueue();
                    e.stopImmediatePropagation();
                });
                divPopover.popover({ autoClose: false, title: 'Load Saved Queue', popoverStyle: 'modal', placement: { target: $('div.picMessageListTitle:first') } });
                divPopover[0].show($('div.picMessageListTitle:first'));
                evt.preventDefault();
                evt.stopImmediatePropagation();

            });
            el.on('click', 'div.queued-message-edit', function (evt) {
                if (el.hasClass('processing')) return;
                var row = $(evt.currentTarget).parents('div.queued-message:first');
                var msg = row.data('message');
                row.addClass('selected');
                var divPopover = $('<div></div>');
                divPopover.appendTo(el.parent().parent());
                divPopover.on('initPopover', function (e) {
                    $('<div></div>').appendTo(e.contents()).editMessage({ msgNdx: row[0].rowIndex, message: msg });
                    e.stopImmediatePropagation();
                });
                divPopover.on('beforeClose', function (e) {
                    row.removeClass('selected');
                });
                divPopover.popover({ autoClose: false, title: 'Edit Message', popoverStyle: 'modal', placement: { target: $('div.picMessageListTitle:first') } });
                divPopover[0].show($('div.picMessageListTitle:first'));
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });
            el.on('click', 'div.picEditQueue', function (evt) {
                self._openEditQueue();
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });
            el.on('click', 'div.picSaveQueue', function (evt) {
                var queue = self._fromWindow();
                console.log(queue);
                if (typeof queue.id === 'number' && !isNaN(queue.id) && queue.id > 0)
                    self.saveQueue();
                else
                    self._openEditQueue();
            });
            el.on('click', 'div.picClearQueue', function (evt) { self.newQueue(); });
            self.newQueue();
        },
        _openEditQueue: function () {
            var self = this, o = self.options, el = self.element;
            var q = dataBinder.fromElement(el);
            var divPopover = $('<div></div>');
            divPopover.appendTo(el.parent().parent());
            divPopover.on('initPopover', function (e) {
                $('<div></div>').appendTo(e.contents()).editQueue({ queue: q });
                e.stopImmediatePropagation();
            });
            divPopover.popover({ autoClose: false, title: 'Edit Queue', popoverStyle: 'modal', placement: { target: $('div.picMessageListTitle:first') } });
            divPopover[0].show($('div.picMessageListTitle:first'));
        },
        bindQueue: function (queue) {
            var self = this, o = self.options, el = self.element;
            var pnl = el.find('div.queue-detail-panel');
            dataBinder.bind(pnl, queue);
            if (typeof queue.messages !== 'undefined') {
                // Bind up all the messages.
                el.find('div.queue-send-list').empty();
                for (var i = 0; i < queue.messages.length; i++) {
                    self.addMessage(queue.messages[i]);
                }
            }
            if (queue.type === 'testModule') {
                el.find('div.queue-list-header').hide();
                el.find('div.queue-send-list').hide();
                el.find('#btnRunTests').hide();
                el.find('#btnAddMessage').hide();
                el.find('#btnSendQueue').hide();
                el.find('#btnReplayQueue').hide();
                el.find('div.picEditQueue').hide();
                el.find('div.picSaveQueue').hide();
                //$('script#scriptTestModule').remove();
                if (typeof outModule !== 'undefined') delete typeof outModule;
                $.getScript('scripts/messages/testModules/' + queue._fileName, // + '?ver=' + new Date().getTime(),
                    function (data, status, xhr) {
                    console.log({ outModule: outModule, data: data, status: status, xhr: xhr });
                    el.find('#btnRunTests').show();
                });
                //var script = $('<script></script>')
                //    .attr('id', 'scriptTestModule')
                //    .attr('src', 'scripts/messages/testModules/' + queue._fileName)
                //    .attr('type', 'text/javascript');
                //script.on('load', function (evt) {
                //    console.log(evt);
                //    el.find('#btnRunTests').show();
                //});
                //script.appendTo(document.head);
            }
            else {
                //$('script#scriptTestModule').remove();
                if (typeof outModule !== 'undefined') delete typeof outModule;
                el.find('div.queue-list-header').show();
                el.find('div.queue-send-list').show();
                el.find('#btnRunTests').hide();
                el.find('#btnAddMessage').show();
                el.find('#btnSendQueue').show();
                el.find('#btnReplayQueue').show();
                el.find('div.picEditQueue').show();
                el.find('div.picSaveQueue').show();
            }
        },
        saveQueue: function () {
            var self = this, o = self.options, el = self.element;
            var queue = self._fromWindow(true);
            $.putLocalService('/messages/queue', queue, 'Saving Queue...', function (data, status, xhr) {
                self.bindQueue(data);
            });
        },
        newQueue: function () { this.bindQueue({ id: 0, name: '', description: '', messages: [] }); },
        addMessage: function (msg) { this.saveMessage(msg); },
        saveMessage: function (msg) {
            var self = this, o = self.options, el = self.element;
            // Clean up the message and deal with a copy.  We wany the reference to be new
            // so that edits aren't changing the original message.
            msg = $.extend(true, {}, msg);
            msg.direction = 'out';
            delete msg.isValid;
            delete msg.packetCount;
            delete msg.complete;
            delete msg.timestamp;
            delete msg._complete;
            if (typeof msg.delay === 'undefined') msg.delay = 0;

            var list = el.find('div.queue-send-list');
            var div = list.find('div.queued-message.selected');
            if (div.length === 0) div = $('<div class="queued-message"></div>').appendTo(list);
            div.empty();
            $('<div class="queued-message-edit mmgrButton"><i class="fas fa-edit"></i></div>').appendTo(div);
            $('<span></span>').appendTo(div).addClass('queued-message-proto').text(msg.protocol).appendTo(div);
            $('<span></span>').appendTo(div).addClass('queued-message-srcdest').text(mhelper.mapSourceByte(msg) + ',' + mhelper.mapDestByte(msg)).appendTo(div);
            $('<span></span>').appendTo(div).addClass('queued-message-action').text(mhelper.mapActionByte(msg)).appendTo(div);
            $('<span></span>').appendTo(div).addClass('queued-message-payload').text(msg.payload.join(',')).appendTo(div);
            $('<span></span>').appendTo(div).addClass('queued-message-delay').text(msg.delay || 0).appendTo(div);
            $('<div class="queued-message-remove mmgrButton"><i class="fas fa-trash-alt"></i></div>').appendTo(div);
            div.data('message', msg);
        },
        loadQueue: function (id) {
            var self = this, o = self.options, el = self.element;
            $.getLocalService('/messages/queue/' + id, undefined, function (data, status, xhr) {
                console.log(data);
                self.bindQueue(data);
            });
        },
        sendQueue: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('processing');
            // Send out the messages on the interval.
            el.find('div.queued-message').each(function () {
                self.msgQueue.push(this);
            });
            o.messagesToSend = self.msgQueue.length;
            o.messagesSent = 0;
            el.find('div.picMessageListTitle:first > span').text('Sending Messages...');

            self.processNextMessage();
        },
        replayQueue: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('processing');
            // Send out the messages on the interval.
            el.find('div.queued-message').each(function () {
                self.msgQueue.push(this);
            });
            o.messagesToSend = self.msgQueue.length;
            o.messagesSent = 0;
            el.find('div.picMessageListTitle:first > span').text('Sending Messages...');

            self.processNextMessage(true);
        },
        processNextMessage: function (toApp) {
            var self = this, o = self.options, el = self.element;
            var mm = $('div.picMessageManager')[0];
            if (self.msgQueue.length > 0) {
                var elMsg = $(self.msgQueue.shift());
                if (elMsg) {
                    var msg = elMsg.data('message');
                    el.find('div.queued-message').removeClass('sending');
                    elMsg.addClass('sending');
                    if (msg) {
                        setTimeout(function () {
                            o.messagesSent++;
                            elMsg.addClass('sent');
                            if (toApp){
                                mm.sendInboundMessage(msg);
                                self.processNextMessage(true);
                            }
                            else {
                                mm.sendOutboundMessage(msg);
                                self.processNextMessage();
                            }
                        }, (msg.delay || 0));
                    }
                }
            }
            else {
                el.find('div.queued-message').removeClass('sending').removeClass('sent');
                el.removeClass('processing');
                el.find('div.picMessageListTitle:first > span').text('Send Message Queue');
                $('<div></div>').appendTo(el.find('div.picMessageListTitle:first > span')).fieldTip({
                    message: `${o.messagesSent} of ${o.messagesToSend} queued messages sent` });
            }
        }
    });
    $.widget("pic.editMessage", {
        options: { isBinding: false },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initMessage();
            self.bindMessage(o.message);
            o.message = undefined;
        },
        _fromWindow(showError) {
            var self = this, o = self.options, el = self.element;
            var m = dataBinder.fromElement(el);
            var valid = dataBinder.checkRequired(el, showError);
            if (!valid && showError) return;
            var msg = { protocol: m.protocol, payload: [], preamble: [255, 0, 255], term: [], isValid: true, direction: 'out', delay: m.delay };
            var arrPayload = m.payloadBytes.split(',');
            var source = parseInt(m.source || 0, 10);
            var dest = parseInt(m.dest, 10);
            var action = parseInt(m.action, 10);
            var controller = parseInt(m.controller || 0, 10);
            if (isNaN(controller) || controller < 0 || controller > 256) {
                if (showError) {
                    $('<div></div>').appendTo(el.find('div.picPickList[data-bind$=controller]:first')).fieldTip({
                        message: 'Invalid controller: ' + arrPayload[i] + '<br></br>Values must be between 0 and 256'
                    });
                    return;
                }
                controller = 0;
            }
            if (isNaN(action) || action < 0 || action > 256) {
                if (showError) {
                    $('<div></div>').appendTo(el.find('div.picPickList[data-bind$=action]:first')).fieldTip({
                        message: 'Invalid action: ' + arrPayload[i] + '<br></br>Values must be between 0 and 256'
                    });
                    return;
                }
                action = 0;
            }
            if (isNaN(dest) || dest < 0 || dest > 256) {
                if (showError) {
                    $('<div></div>').appendTo(el.find('div.picPickList[data-bind$=source]:first')).fieldTip({
                        message: 'Invalid source: ' + arrPayload[i] + '<br></br>Values must be between 0 and 256'
                    });
                    return;
                }
                source = 0;
            }
            if (isNaN(dest) || dest < 0 || dest > 256) {
                if (showError) {
                    $('<div></div>').appendTo(el.find('div.picPickList[data-bind$=dest]:first')).fieldTip({
                        message: 'Invalid destination: ' + arrPayload[i] + '<br></br>Values must be between 0 and 256'
                    });
                    return;
                }
                dest = 0;
            }
            if (m.payloadBytes.length > 0) {
                //console.log({ m: 'Checking payload', bytes: m.payloadBytes, arr: arrPayload, showError: showError });
                for (var i = 0; i < arrPayload.length; i++) {
                    var byte = parseInt(arrPayload[i].trim(), 10);
                    if (isNaN(byte) || byte < 0 || byte > 256) {
                        if (showError) {
                            $('<div></div>').appendTo(el.find('div.picInputField[data-bind$=payloadBytes]:first')).fieldTip({
                                message: '<div style="width:270px">Invalid payload byte: ' + arrPayload[i] + '<br></br>Values must be between 0 and 256</div>'
                            });
                            return;
                        }
                        byte = 0;
                    }
                    msg.payload.push(byte);
                }
            }
            switch (msg.protocol) {
                case 'chlorinator':
                    msg.header = [16, 2, dest, action];
                    break;
                default:
                    msg.header = [165, controller, dest, source, action, msg.payload.length];
                    break;
            }
            mhelper.setMessageTerm(msg);
            msg.key = msg.header.join('_');
            console.log(msg);
            return msg;
        },
        _initMessage: function () {
            var self = this, o = self.options, el = self.element;
            var div = $('<div></div>').appendTo(el).addClass('edit-message-protocol');
            var line = $('<div></div>').appendTo(div);
            var proto = $('<div></div>').appendTo(line).pickList({
                labelText: 'Protocol', binding: 'protocol',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Protocol', style: { whiteSpace: 'nowrap' } }],
                items: [{ val: 'broadcast', desc: 'Broadcast' },
                    { val: 'chlorinator', desc: 'Chlorinator' },
                    { val: 'pump', desc: 'Pump' },
                    { val: 'intellivalve', desc: 'Intellivalve' },
                    { val: 'intellichem', desc: 'Intellichem' },
                    { val: 'regalmodbus', desc: 'Regal Modbus' }],
                inputAttrs: { style: { width: '7rem' } }, labelAttrs: { style: { width: '4rem' } }
            });
            proto.on('selchanged', function (evt) {
                if (!o.isBinding) {
                    var msg = self._fromWindow(false);
                    console.log({ m: 'Sel Changed', msg: msg });
                    switch (evt.newItem.val) {
                        case 'chlorinator':
                            self._initChlorinator();
                            break;
                        default:
                            self._initBroadcast();
                    }
                    self.bindMessage(msg);
                }
            });
            $('<div></div>').appendTo(line).inputField({ required: false, dataType:'int', labelText: 'Delay', binding: 'delay', inputAttrs: { maxlength: 7, style: { width: '4rem' } }, labelAttrs: { style: { width: '2.5rem', paddingLeft: '.25rem' } } });

            $('<div></div>').addClass('edit-message-panel').appendTo(el);
            var pnlPayload = $('<div></div>').addClass('edit-message-payload').appendTo(el);
            $('<div></div>').appendTo(pnlPayload).inputField({ required: false, labelText: 'Payload', binding: 'payloadBytes', inputAttrs: { style: { width: '44rem' } }, labelAttrs: { style: { width: '4rem' } } });
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Message', icon: '<i class="far fa-save"></i>' }).on('click', function (e) {
                var msg = self._fromWindow(true);
                if (msg) {
                    $('div.picSendMessageQueue').each(function () {
                        this.saveMessage(msg);
                    });
                    // Close the window.
                    el.parents('div.picPopover:first')[0].close();
                }
            });
            el.on('changed', 'div.picPickList[data-bind="controller"]', function (evt) {
                if (!o.isBinding) {
                    var msg = self._fromWindow(false);
                    var actions;
                    switch (msg.protocol) {
                        case 'intellichem':
                            actions = mhelper.chemActions;
                            break;
                        case 'pump':
                            actions = mhelper.pumpActions;
                            break;
                        case 'intellivalve':
                            actions = mhelper.valveActions;
                            break;
                        case 'chlorinator':
                            actions = mhelper.chlorActions;
                            break;
                        default:
                            switch (mhelper.getControllerByte(msg)) {
                                case 63:
                                    actions = mhelper.centerActions;
                                    break;
                                case 16:
                                    actions = mhelper.touchActions;
                                    break;
                            }
                            break;
                    }
                    el.find('div.picPickList[data-bind=action').each(function () { this.items(actions); });
                }
            });
        },
        _initChlorinator: function () {
            var self = this, o = self.options, el = self.element;
            var div = el.find('div.edit-message-panel');
            if (div.attr('data-paneltype') === 'chlorinator') return;
            div.attr('data-paneltype', 'chlorinator');
            div.empty();
            var line = $('<div></div>').appendTo(div);
            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Dest', binding: 'dest',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Address', style: { whiteSpace: 'nowrap' } }],
                items: mhelper.chlorAddrs,
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '4rem' } }
            });
            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Action', binding: 'action',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Action', style: { whiteSpace: 'nowrap' } }],
                items:[],
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '2.7rem', paddingLeft: '.25rem' } }
            });

        },
        _initBroadcast: function () {
            var self = this, o = self.options, el = self.element;
            var div = el.find('div.edit-message-panel');
            if (div.attr('data-paneltype') === 'broadcast') return;
            div.attr('data-paneltype', 'broadcast');
            div.empty();
            var line = $('<div></div>').appendTo(div);
            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Controller', binding: 'controller',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Controller', style: { whiteSpace: 'nowrap' } }],
                items: mhelper.controllerBytes,
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '4rem' } }
            });
            line = $('<div></div>').appendTo(div);
            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Source', binding: 'source',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Address', style: { whiteSpace: 'nowrap' } }],
                items: [],
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '4rem' } }
            });

            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Dest', binding: 'dest',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Address', style: { whiteSpace: 'nowrap' } }],
                items: [],
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '2.7rem', paddingLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Action', binding: 'action',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Action', style: { whiteSpace: 'nowrap' } }],
                items: [],
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '2.7rem', paddingLeft: '.25rem' } }
            });
        },
        bindMessage: function (msg) {
            var self = this, o = self.options, el = self.element;
            var copy = $.extend(true, {}, msg);
            if (typeof copy.controller === 'undefined') copy.controller = mhelper.getControllerByte(copy);
            if (typeof copy.source === 'undefined') copy.source = mhelper.getSourceByte(copy);
            if (typeof copy.dest === 'undefined') copy.dest = mhelper.getDestByte(copy);
            if (typeof copy.action === 'undefined') copy.action = mhelper.getActionByte(copy);
            if (typeof copy.payloadBytes === 'undefined') copy.payloadBytes = copy.payload.join(',');
            o.isBinding = true;
            copy.dataLen = msg.payload.length;
            var actions = mhelper.broadcastActions;
            if (msg.protocol === 'chlorinator') {
                self._initChlorinator();
                addrs = mhelper.chlorAddrs;
                actions = mhelper.chlorActions;
            }
            else {
                self._initBroadcast();
                var addrs = mhelper.broadcastAddrs;
                switch (msg.protocol) {
                    case 'intellichem':
                        addrs = mhelper.chemAddrs;
                        actions = mhelper.chemActions;
                        break;
                    case 'pump':
                        addrs = mhelper.pumpAddrs;
                        actions = mhelper.pumpActions;
                        break;
                    case 'intellivalve':
                        addrs = mhelper.valveAddrs;
                        actions = mhelper.valveActions;
                        break;
                    default:
                        switch (mhelper.getControllerByte(msg)) {
                            case 63:
                                actions = mhelper.centerActions;
                                break;
                            case 16:
                                actions = mhelper.touchActions;
                                break;
                        }
                        break;
                }
                el.find('div.picPickList[data-bind=source').each(function () { this.items(addrs); });
                el.find('div.picPickList[data-bind=dest').each(function () { this.items(addrs); });
                el.find('div.picPickList[data-bind=action').each(function () { this.items(actions); });
            }
            dataBinder.bind(el.find('div.edit-message-protocol:first'), copy);
            dataBinder.bind(el.find('div.edit-message-panel:first'), copy);
            dataBinder.bind(el.find('div.edit-message-payload:first'), copy);
            o.isBinding = false;
        }
    });
    $.widget("pic.editQueue", {
        options: { isBinding: false },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initQueue();
            self.bindQueue(o.queue);
        },
        _fromWindow(showError) {
            var self = this, o = self.options, el = self.element;
            var q = dataBinder.fromElement(el);
            var valid = dataBinder.checkRequired(el, showError);
            if (!valid && showError) return;
            return q;
        },
        _initQueue: function () {
            var self = this, o = self.options, el = self.element;
            var div = $('<div></div>').appendTo(el).addClass('edit-queue');
            var line = $('<div></div>').appendTo(div);
            $('<input type="hidden" data-datatype="int" data-bind="id"></input>').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: 'name', inputAttrs: { maxlength: 27, style: { width: '12rem' } }, labelAttrs: { style: { width: '5.5rem', paddingLeft: '.25rem' } } });
            line = $('<div></div>').appendTo(div);
            $('<div></div>').appendTo(line).inputField({ required: false, multiLine:true, labelText: 'Description', binding: 'description', inputAttrs: { maxlength: 100, style: { width: '19rem', height:'4rem' } }, labelAttrs: { style: { width: '5.5rem', paddingLeft: '.25rem' } } });

            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Queue', icon: '<i class="far fa-save"></i>' }).on('click', function (e) {
                var queue = self._fromWindow(true);
                
                if (queue) {
                    $('div.picSendMessageQueue').each(function () {
                        this.bindQueue(queue);
                        this.saveMessage();
                    });
                    // Close the window.
                    el.parents('div.picPopover:first')[0].close();
                }
            });
        },
        bindQueue: function (queue) {
            var self = this, o = self.options, el = self.element;
            if (typeof queue.id !== 'number' || queue.id <= 0) el.parents('div.picPopover:first')[0].titleText('Create Queue');
            dataBinder.bind(el, queue);
        }
    });
    $.widget("pic.loadQueue", {
        options: { isBinding: false },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initQueue();
        },
        _fromWindow(showError) {
            var self = this, o = self.options, el = self.element;
            var q = dataBinder.fromElement(el);
            var valid = dataBinder.checkRequired(el, showError);
            if (!valid && showError) return;
            return q;
        },
        _initQueue: function () {
            var self = this, o = self.options, el = self.element;
            var div = $('<div></div>').appendTo(el).addClass('edit-queue');
            var line = $('<div></div>').css({ minWidth: '20rem' }).appendTo(div);
            $.getLocalService('/messages/queues', undefined, function (data, status, xhr) {
                console.log(data);
                $('<div></div>').appendTo(line).pickList({ required: true,
                    labelText: 'Queue', binding: 'id',
                    displayColumn: 1,
                    columns: [{ binding: 'id', text: 'Id', hidden:true, style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Name', style: { whiteSpace: 'nowrap', width:'7rem' } }, { binding: 'description', text: 'Description', style: { whiteSpace: 'nowrap' } }],
                    items: data,
                    pickListStyle: { minWidth: '30rem', maxHeight: '300px' },
                    inputAttrs: { style: { width: '20rem' } }, labelAttrs: { style: { width: '4rem' } }
                });
            });

            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Load Queue', icon: '<i class="fas fa-download"></i>' }).on('click', function (e) {
                console.log('Loading queue');
                var queue = self._fromWindow(true);

                if (queue) {
                    console.log(queue);
                    $('div.picSendMessageQueue').each(function () {
                        this.loadQueue(queue.id);
                    });
                    // Close the window.
                    el.parents('div.picPopover:first')[0].close();
                }
            });
        },
        bindQueues: function (queue) {
            var self = this, o = self.options, el = self.element;
            //dataBinder.bind(el, queue);

        }
    });
    $.widget("pic.uploadLog", {
        options: { isBinding: false },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initUpload();
        },
        _initUpload: function () {
            var self = this, o = self.options, el = self.element;
            var div = $('<div></div>').appendTo(el).addClass('upload-logfile');
            var line = $('<div></div>').css({ minWidth: '30rem' }).appendTo(div);
            $('<div></div>').appendTo(line).fileUpload({ binding: 'logFile', labelText: 'Log File', inputAttrs: { style: { width: '24rem' } }, hasPostProcess: true });
            line = $('<div></div>').appendTo(div);
            $('<hr></hr>').appendTo(line);
            line = $('<div></div>').appendTo(div);
            var fset = $('<fieldset></fieldset>').appendTo(line);
            $('<legend></legend>').appendTo(fset).text('Options');
            line = $('<div></div>').appendTo(fset);
            //$('<div></div>').appendTo(line).pickList({
            //    displayColumn:0,
            //    labelText: 'Playback To', binding: 'playbackTo',
            //    columns: [{ binding: 'name', text: 'Name', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Playback Destination', style: { width:'450px' } }],
            //    items: [{ name: 'Message List', desc: 'Plays the log file back to the message list' },
            //        { name: 'Pool Controller', desc: 'Plays the log file back to the poolController Instance' } ],
            //    inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: {} }, dropdownStyle: {width:'450px'}
            //});
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Begin Processing File', icon: '<i class="fas fa-upload"></i>' }).on('click', function (e) {
                self._uploadLogFile();
            });
        },
        _uploadLogFile: function () {
            var self = this, o = self.options, el = self.element;
            var divPopover = $('<div></div>');
            divPopover.appendTo(document.body);
            divPopover.on('initPopover', function (e) {
                var progress = $('<div></div>').appendTo(e.contents()).uploadProgress({ hasPostProcess: true });
                e.stopImmediatePropagation();
                var opts = dataBinder.fromElement(el);
                var uploader = $('div[data-bind=logFile]');
                uploader[0].upload({
                    url: 'upload/logFile',
                    params: { preserveFile: false },
                    progress: function (xhr, evt, prog) {
                        //console.log(xhr, evt, prog);
                        progress[0].setUploadProgress(prog.loaded, prog.total);
                    },
                    complete: function (data, status, xhr) {
                        //console.log(data);
                        // Play the file back to the message list.
                        var msgList = $('div.picMessages:first')[0];
                        msgList.pinSelection(true);
                        msgList.logMessages(false);
                        progress[0].setProcessProgress(0, data.length);
                        if (progress[0].isCancelled()) {
                            msgList.cancelBulkMessages();
                            divPopover[0].close();
                        }
                        else {
                            msgList.clear();
                            self._processNextMessage(msgList, progress[0], data);
                        }
                    }
                });
                //console.log(opts);

            });
            divPopover.popover({ autoClose: false, title: 'Uploading Log File', popoverStyle: 'modal', placement: { my: 'center center', at: '50% 50%', of: document.body } });
            divPopover[0].show($('div.picMessageListTitle:first'));
        },
        _processNextMessage(msgList, prog, arr) {
            var self = this, o = self.options, el = self.element;
            var msg = arr.shift();
            if (prog.isCancelled()) {
                msgList.cancelBulkMessages();
                msgList.commitBulkMessages();
                $(prog).parents('div.picPopover:first')[0].close();
                return;
            }
            prog.incrementProcessProgress();
            if (typeof msg !== 'undefined' && msg !== null) {
                if (typeof msg !== 'undefined' && typeof msg.proto !== 'undefined' && msg.proto !== 'api') {
                    //if (msg.proto !== 'chlorinator' && msg.proto !== 'pump') {
                    //console.log(msg.port);
                    msgList.addBulkMessage({
                        isValid: typeof msg.valid !== 'undefined' ? msg.valid : typeof msg.isValid !== 'undefined' ? msg.isValid : true,
                        _id: msg.id,
                        portId: typeof msg.port !== 'undefined' ? msg.port : msg.portId,
                        responseFor: msg.for,
                        protocol: msg.proto,
                        direction: msg.dir,
                        padding: msg.pkt[0],
                        preamble: msg.pkt[1],
                        header: msg.pkt[2],
                        payload: msg.pkt[3],
                        term: msg.pkt[4],
                        timestamp: msg.ts
                    });
                    //}
                }
                else if (typeof msg !== 'undefined' && typeof msg.proto !== 'undefined' && msg.proto === 'api') {
                    // We are now going to add the api call to the message list.
                    msgList.addBulkApiCall({
                        direction: msg.dir,
                        protocol: msg.proto,
                        requestor: msg.requestor,
                        method: msg.method,
                        path: msg.path,
                        body: msg.body,
                        timestamp: msg.ts
                    });
                }
                else {
                    console.log(msg);
                }
            }
            else { console.log(msg); }
            if (arr.length > 0) setTimeout(function () { self._processNextMessage(msgList, prog, arr); }, 0);
            else {
                msgList.commitBulkMessages();
                $(prog).parents('div.picPopover:first')[0].close();
                el.parents('div.picPopover:first')[0].close();
                //let byte = 2;
                //console.log({ msg: 'Testing', on1: ((byte & (1 << (1))) >> 1), on4: ((byte & (1 << (4))) >> 4), on5: ((byte & (1 << (5))) >> 5) });
            }
        }
    });
})(jQuery);
