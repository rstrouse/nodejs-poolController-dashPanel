(function ($) {
    $.widget('pic.configSchedules', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgSchedules');
            $.getApiService('/config/options/schedules', null, 'Loading Options...', function (opts, status, xhr) {
                console.log(opts);
                var schedules = opts.schedules.sort((a, b) => a.id - b.id);
                for (var i = 0; i < schedules.length; i++) {
                    $('<div></div>').appendTo(el).pnlScheduleConfig({
                        bodies: opts.bodies,
                        scheduleTimeTypes: opts.scheduleTimeTypes, maxSchedules: opts.maxSchedules,
                        scheduleTypes: opts.scheduleTypes, scheduleDays: opts.scheduleDays, heatSources: opts.heatSources,
                        tempUnits: opts.tempUnits, circuits: opts.circuits, clockMode: opts.clockMode, displayTypes: opts.displayTypes
                    })[0].dataBind(opts.schedules[i]);
                }
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                var btnAdd = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Add Schedule', icon: '<i class="fas fa-plus" ></i>' });
                btnAdd.on('click', function (e) {
                    var groups = el.find('div.picConfigCategory.cfgSchedule');
                    var pnl = $('<div></div>').insertBefore(btnPnl).pnlScheduleConfig({
                        scheduleTimeTypes: opts.scheduleTimeTypes, maxSchedules: opts.maxSchedules,
                        scheduleTypes: opts.scheduleTypes, scheduleDays: opts.scheduleDays, heatSources: opts.heatSources, bodies: opts.bodies,
                        tempUnits: opts.tempUnits, circuits: opts.circuits, clockMode: opts.clockMode, displayTypes: opts.displayTypes
                    });
                    var st = opts.scheduleTypes.find(elem => elem.name === 'repeat') || opts.scheduleTypes[0];
                    var tt = opts.scheduleTimeTypes.find(elem => elem.name === 'manual') || opts.scheduleTimeTypes[0];
                    pnl[0].dataBind({
                        id: -1, startTime: 480, endTime: 1020,
                        scheduleType: st.val, startTimeType: tt.val, endTimeType: tt.val, circuit: 0, display: 0,
                        heatSetpoint: 78, coolSetpoint: 100, heatSource: 0, scheduleDays: 127, startDate: new Date().toISOString()
                       
                    });
                    pnl.find('div.picAccordian:first')[0].expanded(true);
                });
            });
        }
    });
})(jQuery); // Schedules Tab
(function ($) {
    $.widget('pic.pnlScheduleConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgSchedule');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'circuit', glyph: 'far fa-calendar-alt', style: { width: '9rem' } }, { binding: 'timespan', style: { width: '10rem', textAlign: 'center', whiteSpace: 'nowrap' } }, { binding: 'days', style: { width: '16rem', whiteSpace: 'nowrap', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' } }]
            });
            var pnl = acc.find('div.picAccordian-contents');
            // Figure out our formats.
            o.fmtTime = o.clockMode === 12 ? 'h:mmtt' : 'H:mm';
            o.fmtTimeEmpty = o.clockMode === 12 ? '12:00am' : '24:00';

            var line = $('<div></div>').addClass('schedule-circuit').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Circuit', binding: binding + 'circuit',
                columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                items: o.circuits, inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Occurance', binding: binding + 'scheduleType',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Occurance', style: { whiteSpace: 'nowrap' } }],
                items: o.scheduleTypes, inputAttrs: { style: { width: '5.4rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            if (typeof o.displayTypes !== 'undefined') {
                $('<div></div>').appendTo(line).pickList({
                    required: true, bindColumn: 0, displayColumn: 1, labelText: 'Display', binding: binding + 'display',
                    columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Display', style: { whiteSpace: 'nowrap' } }],
                    items: o.displayTypes, inputAttrs: { style: { width: '6.7rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
                });
            }
            line = $('<div></div>').addClass('schedule-heatsource').appendTo(pnl).hide();
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: 'Heat Source', binding: binding + 'heatSource',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Heat Source', style: { whiteSpace: 'nowrap' } }],
                items: o.heatSources, inputAttrs: { style: { width: '8rem' } }, labelAttrs: { style: { width: '5.75rem', marginLeft: '.25rem' } }
            }).on('selchanged', function (evt) {
                var p = el.find('div.schedule-heatsource');
                if (typeof evt.newItem === 'undefined' || evt.newItem.name === 'nochange' || evt.newItem.name === 'off') {
                    p.find('div.picValueSpinner[data-bind=heatSetpoint]').hide()[0].required(false);
                    p.find('div.picValueSpinner[data-bind=coolSetpoint]').hide()[0].required(false);
                }
                else {
                    p.find('div.picValueSpinner[data-bind=heatSetpoint]').show()[0].required(true);
                    if (evt.newItem.hasCoolSetpoint === true)
                        p.find('div.picValueSpinner[data-bind=coolSetpoint]').show()[0].required(true);
                    else
                        p.find('div.picValueSpinner[data-bind=coolSetpoint]').hide()[0].required(false);

                }
            });
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'Heat', binding: binding + 'heatSetpoint', min: 0, max: 104, step: 1, maxlength: 5, units: '°' + o.tempUnits.name, labelAttrs: { style: { marginLeft: '1rem', marginRight: '.25rem' } } });
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'Cool', binding: binding + 'coolSetpoint', min: 0, max: 104, step: 1, maxlength: 5, units: '°' + o.tempUnits.name, labelAttrs: { style: { marginLeft: '1rem', marginRight: '.25rem' } } }).hide();

            $('<hr></hr>').appendTo(pnl);
            var inline = $('<div></div>').addClass('inline-line').appendTo(pnl);

            line = $('<div></div>').addClass('schedule-time').addClass('start-time').appendTo(inline);
            $('<label></label>').appendTo(line).text('Start Time').css({ marginLeft: '.25rem', width: '5.75rem', display: 'inline-block' });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: '', binding: binding + 'startTimeType',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Start Type', style: { whiteSpace: 'nowrap' } }],
                items: o.scheduleTimeTypes, inputAttrs: { style: { width: '4rem' } }, labelAttrs: { style: { display: 'none' } }
            }).css({ marginRight: '.25rem' });
            $('<div></div>').appendTo(line).timeSpinner({ labelText: '', binding: binding + 'startTime', min: 0, max: 1440, step: 30, fmtMask: o.fmtTime, emptyMask: o.fmtTimeEmpty, inputAttrs: { maxlength: 7 }, labelAttrs: {} });

            line = $('<div></div>').addClass('schedule-time').addClass('end-time').appendTo(inline);
            $('<label></label>').appendTo(line).text('End Time').css({ marginLeft: '.25rem', width: '5.75rem', display: 'inline-block' });
            $('<div></div>').appendTo(line).pickList({
                required: true, bindColumn: 0, displayColumn: 1, labelText: '', binding: binding + 'endTimeType',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'End Type', style: { whiteSpace: 'nowrap' } }],
                items: o.scheduleTimeTypes, inputAttrs: { style: { width: '4rem' } }, labelAttrs: { style: { display: 'none' } }
            }).css({ marginRight: '.25rem' });
            $('<div></div>').appendTo(line).timeSpinner({ labelText: '', binding: binding + 'endTime', min: 0, max: 1440, step: 30, fmtMask: o.fmtTime, emptyMask: o.fmtTimeEmpty, inputAttrs: { maxlength: 7 }, labelAttrs: {} });

            inline = $('<div></div>').addClass('inline-line').appendTo(pnl);
            $('<div></div>').appendTo(inline).pnlScheduleDays({ singleSelect: false, days: o.scheduleDays, binding: binding + 'scheduleDays' }).css({ paddingLeft: '.25rem' });
            line = $('<div></div>').appendTo(inline);
            $('<div></div>').appendTo(line).dateField({
                labelText: 'Schedule Date', binding: binding + 'startDate', canEdit: true,
                labelAttrs: {}, inputAttrs: { maxlength: 15, style: { width: '7rem' } }
            });
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div id="btnSaveBody"></div>').appendTo(btnPnl).actionButton({ text: 'Save Schedule', icon: '<i class="fas fa-save"></i>' });
            el.on('selchanged', 'div.picPickList[data-bind=circuit]', function (evt) {
                var p = el.find('div.schedule-heatsource');
                var body = o.bodies.find(elem => elem.circuit === evt.newItem.id);
                p.find('div.picPickList[data-bind=heatSource]').each(function () {
                    this.required(typeof body !== 'undefined');
                    this.items(typeof body !== 'undefined' ? body.heatSources : o.heatSources);
                    // Check to see if we have a valid selection if not set it to 0.
                    if (this.val() === null) this.val(0);
                });
                typeof body !== 'undefined' ? p.show() : p.hide();
            });
            el.on('selchanged', 'div.picPickList[data-bind$=TimeType]', function (evt) {
                var p = $(evt.currentTarget).parents('div.schedule-time:first');
                var spin = p.find('div.picValueSpinner[data-bind$=Time]:first');
                if (evt.newItem.name !== 'manual') {
                    spin.hide();
                    spin[0].required(false);
                }
                else {
                    spin.show();
                    spin[0].required(true);
                }
            });
            el.on('selchanged', 'div.picPickList[data-bind=scheduleType]', function (evt) { self._setScheduleType(evt.newItem.val); });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                if (dataBinder.checkRequired(el, true)) {
                    console.log(v);
                    $.putApiService('/config/schedule', v, 'Saving Schedule...', function (data, status, xhr) {
                        console.log({ data: data, status: status, xhr: xhr });
                        self.dataBind(data);
                    });
                }
            });
            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Delete Schedule', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteSchedule', {
                    message: 'Are you sure you want to delete schedule ' + v.id + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Schedule',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgSchedule:first').remove();
                            else {

                                console.log('Deleting Schedule');
                                $.deleteApiService('/config/schedule', v, 'Deleting Schedule...', function (c, status, xhr) {
                                    console.log('Return from deleteAPI Service');
                                    console.log(c);
                                    p.parents('div.picConfigCategory.cfgSchedule:first').remove();
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
        _setScheduleType: function (scheduleType) {
            var self = this, o = self.options, el = self.element;
            var schedType = $.extend(true,
                { name: 'repeat', desc: 'Repeats', startDate: false, startTime: true, endTime: true, days: 'multi' },
                o.scheduleTypes.find(elem => scheduleType === elem.val));
            schedType.startDate ? el.find('div.picPickList[data-bind=startDate]').show()[0].required(true) : el.find('div.picPickList[data-bind=startDate]').hide()[0].required(false);
            schedType.startTime ? el.find('div.schedule-time.start-time').show().find('div.picValueSpinner[data-bind=startTime]')[0].required(true) : el.find('div.schedule-time.start-time').hide().find('div.picValueSpinner[data-bind=startTime]')[0].required(false);
            schedType.endTime ? el.find('div.schedule-time.end-time').show().find('div.picValueSpinner[data-bind=endTime]')[0].required(true) : el.find('div.schedule-time.end-time').hide().find('div.picValueSpinner[data-bind=endTime]')[0].required(false);
            el.find('div.pnl-scheduleDays').each(function () {
                switch (schedType.days) {
                    case 'single':
                        $(this).show();
                        this.singleSelect(true);
                        break;
                    case 'multi':
                        $(this).show();
                        this.singleSelect(false);
                        break;
                    default:
                        $(this).hide();
                        break;
                }
            });
            return schedType;
        },
        getScheduleDays: function (bits, days) {
            var arr = [];
            for (var i = 0; i < days.length; i++) {
                var day = days[i];
                var hasDay = ((day.bitval || day.val) & 0xFF & bits) > 0;
                if (hasDay) arr.push(day);
            }
            return arr.sort((a, b) => a.val - b.val);
        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            var circuit = o.circuits.find(elem => obj.circuit === elem.id) || { id: 0, name: '' };

            cols[0].elText().text(circuit.name);
            var schedType = self._setScheduleType(obj.scheduleType);

            var startTimeType = $.extend(true, { val: 0, name: 'manual', desc: 'Manual' }, o.scheduleTimeTypes.find(elem => obj.startTimeType === elem.val));
            var endTimeType = $.extend(true, { val: 0, name: 'manual', desc: 'Manual' }, o.scheduleTimeTypes.find(elem => obj.endTimeType === elem.val));
            var time = '';
            if (schedType.startTime) {
                if (startTimeType.name !== 'manual') time = startTimeType.desc;
                else time = (obj.startTime || 0).formatTime(o.fmtTime, '--:--');
            }
            if (schedType.endTime) {
                if (time.length > 0) time += ' - ';
                if (endTimeType.name !== 'manual') time += endTimeType.desc;
                else time += (obj.endTime || 0).formatTime(o.fmtTime, '--:--');
            }
            cols[1].elText().text(time);
            var days = [];
            var daysTitle = '';
            // Get the days to show on the header.
            if (schedType.days !== false) {
                days = self.getScheduleDays(obj.scheduleDays, o.scheduleDays);
                if (days.length !== 7) {
                    for (var iday = 0; iday < days.length; iday++) {
                        if (iday > 0) daysTitle += ', ';
                        daysTitle += days[iday].desc.substring(0, 3);
                    }
                }
                else daysTitle = 'Every Day';
            }
            else if (schedType.startDate) {
                console.log(obj.startDate);
                daysTitle = Date.format(obj.startDate, 'MM/dd/yyyy', '--/--/----');
            }
            cols[2].elText().text(daysTitle);
            if (typeof obj.display === 'undefined') obj.display = 0;
            console.log(obj);
            dataBinder.bind(el, obj);
            if (o.scheduleTimeTypes.length <= 1) el.find('div.picPickList[data-bind$=TimeType]').hide()[0].required(false);
        }
    });
    $.widget('pic.pnlScheduleDays', {
        options: { singleSelect: false, days:[] },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            o.days = o.days.sort((a, b) => a.dow - b.dow);
            self._buildControls();
            el[0].selected = function () { };
            el[0].singleSelect = function (val) { return self.singleSelect(val); };
            el[0].val = function (val) { return self.val(val); };
            el.attr('data-bind', o.binding);
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('pnl-scheduleDays');
            var tbl = $('<div></div>').addClass('table').appendTo(el);
            $('<div></div>').addClass('table-caption').appendTo(tbl).text(o.singleSelect ? 'Day to Run' : 'Days to Run');
            var tbody = $('<div></div>').addClass('table-body').appendTo(tbl);
            var rowHeader = $('<div></div>').addClass('table-row').appendTo(tbody).addClass('dayheader');
            var rowDays = $('<div></div>').addClass('table-row').appendTo(tbody).addClass('days');

            // Build our header
            for (var i = 0; i < o.days.length; i++) {
                var day = o.days[i];
                $('<div></div>').addClass('table-cell').appendTo(rowHeader).addClass('dayheader').text(day.desc.substring(0, 3));
                var td = $('<div></div>').addClass('table-cell').appendTo(rowDays).addClass('day');
                td.attr('data-bitval', day.bitval || val);
                td.attr('data-selected', false);
            }
            el.on('click', 'div.table-cell.day', function (evt) {
                var cell = $(evt.currentTarget);
                var bsel = makeBool(cell.attr('data-selected'));
                if (o.singleSelect) {
                    if (!bsel) {
                        // Unselect all the other days.
                        el.find('div.table-cell.day[data-selected=true]').each(function () {
                            //$(this).find('i').removeClass('fas').addClass('far').removeClass('fa-times-circle').addClass('fa-circle');
                            $(this).attr('data-selected', false);
                        });
                    }
                    else bsel = false;
                }
                if (bsel) {
                    //cell.find('i').removeClass('fas').addClass('far').removeClass('fa-times-circle').addClass('fa-circle');
                    cell.attr('data-selected', false);
                }
                else {
                    //cell.find('i').removeClass('far').addClass('fas').removeClass('fa-circle').addClass('fa-times-circle');
                    cell.attr('data-selected', true);
                }

                // Recalculate the value.
                var newval = 0;
                el.find('div.table-cell.day[data-selected=true]').each(function () {
                    newval += parseInt($(this).attr('data-bitval'), 10);
                });
                o.val = newval;
            });
        },
        singleSelect: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined') {
                if (o.singleSelect !== makeBool(val)) {
                    o.singleSelect = makeBool(val);
                    if (o.singleSelect) {
                        el.find('div.table-caption').text('Day to Run');
                    }
                    else {
                        el.find('div.table-caption').text('Days to Run');
                    }
                }
            }
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined') {
                // Select the values based upon the incoming value.
                var hasSelection = false;
                el.find('div.table-cell.day').each(function () {
                    var cell = $(this);
                    var bitVal = parseInt(cell.attr('data-bitval'), 10);
                    if ((bitVal & val & 0xFF) === bitVal
                        && (!o.singleSelect || !hasSelection)) { // If we are a single selection only allow one.
                        cell.attr('data-selected', true);
                        hasSelection = true;
                    }
                    else {
                        cell.attr('data-selected', false);
                    }
                });
                o.val = val;
            }
            else return o.val;
        }
    });
})(jQuery); // Schedule Panel
