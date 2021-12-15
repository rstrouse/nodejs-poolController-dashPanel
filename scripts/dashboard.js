(function ($) {
    $.widget("pic.dashboard", {
        options: { socket: null },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initState();
            el[0].receiveLogMessages = function (val) { self.receiveLogMessages(val); };
            el[0].receivePortStats = function (val) { self.receivePortStats(val); };
            el[0].reset = function () { self._reset(); };
            console.log(el[0]);
        },
        _clearPanels: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picController').each(function () { this.initController(); });
            el.find('div.picBodies').each(function () { this.initBodies(); });
            el.find('div.picCircuits').each(function () { this.initCircuits(); });
            el.find('div.picLights').each(function () { this.initLights(); });
            el.find('div.picPumps').each(function () { this.initPumps(); });
            el.find('div.picChemistry').each(function () { this.initChemistry(); });
            el.find('div.picSchedules').each(function () { this.initSchedules(); });
            el.find('div.picFilters').each(function () { this.initFilters(); });
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
            el.find('div.picLights').each(function () { this.initLights(data); });
        },
        _createPumpsPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picPumps').each(function () { this.initPumps(data); });
        },
        _createFiltersPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFilters').each(function () { this.initFilters(data); });
        },

        _reset: function () {
            var self = this, o = self.options, el = self.element;
            if (o.socket && typeof o.socket !== 'undefined' && o.socket.connected) {
                o.socket.close();
            }
            o.socket = null;
            self._initState();
        },
        _createSchedulesPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picSchedules').each(function () { this.initSchedules(data); });
        },
        _createChemistryPanel: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picChemistry').each(function () { this.initChemistry(data); });
        },
        _setControllerType: function (type) {
            var self = this, o = self.options, el = self.element;
            $('body').attr('data-controllertype', type);
            switch (type.toLowerCase()) {
                case 'intellicenter':
                    $('div.picDashboard').attr('data-controllertype', 'IntelliCenter');
                    $('div.picDashboard').attr('data-hidethemes', 'false');
                    $('div.picDashboard').attr('data-hideintellibrite', 'true');
                    $('div.picDashboard').attr('data-masterid', '0');
                    break;
                case 'virtual':
                case 'nixie':
                    $('div.picDashboard').attr('data-controllertype', 'Nixie');
                    $('div.picDashboard').attr('data-hidethemes', 'false');
                    $('div.picDashboard').attr('data-hideintellibrite', 'true');
                    $('div.picDashboard').attr('data-masterid', '1');
                    break;
                case 'intellitouch':
                    $('div.picDashboard').attr('data-controllertype', 'IntelliTouch');
                    $('div.picDashboard').attr('data-hidethemes', 'true');
                    $('div.picDashboard').attr('data-hideintellibrite', 'false');
                    $('div.picDashboard').attr('data-masterid', '0');
                    break;
                case 'easytouch':
                    $('div.picDashboard').attr('data-controllertype', 'EasyTouch');
                    $('div.picDashboard').attr('data-hidethemes', 'true');
                    $('div.picDashboard').attr('data-hideintellibrite', 'false');
                    $('div.picDashboard').attr('data-masterid', '0');
                    break;
                case 'suntouch':
                    $('div.picDashboard').attr('data-controllertype', 'SunTouch');
                    $('div.picDashboard').attr('data-hidethemes', 'true');
                    $('div.picDashboard').attr('data-hideintellibrite', 'true');
                    $('div.picDashboard').attr('data-masterid', '0');
                    break;
                default:
                    $('div.picDashboard').attr('data-controllertype', type);
                    $('div.picDashboard').attr('data-hidethemes', 'true');
                    $('div.picDashboard').attr('data-hideintellibrite', 'true');
                    $('div.picDashboard').attr('data-masterid', '1');
                    break;
            }

        },
        _resetState: function () {
            var self = this, o = self.options, el = self.element;
            console.log('resetting state');
            $.getLocalService('/config/serviceUri', null, function (data, status, xhr) {
                console.log(data);
                o.apiServiceUrl = data.protocol + data.ip + (typeof data.port !== 'undefined' && !isNaN(data.port) ? ':' + data.port : '');
                o.useProxy = makeBool(data.useProxy);
                $('body').attr('data-apiserviceurl', o.apiServiceUrl);
                $('body').attr('data-apiproxy', o.useProxy);
                $.getApiService('/state/all', null, function (data, status, xhr) {
                    self._setControllerType(data.controllerType);
                    //if (data.equipment.model.startsWith('IntelliCenter')) {
                    //    $('div.picDashboard').attr('data-controllertype', 'IntelliCenter');
                    //    $('div.picDashboard').attr('data-hidethemes', 'false');
                    //}
                    //else {
                    //    $('div.picDashboard').attr('data-hidethemes', 'true');
                    //    if (data.equipment.model.startsWith('IntelliTouch'))
                    //        $('div.picDashboard').attr('data-controllertype', 'IntelliTouch');
                    //    else if (data.equipment.model.startsWith('EasyTouch'))
                    //        $('div.picDashboard').attr('data-controllertype', 'EasyTouch');
                    //    else
                    //        $('div.picDashboard').attr('data-controllertype', 'SunTouch');
                    //    $('div.picDashboard').attr('data-hideintellibrite', 'true');

                    //}
                    self._createBodiesPanel(data);
                    self._createControllerPanel(data);
                    self._createCircuitsPanel(data);
                    self._createPumpsPanel(data);
                    self._createChemistryPanel(data);
                    self._createSchedulesPanel(data);
                    self._createFiltersPanel(data);
                    console.log(data);
                    self.receivePortStats(o.sendPortStatus);
                })
                    .done(function (status, xhr) { console.log({ msg: 'Done:', status: status }); })
                    .fail(function (xhr, status, error) { console.log('Failed:' + error); });
            });
        },
        _initState: function () {
            var self = this, o = self.options, el = self.element;
            console.log('initializing state');
            $.getLocalService('/config/serviceUri', null, function (data, status, xhr) {
                console.log(data);
                o.apiServiceUrl = data.protocol + data.ip + (typeof data.port !== 'undefined' && !isNaN(data.port) ? ':' + data.port : '');
                o.useProxy = makeBool(data.useProxy);
                $('body').attr('data-apiserviceurl', o.apiServiceUrl);
                $('body').attr('data-apiproxy', o.useProxy);
                $.getApiService('/state/all', null, function (data, status, xhr) {
                    if (typeof data.equipment === 'undefined' || typeof data.equipment.model === 'undefined') { self._clearPanels(); return; }
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
                    self._createBodiesPanel(data);
                    self._createCircuitsPanel(data);
                    self._createPumpsPanel(data);
                    self._createChemistryPanel(data);
                    self._createSchedulesPanel(data);
                    self._createFiltersPanel(data);
                    self._initSockets();
                    console.log(data);
                    console.log('initializing element order');


                    if (typeof getStorage('--number-of-columns') === 'undefined') setStorage('--number-of-columns', $(':root').css('--number-of-columns'));
                    $(':root').css('--number-of-columns', getStorage('--number-of-columns'));

                    if (typeof getStorage('--picBodies-order') === 'undefined') setStorage('--picBodies-order', $(':root').css('--picBodies-order'));
                    $(':root').css('--picBodies-order', getStorage('--picBodies-order'));
                    if (typeof getStorage('--picBodies-display') === 'undefined') setStorage('--picBodies-display', $(':root').css('--picBodies-display'));
                    $(':root').css('--picBodies-display', getStorage('--picBodies-display'));
                    if (typeof getStorage('--picCircuits-order') === 'undefined') setStorage('--picCircuits-order', $(':root').css('--picCircuits-order'));
                    $(':root').css('--picCircuits-order', getStorage('--picCircuits-order'));
                    if (typeof getStorage('--picCircuits-display') === 'undefined') setStorage('--picCircuits-display', $(':root').css('--picCircuits-display'));
                    $(':root').css('--picCircuits-display', getStorage('--picCircuits-display'));
                    if (typeof getStorage('--picLights-order') === 'undefined') setStorage('--picLights-order', $(':root').css('--picLights-order'));
                    $(':root').css('--picLights-order', getStorage('--picLights-order'));
                    if (typeof getStorage('--picLights-display') === 'undefined') setStorage('--picLights-display', $(':root').css('--picLights-display'));
                    $(':root').css('--picLights-display', getStorage('--picLights-display'));
                    if (typeof getStorage('--picVirtualCircuits-order') === 'undefined') setStorage('--picVirtualCircuits-order', $(':root').css('--picVirtualCircuits-order'));
                    $(':root').css('--picVirtualCircuits-order', getStorage('--picVirtualCircuits-order'));
                    if (typeof getStorage('--picVirtualCircuits-display') === 'undefined') setStorage('--picVirtualCircuits-display', $(':root').css('--picVirtualCircuits-display'));
                    $(':root').css('--picVirtualCircuits-display', getStorage('--picVirtualCircuits-display'));
                    if (typeof getStorage('--picPumps-order') === 'undefined') setStorage('--picPumps-order', $(':root').css('--picPumps-order'));
                    $(':root').css('--picPumps-order', getStorage('--picPumps-order'));
                    if (typeof getStorage('--picPumps-display') === 'undefined') setStorage('--picPumps-display', $(':root').css('--picPumps-display'));
                    $(':root').css('--picPumps-display', getStorage('--picPumps-display'));
                    if (typeof getStorage('--picSchedules-order') === 'undefined') setStorage('--picSchedules-order', $(':root').css('--picSchedules-order'));
                    $(':root').css('--picSchedules-order', getStorage('--picSchedules-order'));
                    if (typeof getStorage('--picSchedules-display') === 'undefined') setStorage('--picSchedules-display', $(':root').css('--picSchedules-display'));
                    $(':root').css('--picSchedules-display', getStorage('--picSchedules-display'));
                    if (typeof getStorage('--picChemistry-order') === 'undefined') setStorage('--picChemistry-order', $(':root').css('--picChemistry-order'));
                    $(':root').css('--picChemistry-order', getStorage('--picChemistry-order'));
                    if (typeof getStorage('--picChemistry-display') === 'undefined') setStorage('--picChemistry-display', $(':root').css('--picChemistry-display'));
                    $(':root').css('--picChemistry-display', getStorage('--picChemistry-display'));

                    if (typeof getStorage('--picFilters-order') === 'undefined') setStorage('--picFilters-order', $(':root').css('--picFilters-order'));
                    $(':root').css('--picFilters-order', getStorage('--picFilters-order'));
                    if (typeof getStorage('--picFilters-display') === 'undefined') setStorage('--picFilters-display', $(':root').css('--picFilters-display'));
                    $(':root').css('--picFilters-display', getStorage('--picFilters-display'));

                    if (typeof getStorage('--show-time-remaining') === 'undefined') setStorage('--show-time-remaining', $(':root').css('--show-time-remaining'));
                    $(':root').css('--show-time-remaining', getStorage('--show-time-remaining'));

                    // put elements in correct container div
                    let arr = ['picBodies', 'picCircuits', 'picLights', 'picSchedules', 'picChemistry', 'picPumps', 'picVirtualCircuits', 'picFilters'];
                    arr.forEach(id => {
                        console.log(id);
                        let el = $(`.${id}`);
                        let elVarName = `--${id}-order`;
                        if (getStorage(elVarName) >= 200) {
                            $(el).appendTo('.container3');
                        }
                        else if (getStorage(elVarName) >= 100) {
                            $(el).appendTo('.container2');
                        }
                        else {
                            $(el).appendTo('.container1');
                        }
                    });
                })
                    .done(function (status, xhr) { console.log('Done:' + status); })
                    .fail(function (xhr, status, error) {
                        console.log('Failed:' + error);
                        self._clearPanels();
                    });
            });
        },
        _initSockets: function () {
            var self = this, o = self.options, el = self.element;
            if (!o.useProxy) {
                console.log({ msg: 'Checking Url', url: o.apiServiceUrl });
                o.socket = io(o.apiServiceUrl, { reconnectionDelay: 2000, reconnection: true, reconnectionDelayMax: 20000, upgrade: true });
            }
            else {
                let path = window.location.pathname.replace(/[^/]*$/, '') + 'socket.io';
                console.log({ msg: 'Connecting socket through proxy', url: window.location.origin.toString(), path: path });
                o.socket = io(window.location.origin.toString(), { path: path, reconnectionDelay: 2000, reconnection: true, reconnectionDelayMax: 20000, upgrade: true });
            }
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
                el.find('div.picChemistry').each(function () { this.setChlorinatorData(data); });
            });
            o.socket.on('body', function (data) {
                $('div.picBody[data-id=' + data.id + ']').each(function () {
                    this.setEquipmentData(data);
                });
                console.log({ evt: 'body', data: data });
            });
            o.socket.on('filter', function (data) {
                console.log({ evt: 'filter', data: data });
                $('div.picBodyFilter[data-id=' + data.id + ']').each(function () {
                    this.setEquipmentData(data);
                });
                console.log({ evt: 'filter', data: data });
            });
            o.socket.on('config', function (data) {
                console.log({ evt: 'config', data: data });
            });
            o.socket.on('schedule', function (data) {
                console.log({ evt: 'schedule', data: data });
                $('div.picScheduleContainer').each(function () {
                    this.setScheduleData(data);
                });

            });
            o.socket.on('delays', function (data) {
                console.log({ evt: 'delays', data: data });
                $('div.picSystemDelays').each(function () {
                    this.setEquipmentData(data);
                });
            });

            o.socket.on('equipment', function (data) {
                console.log({ evt: 'equipment', data: data });
                $('body').attr('data-controllertype', data.controllerType);
                if (data.controllerType.startsWith('intellicenter'))
                    $('div.picDashboard').attr('data-controllertype', 'IntelliCenter');
                $('div.picController').each(function () {
                    this.setEquipmentState(data);
                });
            });
            o.socket.on('valve', function (data) {
                console.log({ evt: 'valve', data: data });

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
            o.socket.on('logMessage', function (data) {
                console.log({ evt: 'logMessage', data: data });
            });
            o.socket.on('rs485Stats', function (data) {
                console.log({ evt: 'rs485Stats', data: data });
                var rs485Displays = el.find('div.rs485Stats');
                rs485Displays.each(function () {
                    this.setRS485Stats(data);
                });
                // Turn it off if there are no displays out there.
                if (rs485Displays.length === 0) self.receivePortStats(false);
            });
            o.socket.on('chemController', function (data) {
                console.log({ evt: 'chemController', data: data });
                el.find('div.picChemistry').each(function () { this.setChemControllerData(data); });
                el.find(`div.pnl-chemcontroller-settings[data-eqid="${data.id}"]`).each(function () { this.setEquipmentData(data); });

            });
            o.socket.on('chemicalDose', (data) => {
                console.log({ evt: 'chemDose', data: data });
            });
            o.socket.on('heater', function (data) {
                console.log({ evt: 'heater', data: data });
            });
            o.socket.on('connect_error', function (data) {
                console.log('connection error:' + data);
                o.isConnected = false;
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
                o.isConnected = true;
                el.find('div.picControlPanel').each(function () {
                    $(this).removeClass('picDisconnected');
                });
                self._resetState();
            });
            o.socket.on('close', function (sock) {
                console.log({ msg: 'socket closed:', sock: sock });
                o.isConnected = false;
            });
            o.socket.on('*', function (event, data) {
                console.log({ evt: event, data: data });
            });
        },
        receiveLogMessages: function (val) {
            var self = this, o = self.options, el = self.element;
            if (o.isConnected) {
                if (typeof val !== 'undefined') {
                    console.log(`sendLogMessages Emit ${val}`);
                    o.socket.emit('sendLogMessages', makeBool(val));
                    o.sendLogMessages = makeBool(val);
                }
            }
        },
        receivePortStats: function (val) {
            var self = this, o = self.options, el = self.element;
            if (o.isConnected) {
                if (typeof val !== 'undefined') {
                    console.log(`sendPortStatus Emit ${val}`);
                    o.socket.emit('sendRS485PortStats', makeBool(val));
                    o.sendPortStatus = makeBool(val);
                }
            }
        }

    });
})(jQuery);
