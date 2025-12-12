(function ($) {
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
})(jQuery);
