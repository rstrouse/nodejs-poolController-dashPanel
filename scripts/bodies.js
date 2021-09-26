(function ($) {
    $.widget("pic.bodies", {
        options: { },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initBodies = function (data) { self._initBodies(data); };
            el[0].setTemps = function (data) { self.setTemps(data); };
        },
        _initBodies: function(data) {
            var self = this, o = self.options, el = self.element;
            el.empty();
            var div = $('<div class="picAmbientTemp control-panel-title"></div>');
            div.appendTo(el);
            var d = $('<div><label class="picInline-label picAmbientTemp">Air Temp</label><span class="picAirTemp"></span><label class="picUnitSymbol">&deg;</label><span class="picTempUnits">-</span></div>');
            d.appendTo(div);
            d = $('<div class="picSolarTempField"><label class="picInline-label picAmbientTemp">Solar Temp</label><span class="picSolarTemp"></span><label class="picUnitSymbol">&deg;</label><span class="picTempUnits">-</span></div>');
            d.appendTo(div);
            if (typeof data !== 'undefined') {
                el.show();
                for (let i = 0; i < data.temps.bodies.length; i++) {
                    $('<div></div>').appendTo(el).body(data.temps.bodies[i]);
                }
                self.setTemps(data.temps);
                for (let i = 0; i < data.circuits.length; i++) {
                    let circuit = data.circuits[i];
                    el.find('div.picBody[data-circuitid=' + circuit.id + ']').each(function () {
                        this.setCircuitState(circuit);
                    });
                }
            }
            else {
                el.hide();
            }
        },
        setTemps: function (data) {
            var self = this, o = self.options, el = self.element;
            var nSolar = 0;
            if (typeof data.air !== 'undefined') el.find('span.picAirTemp').text(data.air.format('#,##0.##', '--'));
            if(typeof data.solar !== 'undefined') el.find('span.picSolarTemp').text(data.solar.format('#,##0.##', '--'));
            if (typeof data.units !== 'undefined') {
                el.find('span.picTempUnits').text(data.units.name);
                el.attr('data-unitsname', data.units.name);
            }
            for (let i = 0; i < data.bodies.length; i++) {
                let body = data.bodies[i];
                el.find('div.picBody[data-id=' + body.id + ']').each(function () {
                    if (typeof body.heaterOptions !== 'undefined') nSolar += ((body.heaterOptions.solar || 0) + (body.heaterOptions.heatPump || 0));
                    this.setEquipmentData(body);
                });
            }
            if (nSolar === 0) el.find('div.picSolarTempField').hide();
            else el.find('div.picSolarTempField').show();
        }
    });
    $.widget('pic.bodyFilters', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initFilters = function (data) { self._initFilters(data); };
        },
        _initFilters: function (data) {
            var self = this, o = self.options, el = self.element;
            el.empty();
            let div = $('<div class="picCircuitTitle control-panel-title"></div>');
            div.appendTo(el);
            let span = $('<span class="picCircuitTitle"></span>');
            span.appendTo(div);
            span.text('Filters');
            if (typeof data !== 'undefined' && data.filters.length > 0) {
                el.show();
                for (let i = 0; i < data.filters.length; i++) {
                    $('<div></div>').appendTo(el).bodyFilter(data.filters[i]);
                }
            }
            else el.hide();
        }
    });
    $.widget('pic.bodyFilter', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].setEquipmentData = function (data) { self.setEquipmentData(data); };
            self._initFilter();
        },
        _initFilter: function (data) {
            var self = this, o = self.options, el = self.element;
            el.addClass('picBodyFilter');
            el.empty();
            var div = $('<div class="picFilterState picIndicator"></div>').appendTo(el);
            el.attr('data-id', o.id);
            div.attr('data-ison', o.isOn);
            div.attr('data-status', o.isOn ? 'on' : 'off');
            $('<label class="picFilterName" data-bind="name"></label>').appendTo(el);
            $('<span class="picFilterPressure picData"></label><span class="picPressureValue" data-bind="pressure" data-fmttype="number" data-fmtmask="#,##0.##" data-fmtempty="----"></span><label class="picUnits" data-bind="pressureUnits.name"></label></span>').appendTo(el);
            $('<span class="picFilterPercentage picData"></label><span class="picPercentValue" data-bind="cleanPercentage" data-fmttype="number" data-fmtmask="#,##0.##" data-fmtempty="----"></span><label class="picUnits">%</label></span>').appendTo(el);
            self.setEquipmentData(o);
        },
        setEquipmentData: function (data) {
            var self = this, o = self.options, el = self.element;
            if (typeof data.isOn !== 'undefined') {
                el.find('div.picFilterState').attr('data-ison', makeBool(data.isOn));
                el.find('div.picFilterState').attr('data-status', makeBool(data.isOn));
            }
            dataBinder.bind(el, data);
        }
    });

    $.widget('pic.body', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setEquipmentData = function (data) { self.setEquipmentData(data); };
            el[0].setUnits = function (units) { self.setUnits(units); };
            el[0].setCircuitState = function (data) { self.setCircuitState(data); };
        },
        _createSolarIcon: function (size) {
            return $('<span class="fa-stack fa-2x picHeaterStatusIcon picSolarOn" style="vertical-align:middle;line-height:1em;font-size:inherit;">'
                + '<i class="fas burst-animated fa-certificate fa-stack-1x fa-spin" style="color:goldenrod;vertical-align:middle;font-size:1.3em;"></i>'
                + '<i class="fas fa-stack-2x fa-certificate fa-spin" style="color:orange;font-size:1em;vertical-align:middle;"></i>'
                + '</span > ');
        },
        _createHeaterIcon: function () {
            return $('<span class="fa-stack fa-2x picHeaterStatusIcon picHeaterOn" style="vertical-align:middle;line-height:1em;font-size:inherit">'
                + '<i class="fas fa-fire-alt fa-stack-1x flicker-animated" style="color:orange;vertical-align:bottom;font-size:1.5em;opacity:.7;"></i>'
                + '<i class="fas fa-stack-2x fa-fire-alt flicker-animated" style="color:yellow;font-size:1.25em;vertical-align:bottom;"></i>'
                + '<i class="fas fa-stack-2x fa-fire-alt flicker1-animated" style="color:orangered;font-size:1em;vertical-align:bottom;margin-top:.15em;text-shadow: 0 0 .2em orange;"></i>'
                + '</span > ');
        },
        _createCoolingIcon: function () {
            return $('<span class="fa-stack fa-2x picHeaterStatusIcon picCoolingOn" style="vertical-align:middle;line-height:1em;font-size:inherit;">'
                + '<i class="fas burst-animated fa-snowflake fa-stack-1x fa-spin" style="color:blue;vertical-align:middle;font-size:1.4em;"></i>'
                + '<i class="fas fa-stack-2x fa-snowflake" style="color:blue;font-size:1em;vertical-align:middle;"></i>'
                + '<i class="fas flicker1-animated fa-stack-2x fa-snowflake" style="color:lightblue;font-size:1em;vertical-align:middle;"></i>'
                + '</span > ');
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picBody');
            el.addClass('pic' + o.name);
            el.attr('data-body', o.name);
            el.attr('data-id', o.id);
            el.attr('data-circuitid', o.circuit);
            el.attr('data-ison', o.isOn);
            var bodyIcon = $('<div></div>').addClass('picBodyIcon');
            var line = $('<div></div').appendTo(bodyIcon);
            $('<label></label>').addClass('picBodyText').appendTo(line);
            $('<div></div>').addClass('picIndicator').appendTo(bodyIcon);
            bodyIcon.appendTo(el);

            var bodyTemp = $('<div></div>').addClass('picBodyTemp');
            line = $('<div></div').appendTo(bodyTemp);
            $('<label></label>').attr('data-bind', 'name').appendTo(line);
            $('<label></label>').text(' Temp').appendTo(line);
            line = $('<div></div>').addClass('body-temp').appendTo(bodyTemp);
            $('<span></span>').addClass('picTempData').attr('data-bind', 'temp').attr('data-fmttype', 'number').attr('data-fmtmask', '#,##0.#').attr('data-fmtempty', '--.-').appendTo(line);
            $('<label></label>').addClass('picUnitSymbol').html('&deg').css({ fontSize: '.4em', verticalAlign:'top', display:'inline-block', paddingTop:'.25em' }).appendTo(line);
            $('<span></span>').addClass('picTempUnits').text('-').css({ fontSize: '.4em', verticalAlign: 'top', display: 'inline-block', paddingTop: '.25em'}).appendTo(line);
            bodyTemp.appendTo(el);
            
            var setpointsWrapper = $('<div></div>').appendTo(el); 
            var setpoints = $('<div></div>').addClass('picBodySetpoints');
            line = $('<div></div>').addClass('heatSetpoint').appendTo(setpoints);
            $('<label></label>').addClass('picInline-label').addClass('picSetpointText').addClass('heatSetpoint').text('Set Point').appendTo(line);
            $('<span></span>').addClass('picSetpointData').attr('data-bind', 'setPoint').text('--.-').appendTo(line);
            $('<label></label>').addClass('picUnitSymbol').html('&deg;').appendTo(line);
            $('<span></span>').addClass('picTempUnits').text('-').appendTo(line);

            line = $('<div></div>').addClass('coolSetpoint').appendTo(setpoints).hide();
            $('<label></label>').addClass('picInline-label').addClass('picSetpointText').addClass('coolSetpoint').text('Cool Point').appendTo(line);
            $('<span></span>').addClass('picSetpointData').attr('data-bind', 'coolSetpoint').text('--.-').appendTo(line);
            $('<label></label>').addClass('picUnitSymbol').html('&deg;').appendTo(line);
            $('<span></span>').addClass('picTempUnits').text('-').appendTo(line);

            line = $('<div></div>').appendTo(setpoints);
            $('<label></label>').addClass('picInline-label').addClass('picSetpointText').text('Heat Mode').appendTo(line);
            $('<span></span>').addClass('picModeData').css({ maxWidth: '5.1rem', display:'inline-block'}).attr('data-bind', 'heatMode.desc').text('----').appendTo(line);
            line = $('<div></div>').appendTo(setpoints);
            $('<label></label>').addClass('picInline-label').addClass('picSetpointText').text('Heater Status').appendTo(line);
            $('<span></span>').addClass('picStatusData').attr('data-bind', 'heatStatus.desc').text('----').css({ maxWidth: '5.1rem', display: 'inline-block' }).appendTo(line);
            setpoints.appendTo(setpointsWrapper);
            line = $('<div></div>').attr('data-circuitid', o.circuit).addClass('outerBodyEndTime').appendTo(setpointsWrapper).css('display', 'none');
            $('<label></label>').addClass('picInline-label').attr('data-circuitid', o.circuit).addClass('picSetpointText').text('Time to off').appendTo(line);
            $('<span class="bodyCircuitEndTime"></span>').appendTo(line);


            //$('<div class="picBodyIcon">'
            //    + '<div><label class="picBodyText"></label></div>'
            //    + '<div class="picIndicator"></div></div>'

            //    + '<div class="picBodyTemp">'
            //    + '<div><label data-bind="name"></label><label class="picTempText"> Temp</label></div>'
            //    + '<div class="body-temp"><span class="picTempData" data-bind="temp" data-fmttype="number" data-fmtmask="#,##0.#" data-fmtempty="--.-"></span><label class="picUnitSymbol">&deg;</label><span class="picTempUnits">-</span></div>'
            //    + '</div>'

            //    + '<div class= "picBodySetPoints">'
            //    + '<div><label class="picInline-label picSetPointText">Set Point</label><span class="picSetPointData" data-bind="setPoint">--.-</span><label class="picUnitSymbol">&deg;</label><span class="picTempUnits">-</span><div>'
            //    + '<div><label class="picInline-label picSetPointText">Heat Mode</label><span style="max-width:5.1rem;display:inline-block;" class="picModeData" data-bind="heatMode.desc">----</span>'
            //    + '<div><label class="picInline-label picSetPointText">Heater Status</label><span class="picStatusData" data-bind="heatStatus.desc">----</span>'
            //    + '</div>'
            //).appendTo(el);
            self._createSolarIcon(1).appendTo(el);
            self._createHeaterIcon(1).appendTo(el);
            self._createCoolingIcon(1).appendTo(el);
            el.on('click', 'div.picIndicator', function (evt) {
                let ind = $(evt.target);
                ind.attr('data-status', 'pending');
                $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-circuitid'), 10), state: !makeBool(ind.attr('data-state')) }, function () { });
                setTimeout(function () { ind.attr('data-status', makeBool(ind.attr('data-state')) ? 'on' : 'off'); }, 3000);
            });
            el.on('click', 'div.picBodySetpoints', function (evt) {
                var body = el;
                var settings = {
                    name: body.attr('data-body'),
                    heatMode: parseInt(body.attr('data-heatmode'), 10),
                    setPoint: parseInt(body.attr('data-setpoint'), 10),
                    coolSetpoint: parseInt(body.attr('data-coolsetpoint'), 10),
                    hasCooling: makeBool(body.attr('data-hascooling'))
                };
                $.getApiService('/config/body/' + el.attr('data-id') + '/heatModes', null, function (data, status, xhr) {
                    //console.log(data);
                    var units = el.parents('div.picBodies:first').attr('data-unitsname');
                    // https://github.com/tagyoureit/nodejs-poolController/issues/314
                    // setPoint was null; added error checking if this is not set; also added server side validation
                    if (typeof settings.setPoint === 'undefined' || isNaN(settings.setPoint)) {
                        var d = dataBinder.fromElement(el.find('.picTempData'));
                        if (typeof d.temp === 'undefined' || isNaN(d.temp)) settings.setPoint = units === "F" ? 65 : 5;
                        else settings.setPoint = parseInt(d.temp, 10);
                    }
                    var divPopover = $('<div></div>');
                    divPopover.appendTo(el.parent());
                    divPopover.on('initPopover', function (evt) {
                        if (settings.hasCooling) {
                            $('<div></div>').appendTo(evt.contents()).valueSpinner({ canEdit: true, labelText: 'Heat Point', val: settings.setPoint, min: units === "F" ? 65 : 5, max: units === "F" ? 104 : 41, step: 1, binding: 'heatSetpoint', units: '<span>&deg;</span><span class="picTempUnits">' + units + '</span>', labelAttrs: { style: { width: '5rem' } }, style: { display: 'block' } })
                                .on('change', function (e) {
                                    var coolSetpoint;
                                    divPopover.find('div[data-bind="coolSetpoint"]').each(function () { this.minVal(e.value + 1); coolSetpoint = this.val(); });
                                    self.putSetpoints(e.value, undefined);
                                });
                            $('<div></div>').appendTo(evt.contents()).valueSpinner({ canEdit: true, labelText: 'Cool Point', val: settings.coolSetpoint || settings.setPoint + 1, min: settings.setPoint + 1, max: units === "F" ? 104 : 41, step: 1, binding: 'coolSetpoint', units: '<span>&deg;</span><span class="picTempUnits">' + units + '</span>', labelAttrs: { style: { width: '5rem' } }, style: { display: 'block' } })
                                .on('change', function (e) { self.putSetpoints(undefined, e.value); });
                        }
                        else
                            $('<div></div>').appendTo(evt.contents()).valueSpinner({ canEdit: true, labelText: 'Set Point', val: settings.setPoint, min: units === "F" ? 65 : 5, max: units === "F" ? 104 : 41, step: 1, binding: 'heatSetpoint', units: '<span>&deg;</span><span class="picTempUnits">' + units + '</span>', labelAttrs: { style: { marginRight: '.25rem' } } })
                                .on('change', function (e) { self.putSetpoint(e.value); });
                        $('<div></div>').appendTo(evt.contents()).selector({ val: parseInt(body.attr('data-heatmode'), 10), test: 'text', opts: data, bind: 'heatMode' });
                        evt.contents().find('div.picSelector').on('selchange', function (e) {
                            self.putHeatMode(parseInt(e.newVal, 10));
                        });
                    });
                    divPopover.popover({ title: body.attr('data-body') + ' Heat Settings', popoverStyle: 'modal', placement: { target: body } });
                    divPopover[0].show(body);
                    // Min/max 65F-104F
                });
            });
        },
        setEquipmentData: function (data) {
            var self = this, o = self.options, el = self.element;
            if (typeof data.heatStatus === 'undefined') data.heatStatus = { val: 0, name: 'off', desc: 'Unknown' };
            if (typeof data.heatMode === 'undefined') data.heatMode = { val: 0, name: 'off', desc: 'Unknown' };
            dataBinder.bind(el, data);
            try {
                if (typeof data.isCovered !== 'undefined') el.attr('data-covered', data.isCovered);
                if (typeof data.temp === 'undefined') el.find('span.picTempData').text('--');
                el.find('div.picIndicator').attr('data-state', makeBool(data.isOn) ? 'on' : 'off');
                el.find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
                el.attr('data-ison', data.isOn);
                el.attr('data-setpoint', data.setPoint);
                el.attr('data-coolsetpoint', data.coolSetpoint);
                if (typeof data.heaterOptions === 'undefined' || data.heaterOptions.total < 1) {
                    el.find('div.picBodySetpoints').hide();
                    el.find('div.picSetpointText').text('Set Point');
                    el.find('div.coolSetpoint').hide();
                    el.attr('data-hascooling', false);
                }
                else {
                    el.find('div.picBodySetpoints').show();
                    if (data.heaterOptions.hasCoolSetpoint) {
                        el.find('label.picSetpointText.heatSetpoint').text('Heat Point');
                        if (($('div.dashOuter').data('controllertype')).includes('center')){
                            el.find('div.coolSetpoint').show();
                        }
                        else {
                            // Touch doesn't have cooling setpoints on the spa; only pool
                            $('div.picPool div.coolSetpoint').show();
                        }
                        el.attr('data-hascooling', true);
                    }
                    else {
                        el.find('label.picSetpointText.heatSetpoint').text('Set Point');
                        el.find('div.coolSetpoint').hide();
                        el.attr('data-hascooling', false);
                    }
                }
                el.attr('data-heatmode', data.heatMode.val);
                switch (data.heatStatus.name) {
                    case 'solar':
                        el.find('span.picSolarOn').css('display', 'inline-block');
                        el.find('span.picCoolingOn').hide();
                        el.find('span.picHeaterOn').hide();
                        break;
                    case 'hpheat':
                    case 'heater':
                        el.find('span.picSolarOn').hide();
                        el.find('span.picCoolingOn').hide();
                        el.find('span.picHeaterOn').css('display', 'inline-block');
                        break;
                    case 'hpcool':
                    case 'cooling':
                        el.find('span.picSolarOn').hide();
                        el.find('span.picHeaterOn').hide();
                        el.find('span.picCoolingOn').css('display', 'inline-block');
                        break;
                    default:
                        el.find('span.picCoolingOn').hide();
                        el.find('span.picSolarOn').hide();
                        el.find('span.picHeaterOn').hide();
                        break;
                }
            } catch (err) { console.error({ msg: 'Error body data', err: err, body: data }); }
        },
        setCircuitState: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picBodyIcon div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
            el.find('div.picBodyIcon div.picIndicator').attr('data-state', data.isOn);
            el.find('label.picBodyText').text(data.name);
        },
        setUnits: function (units) {
            var self = this, o = self.options, el = self.element;
            el.attr('data-unitsname', units.name);
            el.find('*.picTempUnits').text(units.name);
        },
        putHeatMode: function (mode) {
            var self = this, o = self.options, el = self.element;
            $.putApiService('state/body/heatMode', { id: parseInt(el.attr('data-id'), 10), mode: mode }, function () { });
        },
        putSetpoint: function (setPoint) {
            var self = this, o = self.options, el = self.element;
            $.putApiService('state/body/setPoint', { id: parseInt(el.attr('data-id'), 10), heatSetpoint: setPoint }, function () {});
        },
        putSetpoints: function (heatSetpoint, coolSetpoint) {
            var self = this, o = self.options, el = self.element;
            $.putApiService('state/body/setPoint', { id: parseInt(el.attr('data-id'), 10), heatSetpoint: heatSetpoint, coolSetpoint: coolSetpoint }, function () { });
        }
    });

    $.widget('pic.temps', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            var toggle = $('<div class="picFeatureToggle"></div>');
            toggle.appendTo(el);
            toggle.toggleButton();
            var lbl = $('<label class="picFeatureLabel"></div>');
            lbl.appendTo(el);
            lbl.text(o.name);
            if (typeof o.showInFeatures !== 'undefined') el.attr('data-showinfeatures', o.showInFeatures);
        }
    });

    $.widget('pic.bodyHeatOptions', {
        options: {},
        _create: function() {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function() {
            var self = this, o = self.options, el = self.element;
        }
    });
})(jQuery);
