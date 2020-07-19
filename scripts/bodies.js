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
            var div = $('<div class="picAmbientTemp"></div>');
            div.appendTo(el);
            var d = $('<div><label class="picInline-label picAmbientTemp">Air Temp</label><span class="picAirTemp"></span><label class="picUnitSymbol">&deg;</label><span class="picUnits">-</span></div>');
            d.appendTo(div);
            d = $('<div class="picSolarTempField"><label class="picInline-label picAmbientTemp">Solar Temp</label><span class="picSolarTemp"></span><label class="picUnitSymbol">&deg;</label><span class="picUnits">-</span></div>');
            d.appendTo(div);
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
        },
        setTemps: function (data) {
            var self = this, o = self.options, el = self.element;
            var nSolar = 0;
            el.find('span.picAirTemp').text(data.air);
            el.find('span.picSolarTemp').text(data.solar);
            el.find('span.picUnits').text(data.units.name);
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
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picBody');
            el.addClass('pic' + o.name);
            el.attr('data-body', o.name);
            el.attr('data-id', o.id);
            el.attr('data-circuitid', o.circuit);
            el.attr('data-ison', o.isOn);
            $('<div class="picBodyIcon">'
                + '<div><label class="picBodyText"></label></div>'
                + '<div class="picIndicator"></div></div>'

                + '<div class="picBodyTemp">'
                + '<div><label data-bind="name"></label><label class="picTempText"> Temp</label></div>'
                + '<div><span class="picTempData" data-bind="temp" data-fmttype="number" data-fmtmask="#,##0.#" data-fmtempty="--.-"></span><label class="picUnitSymbol">&deg;</label><span class="picUnits">-</span></div>'
                + '</div>'

                + '<div class= "picBodySetPoints">'
                + '<div><label class="picInline-label picSetPointText">Set Point</label><span class="picSetPointData" data-bind="setPoint">--.-</span><label class="picUnitSymbol">&deg;</label><span class="picUnits">-</span><div>'
                + '<div><label class="picInline-label picSetPointText">Heat Mode</label><span class="picModeData" data-bind="heatMode.desc">----</span>'
                + '<div><label class="picInline-label picSetPointText">Heater Status</label><span class="picStatusData" data-bind="heatStatus.desc">----</span>'
                + '</div>'
            ).appendTo(el);
            self._createSolarIcon(1).appendTo(el);
            self._createHeaterIcon(1).appendTo(el);
            el.on('click', 'div.picIndicator', function (evt) {
                let ind = $(evt.target);
                ind.attr('data-status', 'pending');
                $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-circuitid'), 10), state: !makeBool(ind.attr('data-state')) }, function () { });
                setTimeout(function () { ind.attr('data-status', makeBool(ind.attr('data-state')) ? 'on' : 'off'); }, 3000);
            });
            el.on('click', 'div.picBodySetPoints', function (evt) {
                var body = el;
                var settings = {
                    name: body.attr('data-body'),
                    heatMode: parseInt(body.attr('data-heatmode'), 10),
                    setPoint: parseInt(body.attr('data-setpoint'), 10)
                };
                $.getApiService('/config/body/' + el.attr('data-id') + '/heatModes', null, function (data, status, xhr) {
                    console.log(data);
                    var divPopover = $('<div></div>');
                    divPopover.appendTo(el.parent());
                    divPopover.on('initPopover', function (evt) {
                        $('<div><label class="picInline-label picSetpointText">' + body.attr('data-body') + ' Set Point</label><div class="picValueSpinner" data-bind="heatSetpoint"></div></div>'
                            + '<div class= "picSelector" data-bind="heatMode"></div>').appendTo(evt.contents());
                        evt.contents().find('div.picValueSpinner').each(function () {
                            $(this).valueSpinner({ val: settings.setPoint, min: 65, max: 104, step: 1 });
                        });
                        evt.contents().find('div.picValueSpinner').on('change', function (e) {
                            //console.log(e);
                            self.putSetpoint(e.value);
                        });
                        evt.contents().find('div.picSelector').selector({ val: parseInt(body.attr('data-heatmode'), 10), test: 'text', opts: data });
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
                if (typeof data.temp === 'undefined') el.find('span.picTempData').text('--');
                el.find('div.picIndicator').attr('data-state', makeBool(data.isOn) ? 'on' : 'off');
                el.find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
                el.attr('data-ison', data.isOn);
                el.attr('data-setpoint', data.setPoint);
                if (typeof data.heaterOptions === 'undefined' || data.heaterOptions.total < 1) el.find('div.picBodySetPoints').hide();
                else el.find('div.picBodySetPoints').show();
                el.attr('data-heatmode', data.heatMode.val);
                switch (data.heatStatus.name) {
                    case 'solar':
                        el.find('span.picSolarOn').css('display', 'inline-block');
                        el.find('span.picHeaterOn').hide();
                        break;
                    case 'heater':
                        el.find('span.picSolarOn').hide();
                        el.find('span.picHeaterOn').css('display', 'inline-block');
                        break;
                    default:
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
            el.find('*.picUnits').text(units.name);
        },
        putHeatMode: function (mode) {
            var self = this, o = self.options, el = self.element;
            $.putApiService('state/body/heatMode', { id: parseInt(el.attr('data-id'), 10), mode: mode }, function () { });
        },
        putSetpoint: function (setPoint) {
            var self = this, o = self.options, el = self.element;
            $.putApiService('state/body/setPoint', { id: parseInt(el.attr('data-id'), 10), setPoint: setPoint }, function () { });
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
