(function ($) {
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
            $('<div></div>').attr('id', 'btnRunTests').appendTo(btnPnl).actionButton({ text: 'Run Script', icon: '<i class="far fa-paper-plane"></i>' }).on('click', function (e) {
                el.addClass('processing');
                outModule.begin();
            }).hide();

            // Player panel (Prev / Play / Play 1 / Next / Pause + Target toggle + speed slider)
            self._buildPlayerPanel(btnPnl);

            $('<div></div>').addClass('cancel-button').appendTo(btnPnl).actionButton({ text: 'Cancel Processing', icon: '<i class="fas fa-ban burst-animated" style="color:crimson;vertical-align:top;"></i>' }).on('click', function (e) {
                self._playerReset();
                self.msgQueue.length = 0;
                el.removeClass('processing');
                if (typeof outModule !== 'undefined' && outModule && typeof outModule.cancel === 'function') outModule.cancel();
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
                el.find('div.queue-player').hide();
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
                el.find('div.queue-player').show();
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
        _buildPlayerPanel: function (parent) {
            var self = this, o = self.options;
            if (o.playerTarget !== 'bus' && o.playerTarget !== 'app') o.playerTarget = 'bus';
            var panel = $('<div class="queue-player"></div>').appendTo(parent)
                .css({ display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px' });

            // Target: App (inbound → njsPC parser) vs Bus (outbound → RS-485)
            var divTarget = $('<div class="queue-player-target"></div>').appendTo(panel)
                .css({ display: 'inline-block', fontSize: '.8rem', marginRight: '10px', verticalAlign: 'middle' });
            $('<span></span>').text('Target: ').appendTo(divTarget).css({ marginRight: '6px' });
            var targetGroup = 'sendQueueTarget_' + Math.random().toString(36).slice(2, 8);
            var lblApp = $('<label></label>').appendTo(divTarget).css({ marginRight: '10px', cursor: 'pointer' });
            var rbApp = $('<input type="radio" />').attr('name', targetGroup).attr('value', 'app')
                .prop('checked', o.playerTarget === 'app').appendTo(lblApp)
                .css({ verticalAlign: 'middle', marginRight: '3px' });
            $('<span></span>').text('App').appendTo(lblApp);
            var lblBus = $('<label></label>').appendTo(divTarget).css({ cursor: 'pointer' });
            var rbBus = $('<input type="radio" />').attr('name', targetGroup).attr('value', 'bus')
                .prop('checked', o.playerTarget === 'bus').appendTo(lblBus)
                .css({ verticalAlign: 'middle', marginRight: '3px' });
            $('<span></span>').text('Bus').appendTo(lblBus);
            divTarget.on('change', 'input[type=radio]', function () {
                o.playerTarget = rbBus.prop('checked') ? 'bus' : 'app';
            });

            // Playback controls
            var divControls = $('<div class="queue-player-controls"></div>').attr('data-mode', 'stopped')
                .appendTo(panel).css({ display: 'inline-block', verticalAlign: 'middle' });
            var fnCreateButton = function (title, icon) {
                var btn = $('<span></span>').attr('title', title).addClass('btn').appendTo(divControls)
                    .css({ display: 'inline-block', width: '2.3rem', textAlign: 'center', cursor: 'pointer' });
                $('<i></i>').appendTo(btn).addClass(icon);
                return btn;
            };
            var btnPrev = fnCreateButton('Previous Message', 'fas fa-backward-step');
            var btnPlay = fnCreateButton('Play Queue', 'fas fa-play');
            var btnPlayOne = $('<span></span>').attr('title', 'Send 1 Message').addClass('btn').appendTo(divControls)
                .css({ display: 'inline-block', width: '2.3rem', textAlign: 'center', cursor: 'pointer' });
            $('<i></i>').appendTo(btnPlayOne).addClass('fas fa-play');
            $('<sup></sup>').text('1').appendTo(btnPlayOne).css({ fontSize: '.6rem', marginLeft: '1px', fontWeight: 'bold' });
            var btnNext = fnCreateButton('Next Message', 'fas fa-forward-step');
            var btnPause = fnCreateButton('Pause', 'fas fa-pause').addClass('disabled');

            // Status label
            var divStatus = $('<span class="queue-player-status"></span>').appendTo(panel)
                .css({ marginLeft: '8px', fontSize: '.8rem', verticalAlign: 'middle' }).text('Stopped');

            // Speed slider
            var divSlider = $('<div class="queue-player-slider"></div>').appendTo(panel)
                .css({ display: 'inline-block', width: '160px', marginLeft: '10px', verticalAlign: 'middle', paddingTop: '2px' });
            var slider = $('<input></input>').attr('type', 'range').attr('min', -100).attr('max', 100).attr('value', 0)
                .appendTo(divSlider).css({ width: '100%' });
            var divSLabel = $('<div></div>').appendTo(divSlider).css({ fontSize: '.65rem', width: '100%', height: '14px' });
            $('<span></span>').text('Faster').appendTo(divSLabel).css({ float: 'left' });
            $('<span></span>').text('Slower').appendTo(divSLabel).css({ float: 'right' });

            self._player = {
                panel: panel, controls: divControls, status: divStatus,
                btnPrev: btnPrev, btnPlay: btnPlay, btnPlayOne: btnPlayOne, btnNext: btnNext, btnPause: btnPause,
                slider: slider, rbApp: rbApp, rbBus: rbBus,
                index: -1, timer: null
            };

            btnPrev.on('click', function () { self._playerPrev(); });
            btnPlay.on('click', function () { self._playerPlay(); });
            btnPlayOne.on('click', function () { self._playerPlayOne(); });
            btnNext.on('click', function () { self._playerNext(); });
            btnPause.on('click', function () { self._playerPause(); });
        },
        _playerMessages: function () {
            return this.element.find('div.queue-send-list > div.queued-message');
        },
        _playerTargetMode: function () { return this._player.rbBus.prop('checked') ? 'bus' : 'app'; },
        _playerDelayFor: function (msg) {
            var d = (msg && typeof msg.delay === 'number') ? msg.delay : 0;
            var adj = this._player.slider.val() / 100;
            return Math.max(0, d + d * adj);
        },
        _playerSend: function (msg) {
            var mm = $('div.picMessageManager')[0];
            if (!mm) return;
            if (this._playerTargetMode() === 'bus') mm.sendOutboundMessage(msg);
            else mm.sendInboundMessage(msg);
        },
        _playerClearTimer: function () {
            if (this._player && this._player.timer) { clearTimeout(this._player.timer); this._player.timer = null; }
        },
        _playerSetButtons: function (mode) {
            var p = this._player;
            switch (mode) {
                case 'play':
                    p.btnPrev.addClass('disabled');
                    p.btnNext.addClass('disabled');
                    p.btnPlay.addClass('disabled');
                    p.btnPlayOne.addClass('disabled');
                    p.btnPause.removeClass('flicker-animated').removeClass('disabled');
                    break;
                case 'paused':
                    p.btnPrev.removeClass('disabled');
                    p.btnNext.removeClass('disabled');
                    p.btnPlay.removeClass('disabled');
                    p.btnPlayOne.removeClass('disabled');
                    p.btnPause.removeClass('disabled').addClass('flicker-animated');
                    break;
                case 'stopped':
                default:
                    p.btnPrev.removeClass('disabled');
                    p.btnNext.removeClass('disabled');
                    p.btnPlay.removeClass('disabled');
                    p.btnPlayOne.removeClass('disabled');
                    p.btnPause.removeClass('flicker-animated').addClass('disabled');
                    break;
            }
        },
        _playerReset: function () {
            var self = this, el = self.element;
            if (!self._player) return;
            self._playerClearTimer();
            self._player.controls.attr('data-mode', 'stopped');
            self._player.status.text('Stopped');
            el.find('div.queue-send-list > div.queued-message').removeClass('sending').removeClass('sent');
            self._playerSetButtons('stopped');
            self._player.index = -1;
            el.removeClass('processing');
            el.find('div.picMessageListTitle:first > span').text('Send Message Queue');
        },
        _playerFinish: function () {
            var self = this, el = self.element;
            self._playerClearTimer();
            self._player.controls.attr('data-mode', 'stopped');
            self._player.status.text('Complete');
            self._playerSetButtons('stopped');
            el.removeClass('processing');
            el.find('div.picMessageListTitle:first > span').text('Send Message Queue');
        },
        _playerProcessAt: function (i) {
            var self = this, el = self.element;
            var msgs = self._playerMessages();
            if (i < 0 || i >= msgs.length) { self._playerFinish(); return; }
            var elMsg = $(msgs[i]);
            var msg = elMsg.data('message');
            if (!msg) { self._playerFinish(); return; }
            self._player.index = i;
            msgs.removeClass('sending');
            elMsg.addClass('sending');
            self._player.status.text('Sending ' + (i + 1) + ' of ' + msgs.length);
            var t = self._playerDelayFor(msg);
            self._playerClearTimer();
            self._player.timer = setTimeout(function () {
                try {
                    self._playerSend(msg);
                    elMsg.removeClass('sending').addClass('sent');
                } catch (err) { console.log('Error sending queued message: ' + err); }
                finally {
                    var mode = self._player.controls.attr('data-mode');
                    if (mode === 'play') {
                        if (i + 1 < msgs.length) self._playerProcessAt(i + 1);
                        else self._playerFinish();
                    }
                    else {
                        // Single step completed; park in paused state.
                        self._player.controls.attr('data-mode', 'paused');
                        self._playerSetButtons('paused');
                        self._player.status.text('Paused at ' + (i + 1) + ' of ' + msgs.length);
                    }
                }
            }, t);
        },
        _playerStartIndex: function () {
            var msgs = this._playerMessages();
            var start = this._player.index < 0 ? 0 : this._player.index + 1;
            if (start >= msgs.length) {
                msgs.removeClass('sent');
                start = 0;
            }
            return start;
        },
        _playerPlay: function () {
            var self = this, el = self.element;
            var p = self._player;
            if (p.btnPlay.hasClass('disabled')) return;
            var msgs = self._playerMessages();
            if (msgs.length === 0) return;
            el.addClass('processing');
            p.controls.attr('data-mode', 'play');
            self._playerSetButtons('play');
            p.status.text('Playing...');
            self._playerProcessAt(self._playerStartIndex());
        },
        _playerPlayOne: function () {
            var self = this, el = self.element;
            var p = self._player;
            if (p.btnPlayOne.hasClass('disabled')) return;
            var msgs = self._playerMessages();
            if (msgs.length === 0) return;
            el.addClass('processing');
            p.controls.attr('data-mode', 'paused');
            self._playerSetButtons('paused');
            self._playerProcessAt(self._playerStartIndex());
        },
        _playerPrev: function () {
            var self = this, el = self.element;
            var p = self._player;
            if (p.btnPrev.hasClass('disabled')) return;
            var msgs = self._playerMessages();
            if (msgs.length === 0) return;
            el.addClass('processing');
            var start = p.index > 0 ? p.index - 1 : 0;
            p.controls.attr('data-mode', 'paused');
            self._playerSetButtons('paused');
            self._playerProcessAt(start);
        },
        _playerNext: function () {
            var self = this, el = self.element;
            var p = self._player;
            if (p.btnNext.hasClass('disabled')) return;
            var msgs = self._playerMessages();
            if (msgs.length === 0) return;
            var start = p.index < 0 ? 0 : p.index + 1;
            if (start >= msgs.length) return;
            el.addClass('processing');
            p.controls.attr('data-mode', 'paused');
            self._playerSetButtons('paused');
            self._playerProcessAt(start);
        },
        _playerPause: function () {
            var self = this;
            var p = self._player;
            if (p.btnPause.hasClass('disabled')) return;
            self._playerClearTimer();
            var mode = p.controls.attr('data-mode');
            if (mode === 'paused') {
                // Resume continuous play from the next message.
                var msgs = self._playerMessages();
                var start = p.index + 1;
                if (start >= msgs.length) { self._playerFinish(); return; }
                p.controls.attr('data-mode', 'play');
                self._playerSetButtons('play');
                p.status.text('Playing...');
                self._playerProcessAt(start);
            }
            else {
                // Pause mid-play.
                p.controls.attr('data-mode', 'paused');
                self._playerSetButtons('paused');
                p.status.text('Paused at ' + (p.index + 1));
            }
        }
    });
})(jQuery);
