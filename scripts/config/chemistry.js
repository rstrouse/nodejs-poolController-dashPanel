(function ($) {
    $.widget('pic.configChemistry', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgChemControllers');
            $.getApiService('/config/options/chlorinators', null, function (opts, status, xhr) {
                console.log(opts);
                for (var i = 0; i < opts.chlorinators.length; i++) {
                    $('<div></div>').appendTo(el).pnlChlorinatorConfig(opts)[0].dataBind(opts.chlorinators[i]);
                }
            });
            $.getApiService('/config/options/chemControllers', null, function (opts, status, xhr) {
                console.log(opts);
                for (var i = 0; i < opts.controllers.length; i++) {
                    $('<div></div>').appendTo(el).pnlChemControllerConfig(opts)[0].dataBind(opts.controllers[i]);
                }
                var btnPnl = $('<div class="picBtnPanel"></div>').appendTo(el);
                var btnAdd = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Add Controller', icon: '<i class="fas fa-plus" ></i>' });
                btnAdd[0].disabled(true);
                btnAdd.on('click', function (e) {
                    return;
                    //var features = el.find('div.picConfigCategory.cfgChemControllers');
                    //$(this).addClass('disabled');
                    //$(this).find('i').addClass('burst-animated');
                    //var pnl = $('<div></div>').insertBefore(btnPnl).pnlChemControllerConfig(opts);
                    //pnl[0].dataBind({ id: -1, eggTimer: 720, name: 'Feature ' + (opts.features.length + 1), type: 0, showInFeatures: true });
                    //pnl.find('div.picAccordian:first')[0].expanded(true);
                });
            });
        }
    });
    $.widget('pic.pnlChlorinatorConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgChlorinator');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-soap', style: { width: '14rem' } },
                { binding: 'type', glyph: '', style: { width: '5rem' } }]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: {} } });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 2, labelText: 'Body', binding: binding + 'body',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Body', style: { whiteSpace: 'nowrap' } }],
                items: o.bodies, inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Virtual Controller', binding: 'isVirtual' }).attr('title', 'Check this only if the chlorinator is not being controlled by\r\na pool automation system.');
            $('<hr></hr>').appendTo(pnl);

            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Pool Setpoint', binding: binding + 'poolSetpoint', min: 0, max: 100, step: 1, units: '%', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft: '4rem', width:'5.9rem', marginRight: '.25rem' } } });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Spa Setpoint', binding: binding + 'spaSetpoint', min: 0, max: 100, step: 1, units: '%', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft: '4rem', marginRight: '.25rem' } } });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Super Chlor', binding: binding + 'superChlorHours', min: 1, max: 96, step: 1, units: 'hours', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft: '4rem', width: '5.9rem', marginRight: '.25rem' } } });

            var btnPnl = $('<div class="picBtnPanel"></div>').appendTo(pnl);
            var btnSave = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Chlorinator', icon: '<i class="fas fa-save"></i>' });

            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                $.putApiService('/config/chlorinator', v, 'Saving Chlorinator...', function (c, status, xhr) {
                    console.log(c);
                    self.dataBind(c);
                });
            });
            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Delete Chlorinator', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteFeature', {
                    message: 'Are you sure you want to delete Chlorinator ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Chlorinator',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgChlorinator:first').remove();
                            else {
                                $.deleteApiService('/config/chlorinator', v, 'Deleting Chlorinator...', function (c, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgChlorinator:first').remove();
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
            cols[0].elText().text(obj.name || 'Chlorinator');
            if (obj.id === 1 || obj.id === 6) el.find('div.picPickList[data-bind=type]').addClass('disabled');
            dataBinder.bind(el, obj);
        }
    });
    $.widget('pic.pnlChemControllerConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgChemController');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-flask', style: { width: '14rem' } },
                    { binding: 'type', glyph: '', style: { width: '5rem' } }]
            });
            
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { width: '4rem' } } });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 2, labelText: 'Type', binding: binding + 'type',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Type', style: { whiteSpace: 'nowrap' } }],
                items: o.types, inputAttrs: { style: { width: '7rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            var addresses = [];
            for (var i = 1; i <= 16; i++) addresses.push({ val: i + 143, desc: i });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 1, labelText: 'Address', binding: binding + 'address',
                columns: [{ binding: 'val', hidden: true, text: 'Address' }, { binding: 'desc', text: 'Address' }],
                items: addresses, inputAttrs: { style: { width: '3rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });

            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 2, labelText: 'Body', binding: binding + 'body',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Body', style: { whiteSpace: 'nowrap' } }],
                items: o.bodies, inputAttrs: { style: { width: '7rem' } }, labelAttrs: { style: { width:'4rem' } }
            });

            $('<hr></hr>').appendTo(pnl);
            var grpSetpoints = $('<fieldset></fieldset>').css({ display: 'inline-block', verticalAlign: 'top' }).appendTo(pnl);
            $('<legend></legend>').text('Setpoints').appendTo(grpSetpoints);
            line = $('<div></div>').appendTo(grpSetpoints);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'pH Setpoint', binding: binding + 'pHSetpoint', min: 7.0, max: 7.6, step: .1, units: '', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '6.4rem', marginRight: '.25rem' } } });
            line = $('<div></div>').appendTo(grpSetpoints);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'ORP Setpoint', binding: binding + 'orpSetpoint', min: 400, max: 800, step: 10, units: 'mV', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width:'6.4rem', marginRight: '.25rem' } } });

            var grpIndex = $('<fieldset></fieldset>').css({ display: 'inline-block', verticalAlign: 'top' }).appendTo(pnl);
            $('<legend></legend>').text('Index Values').appendTo(grpIndex);
            line = $('<div></div>').appendTo(grpIndex);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Total Alkalinity', binding: binding + 'alkalinity', min: 25, max: 800, step: 10, units: 'ppm', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width:'8.3rem', marginRight: '.25rem' } } });
            line = $('<div></div>').appendTo(grpIndex);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Calcium Hardness', binding: binding + 'calciumHardness', min: 25, max: 800, step: 1, units: 'ppm', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '8.3rem', marginRight: '.25rem' } } });
            line = $('<div></div>').appendTo(grpIndex);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Cyanuric Acid', binding: binding + 'cyanuricAcid', min: 0, max: 201, step: 1, units: 'ppm', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '8.3rem', marginRight: '.25rem' } } });
            
            var btnPnl = $('<div class="picBtnPanel"></div>').appendTo(pnl);
            var btnSave = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Controller', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                if (dataBinder.checkRequired(p)) {
                    $.putApiService('/config/chemController', v, 'Chem Controller...', function (c, status, xhr) {
                        self.dataBind(c);
                    });
                }
            });
            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Delete Controller', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteFeature', {
                    message: 'Are you sure you want to delete controller ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Controller',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgChemController:first').remove();
                            else {
                                //$.deleteApiService('/config/feature', v, 'Deleting Feature...', function (c, status, xhr) {
                                //    p.parents('div.picConfigCategory.cfgFeature:first').remove();
                                //});
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
            cols[0].elText().text(obj.name);
            cols[1].elText().text('IntelliChem');
            dataBinder.bind(el, obj);
        }
    });
})(jQuery);
