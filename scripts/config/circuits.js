(function ($) {
    $.widget('pic.configAuxCircuits', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgAuxCircuits');
            $.getApiService('/config/options/circuits', null, `Loading Options...`, function (opts, status, xhr) {
                for (var i = 0; i < opts.circuits.length; i++) {
                    $('<div></div>').appendTo(el).pnlAuxCircuitConfig({ equipmentNames: opts.equipmentNames, functions: opts.functions, servers: opts.circuits[i].master === 1 ? opts.servers : [] })[0].dataBind(opts.circuits[i]);
                }
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                var btnAdd = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Add Circuit', icon: '<i class="fas fa-plus" ></i>' });
                btnAdd.on('click', function (e) {
                    var newId = el.find('div.cfgAuxCircuit input[data-bind=id]').length + 1;
                    var pnl = $('<div></div>').insertBefore(btnPnl).pnlAuxCircuitConfig({ equipmentNames: [], functions: opts.functions, servers: opts.servers });
                    pnl[0].dataBind({ id: -1, eggTimer: 720, name: 'Circuit ' + (newId), type: 0, showInFeatures: true, master: 1 });
                    pnl.find('div.picAccordian:first')[0].expanded(true);
                });

            });
        }
    });
})(jQuery); // Aux Circuits Tab
(function ($) {
    $.widget('pic.configFeatures', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgFeatures');
            $.getApiService('/config/options/features', null, function (opts, status, xhr) {
                console.log(opts);
                for (var i = 0; i < opts.features.length; i++) {
                    $('<div></div>').appendTo(el).pnlFeatureConfig({ equipmentNames: opts.equipmentNames, functions: opts.functions })[0].dataBind(opts.features[i]);
                }
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                var btnAdd = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Add Feature', icon: '<i class="fas fa-plus" ></i>' });
                btnAdd.on('click', function (e) {
                    var features = el.find('div.picConfigCategory.cfgFeatures');
                    var newId = el.find('div.cfgFeature input[data-bind=id]').length + 1;
                    var pnl = $('<div></div>').insertBefore(btnPnl).pnlFeatureConfig({ equipmentNames: opts.equipmentNames, functions: opts.functions });
                    pnl[0].dataBind({ id: -1, eggTimer: 720, name: 'Feature ' + (newId), type: 0, showInFeatures: true });
                    pnl.find('div.picAccordian:first')[0].expanded(true);
                });
            });
        }
    });
})(jQuery); // Features Tab
(function ($) {
    $.widget('pic.configCircuitGroups', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgCircuitGroups');
            $.getApiService('/config/options/circuitGroups', null, function (opts, status, xhr) {
                console.log(opts);
                for (var i = 0; i < opts.circuitGroups.length; i++) {
                    $('<div></div>').appendTo(el).pnlCircuitGroupConfig({ circuits: opts.circuits, equipmentNames: opts.equipmentNames, maxCircuitGroups: opts.maxCircuitGroups, circuitStates: opts.circuitStates })[0].dataBind(opts.circuitGroups[i]);
                }
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                var btnAdd = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Add Group', icon: '<i class="fas fa-plus" ></i>' });
                btnAdd.on('click', function (e) {
                    var groups = el.find('div.picConfigCategory.cfgCircuitGroup');
                    //$(this).addClass('disabled');
                    //$(this).find('i').addClass('burst-animated');
                    var pnl = $('<div></div>').insertBefore(btnPnl).pnlCircuitGroupConfig({ circuits: opts.circuits, equipmentNames: opts.equipmentNames, maxCircuitGroups: opts.maxCircuitGroups, circuitStates: opts.circuitStates });
                    pnl[0].dataBind({ id: 0, eggTimer: 720, circuits: [], name: 'Group ' + (groups.length + 1), type: 2 });
                    pnl.find('div.picAccordian:first')[0].expanded(true);
                });
            });
        }
    });
})(jQuery); // Circuit Groups Tab
(function ($) {
    $.widget('pic.configLightGroups', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgLightGroups');
            $.getApiService('/config/options/lightGroups', null, function (opts, status, xhr) {
                console.log(opts);
                for (var i = 0; i < opts.lightGroups.length; i++) {
                    $('<div></div>').appendTo(el).pnlLightGroupConfig({ circuits: opts.circuits, equipmentNames: opts.equipmentNames, maxCircuitGroups: opts.maxCircuitGroups, colors: opts.colors, themes: opts.themes })[0].dataBind(opts.lightGroups[i]);
                }
                // If this is a Touch panel then we cannot add more light groups.
                if (!makeBool($('div.picDashboard').attr('data-hidethemes'))) {
                    var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                    var btnAdd = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Add Group', icon: '<i class="fas fa-plus" ></i>' });
                    btnAdd.on('click', function (e) {
                        var groups = el.find('div.picConfigCategory.cfgLightGroup');
                        //$(this).addClass('disabled');
                        //$(this).find('i').addClass('burst-animated');
                        var pnl = $('<div></div>').insertBefore(btnPnl).pnlLightGroupConfig({ circuits: opts.circuits, equipmentNames: opts.equipmentNames, maxCircuitGroups: opts.maxCircuitGroups, colors: opts.colors, themes: opts.themes });
                        pnl[0].dataBind({ id: 0, eggTimer: 720, circuits: [], name: 'Group ' + (groups.length + 1), type: 1 });
                        pnl.find('div.picAccordian:first')[0].expanded(true);
                    });
                }
            });
        }
    });
})(jQuery); // Light Groups Tab
(function ($) {
    $.widget('pic.configCustomNames', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgCustomNames');
            pnl = $('<div></div>').addClass('cfgCustomNames').appendTo(el);
            $.getApiService('/config/options/customNames', null, function (opts, status, xhr) {
                console.log(opts);
                var names = opts.names;
                for (var i = 0; i < opts.maxCustomNames; i++) {
                    var name = opts.customNames.find(elem => elem.id === i);
                    if (typeof name === 'undefined') name = { id: i, name: ''};
                    var line = $('<div></div>').appendTo(pnl).addClass('cfgCustomName');
                    line.attr('data-id', i);
                    $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
                    $('<div></div>').appendTo(line).inputField({ labelText: 'Custom Name #' + name.id, binding: 'name', inputAttrs: { maxlength: 11, style: { width: '10rem' } }, labelAttrs: { style: { marginRight: '.25rem', width:'9.5rem' } } });
                    dataBinder.bind(line, name);
                }
            });
           
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
            var btnSave = $('<div id="btnSaveNames"></div>').appendTo(btnPnl).actionButton({ text: 'Save Custom Names', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var names = [];
                el.find('div.cfgCustomName').each(function () { names.push(dataBinder.fromElement($(this))); });
                $.putApiService('/config/customNames', names, 'Saving Custom Names...', function (data, status, xhr) {
                    console.log({ data: data, status: status, xhr: xhr });

                });
            });
        },
        dataBind: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.cfgCustomName').each(function () {
            });
        }
    });
})(jQuery); // Custom Names Tab

