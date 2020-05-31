(function ($) {
    $.widget("pic.messageManager", {
        options: { socket: null },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initLogs();
            el[0].receiveLogMessages = function (val) { self.receiveLogMessages(val); };
            el[0].sendOutboundMessage = function (msg) { self.sendOutboundMessage(msg); };
        },
        _createControllerPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picController').each(function () { this.initController(data); });
        },
        _initLogs: function () {
            var self = this, o = self.options, el = self.element;
            console.log('initializing state');
            $.getJSON('/config/web.services', null, function (data, status, xhr) {
                console.log(data);
                o.apiServiceUrl = data.protocol + data.ip + (typeof data.port !== 'undefined' && !isNaN(data.port) ? ':' + data.port : '');
                $('body').attr('data-apiserviceurl', o.apiServiceUrl);
                $.getApiService('/state/all', null, function (data, status, xhr) {
                    $('body').attr('data-controllertype', data.equipment.controllerType);
                    self._createControllerPanel(data);
                    self._initSockets();
                    console.log(data);
                })
                    .done(function (status, xhr) { console.log('Done:' + status); })
                    .fail(function (xhr, status, error) { console.log('Failed:' + error); });
            });
        },
        _initSockets: function () {
            var self = this, o = self.options, el = self.element;
            o.socket = io(o.apiServiceUrl, { reconnectionDelay: 2000, reconnection: true, reconnectionDelayMax: 20000 });
            o.socket.on('controller', function (data) {
                console.log({ evt: 'controller', data: data });
                $('div.picController').each(function () {
                    console.log('setting controller');
                    this.setControllerState(data);
                });
            });
            o.socket.on('equipment', function (data) {
                console.log({ evt: 'equipment', data: data });
                $('body').attr('data-controllertype', data.controllerType);
                $('div.picController').each(function () {
                    this.setEquipmentState(data);
                });
            });

            o.socket.on('logMessage', function (data) {
                console.log({ evt: 'logMessage', data: data });
                $('div.picMessages').each(function () {
                    this.addMessage(data);
                });

            });
            o.socket.on('connect_error', function (data) {
                console.log('connection error:' + data);
                o.isConnected = false;
                $('div.picController').each(function () {
                    this.setConnectionError({ status: { val: 255, name: 'error', desc: 'Connection Error' } });
                });
                el.find('div.picControlPanel').each(function () {
                    //$(this).addClass('picDisconnected');
                    $('div.picMessages').each(function () {
                        //this.receivingMessages(false);
                    });
                });

            });
            o.socket.on('connect_timeout', function (data) {
                console.log('connection timeout:' + data);
            });
            o.socket.on('reconnect', function (data) {
                console.log('reconnect:' + data);
            });
            o.socket.on('reconnect_attempt', function (data) {
                console.log('reconnect attempt:' + data);
            });
            o.socket.on('reconnecting', function (data) {
                console.log('reconnecting:' + data);
            });
            o.socket.on('reconnect_failed', function (data) {
                console.log('reconnect failed:' + data);
            });
            o.socket.on('connect', function (sock) {
                console.log({ msg: 'socket connected:', sock: sock });
                o.isConnected = true;
                el.find('div.picControlPanel').each(function () {
                    $(this).removeClass('picDisconnected');
                });
                // Find out if we should be receiving messages and
                // reconnect if so.
                self.receiveLogMessages($('div.picMessages:first')[0].receivingMessages());
                //self.receiveLogMessages(o.receiveLogMessages);
            });
            o.socket.on('close', function (sock) {
                console.log({ msg: 'socket closed:', sock: sock });
                o.isConnected = false;
            });
        },
        receiveLogMessages: function (val) {
            var self = this, o = self.options, el = self.element;
            if (o.isConnected) {
                if (typeof val !== 'undefined') {
                    console.log(`sendLogMessages Emit ${val}`);
                    o.socket.emit('sendLogMessages', makeBool(val));
                    o.sendLogMessages = makeBool(val);
                    $('div.picMessages').each(function () {
                        this.receivingMessages(o.sendLogMessages);
                    });
                }
            }
        },
        sendOutboundMessage: function (msg) {
            var self = this, o = self.options, el = self.element;
            if (o.isConnected) {
                if (typeof msg !== 'undefined') {
                    console.log(`sendOutboundMessage Emit ${msg}`);
                    o.socket.emit('sendOutboundMessage', msg);
                }
            }
        }
    });
})(jQuery);
