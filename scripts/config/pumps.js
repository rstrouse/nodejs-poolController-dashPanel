(function ($) {
    $.widget('pic.configPumps', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgBodies');
            $.getApiService('/config/options/pumps', null, 'Loading Options...', function (opts, status, xhr) {
                console.log(opts);
                var pumps = opts.pumps;
                for (var i = 0; i < pumps.length; i++) {
                    $('<div></div>').appendTo(el).pnlPumpConfig({ pumpTypes: opts.pumpTypes, maxPumps: opts.maxPumps, pumpUnits: opts.pumpUnits, circuits: opts.circuits, bodies: opts.bodies, models:opts.models, servers: opts.servers })[0].dataBind(pumps[i]);
                }
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                var btnAdd = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Add Pump', icon: '<i class="fas fa-plus" ></i>' });
                btnAdd.on('click', function (e) {
                    var groups = el.find('div.picConfigCategory.cfgPump');
                    //$(this).addClass('disabled');
                    //$(this).find('i').addClass('burst-animated');
                    var pnl = $('<div></div>').insertBefore(btnPnl).pnlPumpConfig({ pumpTypes: opts.pumpTypes, maxPumps: opts.maxPumps, pumpUnits: opts.pumpUnits, circuits: opts.circuits, bodies: opts.bodies, models: opts.models, servers: opts.servers });
                    var pt = opts.pumpTypes[0];
                    pnl[0].dataBind({
                        id: -1, name: 'Pump ' + (groups.length + 1),
                        type: pt.val, circuits: [],
                        minFlow: 0, maxFlow: 130,
                        minSpeed: 0, maxSpeed: 3450, primingTime: 0,
                        primingSpeed: 0, address: 96 + groups.length
                    });
                    pnl.find('div.picAccordian:first')[0].expanded(true);
                });

            });
        }
    });
})(jQuery); // Pumps Tab
(function ($) {
    $.widget('pic.pnlPumpConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgPump');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-cog', style: { width: '9rem' } },
                { binding: 'type', style: { width: '9rem' } },
                { binding: 'circuits', style: { width: '15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', textAlign: 'center' } }]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'master').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { width:'3.25rem' } } });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 2, labelText: 'Type', binding: binding + 'type',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Pump Type', style: { whiteSpace: 'nowrap' } }],
                items: o.pumpTypes, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            var addrs = [];
            for (var k = 0; k < o.maxPumps; k++) addrs.push({ val: k + 96, desc: k + 1 });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Address', binding: binding + 'address',
                columns: [{ binding: 'val', hidden: true, text: 'val', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Address', style: { whiteSpace: 'nowrap' } }],
                items: addrs, inputAttrs: { style: { width: '2rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Body', binding: binding + 'body',
                columns: [{ binding: 'val', hidden: true, text: 'val', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Body', style: { whiteSpace: 'nowrap' } }],
                items: o.bodies, inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Model', binding: binding + 'model',
                columns: [{ binding: 'val', hidden: true, text: 'val', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Model', style: { whiteSpace: 'nowrap' } }],
                items: [], inputAttrs: { style: { width: '11rem' } }, labelAttrs: { style: { width: '3.25rem', marginLeft: '0rem' } }
            });


            line = $('<div class="picPumpDetails"></div>').appendTo(pnl);
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div id="btnSavePump"></div>').appendTo(btnPnl).actionButton({ text: 'Save Pump', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                // Go back to the server and get the list of all installed pumps at the moment.
                if (dataBinder.checkRequired(p)) {
                    $.getApiService('/config/options/pumps', null, function (opts, status, xhr) {
                        console.log(v);
                        var valid = true;
                        // Verify all the addresses are unique.
                        var type = opts.pumpTypes.find(elem => elem.val === v.type);
                        if (typeof type === 'undefined') type = opts.pumpTypes.find(elem => elem.name === 'vs');
                        if (typeof type === 'undefined') type = { val: 0, name: 'unknown', desc: 'unknown' };
                        if (type.hasAddress) {
                            for (var j = 0; j < opts.pumps.length; j++) {
                                var pump = opts.pumps[j];
                                if (pump.id === v.id) continue;
                                if (type.hasAddress && pump.address === v.address) {
                                    $('<div></div>').appendTo(el.find('div.picPickList[data-bind$=address]:first')).fieldTip({
                                        message: 'Address conflicts with pump: ' + pump.name
                                    });
                                    
                                    valid = false;
                                }
                            }
                        }
                        if (typeof type.maxCircuits !== 'undefined' && type.maxCircuits > 0) {
                            // If we have circuits then we need to verify that there are no duplicates.
                            var hash = {};
                            if (typeof v.circuits === 'undefined') v.circuits = [];
                            for (var i = 0; i < v.circuits.length; i++) {
                                var c = v.circuits[i];
                                if (typeof hash['c' + c.circuit] !== 'undefined') {
                                    var dd = el.find('div.picCircuitOption:nth-child(' + (i + 1) + ') > div.picPickList[data-bind$=circuit]');
                                    $('<div></div>').appendTo(dd).fieldTip({ message: 'Pump circuits<br></br>must be unique' });
                                    valid = false;
                                }
                                hash['c' + c.circuit] = c.circuit;
                            }
                        }
                        if (valid) {
                            console.log(v);
                            $.putApiService('/config/pump', v, 'Saving Pump...', function (data, status, xhr) {
                                console.log(data);
                                self.dataBind(data);
                            });
                        }
                    });
                }
            });
            el.on('selchanged', 'div.picPickList[data-bind=type]', function (evt) {
                if (typeof evt.oldItem !== 'undefined') {
                    var pmp = dataBinder.fromElement(el);
                    self.dataBind(pmp);
                }
            });

            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Delete Pump', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeletePump', {
                    message: 'Are you sure you want to delete pump ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Pump',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgPump:first').remove();
                            else {
                                console.log('Deleting Pump');
                                $.deleteApiService('/config/pump', v, 'Deleting Pump...', function (c, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgPump:first').remove();
                                });
                            }
                        }
                    },
                    {
                        text: 'No', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }]
                });
            });
        },
        _buildRelayPanel: function (type) {
            var self = this, o = self.options, el = self.element;

        },
        _resetPumpPanel: function (type) {
            var self = this, o = self.options, el = self.element;
            var binding = '';
            var pnl = el.find('div.picPumpDetails:first');
            pnl.empty();
            var line = $('<div></div>').appendTo(pnl);
            var lblStyle = { width: '8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
            if (typeof type.maxPrimingTime !== 'undefined') {
                $('<div></div>').appendTo(line).valueSpinner({ canEdit:true, labelText: 'Priming Time', binding: binding + 'primingTime', min: 0, max: type.maxPrimingTime, step: 1, units: 'min', style: { width: '17rem' }, inputAttrs: { maxlength: 5 }, labelAttrs: { style: lblStyle } });
                $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Priming Speed', binding: binding + 'primingSpeed', min: type.minSpeed, max: type.maxSpeed, step: 10, units: 'rpm', inputAttrs: { maxlength: 5 }, labelAttrs: { style: lblStyle }, canEdit: true });
            }
            else {
                $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'primingTime').appendTo(line);
                $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'primingSpeed').appendTo(line);
            }
            line = $('<div></div>').appendTo(pnl).css({ margin: '3px' });
            if (typeof type.minSpeed !== 'undefined') 
                $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Minimum Speed', binding: binding + 'minSpeed', min: type.minSpeed, max: type.maxSpeed, step: 10, units: 'rpm', style: { width: '17rem' }, inputAttrs: { maxlength: 5 }, labelAttrs: { style: lblStyle }, canEdit: true });
            else
                $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'minSpeed').appendTo(line);
            if (typeof type.maxSpeed !== 'undefined')
                $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Maximum Speed', binding: binding + 'maxSpeed', min: type.minSpeed, max: type.maxSpeed, step: 10, units: 'rpm', inputAttrs: { maxlength: 5 }, labelAttrs: { style: lblStyle }, canEdit: true });
            else
                $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'maxSpeed').appendTo(line);
            line = $('<div></div>').appendTo(pnl);
            if (typeof type.minFlow !== 'undefined')
                $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Minimum Flow', binding: binding + 'minFlow', min: type.minFlow, max: type.maxFlow, step: 1, units: 'gpm', style: { width: '17rem' }, inputAttrs: { maxlength: 5 }, labelAttrs: { style: lblStyle }, canEdit: true });
            else
                $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'minFlow').appendTo(line);
            if (typeof type.maxFlow !== 'undefined')
                $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Maximum Flow', binding: binding + 'maxFlow', min: type.minFlow, max: type.maxFlow, step: 1, units: 'gpm', inputAttrs: { maxlength: 5 }, labelAttrs: { style: lblStyle }, canEdit: true });
            else
                $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'maxFlow').appendTo(line);

            if ((type.maxCircuits > 0) || (type.maxRelays > 0)) $('<hr></hr>').appendTo(pnl).css({ margin: '3px' });
            var tabs = $('<div></div>').appendTo(pnl).tabBar();
            var tab = tabs[0].addTab({ id: 'tabPumpCircuits', text: 'Circuits' });

            var pnlCircuits = $('<div class="cfgPump-pnlCircuits" style="text-align:right;"></div>').appendTo(tab);
            line = $('<div class="picCircuitsList-btnPanel"></div>').appendTo(pnlCircuits);
            $('<div><span>Pump Circuits</span></div>').appendTo(line);
            var btnCPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(line);
            var btnAddCircuit = $('<div></div>').appendTo(btnCPnl).actionButton({ text: 'Add Circuit', icon: '<i class="fas fa-plus" ></i>' });
            btnAddCircuit.on('click', function (e) {
                var pmp = dataBinder.fromElement(el);
                var type = o.pumpTypes.find(elem => elem.val === pmp.type);
                self.addCircuit(type, { units: 0 });
            });
            var clist = $('<div class="picCircuitsList-list" style="min-width:25rem;"></div>').appendTo(pnlCircuits);
            clist.on('click', 'i.picRemoveOption', function (e) {
                $(e.target).parents('div.picCircuitOption:first').remove();
                var rgx = /\[[0-9]\]/g;
                el.find('div.picCircuitsList-list:first > div.picCircuitOption').each(function (ndx) {
                    $(this).find('*[data-bind^="circuits["]').each(function () {
                        var bind = $(this).attr('data-bind');
                        $(this).attr('data-bind', bind.replace(rgx, '[' + ndx + ']'));
                    });
                });
            });
            clist.on('selchanged', 'div.picPickList[data-bind$=units]', function (e) {
                if (typeof e.oldItem !== 'undefined') {
                    var pmp = dataBinder.fromElement(el);
                    console.log(e);
                    console.log(pmp);
                    self.dataBind(pmp);
                }
            });
            tab = tabs[0].addTab({ id: 'tabPumpRelays', text: 'Relays' });
            console.log(type);
            tabs[0].showTab('tabPumpRelays', type.maxRelays > 0);
            if (!(type.maxCircuits > 0)) tabs[0].selectTabById('tabPumpRelays');
            if (!(type.maxCircuits > 0) && !(type.maxRelays > 0)) tabs.hide();
            if (type.maxRelays > 0) {
                // Add us in some relay entries.  There will be one entry for each relay.
                var pnlRelays = $('<div class="cfgPump-pnlRelays"></div>').appendTo(tab).css({ paddingLeft: '.25rem' });
                var hdr = $('<div></div>').appendTo(pnlRelays);
                $('<span></span>').appendTo(hdr).css({ width: '7rem', display:'inline-block' }).text('Relay');
                $('<span></span>').appendTo(hdr).css({ width: '10.25rem', display: 'inline-block', textAlign:'center' }).text('Connection');
                $('<span></span>').appendTo(hdr).css({ width: '10.25rem', display: 'inline-block', textAlign: 'center' }).text('Device');
                $('<hr></hr>').appendTo(pnlRelays).css({ margin: '3px' });
                for (var i = 0; i < type.maxRelays; i++) {
                    var l = $('<div></div>').appendTo(pnlRelays).addClass('pmprelay-line').attr('data-relayid', i + 1);
                    //if (i !== 0) $('<hr></hr>').appendTo(l).css({ margin: '3px' });
                    $('<input type="hidden"></input>').appendTo(l).attr('data-datatype', 'int').attr('data-bind', `relays[${i}].id`).val(i + 1);
                    var relayName = `Program #${i + 1}`;
                    if (type.maxRelays === 1) relayName = 'Pump';
                    else if (type.maxRelays === 2) relayName = i === 0 ? 'Low Speed' : 'High Speed';
                    $('<span></span>').appendTo(l).text(relayName).css({ display: 'inline-block', width: '7rem' });
                    $('<div></div>').appendTo(l).REMBinding({ binding: `relays[${i}]`, servers: o.servers, horizontal: true, showLabel: false }).css({ marginLeft: '.25rem', display: 'inline-block' });
                }
            }
            tabs[0].showTab('tabPumpRelays', type.maxRelays > 0);
            tabs[0].showTab('tabPumpCircuits', type.maxCircuits > 0);
            if (type.maxCircuits > 0) tabs[0].selectTabById('tabPumpCircuits');
            else if (type.maxRelays > 0) tabs[0].selectTabById('tabPumpRelays');
            else tabs[0].selectTabById('tabPumpCircuits');
        },
        addCircuit: function (type, circ) {
            var self = this, o = self.options, el = self.element;
            var clist = el.find('div.picCircuitsList-list:first');
            var circuits = clist.find('div.picCircuitOption');
            var line = $('<div class="picCircuitOption"></div>').appendTo(clist);
            var binding = 'circuits[' + circuits.length + '].';
            var units = o.pumpUnits.find(elem => elem.val === circ.units);
            if (typeof units === 'undefined') units = typeof type.minSpeed !== 'undefined' ? o.pumpUnits.find(elem => elem.name === 'rpm') : o.pumpUnits.find(elem => elem.name === 'gpm');
            if (typeof units === 'undefined') units = o.pumpUnits[0];
            var unitsSupported = [];
            if (typeof type.maxCircuits !== 'undefined' && type.maxCircuits) {
                // If we have changed the pump type the units for the circuit may no longer be supported.  Make sure we put a valid value in.  We only want to do this
                // if the user is changing to another type that supports circuits.
                if (typeof type.maxSpeed !== 'undefined') unitsSupported.push('rpm');
                if (typeof type.maxFlow !== 'undefined') unitsSupported.push('gpm');
                var u = unitsSupported.find(elem => elem === units.name);
                if (typeof u === 'undefined' && unitsSupported.length > 0) {
                    if (typeof type.maxSpeed !== 'undefined') {
                        units = o.pumpUnits.find(elem => elem.name === 'rpm');
                        circ.units = units.val;
                        circ.speed = type.maxSpeed;
                    }
                    else {
                        units = o.pumpUnits.find(elem => elem.name === 'gpm');
                        circ.units = units.val;
                        circ.flow = type.maxFlow;
                        console.log('setting to flow');
                    }
                }
            }

            var hasMultiUnits = unitsSupported.length > 1;
            var unitsType = units.name === 'rpm' ? 'Speed' : 'Flow';
            var step = units.name === 'rpm' ? 10 : 1;

            $('<div></div>').appendTo(line).pickList({
                required: true,
                labelText: 'Circuit', binding: binding + 'circuit', value: circ.circuit,
                columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                style: {marginLeft: '.25rem'},
                items: o.circuits, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem', display: 'none' } }
            });
            if (typeof type.maxFlow !== 'undefined' || typeof type.maxSpeed !== 'undefined') {
                var val = typeof circ[unitsType.toLocaleLowerCase()] !== 'undefined' ? circ[unitsType.toLowerCase()] : type['max' + unitsType];
                $('<div></div>').appendTo(line).valueSpinner({
                    labelText: unitsType,
                    binding: binding + unitsType.toLowerCase(), min: type['min' + unitsType], max: type['max' + unitsType], step: step,
                    units: hasMultiUnits ? '' : units.name,
                    value: val,
                    style: { marginLeft: '.25rem' },
                    inputAttrs: { maxlength: 5 },
                    labelAttrs: { style: { marginLeft: '.25rem', marginRight: '.25rem', display: 'none' } },
                    canEdit: true
                });
            }
            else if (type.maxRelays > 0) {
                $('<div></div>').appendTo(line).valueSpinner({
                    labelText: unitsType,
                    binding: binding + 'relay', min: 1, max: type.maxRelays, step: 1,
                    value: circ.relay,
                    style: { marginLeft: '.25rem' },
                    inputAttrs: { maxlength: 5 },
                    labelAttrs: { style: { marginLeft: '.25rem', marginRight: '.25rem', display: 'none' } }
                });

            }
            else
                $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', binding + unitsType.toLowerCase()).val(units.val).appendTo(line);
            if (hasMultiUnits) {
                $('<div></div>').appendTo(line).pickList({
                    required: true,
                    bindColumn: 0, displayColumn:1,
                    labelText: 'Units', binding: binding + 'units', value: circ.units,
                    columns: [{ binding: 'val', hidden:true, text: 'value', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Units', style: { whiteSpace: 'nowrap' } }],
                    style: { marginLeft: '.25rem' },
                    items: o.pumpUnits, inputAttrs: { style: { width: '2.5rem' } }, labelAttrs: { style: { marginLeft: '.25rem', display: 'none' } }
                }).appendTo(line);
            }
            else
                $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', binding + 'units').val(units.val).appendTo(line);
            $('<i class="fas fa-trash picRemoveOption" style="margin-left:.25rem"></i>').appendTo(line);
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var type = o.pumpTypes.find(elem => elem.val === obj.type);
            var cols = acc[0].columns();
            self._resetPumpPanel(type);
            console.log(o);
            var circuits = '';
            if (typeof obj.circuits !== 'undefined') {
                for (var i = 0; i < obj.circuits.length; i++) {
                    if (i > 0) circuits += ', ';
                    var c = o.circuits.find(elem => elem.id === obj.circuits[i].circuit);
                    if (typeof c !== 'undefined') circuits += c.name;
                    self.addCircuit(type, obj.circuits[i]);
                }
            }
            var ddAddr = el.find('div.picPickList[data-bind$=address]');
            var ddBody = el.find('div.picPickList[data-bind$=body]');
            var ddModel = el.find('div.picPickList[data-bind$=model]');
            var models = o.models[type.name];
            if (typeof type.equipmentMaster !== 'undefined') obj.master = type.equipmentMaster;
            if (typeof models === 'undefined' || models.length <= 1) {
                ddModel.hide();
                ddModel[0].items([]);
                ddModel[0].required(false);
            }
            else {
                ddModel[0].items(models);
                ddModel.show();
                ddModel[0].required(true);
                if (typeof obj.model === 'undefined') obj.model = 0;
            }
            cols[0].elText().text(obj.name);
            if (typeof type !== 'undefined') {
                cols[1].elText().text(type.desc);
                ddAddr[0].required(type.hasAddress);
                if (type.hasAddress) ddAddr.show();
                else ddAddr.hide();
                ddBody[0].required(type.hasBody);
                if (type.hasBody) {
                    ddBody.show();
                    ddBody[0].required(true);
                }
                else {
                    ddBody.hide();
                    ddBody[0].required(false);
                }
            }
            else {
                cols[1].elText().text('');
            }
            cols[2].elText().text(circuits);
            var clist = el.find('div.cfgPump-pnlCircuits:first');
            if (type.maxCircuits > 0) clist.show();
            else clist.hide();
            if (typeof obj.relays !== 'undefined') {
                for (var k = 0; k < obj.relays.length; k++) {
                    // Bind the relay to the line.
                    let r = obj.relays[k];
                    let l = el.find(`div.pmprelay-line[data-relayid=${k + 1}]`);

                    l.find('div[data-bind$=connectionId]').each(function () { this.val(r.connectionId); });
                    l.find('div[data-bind$=deviceBinding]').each(function () { this.val(r.deviceBinding); });
                }
            }
            dataBinder.bind(el, obj);
        }
    });
})(jQuery); // Pump Panel
