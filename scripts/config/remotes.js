(function ($) {
    $.widget('pic.configRemotes', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgRemotes');
            $.getApiService('/config/options/remotes', null, 'Loading Remotes...', function (opts, status, xhr) {
                var remotes = opts.remotes;
                var pnl = $('<div></div>').addClass('pnlRemotes').appendTo(el);
                for (var i = 0; i < remotes.length; i++) {
                    if (!remotes[i].isActive) continue;
                    $('<div></div>').appendTo(pnl).pnlRemoteConfig({ remoteTypes: opts.remoteTypes, circuits: opts.circuits, pumps: opts.pumps || [], maxRemotes: opts.maxRemotes })[0].dataBind(remotes[i]);
                }
            });
        }
    });
})(jQuery);
(function ($) {
    $.widget('pic.pnlRemoteConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgRemote');
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-gamepad', style: { width: '9rem' } }, { binding: 'type', style: { width: '14rem', textAlign: 'center' } }, { binding: 'body', style: { width: '5rem' } }]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { marginLeft: '.25rem', width: '3rem' } } });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 2, labelText: 'Type', binding: 'type',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Remote Type', style: { whiteSpace: 'nowrap' } }],
                items: o.remoteTypes, inputAttrs: { style: { width: '10rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Body', binding: 'body',
                columns: [{ binding: 'val', hidden: true, text: 'Id' }, { binding: 'desc', text: 'Body' }],
                items: [{ val: 0, desc: 'Pool' }, { val: 1, desc: 'Spa' }, { val: 2, desc: 'Body 3' }, { val: 3, desc: 'Body 4' }],
                inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            var pumpItems = [{ id: 0, name: 'Unassigned' }].concat((o.pumps || []).map(function (p) { return { id: p.id, name: p.name }; }));
            $('<div></div>').appendTo(line).pickList({
                bindColumn: 0, displayColumn: 1, labelText: 'Pump', binding: 'pumpId',
                columns: [{ binding: 'id', hidden: true, text: 'Id' }, { binding: 'name', text: 'Pump' }],
                items: pumpItems, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Enabled', binding: 'isActive' });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).pickList({
                bindColumn: 0, displayColumn: 1, labelText: 'Channel', binding: 'address',
                columns: [{ binding: 'val', hidden: true, text: 'Id' }, { binding: 'desc', text: 'Channel' }],
                items: [{ val: 1, desc: '1' }, { val: 2, desc: '2' }, { val: 3, desc: '3' }, { val: 4, desc: '4' }],
                inputAttrs: { style: { width: '4rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            }).addClass('fldChannel');
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Address Mode', binding: 'addressMode' }).addClass('fldAddressMode');
            var btnLine = $('<div></div>').addClass('pnlRemoteButtons').appendTo(pnl);
            $('<label></label>').text('Button Assignments').css({ fontWeight: 'bold', display: 'block', marginTop: '.5rem', marginBottom: '.25rem' }).appendTo(btnLine);
            var circuitItems = [{ id: 0, name: 'Unassigned' }].concat(o.circuits);
            for (var b = 1; b <= 10; b++) {
                var bline = $('<div></div>').appendTo(btnLine);
                $('<div></div>').appendTo(bline).pickList({
                    bindColumn: 0, displayColumn: 1, labelText: 'Btn ' + b, binding: 'button' + b,
                    columns: [{ binding: 'id', hidden: true, text: 'Id' }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                    items: circuitItems, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem', width: '3rem' } }
                }).addClass('btnAssignment btnAssignment' + b);
            }
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            $('<div id="btnSaveRemote"></div>').appendTo(btnPnl).actionButton({ text: 'Save Remote', icon: '<i class="fas fa-save"></i>', disabled: true });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            var type = o.remoteTypes.find(function (elem) { return elem.val === obj.type; });
            var maxButtons = type ? type.maxButtons : 4;
            cols[0].elText().text(obj.name || type.desc + ' #' + obj.id);
            cols[1].elText().text(type ? type.desc : 'Unknown');
            var bodyNames = ['Pool', 'Spa', 'Body 3', 'Body 4'];
            cols[2].elText().text(bodyNames[obj.body] || '');
            var bindObj = $.extend({}, obj);
            if (typeof bindObj.pumpId === 'undefined' || bindObj.pumpId === 255) bindObj.pumpId = 0;
            else bindObj.pumpId = bindObj.pumpId + 1;
            bindObj.addressMode = (obj.address || 0) > 0;
            if (!bindObj.address || bindObj.address < 1) bindObj.address = 1;
            for (var b = 1; b <= maxButtons; b++) {
                var raw = obj['button' + b];
                if (typeof raw === 'number' && raw < 255) bindObj['button' + b] = raw + 1;
                else bindObj['button' + b] = 0;
            }
            for (var b = 1; b <= 10; b++) {
                var btnEl = el.find('.btnAssignment' + b);
                if (b <= maxButtons) btnEl.show();
                else btnEl.hide();
            }
            var channelEl = el.find('.fldChannel');
            var addrModeEl = el.find('.fldAddressMode');
            if (obj.type === 2 || obj.type === 4) {
                channelEl.show();
                addrModeEl.show();
            } else {
                channelEl.hide();
                addrModeEl.hide();
            }
            dataBinder.bind(el, bindObj);
        }
    });
})(jQuery);
