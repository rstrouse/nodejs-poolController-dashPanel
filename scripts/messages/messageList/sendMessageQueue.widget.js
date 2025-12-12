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
})(jQuery);
