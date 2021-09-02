(function ($) {
    $.widget('pic.configBodies', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgBodies');
            $.getApiService('/config/options/bodies', null, function (opts, status, xhr) {
                console.log(opts);
                var bodies = opts.bodies;
                for (var i = 0; i < bodies.length; i++) {
                    $('<div></div>').appendTo(el).pnlBodyConfig({ bodyTypes: opts.bodyTypes, maxBodies: opts.maxBodies })[0].dataBind(opts.bodies[i]);
                }
            });
        }
    });
    $.widget('pic.pnlBodyConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgBody');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({ columns: [{ text: '', style: { width: '10rem' }, binding: 'name' }, { binding: 'capacity', text: '', style: { width: '10rem', textAlign: 'right' } }] });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { marginRight: '.25rem' } } });
            $('<div></div>').appendTo(line).valueSpinner({ canEdit:true, labelText: 'Capacity', binding: binding + 'capacity', min: 0, max: 500000, step: 1000, inputAttrs: { maxlength: 7 }, labelAttrs: { style: { marginLeft:'1rem', marginRight:'.25rem' } } });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Spa Manual Heat', binding: binding + 'manualHeat' }).hide();
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div id="btnSaveBody"></div>').appendTo(btnPnl).actionButton({ text: 'Save Body', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                $.putApiService('/config/body', v, 'Saving ' + v.name + '...', function (data, status, xhr) {
                    console.log({ data: data, status: status, xhr: xhr });
                    self.dataBind(data);
                });
            });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            if (typeof obj.type === 'undefined') {
                if (name.toLowerCase() === 'pool') obj.type = 0;
                else if (name.toLowerCase() === 'spa') obj.type = 1;
                else obj.type = 0;
            }
            if (obj.type === 1) {
                el.find('div.picCheckbox[data-bind=manualHeat]').show();
                cols[0].elGlyph().attr('class', 'fas fa-hot-tub');
            }
            else {
                el.find('div.picCheckbox[data-bind=manualHeat]').hide();
                cols[0].elGlyph().attr('class', 'fas fa-swimming-pool');
            }
            var capacity = typeof obj.capacity !== 'undefined' ? parseInt(obj.capacity, 10) || 0 : 0;
            if (isNaN(capacity)) capacity = 0;
            cols[0].elText().text(obj.name);
            cols[1].elText().text(capacity.format('#,##0') + ' gallons');
            dataBinder.bind(el, obj);
        }
    });
    $.widget('pic.configFilters', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgFilters');
            $.getApiService('/config/options/filters', null, `Loading Options...`, function (opts, status, xhr) {
                console.log(opts);
                var filters = opts.filters;
                for (var i = 0; i < filters.length; i++) {
                    $('<div></div>').appendTo(el).pnlFilterConfig({ filterTypes: opts.types, servers: opts.servers, bodies: opts.bodies, areaUnits: opts.areaUnits, pressureUnits: opts.pressureUnits, circuits: opts.circuits })[0].dataBind(filters[i]);
                }
            });
        }
    });
    $.widget('pic.pnlFilterConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgFilter');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({ columns: [{ text: '', style: { width: '10rem' }, binding: 'name', glyph: 'fas fa-recycle' }, { binding: 'type.name', text: '', style: { width: '10rem', textAlign: 'right' } }] });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { marginRight: '.25rem' } } });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 2, labelText: 'Type', binding: binding + 'filterType',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Media Type', style: { whiteSpace: 'nowrap' } }],
                items: o.filterTypes, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'Capacity', binding: binding + 'capacity', fmtMask:'#,##0.##', min: 0, max: 1000, step: 1, inputAttrs: { maxlength: 7 }, labelAttrs: { style: { marginRight: '.25rem' } } });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Units', binding: binding + 'capacityUnits',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Units', style: { whiteSpace: 'nowrap' } }],
                items: o.areaUnits, inputAttrs: { style: { width: '4rem' } }, labelAttrs: { style: { display: 'none' } }
            });
            $('<hr></hr>').appendTo(pnl);
            var grpPressure = $('<fieldset></fieldset>').css({ display: 'inline-block', verticalAlign: 'top' }).appendTo(pnl);
            $('<legend></legend>').text('Filter Pressure').appendTo(grpPressure);
            line = $('<div></div>').appendTo(grpPressure);
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Units', binding: binding + 'pressureUnits',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Units', style: { whiteSpace: 'nowrap' } }],
                items: o.pressureUnits, inputAttrs: { style: { width: '4rem' } }, labelAttrs: { style: { width: '4rem' } }
            }).on('selchanged', function (evt) { self.setPressureUnits(evt.newItem.val); });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Circuit', binding: binding + 'pressureCircuitId',
                columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: false, text: 'Circuit Name', style: { whiteSpace: 'nowrap' } }],
                items: o.circuits, inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });

            line = $('<div></div>').appendTo(grpPressure);
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'Clean', binding: binding + 'cleanPressure', fmtMask: '#,##0.##', min: 0, max: 1000, step: 1, inputAttrs: { maxlength: 7 }, labelAttrs: { style: { width: '4rem' } } });
            line = $('<div></div>').appendTo(grpPressure);
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'Dirty', binding: binding + 'dirtyPressure', fmtMask: '#,##0.##', min: 0, max: 1000, step: 1, inputAttrs: { maxlength: 7 }, labelAttrs: { style: { width: '4rem' } } });

            var bindpnl = $('<div></div>').addClass('pnlDeviceBinding').REMBinding({ servers: o.servers }).appendTo(pnl).hide();
            $('<hr></hr>').prependTo(bindpnl);


            //$('<div></div>').appendTo(line).valueSpinner({ labelText: 'Capacity', binding: binding + 'capacity', min: 0, max: 500000, step: 1000, inputAttrs: { maxlength: 7 }, labelAttrs: { style: { marginLeft: '1rem', marginRight: '.25rem' } } });
            //$('<div></div>').appendTo(line).checkbox({ labelText: 'Spa Manual Heat', binding: binding + 'manualHeat' }).hide();
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div id="btnSaveFilter"></div>').appendTo(btnPnl).actionButton({ text: 'Save Filter', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                $.putApiService('/config/filter', v, 'Saving ' + v.name + '...', function (data, status, xhr) {
                    console.log({ data: data, status: status, xhr: xhr });
                    self.dataBind(data);
                });
            });
        },
        setPressureUnits(val) {
            var self = this, o = self.options, el = self.element;
            var units = o.pressureUnits.find(elem => val === elem.val);
            if (typeof units !== 'undefined') {
                el.find('div[data-bind$="cleanPressure"]').each(function () { this.units(units.name); });
                el.find('div[data-bind$="dirtyPressure"]').each(function () { this.units(units.name); });
            }
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            cols[0].elText().text(obj.name);
            var type = o.filterTypes.find(elem => elem.val === obj.filterType);
            cols[1].elText().text(typeof type === 'object' ? type.desc || 'Unknown' : 'Unknown');
            if (obj.master === 1) el.find('div.pnlDeviceBinding').show();
            else el.find('div.pnlDeviceBinding').hide();
            self.setPressureUnits(obj.pressureUnits);
            dataBinder.bind(el, obj);
        }
    });
})(jQuery); 
