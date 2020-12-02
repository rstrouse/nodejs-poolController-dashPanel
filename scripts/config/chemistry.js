(function ($) {
    $.widget('pic.configChemistry', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].getREMServers = function () { return self.getREMServers(); };
        },
        getREMServers: function () {
            var self = this, o = self.options, el = self.element;
            try {
                return new Promise((resolve, reject) => {
                    $.getApiService('/config/options/rem', null, function (opts, status, xhr) {
                        resolve(opts);
                    });
                });
            } catch (err) { console.log(err); }
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgChemControllers');
            var chlorOpts;
            var chemOpts;
            var pnl = $('<div></div>').addClass('pnlControllers').appendTo(el);
            $.getApiService('/config/options/chlorinators', null, function (opts, status, xhr) {
                console.log(opts);
                chlorOpts = opts;
                for (var i = 0; i < opts.chlorinators.length; i++) {
                    $('<div></div>').appendTo(pnl).pnlChlorinatorConfig(opts)[0].dataBind(opts.chlorinators[i]);
                }
            });
            $.getApiService('/config/options/chemControllers', null, function (opts, status, xhr) {
                console.log(opts);
                chemOpts = opts;
                for (var i = 0; i < opts.controllers.length; i++) {
                    $('<div></div>').appendTo(pnl).pnlChemControllerConfig(opts)[0].dataBind(opts.controllers[i]);
                }
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                var btnAdd = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Add Controller', icon: '<i class="fas fa-plus" ></i>' });
                //btnAdd[0].disabled(true);
                btnAdd.on('click', function (e) {
                    //return;
                    //var features = el.find('div.picConfigCategory.cfgChemControllers');
                    //$(this).addClass('disabled');
                    //$(this).find('i').addClass('burst-animated');
                    //var pnl = $('<div></div>').insertBefore(btnPnl).pnlChemControllerConfig(opts);
                    //pnl[0].dataBind({ id: -1, eggTimer: 720, name: 'Feature ' + (opts.features.length + 1), type: 0, showInFeatures: true });
                    //pnl.find('div.picAccordian:first')[0].expanded(true);
                    var dlg = $.pic.modalDialog.createDialog('dlgSelectControllerType', {
                        message: 'Select a Controller Type',
                        width: '400px',
                        height: 'auto',
                        title: 'New Controller Type',
                        buttons: [{
                            text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                            click: function () { $.pic.modalDialog.closeDialog(this); }
                        }]
                    });
                    var line = $('<div></div>').appendTo(dlg);
                    $('<div></div>').appendTo(line).addClass('status-text').css({ padding: '.5rem' }).text('Select the type of chemistry equipment you would like to add.  If selecting a chemistry controller like IntelliChem select a sub-type from the dropdown.');
                    line = $('<div></div>').appendTo(dlg);
                    $('<hr></hr>').appendTo(line);
                    line = $('<div></div>').css({ textAlign: 'center' }).appendTo(dlg);
                    var divSelection = $('<div></div>').addClass('picButton').addClass('chemController-type').addClass('chlorinator').addClass('btn').css({ width: '177px', height: '97px', verticalAlign: 'middle' })
                        .appendTo(line)
                        .on('click', function (e) {
                            var btn = $(e.currentTarget);
                            if (btn.hasClass('disabled')) return;
                            var divChlorinator = $('<div></div>').appendTo(pnl).pnlChlorinatorConfig(opts);
                            divChlorinator[0].dataBind({
                                id: -1,
                                name: 'IntelliChlor' + (el.find('div.cfgChlorinator').length),
                                poolSetpoint: 50,
                                spaSetpoint: 10,
                                superChlorHours: 8
                            });
                            divChlorinator.find('div.picAccordian:first').each(function () { this.expanded(true); });
                            $.pic.modalDialog.closeDialog(dlg[0]);

                        });

                    $('<div></div>').css({ textAlign: 'center' }).appendTo(divSelection).append('<i class="fas fa-soap" style="font-size:30pt;"></i>');
                    $('<div></div>').css({ textAlign: 'center' }).appendTo(divSelection).text('Chlorinator');
                    if (el.find('div.picConfigCategory.cfgChlorinator').length >= chlorOpts.maxChlorinators) {
                        divSelection.addClass('disabled');
                        $('<div></div>').css({ textAlign: 'center', fontSize: '8pt' }).appendTo(divSelection).text('Max Chlorinators Added');
                    }
                    divSelection = $('<div></div>').addClass('picButton').addClass('chemController-type').addClass('chemController').addClass('btn').css({ width: '177px', height: '97px', verticalAlign: 'middle' })
                        .appendTo(line)
                        .on('mouseover', function (e) {
                            $(e.currentTarget).addClass('button-hover');
                        })
                        .on('mouseout', function (e) {
                            $(e.target).removeClass('button-hover');
                        })
                        .on('mousedown', function (e) {
                            $(e.currentTarget).addClass('button-active');
                        })
                        .on('mouseup', function (e) {
                            $(e.currentTarget).removeClass('button-active');
                        })
                        .on('click', function (e) {
                            var btn = $(e.currentTarget);
                            if (dataBinder.checkRequired(btn)) {
                                var data = dataBinder.fromElement(btn);
                                var type = chemOpts.types.find(elem => elem.val === data.type);
                                var cm = el.find('div.cfgChemController[data-controllertype=' + type.val + ']');
                                switch (type.name) {
                                    case 'intellichem':
                                        if (el.find('div.cfgChemController[data-controllertype=' + type.val + ']').length >= chemOpts.maxChemControllers) {
                                            $('<div></div>').appendTo(btn.find('div.picPickList')).fieldTip({
                                                message: '<div>Only' + chemOpts.maxChemControllers + ' IntelliChem controller(s)</div><div>are supported by your Panel.</div>'
                                            });
                                            return;
                                        }
                                        break;
                                }
                                var divController = $('<div></div>').appendTo(pnl).pnlChemControllerConfig(opts);
                                divController[0].dataBind({
                                    id: -1,
                                    type: type.val,
                                    name: type.desc + (el.find('div.cfgChemController[data-controllertype=' + type.val + ']').length + 1),
                                    phSetpoint: 7,
                                    orpSetpoint: 400,
                                    alkalinity: 25,
                                    calciumHardness: 25,
                                    cyanuricAcid: 0
                                });
                                divController.find('div.picAccordian:first').each(function () { this.expanded(true); });
                                $.pic.modalDialog.closeDialog(dlg[0]);
                            }
                        });
                    var chemTypes = [];
                    for (var i = 0; i < chemOpts.types.length; i++) {
                        console.log(chemOpts.types[i].name);
                        switch (chemOpts.types[i].name) {
                            case 'none':
                            case 'unknown':
                                break;
                            default:
                                chemTypes.push(chemOpts.types[i]);
                                break;
                        }
                    }
                    $('<div></div>').css({ textAlign: 'center' }).appendTo(divSelection).append('<i class="fas fa-flask" style="font-size:30pt;"></i>');
                    $('<div></div>').css({ textAlign: 'center' }).appendTo(divSelection).text('Chem Controller');
                    $('<div></div>').appendTo(divSelection).pickList({
                        required: true,
                        style: { textAlign: 'left' },
                        bindColumn: 0, displayColumn: 2, labelText: 'Chem Controller Type<br/>', binding: 'type',
                        columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Type', style: { whiteSpace: 'nowrap' } }],
                        items: chemTypes, inputAttrs: { style: { width: '7rem', marginLeft: '1.15rem' } }, labelAttrs: { style: { marginLeft: '1.15rem', display: 'none' } }
                    }).on('mouseover', function (e) {
                        divSelection.removeClass('button-hover');
                        e.stopPropagation();
                    }).on('mousedown', function (e) {
                        e.stopImmediatePropagation();

                    });
                    dlg.css({ overflow: 'visible' });

                });
            });
        }
    });
    $.widget('pic.pnlChemSetpoints', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('pnl-chemcontroller-setpoints');
            var binding = o.binding || '';
            var grpSetpoints = $('<fieldset></fieldset>').css({ display: 'inline-block', verticalAlign: 'top' }).appendTo(el);
            $('<legend></legend>').text('Setpoints').appendTo(grpSetpoints);
            var line = $('<div></div>').appendTo(grpSetpoints);
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'pH Setpoint', binding: binding + 'ph.setpoint', fmtMask: "#,##0.#", emptyMask: "-.-", min: 7.0, max: 7.6, step: .1, units: '', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '6.4rem', marginRight: '.25rem' } } });
            line = $('<div></div>').appendTo(grpSetpoints);
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'ORP Setpoint', binding: binding + 'orp.setpoint', fmtMask: "#,##0", emptyMask: "---", min: 400, max: 800, step: 10, units: 'mV', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '6.4rem', marginRight: '.25rem' } } });

            var grpIndex = $('<fieldset></fieldset>').css({ display: 'inline-block', verticalAlign: 'top' }).appendTo(el);
            $('<legend></legend>').text('Index Values').appendTo(grpIndex);
            line = $('<div></div>').appendTo(grpIndex);
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'Total Alkalinity', fmtMask:"#,##0", emptyMask:"---", binding: binding + 'alkalinity', min: 25, max: 800, step: 10, units: 'ppm', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '8.3rem', marginRight: '.25rem' } } });
            line = $('<div></div>').appendTo(grpIndex);
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'Calcium Hardness', fmtMask: "#,##0", emptyMask: "---", binding: binding + 'calciumHardness', min: 25, max: 800, step: 1, units: 'ppm', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '8.3rem', marginRight: '.25rem' } } });
            line = $('<div></div>').appendTo(grpIndex);
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'Cyanuric Acid', fmtMask: "#,##0", emptyMask: "---", binding: binding + 'cyanuricAcid', min: 0, max: 201, step: 1, units: 'ppm', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '8.3rem', marginRight: '.25rem' } } });
        }
    });
    $.widget('pic.pnlChemPhSettings', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('pnl-chemcontroller-phsettings');
            var sec = $('<div></div>').appendTo(el).css({ display: 'inline-block', verticalAlign: 'top', paddingRight:'1rem' });
            $('<div></div>').appendTo(sec).checkbox({ labelText: 'pH Enabled', binding: 'ph.enabled' });
            //sec = $('<div></div>').appendTo(el).css({ display: 'inline-block', verticalAlign: 'top' });
            var grpDose = $('<fieldset></fieldset>').css({ display: 'block', verticalAlign: 'top' }).appendTo(sec);
            $('<legend></legend>').text('Dosing Parameters').appendTo(grpDose);
            line = $('<div></div>').appendTo(grpDose);
            $('<div></div>').appendTo(line).pickList({
                binding: 'ph.phSupply',
                bindColumn: 0, displayColumn: 2,
                labelText: 'Dose',
                columns: [{ binding: 'val', text: 'val', hidden: true }, { binding: 'name', text: 'name', hidden: true }, { binding: 'desc', text: 'Method', style: { whiteSpace: 'nowrap' } }],
                items: o.phSupplyTypes,
                inputAttrs: { style: { width: '5.1rem' } },
                labelAttrs: { style: { width: '3rem' } }
            })
                .on('selchanged', function (evt) {
                    if (evt.newItem.name === 'acid') el.find('.pnl-acidType').show();
                    else el.find('.pnl-acidType').hide();

                });
            $('<div></div>').appendTo(line).pickList({
                binding: 'ph.dosingMethod',
                bindColumn: 0, displayColumn: 2,
                labelText: 'By',
                columns: [{ binding: 'val', text: 'val', hidden: true }, { binding: 'name', text: 'name', hidden: true }, { binding: 'desc', text: 'Method', style: { whiteSpace: 'nowrap' } }],
                items: o.dosingMethods,
                inputAttrs: { style: { width: '7rem' } },
                labelAttrs: { style: { marginLeft:'.25rem' } }
            })
                .on('selchanged', function (evt) {
                    switch (evt.newItem.name) {
                        case 'time':
                            el.find('div.pnl-phDose-time').show();
                            el.find('div.pnl-phDose-volume').hide();
                            el.find('div.pnl-phDose-delay').show();
                            el.find('.pnl-phDose-mix').show();
                            break;
                        case 'volume':
                            el.find('div.pnl-phDose-time').hide();
                            el.find('div.pnl-phDose-volume').show();
                            el.find('div.pnl-phDose-delay').show();
                            el.find('.pnl-phDose-mix').show();
                            break;
                        case 'volumeTime':
                            el.find('div.pnl-phDose-time').show();
                            el.find('div.pnl-phDose-volume').show();
                            el.find('div.pnl-phDose-delay').show();
                            el.find('.pnl-phDose-mix').show();
                            break;
                        default:
                            el.find('div.pnl-phDose-time').hide();
                            el.find('div.pnl-phDose-volume').hide();
                            el.find('div.pnl-phDose-delay').hide();
                            el.find('.pnl-phDose-mix').hide();
                            break;
                    }
                });
            line = $('<div></div>').appendTo(grpDose).addClass('pnl-acidType').hide();
            $('<div></div>').appendTo(line).pickList({
                binding: 'ph.acidType',
                bindColumn: 0, displayColumn: 2,
                labelText: 'Using',
                columns: [{ binding: 'val', text: 'val', hidden: true }, { binding: 'name', text: 'name', hidden: true }, { binding: 'desc', text: 'Acid Type', style: { whiteSpace: 'nowrap' } }],
                items: o.acidTypes,
                units: 'muriatic acid',
                inputAttrs: { style: { width: '10rem' } },
                labelAttrs: { style: { width: '3rem' } }
            });

            line = $('<div></div>').appendTo(grpDose).addClass('pnl-phDose-delay').hide();
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'ph.startDelay', labelText: 'Delay', min: 0, max: 59, step:.1, fmtMask:'#,##0.#', dataType: 'number', labelAttrs: { style: { width:'3rem' } }, inputAttrs: { style: { width: '3.7rem' } }, units: 'min after pump start' });
            $('<hr></hr>').appendTo(line).css({ margin: '3px' });
            line = $('<div></div>').appendTo(grpDose).addClass('pnl-phDose-volume').hide();
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'ph.maxDosingVolume', labelText: 'Max Vol', min: 0, max: 9999, dataType: 'number', labelAttrs: { style: { width:'4.5rem' } }, inputAttrs: { style: { width: '7rem' } }, units: 'mL' });
            line = $('<div></div>').appendTo(grpDose).addClass('pnl-phDose-time').hide();
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'ph.maxDosingTimeHours', labelText: 'Max Time', min: 0, max: 23, dataType: 'number', labelAttrs: { style: { width: '4.5rem' } }, inputAttrs: { style: { width: '2.1rem' } }, units:'hrs' });
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'ph.maxDosingTimeMinutes', labelText: 'Minutes', min: 0, max: 59, dataType: 'number', labelAttrs: { style: { display: 'none' } }, inputAttrs: { style: { width: '2.1rem' } }, style: { marginLeft: '.15rem' }, units:'min' });
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'ph.maxDosingTimeSeconds', labelText: 'Seconds', min: 0, max: 59, dataType: 'number', labelAttrs: { style: { display: 'none' } }, inputAttrs: { style: { width: '2.1rem' } }, style: { marginLeft: '.15rem' }, units:'sec' });
            

            var grpMix = $('<fieldset></fieldset>').addClass('pnl-phDose-mix').css({ display: 'block', verticalAlign: 'top' }).appendTo(sec).hide();
            $('<legend></legend>').text('Mixing').appendTo(grpMix);
            line = $('<div></div>').appendTo(grpMix);
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'ph.mixingTimeHours', labelText: 'Time', min: 0, max: 23, dataType: 'number', labelAttrs: { style: { width: '3.7rem' } }, inputAttrs: { style: { width: '2.1rem' } }, units:'hrs' });
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'ph.mixingTimeMinutes', labelText: 'Minutes', min: 0, max: 59, dataType: 'number', labelAttrs: { style: { display: 'none' } }, inputAttrs: { style: { width: '2.1rem' } }, style: { marginLeft: '.15rem' }, units:'min' });


            //$('<div></div>').appendTo(line).valueSpinner('')
        }
    });
    $.widget('pic.pnlChemORPSettings', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('pnl-chemcontroller-orpsettings');
            var line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).checkbox({ labelText: 'ORP Enabled', binding: 'orp.enabled' });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Use Chlorinator', binding: 'orp.useChlorinator' }).css({ marginLeft: '2rem' })
                .on('changed', function (evt) {
                    if (evt.newVal) {
                        el.find('div.pnl-dosing').hide();
                    }
                    else {
                        el.find('div.pnl-dosing').show();
                    }
                });
            sec = $('<div></div>').appendTo(el).css({ display: 'inline-block', verticalAlign: 'top', paddingRight: '1rem' }).addClass('pnl-dosing');
            line = $('<div></div>').appendTo(sec);

            var grpDose = $('<fieldset></fieldset>').css({ display: 'block', verticalAlign: 'top' }).appendTo(line);
            $('<legend></legend>').text('Dosing Parameters').appendTo(grpDose);
            line = $('<div></div>').appendTo(grpDose);
            $('<div></div>').appendTo(line).pickList({
                binding: 'orp.dosingMethod',
                bindColumn: 0, displayColumn: 2,
                labelText: 'Dose By',
                columns: [{ binding: 'val', text: 'val', hidden: true }, { binding: 'name', text: 'name', hidden: true }, { binding: 'desc', text: 'Method', style: { whiteSpace: 'nowrap' } }],
                items: o.dosingMethods,
                inputAttrs: { style: { width: '7rem' } },
                labelAttrs: { style: { width: '4rem' } }
            })
                .on('selchanged', function (evt) {
                    switch (evt.newItem.name) {
                        case 'time':
                            el.find('div.pnl-orpDose-time').show();
                            el.find('div.pnl-orpDose-volume').hide();
                            el.find('div.pnl-orpDose-delay').show();
                            el.find('.pnl-orpDose-mix').show();
                            break;
                        case 'volume':
                            el.find('div.pnl-orpDose-time').hide();
                            el.find('div.pnl-orpDose-volume').show();
                            el.find('div.pnl-orpDose-delay').show();
                            el.find('.pnl-orpDose-mix').show();
                            break;
                        case 'volumeTime':
                            el.find('div.pnl-orpDose-time').show();
                            el.find('div.pnl-orpDose-volume').show();
                            el.find('div.pnl-orpDose-delay').show();
                            el.find('.pnl-orpDose-mix').show();
                            break;
                        default:
                            el.find('div.pnl-orpDose-time').hide();
                            el.find('div.pnl-orpDose-volume').hide();
                            el.find('div.pnl-orpDose-delay').hide();
                            el.find('.pnl-orpDose-mix').hide();
                            break;
                    }
                });

            line = $('<div></div>').appendTo(grpDose).addClass('pnl-orpDose-delay').hide();
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'orp.startDelay', labelText: 'Delay', min: 0, max: 59, step: .1, fmtMask: '#,##0.#', dataType: 'number', labelAttrs: { style: { width: '4rem' } }, inputAttrs: { style: { width: '3.7rem' } }, units: 'min after pump start' });
            $('<hr></hr>').appendTo(line).css({ margin: '3px' });
            line = $('<div></div>').appendTo(grpDose).addClass('pnl-orpDose-volume').hide();
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'orp.maxDosingVolume', labelText: 'Max Vol', min: 0, max: 9999, dataType: 'number', labelAttrs: { style: { width: '4.5rem' } }, inputAttrs: { style: { width: '7rem' } }, units: 'mL' });
            line = $('<div></div>').appendTo(grpDose).addClass('pnl-orpDose-time').hide();
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'orp.maxDosingTimeHours', labelText: 'Max Time', min: 0, max: 23, dataType: 'number', labelAttrs: { style: { width: '4.5rem' } }, inputAttrs: { style: { width: '2.1rem' } }, units: 'hrs' });
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'orp.maxDosingTimeMinutes', labelText: 'Minutes', min: 0, max: 59, dataType: 'number', labelAttrs: { style: { display: 'none' } }, inputAttrs: { style: { width: '2.1rem' } }, style: { marginLeft: '.15rem' }, units: 'min' });
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'orp.maxDosingTimeSeconds', labelText: 'Seconds', min: 0, max: 59, dataType: 'number', labelAttrs: { style: { display: 'none' } }, inputAttrs: { style: { width: '2.1rem' } }, style: { marginLeft: '.15rem' }, units: 'sec' });
            

            var grpMix = $('<fieldset></fieldset>').addClass('pnl-orpDose-mix').css({ display: 'block', verticalAlign: 'top' }).appendTo(sec).hide();
            $('<legend></legend>').text('Mixing').appendTo(grpMix);
            line = $('<div></div>').appendTo(grpMix);
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'orp.mixingTimeHours', labelText: 'Time', min: 0, max: 23, dataType: 'number', labelAttrs: { style: { width: '3.7rem' } }, inputAttrs: { style: { width: '2.1rem' } }, units: 'hrs' });
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'orp.mixingTimeMinutes', labelText: 'Minutes', min: 0, max: 59, dataType: 'number', labelAttrs: { style: { display: 'none' } }, inputAttrs: { style: { width: '2.1rem' } }, style: { marginLeft: '.15rem' }, units: 'min' });
            //$('<div></div>').appendTo(line).valueSpinner('')
        }
    });

    $.widget('pic.pnlChemHardware', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildProbePanel: function (remServers, type) {
            var self = this, o = self.options, el = self.element;
            var grpProbe = $('<fieldset></fieldset>').css({ display: 'inline-block', verticalAlign: 'top' });
            let binding = type.toLowerCase() + '.probe.';
            $('<legend></legend>').text(`${type} Probe`).appendTo(grpProbe);
            line = $('<div></div>').appendTo(grpProbe);
            $('<div></div>').appendTo(line).pickList({
                binding: `${binding}type`, value: 0,
                bindColumn: 0, displayColumn: 2,
                labelText: 'Type',
                columns: [{ binding: 'val', text: 'val', hidden: true }, { binding: 'name', text: 'name', hidden: true }, { binding: 'desc', text: 'Pump Type', style: { whiteSpace: 'nowrap' } }],
                items: type === 'pH' ? o.phProbeTypes : o.orpProbeTypes,
                inputAttrs: { style: { width: '8.5rem' } }
            }).on('selchanged', function (evt) {
                let grp = $(evt.currentTarget).parents('fieldset:first');
                evt.newItem.remAddress ? grp.find('.pnl-rem-address').show() : grp.find('.pnl-rem-address').hide();
            });
            line = $('<div></div>').appendTo(grpProbe);
            $('<div></div>').appendTo(line).pickList({
                binding: `${binding}connectionId`,
                bindColumn: 0, displayColumn: 1,
                labelText: 'Connection',
                columns: [{ binding: 'uuid', text: 'uuid', hidden: true }, { binding: 'name', text: 'Name', style: { whiteSpace: 'nowrap' } }],
                items: remServers,
                inputAttrs: { style: { width: '8.5rem' } },
                labelAttrs: { style: { width: '5.4rem' } }
            }).addClass('pnl-rem-address').hide().on('selchanged', function (evt) {
                let grp = $(evt.currentTarget).parents('fieldset:first');
                grp.find('div[data-bind$=".deviceBinding"]').each(function () {
                    this.items(evt.newItem.devices);
                });
            });
            line = $('<div></div>').appendTo(grpProbe);
            $('<div></div>').appendTo(line).pickList({
                binding: `${binding}deviceBinding`,
                bindColumn: 0, displayColumn: 2,
                labelText: 'Device',
                columns: [{ binding: 'binding', text: 'binding', hidden: true }, { binding: 'category', text: 'Category', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Device', style: { whiteSpace: 'nowrap' } }],
                items: [],
                inputAttrs: { style: { width: '8.5rem' } },
                labelAttrs: { style: { width: '5.4rem' } }
            }).hide().addClass('pnl-rem-address');
            line = $('<div></div>').appendTo(line);
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Flow Readings Only', binding: `${type.toLowerCase()}.flowReadingsOnly` }).attr('title', 'Check if you want to ignore readings from the probe when no flow is detected.');
            return grpProbe;
        },
        _buildPumpPanel: function (remServers, type) {
            var self = this, o = self.options, el = self.element;
            var grpPump = $('<fieldset></fieldset>').css({ display: 'inline-block', verticalAlign: 'top' });
            let binding = type.toLowerCase() + '.pump.';
            let tankBinding = type.toLowerCase() + '.tank.';
            $('<legend></legend>').text(`${type} Pump`).appendTo(grpPump);
            line = $('<div></div>').appendTo(grpPump);
            $('<div></div>').appendTo(line).pickList({
                binding: `${binding}type`, value: 0,
                bindColumn: 0, displayColumn: 2,
                labelText: 'Type',
                columns: [{ binding: 'val', text: 'val', hidden: true }, { binding: 'name', text: 'name', hidden: true }, { binding: 'desc', text: 'Pump Type', style: { whiteSpace: 'nowrap' } }],
                items: o.pumpTypes,
                //items: [{ val: 0, name: 'none', desc: 'No Pump' }, { val: 1, name: 'relay', desc: 'Relay Pump' }, { val: 2, name: 'ezo-pmp', desc: 'Atlas EZO-PMP' }],
                inputAttrs: { style: { width: '8.5rem' } }
            }).on('selchanged', function (evt) {
                let grp = $(evt.currentTarget).parents('fieldset:first');
                evt.newItem.ratedFlow ? grp.find(`div[data-bind$=".ratedFlow"]`).show() : grp.find(`div[data-bind$=".ratedFlow"]`).hide();
                evt.newItem.tank ? grp.find('div.pnl-tank-size').show() : grp.find('div.pnl-tank-size').hide();
                evt.newItem.remAddress ? grp.find('.pnl-rem-address').show() : grp.find('.pnl-rem-address').hide();
            });
            line = $('<div></div>').appendTo(grpPump);
            $('<div></div>').appendTo(line).pickList({
                binding: `${binding}connectionId`,
                bindColumn: 0, displayColumn: 1,
                labelText: 'Connection',
                columns: [{ binding: 'uuid', text: 'uuid', hidden: true }, { binding: 'name', text: 'Name', style: { whiteSpace: 'nowrap' } }],
                items: remServers,
                inputAttrs: { style: { width: '8.5rem' } },
                labelAttrs: { style: { width: '5.4rem' } }
            }).addClass('pnl-rem-address').hide().on('selchanged', function (evt) {
                let grp = $(evt.currentTarget).parents('fieldset:first');
                grp.find('div[data-bind$=".deviceBinding"]').each(function () {
                    this.items(evt.newItem.devices);
                });
            });
            line = $('<div></div>').appendTo(grpPump);
            $('<div></div>').appendTo(line).pickList({
                binding: `${binding}deviceBinding`,
                bindColumn: 0, displayColumn: 2,
                labelText: 'Device',
                columns: [{ binding: 'binding', text: 'binding', hidden: true }, { binding: 'category', text: 'Category', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Device', style: { whiteSpace: 'nowrap' } }],
                items: [],
                inputAttrs: { style: { width: '8.5rem' } },
                labelAttrs: { style: { width: '5.4rem' } }
            }).hide().addClass('pnl-rem-address');

            line = $('<div></div>').appendTo(grpPump);
            $('<div></div>').appendTo(line).valueSpinner({
                canEdit: true,
                binding: `${binding}.ratedFlow`, labelText: 'Flow', dataType: 'number', fmtType: '#,##0.0#', min: 0, max: 300, step: 0.1,
                inputAttrs: { style: { width: '4rem' } },
                labelAttrs: { style: { width: '3.5rem' } }, units: 'mL/min'
            }).hide();
            line = $('<div></div>').appendTo(grpPump).addClass('pnl-tank-size').hide();
            $('<div></div>').appendTo(line).valueSpinner({
                canEdit: true,
                binding: `${tankBinding}capacity`, labelText: 'Tank', dataType: 'number', fmtType: '#,##0.0#', min: 0, max: 300, step: 0.1,
                inputAttrs: { style: { width: '4rem' } },
                labelAttrs: { style: { width: '3.5rem' } }
            });
            $('<div></div>').appendTo(line).pickList({
                binding: `${tankBinding}units`, value: 'gal',
                bindColumn: 0, displayColumn: 1,
                labelText: 'Tank Units',
                columns: [{ hidden: true, binding: 'val', text: 'val' }, { binding: 'name', text: 'name', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Description', style: { whiteSpace: 'nowrap' } }],
                items: o.volumeUnits,
                inputAttrs: { style: { width: '2.25rem' } },
                labelAttrs: { style: { display: 'none' } }
            });
            return grpPump;
        },
        _buildControls: async function () {
            var self = this, o = self.options, el = self.element;
            var pnlControllers = el.parents('div.picConfigCategory.cfgChemControllers:first');
            el.addClass('pnl-chemcontroller-hardware');
            var sec = $('<div></div>').appendTo(el).css({ display: 'inline-block', verticalAlign: 'top' });
            self._buildProbePanel(o.remServers, 'pH').appendTo(sec).css({ display: 'block' });
            var grpPump = self._buildPumpPanel(o.remServers, 'pH').appendTo(sec).css({ display: 'block' });

            sec = $('<div></div>').appendTo(el).css({ display: 'inline-block', verticalAlign: 'top' });
            self._buildProbePanel(o.remServers, 'ORP').appendTo(sec).css({ display: 'block' });
            grpPump = self._buildPumpPanel(o.remServers, 'ORP').appendTo(sec).css({ display: 'block' });
        }
    });
    $.widget('pic.pnlChlorinatorConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgChlorinator');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-soap', style: { width: '14rem' } },
                { binding: 'type', glyph: '', style: { } }]
            });
            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: {} } });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 2, labelText: 'Body', binding: binding + 'body',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Body', style: { whiteSpace: 'nowrap' } }],
                items: o.bodies, inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Virtual Controller', binding: 'isVirtual' }).attr('title', 'Check this only if the chlorinator is not being controlled by\r\na pool automation system.');
            $('<hr></hr>').appendTo(pnl);

            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Pool Setpoint', binding: binding + 'poolSetpoint', min: 0, max: 100, step: 1, units: '%', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft: '4rem', width: '5.9rem', marginRight: '.25rem' } } });
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Spa Setpoint', binding: binding + 'spaSetpoint', min: 0, max: 100, step: 1, units: '%', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft: '4rem', marginRight: '.25rem' } } });
            line = $('<div></div>').appendTo(pnl);
            $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Super Chlor', binding: binding + 'superChlorHours', min: 1, max: 96, step: 1, units: 'hours', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft: '4rem', width: '5.9rem', marginRight: '.25rem' } } });

            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Chlorinator', icon: '<i class="fas fa-save"></i>' });

            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                $.putApiService('/config/chlorinator', v, 'Saving Chlorinator...', function (c, status, xhr) {
                    console.log(c);
                    self.dataBind(c);
                });
            });
            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Delete Chlorinator', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteFeature', {
                    message: 'Are you sure you want to delete Chlorinator ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Chlorinator',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgChlorinator:first').remove();
                            else {
                                $.deleteApiService('/config/chlorinator', v, 'Deleting Chlorinator...', function (c, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgChlorinator:first').remove();
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
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            cols[0].elText().text(obj.name || 'Chlorinator');
            if (obj.id === 1 || obj.id === 6) el.find('div.picPickList[data-bind=type]').addClass('disabled');
            dataBinder.bind(el, obj);
        }
    });
    $.widget('pic.pnlChemControllerConfig', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picConfigCategory cfgChemController');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-flask', style: { width: '14rem' } },
                { binding: 'type', glyph: '', style: { } }]
            });

            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: {} } });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 2, labelText: 'Type', binding: binding + 'type',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Type', style: { whiteSpace: 'nowrap' } }],
                items: o.types, inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            }).hide();
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 2, labelText: 'Body', binding: binding + 'body',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Body', style: { whiteSpace: 'nowrap' } }],
                items: o.bodies, inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });

            var addresses = [];
            for (var i = 1; i <= 16; i++) addresses.push({ val: i + 143, desc: i });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 1, labelText: 'Address', binding: binding + 'address',
                columns: [{ binding: 'val', hidden: true, text: 'Address' }, { binding: 'desc', text: 'Address' }],
                items: addresses, inputAttrs: { style: { width: '3rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            $('<hr></hr>').appendTo(pnl);
            $('<div></div>').appendTo(pnl).addClass('pnl-chemcontroller-type');

            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Controller', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(v);
                if (dataBinder.checkRequired(p)) {
                    $.putApiService('/config/chemController', v, 'Chem Controller...', function (c, status, xhr) {
                        self.dataBind(c);
                    });
                }
            });
            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Delete Controller', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteFeature', {
                    message: 'Are you sure you want to delete controller ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Controller',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgChemController:first').remove();
                            else {
                                $.deleteApiService('/config/chemController', v, 'Deleting Chem Controller...', function (c, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgChemController:first').remove();
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
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            cols[0].elText().text(obj.name);
            var type = o.types.find(elem => elem.val === obj.type);
            cols[1].elText().text(typeof type !== 'undefined' ? type.desc : 'Controller');
            var ctype = el.attr('data-controllertype');
            if (el.attr('data-controllertype') !== type.name) {
                var pnl = el.find('div.pnl-chemcontroller-type');
                el.attr('data-controllerType', type.name);
                pnl.empty();
                if (type.name !== 'rem') {
                    $('<div></div>').appendTo(pnl).pnlChemSetpoints();
                }
                else {
                    console.log(obj);
                    var tabBar = $('<div></div>').appendTo(pnl).tabBar();
                    var tab = tabBar[0].addTab({ id: 'tabSetpoints', text: 'Setpoints' });
                    $('<div></div>').appendTo(tab).pnlChemSetpoints();
                    tab = tabBar[0].addTab({ id: 'tabPhSettings', text: 'pH Settings' });
                    $('<div></div>').appendTo(tab).pnlChemPhSettings(o);
                    tab = tabBar[0].addTab({ id: 'tabORPSettings', text: 'ORP Settings' });
                    $('<div></div>').appendTo(tab).pnlChemORPSettings(o);
                    tabBar[0].addTab({ id: 'tabAlarms', text: 'Alarms' });
                    tab = tabBar[0].addTab({ id: 'tabHardware', text: 'Hardware' });
                    $('<div></div>').appendTo(tab).pnlChemHardware(o);
                    if (typeof obj.orp === 'undefined' || typeof obj.ph === 'undefined' ||
                        typeof obj.ph.pump === 'undefined' || typeof obj.orp.pump === 'undefined' ||
                        typeof obj.orp.pump.type === 'undefined' || typeof obj.ph.pump. type === 'undefined' || obj.id <= 0)
                        tabBar[0].selectTabById('tabHardware');
                    else
                        tabBar[0].selectTabById('tabSetpoints');
                    //obj.orpPumpType = typeof obj.orpPumpType !== 'undefined' ? obj.orpPumpType : 0;
                    //obj.phPumpType = typeof obj.phPumpType !== 'undefined' ? obj.phPumpType : 0;
                    //obj.phDoseBy = typeof obj.phDoseBy !== 'undefined' ? obj.phDoseBy : 0;
                    //obj.orpDoseBy = typeof obj.phDoseBy !== 'undefined' ? obj.phDoseBy : 0;
                    //obj.phStartDelay = typeof obj.phStartDelay !== 'undefined' ? obj.phStartDelay : 0.5;
                    //obj.orpStartDelay = typeof obj.orpStartDelay !== 'undefined' ? obj.orpStartDelay : 0.5;
                    //obj.phMixHours = typeof obj.phMixHours !== 'undefined' ? obj.phMixHours : 1;
                    //obj.orpMixHours = typeof obj.orpMixHours !== 'undefined' ? obj.orpMixHours : 1;

                }
            }
            if (typeof obj.ph === 'undefined') obj.ph = {
                mixingTime: 60, maxDosingTime: 20, pump: {}, probe: {}, tank: {}
            };
            if (typeof obj.orp === 'undefined') obj.orp = {
                mixingTime: 60, maxDosingTime: 20, pump: {}, probe: {}, tank: {}
            };
            self.splitSeconds('mixingTime', obj.ph, obj.ph.mixingTime);
            self.splitSeconds('mixingTime', obj.orp, obj.orp.mixingTime);
            self.splitSeconds('maxDosingTime', obj.ph, obj.ph.maxDosingTime);
            self.splitSeconds('maxDosingTime', obj.orp, obj.orp.maxDosingTime);
            if (type.hasAddress) {
                el.find('*[data-bind="address"]').each(function () {
                    $(this).show();
                    if (typeof this['required'] === 'function') this.required(true);
                });
            }
            else {
                el.find('*[data-bind="address"]').each(function () {
                    $(this).hide();
                    if (typeof this['required'] === 'function') this.required(false);
                });
            }
            dataBinder.bind(el, obj);
            //setTimeout(function () { dataBinder.bind(el, obj) }, 2000);
        },
        splitSeconds: function (name, obj, seconds) {
            var hours = Math.floor(seconds / 3600);
            var minutes = Math.floor((seconds - (hours * 3600)) / 60);
            var secs = Math.floor((seconds - (hours * 3600) - (minutes * 60)));
            obj[`${name}Hours`] = hours || 0;
            obj[`${name}Minutes`] = minutes || 0;
            obj[`${name}Seconds`] = secs || 0;
        },
        combineSeconds: function (name, obj) {
            obj[`${name}Time`] =
                ((typeof obj[`${name}Hours`] === 'number' ? obj[`${name}Hours`] : 0) * 3600)
                + ((typeof obj[`${name}Minutes`] === 'number' ? obj[`${name}Minutes`] : 0) * 60)
                + (typeof obj[`${name}Seconds`] === 'number' ? obj[`${name}Seconds`] : 0);
        }
        
    });
})(jQuery);
