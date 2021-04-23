(function ($) {
    $.widget('pic.configValves', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgValves');
            $.getApiService('/config/options/valves', null, `Loading Options...`, function (opts, status, xhr) {
                console.log(opts);
                var valves = opts.valves;
                var pnl = $('<div></div>').addClass('pnlValves').appendTo(el);
                for (var i = 0; i < valves.length; i++) {
                    $('<div></div>').appendTo(pnl).pnlValveConfig({ valveTypes: opts.valveTypes, maxValves: opts.maxValves, circuits: opts.circuits, servers: opts.servers })[0].dataBind(valves[i]);
                }
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                $('<div id="btnAddValve"></div>').appendTo(btnPnl).actionButton({ text: 'Add Valve', icon: '<i class="fas fa-plus"></i>' })
                    .on('click', function (e) {
                        var id = 0;
                        el.find('input[data-bind=isVirtual]').each(function () {
                            if ($(this).val()) id++;
                        });
                        var acc = $('<div></div>').appendTo(pnl).pnlValveConfig({ valveTypes: opts.valveTypes, maxValves: opts.maxValves, circuits: opts.circuits, servers: opts.servers });
                        acc[0].dataBind({
                            isIntake: false,
                            isReturn: false,
                            isVirtual: true,
                            isActive: true,
                            master: 1,
                            type: 0,
                            id: -1,
                            name: 'Valve V' + (id + 1),
                            circuit: 256
                        });
                        acc.find('div.picAccordian')[0].expanded(true);
                    });
            });
        }
    });
})(jQuery); // Valves Tab
(function ($) {
    $.widget('pic.pnlValveConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgValve');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-compass', style: { width: '9rem' } }, { binding: 'type', style: { width: '14rem', textAlign: 'center' } }, { binding: 'circuit', style: { width: '8rem' } } ]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<input type="hidden" data-datatype="bool"></input>').attr('data-bind', 'isIntake').appendTo(line);
            $('<input type="hidden" data-datatype="bool"></input>').attr('data-bind', 'isReturn').appendTo(line);
            $('<input type="hidden" data-datatype="bool"></input>').attr('data-bind', 'isVirtual').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { marginLeft: '.25rem', width:'3rem' } } });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 2, labelText: 'Type', binding: binding + 'type',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Valve Type', style: { whiteSpace: 'nowrap' } }],
                items: o.valveTypes, inputAttrs: { style: { width: '7rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Circuit', binding: binding + 'circuit',
                columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                items: o.circuits, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Pin Id', binding: binding + 'pinId', min: 0, max: 100, step: 1, units: '', inputAttrs: { maxlength: 5 }, labelAttrs: { style: { marginLeft: '.25rem', width: '3rem'  } } });
            line = $('<div></div>').appendTo(pnl);
            var bindpnl = $('<div></div>').addClass('pnlDeviceBinding').REMBinding({ servers: o.servers }).appendTo(pnl).hide();
            $('<hr></hr>').prependTo(bindpnl);


            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div id="btnSaveValve"></div>').appendTo(btnPnl).actionButton({ text: 'Save Valve', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                if (dataBinder.checkRequired(p)) {
                    $.putApiService('/config/valve', v, 'Saving Valve: ' + v.name + '...', function (data, status, xhr) {
                        console.log({ data: data, status: status, xhr: xhr });
                        self.dataBind(data);
                    });
                }
            });
            var btnDelete = $('<div id="btnDeleteValve"></div>').appendTo(btnPnl).actionButton({ text: 'Delete Valve', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteValve', {
                    message: 'Are you sure you want to delete Valve ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Valve',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgValve:first').remove();
                            else {
                                console.log('Deleting Valve');
                                $.deleteApiService('/config/valve', v, 'Deleting Valve...', function (c, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgValve:first').remove();
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
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            var type = o.valveTypes.find(elem => elem.val === obj.type);
            var circuit = o.circuits.find(elem => elem.id === obj.circuit);
            cols[0].elText().text(obj.name);
            cols[1].elText().text(type.desc);
            var ddCircuit = el.find('div.picPickList[data-bind$=circuit]');
            var fldName = el.find('div.picInputField[data-bind$=name]');
            if (makeBool(obj.isIntake) || makeBool(obj.isReturn)) {
                ddCircuit.hide()[0].required(false);
                fldName[0].disabled(true);
                cols[2].elText().text('Pool/Spa');
                //el.find('div.picBtnPanel').hide();
            }
            else {
                ddCircuit.show()[0].required(true);
                fldName[0].disabled(false);
                if (typeof circuit !== 'undefined')
                    cols[2].elText().text(circuit.name);
                else
                    cols[2].elText().text('');
            }
            el.find('div.picBtnPanel').show();
            if (obj.master === 1) el.find('div.pnlDeviceBinding').show();
            else el.find('div.pnlDeviceBinding').hide();
            if (makeBool(obj.isIntake)) el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-arrow-circle-right').css('color', 'red');
            else if (makeBool(obj.isReturn)) el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-arrow-circle-left').css('color', 'red');
            else if (makeBool(obj.isVirtual) || obj.master === 1) el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'far fa-compass').css('color', '');
            else el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-compass').css('color', '');
            if (obj.isVirtual || obj.master === 1) {
                el.find('div.picValueSpinner[data-bind=pinId]').show();
                el.find('div.picActionButton#btnDeleteValve').show();
            }
            else {
                el.find('div.picValueSpinner[data-bind=pinId]').hide();
                el.find('div.picActionButton#btnDeleteValve').hide();
            }


            dataBinder.bind(el, obj);
        }
    });
})(jQuery); // Valve Panel
