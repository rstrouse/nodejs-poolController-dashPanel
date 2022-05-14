(function ($) {
    $.widget("pic.schedules", {
        options: { },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initSchedules = function (data) { self._initSchedules(data); };
            el[0].setScheduleData = function (data) { self.setScheduleData(data); };
        },
        _initSchedules: function(data) {
            var self = this, o = self.options, el = self.element;
            el.empty();
            let div = $('<div class="picCircuitTitle control-panel-title"></div>');
            div.appendTo(el);
            let span = $('<span class="picCircuitTitle"></span>');
            span.appendTo(div);
            span.text('Schedules');
            if (typeof data !== 'undefined' && typeof data.schedules !== 'undefined') {
                var schedules = data.schedules.sort((a, b) => a.id - b.id);
                for (var i = 0; i < schedules.length; i++) {
                    // Create a new schedule for each installed schedule.
                    if (data.isActive === false || data.schedules[i].disabled) continue;
                    let divSched = $('<div class="picSchedule"></div>');
                    divSched.appendTo(el);
                    divSched.schedule(data.schedules[i]);
                }
                if (el.find('div.picSchedule[data-active=true]').length > 0)
                    el.show();
                else
                    el.hide();

                if (schedules.length > 0) el.show();
                else el.hide();
            }
            else el.hide();
        },
        setScheduleData: function (data) {
            var self = this, o = self.options, el = self.element;
            var pnl = $('div.picSchedule[data-id=' + data.id + ']');
            if (pnl.length === 0) {
                if (data.isActive === false || data.disabled) $(this).remove();
                else {
                    var scheds = el.find('div.picSchedule');
                    var div = $('<div class="picSchedule"><div>');
                    var add = true;
                    // Insert it in the right place.
                    scheds.each(function () {
                        var id = parseInt($(this).attr('data-id'), 10);
                        if (id > data.id) {
                            div.insertBefore($(this));
                            add = false;
                        }
                        return add;
                    });
                    if (add) div.appendTo(el);
                    div.schedule(data);
                }
            }
            else {
                pnl.each(function () {
                    this.setEquipmentData(data);
                });
            }
        }
    });
    $.widget('pic.schedule', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setEquipmentData = function (data) { self.setEquipmentData(data); };
            self.setEquipmentData(o);
        },
        setEquipmentData: function (data) {
            var self = this, o = self.options, el = self.element;
            var pnl = el.parents('div.picSchedules:first');
            try {
                if (data.circuit <= 0 || data.isActive === false || data.disabled) {
                    el.attr('data-active', false);
                    if (pnl.find('div.picSchedule[data-active=true]').length > 0)
                        pnl.show();
                    else
                        pnl.hide();
                    el.remove();
                    return;
                }
                var disp = typeof data.display === 'object' ? data.display.val || 0 : 0;
                switch (disp) {
                    case 1:
                        if (makeBool(data.isOn)) el.show();
                        else el.hide();
                        break;
                    case 2:
                        el.hide();
                        break;
                    default:
                        el.show();
                        break;
                }
                el.attr('data-active', true);
                dataBinder.bind(el, data);
                el.find('div.picIndicator').attr('data-status', data.manualPriorityActive ? 'pending' : data.isOn ? 'on' : 'off');
                el.attr('data-id', data.id);
                el.find('.picSchedDays').remove();
                var startTime = parseInt(data.startTime);
                var endTime = parseInt(data.endTime);
                var startTimeType = data.startTimeType || { val: 0, name: 'manual', desc: 'Manual' };
                var endTimeType = data.endTimeType || { val: 0, name: 'manual', desc: 'Manual' };

                el.find('.picStartTime').text(startTimeType.name !== 'manual' ? data.startTimeType.desc : startTime.formatTime('hh:mmtt', '--:--'));
                el.find('.picEndTime').text(endTimeType.name !== 'manual' ? data.endTimeType.desc : endTime.formatTime('hh:mmtt', '--:--'));
                self._createDays(data).appendTo(el);
            } catch (err) { console.error({ m: 'Error setting schedule', err: err, schedule: data }); }
            if (pnl.find('div.picSchedule[data-active=true]').length > 0)
                pnl.show();
            else
                pnl.hide();
        },
       
        _buildControls: function() {
            var self = this, o = self.options, el = self.element;
            el.empty();
            $('<div class="picIndicator"></div><label class="picScheduleName" data-bind="circuit.name"></label>').appendTo(el);
            el.attr('data-id', o.id);
            var span = $('<span></span>').appendTo(el).addClass('picSchedTime').addClass('picData');

            $('<span></span>').appendTo(span).addClass('picStartTime');
            $('<span></span>').appendTo(span).text(' - ');
            $('<span></span>').appendTo(span).addClass('picEndTime');
            //$('<span class="picSchedTime picData"><span class="picStartTime" data-bind="startTime" data-fmttype="time" data-fmtmask="hh:mmtt" data=fmtempty="--:--"></span> - <span class="picEndTime" data-bind="endTime" data-fmttype="time" data-fmtmask="hh:mmtt" data=fmtempty="--:--"></span></span>').appendTo(el);
            self._createDays(o).appendTo(el);
        },
        _isEveryDay: function (days) { return typeof days !== 'undefined' && days.val === 127; },
        _isWeekends: function (days) {
            let arr = [];
            if (typeof days === 'undefined' || typeof days.days === 'undefined') return false;
            for (let i = 0; i < days.days.length; i++) {
                switch (days.days[i].dow) {
                    case 0:
                    case 1:
                        arr.push(days.days[i]);
                        break;
                    default:
                        return false;
                }
            }
            return arr.length === 2;
        },
        _isWeekdays: function (days) {
            let arr = [];
            if (typeof days === 'undefined' || typeof days.days === 'undefined') return false;
            for (let i = 0; i < days.days.length; i++) {
                switch (days.days[i].dow) {
                    case 0:
                    case 1:
                        return false;
                    default:
                        arr.push(days.days[i]);
                        break;
                }
            }
            return arr.length === 5;
        },
        _isNodays: function (days) {
            let arr = [];
            if (typeof days === 'undefined' || typeof days.days === 'undefined') return true;
            if (days.days.length === 0) return true;
        },
        _createDays: function (sched) {
            var self = this, o = self.options, el = self.element;
            if (typeof sched === 'undefined') return $('<label class="picSchedDays"></label>');
            else if (typeof sched.scheduleType === 'undefined') return $('<label class="picSchedDays"></label>');
            
            if (sched.scheduleType.name === 'runonce' && typeof sched.startDate !== 'undefined') return $('<label class="picSchedDays"></label>').text(Date.parseISO(sched.startDate).format('MM/dd/yyyy'));
            else if (self._isEveryDay(sched.scheduleDays)) return $('<label class="picSchedDays">Every Day</label>');
            else if (self._isWeekends(sched.scheduleDays)) return $('<label class="picSchedDays">Weekends</label>');
            else if (self._isWeekdays(sched.scheduleDays)) return $('<label class="picSchedDays">Weekdays</label>');
            else if (self._isNodays(sched.scheduleDays)) return $('<label class="picSchedDays">No Days</label>');
            else if (typeof sched.scheduleDays !== 'undefined') {
                let tbl = $('<table class="picSchedDays"><tbody>' +
                    '<tr><td>S</td><td>M</td><td>T</td><td>W</td><td>T</td><td>F</td><td>S</td></tr>' +
                    '<tr></tr>' +
                    '</tbody></table>');
                let row = tbl.find('tr:last');
                for (var i = 0; i < 7; i++) {
                    $('<td><i class="far fa-circle"></i></td>').appendTo(row);
                }
                if (typeof sched.scheduleDays.days !== 'undefined') {
                    for (var k = 0; k < sched.scheduleDays.days.length; k++) {
                        let day = sched.scheduleDays.days[k];
                        row.find('td:nth-child(' + (day.dow + 1) + ')')
                            .find('i:first')
                            .removeClass('far').addClass('fas')
                            .removeClass('fa-circle').addClass('fa-times-circle');
                    }
                }
                return tbl;
            }
            return $('<label class="picSchedDays"></label>');
        }

    });
})(jQuery);
