(function ($) {
    $.widget("pic.chemistry", {
        options: { },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initChemistry = function (data) { self._initChemistry(data); };
            el[0].setChlorinatorData = function (data) { self.setChlorinatorData(data); };
            el[0].setChemControllerData = function (data) { self.setChemControllerData(data); };
        },
        setChlorinatorData: function (data) {
            var self = this, o = self.options, el = self.element;
            if (data.isActive !== false && el.find('div.picChlorinator[data-id=' + data.id + ']').length === 0) {
                console.log(`RESETTING DIV`);
                var div = $('<div></div>');
                div.appendTo(el);
                div.chlorinator(data);
            }
            else
                el.find('div.picChlorinator[data-id=' + data.id + ']').each(function () { this.setEquipmentData(data); });
        },
        setChemControllerData: function (data) {
            var self = this, o = self.options, el = self.element;
            if (data.isActive !== false && el.find('div.picChemController[data-id=' + data.id + ']').length === 0) {
                var div = $('<div></div>');
                div.appendTo(el);
                div.chemController(data);
            }
            else
                el.find('div.picChemController[data-id=' + data.id + ']').each(function () { this.setEquipmentData(data); });
        },

        _initChemistry: function(data) {
            var self = this, o = self.options, el = self.element;
            el.empty();
            
            let div = $('<div class="picCircuitTitle control-panel-title"></div>');
            div.appendTo(el);
            let span = $('<span class="picCircuitTitle"></span>');
            span.appendTo(div);
            span.text('Chemistry');
            if (typeof data !== 'undefined' && data.chlorinators.length > 0) {
                el.show();
                for (let i = 0; i < data.chlorinators.length; i++) {
                    $('<div></div>').appendTo(el).chlorinator(data.chlorinators[i]);
                }
                for (let i = 0; i < data.chemControllers.length; i++) {
                    $('<div></div>').appendTo(el).chemController(data.chemControllers[i]);
                }
            }
            else el.hide(); 
        }
    });
    $.widget('pic.chlorinator', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setEquipmentData = function (data) { self.setEquipmentData(data); };
        },
        setEquipmentData: function (data) {
            var self = this, o = self.options, el = self.element;
            try {
                el.attr('data-saltrequired', data.saltRequired);
                if (data.isActive === false) el.hide();
                else el.show();
                el.attr('data-active', data.isActive === false ? false : true);
                //data.state = data.currentOutput > 0 ? 'on' : 'off';
                el.find('div.picChlorinatorState').attr('data-status', data.currentOutput > 0 ? 'on' : 'off');
                dataBinder.bind(el, data);
                let sc = el.find('div.picSuperChlor');
                if (data.superChlor) {
                    sc.show();
                    console.log(`WHAT IS o.superChlorTimer: ${o.superChlorTimer}`);
                    if (o.superChlorTimer) clearInterval(o.superChlorTimer);
                    console.log(`superChlorRem: ${data.superChlorRemaining}`);
                    if (data.superChlorRemaining > 0) {
                        console.log(`STARTING TIMER WITH ${data.superChlorRemaining}`);
                        o.superChlorTimer =  setInterval(function () { self.countdownSuperChlor(); }, 1000);
                        el.find('div.picSuperChlorBtn label.picSuperChlor').text('Cancel Chlorinate');
                        el.find('div.picSuperChlorBtn div.picIndicator').attr('data-status', 'on');
                    }
                }
                else {
                    if (o.superChlorTimer) clearInterval(o.superChlorTimer);
                    o.superChlorTimer = null;
                    sc.hide();
                    el.find('div.picSuperChlorBtn label.picSuperChlor').text('Super Chlorinate');
                    el.find('div.picSuperChlorBtn div.picIndicator').attr('data-status', 'off');
                }
                if (typeof data.status !== 'object' || data.status.val === 128) el.find('div.picSuperChlorBtn').hide();
                else el.find('div.picSuperChlorBtn').show();
                el.data('remaining', data.superChlorRemaining);
                if (typeof data.status !== 'undefined') el.attr('data-status', data.status.name);
                else el.attr('data-status', '');
            }
            catch (err) { console.log({ m: 'Error setting chlorinator data', err: err, chlor: data }); }
            var pnl = el.parents('div.picChemistry:first');
            if (pnl.find('div.picChlorinator[data-active=true], div.picChemController[data-active=true]').length > 0)
                pnl.show();
            else
                pnl.hide();
        },
        countdownSuperChlor: function () {
            console.log(`countdownSuperChlor called!`)
            var self = this, o = self.options, el = self.element;
            let rem = Math.max(el.data('remaining') - 1, 0);
            if (rem === 0) {clearInterval(el.superChlorTimer); el.superChlorTimer = null;}
            el.find('span.picSuperChlorRemaining').each(function () {
                $(this).text(dataBinder.formatDuration(rem));
            });
            console.log(`Time remaining: ${rem}`);
            el.data('remaining', rem);
        },
        putPoolSetpoint: function (setPoint) {
            var self = this, o = self.options, el = self.element;
            $.putApiService('state/chlorinator/poolSetpoint', { id: parseInt(el.attr('data-id'), 10), setPoint: setPoint }, function () { });

        },
        putSpaSetpoint: function (setPoint) {
            var self = this, o = self.options, el = self.element;
            $.putApiService('state/chlorinator/spaSetpoint', { id: parseInt(el.attr('data-id'), 10), setPoint: setPoint }, function () { });

        },
        putSuperChlorHours: function (hours) {
            var self = this, o = self.options, el = self.element;
            $.putApiService('state/chlorinator/superChlorHours', { id: parseInt(el.attr('data-id'), 10), hours: hours }, function () { });

        },
        putSuperChlorinate: function (bSet) {
            var self = this, o = self.options, el = self.element;
            if (!bSet) el.find('label.picSuperChlor').text('Cancelling...');
            else el.find('label.picSuperChlor').text('Initializing...');
            el.find('div.picToggleSuperChlor > div.picIndicator').attr('data-status', 'pending');
            $.putApiService('state/chlorinator/superChlorinate', { id: parseInt(el.attr('data-id'), 10), superChlorinate: bSet }, function () { });

        },
        _buildPopover: function () {
            var self = this, o = self.options, el = self.element;
            el.on('click', function (evt) {
                $.getApiService('/state/chlorinator/' + el.attr('data-id'), function (data, status, xhr) {
                    console.log(data);
                    var divPopover = $('<div class="picChlorSettings"></div>');
                    divPopover.appendTo(el);
                    divPopover.on('initPopover', function (evt) {
                        let saltReqd = parseFloat(el.attr('data-saltrequired'));
                        if (saltReqd > 0) $('<div class="picSaltReqd"><i class="fas fa-bell"></i><span> Add ' + (saltReqd/40).toFixed(2) + ' 40lb bags of salt</span></div>').appendTo(evt.contents());
                        if (data.body.val === 32 || data.body.val === 0) {
                            //let divSetpoint = $('<div class="picPoolSetpoint picSetpoint"><label class="picInline-label picSetpointText">Pool Set Point</label><div class="picValueSpinner" data-bind="poolSetpoint"></div></div>');
                            //divSetpoint.appendTo(evt.contents());
                            //divSetpoint.find('div.picValueSpinner').each(function () {
                            //    $(this).valueSpinner({ val: data.poolSetpoint, min: 0, max: 100, step: 1 });
                            //    $(this).on('change', function (e) { self.putPoolSetpoint(e.value); });
                            //});
                           
                            $('<div></div>').appendTo(evt.contents()).css({ display: 'block' }).valueSpinner({ binding: 'poolSetpoint',
                                canEdit: true, labelText: 'Pool Setpoint', min: 0, max: 100, step: 1, units: '%',
                                labelAttrs: { style: {width: '7rem'}}
                            }).on('change', function (e) {
                                    self.putPoolSetpoint(e.value);
                                });
                        }
                        if (data.body.val === 32 || data.body.val === 1) {
                            // Add in the spa setpoint.
                            //let divSetpoint = $('<div class="picSpaSetpoint picSetpoint"><label class="picInline-label picSetpointText">Spa Set Point</label><div class="picValueSpinner" data-bind="spaSetpoint"></div></div>');
                            //divSetpoint.appendTo(evt.contents());
                            //divSetpoint.find('div.picValueSpinner').each(function () {
                            //    $(this).valueSpinner({ val: data.spaSetpoint, min: 0, max: 100, step: 1 });
                            //    $(this).on('change', function (e) { self.putSpaSetpoint(e.value); });
                            //});
                            $('<div></div>').appendTo(evt.contents()).css({ display: 'block' }).valueSpinner({ binding: 'spaSetpoint',
                                canEdit: true, labelText: 'Spa Setpoint', min: 0, max: 100, step: 1, units: '%',
                                labelAttrs: { style: { width: '7rem' } }
                            }).on('change', function (e) {
                                    self.putSpaSetpoint(e.value);
                                });
                        }

                        //let divSuperChlorHours = $('<div class="picSuperChlorHours picSetpoint"><label class="picInline-label picSetpointText">Super Chlorinate</label><div class="picValueSpinner" data-bind="superChlorHours"></div><label class="picUnits">Hours</label></div>');
                        //divSuperChlorHours.appendTo(evt.contents());
                        //divSuperChlorHours.find('div.picValueSpinner').each(function () {
                        //    $(this).valueSpinner({ val: data.superChlorHours, min: 1, max: 96, step: 1 });
                        //    $(this).on('change', function (e) { self.putSuperChlorHours(e.value); });
                        //});
                        $('<div></div>').appendTo(evt.contents()).css({ display: 'block' }).valueSpinner({
                            binding: 'superChlorHours',
                            canEdit: true, labelText: 'Super Chlorinate', min: 1, max: 96, step: 1, units: 'hours',
                            labelAttrs: { style: { width: '7rem' } }
                        }).addClass('picPoolSetpoint').addClass('picSetpoint').
                            on('change', function (e) {
                                self.putSuperChlorHours(e.value);
                            });

                        // Add in the super chlorinate button.
                        let btn = $('<div class="picSuperChlorBtn btn"></div>');
                        btn.appendTo(evt.contents());

                        let toggle = $('<div class="picToggleSuperChlor"></div>');
                        toggle.appendTo(btn);
                        toggle.toggleButton();
                        let lbl = $('<div><div><label class="picSuperChlor">Super Chlorinate</label></div><div class="picSuperChlorRemaining"><span class="picSuperChlorRemaining" data-bind="superChlorRemaining" data-fmttype="duration"></span></div></div>');
                        lbl.appendTo(btn);
                        btn.on('click', function (e) {
                            e.preventDefault();
                            let bSet = makeBool(btn.find('div.picIndicator').attr('data-status') !== 'on');
                            self.putSuperChlorinate(bSet);
                        });
                        if (data.status.val === 128) btn.hide();
                        self.setEquipmentData(data);
                    });
                    divPopover.on('click', function (e) { e.stopImmediatePropagation(); e.preventDefault(); });
                    divPopover.popover({ title: 'Chlorinator Settings', popoverStyle: 'modal', placement: { target: evt.target } });
                    divPopover[0].show(evt.target);
                });
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });
        },
        _buildControls: function() {
            var self = this, o = self.options, el = self.element;
            el.addClass('picChlorinator');
            var div = $('<div class="picChlorinatorState picIndicator"></div>');
            el.attr('data-id', o.id);
            div.appendTo(el);
            div.attr('data-ison', o.currentOutput > 0);
            div.attr('data-status', o.currentOutput > 0 ? 'on' : 'off');

            $('<label class="picChlorinatorName" data-bind="name"></label>').appendTo(el);
            $('<span class="picSaltLevel picData"><label class="picInline-label">Salt</label><span class="picSaltLevel" data-bind="saltLevel" data-fmttype="number" data-fmtmask="#,##0" data-fmtempty="----"></span><label class="picUnits">ppm</label></span>').appendTo(el);
            $('<span class="picCurrentOutput picData"><label class="picInline-label">Output</label><span class="picCurrentOutput" data-bind="currentOutput"></span><label class="picUnits">%</label></span>').appendTo(el);

            $('<div class="picChlorStatus picData"><span class="picStatus" data-bind="status.desc"></span></div>').appendTo(el);
            $('<div class="picSuperChlor picData"><label class="picInline-label">Super Chlor:</label><span class="picSuperChlorRemaining" data-bind="superChlorRemaining" data-fmttype="duration"></span></div>').appendTo(el);
            self.setEquipmentData(o);
            self._buildPopover();
        }
    });
    $.widget('pic.chemController', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setEquipmentData = function (data) { self.setEquipmentData(data); };
        },
        setDosingStatus: function (stat, chem, type) {
            var self = this, o = self.options, el = self.element;
            if (typeof chem === 'undefined' || typeof chem.dosingStatus === 'undefined')
                stat.hide();
            else {
                switch (chem.dosingStatus.name) {
                    case 'dosing':
                        stat.empty();
                        var vol = !isNaN(chem.doseVolume) ? chem.doseVolume : 0;
                        var volDosed = !isNaN(chem.dosingVolumeRemaining) ? vol - chem.dosingVolumeRemaining : 0;
                        if (chem.delayTimeRemaining > 0) {
                            $('<span></span>').appendTo(stat).text(`Dosing ${type}: ${vol.format('#,##0')}mL`);
                            $('<span></span>').appendTo(stat).css({ float: 'right' }).text(`Delay: ${dataBinder.formatDuration(chem.delayTimeRemaining)}`);
                        }
                        else {
                            $('<span></span>').appendTo(stat).text(`Dosing ${type}: ${volDosed.format('#,##0')}mL of ${vol.format('#,##0')}mL - ${dataBinder.formatDuration(chem.dosingTimeRemaining)}`);
                        }
                        stat.show();
                        break;
                    case 'mixing':
                        stat.empty();
                        $('<span></span>').appendTo(stat).text(`Mixing ${type}: ${dataBinder.formatDuration(chem.mixTimeRemaining)}`);
                        stat.show();
                        break;
                    default:
                        stat.hide();
                        break;
                }
            }
        },
        setWarnings: function (data) {
            var self = this, o = self.options, el = self.element;
            var arr = [];
            // Put together the list of warnings.
            if (typeof data.status !== 'undefined' && data.status.val > 0) arr.push(data.status);
            if (typeof data.alarms !== 'undefined') {
                var alarms = data.alarms;
                if (typeof alarms.flowSensorFault !== 'undefined' && alarms.flowSensorFault.val > 0) arr.push(alarms.flowSensorFault);
                if (typeof alarms.pHPumpFault !== 'undefined' && alarms.pHPumpFault.val > 0) arr.push(alarms.pHPumpFault);
                if (typeof alarms.pHProbeFault !== 'undefined' && alarms.pHProbeFault.val > 0) arr.push(alarms.pHProbeFault);
                if (typeof alarms.orpPumpFault !== 'undefined' && alarms.orpPumpFault.val > 0) arr.push(alarms.orpPumpFault);
                if (typeof alarms.orpProbeFault !== 'undefined' && alarms.orpProbeFault.val > 0) arr.push(alarms.orpProbeFault);
                if (typeof alarms.chlorFault !== 'undefined' && alarms.chlorFault.val > 0) arr.push(alarms.chlorFault);
                if (typeof alarms.bodyFault !== 'undefined' && alarms.bodyFault.val > 0) arr.push(alarms.bodyFault);
                if (typeof alarms.flow !== 'undefined' && alarms.flow.val > 0) arr.push(alarms.flow);
                if (typeof alarms.pH !== 'undefined' && alarms.pH.val > 0) arr.push(alarms.pH);
                if (typeof alarms.pHTank !== 'undefined' && alarms.pHTank.val > 0) arr.push(alarms.pHTank);
                if (typeof alarms.orp !== 'undefined' && alarms.orp.val > 0) arr.push(alarms.orp);
                if (typeof alarms.orpTank !== 'undefined' && alarms.orpTank.val > 0) arr.push(alarms.orpTank);
            }

            if (typeof data.warnings !== 'undefined') {
                var warns = data.warnings;
                if (typeof warns.waterChemistry !== 'undefined' && warns.waterChemistry.val > 0) arr.push(warns.waterChemistry);
                if (typeof warns.chlorinatorCommError !== 'undefined' && warns.chlorinatorCommError.val > 0) arr.push(warns.chlorinatorCommError);
                if (typeof warns.invalidSetup !== 'undefined' && warns.invalidSetup.val > 0 && warns.invalidSetup.name !== 'ok') arr.push(warns.invalidSetup);
                if (typeof warns.pHDailyLimitReached !== 'undefined' && warns.pHDailyLimitReached.val > 0) arr.push(warns.pHDailyLimitReached);
                if (typeof warns.pHLockout !== 'undefined' && warns.pHLockout.val > 0) arr.push(warns.pHLockout);
                if (typeof warns.orpDailyLimitReached !== 'undefined' && warns.orpDailyLimitReached.val > 0) arr.push(warns.orpDailyLimitReached);
            }
            var divWarnings = el.find('div.chemcontroller-warnings');
            divWarnings.empty();
            if (arr.length > 0) divWarnings.show();
            else divWarnings.hide();
            for (var i = 0; i < arr.length; i++) {
                var w = arr[i];
                var warn = $('<div></div>').addClass('chemcontroller-warning').appendTo(divWarnings);
                // Add in the icon.
                $('<i></i>').addClass('fas').addClass('fa-exclamation-triangle').appendTo(warn);
                $('<span></span>').addClass('chemcontroller-warning-text').text(w.desc).appendTo(warn);
            }
        },
        setEquipmentData: function (data) {
            var self = this, o = self.options, el = self.element;
            try {
                if (data.isActive === false) el.hide();
                else el.show();
                el.attr('data-active', data.isActive === false ? false : true);
                el.find('div.picChemControllerState').attr('data-status', data.ph.pump.isDosing || data.orp.pump.isDosing ? 'on' : 'off');
                dataBinder.bind(el, data);
                if (typeof data.status !== 'undefined') el.attr('data-status', data.status.name);
                else el.attr('data-status', '');
            }
            catch (err) { console.log({ m: 'Error setting chem controller data', err: err, chlor: data }); }
            var pnl = el.parents('div.picChemistry:first');
            if (pnl.find('div.picChlorinator[data-active=true], div.picChemController[data-active=true]').length > 0) {
                pnl.show();
                // Now lets add in our status.
                self.setDosingStatus(el.find('div.chemcontroller-status-ph'), data.ph, 'pH');
                self.setDosingStatus(el.find('div.chemcontroller-status-orp'), data.orp, 'ORP');
                self.setWarnings(data);
            }
            else
                pnl.hide();
        },
        _buildPopover: function () {
            var self = this, o = self.options, el = self.element;
            el.on('click', function (evt) {
                $.getApiService('/state/chemController/' + el.attr('data-id'), function (data, status, xhr) {
                    console.log(data);
                    var divPopover = $('<div class="picChemControllerSettings"></div>');
                    divPopover.appendTo(el);
                    divPopover.on('initPopover', function (evt) {
                        var divSettings = $('<div></div>').appendTo(evt.contents()).css({ display: 'inline-block', verticalAlign: 'top', width:'347px' }).chemControllerSettings(data);
                    });
                    divPopover.on('click', function (e) { e.stopImmediatePropagation(); e.preventDefault(); });
                    divPopover.popover({ title: 'Chemistry Settings', popoverStyle: 'modal', placement: { target: evt.target } });
                    divPopover[0].show(evt.target);
                });
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picChemController');
            el.attr('data-id', o.id);

            var line = $('<div></div>').appendTo(el);
            var div = $('<div class="picChemControllerState picIndicator"></div>');
            div.appendTo(line);
            $('<label></label>').addClass('picControllerName').attr('data-bind', 'name').appendTo(line);
            let span = $('<span></span>').addClass('pHLevel').addClass('picData').appendTo(line);
            $('<label></label>').addClass('picInline-label').text('pH').appendTo(line);
            $('<span></span>').addClass('phLevel').attr('data-bind', 'ph.level').attr('data-fmttype', 'number').attr('data-fmtmask', '#,##0.0#').attr('data-emptymask', '-.-').appendTo(line);
            span = $('<span></span>').addClass('orpLevel').addClass('picData').appendTo(line);
            $('<label></label>').addClass('picInline-label').text('ORP').appendTo(line);
            $('<span></span>').addClass('phLevel').attr('data-bind', 'orp.level').attr('data-fmttype', 'number').attr('data-fmtmask', '#,##0.0').attr('data-emptymask', '-.-').appendTo(line);
            span = $('<span></span>').addClass('lsiIndex').addClass('picData').appendTo(line);
            $('<label></label>').addClass('picInline-label').text('Bal').appendTo(line);
            $('<span></span>').addClass('saturationIndex').attr('data-bind', 'saturationIndex').attr('data-fmttype', 'number').attr('data-fmtmask', '#,##0.#').attr('data-emptymask', '-.-').appendTo(line);

            //$('<span class="orpLevel picData"><label class="picInline-label">ORP</label><span class="orpLevel" data-bind="orp.probe.level"></span></span>').appendTo(line);
            //$('<span class="lsiIndex picData"><label class="picInline-label">Bal</label><span class="saturationIndex" data-bind="saturationIndex"></span></span>').appendTo(line);

            //$('<div class="picChlorStatus picData"><span class="picStatus" data-bind="status.desc"></span></div>').appendTo(el);
            $('<div></div>').addClass('chemcontroller-status').addClass('chemcontroller-status-ph').appendTo(el).hide();
            $('<div></div>').addClass('chemcontroller-status').addClass('chemcontroller-status-orp').appendTo(el).hide();
            $('<div></div>').addClass('chemcontroller-warnings').appendTo(el).hide();
            self.setEquipmentData(o);
            self._buildPopover();
        }
    });
    $.widget('pic.chemControllerSettings', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setEquipmentData = function (data) { self.setEquipmentData(data); };
        },
        setEquipmentData: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picChemLevel[data-chemtype="pH"]').each(function () {
                this.val(data.ph.level);
            });
            el.find('div.picChemLevel[data-chemtype="ORP"]').each(function () {
                this.val(data.orp.level);
            });
            if (typeof data.orp.pump.type !== 'undefined') {
                if ((data.orp.enabled && data.orp.pump.type.name !== 'none' && data.orp.useChlorinator !== true) || data.type.name === 'intellichem') {
                    el.find('div.picChemTank[data-chemtype="orp"]').show();
                    el.find('div.daily-dose[data-chemtype="orp"]').show();
                }
                else {
                    el.find('div.picChemTank[data-chemtype="orp"]').hide();
                    el.find('div.daily-dose[data-chemtype="orp"]').hide();
                }
            }
            if (typeof data.ph.pump.type !== 'undefined') {
                if ((data.ph.enabled && data.ph.pump.type.name !== 'none') || data.type.name === 'intellichem') {
                    el.find('div.picChemTank[data-chemtype="acid"]').show();
                    el.find('div.daily-dose[data-chemtype="acid"]').show();
                }
                else {
                    el.find('div.picChemTank[data-chemtype="acid"]').hide();
                    el.find('div.daily-dose[data-chemtype="acid"]').hide();
                }
            }
            // If we are dosing I need to kill the manual dose window as well as change the buttons
            // to stop dosing.
            if (typeof data.ph !== 'undefined' && typeof data.ph.dosingStatus !== 'undefined') {
                if (data.ph.dosingStatus.name !== 'dosing') {
                    // Change the button to stop dosing.
                    if (data.flowDetected === false || data.isBodyOn === false)
                        el.find('div#btnDoseAcid').hide();
                    else
                        el.find('div#btnDoseAcid').show();
                    el.find('div#btnCancelAcid').hide();
                }
                else {
                    el.find('div#btnCancelAcid').show();
                    el.find('div#btnDoseAcid').hide();
                }
            }
            if (typeof data.orp !== 'undefined' && typeof data.orp.dosingStatus !== 'undefined') {
                if (data.orp.dosingStatus.name !== 'dosing') {
                    // Change the button to stop dosing.
                    if (data.flowDetected === false || data.isBodyOn === false)
                        el.find('div#btnDoseOrp').hide();
                    else
                        el.find('div#btnDoseOrp').show();
                    el.find('div#btnCancelOrp').hide();
                }
                else {
                    el.find('div#btnCancelOrp').show();
                    el.find('div#btnDoseOrp').hide();
                }
            }
            self.dataBind(data);
        },
        dataBind: function (data) {
            var self = this, o = self.options, el = self.element;
            var ph = data.ph;
            var orp = data.orp;
            if (typeof ph !== 'undefined' && typeof ph.tolerance !== 'undefined') {
                el.find('div.picChemLevel[data-chemtype="pH"]').each(function () {
                    this.scales([
                        { class: 'chemLevel-lred', min: 6.7, max: ph.tolerance.low - .2, labelEnd: (ph.tolerance.low - .2).format('0.0') },
                        { class: 'chemLevel-lyellow', min: ph.tolerance.low - .2, max: ph.tolerance.low, labelEnd: ph.tolerance.low.format('0.0') },
                        { class: 'chemLevel-green', min: ph.tolerance.low, max: ph.tolerance.high, labelEnd: ph.tolerance.high.format('0.0') },
                        { class: 'chemLevel-ryellow', min: ph.tolerance.high, max: ph.tolerance.high + .2, labelEnd: (ph.tolerance.high + .2).format('0.0') },
                        { class: 'chemLevel-rred', min: ph.tolerance.high + .2, max: 8.4, labelEnd: '' }]);
                });
            }
            if (typeof orp !== 'undefined' && typeof orp.tolerance !== 'undefined') {
                el.find('div.picChemLevel[data-chemtype="ORP"]').each(function () {
                    this.scales([
                        { class: 'chemLevel-lred', min: 400, max: orp.tolerance.low - 150, labelEnd: (orp.tolerance.low - 150).format('0') },
                        { class: 'chemLevel-lyellow', min: orp.tolerance.low - 150, max: orp.tolerance.low, labelEnd: orp.tolerance.low.format('0') },
                        { class: 'chemLevel-green', min: orp.tolerance.low, max: orp.tolerance.high, labelEnd: orp.tolerance.high.format('0') },
                        { class: 'chemLevel-ryellow', min: orp.tolerance.high, max: orp.tolerance.high + 100, labelEnd: (orp.tolerance.high + 100).format('0') },
                        { class: 'chemLevel-rred', min: orp.tolerance.high + 100, max: 1000, labelEnd: '' }
                    ]);

                });
            }
            dataBinder.bind(el, data);
        },
        _createTankAttributesDialog(chemType, tankElem) {
            var self = this, o = self.options, el = self.element;
            var tank = tankElem[0].tank();
            console.log(tank);
            var chemName = tank.chemType ? tank.chemType.charAt(0).toUpperCase() + tank.chemType.slice(1) : chemType;
            var dlg = $.pic.modalDialog.createDialog('dlgChemTankAttributes', {
                width: '447px',
                height: 'auto',
                title: `${chemName} Supply Tank Level`,
                position: { my: "center bottom", at: "center top", of: el },
                buttons: [
                    {
                        text: 'Save', icon: '<i class="fas fa-save"></i>',
                        click: function (e) {
                            var t = { id: parseInt(el.attr('data-eqid'), 10) };
                            t[chemType.toLowerCase()] = { tank: dataBinder.fromElement(dlg) };
                            $.pic.modalDialog.closeDialog(this);
                            $.putApiService('/state/chemController', t, function (c, status, xhr) {
                                self.setEquipmentData(c);
                            });
                        }
                    },
                    {
                        text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }
                ]
            });
            $('<div></div>').appendTo(dlg).html(`Set the current level for the tank.  As ${chemName.toLowerCase()} is pumped from the tank the level will be reduced by the amount of the chemical dose.`);
            $('<hr></hr>').appendTo(dlg).css({ margin: '2px' });
            var divPnl = $('<div></div>').appendTo(dlg).css({ display: 'inline-block' });
            var line = $('<div></div>').appendTo(divPnl);

            var capacity = $('<div></div>').appendTo(line).staticField({
                labelText: 'Capacity', dataType: 'number',
                units: tank.units, value: tank.capacity, fmtMask: '#,##0.###',
                labelAttrs: { style: { width: '4.7rem' } }
            });
            line = $('<div></div>').appendTo(divPnl);
            var qty = $('<div></div>').appendTo(line).valueSpinner({
                canEdit: true, labelText: 'Level', binding: 'level', min: 0, max: tank.capacity, step: tankElem[0].incrementStep(),
                fmtMask: tankElem.attr('data-fmtMask'),
                labelAttrs: { style: { width: '4.7rem' } },
                inputAttrs: { style: { width: '7rem' } }
            }).on('change', function (e) {
                pct.text(`${capacity[0].val() !== 0 ? Math.round((qty[0].val() / capacity[0].val()) * 100) : 0}%`);
            });

            divPnl = $('<div></div>').appendTo(dlg).css({ display: 'inline-block' });
            let pct = $('<div></div>').appendTo(divPnl).addClass('tank-attr-percent').css({ fontSize: '2em', textAlign: 'center', padding: '.5em' });
            dataBinder.bind(dlg, tank);
            pct.text(`${tank.capacity !== 0 ? Math.round((tank.level / tank.capacity) * 100) : 0}%`);
            dlg.css({ overflow: 'visible' });
        },
        _createManualDoseDialog(chemical, chemType, elBtn) {
            var self = this, o = self.options, el = self.element;
            var chemName = chemical.charAt(0).toUpperCase() + chemical.slice(1);
            var dlg = $.pic.modalDialog.createDialog('dlgManualChemDose', {
                width: '357px',
                height: 'auto',
                title: `Start Manual ${chemName} Dose`,
                position: { my: "center top", at: "center top", of: el },
                buttons: [
                    {
                        text: 'Start Dosing', icon: '<i class="fas fa-fill-drip"></i>',
                        click: function (e) {
                            var d = dataBinder.fromElement(dlg);
                            d = $.extend(true, d, { id: parseInt(el.attr('data-eqid'), 10), chemType: chemType });
                            console.log(d);
                            $.pic.modalDialog.closeDialog(this);
                            $.putApiService('/state/chemController/manualDose', d, function (c, status, xhr) {
                                self.setEquipmentData(c);
                            });
                        }
                    },
                    {
                        text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }
                ]
            });
            $('<div></div>').appendTo(dlg).html(`Supply a manual ${chemName.toLowerCase()} dose amount in mL.  Then press the Start Dosing button.`);
            $('<hr></hr>').appendTo(dlg).css({ margin: '2px' });
            var divPnl = $('<div></div>').appendTo(dlg).css({ display: 'inline-block' });
            var line = $('<div></div>').appendTo(divPnl);
            $('<div></div>').appendTo(line).valueSpinner({
                canEdit: true, labelText: 'Dose Amount', binding: 'volume', min: 0, max: 1000, step: 10,
                fmtMask: '#,##0', units:'mL',
                labelAttrs: { style: { marginRight: '.15rem' } },
                inputAttrs: { style: { width: '7rem' } }
            }).on('change', function (e) {

                });
            divPnl = $('<div></div>').appendTo(dlg).css({ display: 'inline-block' });
            dlg.css({ overflow: 'visible' });
        },
        _confirmCancelDose: function (chemical, chemType) {
            var self = this, o = self.options, el = self.element;
            $.pic.modalDialog.createConfirm('dlgConfirmCancelDosing', {
                message: `Are you sure you want to Cancel ${chemical} dosing?`,
                width: '350px',
                height: 'auto',
                title: 'Confirm Cancel Dosing',
                buttons: [{
                    text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                    click: function () {
                        var d = { id: parseInt(el.attr('data-eqid'), 10), chemType: chemType };
                        console.log(d);
                        $.pic.modalDialog.closeDialog(this);
                        $.putApiService('/state/chemController/cancelDosing', d, function (c, status, xhr) {
                            self.setEquipmentData(c);
                        });
                    }
                },
                {
                    text: 'No', icon: '<i class="far fa-window-close"></i>',
                    click: function () { $.pic.modalDialog.closeDialog(this); }
                }]
            });
        },
        saveControllerState: function () {
            var self = this, o = self.options, el = self.element;
            var cont = dataBinder.fromElement(el);
            // Don't save the tank data.
            console.log(cont);
            cont.orp.tank = undefined;
            cont.ph.tank = undefined;
            $.putApiService('/state/chemController', cont, function (c, status, xhr) {
                self.setEquipmentData(c);
            });

        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            var divLine = $('<div></div>').appendTo(el);
            var grpSetpoints = $('<fieldset></fieldset>').css({ display: 'inline-block', verticalAlign: 'top', width: '100%' }).appendTo(divLine);
            var data = o;
            el.addClass('pnl-chemcontroller-settings');
            el.attr('data-eqid', data.id);
            $('<input type="hidden"></input>').appendTo(el).attr('data-dataType', 'int').attr('data-bind', 'id');
            $('<legend></legend>').text('Setpoints').appendTo(grpSetpoints);
            divLine = $('<div></div>').appendTo(grpSetpoints);
            $('<input type="hidden"></input>').attr('data-bind', 'id').attr('data-datatype', 'int').val(data.id).appendTo(divLine);
            var type = typeof data !== 'undefined' && typeof data.type !== 'undefined' ? data.type : { val: 0 };
            var phRange = type.ph || { min: 7.2, max: 7.6 };

            $('<div></div>').appendTo(divLine).valueSpinner({ canEdit: true, labelText: 'pH', binding: 'ph.setpoint', min: phRange.min, max: phRange.max, step: .1, units: '', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginRight: '.25rem' } } })
                .on('change', function (e) {
                    el.find('div.picChemLevel[data-chemtype=pH').each(function () {
                        this.target(e.value);
                    });
                });
            $('<div></div>').appendTo(divLine).valueSpinner({ canEdit: true, labelText: 'ORP', binding: 'orp.setpoint', min: 400, max: 800, step: 10, units: 'mV', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginRight: '.25rem', marginLeft: '2rem' } } })
                .on('change', function (e) {
                    el.find('div.picChemLevel[data-chemtype=ORP').each(function () {
                        this.target(e.value);
                    });
                });

            divLine = $('<div></div>').appendTo(el);
            var grpIndex = $('<fieldset></fieldset>').css({ display: 'inline-block', verticalAlign: 'top', width: '100%' }).appendTo(divLine);
            $('<legend></legend>').text('Index Values').appendTo(grpIndex);
            divLine = $('<div></div>').appendTo(grpIndex);
            $('<div></div>').appendTo(divLine).valueSpinner({ labelText: 'Total Alkalinity', canEdit: true, binding: 'alkalinity', min: 25, max: 800, step: 10, units: 'ppm', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '8.3rem', marginRight: '.25rem' } } });
            divLine = $('<div></div>').appendTo(grpIndex);
            $('<div></div>').appendTo(divLine).valueSpinner({ labelText: 'Calcium Hardness', canEdit: true, binding: 'calciumHardness', min: 25, max: 800, step: 1, units: 'ppm', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '8.3rem', marginRight: '.25rem' } } });
            divLine = $('<div></div>').appendTo(grpIndex);
            $('<div></div>').appendTo(divLine).valueSpinner({ labelText: 'Cyanuric Acid', canEdit: true, binding: 'cyanuricAcid', min: 0, max: 201, step: 1, units: 'ppm', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '8.3rem', marginRight: '.25rem' } } });
            if (data.type.name !== 'intellichem') {
                divLine = $('<div></div>').appendTo(grpIndex);
                $('<div></div>').appendTo(divLine).valueSpinner({ labelText: 'Borates', canEdit: true, binding: 'borates', min: 0, max: 201, step: 1, units: 'ppm', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '8.3rem', marginRight: '.25rem' } } });
            }
            var grpLevels = $('<fieldset></fieldset>').css({ display: 'inline-block', verticalAlign: 'top', width: '100%' }).appendTo(el);
            $('<legend></legend>').text('Current Levels').appendTo(grpLevels);
            divLine = $('<div></div>').css({ display: 'inline-block', verticalAlign: 'top' }).appendTo(grpLevels);
            var divVal = $('<div></div>').appendTo(divLine).css({ display: 'inline-block', verticalAlign: 'top', textAlign: 'center' });
            $('<div></div>').addClass('chem-balance-label').text('Water Balance').appendTo(divVal);
            $('<div></div>').addClass('chem-balance-value').attr('data-bind', 'saturationIndex').attr('data-fmtmask', '#,##0.0').attr('data-fmttype', 'number').appendTo(divVal);
            var divTotal = $('<div></div>').appendTo(divVal).addClass('chem-daily').addClass('ph').css({ textAlign: 'left' });
            $('<div></div>').appendTo(divTotal).text('Dosed last 24hrs').css({ fontSize: '10pt', lineHeight:'1' });
            $('<hr></hr>').appendTo(divTotal).css({ margin: '1px' });
            $('<div></div>').addClass('daily-dose').attr('data-chemtype', 'acid').appendTo(divTotal).staticField({ labelText: 'Acid', binding: 'ph.dailyVolumeDosed', dataType: 'number', fmtMask: '#,##0', emptyMask: '----', units: 'mL', inputAttrs: { style: { width: '2.25rem', textAlign: 'right', display: 'inline-block' } }, labelAttrs: { style: { width: '3.3rem' } } }).css({ fontSize: '10pt', display: 'block', lineHeight: '1' });
            $('<div></div>').addClass('daily-dose').attr('data-chemtype', 'orp').appendTo(divTotal).staticField({ labelText: 'Chlorine', binding: 'orp.dailyVolumeDosed', dataType: 'number', fmtMask: '#,##0', emptyMask: '----', units: 'mL', inputAttrs: { style: { width: '2.25rem', textAlign: 'right', display: 'inline-block' } }, labelAttrs: { style: { width: '3.3rem' } } }).css({ fontSize: '10pt', display: 'block', lineHeight: '1' });
        


            // A good balanced saturationIndex is between +- 0.3

            divLine = $('<div></div>').css({ display: 'inline-block', margin: '0px auto', width: '210px', textAlign: 'center' }).appendTo(grpLevels);
            $('<div></div>').chemTank({
                chemType: 'acid', labelText: 'Acid Tank',
                max: data.ph.tank.capacity || 0
            }).css({ width: '80px', height: '120px' }).attr('data-bind', 'ph.tank').attr('data-datatype', 'number').appendTo(divLine)
                .on('click', function (evt) {
                    self._createTankAttributesDialog('pH', $(evt.currentTarget));
                }).hide();


            $('<div></div>').chemTank({
                chemType: 'orp', labelText: 'ORP Tank',
                max: data.orp.tank.capacity || 0
            }).css({ width: '80px', height: '120px' }).attr('data-bind', 'orp.tank').attr('data-datatype', 'number').appendTo(divLine)
                .on('click', function (evt) {
                    self._createTankAttributesDialog('ORP', $(evt.currentTarget));
                }).hide();
            divLine = $('<div></div>').appendTo(grpLevels).css({ textAlign: 'center' });
            if (data.ph.enabled === true && data.ph.pump.type.val !== 0) {
                var divBtnAcidCont = $('<div></div>').appendTo(divLine).addClass('divDoseOrp').css({ display: 'inline-block' });
                $('<div></div>').appendTo(divBtnAcidCont).actionButton({ id: 'btnDoseAcid', text: 'Dose Acid', icon: '<i class="fas fa-fill-drip"></i>' }).css({ width: '9rem', textAlign: 'left' })
                    .on('click', function (evt) {
                        self._createManualDoseDialog('Acid', 'ph');
                    }).hide();
                $('<div></div>').appendTo(divBtnAcidCont).actionButton({ id: 'btnCancelAcid', text: 'Stop Acid', icon: '<i class="burst-animated fas fa-fill-drip"></i>' }).css({ width: '9rem', textAlign: 'left' })
                    .on('click', function (evt) {
                        self._confirmCancelDose('Acid', 'ph');
                    }).hide();
            }
            if (data.orp.enabled === true && data.orp.pump.type.val !== 0 && data.orp.useChlorinator !== true) {
                var divBtnOrpCont = $('<div></div>').appendTo(divLine).addClass('divDoseOrp').css({ display: 'inline-block' });
                $('<div></div>').appendTo(divBtnOrpCont).actionButton({ id: 'btnDoseOrp', text: 'Dose Chlorine', icon: '<i class="fas fa-fill-drip"></i>' }).css({ width: '9rem', textAlign: 'left' })
                    .on('click', function (evt) {
                        self._createManualDoseDialog('Chlorine', 'orp');
                    }).hide();
                $('<div></div>').appendTo(divBtnOrpCont).actionButton({ id: 'btnCancelOrp', text: 'Stop Chlorine', icon: '<i class="burst-animated fas fa-fill-drip"></i>' }).css({ width: '9rem', textAlign: 'left' })
                    .on('click', function (evt) {
                        self._confirmCancelDose('Chlorine', 'orp');
                    }).hide();
            }
            divLine = $('<div></div>').appendTo(grpLevels);
            pHLvl = $('<div></div>').chemLevel({
                labelText: 'pH', chemType: 'pH', min: 6.7, max: 8.4,
                fmtMask: '#,##0.##',
                scales: [
                    { class: 'chemLevel-lred', min: 6.7, max: 7.0, labelEnd: '7.0' },
                    { class: 'chemLevel-lyellow', min: 7.0, max: 7.2, labelEnd: '7.2' },
                    { class: 'chemLevel-green', min: 7.2, max: 7.6, labelEnd: '7.6' },
                    { class: 'chemLevel-ryellow', min: 7.6, max: 7.9, labelEnd: '7.9' },
                    { class: 'chemLevel-rred', min: 7.9, max: 8.4, labelEnd: '' }
                ]
            }).appendTo(divLine);
            pHLvl[0].target(data.ph.setpoint);
            pHLvl[0].val(data.ph.level);

            divLine = $('<div></div>').appendTo(grpLevels);
            orpLvl = $('<div></div>').chemLevel({
                labelText: 'ORP', chemType: 'ORP', min: 400, max: 1000,
                fmtMask: '#,##0.##',
                scales: [
                    { class: 'chemLevel-lred', min: 400, max: 500, labelEnd: '500' },
                    { class: 'chemLevel-lyellow', min: 500, max: 650, labelEnd: '650' },
                    { class: 'chemLevel-green', min: 650, max: 800, labelEnd: '800' },
                    { class: 'chemLevel-ryellow', min: 800, max: 900, labelEnd: '900' },
                    { class: 'chemLevel-rred', min: 900, max: 1000, labelEnd: '' }
                ]
            }).appendTo(divLine);
            orpLvl[0].target(data.orp.setpoint);
            orpLvl[0].val(data.orp.level);
            self.setEquipmentData(data);
            el.on('change', 'div.picValueSpinner', function () {
                self.saveControllerState();
            });
        }
    });

})(jQuery);
