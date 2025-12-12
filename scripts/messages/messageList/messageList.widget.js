(function ($) {
    $.widget("pic.messageList", {
        options: {
            receivingMessages: false, pinScrolling: false, changesOnly: false, messageKeys: {}, contexts: {}, messages: {}, portFilters: [], filters: [], rowIds: [], ports: [], expandedRows: {}, loadedFilename: null
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
                
                // Sort protocols by name and actions by val (action byte)
                filt.protocols.sort((a, b) => a.name.localeCompare(b.name));
                for (let i = 0; i < filt.protocols.length; i++) {
                    filt.protocols[i].actions.sort((a, b) => a.val - b.val);
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
                width: '90vw',
                maxWidth: '1400px',
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
                        text: 'Close', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }
                ]
            });
            
            // Collect unique source and destination addresses
            let sourceAddrs = new Map();
            let destAddrs = new Map();
            for (let i = 0; i < filt.protocols.length; i++) {
                let proto = filt.protocols[i];
                for (let a = 0; a < proto.actions.length; a++) {
                    let act = proto.actions[a];
                    for (let j = 0; j < act.filters.length; j++) {
                        let filter = act.filters[j];
                        if (typeof filter.source !== 'undefined' && filter.source.val !== null) {
                            sourceAddrs.set(filter.source.val, filter.source.name);
                        }
                        if (typeof filter.dest !== 'undefined' && filter.dest.val !== null) {
                            destAddrs.set(filter.dest.val, filter.dest.name);
                        }
                    }
                }
            }
            
            // Create shortcuts panel at the top
            var shortcutsPanel = $('<div></div>').appendTo(dlg).addClass('pnl-filter-shortcuts').css({
                padding: '0.5rem',
                borderBottom: 'solid 1px #ccc',
                marginBottom: '0.5rem'
            });
            
            if (sourceAddrs.size > 0 || destAddrs.size > 0) {
                // Add mode selection buttons
                let modePanel = $('<div></div>').appendTo(shortcutsPanel).css({
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                });
                
                $('<span></span>').appendTo(modePanel).css({
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                }).text('Mode:');
                
                let modeBtns = $('<div></div>').appendTo(modePanel).addClass('btnarray');
                
                let addBtn = $('<div></div>').appendTo(modeBtns)
                    .addClass('btn-toggle fld-btn-left')
                    .attr('data-filter-mode', 'add')
                    .css({ padding: '0.25rem 0.5rem', fontSize: '0.85rem' });
                $('<span></span>').appendTo(addBtn).text('Add');
                
                let replaceBtn = $('<div></div>').appendTo(modeBtns)
                    .addClass('btn-toggle fld-btn-center')
                    .attr('data-filter-mode', 'replace')
                    .attr('data-selected', 'true')
                    .css({ padding: '0.25rem 0.5rem', fontSize: '0.85rem' });
                $('<span></span>').appendTo(replaceBtn).text('Replace');
                
                let removeBtn = $('<div></div>').appendTo(modeBtns)
                    .addClass('btn-toggle fld-btn-right')
                    .attr('data-filter-mode', 'remove')
                    .css({ padding: '0.25rem 0.5rem', fontSize: '0.85rem' });
                $('<span></span>').appendTo(removeBtn).text('Remove');
                
                // Mode button click handler
                modeBtns.on('click', 'div.btn-toggle', function (evt) {
                    modeBtns.find('div.btn-toggle').attr('data-selected', 'false');
                    $(evt.currentTarget).attr('data-selected', 'true');
                    evt.stopPropagation();
                });
                // Add "From" shortcuts
                if (sourceAddrs.size > 0) {
                    let fromLabel = $('<div></div>').appendTo(shortcutsPanel).css({
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        marginBottom: '0.25rem'
                    }).text('From:');
                    
                    let fromBtns = $('<div></div>').appendTo(shortcutsPanel).addClass('btnarray').css({
                        marginBottom: '0.5rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.25rem'
                    });
                    
                    let sortedSources = Array.from(sourceAddrs.entries()).sort((a, b) => a[0] - b[0]);
                    for (let i = 0; i < sortedSources.length; i++) {
                        let [val, name] = sortedSources[i];
                        let btn = $('<div></div>').appendTo(fromBtns)
                            .addClass('btn-toggle')
                            .addClass(i === 0 ? 'fld-btn-left' : (i === sortedSources.length - 1 ? 'fld-btn-right' : 'fld-btn-center'))
                            .attr('data-addr-type', 'source')
                            .attr('data-addr-val', val)
                            .css({ padding: '0.25rem 0.5rem', fontSize: '0.85rem', whiteSpace: 'nowrap' });
                        $('<span></span>').appendTo(btn).html(`[${val}] ${name}`);
                    }
                }
                
                // Add "To" shortcuts
                if (destAddrs.size > 0) {
                    let toLabel = $('<div></div>').appendTo(shortcutsPanel).css({
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        marginBottom: '0.25rem'
                    }).text('To:');
                    
                    let toBtns = $('<div></div>').appendTo(shortcutsPanel).addClass('btnarray').css({
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.25rem'
                    });
                    
                    let sortedDests = Array.from(destAddrs.entries()).sort((a, b) => a[0] - b[0]);
                    for (let i = 0; i < sortedDests.length; i++) {
                        let [val, name] = sortedDests[i];
                        let btn = $('<div></div>').appendTo(toBtns)
                            .addClass('btn-toggle')
                            .addClass(i === 0 ? 'fld-btn-left' : (i === sortedDests.length - 1 ? 'fld-btn-right' : 'fld-btn-center'))
                            .attr('data-addr-type', 'dest')
                            .attr('data-addr-val', val)
                            .css({ padding: '0.25rem 0.5rem', fontSize: '0.85rem', whiteSpace: 'nowrap' });
                        $('<span></span>').appendTo(btn).html(`[${val}] ${name}`);
                    }
                }
            }
            
            // Add ports section after shortcuts
            if (filt.ports.length > 0) {
                let portsLabel = $('<div></div>').appendTo(shortcutsPanel).css({
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    marginBottom: '0.25rem',
                    marginTop: '0.5rem'
                }).text('Ports:');
                
                let portBtns = $('<div></div>').appendTo(shortcutsPanel).addClass('btnarray').css({
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.25rem'
                });
                
                for (let i = 0; i < filt.ports.length; i++) {
                    let p = filt.ports[i];
                    $('<div></div>').appendTo(portBtns).checkbox({ 
                        labelHtml: `<span>RS485 Port #${p.port}</span>`, 
                        value: p.filtered 
                    }).addClass('cb-port').attr('data-port', p.port);
                }
            }
            
            var outer = $('<div></div>').appendTo(dlg).addClass('pnl-protofilter').css({
                maxHeight: `calc(100vh - 250px)`, 
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                padding: '0.5rem'
            });
            console.log(filt);
            
            let fnCalcChecks = (div) => {
                return {
                    checked: div.find('div.picCheckbox.cb-filter > input[type=checkbox]:checked'),
                    unchecked: div.find('div.picCheckbox.cb-filter > input[type=checkbox]:not(:checked)')
                };
            };
            
            // Helper function to get first payload byte for display
            let getFirstPayloadByte = (filter) => {
                if (filter.context && filter.context.payloadByte !== undefined) {
                    return filter.context.payloadByte;
                }
                return null;
            };
            
            // Separate broadcast from other protocols
            let broadcastProtocol = filt.protocols.find(p => p.name && p.name.toLowerCase() === 'broadcast');
            let otherProtocols = filt.protocols.filter(p => !p.name || p.name.toLowerCase() !== 'broadcast');
            
            // Create broadcast protocol panel if it exists (columns 1-2)
            if (broadcastProtocol) {
                let f = broadcastProtocol;
                let divP = $('<div></div>').appendTo(outer).addClass('pnl-protocol protocol-broadcast').css({
                    border: 'solid 1px #ccc',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    backgroundColor: '#f9f9f9',
                    breakInside: 'avoid'
                });
                
                $('<div></div>').appendTo(divP).css({ fontWeight: 'bold' });
                $('<div></div>').appendTo(divP).checkbox({ labelHtml: `<span>${f.desc}</span>` }).addClass('cb-protocol').css({ fontWeight: 'bold' });
                
                // Create a 2-column container for broadcast actions
                let actionsContainer = $('<div></div>').appendTo(divP).addClass('pnl-action-container');
                
                for (let a = 0; a < f.actions.length; a++) {
                    let act = f.actions[a];
                    let divA = $('<div></div>').appendTo(actionsContainer).addClass('pnl-action');
                    
                    // Special handling for action 222 - add expand/collapse functionality
                    let is222 = act.val === 222;
                    let actionCheckbox = $('<div></div>').appendTo(divA).checkbox({ labelHtml: `<span>[<span class="msg-detail-byte">${act.val}</span>]<span> ${act.name}</span>` })
                        .css({ marginLeft: '1rem', fontWeight: 'bold' }).addClass('cb-action');
                    
                    let filtersContainer = $('<div></div>').appendTo(divA).addClass('pnl-filters-container');
                    
                    if (is222) {
                        // Add expander icon OUTSIDE the checkbox label so clicking it never toggles selection.
                        // (Checked = excluded; expand/collapse should be view-only.)
                        let expandIcon = $('<i></i>').addClass('fas fa-chevron-right')
                            .css({ marginLeft: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' })
                            .attr('title', 'Expand/Collapse details')
                            .insertAfter(actionCheckbox.find('input.picCheckbox-value:first'));
                        filtersContainer.hide(); // Start collapsed
                        filtersContainer.attr('data-expanded', 'false');
                        
                        expandIcon.on('click', function (evt) {
                            let isExpanded = filtersContainer.attr('data-expanded') === 'true';
                            if (isExpanded) {
                                filtersContainer.hide();
                                filtersContainer.attr('data-expanded', 'false');
                                expandIcon.removeClass('fa-chevron-down').addClass('fa-chevron-right');
                            } else {
                                filtersContainer.show();
                                filtersContainer.attr('data-expanded', 'true');
                                expandIcon.removeClass('fa-chevron-right').addClass('fa-chevron-down');
                            }
                            evt.preventDefault();
                            evt.stopPropagation();
                        });
                    }
                    
                    for (let j = 0; j < act.filters.length; j++) {
                        let filter = act.filters[j];
                        let divFilter = $('<div></div>').css({ marginLeft: '2rem', fontSize: '.8rem' }).appendTo(filtersContainer);
                        
                        // For action 222, extract first byte and add to label
                        let actionExtLabel = filter.actionExt;
                        if (is222 && filter.context && filter.context.payloadByte !== undefined) {
                            actionExtLabel = `[${filter.context.payloadByte}] ${filter.actionExt}`;
                        }
                        
                        if (typeof filter.dest !== 'undefined') {
                            let cb = $('<div></div>').checkbox({
                                labelHtml: `<span>[<span class="msg-detail-byte">${filter.source.val}</span>] ${filter.source.name} <i class="fas fa-arrow-right msg-detail-fromto"></i> [<span class="msg-detail-byte">${filter.dest.val}</span>] ${filter.dest.name} <span class="msg-detail-byte" title="${filter.category}:${filter.payloadKey}">${actionExtLabel}</span></span>`,
                                labelHtml: `<span>[<span class="msg-detail-byte">${filter.source.val}</span>] ${filter.source.name} <i class="fas fa-arrow-right msg-detail-fromto"></i> [<span class="msg-detail-byte">${filter.dest.val}</span>] ${filter.dest.name} <span class="msg-detail-byte" title="${filter.category}:${filter.payloadKey}">${actionExtLabel}</span></span>`,
                                value: filter.filtered
                            }).appendTo(divFilter).attr('data-messageKey', filter.key).addClass('cb-filter');
                            if (typeof filter.source !== 'undefined' && filter.source.val !== null) {
                                cb.attr('data-source', filter.source.val);
                            }
                            if (typeof filter.dest !== 'undefined' && filter.dest.val !== null) {
                                cb.attr('data-dest', filter.dest.val);
                            }
                        }
                        else if (typeof filter.source !== 'undefined') {
                            let cb = $('<div></div>').checkbox({
                                labelHtml: `<span><span class="msg-detail-byte">${filter.source.name}</span></span></span>`,
                                value: filter.filtered
                            }).appendTo(divFilter).attr('data-messageKey', filter.key).addClass('cb-filter');
                            if (filter.source.val !== null) {
                                cb.attr('data-source', filter.source.val);
                            }
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
            
            // Create container for other protocols (columns 3-4)
            let otherProtocolsContainer = $('<div></div>').appendTo(outer).addClass('pnl-other-protocols').css({
                gridColumn: 'span 2',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem'
            });
            
            // Add all non-broadcast protocols
            for (let i = 0; i < otherProtocols.length; i++) {
                let f = otherProtocols[i];
                let divP = $('<div></div>').appendTo(otherProtocolsContainer).addClass('pnl-protocol').css({
                    border: 'solid 1px #ccc',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    backgroundColor: '#f9f9f9',
                    breakInside: 'avoid'
                });
                
                $('<div></div>').appendTo(divP).css({ fontWeight: 'bold' });
                $('<div></div>').appendTo(divP).checkbox({ labelHtml: `<span>${f.desc}</span>` }).addClass('cb-protocol').css({ fontWeight: 'bold' });
                for (let a = 0; a < f.actions.length; a++) {
                    let act = f.actions[a];
                    let divA = $('<div></div>').appendTo(divP).addClass('pnl-action');
                    
                    // Special handling for action 222 - add expand/collapse functionality
                    let is222 = act.val === 222;
                    let actionCheckbox = $('<div></div>').appendTo(divA).checkbox({ labelHtml: `<span>[<span class="msg-detail-byte">${act.val}</span>]<span> ${act.name}</span>` })
                        .css({ marginLeft: '1rem', fontWeight: 'bold' }).addClass('cb-action');
                    
                    let filtersContainer = $('<div></div>').appendTo(divA).addClass('pnl-filters-container');
                    
                    if (is222) {
                        // Add expander icon OUTSIDE the checkbox label so clicking it never toggles selection.
                        // (Checked = excluded; expand/collapse should be view-only.)
                        let expandIcon = $('<i></i>').addClass('fas fa-chevron-right')
                            .css({ marginLeft: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' })
                            .attr('title', 'Expand/Collapse details')
                            .insertAfter(actionCheckbox.find('input.picCheckbox-value:first'));
                        filtersContainer.hide(); // Start collapsed
                        filtersContainer.attr('data-expanded', 'false');
                        
                        expandIcon.on('click', function (evt) {
                            let isExpanded = filtersContainer.attr('data-expanded') === 'true';
                            if (isExpanded) {
                                filtersContainer.hide();
                                filtersContainer.attr('data-expanded', 'false');
                                expandIcon.removeClass('fa-chevron-down').addClass('fa-chevron-right');
                            } else {
                                filtersContainer.show();
                                filtersContainer.attr('data-expanded', 'true');
                                expandIcon.removeClass('fa-chevron-right').addClass('fa-chevron-down');
                            }
                            evt.preventDefault();
                            evt.stopPropagation();
                        });
                    }
                    
                    for (let j = 0; j < act.filters.length; j++) {
                        let filter = act.filters[j];
                        let divFilter = $('<div></div>').css({ marginLeft: '2rem', fontSize: '.8rem' }).appendTo(filtersContainer);
                        
                        // For action 222, extract first byte and add to label
                        let actionExtLabel = filter.actionExt;
                        if (is222 && filter.context && filter.context.payloadByte !== undefined) {
                            actionExtLabel = `[${filter.context.payloadByte}] ${filter.actionExt}`;
                        }
                        
                        if (typeof filter.dest !== 'undefined') {
                            let cb = $('<div></div>').checkbox({
                                labelHtml: `<span>[<span class="msg-detail-byte">${filter.source.val}</span>] ${filter.source.name} <i class="fas fa-arrow-right msg-detail-fromto"></i> [<span class="msg-detail-byte">${filter.dest.val}</span>] ${filter.dest.name} <span class="msg-detail-byte" title="${filter.category}:${filter.payloadKey}">${actionExtLabel}</span></span>`,
                                labelHtml: `<span>[<span class="msg-detail-byte">${filter.source.val}</span>] ${filter.source.name} <i class="fas fa-arrow-right msg-detail-fromto"></i> [<span class="msg-detail-byte">${filter.dest.val}</span>] ${filter.dest.name} <span class="msg-detail-byte" title="${filter.category}:${filter.payloadKey}">${actionExtLabel}</span></span>`,
                                value: filter.filtered
                            }).appendTo(divFilter).attr('data-messageKey', filter.key).addClass('cb-filter');
                            // Store source and dest for shortcut filtering
                            if (typeof filter.source !== 'undefined' && filter.source.val !== null) {
                                cb.attr('data-source', filter.source.val);
                            }
                            if (typeof filter.dest !== 'undefined' && filter.dest.val !== null) {
                                cb.attr('data-dest', filter.dest.val);
                            }
                        }
                        else if (typeof filter.source !== 'undefined') {
                            let cb = $('<div></div>').checkbox({
                                labelHtml: `<span><span class="msg-detail-byte">${filter.source.name}</span></span></span>`,
                                value: filter.filtered
                            }).appendTo(divFilter).attr('data-messageKey', filter.key).addClass('cb-filter');
                            // Store source for shortcut filtering
                            if (filter.source.val !== null) {
                                cb.attr('data-source', filter.source.val);
                            }
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
                finally {
                    dlg.attr('data-processing', false);
                }
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
            
            // Shortcut button click handler
            dlg.on('click', 'div.pnl-filter-shortcuts div.btn-toggle[data-addr-type]', function (evt) {
                let btn = $(evt.currentTarget);
                let addrType = btn.attr('data-addr-type'); // 'source' or 'dest'
                let addrVal = btn.attr('data-addr-val');
                let mode = dlg.find('div.btn-toggle[data-filter-mode][data-selected="true"]').attr('data-filter-mode') || 'replace';
                
                try {
                    dlg.attr('data-processing', true);
                    
                    if (mode === 'add') {
                        // Add mode: Just check the matching items without unchecking others
                        outer.find('div.picCheckbox.cb-filter').each(function () {
                            let cb = $(this);
                            let matchVal = cb.attr('data-' + addrType);
                            if (matchVal === addrVal) {
                                this.val(true);
                            }
                        });
                    }
                    else if (mode === 'replace') {
                        // Replace mode: Uncheck all items with this address type, then check matching ones
                        // This keeps filters from the OTHER dimension
                        outer.find('div.picCheckbox.cb-filter').each(function () {
                            let cb = $(this);
                            let hasMatchAttr = cb.attr('data-' + addrType) !== undefined;
                            if (hasMatchAttr) {
                                // Uncheck all items that have this address type
                                this.val(false);
                            }
                        });
                        
                        // Now check the ones that match our selected address
                        outer.find('div.picCheckbox.cb-filter').each(function () {
                            let cb = $(this);
                            let matchVal = cb.attr('data-' + addrType);
                            if (matchVal === addrVal) {
                                this.val(true);
                            }
                        });
                    }
                    else if (mode === 'remove') {
                        // Remove mode: Just uncheck the matching items
                        outer.find('div.picCheckbox.cb-filter').each(function () {
                            let cb = $(this);
                            let matchVal = cb.attr('data-' + addrType);
                            if (matchVal === addrVal) {
                                this.val(false);
                            }
                        });
                    }
                    
                    // Update action checkboxes
                    outer.find('div.pnl-action').each(function () {
                        let divA = $(this);
                        let checks = fnCalcChecks(divA);
                        if (checks.checked.length === 0) {
                            divA.find('div.picCheckbox.cb-action').each(function () { 
                                this.indeterminate(false); 
                                this.val(false); 
                            });
                        }
                        else if (checks.checked.length > 0 && checks.unchecked.length === 0) {
                            divA.find('div.picCheckbox.cb-action').each(function () { 
                                this.indeterminate(false); 
                                this.val(true); 
                            });
                        }
                        else {
                            divA.find('div.picCheckbox.cb-action').each(function () { 
                                this.indeterminate(true); 
                            });
                        }
                    });
                    
                    // Update protocol checkboxes
                    outer.find('div.pnl-protocol').each(function () {
                        let divP = $(this);
                        let checks = fnCalcChecks(divP);
                        if (checks.checked.length === 0) {
                            divP.find('div.picCheckbox.cb-protocol').each(function () { 
                                this.indeterminate(false); 
                                this.val(false); 
                            });
                        }
                        else if (checks.checked.length > 0 && checks.unchecked.length === 0) {
                            divP.find('div.picCheckbox.cb-protocol').each(function () { 
                                this.indeterminate(false); 
                                this.val(true); 
                            });
                        }
                        else {
                            divP.find('div.picCheckbox.cb-protocol').each(function () { 
                                this.indeterminate(true); 
                            });
                        }
                    });
                    
                } catch (err) { 
                    console.log(err); 
                } finally {
                    dlg.attr('data-processing', false);
                }
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
        _updateTitle: function () {
            var self = this, o = self.options, el = self.element;
            var titleSpan = el.find('div.picMessageListTitle:first > span');
            if (o.loadedFilename) {
                titleSpan.text('Messages - Loaded from ' + o.loadedFilename);
            }
            else {
                titleSpan.text('Messages');
            }
        },
        receivingMessages: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined') {
                o.receivingMessages = val;
                if (o.receivingMessages) {
                    el.find('div.picStartLogs > i').removeClass('far').addClass('fas');
                    el.find('div.picStartLogs').addClass('selected');
                    // Clear the loaded filename when starting live logging
                    o.loadedFilename = null;
                    self._updateTitle();
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
})(jQuery);
