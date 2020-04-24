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
                    $('<div />').appendTo(el).pnlBodyConfig({ bodyTypes: opts.bodyTypes, maxBodies: opts.maxBodies })[0].dataBind(opts.bodies[i]);
                }
            });
        }
    });
})(jQuery); // Bodies Tab
(function ($) {
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
            var acc = $('<div />').appendTo(el).accordian({ columns: [{ text: '', style: { width: '10rem' }, binding: 'name' }, { binding: 'capacity', text: '', style: { width: '10rem', textAlign: 'right' } }] });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div />').appendTo(pnl);
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'id').appendTo(line);
            $('<div />').appendTo(line).inputField({ labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { marginRight: '.25rem' } } });
            $('<div />').appendTo(line).valueSpinner({ labelText: 'Capacity', binding: binding + 'capacity', min: 0, max: 500000, step: 1000, inputAttrs: { maxlength: 7 }, labelAttrs: { style: { marginLeft:'1rem', marginRight:'.25rem' } } });
            $('<div />').appendTo(line).checkbox({ labelText: 'Spa Manual Heat', binding: binding + 'manualHeat' }).hide();
            var btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
            var btnSave = $('<div id="btnSaveBody" />').appendTo(btnPnl).actionButton({ text: 'Save Body', icon: '<i class="fas fa-save" />' });
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
            if (obj.type === 1) {
                el.find('div.picCheckbox[data-bind=manualHeat]').show();
                cols[0].elGlyph().attr('class', 'fas fa-hot-tub');
            }
            else {
                el.find('div.picCheckbox[data-bind=manualHeat]').hide();
                cols[0].elGlyph().attr('class', 'fas fa-swimming-pool');
            }
            cols[0].elText().text(obj.name);
            cols[1].elText().text(obj.capacity.format('#,##0') + ' gallons');
            dataBinder.bind(el, obj);
        }
    });
})(jQuery); // Body Panel
