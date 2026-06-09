(function ($) {
    $.widget('pic.pnlVacation', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory cfgVacation');
            var acc = $('<div></div>').appendTo(el).accordian({ columns: [{ text: 'Vacation', glyph: 'fas fa-umbrella-beach', style: { width: '15rem' } }] });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Vacation Mode Enabled', binding: 'enabled' });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Use Date Range', binding: 'useTimeframe' });
            line = $('<div class="vacation-dates"></div>').appendTo(pnl);
            $('<label style="display:inline-block;width:7rem;font-weight:bold">Start Date:</label>').appendTo(line);
            $('<input type="date" class="vacation-startDate" style="padding:0.2rem 0.4rem"/>').appendTo(line);
            line = $('<div class="vacation-dates"></div>').appendTo(pnl);
            $('<label style="display:inline-block;width:7rem;font-weight:bold">End Date:</label>').appendTo(line);
            $('<input type="date" class="vacation-endDate" style="padding:0.2rem 0.4rem"/>').appendTo(line);
            self._warnEl = $('<div class="vacation-rs485-warning" style="margin-top:0.4rem;font-size:0.85rem;font-style:italic;color:#c60"><i class="fas fa-exclamation-triangle"></i> Vacation mode must be enabled/disabled from the OCP or ICP panel due to controller bug.</div>').appendTo(pnl);
            var btnPnl = $('<div class="picBtnPanel btn-panel vacation-save-panel" style="display:none"></div>').appendTo(pnl);
            $('<div id="btnSaveVacation"></div>').appendTo(btnPnl).actionButton({ text: 'Save Vacation', icon: '<i class="fas fa-save"></i>' });
            btnPnl.find('#btnSaveVacation').on('click', function (e) {
                var p = el.find('div.picAccordian-contents');
                var v = {
                    enabled: p.find('div.picCheckbox[data-bind="enabled"]')[0].val(),
                    useTimeframe: p.find('div.picCheckbox[data-bind="useTimeframe"]')[0].val(),
                    startDate: p.find('input.vacation-startDate').val(),
                    endDate: p.find('input.vacation-endDate').val()
                };
                $.putApiService('/config/general', { options: { vacation: v } }, 'Saving Vacation Settings...', function (data, status, xhr) {
                    if (data && data.pool && data.pool.options && data.pool.options.vacation)
                        self.dataBind(data.pool.options.vacation);
                });
            });
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var pnl = el.find('div.picAccordian-contents');
            dataBinder.bind(pnl, obj);
            if (obj.startDate) pnl.find('input.vacation-startDate').val(String(obj.startDate).substring(0, 10));
            if (obj.endDate) pnl.find('input.vacation-endDate').val(String(obj.endDate).substring(0, 10));
            if (obj.useTimeframe) pnl.find('div.vacation-dates').show();
            else pnl.find('div.vacation-dates').hide();
            // Toggle date pickers when "Use Date Range" checkbox changes
            pnl.find('div.picCheckbox[data-bind="useTimeframe"] input').off('change.vacation').on('change.vacation', function () {
                if ($(this).is(':checked')) pnl.find('div.vacation-dates').show();
                else pnl.find('div.vacation-dates').hide();
            });
            // Check connection type: enable controls for WebSocket, disable for RS485
            $.getApiService('/config/options/rs485', null, function (opts, status, xhr) {
                var isWebSocket = false;
                if (opts && opts.ports) {
                    for (var i = 0; i < opts.ports.length; i++) {
                        if (opts.ports[i].type === 'ocpws') { isWebSocket = true; break; }
                    }
                }
                if (isWebSocket) {
                    pnl.find('div.picCheckbox input').prop('disabled', false);
                    pnl.find('input.vacation-startDate, input.vacation-endDate').prop('disabled', false);
                    pnl.find('div.vacation-rs485-warning').hide();
                    pnl.find('div.vacation-save-panel').show();
                } else {
                    pnl.find('div.picCheckbox input').prop('disabled', true);
                    pnl.find('input.vacation-startDate, input.vacation-endDate').prop('disabled', true);
                    pnl.find('div.vacation-rs485-warning').show();
                    pnl.find('div.vacation-save-panel').hide();
                }
            });
        }
    });
})(jQuery);
