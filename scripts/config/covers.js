(function ($) {
    $.widget('pic.configCovers', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgCovers');
            $.getApiService('/config/options/covers', null, function (opts, status, xhr) {
                console.log(opts);
                var covers = opts.covers;
                for (var i = 0; i < covers.length; i++) {
                    $('<div></div>').appendTo(el).pnlCoverConfig({ bodyOptions: opts.bodyOptions, availableCircuits: opts.availableCircuits, maxCovers: opts.maxCovers })[0].dataBind(covers[i]);
                }
            });
        }
    });
})(jQuery);
(function ($) {
    $.widget('pic.pnlCoverConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgCover');
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-shield-alt', style: { width: '9rem' } }, { binding: 'bodyName', style: { width: '5rem', textAlign: 'center' } }, { binding: 'statusText', style: { width: '6rem' } }]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Enabled', binding: 'isActive' });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Normally Closed', binding: 'normallyOn' });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Body', binding: 'body',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Body', style: { whiteSpace: 'nowrap' } }],
                items: o.bodyOptions, inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            line = $('<div></div>').appendTo(pnl);
            var cbChlor = $('<div></div>').appendTo(line).checkbox({ labelText: 'IntelliChlor Active', binding: 'chlorActive' });
            var chlorOutputSpinner = $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Output', binding: 'chlorOutput', min: 0, max: 50, step: 1, units: '%', inputAttrs: { maxlength: 3 }, labelAttrs: { style: { marginLeft: '.5rem', width: '3.5rem' } } });
            chlorOutputSpinner.hide();
            cbChlor.on('change', function () {
                var checked = cbChlor.find('input[type=checkbox]').is(':checked');
                if (checked) chlorOutputSpinner.show();
                else chlorOutputSpinner.hide();
            });
            line = $('<div></div>').appendTo(pnl);
            $('<label style="margin-left:.25rem;font-weight:bold;">Affected Circuits:</label>').appendTo(line);
            var circPnl = $('<div></div>').addClass('pnlCoverCircuits').css({ 'margin': '.25rem .5rem', 'column-count': '3', 'column-gap': '1rem' }).appendTo(pnl);
            var circuits = o.availableCircuits.filter(function (c) { return c.type !== 12 && c.type !== 13; });
            for (var i = 0; i < circuits.length; i++) {
                var c = circuits[i];
                var row = $('<div style="break-inside:avoid;margin:.1rem 0;"></div>').appendTo(circPnl);
                $('<label style="cursor:pointer;white-space:nowrap;"></label>').appendTo(row)
                    .append($('<input type="checkbox" data-datatype="bool">').attr('data-circuit-id', c.id))
                    .append(' ' + c.name);
            }
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            $('<div id="btnSaveCover"></div>').appendTo(btnPnl).actionButton({ text: 'Save Cover', icon: '<i class="fas fa-save"></i>' })
                .on('click', function (e) {
                    var p = $(e.target).parents('div.picAccordian-contents:first');
                    var v = dataBinder.fromElement(p);
                    var circuits = [];
                    p.find('div.pnlCoverCircuits input[type=checkbox]:checked').each(function () {
                        circuits.push(parseInt($(this).attr('data-circuit-id'), 10));
                    });
                    v.circuits = circuits;
                    console.log(v);
                    $.putApiService('/config/cover', v, 'Saving Cover: ' + v.id + '...', function (data, status, xhr) {
                        console.log({ data: data, status: status, xhr: xhr });
                    });
                });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            cols[0].elText().text(obj.name || 'Cover ' + obj.id);
            var body = o.bodyOptions.find(function (b) { return b.val === obj.body; });
            cols[1].elText().text(body ? body.name : '');
            cols[2].elText().text(obj.isActive ? 'Enabled' : 'Disabled');
            dataBinder.bind(el, obj);
            el.find('div.pnlCoverCircuits input[type=checkbox]').each(function () {
                var cid = parseInt($(this).attr('data-circuit-id'), 10);
                $(this).prop('checked', obj.circuits && obj.circuits.indexOf(cid) >= 0);
            });
            var chlorOutputSpinner = el.find('div.picValueSpinner[data-bind=chlorOutput]');
            if (obj.chlorActive) {
                chlorOutputSpinner.show();
                var maxOutput = obj.chlorOutputMax || 50;
                chlorOutputSpinner[0].max(maxOutput);
            } else {
                chlorOutputSpinner.hide();
            }
        }
    });
})(jQuery);
