(function ($) {
    $.widget('pic.configGeneral', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgGeneral');
            $.getApiService('/config/options/general', null, function (opts, status, xhr) {
                console.log(opts);
                $('<div></div>').appendTo(el).pnlPersonalInfo({ countries: opts.countries })[0].dataBind(opts.pool);
                $('<div></div>').appendTo(el).pnlTimeDate({ timeZones: opts.timeZones, clockModes: opts.clockModes, clockSources: opts.clockSources, systemUnits: opts.systemUnits, tempUnits: opts.tempUnits })[0].dataBind(opts.pool);
                $('<div></div>').appendTo(el).pnlDelays()[0].dataBind(opts.pool);
                $('<div></div>').appendTo(el).pnlSensorCalibration({ freezeThreshold: opts.pool.options.freezeThreshold, sensorUnits: opts.pool.options.units, sensors: opts.sensors, tempUnits: opts.tempUnits, systemUnits: opts.systemUnits })[0].dataBind(opts.pool);
                $('<div></div>').appendTo(el).pnlAlerts({})[0].dataBind(opts.alerts);
                $('<div></div>').appendTo(el).pnlSecurity({})[0].dataBind(opts.security);
                $('<div></div>').appendTo(el).pnlVacation({})[0].dataBind(opts.pool.options.vacation || {});
            });
        }
    });
})(jQuery); // General Tab
(function ($) {
    $.widget('pic.pnlPersonalInfo', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            var isIntelliCenter = (($('body').attr('data-controllertype') || '').toLowerCase() === 'intellicenter');
            var maxNameLength = isIntelliCenter ? 15 : 16;
            el.empty();
            el.addClass('picConfigCategory cfgPersonalInfo');
            var acc = $('<div></div>').appendTo(el).accordian({ columns: [{ text: 'Personal Information', glyph: 'far fa-newspaper', style: { width: '15rem' } }] });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Pool Alias', binding: 'alias', inputAttrs: { maxlength: maxNameLength }, labelAttrs: { style: { width: '5.7rem' } } });
            $('<div></div>').appendTo(line).inputField({ labelText: 'Owner', binding: 'owner.name', inputAttrs: { maxlength: maxNameLength }, labelAttrs: { style: { width: '4.5rem', marginLeft: '.7rem' } } });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Phone', binding: 'owner.phone', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { width: '5.7rem' } } });
            $('<div></div>').appendTo(line).inputField({ labelText: 'e-mail', binding: 'owner.email', inputAttrs: { maxlength: 32 }, labelAttrs: { style: { width: '4.5rem', marginLeft: '.7rem' } } });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Alt Phone', binding: 'owner.phone2', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { width: '5.7rem' } } });
            $('<div></div>').appendTo(line).inputField({ labelText: 'Alt e-mail', binding: 'owner.email2', inputAttrs: { maxlength: 32 }, labelAttrs: { style: { width: '4.5rem', marginLeft: '.7rem' } } });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).pickList({
                labelText: 'Country', binding: 'location.country',
                columns: [{ binding: 'val', hidden: true, text: 'name', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Country', style: { whiteSpace: 'nowrap' } }],
                items: o.countries, inputAttrs: { style: { width: '7rem' } }, bindColumn: 1, labelAttrs: { style: { width: '5.7rem' } }
            });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Address', binding: 'location.address', inputAttrs: { maxlength: 32 }, labelAttrs: { style: { width: '5.7rem' } } });

            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).inputField({ labelText: 'City', binding: 'location.city', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { width: '5.7rem' } } });
            $('<div></div>').appendTo(line).inputField({ labelText: 'State', binding: 'location.state', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { marginLeft: '.7rem' } } });
            $('<div></div>').appendTo(line).inputField({ labelText: 'Zip', binding: 'location.zip', inputAttrs: { maxlength: 10 }, labelAttrs: { style: { marginLeft: '.7rem' } } });
            line = $('<div></div>').appendTo(pnl);
            var fldLatitude = $('<div></div>').appendTo(line).inputField({
                readOnly: true,
                labelText: 'Latitude', binding: 'location.latitude', dataType: 'number', fmtMask: '#,##0.00####', emptyMask: '',
                inputAttrs: { maxlength: 10, style: { textAlign: 'right' } }, labelAttrs: { style: { width: '5.7rem' } }
            });
            var fldLongitude = $('<div></div>').appendTo(line).inputField({
                labelText: 'Longitude', binding: 'location.longitude', dataType: 'number', fmtMask: '#,##0.00####', emptyMask: '',
                inputAttrs: { maxlength: 10, style: { textAlign: 'right' } }, labelAttrs: { style: { width: '4.5rem', marginLeft: '.7rem' } }
            });
            var btnGPS = $('<div id="btnGetGPS"></div>').appendTo(line).actionButton({ text: 'Get Location', icon: '<i class="fas fa-location-arrow"></i>' })
                .css({ marginLeft: '1rem' })
                .on('click', function (evt) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        fldLatitude.val(pos.coords.latitude);
                        fldLongitude.val(pos.coords.longitude);
                    }, (err) => {
                        console.log(err);
                    });
                });
            var pnlType = $('div.dashOuter').attr('data-controllertype');
            try { if (!('geolocation' in navigator) || window.location.protocol !== 'https:' || pnlType === 'IntelliCenter') btnGPS.hide(); }
            catch (err) { console.log(err); btnGPS.hide(); }
            if (pnlType === 'IntelliCenter') {
                fldLongitude[0].disabled(true);
                fldLatitude[0].disabled(true);
            }
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div id="btnSavePersonal"></div>').appendTo(btnPnl).actionButton({ text: 'Save Personal', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                if (isIntelliCenter) {
                    if (typeof v.alias === 'string') v.alias = v.alias.substring(0, 15);
                    if (typeof v.owner === 'object' && v.owner !== null && typeof v.owner.name === 'string') v.owner.name = v.owner.name.substring(0, 15);
                }
                $.putApiService('/config/general', v, 'Saving Personal Information...', function(data, status, xhr) {
                    self.dataBind(data);
                });
            });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            dataBinder.bind(el, obj);
        }
    });
})(jQuery); // Personal Info
(function ($) {
    $.widget('pic.pnlTimeDate', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgTimeDate');
            var acc = $('<div></div>').appendTo(el).accordian({ columns: [{ text: 'Timezone & Locality', glyph: 'far fa-clock', style: { width: '15rem' } }] });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).pickList({
                labelText: 'Units', binding: 'options.units',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'System Units', style: { whiteSpace: 'nowrap' } }],
                items: o.systemUnits, inputAttrs: { style: { width: '7rem' } }, labelAttrs: { style: { width: '5.7rem' } }
            });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).pickList({
                labelText: 'Time Zone', binding: 'location.timeZone',
                displayColumn: 2,
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'abbrev', hidden: false, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Time Zone', style: { whiteSpace: 'nowrap' } }],
                items: o.timeZones, inputAttrs: { style: { width: '12rem' } }, labelAttrs: { style: { width: '5.7rem'} }
            });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Auto Adjust DST', binding: 'options.adjustDST' });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).pickList({
                labelText: 'Clock Mode', binding: 'options.clockMode', bindColumn: 0,
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Mode', style: { whiteSpace: 'nowrap' } }],
                items: o.clockModes, inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { width: '5.7rem' } }
            });
            if (o.clockSources.length > 1) {
                $('<div></div>').appendTo(line).pickList({
                    labelText: 'Clock Source', binding: 'options.clockSource', bindColumn: 0,
                    columns: [{ binding: 'name', hidden: true, text: 'Name', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Source', style: { whiteSpace: 'nowrap' } }],
                    items: o.clockSources, inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { marginLeft: '1rem' } }
                });
            }
            btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            btnSave = $('<div id="btnSaveTimeDate"></div>').appendTo(btnPnl).actionButton({ text: 'Save Locality', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                //$(this).addClass('disabled');
                //$(this).find('i').addClass('burst-animated');
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                $.putApiService('/config/general', v, 'Saving Locality Information...', function (data, status, xhr) {
                    self.dataBind(data.pool);
                    console.log(data);
                    var tempUnits = o.tempUnits.find(elem => elem.val === data.pool.options.units) || { val: 0, name: 'F', desc: 'Fahrenheit' };
                    var tu = '°' + tempUnits.name;
                    el.parents('div.picTabContents').find('div.fld-temp-units').each(function() {
                        if (typeof this.units === 'function') this.units(tu);
                    });
                });
            });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            console.log(obj);
            dataBinder.bind(el, obj);
            var disableTz = typeof obj !== 'undefined' && typeof obj.options !== 'undefined' && obj.options.clockSource === 'server';
            el.find('*[data-bind="location.timeZone"]').each(function () {
                console.log(this);
                this.disabled(disableTz);
            });
            el.find('*[data-bind="options.adjustDST"]').each(function () { this.disabled(disableTz); });
        }
    });
})(jQuery); // Time & Date
(function ($) {
    $.widget('pic.pnlDelays', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            var controller = $('body').attr('data-controllertype');

            el.empty();
            el.addClass('picConfigCategory cfgDelays');
            var acc = $('<div></div>').appendTo(el).accordian({ columns: [{ text: 'Delays', glyph: 'fas fa-stopwatch', style: { width: '15rem' } }] });
            var pnl = acc.find('div.picAccordian-contents');
            var line;
            var isIcV3 = controller === 'intellicenter' && parseFloat($('body').attr('data-firmware') || '0') >= 3.008;
            if (controller !== 'intellicenter' || isIcV3) {
                line = $('<div></div>').appendTo(pnl);
                $('<div></div>').appendTo(line).checkbox({ labelText: 'Manual Operation Priority', binding: 'options.manualPriority' });
            }
            line = $('<div></div>').appendTo(pnl);
            if (isIcV3) {
                $('<div></div>').appendTo(line).checkbox({ labelText: 'Pump Off During Valve Action', binding: 'options.valveDelay', labelAttrs: { style: { width: '14rem', display: 'inline-block' } } });
            } else {
                $('<div></div>').appendTo(line).checkbox({ labelText: 'Pump Off During Valve Action', binding: 'options.pumpDelay', labelAttrs: { style: { width: '14rem', display: 'inline-block' } } });
            }
            if (controller === 'nixie') {
                $('<div></div>').appendTo(line).valueSpinner({
                    canEdit: true, labelText: 'Delay Time', binding: 'options.valveDelayTime', dataType: 'number', fmtType: '#,##0', value: o.valveDelayTime, min: 0, max: 240, step: 1, maxlength: 5,
                    units: 'sec', labelAttrs: { style: { width: '5.5rem', display: 'none' } }, inputAttrs: { style: { width: '4.5rem' } }
                });
                line = $('<div></div>').appendTo(pnl);
                $('<div></div>').appendTo(line).checkbox({ labelText: 'Heater Start Delay', binding: 'options.heaterStartDelay', labelAttrs: { style: { width: '14rem', display: 'inline-block' } } });
                $('<div></div>').appendTo(line).valueSpinner({
                    canEdit: true, labelText: 'Heater Start Delay', binding: 'options.heaterStartDelayTime', dataType: 'number', fmtType: '#,##0', value: o.heaterStartDelayTime, min: 0, max: 900, step: 1, maxlength: 5,
                    units: 'sec', labelAttrs: { style: { width: '9.5rem', display: 'none' } }, inputAttrs: { style: { width: '4.5rem' } }
                });
                line = $('<div></div>').appendTo(pnl);
                $('<div></div>').appendTo(line).checkbox({ labelText: 'Cleaner Start Delay', binding: 'options.cleanerStartDelay', labelAttrs: { style: { width: '14rem', display: 'inline-block' } } });
                $('<div></div>').appendTo(line).valueSpinner({
                    canEdit: true, labelText: 'Cleaner Start Delay', binding: 'options.cleanerStartDelayTime', dataType: 'number', fmtType: '#,##0', value: o.cleanerStartDelayTime, min: 0, max: 900, step: 1, maxlength: 5,
                    units: 'sec', labelAttrs: { style: { width: '9.5rem', display: 'none' } }, inputAttrs: { style: { width: '4.5rem' } }
                });
                line = $('<div></div>').appendTo(pnl);
                $('<div></div>').appendTo(line).checkbox({ labelText: 'Cleaner Off for Solar', binding: 'options.cleanerSolarDelay', labelAttrs: { style: { width: '14rem', display: 'inline-block' } } });
                $('<div></div>').appendTo(line).valueSpinner({
                    canEdit: true, labelText: 'Cleaner Solar Delay', binding: 'options.cleanerSolarDelayTime', dataType: 'number', fmtType: '#,##0', value: o.cleanerStartDelayTime, min: 0, max: 900, step: 1, maxlength: 5,
                    units: 'sec', labelAttrs: { style: { width: '9.5rem', display: 'none' } }, inputAttrs: { style: { width: '4.5rem' } }
                });
            }
            if (controller !== 'nixie') $('<div></div>').appendTo(line).checkbox({ labelText: 'Heater Cooldown Delay', binding: 'options.cooldownDelay' });
            if (isIcV3) {
                line = $('<div></div>').appendTo(pnl);
                $('<div></div>').appendTo(line).valueSpinner({
                    canEdit: true, labelText: 'Freeze Cycle Time', binding: 'options.freezeCycleTime', dataType: 'number', fmtType: '#,##0', min: 1, max: 60, step: 1, maxlength: 3,
                    units: 'min', labelAttrs: { style: { width: '14rem', display: 'inline-block' } }, inputAttrs: { style: { width: '4.5rem' } }
                });
                line = $('<div></div>').appendTo(pnl);
                $('<label></label>').css({ width: '14rem', display: 'inline-block' }).text('Freeze Override').appendTo(line);
                $('<span></span>').css({ fontStyle: 'italic', opacity: 0.7 }).text('See OCP').appendTo(line);
            }
            btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            btnSave = $('<div id="btnSaveDelays"></div>').appendTo(btnPnl).actionButton({ text: 'Save Delays', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                //$(this).addClass('disabled');
                //$(this).find('i').addClass('burst-animated');
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                $.putApiService('/config/general', v, 'Saving Delays...', function (data, status, xhr) {
                    console.log(data);
                    self.dataBind(data);
                });
            });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            dataBinder.bind(el, obj);
        }
    });
})(jQuery); // Delays
(function ($) {
    $.widget('pic.pnlSensorCalibration', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            var isNixie = $('body').attr('data-controllertype') === 'nixie';

            el.addClass('picConfigCategory cfgSensorCalibration');
            var acc = $('<div></div>').appendTo(el).accordian({ columns: [{ text: 'Sensor Calibration', glyph: 'fas fa-balance-scale-right', style: { width: '15rem' } }] });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            var dataFmt = '#,##0';
            var tempUnits = o.tempUnits.find(elem => elem.val === o.sensorUnits) || { val: 0, name: "F", desc: "Fahrenheit" };
            if (isNixie) {
                // Add in the freeze protection threshold since we can set this value on nixie controllers.
                dataFmt = '#,##0.##';
                $('<div></div>').appendTo(line).valueSpinner({
                    canEdit: true, labelText: 'Freeze Threshold', binding: 'freezeThreshold', dataType: 'number', fmtType: dataFmt, value: o.freezeThreshold || 35, min: -50, max: 150, step: 1, maxlength: 5,
                    units: '°' + tempUnits.name, labelAttrs: { style: { width: '8.5rem' } }, inputAttrs: { style: { width: '4.5rem' } }
                }).addClass('fld-temp-units');
                $('<hr></hr>').appendTo(pnl);
                line = $('<div></div>').appendTo(pnl);
            }
            
            $('<span style="margin-left:8.5rem"></span><label style="width:7rem;text-align:center;">Adjusted Value</label><span style="width:5rem;display:inline-block;"></span><label style="width:7rem;text-align:center;">True Readout</label>').appendTo(line);
            for (var k = 0; k < o.sensors.length; k++) {
                var sensor = o.sensors[k];
                line = $('<div></div>').appendTo(pnl);
                $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: sensor.name, dataType: 'number', fmtMask: '#,##0.##', binding: 'sensorRaw.' + sensor.binding + '_adj', value: sensor.temp, min: -50, max: 150, step: 1, maxlength: 5, units: '°' + tempUnits.name, labelAttrs: { style: { width: '8.5rem' } }, inputAttrs: { style: { width: '4.5rem' } } })
                    .addClass('fld-temp-units');
                $('<span></span>').css({ width: '3rem', display: 'inline-block' }).appendTo(line);
                $('<span></span>').appendTo(line).attr('data-bind', 'sensorRaw.' + sensor.binding + '_curr').attr('data-datatype', 'number').attr('data-fmtmask', '#,##0.##').text((sensor.temp - sensor.tempAdj).format('#,##0.##'))
                    .css({ width: '7rem', display: 'inline-block', textAlign:'center' });
            }
            btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            btnSave = $('<div id="btnSaveCalibration"></div>').appendTo(btnPnl).actionButton({ text: 'Save Calibration', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var raw = dataBinder.fromElement(el);
                var v = { options: {} };
                console.log(raw);
                if (typeof raw.freezeThreshold !== 'undefined') v.options['freezeThreshold'] = raw.freezeThreshold;
                for (var prop in raw.sensorRaw) {
                    if (prop.endsWith('_curr')) {
                        var offName = prop.replace('_curr', '');
                        v.options[offName] = raw.sensorRaw[offName + '_adj'] - raw.sensorRaw[offName + '_curr'];
                    }
                }
                console.log(v);
                // Send this off to the server.
                $.putApiService('/config/general', v, 'Saving Sensor Calibration...', function (data, status, xhr) {
                    // We need to hold onto the original sensor adjustment temperature but adjust the new true readout.  We do this
                    // because the web interface jumps all over the place when making the adjustments.  It's annoying in the end the
                    // current true readout value should not change.  It should only put the adjusted value back if it was not
                    // set on the server.
                    data.sensorRaw = {};
                    for (var j = 0; j < data.sensors.length; j++) {
                        var sensor = data.sensors[j];
                        if (v.options[sensor.binding] !== sensor.tempAdj) {
                            data.sensorRaw[sensor.binding + '_curr'] = sensor.temp - sensor.tempAdj;
                            data.sensorRaw[sensor.binding + '_adj'] = sensor.temp;
                        }
                    }
                    self.dataBind(data);
                });

            });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            dataBinder.bind(el, obj);
        }
    });
})(jQuery); // Sensor Calibration
(function ($) {
    $.widget('pic.pnlAlerts', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgAlerts');
            var outerAcc = $('<div></div>').appendTo(el).accordian({ columns: [{ text: 'Alerts & Notifications', glyph: 'far fa-bell', style: { width: '15rem' } }] });
            var outerPnl = outerAcc.find('div.picAccordian-contents');
            self.contentPnl = $('<div></div>').appendTo(outerPnl);
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(outerPnl);
            $('<div id="btnSaveAlerts"></div>').appendTo(btnPnl).actionButton({ text: 'Save Alerts', icon: '<i class="fas fa-save"></i>' })
                .on('click', function (e) { self._save($(this)); });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            $.getApiService('/config/options/alerts', null, function (data, status, xhr) {
                self._alerts = data.alerts || {};
                self._definitions = data.definitions || {};
                self._renderCategories();
            });
        },
        _renderCategories: function () {
            var self = this;
            var pnl = self.contentPnl;
            pnl.empty();
            var categoryFieldMap = {
                circuits: 'circuitNotifications',
                pumps: 'pumpNotifications',
                ultratemp: 'ultratempNotifications',
                chlorinator: 'chlorinatorNotifications',
                intellichem: 'intellichemNotifications',
                hybrid: 'hybridNotifications',
                connectedGas: 'connectedGasNotifications'
            };
            var categoryLabels = {
                circuits: 'Circuits',
                pumps: 'Pumps',
                ultratemp: 'UltraTemp Heater',
                chlorinator: 'IntelliChlor',
                intellichem: 'IntelliChem',
                hybrid: 'Hybrid Heater',
                connectedGas: 'Connected Gas Heater'
            };
            for (var cat in self._definitions) {
                var items = self._definitions[cat];
                if (!items || items.length === 0) continue;
                var field = categoryFieldMap[cat];
                var mask = self._alerts[field] || 0;
                var label = categoryLabels[cat] || cat;
                var enabledCount = 0;
                for (var i = 0; i < items.length; i++) {
                    if ((mask >>> items[i].bit) & 1) enabledCount++;
                }
                var section = $('<div></div>').addClass('picAlertSection').appendTo(pnl);
                var header = $('<div></div>').addClass('picAlertSection-header header-background').css({ cursor: 'pointer', padding: '.25rem .5rem', marginTop: '.25rem', display: 'flex', alignItems: 'center' }).appendTo(section);
                $('<i class="fas fa-exclamation-triangle" style="margin-right:.5rem"></i>').appendTo(header);
                $('<span></span>').text(label).css({ width: '12rem', fontWeight: 'bold' }).appendTo(header);
                var countSpan = $('<span></span>').text(enabledCount + '/' + items.length).css({ width: '4rem', textAlign: 'center' }).appendTo(header);
                $('<i class="fas fa-chevron-right" style="margin-left:auto;transition:transform .2s"></i>').appendTo(header);
                var body = $('<div></div>').addClass('picAlertSection-body').css({ display: 'none', padding: '.25rem .5rem .25rem 1.5rem' }).appendTo(section);
                (function(h, b) {
                    h.on('click', function (e) {
                        e.stopPropagation();
                        var chevron = h.find('i.fa-chevron-right, i.fa-chevron-down');
                        if (b.is(':visible')) {
                            b.slideUp(150);
                            chevron.removeClass('fa-chevron-down').addClass('fa-chevron-right');
                        } else {
                            b.slideDown(150);
                            chevron.removeClass('fa-chevron-right').addClass('fa-chevron-down');
                        }
                    });
                })(header, body);
                var btnRow = $('<div></div>').css({ marginBottom: '.25rem' }).appendTo(body);
                (function(catKey, bodyEl) {
                    $('<a href="javascript:void(0)"></a>').text('Select All').css({ marginRight: '1rem', fontSize: '.85rem' }).appendTo(btnRow).on('click', function (e) {
                        e.stopPropagation();
                        bodyEl.find('input[type="checkbox"]').prop('checked', true).trigger('change');
                    });
                    $('<a href="javascript:void(0)"></a>').text('Select None').css({ fontSize: '.85rem' }).appendTo(btnRow).on('click', function (e) {
                        e.stopPropagation();
                        bodyEl.find('input[type="checkbox"]').prop('checked', false).trigger('change');
                    });
                })(cat, body);
                for (var j = 0; j < items.length; j++) {
                    var item = items[j];
                    var checked = (mask >>> item.bit) & 1;
                    var line = $('<div></div>').appendTo(body);
                    $('<div></div>').appendTo(line).checkbox({ labelText: item.desc, binding: cat + '_bit' + item.bit, value: checked ? true : false });
                }
            }
        },
        _save: function (btn) {
            var self = this;
            btn.addClass('disabled');
            btn.find('i').addClass('burst-animated');
            var payload = {};
            var categoryFieldMap = {
                circuits: 'circuitNotifications',
                pumps: 'pumpNotifications',
                ultratemp: 'ultratempNotifications',
                chlorinator: 'chlorinatorNotifications',
                intellichem: 'intellichemNotifications',
                hybrid: 'hybridNotifications',
                connectedGas: 'connectedGasNotifications'
            };
            for (var cat in self._definitions) {
                var items = self._definitions[cat];
                if (!items || items.length === 0) continue;
                var mask = 0;
                for (var i = 0; i < items.length; i++) {
                    var cb = self.contentPnl.find('[data-bind="' + cat + '_bit' + items[i].bit + '"] input[type="checkbox"]');
                    if (cb.is(':checked')) mask = (mask | (1 << items[i].bit)) >>> 0;
                }
                payload[cat] = mask;
            }
            $.putApiService('/config/alerts', payload, 'Saving Alerts...', function (data, status, xhr) {
                self._alerts = data || {};
                self._renderCategories();
                btn.removeClass('disabled');
                btn.find('i').removeClass('burst-animated');
            }, function (err) {
                btn.removeClass('disabled');
                btn.find('i').removeClass('burst-animated');
            });
        }
    });
})(jQuery); // Alerts
(function ($) {
    var _sectionLabels = [
        'Vacation Mode', 'Support', 'General Settings', 'Alerts & Notifications',
        'User Portal', 'Groups', 'Advanced Settings', 'Chemistry',
        'Status', 'Schedules', 'Features', 'Lights',
        'Pool', 'Spa', 'Usage', 'Multi Body Drawer',
        'Service Mode Ckts'
    ];
    var _disabledBits = [15];
    var _subItems = {
        12: [{ bit: 21, label: 'Set Point' }, { bit: 20, label: 'Heat Mode' }],
        13: [{ bit: 19, label: 'Set Point' }, { bit: 18, label: 'Heat Mode' }]
    };
    function _countBits(permBytes) {
        var mask = ((permBytes[0] & 0xFF) * 16777216) + ((permBytes[1] & 0xFF) * 65536) + ((permBytes[2] & 0xFF) * 256) + (permBytes[3] & 0x3F);
        var count = 0;
        while (mask) { count += mask & 1; mask >>>= 1; }
        return count;
    }
    function _getBit(permBytes, bitIndex) {
        var byteIdx = Math.floor(bitIndex / 8);
        var bitIdx = bitIndex % 8;
        return (permBytes[byteIdx] & (1 << bitIdx)) !== 0;
    }
    function _setBit(permBytes, bitIndex, val) {
        var byteIdx = Math.floor(bitIndex / 8);
        var bitIdx = bitIndex % 8;
        if (val) permBytes[byteIdx] = permBytes[byteIdx] | (1 << bitIdx);
        else permBytes[byteIdx] = permBytes[byteIdx] & ~(1 << bitIdx);
    }
    $.widget('pic.pnlSecurity', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgSecurity');
            var acc = $('<div></div>').appendTo(el).accordian({ columns: [{ text: 'Security', glyph: 'fas fa-user-secret', style: { width: '15rem' } }] });
            var pnl = acc.find('div.picAccordian-contents');
            self._toggleLine = $('<div></div>').appendTo(pnl);
            self._roleList = $('<div class="cfgSecurityRoles"></div>').appendTo(pnl);
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            if (!obj || typeof obj.enabled === 'undefined') {
                $.getApiService('/config/options/security', null, function (data) {
                    if (data && data.security) self._bindData(data.security);
                });
                return;
            }
            self._bindData(obj);
        },
        _bindData: function (obj) {
            var self = this, o = self.options, el = self.element;
            if ($('body').attr('data-controllertype') !== 'intellicenter') {
                self._toggleLine.empty();
                $('<div></div>').appendTo(self._toggleLine).css({ padding: '.5rem', fontStyle: 'italic' })
                    .text('Security for this panel type is managed via the hamburger menu (Settings \u2192 Security tab).');
                return;
            }
            o.security = obj;
            self._toggleLine.empty();
            var chkEnabled = $('<div></div>').appendTo(self._toggleLine).checkbox({ labelText: 'Security Enabled', binding: 'enabled' });
            chkEnabled.find('input').prop('checked', obj.enabled);
            chkEnabled.on('changed', function (evt) {
                self._saveAdminToggle('enabled', evt.newVal);
            });
            var chkGuest = $('<div></div>').appendTo(self._toggleLine).checkbox({ labelText: 'Guest Enabled', binding: 'guestEnabled' });
            chkGuest.find('input').prop('checked', (obj.enabledByte & 0x40) !== 0);
            chkGuest.on('changed', function (evt) {
                self._saveAdminToggle('guestEnabled', evt.newVal);
            });
            chkGuest.css({ marginLeft: '1.5rem', display: 'inline-block' });
            chkEnabled.css({ display: 'inline-block' });
            self._renderRoles(obj.roles);
        },
        _saveAdminToggle: function (field, val) {
            var self = this, o = self.options;
            var admin = o.security.roles.find(function (r) { return r.id === 1; });
            if (!admin) return;
            var data = { id: 1, name: admin.name, pin: admin.pin, timeout: admin.timeout, permissionsBytes: admin.permissionsBytes.slice() };
            data[field] = val;
            $.putApiService('/config/security/role', data, 'Saving Security...', function (result) {
                if (result && result.roles) {
                    o.security = result;
                    self._renderRoles(result.roles);
                }
                $('div.picController').each(function () { if (this.refreshIcSecurity) this.refreshIcSecurity(); });
            });
        },
        _renderRoles: function (roles) {
            var self = this, o = self.options;
            self._roleList.empty();
            if (!roles || !roles.length) return;
            var hdr = $('<div class="cfgSecurityRoleHeader"></div>').appendTo(self._roleList);
            hdr.css({ display: 'flex', fontWeight: 'bold', padding: '.25rem 0', borderBottom: '1px solid var(--panel-border-color, #444)' });
            $('<span></span>').appendTo(hdr).text('Role').css({ width: '10rem' });
            $('<span></span>').appendTo(hdr).text('PIN').css({ width: '4rem', textAlign: 'center' });
            $('<span></span>').appendTo(hdr).text('Timeout').css({ width: '5rem', textAlign: 'center' });
            $('<span></span>').appendTo(hdr).text('Sections').css({ width: '5rem', textAlign: 'center' });
            $('<span></span>').appendTo(hdr).text('').css({ width: '4rem' });
            for (var i = 0; i < roles.length; i++) {
                var r = roles[i];
                if (!r.name && r.pin === '0000' && !_countBits(r.permissionsBytes || [0, 0, 0, 0])) continue;
                self._renderRoleRow(r);
            }
            var btnLine = $('<div></div>').appendTo(self._roleList).css({ padding: '.25rem 0' });
            var btnAdd = $('<div></div>').appendTo(btnLine).actionButton({ text: 'Add Role', icon: '<i class="fas fa-plus"></i>' });
            btnAdd.on('click', function () { self._addRole(); });
        },
        _renderRoleRow: function (role) {
            var self = this, o = self.options;
            var row = $('<div class="cfgSecurityRoleRow"></div>').appendTo(self._roleList);
            row.css({ display: 'flex', alignItems: 'center', padding: '.25rem 0', borderBottom: '1px solid var(--panel-border-color, #333)' });
            var nameSpan = $('<span></span>').appendTo(row).text(role.name || '(unnamed)').css({ width: '10rem', cursor: 'pointer' });
            nameSpan.on('click', function () { self._openRoleEditor(role); });
            $('<span></span>').appendTo(row).text(role.pin === '0000' ? '-' : '****').css({ width: '4rem', textAlign: 'center' });
            $('<span></span>').appendTo(row).text(role.timeout + 'm').css({ width: '5rem', textAlign: 'center' });
            var bits = _countBits(role.permissionsBytes || [0, 0, 0, 0]);
            $('<span></span>').appendTo(row).text(bits + '/22').css({ width: '5rem', textAlign: 'center' });
            var btnEdit = $('<div></div>').appendTo(row).actionButton({ text: 'Edit', icon: '<i class="fas fa-edit"></i>' });
            btnEdit.css({ width: '4rem' });
            btnEdit.on('click', function () { self._openRoleEditor(role); });
            if (role.id !== 1 && role.id !== 9) {
                var btnDel = $('<div></div>').appendTo(row).actionButton({ text: 'Del', icon: '<i class="fas fa-trash"></i>' });
                btnDel.css({ width: '4rem', marginLeft: '.25rem' });
                btnDel.on('click', function () { self._deleteRole(role); });
            }
        },
        _openRoleEditor: function (role) {
            var self = this, o = self.options;
            var permBytes = (role.permissionsBytes || [0, 0, 0, 0]).slice();
            var dlg = $.pic.modalDialog.createDialog('dlgSecurityRole', {
                title: 'Edit Role: ' + (role.name || 'Role ' + role.id),
                width: '28rem',
                height: 'auto',
                buttons: [
                    {
                        text: 'Save', icon: '<i class="fas fa-save"></i>',
                        click: function () {
                            var pinEl = dlg.find('[data-field="pin"] input');
                            var toEl = dlg.find('[data-field="timeout"]')[0];
                            var data = {
                                id: role.id,
                                name: dlg.find('[data-field="name"] input').val(),
                                pin: pinEl.length ? pinEl.val() : (role.pin || '0000'),
                                timeout: toEl && toEl.val ? (parseInt(toEl.val(), 10) || 5) : (role.timeout || 5),
                                permissionsBytes: permBytes
                            };
                            $.putApiService('/config/security/role', data, 'Saving Role...', function (result) {
                                if (result && result.roles) {
                                    o.security = result;
                                    self._renderRoles(result.roles);
                                }
                                $.pic.modalDialog.closeDialog(dlg);
                            });
                        }
                    },
                    {
                        text: 'Cancel', icon: '<i class="fas fa-times"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(dlg); }
                    }
                ]
            });
            dlg.empty();
            var contents = dlg;
            var isBuiltin = (role.id === 1 || role.id === 9);
            var line = $('<div></div>').appendTo(contents);
            var fldName = $('<div></div>').attr('data-field', 'name').appendTo(line).inputField({ labelText: 'Name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { width: '4.5rem' } } });
            fldName.find('input').val(role.name || '');
            if (isBuiltin) fldName.find('input').prop('disabled', true);
            if (role.id !== 9) {
                line = $('<div></div>').appendTo(contents);
                var fldPin = $('<div></div>').attr('data-field', 'pin').appendTo(line).inputField({ labelText: 'PIN', inputAttrs: { maxlength: 4, type: 'password', style: 'width:6rem' }, labelAttrs: { style: { width: '4.5rem' } } });
                fldPin.find('input').val(role.pin || '0000').css({ width: '6rem' });
                var fldTimeout = $('<div></div>').attr('data-field', 'timeout').appendTo(line).valueSpinner({ canEdit: true, labelText: 'Timeout', dataType: 'number', min: 1, max: 10, step: 1, maxlength: 2, units: 'min', value: role.timeout || 5, labelAttrs: { style: { width: '4.5rem', marginLeft: '1rem' } }, inputAttrs: { style: { width: '3rem' } } });
            }
            if (role.id === 1) return;
            var secHdr = $('<div></div>').appendTo(contents).css({ marginTop: '.5rem', fontWeight: 'bold' });
            secHdr.text('Sections');
            var btnAll = $('<span></span>').appendTo(secHdr).text(' [All]').css({ cursor: 'pointer', fontWeight: 'normal', color: 'var(--link-color, #6cf)' });
            var btnNone = $('<span></span>').appendTo(secHdr).text(' [None]').css({ cursor: 'pointer', fontWeight: 'normal', color: 'var(--link-color, #6cf)', marginLeft: '.5rem' });
            var checkboxes = [];
            var grid = $('<div></div>').appendTo(contents).css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.15rem', marginTop: '.25rem' });
            for (var i = 0; i < _sectionLabels.length; i++) {
                (function (idx) {
                    var hasSubs = !!_subItems[idx];
                    var cell = hasSubs ? $('<div></div>').appendTo(grid).css({ display: 'flex', flexDirection: 'column' }) : null;
                    var chk = $('<div></div>').appendTo(cell || grid).checkbox({ labelText: _sectionLabels[idx] });
                    chk.find('input').prop('checked', _getBit(permBytes, idx));
                    if (_disabledBits.indexOf(idx) >= 0) {
                        chk.find('input').prop('disabled', true);
                        chk.css({ opacity: 0.5 });
                    }
                    chk.on('changed', function (evt) { _setBit(permBytes, idx, evt.newVal); });
                    checkboxes.push(chk);
                    if (hasSubs) {
                        for (var s = 0; s < _subItems[idx].length; s++) {
                            (function (sub) {
                                var subChk = $('<div></div>').appendTo(cell).checkbox({ labelText: '\u21b3 ' + sub.label });
                                subChk.css({ paddingLeft: '1.2rem' });
                                subChk.find('input').prop('checked', _getBit(permBytes, sub.bit));
                                subChk.on('changed', function (evt) { _setBit(permBytes, sub.bit, evt.newVal); });
                            })(_subItems[idx][s]);
                        }
                    }
                })(i);
            }
            btnAll.on('click', function () {
                for (var i = 0; i < _sectionLabels.length; i++) { _setBit(permBytes, i, true); checkboxes[i].find('input').prop('checked', true); }
                for (var k in _subItems) { for (var s = 0; s < _subItems[k].length; s++) _setBit(permBytes, _subItems[k][s].bit, true); }
                _setBit(permBytes, 17, true);
                contents.find('input[type="checkbox"]').prop('checked', true);
            });
            btnNone.on('click', function () {
                for (var i = 0; i < _sectionLabels.length; i++) { _setBit(permBytes, i, false); checkboxes[i].find('input').prop('checked', false); }
                for (var k in _subItems) { for (var s = 0; s < _subItems[k].length; s++) _setBit(permBytes, _subItems[k][s].bit, false); }
                _setBit(permBytes, 17, false);
                contents.find('input[type="checkbox"]').prop('checked', false);
            });
        },
        _addRole: function () {
            var self = this, o = self.options;
            var nextId = 2;
            if (o.security && o.security.roles) {
                for (var i = 0; i < o.security.roles.length; i++) {
                    var rid = o.security.roles[i].id;
                    if (rid >= 2 && rid <= 8 && rid >= nextId) nextId = rid + 1;
                }
            }
            if (nextId > 8) return;
            self._openRoleEditor({ id: nextId, name: '', pin: '0000', timeout: 5, permissionsBytes: [0, 0, 0, 0] });
        },
        _deleteRole: function (role) {
            var self = this, o = self.options;
            $.pic.modalDialog.createConfirm('dlgConfirmDeleteRole', {
                message: 'Are you sure you want to delete role "' + role.name + '"?',
                width: '350px',
                height: 'auto',
                title: 'Confirm Delete Role',
                buttons: [{
                    text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                    click: function () {
                        $.pic.modalDialog.closeDialog(this);
                        var data = { id: role.id, name: '', pin: '0000', timeout: 5, permissionsBytes: [0, 0, 0, 0] };
                        $.putApiService('/config/security/role', data, 'Deleting Role...', function (result) {
                            if (result && result.roles) {
                                o.security = result;
                                self._renderRoles(result.roles);
                            }
                        });
                    }
                }, {
                    text: 'No', icon: '<i class="far fa-window-close"></i>',
                    click: function () { $.pic.modalDialog.closeDialog(this); }
                }]
            });
        }
    });
})(jQuery); // Security


