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
            $('<div style="margin-top:0.4rem;font-size:0.85rem;font-style:italic;color:#666"><i class="fas fa-info-circle"></i> Vacation mode must be enabled/disabled from the OCP or ICP panel.</div>').appendTo(pnl);
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var pnl = el.find('div.picAccordian-contents');
            dataBinder.bind(pnl, obj);
            if (obj.startDate) pnl.find('input.vacation-startDate').val(String(obj.startDate).substring(0, 10));
            if (obj.endDate) pnl.find('input.vacation-endDate').val(String(obj.endDate).substring(0, 10));
            if (!obj.useTimeframe) pnl.find('div.vacation-dates').hide();
            pnl.find('div.picCheckbox[data-bind=useTimeframe] input').on('change', function () {
                if ($(this).is(':checked')) pnl.find('div.vacation-dates').show();
                else pnl.find('div.vacation-dates').hide();
            });
        }
    });
})(jQuery);
