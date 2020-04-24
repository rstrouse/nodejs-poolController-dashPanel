(function ($) {
    $.widget("pic.dashboard", {
        options: { socket: null },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initState();
        },
        _createControllerPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picController').each(function () { this.initController(data); });
        },
        _createBodiesPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picBodies').each(function () { this.initBodies(data); });
        },
        _createCircuitsPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picCircuits').each(function () { this.initCircuits(data); });
        },
        _createPumpsPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picPumps').each(function () { this.initPumps(data); });
        },
        _createSchedulesPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picSchedules').each(function () { this.initSchedules(data); });
        },
        _createChemistryPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picChemistry').each(function () { this.initChemistry(data); });
        },
        _resetState: function () {
            var self = this, o = self.options, el = self.element;
            console.log('resetting state');
            $.getJSON('/config/web.services', null, function (data, status, xhr) {
                console.log(data);
                o.apiServiceUrl = data.protocol + data.ip + (typeof data.port !== 'undefined' && !isNaN(data.port) ? ':' + data.port : '');
                $.getApiService('/state/all', null, function (data, status, xhr) {
                    if (data.equipment.model.startsWith('IntelliCenter')) {
                        $('div.picDashboard').attr('data-controllertype', 'IntelliCenter');
                        $('div.picDashboard').attr('data-hidethemes', 'false');
                    }
                    else {
                        $('div.picDashboard').attr('data-hidethemes', 'true');
                        if (data.equipment.model.startsWith('IntelliTouch'))
                            $('div.picDashboard').attr('data-controllertype', 'IntelliTouch');
                        else if (data.equipment.model.startsWith('EasyTouch'))
                            $('div.picDashboard').attr('data-controllertype', 'EasyTouch');
                        else
                            $('div.picDashboard').attr('data-controllertype', 'SunTouch');
                        $('div.picDashboard').attr('data-hideintellibrite', 'true');

                    }
                    self._createControllerPanel(data);
                    self._createCircuitsPanel(data);
                    self._createPumpsPanel(data);
                    self._createBodiesPanel(data);
                    self._createChemistryPanel(data);
                    self._createSchedulesPanel(data);
                    console.log(data);
                })
                    .done(function (status, xhr) { console.log({ msg: 'Done:', status: status }); })
                    .fail(function (xhr, status, error) { console.log('Failed:' + error); });
            });
        },
        _initState: function () {
            var self = this, o = self.options, el = self.element;
            console.log('initializing state');
            $.getJSON('/config/web.services', null, function (data, status, xhr) {
                console.log(data);
                o.apiServiceUrl = data.protocol + data.ip + (typeof data.port !== 'undefined' && !isNaN(data.port) ? ':' + data.port : '');
                $.getApiService('/state/all', null, function (data, status, xhr) {
                    if (data.equipment.model.startsWith('IntelliCenter')) {
                        $('div.picDashboard').attr('data-controllertype', 'IntelliCenter');
                        $('div.picDashboard').attr('data-hidethemes', 'false');
                    }
                    else {
                        $('div.picDashboard').attr('data-hidethemes', 'true');
                        if (data.equipment.model.startsWith('IntelliTouch'))
                            $('div.picDashboard').attr('data-controllertype', 'IntelliTouch');
                        else if(data.equipment.model.startsWith('EasyTouch')) 
                            $('div.picDashboard').attr('data-controllertype', 'EasyTouch');
                        else
                            $('div.picDashboard').attr('data-controllertype', 'SunTouch');
                        $('div.picDashboard').attr('data-hideintellibrite', 'true');

                    }
                    self._createControllerPanel(data);
                    self._createCircuitsPanel(data);
                    self._createPumpsPanel(data);
                    self._createBodiesPanel(data);
                    self._createChemistryPanel(data);
                    self._createSchedulesPanel(data);
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
            o.socket.on('circuit', function (data) {
                console.log({ evt: 'circuit', data: data });
                var circs = $('div.picCircuit[data-eqid=' + data.id + ']');
                if (circs.length === 0) $('div.picCircuits.picControlPanel').each(function () {
                    this.setItem('circuit', data);
                });
                $('div.picCircuit[data-circuitid=' + data.id + ']').each(function () {
                    this.setState(data);
                });
                $('div.picBody[data-circuitid=' + data.id + ']').each(function () {
                    this.setCircuitState(data);
                });
            });
            o.socket.on('virtualCircuit', function (data) {
                console.log({ evt: 'virtualCircuit', data: data });
                $('div.picVirtualCircuit[data-circuitid=' + data.id + ']').each(function () {
                    this.setState(data);
                });
            });
            o.socket.on('circuitGroup', function (data) {
                console.log({ evt: 'circuitGroup', data: data });
                var circs = $('div.picCircuit[data-eqid=' + data.id + ']');
                if (circs.length === 0) $('div.picCircuits.picControlPanel').each(function () {
                    this.setItem('circuitGroup', data);
                });
                $('div.picCircuitGroup[data-groupid=' + data.id + ']').each(function () {
                    this.setState(data);
                });

            });
            o.socket.on('lightGroup', function (data) {
                console.log({ evt: 'lightGroup', data: data });
                var circs = $('div.picCircuit[data-eqid=' + data.id + ']');
                if (circs.length === 0) $('div.picCircuits.picControlPanel').each(function () {
                    this.setItem('lightGroup', data);
                });
                $('div.picLightGroup[data-groupid=' + data.id + ']').each(function () {
                    this.setState(data);
                });
            });
            o.socket.on('intellibrite', function (data) {
                console.log({ evt: 'intellibrite', data: data });
                $('div.picLightSettings[data-circuitid=0]').each(function () {
                    this.setState(data);
                });
                if (data.action.val !== 0) $('span.picIntelliBriteIcon').addClass('fa-spin');
                else $('span.picIntelliBriteIcon').removeClass('fa-spin');
            });

            o.socket.on('feature', function (data) {
                console.log({ evt: 'feature', data: data });
                var circs = $('div.picCircuit[data-eqid=' + data.id + ']');
                if (circs.length === 0) $('div.picCircuits.picControlPanel').each(function () {
                    this.setItem('feature', data);
                });
                $('div.picCircuit[data-featureid= ' + data.id + ']').each(function () {
                    this.setState(data);
                });
            });
            o.socket.on('temps', function (data) {
                console.log({ evt: 'temps', data: data });
                $('div.picBodies').each(function () {
                    this.setTemps(data);
                });
            });
            o.socket.on('chlorinator', function (data) {
                console.log({ evt: 'chlorinator', data: data });
                $('div.picChlorinator[data-id=' + data.id + ']').each(function () {
                    this.setEquipmentData(data);
                });
            });
            o.socket.on('body', function (data) {
                $('div.picBody[data-id=' + data.id + ']').each(function () {
                    this.setEquipmentData(data);
                });
                console.log({ evt: 'body', data: data });
            });
            o.socket.on('schedule', function (data) {
                console.log({ evt: 'schedule', data: data });
                $('div.picScheduleContainer').each(function () {
                    this.setScheduleData(data);
                });

            });
            o.socket.on('delay', function (data) {
                console.log({ evt: 'delay', data: data });
            });
            o.socket.on('equipment', function (data) {
                console.log({ evt: 'equipment', data: data });
                if(data.controllerType.startsWith('intellicenter'))
                    $('div.picDashboard').attr('data-controllertype', 'IntelliCenter');
                $('div.picController').each(function () {
                    this.setEquipmentState(data);
                });
            });

            o.socket.on('controller', function (data) {
                console.log({ evt: 'controller', data: data });
                $('div.picController').each(function () {
                    this.setControllerState(data);
                });
                
            });
            o.socket.on('pump', function (data) {
                console.log({ evt: 'pump', data: data });
                $('div.picPumpContainer').each(function () {
                    this.setPumpData(data);
                });
            });
            o.socket.on('pumpExt', function (data) {
                console.log({ evt: 'pumpExt', data: data });
                $('div.picPumpContainer').each(function () {
                    this.setPumpData(data);
                });
            });

            o.socket.on('heater', function (data) {
                console.log({ evt: 'heater', data: data });
            });
            o.socket.on('connect_error', function (data) {
                console.log('connection error:' + data);
                $('div.picController').each(function () {
                    this.setConnectionError({ status: { val: 255, name: 'error', desc: 'Connection Error' } });
                });
                el.find('div.picControlPanel').each(function () {
                    $(this).addClass('picDisconnected');
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
                el.find('div.picControlPanel').each(function () {
                    $(this).removeClass('picDisconnected');
                });
                self._resetState();
            });
            o.socket.on('close', function (sock) {
                console.log({ msg: 'socket closed:', sock: sock });
            });
           
        }
    }
    );
})(jQuery);
