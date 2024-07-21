(function ($) {
    $.widget("pic.pumps", {
        options: { },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initPumps = function (data) { self._initPumps(data); };
            el[0].setPumpData = function (data) { self.setPumpData(data); };
        },
        _initPumps: function(data) {
            var self = this, o = self.options, el = self.element;
            el.empty();
            if (typeof data !== 'undefined') {
                
                let div = $('<div class="picCircuitTitle control-panel-title"></div>');
                div.appendTo(el);
                let span = $('<span class="picCircuitTitle"></span>');
                span.appendTo(div);
                span.text('Pumps');
                for (let i = 0; i < data.pumps.length; i++) {
                    // Create a new pump for each installed pump.
                    let div = $('<div class="picPump"></div>');
                    div.appendTo(el);
                    div.pump(data.pumps[i]);
                }
                if (el.find('div.picPump[data-active=true]').length > 0)
                    el.show();
                else
                    el.hide();
            }
            else {
                el.hide();
            }
        },
        setPumpData: function (data) {
            var self = this, o = self.options, el = self.element;
            var pnl = $('div.picPump[data-id=' + data.id + ']');
            if (pnl.length === 0) {
                let div = $('<div class="picPump"></div>');
                div.appendTo(el);
                div.pump(data);
            }
            else {
                pnl.each(function () {
                    this.setEquipmentData(data);
                });
            }
        }
    });
    $.widget('pic.pump', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            self.setEquipmentData(o);
            el[0].setEquipmentData = function (data) { self.setEquipmentData(data); };
        },
        _createPrograms: function (data) {
            var self = this, o = self.options, el = self.element;
            var tbl = $('<table></table>').addClass('picPumpPrograms');
            var tbody = $('<tbody></tbody>').appendTo(tbl);
            var header = $('<tr></tr>').appendTo(tbody);
            var progs = $('<tr></tr>').appendTo(tbody);
            for (let i = 0; i < 4; i++) {
                $('<td></td>').appendTo(header).text(i + 1);
                var td = $('<td></td>').appendTo(progs);
                var circ = $('<i></i>').appendTo(td);
                if (((1 << i) & data.relay) > 0)
                    circ.addClass('fas').addClass('fa-times-circle');
                else
                    circ.addClass('far').addClass('fa-circle');
            }
            return tbl;
        },
        setCircuitRates: function (elPump) {
            var self = this, o = self.options, el = self.element;
            var pump = { id: parseInt(elPump.attr('data-id'), 10), circuits: [] };
            elPump.find('div.picPumpCircuit').each(function () {
                var $circ = $(this);
                var circ = dataBinder.fromElement($circ);
                delete circ.name; // Remove the name so we don't confuse anyone trying to replicate the interface although it won't matter.
                circ.id = parseInt($circ.attr('data-id'), 10);
                circ.circuit = parseInt($circ.attr('data-eqid'), 10);
                pump.circuits.push(circ);
            });
            $.putApiService('/config/pump', pump, function (data, status, xhr) {
                console.log(data);
            });
        },
        setEquipmentData: function (data) {
            var self = this, o = self.options, el = self.element;
            try {
                var type = data.type || { val: 0, name: 'none' };
                if ( type.val === 0 || data.isActive === false) {
                    el.attr('data-active', false);
                    setTimeout(function () { el.remove(); }, 10);
                }
                else {
                    el.attr('data-active', true);
                    dataBinder.bind(el, data);
                    el.css({ display: '' });
                    if (data.pumpOnDelay === true)
                        el.find('div.picIndicator').attr('data-status', 'delay');
                    else
                        el.find('div.picIndicator').attr('data-status', data.command === 10 || data.relay > 0 ? 'on' : 'off');
                }
                el.attr('data-pumptype', data.type.val);
                el.attr('data-id', data.id);
                switch (data.type.name) {
                    case 'ss':
                        el.find('div.picSpeed').hide();
                        el.find('div.picFlow').hide();
                        el.find('div.picEnergy').hide();
                        el.find('div.picRelay').hide();
                        el.find('div.picProgram').hide();
                        break;
                    case 'ds':
                        el.find('div.picProgram').hide();
                        el.find('div.picSpeed').hide();
                        el.find('div.picFlow').hide();
                        el.find('div.picEnergy').hide();
                        if (typeof data.relay !== 'undefined') {
                            el.find('div.picRelay').show();
                            if (data.relay === 0) el.find('div.picRelay').text('Off');
                            else if (data.relay === 1) el.find('div.picRelay').text('Low Speed');
                            else el.find('div.picRelay').text('High Speed');
                        }
                        else
                            el.find('div.picRelay').hide();
                        break;
                    case 'hwvs':
                    case 'vs':
                    case 'vs+svrs':
                        el.find('div.picProgram').hide();
                        el.find('div.picFlow').hide();
                        el.find('div.picSpeed').show();
                        el.find('div.picEnergy').show();
                        el.find('div.picRelay').hide();
                        break;
                    case 'vsf':
                        el.find('div.picProgram').hide();
                        el.find('div.picFlow').show();
                        el.find('div.picSpeed').show();
                        el.find('div.picEnergy').show();
                        el.find('div.picRelay').hide();
                        break;
                    case 'vf':
                        el.find('div.picProgram').hide();
                        el.find('div.picFlow').show();
                        el.find('div.picSoeed').show();
                        //el.find('div.picSpeed').hide();
                        el.find('div.picEnergy').show();
                        el.find('div.picRelay').hide();
                        break;
                    case 'hwrly':
                        el.find('div.picProgram').show();
                        el.find('div.picFlow').hide();
                        el.find('div.picSpeed').hide();
                        el.find('div.picEnergy').hide();
                        el.find('div.picRelay').hide();
                        break;
                    case 'sf':
                        el.find('div.picSpeed').hide();
                        el.find('div.picFlow').hide();
                        el.find('div.picEnergy').hide();
                        el.find('div.picRelay').show();
                        el.find('div.picProgram').hide();
                        if (typeof data.relay === 'undefined') data.relay = 0;
                        el.find('div.picRelay').html(self._createPrograms(data)[0].outerHTML);

                        // Alright lets show our
                        break;
                    default:
                        el.hide();
                        break;
                }
                // Bind up any associated circuit speeds.
                if (typeof data.circuits !== 'undefined') {
                    el.parent().find('div.picPopover.picPumpSettings[data-id=' + el.attr('data-id') + ']').each(function () {
                        let $this = $(this);
                        for (let i = 0; i < data.circuits.length; i++)
                            $this.find(`div.picPumpCircuit[data-id="${i + 1}]"`).each(function () {
                                dataBinder.bind($(this), data.circuits[i]);
                            });
                    });
                }
            } catch (err) { console.error({ m: 'Error setting pump data', err: err, pump: data }); }
            var pnl = el.parents('div.picPumps:first');
            if (pnl.find('div.picPump[data-active=true]').length > 0)
                pnl.show();
            else
                pnl.hide();
        },
        _buildControls: function() {
            var self = this, o = self.options, el = self.element;
            el.empty();
            $('<div class="picIndicator"></div><label class="picPumpName" data-bind="name"></div>').appendTo(el);
            el.attr('data-id', o.id);
            $('<div class="picSpeed picData"><span class="picRpm" data-bind="rpm" data-fmttype="number" data-fmtmask="#,##0" data=fmtempty="-,---"></span><label class="picUnits">rpm</label></div>').appendTo(el);
            $('<div class="picFlow picData"><span class="picGpm" data-bind="flow" data-fmttype="number" data-fmtmask="#,##0" data-fmtempty="---"></span><label class="picUnits">gpm</label></div>').appendTo(el);            
            $('<div class="picEnergy picData"><span class="picWatts" data-bind="watts" data-fmttype="number" data-fmtmask="#,##0" data-fmtempty="---"></span><label class="picUnits">watts</label></div>').appendTo(el);
            $('<div class="picRelay picData"><span class="picRelay" data-bind="relay" data-fmttype="number" data-fmtmask="#" data-fmtempty="---"></span></div>').appendTo(el);
            $('<div class="picProgram"><span class=picCommand>Program #</span><span class="picCommand" data-bind="command" data-fmttype="number" data-fmtmask="#" data-fmtempty="---"></span></div>').appendTo(el);

            el.on('click', function (evt) {
                let type = parseInt(el.attr('data-pumptype'), 10);
                evt.stopImmediatePropagation();
                evt.preventDefault();
                // Get all the circuits and their associated speeds.
                $.getApiService('/state/pump/' + el.attr('data-id'), null, function (data, status, xhr) {
                    console.log(data);
                    // Build a popover for setting the flows and speeds for the circuits.
                    var divPopover = $('<div class="picPumpSettings"></div>');
                    divPopover.attr('data-id', el.attr('data-id'));
                    divPopover.appendTo(el.parent());
                    divPopover.on('initPopover', function (evt) {
                        for (let i = 0; i < data.circuits.length; i++) {
                            let circuit = data.circuits[i];
                            if (typeof circuit.circuit === 'undefined' || typeof circuit.circuit.type === 'undefined' || circuit.circuit.id <= 0) continue;
                            
                            let div = $('<div class="picPumpCircuit"></div>');
                            div.attr('data-id', i + 1);
                            let btn = $('<div class="picCircuit" data-hidethemes="true"></div>');
                            let spin = $('<div class="picValueSpinner picPumpSpeed"></div>');
                            btn.appendTo(div);
                            spin.appendTo(div);
                            div.appendTo(evt.contents());
                            
                            $('<input type="hidden" data-datatype="int" data-bind="units.val"></input>').appendTo(div).val(circuit.units.val);
                            if (circuit.circuit.equipmentType === 'feature') {
                                div.attr('data-featureid', circuit.circuit.id);
                                div.attr('data-eqid', circuit.circuit.id);
                                btn.feature(circuit.circuit);
                                btn.addClass('picFeature');
                            }
                            else if (circuit.circuit.equipmentType === 'virtualCircuit') {
                                div.attr('data-circuitid', circuit.circuit.id);
                                div.attr('data-eqid', circuit.circuit.id);
                                btn.virtualCircuit(circuit.circuit);
                            }
                            else if (circuit.circuit.equipmentType === 'circuitGroup') {
                                div.attr('data-circuitid', circuit.circuit.id);
                                div.attr('data-eqid', circuit.circuit.id);
                                btn.circuitGroup(circuit.circuit);
                                btn.addClass('picFeature').addClass('picCircuitGroup');
                            }
                            else {
                                div.attr('data-circuitid', circuit.circuit.id);
                                div.attr('data-eqid', circuit.circuit.id);
                                btn.circuit(circuit.circuit);
                                btn.addClass('picFeature');
                                btn[0].enablePopover(false);
                            }
                            
                            spin.attr('data-units', circuit.units.val);
                            if (data.type.maxRelays === 1) {
                                continue; // don't display relays if there is only one
                            }
                            else if (data.type.maxRelays > 1) {
                                spin.valueSpinner({ val: circuit.relay, min: 1, max: data.type.maxSpeeds || data.type.maxRelays, step: 1, binding: 'relay' });
                                spin.find('div.picSpinner-value').css({ width: '3.5rem' });
                            }
                            else {
                                if (circuit.units.val === 0) spin.attr('data-bind', 'speed');
                                else spin.attr('data-bind', 'flow');
                                spin.valueSpinner({
                                    val: circuit.units.val === 0 ? circuit.speed : circuit.flow,
                                    min: circuit.units.val === 0 ? data.minSpeed : data.minFlow,
                                    max: circuit.units.val === 0 ? data.maxSpeed : data.maxFlow,
                                    step: circuit.units.val === 0 ? 50 : data.flowStepSize,
                                    units: circuit.units.name,
                                    canEdit: true
                                });
                                spin.find('div.picSpinner-value').css({ width: '4.5rem' });
                            }
                            spin.attr('data-id', i + 1);
                            spin.on('change', function (e) { self.setCircuitRates(divPopover); });
                        }
                    });
                    divPopover.on('click', function (e) { e.stopImmediatePropagation(); e.preventDefault(); });
                    divPopover.popover({ title: data.name + ' Pump Settings', popoverStyle: 'modal', placement: { target: evt.target } });
                    divPopover[0].show(evt.target);
                });

            });
        }
    });
})(jQuery);