(function ($) {
    $.widget('pic.pnlAuxCircuitConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgAuxCircuit');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-code-branch', style: { width: '10.5rem' } },
                { binding: 'freeze', glyph: '', style: { width: '1.5rem' } },
                { binding: 'function', style: { width: '8rem' } },
                { binding: 'feature', style: { width: '8rem' } },
                { binding: 'eggTimer', style: { width: '5.7rem' } }]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'master').appendTo(line);
            if (o.equipmentNames.length > 0) {
                $('<div></div>').appendTo(line).pickList({
                    required: true,
                    bindColumn: 0, displayColumn: 1, labelText: 'Name', binding: binding + 'nameId',
                    columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Defined Name', style: { whiteSpace: 'nowrap' } }],
                    items: o.equipmentNames, inputAttrs: { style: { width: "7rem" } }
                }).appendTo(line);
            }
            else
                $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { } } });
            $('<div></div>').appendTo(line).pickList({ required: true,
                bindColumn: 0, displayColumn: 2, labelText: 'Type', binding: binding + 'type',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Circuit Function', style: { whiteSpace: 'nowrap' } }],
                items: o.functions, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            }).appendTo(line);

            $('<div></div>').appendTo(line).checkbox({ labelText: 'Show as Feature', binding: binding + 'showInFeatures' });
            line = $('<div style="text-align:right"></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Freeze Protection', binding: binding + 'freeze' });

            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Egg Timer', binding: binding + 'eggTimerHours', min: 0, max: 24, step: 1, units: 'hrs', inputAttrs: { maxlength: 3 }, labelAttrs: { style: { marginLeft: '1rem', marginRight: '.25rem' } } });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: '', binding: binding + 'eggTimerMinutes', min: 0, max: 59, step: 1, units: 'mins', inputAttrs: { maxlength: 3 }, labelAttrs: { style: { marginLeft: '.25rem' } } });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Don\'t Stop', binding: binding + 'dontStop', style: { marginLeft: '.25rem' } }).on('changed', function (evt) {
                var dontStop = evt.newVal;
                el.find('div[data-bind=eggTimerHours]').css({ visibility: dontStop ? 'hidden' : '' });
                el.find('div[data-bind=eggTimerMinutes]').css({ visibility: dontStop ? 'hidden' : '' });
            });

            var bindpnl = $('<div></div>').addClass('pnlDeviceBinding').REMBinding({ servers: o.servers }).appendTo(pnl).hide();
            $('<hr></hr>').prependTo(bindpnl);


            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Circuit', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                //$(this).addClass('disabled');
                //$(this).find('i').addClass('burst-animated');
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                v.eggTimer = (v.eggTimerHours * 60) + v.eggTimerMinutes;
                delete v.eggTimerHours;
                delete v.eggTimerMinutes;
                console.log(v);
                $.putApiService('/config/circuit', v, 'Saving Circuit...', function (c, status, xhr) {
                    self.dataBind(c);
                });

                // Send this off to the server.
                //$(this).find('span.picButtonText').text('Loading Config...');
                //$.putApiService('/app/config/reload', function (data, status, xhr) {
            });
            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({id:'btnDeleteCircuit', text: 'Delete Circuit', icon: '<i class="fas fa-trash"></i>' }).hide();
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteCircuit', {
                    message: 'Are you sure you want to delete Circuit ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Circuit',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgAuxCircuit:first').remove();
                            else {
                                $.deleteApiService('/config/circuit', v, 'Deleting Circuit...', function (c, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgAuxCircuit:first').remove();
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
            var func = o.functions.find(elem => elem.val === obj.type);
            if (typeof func === 'undefined') func = o.functions.find(elem => elem.name === 'generic');
            if (typeof func === 'undefined') func = { val: 0, desc: 'unknown' };
            var eggTimer = obj.eggTimer || 720;
            var hrs = Math.floor(eggTimer / 60);
            var mins = eggTimer - (hrs * 60);
            cols[0].elText().text(obj.name);
            cols[0].elGlyph().attr('class', obj.master === 1 ? 'fas fa-cube' : 'fas fa-code-branch');
            cols[1].elGlyph().attr('class', obj.freeze ? 'fas fa-icicles' : '');
            cols[2].elText().text(func.desc);
            cols[3].elText().text(obj.showInFeatures ? 'Feature' : '');
            cols[4].elText().text(obj.dontStop ? 'Don\'t Stop' : hrs + 'h ' + mins + 'm');
            el.find('div[data-bind=eggTimerHours]').css({ visibility: obj.dontStop ? 'hidden' : '' });
            el.find('div[data-bind=eggTimerMinutes]').css({ visibility: obj.dontStop ? 'hidden' : '' });
            if (obj.id === 1 || obj.id === 6) el.find('div.picPickList[data-bind=type]').addClass('disabled');
            dataBinder.bind(el, $.extend({}, obj, { eggTimerHours: hrs, eggTimerMinutes: mins }));
            if (obj.master === 1 && obj.id !== 1 && obj.id !== 6) { // Can only delete and set address on REM circuits.
                el.find('div#btnDeleteCircuit').show();
                el.find('div.pnlDeviceBinding').show();
            }
            else {
                el.find('div#btnDeleteCircuit').hide();
                el.find('div.pnlDeviceBinding').hide();
            }
        }
    });
})(jQuery); // Aux Circuit Panel
(function ($) {
    $.widget('pic.pnlFeatureConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgFeature');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-code-branch', style: { width: '10.5rem' } },
                { binding: 'freeze', glyph: '', style: { width: '1.5rem' } },
                { binding: 'function', style: { width: '8rem' } },
                { binding: 'feature', style: { width: '8rem' } },
                    { binding: 'eggTimer', style: { width: '5.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' } }]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            if (o.equipmentNames.length > 0) {
                $('<div></div>').appendTo(line).pickList({ required: true,
                    bindColumn: 0, displayColumn: 1, labelText: 'Name', binding: binding + 'nameId',
                    columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Defined Name', style: { whiteSpace: 'nowrap' } }],
                    items: o.equipmentNames, inputAttrs: { style: { width: "7rem" } }
                }).appendTo(line);
            }
            else
                $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: {} } });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 2, labelText: 'Type', binding: binding + 'type',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Feature Function', style: { whiteSpace: 'nowrap' } }],
                items: o.functions, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });

            $('<div></div>').appendTo(line).checkbox({ labelText: 'Show as Feature', binding: binding + 'showInFeatures' });
            line = $('<div style="text-align:right"></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Freeze Protection', binding: binding + 'freeze' });

            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Egg Timer', binding: binding + 'eggTimerHours', min: 0, max: 24, step: 1, units: 'hrs', inputAttrs: { maxlength: 3 }, labelAttrs: { style: { marginLeft: '1rem', marginRight: '.25rem' } } });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: '', binding: binding + 'eggTimerMinutes', min: 0, max: 59, step: 1, units: 'mins', inputAttrs: { maxlength: 3 }, labelAttrs: { style: { marginLeft: '.25rem' } } });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Don\'t Stop', binding: binding + 'dontStop', style: { marginLeft: '.25rem' } }).on('changed', function (evt) {
                var dontStop = evt.newVal;
                el.find('div[data-bind=eggTimerHours]').css({ visibility: dontStop ? 'hidden' : '' });
                el.find('div[data-bind=eggTimerMinutes]').css({ visibility: dontStop ? 'hidden' : '' });
            });
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Feature', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                //$(this).addClass('disabled');
                //$(this).find('i').addClass('burst-animated');
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                v.eggTimer = (v.eggTimerHours * 60) + v.eggTimerMinutes;
                delete v.eggTimerHours;
                delete v.eggTimerMinutes;
                console.log(v);
                if (dataBinder.checkRequired(p)) {
                    $.putApiService('/config/feature', v, 'Saving Feature...', function (c, status, xhr) {
                        self.dataBind(c);
                    });
                }
            });
            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Delete Feature', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteFeature', {
                    message: 'Are you sure you want to delete feature ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Feature',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgFeature:first').remove();
                            else {
                                $.deleteApiService('/config/feature', v, 'Deleting Feature...', function (c, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgFeature:first').remove();
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
            var func = o.functions.find(elem => elem.val === obj.type);
            if (typeof func === 'undefined') func = o.functions.find(elem => elem.name === 'generic');
            if (typeof func === 'undefined') func = { val: -1, desc: 'unknown' };
            var eggTimer = obj.eggTimer || 720;
            var hrs = Math.floor(eggTimer / 60);
            var mins = eggTimer - (hrs * 60);
            cols[0].elText().text(obj.name);
            cols[1].elGlyph().attr('class', obj.freeze ? 'fas fa-icicles' : '');
            cols[2].elText().text(func.desc);
            cols[3].elText().text(obj.showInFeatures ? 'Feature' : '');
            cols[4].elText().text(obj.dontStop ? 'Don\'t Stop' : hrs + 'h ' + mins + 'm');
            el.find('div[data-bind=eggTimerHours]').css({ visibility: obj.dontStop ? 'hidden' : '' });
            el.find('div[data-bind=eggTimerMinutes]').css({ visibility: obj.dontStop ? 'hidden' : '' });
            dataBinder.bind(el, $.extend({}, obj, { eggTimerHours: hrs, eggTimerMinutes: mins }));
        }
    });
})(jQuery); // Feature Panel
(function ($) {
    $.widget('pic.pnlCircuitGroupConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgCircuitGroup');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-sitemap', style: { width: '10.5rem' } },
                    { binding: 'circuits', style: { width: '15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', textAlign:'center' } },
                    { binding: 'eggTimer', style: { width: '5.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' } }]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'type').appendTo(line);
            if (o.equipmentNames.length > 0) {
                $('<div></div>').appendTo(line).pickList({ required: true,
                    bindColumn: 0, displayColumn: 1, labelText: 'Name', binding: binding + 'nameId',
                    columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Custom Name', style: { whiteSpace: 'nowrap' } }],
                    items: o.equipmentNames, inputAttrs: { style: { width: "7rem" } }
                }).appendTo(line);
            }
            else
                $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: {} } });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Show as Feature', binding: binding + 'showInFeatures', value: true });

            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Egg Timer', binding: binding + 'eggTimerHours', min: 0, max: 24, step: 1, units: 'hrs', inputAttrs: { maxlength: 3 }, labelAttrs: { style: { marginLeft: '1rem', marginRight: '.25rem' } } });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: '', binding: binding + 'eggTimerMinutes', min: 0, max: 59, step: 1, units: 'mins', inputAttrs: { maxlength: 3 }, labelAttrs: { style: { marginLeft: '.25rem' } } });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Don\'t Stop', binding: binding + 'dontStop', style: { marginLeft: '.25rem' } }).on('changed', function (evt) {
                var dontStop = evt.newVal;
                el.find('div[data-bind=eggTimerHours]').css({ visibility: dontStop ? 'hidden' : '' });
                el.find('div[data-bind=eggTimerMinutes]').css({ visibility: dontStop ? 'hidden' : '' });
            });
            line = $('<div><hr></hr></div>').appendTo(pnl);

            var pnlCircuits = $('<div class="cfgCircuitGroup-pnlCircuits" style="text-align:right;"></div>').appendTo(pnl);
            line = $('<div class="picCircuitsList-btnPanel"></div>').appendTo(pnlCircuits);
            $('<div><span>Group Circuits</span></div>').appendTo(line);
            var btnCPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(line);
            var btnAddCircuit = $('<div></div>').appendTo(btnCPnl).actionButton({ text: 'Add Circuit', icon: '<i class="fas fa-plus" ></i>' });
            btnAddCircuit.on('click', function (e) {
                var desiredState = o.circuitStates.find(elem => elem.name === 'on');
                self.addCircuit({ circuit: -1, desiredState: desiredState.val || 1 });
            });
            $('<div class="picCircuitsList-list" style="min-width:14rem;"></div>').appendTo(pnlCircuits);


            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Group', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                //$(this).addClass('disabled');
                //$(this).find('i').addClass('burst-animated');
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                v.eggTimer = (v.eggTimerHours * 60) + v.eggTimerMinutes;
                delete v.eggTimerHours;
                delete v.eggTimerMinutes;
                console.log(v);
                // Check to make sure we haven't declared the same circuit more than once.
                var hash = {};
                var isValid = true;
                if (typeof v.circuits === 'undefined') {
                    isValid = false;
                    $('<div></div>').appendTo(el.find('div.picCircuitsList-btnPanel:first')).fieldTip({ message: 'No circuits<br></br>have been created.' });
                }
                else {
                    for (var i = 0; i < v.circuits.length; i++) {
                        var c = v.circuits[i];
                        var dd = el.find('div.picCircuitOption:nth-child(' + (i + 1) + ') > div.picPickList[data-bind$=circuit]');
                        if (c.circuit === -1) {
                            $('<div></div>').appendTo(dd).fieldTip({ message: 'Please select a circuit' });
                            isValid = false;
                        }
                        else {
                            if (typeof hash['c' + c.circuit] !== 'undefined') {
                                $('<div></div>').appendTo(dd).fieldTip({ message: 'Group circuits<br></br>must be unique' });
                                isValid = false;
                            }
                            hash['c' + c.circuit] = c.circuit;
                        }
                    }
                }

                if (dataBinder.checkRequired(el) && isValid) {
                    $.putApiService('/config/circuitGroup', v, 'Saving Circuit Group...', function (data, status, xhr) {
                        self.dataBind(data);
                    });
                }
            });
            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Delete Group', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteFeature', {
                    message: 'Are you sure you want to delete group ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Circuit Group',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            console.log(v);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgCircuitGroup:first').remove();
                            else {
                                $.deleteApiService('/config/circuitGroup', v, 'Deleting Circuit Group...', function (data, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgCircuitGroup:first').remove();
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
        addCircuit: function (circ) {
            var self = this, o = self.options, el = self.element;
            var clist = el.find('div.picCircuitsList-list:first');
            var circuits = clist.find('div.picCircuitOption');
            var line = $('<div class="picCircuitOption"></div>').appendTo(clist);
            var binding = 'circuits[' + circuits.length + '].';
            $('<div></div>').appendTo(line).pickList({ required: true,
                labelText: 'Circuit', binding: binding + 'circuit', value: circ.circuit,
                columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                items: o.circuits, inputAttrs: { style: { width: '9rem', marginLeft:'.25rem' } }, labelAttrs: { style: { marginRight: '.25rem', display: 'none' } }
            }).appendTo(line);
            $('<div></div>').appendTo(line).buttonOptions({ binding: binding + 'desiredState',
                items: o.circuitStates, value:circ.desiredState,
                btnAttrs: { style: { width: '4rem', textAlign: 'center' } }
            }).css({ marginLeft: '.25rem'}).appendTo(line);
            $('<i class="fas fa-trash picRemoveOption"></i>').appendTo(line);
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            var eggTimer = obj.eggTimer || 12;
            var hrs = Math.floor(eggTimer / 60);
            var mins = eggTimer - (hrs * 60);
            var clist = el.find('div.picCircuitsList-list:first');
            cols[0].elText().text(obj.name);
            var circuits = '';
            el.find('div.picCircuitsList-list:first').empty();
            for (var i = 0; i < obj.circuits.length; i++) {
                if (i > 0) circuits += ', ';
                var c = o.circuits.find(elem => elem.id === obj.circuits[i].circuit);
                if (typeof c !== 'undefined') {
                    circuits += c.name;
                    self.addCircuit(obj.circuits[i]);
                }
            }
            clist.on('click', 'i.picRemoveOption', function (e) {
                $(e.target).parents('div.picCircuitOption:first').remove();
                var rgx = /\[[0-9]\]/g;
                el.find('div.picCircuitsList-list:first > div.picCircuitOption').each(function (ndx) {
                    $(this).find('*[data-bind^="circuits["]').each(function () {
                        var bind = $(this).attr('data-bind');
                        console.log(bind);
                        $(this).attr('data-bind', bind.replace(rgx, '[' + ndx + ']'));
                    });
                });
            });
            cols[1].elText().text(circuits);
            cols[2].elText().text(obj.dontStop ? 'Don\'t Stop' : hrs + 'h ' + mins + 'm');
            el.find('div[data-bind=eggTimerHours]').css({ visibility: obj.dontStop ? 'hidden' : '' });
            el.find('div[data-bind=eggTimerMinutes]').css({ visibility: obj.dontStop ? 'hidden' : '' });
            dataBinder.bind(el, $.extend({}, obj, { eggTimerHours: hrs, eggTimerMinutes: mins }));
            // Bind all the circuits.
        }
    });
})(jQuery); // Circuit Group Panel
(function ($) {
    $.widget('pic.pnlLightGroupConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgLightGroup');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-sitemap', style: { width: '10.5rem' } },
                { binding: 'circuits', style: { width: '15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', textAlign: 'center' } },
                    { binding: 'eggTimer', style: { width: '5.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle'} }]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'type').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { display: '' } } });
            if (o.equipmentNames.length > 0) {
                line.hide();
                line = $('<div></div>');
            }
            else {
                $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Egg Timer', binding: binding + 'eggTimerHours', min: 0, max: 24, step: 1, units: 'hrs', inputAttrs: { maxlength: 3 }, labelAttrs: { style: { marginLeft: '1rem', marginRight: '.25rem' } } });
                $('<div></div>').appendTo(line).valueSpinner({ labelText: '', binding: binding + 'eggTimerMinutes', min: 0, max: 59, step: 1, units: 'mins', inputAttrs: { maxlength: 3 }, labelAttrs: { style: { marginLeft: '.25rem' } } });
                $('<div></div>').appendTo(line).checkbox({ labelText: 'Don\'t Stop', binding: binding + 'dontStop', style: { marginLeft: '.25rem' } }).on('changed', function (evt) {
                    var dontStop = evt.newVal;
                    el.find('div[data-bind=eggTimerHours]').css({ visibility: dontStop ? 'hidden' : '' });
                    el.find('div[data-bind=eggTimerMinutes]').css({ visibility: dontStop ? 'hidden' : '' });
                });
                line = $('<div><hr></hr></div>').appendTo(pnl);
            }
            var pnlCircuits = $('<div class="cfgLightGroup-pnlCircuits" style="text-align:right;"></div>').appendTo(pnl);
            line = $('<div class="picCircuitsList-btnPanel"></div>').appendTo(pnlCircuits);
            $('<div><span>Group Circuits</span></div>').appendTo(line);
            var btnCPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(line);
            var btnAddCircuit = $('<div></div>').appendTo(btnCPnl).actionButton({ text: 'Add Circuit', icon: '<i class="fas fa-plus" ></i>' });
            btnAddCircuit.on('click', function (e) {
                self.addCircuit({ circuit: -1, color: 0, swimDelay:0 });
            });
            $('<div class="picCircuitsList-list" style="min-width:25rem;"></div>').appendTo(pnlCircuits).sortable({
                axis: 'y', containment: 'div.cfgLightGroup-pnlCircuits', cursor: 'move', tolerance: 'intersect',
                update: function (evt, ui) {
                    var ndx = 0;
                    $(evt.target).find('div.picCircuitOption').each(function () {
                        console.log('Found option');
                        $(this).find('*[data-bind^=circuits]').each(function () {
                            var fld = $(this);
                            var b = fld.attr('data-bind');
                            fld.attr('data-bind', b.replace(/circuits\[\d+\]/, 'circuits[' + ndx + ']'));
                        });
                        ndx++;
                    });
                }
            });

            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Group', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                //$(this).addClass('disabled');
                //$(this).find('i').addClass('burst-animated');
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                if (v.type !== 3) {
                    v.eggTimer = (v.eggTimerHours * 60) + v.eggTimerMinutes;
                    delete v.eggTimerHours;
                    delete v.eggTimerMinutes;
                }
                if (typeof v.circuits === 'undefined') {
                    isValid = false;
                    $('<div></div>').appendTo(el.find('div.picCircuitsList-btnPanel:first')).fieldTip({ message: 'No circuits<br></br>have been created.' });
                }
                else {
                    console.log(v);
                    var hash = {};
                    for (var i = 0; i < v.circuits.length; i++) {
                        var c = v.circuits[i];
                        var dd = el.find('div.picCircuitOption:nth-child(' + (i + 1) + ') > div.picPickList[data-bind$=circuit]');
                        if (c.circuit === -1)
                            $('<div></div>').appendTo(dd).fieldTip({ message: 'Please select a circuit' });
                        else {
                            if (typeof hash['c' + c.circuit] !== 'undefined') {
                                $('<div></div>').appendTo(dd).fieldTip({ message: 'Group circuits<br></br>must be unique' });
                            }
                            hash['c' + c.circuit] = c.circuit;
                        }
                        c.position = i + 1;
                    }
                    if (dataBinder.checkRequired(el)) {
                        // Send this off to the server.
                        $.putApiService('/config/lightGroup', v, 'Saving Light Group...', function (data, status, xhr) {
                            console.log({ data: data, status: status, xhr: xhr });
                            self.dataBind(data);
                        });
                    }
                }
            });
            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Delete Group', icon: '<i class="fas fa-trash"></i>' }).addClass('deleteGroup').hide();
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteFeature', {
                    message: 'Are you sure you want to delete light group ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Light Group',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            console.log(v);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgCircuitGroup:first').remove();
                            else {
                                $.deleteApiService('/config/lightGroup', v, 'Deleting Light Group...', function (data, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgLightGroup:first').remove();
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
        _validate: function () {
            var self = this, o = self.options, el = self.element;
            var clist = el.find('div.picCircuitsList-list:first');
            // Make sure all circuits are unique.
            var circuits = clist.find('div.picCircuitOption').each(function () {
            });

        },
        addCircuit: function (circ) {
            var self = this, o = self.options, el = self.element;
            var clist = el.find('div.picCircuitsList-list:first');
            var circuits = clist.find('div.picCircuitOption');
            var line = $('<div class="picCircuitOption"></div>').appendTo(clist);
            var color = o.colors.find(elem => elem.val === circ.color);
            if (typeof color === 'undefined') color = o.colors.find(elem => elem.name === 'white');
            if(typeof color === 'undefined') color = { val: 0, name: 'white', desc: 'white' };
            var binding = 'circuits[' + circuits.length + '].';
            $('<i class="fas fa-map-pin" style="color:green;padding-left:.5rem;padding-right:.5rem;cursor:pointer;"></i>').appendTo(line).attr('title', 'Drag to change the light position');
            $('<div></div>').appendTo(line).pickList({ required: true,
                labelText: 'Circuit', binding: binding + 'circuit', value: circ.circuit,
                columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                items: o.circuits, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem', display:'none' } }
            });
            $('<div></div>').appendTo(line).colorPicker({ required: true,
                value: color.val, colors: o.colors, binding: binding + 'color',
                inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft: '.15rem', marginRight: '.15rem' } }
            });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Delay', binding: binding + 'swimDelay', min: 0, max: 60, step: 1, units: 'sec', value: circ.swimDelay, inputAttrs: { maxlength: 3 }, labelAttrs: { style: { marginLeft: '.25rem', marginRight: '.25rem' } } });
            $('<i class="fas fa-trash picRemoveOption" style="margin-left:.25rem"></i>').appendTo(line);
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            var eggTimer = obj.eggTimer || 720;
            var hrs = Math.floor(eggTimer / 60);
            var mins = eggTimer - (hrs * 60);
            var clist = el.find('div.picCircuitsList-list:first');
            clist.empty();
            cols[0].elText().text(obj.name);
            var circuits = '';
            for (var i = 0; i < obj.circuits.length; i++) {
                if (i > 0) circuits += ', ';
                var c = o.circuits.find(elem => elem.id === obj.circuits[i].circuit);
                circuits += typeof c !== 'undefined' ? c.name : 'unknown';
                self.addCircuit(obj.circuits[i]);
            }
            clist.on('click', 'i.picRemoveOption', function (e) {
                $(e.target).parents('div.picCircuitOption:first').remove();
                var rgx = /\[[0-9]\]/g;
                el.find('div.picCircuitsList-list:first > div.picCircuitOption').each(function (ndx) {
                    $(this).find('*[data-bind^="circuits["]').each(function () {
                        var bind = $(this).attr('data-bind');
                        console.log(bind);
                        $(this).attr('data-bind', bind.replace(rgx, '[' + ndx + ']'));
                    });
                });
            });
            cols[1].elText().text(circuits);
            var type = obj.type || 1;
            if (type === 3) {
                cols[2].elText('');
                dataBinder.bind(el, $.extend({}, obj));
            }
            else {
                cols[2].elText().text(obj.dontStop ? 'Don\'t Stop' : hrs + 'h ' + mins + 'm');
                el.find('div[data-bind=eggTimerHours]').css({ visibility: obj.dontStop ? 'hidden' : '' });
                el.find('div[data-bind=eggTimerMinutes]').css({ visibility: obj.dontStop ? 'hidden' : '' });
                dataBinder.bind(el, $.extend({}, obj, { eggTimerHours: hrs, eggTimerMinutes: mins }));
            }
            // Bind all the circuits.
            if (type === 3)
                el.find('div.deleteGroup').hide();
            else
                el.find('div.deleteGroup').show();
        }
    });
})(jQuery); // Light Group Panel
