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
        { val: 152, desc: 'Set[pump]' },
        { val: 153, desc: 'Set[chlor]' },
        { val: 155, desc: 'Set[pump-ext]' },
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
        { val: 216, desc: 'Get[pumps]' },
        { val: 217, desc: 'Get[chlor]' },
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
        options: { receivingMessages: false, pinScrolling: false, changesOnly: false, messageKeys: {} },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initList = function (data) { self._initList(); };
            el[0].addMessage = function (msg) { self.addMessage(msg); };
            el[0].receivingMessages = function (val) { return self.receivingMessages(val); };
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
        _initList: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            var tblOuter = $('<table class="msgList-container"></table>').appendTo(el);
            var tbody = $('<tbody></tbody>').appendTo(tblOuter);
            var row = $('<tr></tr>').appendTo(tbody);
            var td = $('<td></td>').appendTo(row);
            div = $('<div class="picMessageListTitle picControlPanelTitle"></div>').appendTo(td);
            $('<span>Messages</span><div class="picStartLogs mmgrButton picIconRight" title="Start/Stop Log"><i class="far fa-list-alt"></i></div>').appendTo(div);
            $('<div class="picScrolling mmgrButton picIconRight" title="Pin Selection"><i class="fas fa-thumbtack"></i></div>').appendTo(div);
            $('<div class="picChangesOnly mmgrButton picIconRight" title="Show only changes"><i class="fas fa-not-equal"></i></div>').appendTo(div);
            $('<div class="picClearMessages mmgrButton picIconRight" title="Clear Messages"><i class="fas fa-broom"></i></div>').appendTo(div);


            row = $('<tr></tr>').appendTo(tbody);
            td = $('<td></td>').appendTo(row);
            div = $('<div class="msgList-header"></div>').appendTo(td);
            $('<table class="msgList-header"><tbody><tr><td><td>Dir</td></td><td>Chg</td><td>Proto</td><td>Source</td><td>Dest</td><td>Action</td><td>Payload</td></tr></tbody></table>').appendTo(div);

            row = $('<tr class="msgList-body"></tr>').appendTo(tbody);
            td = $('<td></td>').appendTo(row);
            div = $('<div class="msgList-body"></div>').appendTo(td);
            div = $('<div class="msgList-body-content"></div>').appendTo(div);
            $('<table class="msgList-body"><tbody></tbody></table>').appendTo(div);

            el.on('click', 'div.picStartLogs', function (evt) {
                var mm = $('div.picMessageManager')[0];
                mm.receiveLogMessages(!o.receivingMessages);
            });
            el.on('click', 'div.picScrolling', function (evt) {
                o.pinScrolling = !o.pinScrolling;
                console.log(evt);
                if (!o.pinScrolling) $(evt.currentTarget).removeClass('selected');
                else $(evt.currentTarget).addClass('selected');
            });
            el.on('click', 'div.picChangesOnly', function (evt) {
                o.changesOnly = !o.changesOnly;
                if (o.changesOnly) {
                    $(evt.currentTarget).addClass('selected');
                    el.find('table.msgList-body:first').addClass('changesOnly');
                }
                else {
                    $(evt.currentTarget).removeClass('selected');
                    el.find('table.msgList-body:first').removeClass('changesOnly');
                }
            });
            el.on('click', 'div.picClearMessages', function (evt) {
                el.find('table.msgList-body > tbody > tr.msgRow').remove();
                o.messageKeys = {};
            });

            el.on('click', 'i.fa-clipboard', function (evt) {
                var row = $(evt.currentTarget).parents('tr.msgRow:first');
                mhelper.copyToClipboard(row.data('message'));
            });
            el.on('click', 'tr.msgRow', function (evt) {
                self._selectRow($(evt.currentTarget));
            });
            self._resetHeight();
            $(window).on('resize', function (evt) {
                self._resetHeight();
            });
        },
        addMessage: function (msg) {
            var self = this, o = self.options, el = self.element;
            var body = el.find('table.msgList-body > tbody');
            var row = $('<tr><td title="Copy to Clipboard"><span><i class="far fa-clipboard"></i></span></td></tr>').addClass('msgRow');
            msg.key = msg.header.join('_');
            row.appendTo(body);
            self._bindMessage(row, msg);
        },
        _scrollToRow: function (row) {
            var self = this, o = self.options, el = self.element;
            var pos = row.position();
            var div = el.find('div.msgList-body-content');
            var height = div[0].clientHeight;
            //console.log({ pos: pos, height: height, rect: rect, row: row });
            div.scrollTop(Math.max(pos.top + row.height() - height + 2, 0));
        },
        _selectRow: function (row) {
            var self = this, o = self.options, el = self.element;
            var tbl = el.find('table.msgList-body');
            tbl.find('tr.msgRow').removeClass('selected');
            row.addClass('selected');
            var msg = row.data('message');
            var prev;
            var ndx = row[0].rowIndex;
            var key = row.attr('data-msgkey');
            for (var i = ndx - 1; i > 0; i--) {
                var r = $(tbl[0].rows[i]);
                if (r.attr('data-msgkey') === key) {
                    prev = r.data('message');
                    break;
                }
            }

            $('div.picMessageDetail')[0].bindMessage(msg, prev);
        },
        _bindMessage(row, msg) {
            var self = this, o = self.options, el = self.element;
            var inout = $('<span></span>').appendTo($('<td></td>').appendTo(row));
            $('<i class="fas"></i>').appendTo(inout).addClass(msg.direction === 'out' ? 'fa-arrow-circle-left' : 'fa-arrow-circle-right');
            var spChg = $('<span class="changed"></span>').appendTo($('<td></td>').appendTo(row));
            var chg = $('<i class="fas"></i>').appendTo(spChg);

            row.attr('data-msgdir', msg.direction);
            (msg.direction === 'out') ? row.addClass('outbound') : row.addClass('inbound');
            $('<span></span>').text(msg.protocol).appendTo($('<td></td>').appendTo(row));
            $('<span></span>').text(mhelper.mapSource(msg)).appendTo($('<td></td>').appendTo(row));
            $('<span></span>').text(mhelper.mapDest(msg)).appendTo($('<td></td>').appendTo(row));
            $('<span></span>').text(mhelper.mapAction(msg)).appendTo($('<td></td>').appendTo(row));
            $('<span></span>').text(msg.payload.join(',')).appendTo($('<td></td>').appendTo(row));
            if (typeof msg.isValid !== 'undefined' && !msg.isValid) row.addClass('invalid');
            var prev = o.messageKeys[msg.key];
            var hasChanged = false;
            if (typeof prev === 'undefined')
                hasChanged = true;
            else if (mhelper.isMessageDiff(prev, msg))
                hasChanged = true;

            if (hasChanged) {
                row.addClass('changed');
                (typeof prev === 'undefined') ? spChg.addClass('new') : spChg.addClass('changed');
                chg.addClass('fa-dot-circle');
            }
            else
                row.addClass('nochange');
            row.addClass('changed');

            o.messageKeys[msg.key] = msg;
            row.attr('data-msgkey', msg.key);
            row.data('message', msg);
            if (!o.pinScrolling) {
                if (!o.changesOnly || (o.changesOnly && hasChanged)) {
                    self._scrollToRow(row);
                    self._selectRow(row);
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
        }
    });
    $.widget("pic.messageDetail", {
        options: { message: null },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].bindMessage = function (msg, prev) { self.bindMessage(msg, prev); };
            self._initDetails();
        },
        _initDetails: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            div = $('<div class="picMessageListTitle picControlPanelTitle"></div>').appendTo(el);
            $('<span class="picMessageDirection" data-bind="direction"></span><span>Message Details</span>').appendTo(div);
            $('<div class="picAddToQueue mmgrButton picIconRight" title="Push to Send Queue"><i class="far fa-hand-point-up"></i></div>').appendTo(div);
            //[255, 0, 255][165, 63, 15, 16, 2, 29][9, 47, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 2, 0, 80, 80, 0, 241, 85, 105, 24, 246, 0, 0, 0, 0, 0, 255, 0][255, 165]
            div = $('<div class="msg-detail-panel" style="display:none;"></div>').appendTo(el);
            var line = $('<div class="dataline"><div>').appendTo(div);
            $('<label>Protocol:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'protocol');
            $('<div class="msg-invalid-banner"></div>').appendTo(line).text('Invalid Message');

            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Source/Dest:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'source');
            $('<span></span>').appendTo(line).text(' => ');
            $('<span></span>').appendTo(line).attr('data-bind', 'dest');
            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Action:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'action');
            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Timestamp:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'timestamp');
            line = $('<div class="dataline"></div>').appendTo(div);
            $('<label>Data Length:</label>').appendTo(line);
            $('<span></span>').appendTo(line).attr('data-bind', 'dataLen');
            $('<div class="payloadBytes"></div>').appendTo(div);
            $('<div class="msg-payload"></div>').appendTo(el);
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
            el.on('click', function (evt) {
                el.find('tr.msg-payload-header > td.selected').removeClass('selected');
                el.find('div.msg-payload-bytediff').remove();
            });
        },
        bindMessage: function (msg, prev) {
            var self = this, o = self.options, el = self.element;
            console.log(prev);
            var obj = {
                protocol: '',
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
                obj = {
                    protocol: msg.protocol,
                    source: mhelper.mapSource(msg) + ' - [' + mhelper.extractByte(msg.header, 3) + ']',
                    dest: mhelper.mapDest(msg) + ' - [' + mhelper.extractByte(msg.header, 2) + ']',
                    action: mhelper.mapAction(msg) + ' - [' + mhelper.getActionByte(msg) + ']',
                    timestamp: msg.timestamp,
                    dataLen: msg.payload.length,
                    direction: msg.direction === 'in' ? 'Inbound ' : 'Outbound '
                };
            }
            (msg.isValid === false) ? el.addClass('invalid') : el.removeClass('invalid');
            o.message = msg;
            dataBinder.bind(el, obj);
            self.bindPayload(msg, prev);
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
            $('<td></td>').addClass('bytediff-ascii').appendTo(rowCurr).text(mhelper.toAscii(bcurr));
            $('<td></td>').addClass('bytediff-hex').appendTo(rowHead).text('hex');
            $('<td></td>').addClass('bytediff-hex').appendTo(rowCurr).text(mhelper.toHex(bcurr));
            var cellBinHead = $('<td></td>').addClass('bytediff-binary').appendTo(rowHead);
            makeBinaryTable().appendTo($('<div></div>').appendTo(cellBinHead));
            makeBinaryTable(bcurr).appendTo($('<td></td>').appendTo(rowCurr));
            if (typeof bprev !== 'undefined' && !isNaN(bprev)) {
                var rowPrev = $('<tr></tr>').addClass('bytediff-prev').appendTo(tbody);
                $('<td></td>').addClass('bytediff-name').appendTo(rowPrev).text('Previous');
                $('<td></td>').addClass('bytediff-dec').appendTo(rowPrev).text(bprev);
                $('<td></td>').addClass('bytediff-ascii').appendTo(rowPrev).text(mhelper.toAscii(bprev));
                $('<td></td>').addClass('bytediff-hex').appendTo(rowPrev).text(mhelper.toHex(bprev));
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
                var pdec = mhelper.extractByte(p, i);
                var bascii = mhelper.toAscii(bdec);
                var bhex = mhelper.toHex(bdec);
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
                    chex.addClass('payload-change');//.attr('title', 'prev: ' +  mhelper.toHex(pdec));
                    cascii.addClass('payload-change');//.attr('title', 'prev: ' + mhelper.toAscii(pdec));
                }
            }
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
            div = $('<div class="picMessageListTitle picControlPanelTitle"></div>').appendTo(el);
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
            var btnPnl = $('<div class="picBtnPanel"></div>').appendTo(el);
            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Add Message', icon: '<i class="fas fa-plus" ></i>' }).on('click', function (e) {
                var controller = $(document.body).attr('data-controllertype') === 'intellicenter' ? 63 : 16;
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
            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Send Queue', icon: '<i class="far fa-paper-plane"></i>' }).on('click', function (e) {
                self.sendQueue();
            });
            $('<div></div>').addClass('cancel-button').appendTo(btnPnl).actionButton({ text: 'Cancel Processing', icon: '<i class="fas fa-ban burst-animated" style="color:crimson;vertical-align:top;"></i>' }).on('click', function (e) {
                self.msgQueue.length = 0;                
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
        },
        saveQueue: function () {
            var self = this, o = self.options, el = self.element;
            var queue = self._fromWindow(true);
            $.putJSON('/messages/queue', queue, 'Saving Queue...', function (data, status, xhr) {
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
            $.getJSON('/messages/queue/' + id, undefined, function (data, status, xhr) {
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
        processNextMessage: function () {
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
                            mm.sendOutboundMessage(msg);
                            self.processNextMessage();
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
                    { val: 'intellichem', desc: 'Intellichem' }],
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
            $('<div></div>').appendTo(pnlPayload).inputField({ required: false, labelText: 'Payload', binding: 'payloadBytes', inputAttrs: { maxlength: 50, style: { width: '44rem' } }, labelAttrs: { style: { width: '4rem' } } });
            var btnPnl = $('<div class="picBtnPanel"></div>').appendTo(el);
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

            var btnPnl = $('<div class="picBtnPanel"></div>').appendTo(el);
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
            $.getJSON('/messages/queues', undefined, function (data, status, xhr) {
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

            var btnPnl = $('<div class="picBtnPanel"></div>').appendTo(el);
            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Load Queue', icon: '<i class="fas fa-dowload"></i>' }).on('click', function (e) {
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
})(jQuery);
