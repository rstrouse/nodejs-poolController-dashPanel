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
            $.getApiService('/config/options/valves', null, function (opts, status, xhr) {
                console.log(opts);
                var valves = opts.valves;
                for (var i = 0; i < valves.length; i++) {
                    $('<div></div>').appendTo(el).pnlValveConfig({ valveTypes: opts.valveTypes, maxValves: opts.maxValves, circuits: opts.circuits })[0].dataBind(valves[i]);
                }
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
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { marginRight: '.25rem' } } });
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


            var btnPnl = $('<div class="picBtnPanel"></div>').appendTo(pnl);
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
                el.find('div.picBtnPanel').hide();
            }
            else {
                el.find('div.picBtnPanel').show();
                ddCircuit.show()[0].required(true);
                fldName[0].disabled(false);
                if (typeof circuit !== 'undefined')
                    cols[2].elText().text(circuit.name);
                else
                    cols[2].elText().text('');
            }
            if (makeBool(obj.isIntake)) el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-arrow-circle-right').css('color', 'red');
            else if (makeBool(obj.isReturn)) el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-arrow-circle-left').css('color', 'red');
            else el.find('div.picAccordian-titlecol:first > i:first').attr('class', 'fas fa-compass').css('color', '');


            dataBinder.bind(el, obj);
        }
    });
})(jQuery); // Valve Panel
