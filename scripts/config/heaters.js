(function ($) {
    $.widget('pic.configHeaters', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgHeaters');
            var chlorOpts;
            var chemOpts;
            $.getApiService('/config/options/heaters', null, function (opts, status, xhr) {
                console.log(opts);
                for (var i = 0; i < opts.heaters.length; i++) {
                    $('<div></div>').appendTo(el).pnlHeaterConfig(opts)[0].dataBind(opts.heaters[i]);
                }
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                var btnAdd = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Add Heater', icon: '<i class="fas fa-plus" ></i>' });
                btnAdd.on('click', function (e) {
                    var heaters = el.find('div.picConfigCategory.cfgHeater');
                    //$(this).addClass('disabled');
                    //$(this).find('i').addClass('burst-animated');
                    var pnl = $('<div></div>').insertBefore(btnPnl).pnlHeaterConfig(opts);
                    pnl[0].dataBind({ id: -1, name: 'Heater ' + (heaters.length + 1) });
                    pnl.find('div.picAccordian:first')[0].expanded(true);
                });
            });
        }
    });
    $.widget('pic.pnlHeaterConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgHeater');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-dumpster-fire', style: { width: '14rem' } },
                    { binding: 'type', glyph: '', style: { width: '10rem' } },
                    { binding: 'body', glyph: '', style: { width: '7rem' } }]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { width:'4rem'} } });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 2, labelText: 'Type', binding: binding + 'type',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Heater Type', style: { whiteSpace: 'nowrap' } }],
                items: o.heaterTypes, inputAttrs: { style: { width: '7.7rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            }).on('selchanged', function (evt) { self._setOptionsPanel(evt.newItem); });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Virtual Controller', binding: 'isVirtual' }).attr('title', 'Check this only if the heater is not being controlled by\r\na pool automation system.');
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 2, labelText: 'Body', binding: binding + 'body',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Body', style: { whiteSpace: 'nowrap' } }],
                items: o.bodies, inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { width:'4rem' } }
            });
            $('<hr></hr>').appendTo(pnl);
            $('<div></div>').appendTo(pnl).addClass('pnl-heater-options');


            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Heater', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                if (dataBinder.checkRequired(p,true)) {
                    var v = dataBinder.fromElement(p);
                    console.log(v);
                    $.putApiService('/config/heater', v, 'Saving Heater...', function (c, status, xhr) {
                        console.log(c);
                        self.dataBind(c);
                    });
                }
            });
            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Delete Heater', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteHeater', {
                    message: 'Are you sure you want to delete Heater ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Heater',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgHeater:first').remove();
                            else {
                                $.deleteApiService('/config/heater', v, 'Deleting Heater...', function (c, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgHeater:first').remove();
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
        _setOptionsPanel(type) {
            var self = this, o = self.options, el = self.element;
            var pnl = el.find('div.pnl-heater-options:first');
            if (pnl.attr('data-heatertype') !== type.val.toString()) {
                pnl.attr('data-heatertype', type.val);
                pnl.empty();
                var acc = el.find('div.picAccordian:first');
                var cols = acc[0].columns();
                switch (type.name) {
                    case 'solar':
                        cols[0].elGlyph().removeClass().addClass('fas').addClass('fa-sun');
                        pnlOpts = $('<div></div>').appendTo(pnl);
                        pnlOpts.pnlSolarHeaterOptions({ type: type, tempUnits: o.tempUnits });
                        break;
                    case 'gas':
                        cols[0].elGlyph().removeClass().addClass('fas').addClass('fa-burn');
                        pnlOpts = $('<div></div>').appendTo(pnl);
                        pnlOpts.pnlGasHeaterOptions({ type: type, tempUnits: o.tempUnits });
                        break;
                    case 'mastertemp':
                        cols[0].elGlyph().removeClass().addClass('fas').addClass('fa-fire-alt');
                        pnlOpts = $('<div></div>').appendTo(pnl);
                        pnlOpts.pnlMasterTempHeaterOptions({ type: type, tempUnits: o.tempUnits });
                        break;
                    case 'heatpump':
                        cols[0].elGlyph().removeClass().addClass('fas').addClass('fa-x-ray');
                        pnlOpts = $('<div></div>').appendTo(pnl);
                        pnlOpts.pnlHeatPumpHeaterOptions({ type: type, tempUnits: o.tempUnits });
                        break;
                    case 'ultratemp':
                        cols[0].elGlyph().removeClass().addClass('fas').addClass('fa-x-ray');
                        pnlOpts = $('<div></div>').appendTo(pnl);
                        pnlOpts.pnlUltraTempHeaterOptions({ type: type, tempUnits: o.tempUnits });
                        break;
                    case 'maxetherm':
                        cols[0].elGlyph().removeClass().addClass('fas').addClass('fa-fire-alt');
                        pnlOpts = $('<div></div>').appendTo(pnl);
                        pnlOpts.pnlMaxEThermHeaterOptions({ type: type, tempUnits: o.tempUnits });
                        break;
                    case 'hybrid':
                        cols[0].elGlyph().removeClass().addClass('fas').addClass('fa-fire');
                        pnlOpts = $('<div></div>').appendTo(pnl);
                        pnlOpts.pnlHybridHeaterOptions({ type: type, tempUnits: o.tempUnits });
                        break;
                }
            }
            return pnl;
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            cols[0].elText().text(obj.name || 'Heater');
           
            var htype = o.heaterTypes.find(elem => elem.val === obj.type) || { val: 0, name: 'unknown', desc: 'Unknown' };
            var body = o.bodies.find(elem => elem.val === obj.body) || { val: 0, name: '', desc: 'No Body' };
            var pnl = el.find('div.pnl-heater-options:first');
            var hasId = typeof obj.id !== 'undefined' && obj.id > 0;
            cols[1].elText().text(htype.desc);
            cols[2].elText().text(body.desc);
            el.find('div[data-bind="type"]').each(function () { this.disabled(hasId); });
            el.find('div[data-bind="isVirtual"]').each(function () { this.disabled(hasId); });
            self._setOptionsPanel(htype);
            dataBinder.bind(el, obj);
        }
    });
    $.widget('pic.pnlSolarHeaterOptions', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('pnl-solar-heater');
            var binding = '';
            var line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).valueSpinner({ value:6, labelText: 'Start Temp Delta', binding: binding + 'startTempDelta', min: 4, max: 9, step: 1, units: '&deg;' + o.tempUnits.name, inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginRight: '.25rem' } } });
            $('<div></div>').appendTo(line).valueSpinner({ value:3, labelText: 'Stop Temp Delta', binding: binding + 'stopTempDelta', min: 2, max: 5, step: 1, units: '&deg;' + o.tempUnits.name, inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft:'2rem', marginRight: '.25rem' } } });
            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Nocturnal Cooling', binding: 'coolingEnabled' }).attr('title', 'Check this to enable cooling when the body is on/r/nand the solar temperature is less than the water temperature.');
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            dataBinder.bind(el, obj);
        }
    });
    $.widget('pic.pnlGasHeaterOptions', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('pnl-gas-heater');
            var binding = '';
            var line = $('<div></div>').appendTo(el);
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            dataBinder.bind(el, obj);
        }
    });
    $.widget('pic.pnlHeatPumpHeaterOptions', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('pnl-heatpump-heater');
            var binding = '';
            //var line = $('<div></div>').appendTo(el);
            //var addresses = [];
            //for (var i = 1; i <= 16; i++) addresses.push({ val: i + 143, desc: i });
            //$('<div></div>').appendTo(line).pickList({
            //    required: true,
            //    bindColumn: 0, displayColumn: 1, labelText: 'Address', binding: binding + 'address',
            //    columns: [{ binding: 'val', hidden: true, text: 'Address' }, { binding: 'desc', text: 'Address' }],
            //    items: addresses, inputAttrs: { style: { width: '3rem' } }, labelAttrs: { style: { width: '4rem' } }
            //});
            //$('<div></div>').appendTo(line).valueSpinner({ labelText: 'Differential Temp', binding: binding + 'differentialTemp', min: 3, max: 9, step: 1, units: '&deg;' + o.tempUnits.name, inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft: '2rem', marginRight: '.25rem' } } });
            //line = $('<div></div>').appendTo(el);
            //$('<div></div>').appendTo(line).checkbox({ labelText: 'Nocturnal Cooling', binding: 'coolingEnabled' }).attr('title', 'Check this to enable cooling when the body is on/r/nand the solar temperature is less than the water temperature.');
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            dataBinder.bind(el, obj);
        }
    });

    $.widget('pic.pnlMasterTempHeaterOptions', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('pnl-mastertemp-heater');
            var binding = '';
            var line = $('<div></div>').appendTo(el);
            var addresses = [];
            for (var i = 1; i <= 16; i++) addresses.push({ val: i + 111, desc: i });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 1, labelText: 'Address', binding: binding + 'address',
                columns: [{ binding: 'val', hidden: true, text: 'Address' }, { binding: 'desc', text: 'Address' }],
                items: addresses, inputAttrs: { style: { width: '3rem' } }, labelAttrs: { style: { width: '4rem', marginLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Cooldown Delay', binding: binding + 'cooldownDelay', min: 1, max: 10, step: 1, units: 'min', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft: '1rem', marginRight: '.25rem' } } });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            dataBinder.bind(el, obj);
        }
    });
    $.widget('pic.pnlUltraTempHeaterOptions', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('pnl-ultratemp-heater');
            var binding = '';
            var line = $('<div></div>').appendTo(el);
            var addresses = [];
            for (var i = 1; i <= 16; i++) addresses.push({ val: i + 111, desc: i });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 1, labelText: 'Address', binding: binding + 'address',
                columns: [{ binding: 'val', hidden: true, text: 'Address' }, { binding: 'desc', text: 'Address' }],
                items: addresses, inputAttrs: { style: { width: '3rem' } }, labelAttrs: { style: { width: '4rem' } }
            });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Differential Temp', binding: binding + 'differentialTemp', min: 3, max: 9, step: 1, units: '&deg;' + o.tempUnits.name, inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft:'2rem', marginRight: '.25rem' } } });
            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Nocturnal Cooling', binding: 'coolingEnabled' }).attr('title', 'Check this to enable cooling when the body is on/r/nand the solar temperature is less than the water temperature.');
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            dataBinder.bind(el, obj);
        }
    });
    $.widget('pic.pnlMaxEThermHeaterOptions', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('pnl-maxetherm-heater');
            var binding = '';
            var line = $('<div></div>').appendTo(el);
            var addresses = [];
            for (var i = 1; i <= 16; i++) addresses.push({ val: i + 111, desc: i });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 1, labelText: 'Address', binding: binding + 'address',
                columns: [{ binding: 'val', hidden: true, text: 'Address' }, { binding: 'desc', text: 'Address' }],
                items: addresses, inputAttrs: { style: { width: '3rem' } }, labelAttrs: { style: { width:'4rem', marginLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Cooldown Delay', binding: binding + 'cooldownDelay', min: 1, max: 10, step: 1, units: 'min', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft:'1rem', marginRight: '.25rem' } } });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            dataBinder.bind(el, obj);
        }
    });
    $.widget('pic.pnlHybridHeaterOptions', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('pnl-mastertemp-heater');
            var binding = '';
            var line = $('<div></div>').appendTo(el);
            $('<input type="hidden"></input>').appendTo(line).attr('data-bind', 'efficiencyMode').attr('data-datatype', 'int').val(3);
            var addresses = [];
            for (var i = 1; i <= 16; i++) addresses.push({ val: i + 111, desc: i });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 1, labelText: 'Address', binding: binding + 'address',
                columns: [{ binding: 'val', hidden: true, text: 'Address' }, { binding: 'desc', text: 'Address' }],
                items: addresses, inputAttrs: { style: { width: '3rem' } }, labelAttrs: { style: { width:'4rem' } }
            });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Boost Temp', binding: binding + 'boostTemp', min: 5, max: 10, step: 1, units: '&deg;' + o.tempUnits.name, inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft:'1rem', marginRight: '.25rem' } } });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Economy Time', binding: binding + 'economyTime', min: 1, max: 6, step: 1, units: 'min', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft:'1rem', marginRight: '.25rem' } } });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            dataBinder.bind(el, obj);
        }
    });

})(jQuery);
