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
            let div = $('<div class="picCircuitTitle"></div>');
            div.appendTo(el);
            let span = $('<span class="picCircuitTitle"></span>');
            span.appendTo(div);
            span.text('Schedules');
            for (var i = 0; i < data.schedules.length; i++) {
                // Create a new schedule for each installed schedule.
                let divSched = $('<div class="picSchedule"></div>');
                divSched.appendTo(el);
                divSched.schedule(data.schedules[i]);
            }
        },
      
        setScheduleData: function (data) {
            var self = this, o = self.options, el = self.element;
            var pnl = $('div.picSchedule[data-id=' + data.id + ']');
            if (pnl.length === 0) {
                let div = $('<div class="picSchedule"><div>');
                div.appendTo(el);
                div.schedule(data);
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
            self.setEquipmentData(o);
            el[0].setEquipmentData = function (data) { self.setEquipmentData(data); };
        },
        setEquipmentData: function (data) {
            var self = this, o = self.options, el = self.element;
            try {
                dataBinder.bind(el, data);
                el.css({ display: '' });
                el.find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
                el.attr('data-id', data.id);
                el.find('.picSchedDays').remove();
                self._createDays(data).appendTo(el);
                //let row = el.find('table.picSchedDays > tbody > tr:last');
                //row.find('td > i').removeClass('fas').addClass('far');
                //for (var k = 0; k < data.scheduleDays.days.length; k++) {
                //    let day = data.scheduleDays.days[k];
                //    row.find('td:nth-child(' + (day.dow + 1) + ')').find('i:first').removeClass('far').addClass('fas');
                //}
            } catch (err) { console.error({ m: 'Error setting schedule', err: err, schedule: data }); }
        },
       
        _buildControls: function() {
            var self = this, o = self.options, el = self.element;
            el.empty();
            $('<div class="picIndicator"></div><label class="picScheduleName" data-bind="circuit.name"></label>').appendTo(el);
            el.attr('data-id', o.id);
            $('<span class="picSchedTime picData"><span class="picStartTime" data-bind="startTime" data-fmttype="time" data-fmtmask="hh:mmtt" data=fmtempty="--:--"></span> - <span class="picEndTime" data-bind="endTime" data-fmttype="time" data-fmtmask="hh:mmtt" data=fmtempty="--:--"></span></span>').appendTo(el);
            self._createDays(o).appendTo(el);
        },
        _isEveryDay: function (days) { return days.val === 127; },
        _isWeekends: function (days) {
            let arr = [];
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
        _createDays: function (sched) {
            var self = this, o = self.options, el = self.element;
            if (typeof sched.scheduleDays !== 'undefined') {
                if (self._isEveryDay(sched.scheduleDays)) return $('<label class="picSchedDays">Every Day</label>');
                else if (self._isWeekends(sched.scheduleDays)) return $('<label class="picSchedDays">Weekends</label>');
                else if (self._isWeekdays(sched.scheduleDays)) return $('<label class="picSchedDays">Weekdays</label>');
                else {
                    let tbl = $('<table class="picSchedDays"><tbody>' +
                        '<tr><td>S</td><td>M</td><td>T</td><td>W</td><td>T</td><td>F</td><td>S</td></tr>' +
                        '<tr></tr>' +
                        '</tbody></table>');
                    let row = tbl.find('tr:last');
                    for (var i = 0; i < 7; i++) {
                        $('<td><i class="far fa-times-circle"></i></td>').appendTo(row);
                    }
                    for (var k = 0; k < sched.scheduleDays.days.length; k++) {
                        let day = sched.scheduleDays.days[k];
                        row.find('td:nth-child(' + (day.dow + 1) + ')').find('i:first').removeClass('far').addClass('fas');
                    }
                    return tbl;
                }
            }
            return $('<label class="picSchedDays"></label>');
        }

    });
})(jQuery);
