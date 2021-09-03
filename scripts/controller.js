(function ($) {
    $.widget("pic.controller", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initController = function (data) { self._initController(data); };
            el[0].setControllerState = function (data) { self.setControllerState(data); };
            el[0].setEquipmentState = function (data) { self.setEquipmentState(data); };
            el[0].setConnectionError = function (data) { self.setConnectionError(data); };
        },
        _initController: function (data) {
            var self = this, o = self.options, el = self.element;
            el.empty();

            let row = $('<div class="picHeaderRow picControllerTitle control-panel-title"></div>').appendTo(el);
            $('<div class= "picModel"><i class="fas fa-bars"></i><span class="picModelData"></span></div>').appendTo(row);
            $('<div class="picControllerTime"><span class="picControllerTime"></span></div>').appendTo(row);
            if ($('div.dashOuter').length)
                $('<div class="picControllerStatus"><span class="picStatusData"></span><span class="picPercentData"></span><div class="picIndicator" data-status="error"></div><div class="picConfigIcon"><i class="fas fa-cogs"></i></div></div>').appendTo(row);
            else
                $('<div class="picControllerStatus"><span class="picStatusData"></span><span class="picPercentData"></span><div class="picIndicator" data-status="error"></div></div>').appendTo(row);
            console.log('jQuery:' + jQuery.fn.jquery + ' jQueryUI:' + ($.ui.version || 'pre 1.6'));

            row = $('<div class="picFreezeProtect" data-status="off"><i class="fas fa-snowflake burst-animated"></i><label>FREEZE PROTECTION</label><i class="fas fa-snowflake burst-animated"></i></div>');
            row.appendTo(el);
            row = $('<div class="picPanelMode" data-status="auto"><i class="far fa-pause-circle burst-animated"></i><label></label><i class="far fa-pause-circle burst-animated"></i></div>');
            row.appendTo(el);

            el.find('div.picModel > i').on('click', function (evt) {
                // Open up the settings window.
                var divPopover = $('<div class="picAppSettings"></div>');
                var btn = evt.currentTarget;
                divPopover.appendTo(el.parent());
                divPopover.on('initPopover', function (e) {
                    let divSettings = $('<div class="picAppSettings"></div>');
                    divSettings.appendTo(e.contents());
                    divSettings.settingsPanel();
                    divSettings.on('loaded', function (e) { divPopover[0].show(btn); });
                    e.stopImmediatePropagation();
                });
                divPopover.popover({ title: 'Settings', popoverStyle: 'modal', placement: { target: btn } });
                divPopover[0].show(btn);
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });
            el.find('div.picConfigIcon').on('click', function (evt) {
                let btn = $(this);
                let container = $('div.dashOuter');
                switch (container.attr('data-panel')) {
                    case 'dashboard':
                        btn.find('i').attr('class', 'fas fa-home');
                        container.attr('data-panel', 'configuration');
                        self._buildConfigPage();
                        break;
                    case 'configuration':
                        btn.find('i').attr('class', 'fas fa-cogs');
                        container.attr('data-panel', 'dashboard');
                        self._closeConfigPage();
                        break;
                }
            });
            self.setControllerState(data);
            self.setEquipmentState(typeof data !== 'undefined' ? data.equipment : undefined);
        },
        _buildConfigPage: function () {
            var self = this, o = self.options, el = self.element;
            // Place a tab bar in the config space.
            let container = $('div.configContainer');
            let page = $('<div class="picConfigPage"></div>').appendTo(container);
            page.configPage();
        },
        _closeConfigPage: function () {
            var self = this, o = self.options, el = self.element;
            $('div.configContainer').empty();
        },
        formatDate: function (dt) {
            let pad = function (n) { return (n < 10 ? '0' : '') + n; };
            return typeof dt !== 'undefined' ? pad(dt.getMonth() + 1) + '/' + pad(dt.getDate()) + '/' + dt.getFullYear() + '  '
                + pad(dt.getHours() > 12 ? dt.getHours() - 12 : dt.getHours()) + ':' + pad(dt.getMinutes()) + (dt.getHours() >= 12 ? 'pm' : 'am') : '--/--/---- --:--';
        },
        setConnectionError: function (data) {
            var self = this, o = self.options, el = self.element;
            if (typeof data.status === 'undefined') data.status = { val: 3, name: 'unknown', desc: 'Unknown Status' };
            el.find('span.picControllerTime').each(function () {
                $(this).text('--/--/---- --:--');
            });
            el.find('div.picControllerStatus').each(function () {
                let ln = $(this);
                ln.find('span.picPercentData').text('');
                ln.find('span.picStatusData').text(data.status.desc);
                ln.find('div.picIndicator').attr('data-status', data.status.name);
            });
            el.find('div.picPanelMode').attr('data-status', 'error');
            el.find('div.picPanelMode > label').text('Connection Error');
            el.find('div.picFreeze').attr('data-status', 'off');

        },
        setControllerState: function (data) {
            var self = this, o = self.options, el = self.element;
            try {
                if (typeof data !== 'undefined') {
                    let dt = new Date.parseISO(data.time);
                    el.find('span.picControllerTime').each(function () {
                        $(this).data('dt', dt);
                        if (typeof data.clockMode !== 'undefined' && data.clockMode.val === 24) {
                            $(this).text(dt.format('MM/dd/yyyy HH:mm'));
                        }
                        else
                            $(this).text(dt.format('MM/dd/yyyy h:mmtt'));
                        //$(this).text(self.formatDate(dt));
                    });
                    var status = data.status || { name: 'unknown', desc: 'Not Connected', percent: 0 };
                    el.find('div.picControllerStatus').each(function () {
                        let ln = $(this);
                        ln.find('span.picPercentData').text(status.name === 'loading' ? status.percent + '%' : '');
                        ln.find('span.picStatusData').text(status.desc);
                        ln.find('div.picIndicator').attr('data-status', status.name);
                    });
                    el.find('div.picPanelMode').attr('data-status', data.mode.name);
                    el.find('div.picPanelMode > label').text(data.mode.desc);
                    el.find('div.picFreezeProtect').attr('data-status', data.freeze ? 'on' : 'off');
                    el.attr('data-status', data.status.val);
                    $('div.picActionButton[id$=btnReloadConfig]').each(function () {
                        let btn = $(this);
                        if (data.status.val === 1) {
                            btn.find('i').removeClass('fa-spin');
                            btn.find('span.picButtonText').text('Reload Config');
                            btn.removeClass('disabled');
                        }
                        else {
                            btn.find('i').addClass('fa-spin');
                            btn.find('span.picButtonText').text('Loading Config...');
                            btn.addClass('disabled');
                        }
                    });
                }
                else {
                    el.find('span.picControllerTime').each(function () {
                        $(this).text('--/--/---- --:--');
                    });
                    el.find('div.picControllerStatus').each(function () {
                        let ln = $(this);
                        ln.find('span.picPercentData').text('');
                        ln.find('span.picStatusData').text('Not Connected');
                        ln.find('div.picIndicator').attr('data-status', '');
                    });
                    el.find('div.picPanelMode').attr('data-status', '');
                    el.find('div.picPanelMode > label').text('');
                    el.find('div.picFreezeProtect').attr('data-status', 'off');
                    el.attr('data-status', 2);
                    $('div.picActionButton[id$=btnReloadConfig]').each(function () {
                        let btn = $(this);
                        btn.find('i').removeClass('fa-spin');
                        btn.find('span.picButtonText').text('Not Connected...');
                        btn.addClass('disabled');
                    });
                }
            } catch (err) { console.error(err); }

        },
        setEquipmentState: function (data) {
            var self = this, o = self.options, el = self.element;
            if (typeof data !== 'undefined') {
                el.attr('data-maxschedules', data.maxSchedules);
                el.attr('data-maxvalves', data.maxValves);
                el.attr('data-maxcircuits', data.maxCircuits);
                el.attr('data-shared', data.shared);
                el.find('div.picModel > span.picModelData').text(data.model);
            }
            else {
                el.attr('data-maxschedules', 0);
                el.attr('data-maxvalves', 0);
                el.attr('data-maxcircuits', 0);
                el.attr('data-shared', false);
                el.find('div.picModel > span.picModelData').text('Unknown Model');

            }
        }
    });
    $.widget('pic.settingsPanel', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].setState = function (data) { self.setState(data); };
            self._buildControls();
            o = { processing: false };
        },
        _buildLoggingTab: function () {
            var self = this, o = self.options, el = self.element;

            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabLogging', text: 'Logging' };
                var contents = this.addTab(tabObj);
                var divOuter = $('<div class="picLogging"></div>');
                divOuter.appendTo(contents);

                var grp = $('<fieldset></fieldset>');

                grp.appendTo(divOuter);
                var leg = $('<legend></legend>').appendTo(grp);
                var btn = $('<div class="logger"></div>').appendTo(leg).optionButton({ text: 'Application', bind: 'app.enabled' });

                var divLine = $('<div class="picAppLogging"></div>');
                divLine.appendTo(grp);

                $('<div></div>').appendTo(divLine).pickList({
                    bindColumn: 0, displayColumn: 1, labelText: 'Level', binding: 'app.level',
                    columns: [{ binding: 'val', hidden: true, text: 'Val', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: false, text: 'Log Level', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Description', style: { whiteSpace: 'nowrap' } }],
                    items: [
                        { val: 'error', name: 'Error', desc: 'Only errors are logged' },
                        { val: 'warn', name: 'Warn', desc: 'Errors and warnings are logged' },
                        { val: 'info', name: 'Info', desc: 'Informational events, warnings, and errors are logged' },
                        { val: 'verbose', name: 'Verbose', desc: 'A high level of events are logged' },
                        { val: 'debug', name: 'Debug', desc: 'Includes additional debugging information' },
                        { val: 'silly', name: 'Silly', desc: 'A silly amount of information is logged' }
                    ], inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { width: '4rem' } }
                }).on('selchanged', function (evt) {
                    if (typeof evt.oldItem !== 'undefined') {
                        var opt = $(evt.currentTarget);
                        var obj = dataBinder.fromElement(opt);
                        $.putApiService('app/logger/setOptions', obj);
                    }
                });
                divLine = $('<div class="picAppLogging"></div>').appendTo(grp);
                $('<label></label>').appendTo(divLine).text('Log to');
                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'File', bind: 'app.logToFile' });



                //var selApp = $('<select data-bind="app.level"></select>');
                //selApp.appendTo(divLine);
                //$('<option value="info">Info</option>').appendTo(selApp);
                //$('<option value="debug">Debug</option>').appendTo(selApp);
                //$('<option value="warn">Warn</option>').appendTo(selApp);
                //$('<option value="verbose">Verbose</option>').appendTo(selApp);
                //$('<option value="error">Error</option>').appendTo(selApp);
                //$('<option value="silly">Silly</option>').appendTo(selApp);
                //$('').appendTo(divLine);

                grp = $('<fieldset></fieldset>');
                leg = $('<legend></legend>').appendTo(grp);

                grp.appendTo(divOuter);
                btn = $('<div class="logger"></div>').appendTo(leg).optionButton({ text: 'Packets', bind: 'packet.enabled' });

                divLine = $('<div class="picPacketLogging"><label>Log to</label></div>');
                divLine.appendTo(grp);


                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'Console', bind: 'packet.logToConsole' });
                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'File', bind: 'packet.logToFile' });


                divLine = $('<div class="picPacketLogging"><label>Include</label></div>');
                divLine.appendTo(grp);


                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ id: 'btnBroadcast', text: 'Broadcast', bind: 'packet.broadcast.enabled', dropdownButton: $('<i class="fas fa-filter"></i>') });
                btn.find('i').on('click', function (evt) {
                    var opt = $(evt.currentTarget);
                    var divPopover = $('<div></div>');
                    divPopover.appendTo(document.body);
                    divPopover.on('initPopover', function (e) {
                        let divActions = $('<div class="picActionSettings"></div>');
                        divActions.appendTo(e.contents());
                        divActions.packetFilter({ protocol: 'broadcast' });
                        divActions.on('loaded', function (e) { divPopover[0].show(opt); });
                        e.stopImmediatePropagation();
                    });
                    divPopover.popover({ title: 'Broadcast Actions', popoverStyle: 'modal', placement: { target: opt } });
                    divPopover[0].show(opt);
                    evt.preventDefault();
                    evt.stopImmediatePropagation();
                });

                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'Pump', bind: 'packet.pump.enabled' });
                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'Chlorinator', bind: 'packet.chlorinator.enabled' });

                divLine = $('<div class="picPacketLogging"><label></label></div>').appendTo(grp);

                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'IntelliChem', bind: 'packet.intellichem.enabled' });
                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'IntelliValve', bind: 'packet.intellivalve.enabled' });
                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'Heater', bind: 'packet.heater.enabled' });
                divLine = $('<div class="picPacketLogging"><label></label></div>').appendTo(grp);

                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'Invalid', bind: 'packet.invalid' });
                divLine = $('<div class="picPacketLogging"><label></label></div>').appendTo(grp);

                //btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'Replay', bind: 'packet.replay' });

                contents.on('click', 'div.picOptionButton.logger', function (evt) {
                    var opt = $(evt.currentTarget);
                    var obj = dataBinder.fromElement(opt);
                    $.putApiService('app/logger/setOptions', obj);
                });
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>');
                btnPnl.appendTo(grp);

                var btnStartCapture = $('<div></div>');
                btnStartCapture.appendTo(btnPnl).actionButton({ text: 'Capture Replay', icon: '<i class="fas fa-bug"></i>' });
                btnStartCapture.on('click', function (e) {
                    if (makeBool(btnStartCapture.attr('data-iscapturing'))) {
                        $.getFileApiService('/app/config/stopPacketCapture', function (data, result, xhr) {
                            var url = window.URL.createObjectURL(new Blob([data]));
                            var link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', 'replay.zip');
                            document.body.appendChild(link);
                            link.click();
                            $(link).remove();
                        });
                        btnStartCapture[0].buttonText('Capture Replay');
                        divOuter.find('div.picOptionButton').each(function () { this.disabled(false); });
                        divOuter.find('div.picPickList').each(function () { this.disabled(false); });
                        btnStartCapture.attr('data-iscapturing', false);
                        btnStartCapture.show();
                        btnClearLog.show();
                    }
                    else {
                        var dlg = $.pic.modalDialog.createDialog('dlgSelectCaptureMethod', {
                            message: 'Select a capture method',
                            width: '400px',
                            height: 'auto',
                            title: 'Select Capture Options',
                            buttons: [{
                                text: 'Begin Capture', icon: '<i class="fas fa-bug"></i>',
                                click: function () {
                                    $.pic.modalDialog.closeDialog(this);
                                    var opts = dataBinder.fromElement(dlg);
                                    console.log(opts);
                                    if (opts.reload) $.getApiService('/app/config/startPacketCapture');
                                    else $.getApiService('/app/config/startPacketCaptureWithoutReset');
                                    btnStartCapture[0].buttonText('Cancel Capture');
                                    divOuter.find('div.picOptionButton').each(function () { this.disabled(true); });
                                    divOuter.find('div.picPickList').each(function () { this.disabled(true); });
                                    btnStartCapture.show();
                                    btnClearLog.hide();
                                    btnStartCapture.attr('data-iscapturing', true);
                                }
                            },
                            {
                                text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                                click: function () { $.pic.modalDialog.closeDialog(this); }
                            }]
                        });
                        var line = $('<div></div>').appendTo(dlg);
                        $('<div></div>').appendTo(line).checkbox({ labelText: 'Capture Configuration Reload', binding: 'reload' })[0].val(false);


                        //$.getApiService('/app/config/startPacketCaptureWithoutReset');
                        //btnStartCapture[0].buttonText('Cancel Capture');
                        //divOuter.find('div.picOptionButton').each(function () { this.disabled(true); });
                        //divOuter.find('div.picPickList').each(function () { this.disabled(true); });
                        //btnStartCapture.show();
                        //btnClearLog.hide();
                        //btnStartCapture.attr('data-iscapturing', true);

                    }
                }).hide();


                var btnClearLog = $('<div></div>');
                btnClearLog.appendTo(btnPnl);
                btnClearLog.actionButton({ text: 'Clear Messages', icon: '<i class="fas fa-broom"></i>' });
                btnClearLog.on('click', function (e) {
                    $.putApiService('app/logger/clearMessages');
                    // Send this off to the server.
                    ///$.putApiService(obj.id === 0 ? '/config/intellibrite/setColors' : '/config/lightGroup/' + obj.id + '/setColors', obj, function (data, status, xhr) {

                });



                $.getApiService('app/config/log', undefined, function (data, status, xhr) {
                    console.log(data);
                    dataBinder.bind(contents, data);
                    if (data.app.captureForReplay === true) {
                        btnStartCapture[0].buttonText('Cancel Capture');
                        grp.find('div.picOptionButton').each(function () { this.disabled(true); });
                        btnStartCapture.show();
                        btnClearLog.hide();
                        btnStartCapture.attr('data-iscapturing', true);
                    }
                    else {
                        btnStartCapture[0].buttonText('Capture Replay');
                        grp.find('div.picOptionButton').each(function () { this.disabled(false); });
                        btnStartCapture.attr('data-iscapturing', false);
                        btnStartCapture.show();
                        btnClearLog.show();
                    }
                });

            });

        },
        _buildAppearanceTab: function (settings) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabAppearance', text: 'Appearance' };
                var contents = this.addTab(tabObj);
                var divOuter = $('<div class="picAppearance"></div>');
                divOuter.appendTo(contents);
                var line = $('<div></div>').appendTo(divOuter);
                $('<div></div>').appendTo(line).pickList({
                    binding: 'theme.name',
                    bindColumn: 0, displayColumn: 1, labelText: 'Theme',
                    columns: [{ binding: 'code', hidden: true, text: 'code', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: false, text: 'Name', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Description', style: { whiteSpace: 'nowrap' } }],
                    items: [
                        { code: 'default', name: 'Default', desc: 'The default theme for the dashPanel.' },
                        { code: 'sketchy', name: 'Sketchy', desc: 'A whimsical display that looks like it is hand drawn.' },
                        { code: 'materia', name: 'Materia', desc: 'Material metaphor using bold colors and highlights.' },
                        { code: 'purple', name: 'Purple', desc: 'A mix or purple and teal.' },
                        { code: 'nurple', name: 'Nurple', desc: 'A mix or purple and black.' },
                        { code: 'bootstrap', name: 'Bootstrap', desc: 'Original Bootstrap inspired theme.' }
                    ], inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { width: '7rem' } }
                }).on('selchanged', function (evt) {
                    if (evt.newItem) {
                        setStorage('dashTheme', evt.newItem.code);
                        var ss = $(document).find('link[id="cssref_theme"]');
                        if (ss.length > 0) {
                            if (ss[0].href.indexOf('themes/' + evt.newItem.code + '/theme.css') === -1) { // Don't change the theme if it isn't changing.
                                console.log({ text: 'Setting theme', theme: evt.newItem, href: ss[0].href });
                                ss[0].sheet.disabled = true;
                                ss[0].href = 'themes/' + evt.newItem.code + '/theme.css';
                                ss[0].sheet.disabled = false;
                            }
                        }
                        else
                            $('<link id="cssref_theme" rel="stylesheet" type="text/css" href="themes/' + evt.newItem.code + '/theme.css" />').appendTo($('head')).attr('data-theme', evt.newItem.code);
                    }
                })[0].val(getStorage('dashTheme', 'default'));
                $('<div></div>').appendTo(divOuter).checkbox({
                    labelText: 'Show Time Remaining',
                    labelStyle: { float: 'left' },
                    value: getStorage('--show-time-remaining') === 'none' ? false : true
                })
                    .on('click', function (evt) {
                        let display =  evt.target.checked ? 'inline-block' : 'none';
                        setStorage('--show-time-remaining', display);
                        $(':root').css('--show-time-remaining', display);
                        $('div.picFeature').each(function(){
                            try{
                                this.countdownEndTime();
                            }
                            catch (err) {
                                console.log(`Unable to restart countdownEndTime for ${$(this).data('eqid')}.`);
                            }
                        })
                    });
                line = $('<div></div>').appendTo(divOuter);
                $('<label></label>').appendTo(line).css({ width: '7rem', display: 'inline-block' }).addClass('field-label').text('Background');
                settings.backgrounds.unshift({ name: 'Use Theme Default', url: '' });
                $('<div></div>').appendTo(line).pickList({
                    id: 'dashBackground',
                    binding: 'background',
                    bindColumn: 1, displayColumn: 0,
                    columns: [{ binding: 'name', text: 'Name', style: { whiteSpace: 'nowrap' } }, { binding: 'url', text: 'Url', style: { whiteSpace: 'nowrap' }, hidden: true }],
                    inputAttrs: { style: { width: '14rem' } },
                    labelAttrs: { style: { display: 'none' } },
                    items: settings.backgrounds
                }).on('selchanged', function (evt) {
                    setStorage('dashBackground', evt.newItem.url);
                    if (evt.newItem.url === 'undefined' || evt.newItem.url === '')
                        $(document.body).css('background-image', '');
                    else
                        $(document.body).css('background-image', `url(${evt.newItem.url})`);
                })[0].val(getStorage('dashBackground', ''));
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>');
                btnPnl.appendTo(contents);
                $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Upload Background', icon: '<i class="fas fa-file-image"></i>' })
                    .on('click', function (e) {
                        var dlg = $.pic.modalDialog.createDialog('dlgUploadBackground', {
                            message: 'Upload Custom Background',
                            width: '470px',
                            height: 'auto',
                            title: 'Upload Custom Background',
                            buttons: [{
                                text: 'Upload Image', icon: '<i class="fas fa-upload"></i>',
                                click: function () {
                                    var bg = dataBinder.fromElement(dlg);
                                    self.uploadBackgroundFile(dlg.find('div[data-bind=backgroundFile]'), bg);
                                }
                            },
                            {
                                text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                                click: function () { $.pic.modalDialog.closeDialog(this); }
                            }]
                        });
                        var line = $('<div>Select a file to upload then click the upload file to add it to the list of selectable backgrounds.</div>').appendTo(dlg);
                        $('<hr></hr>').appendTo(dlg);
                        line = $('<div></div>').appendTo(dlg);
                        $('<div></div>').appendTo(line).fileUpload({ binding: 'backgroundFile', accept: 'image/*', labelText: 'Background', inputAttrs: { style: { width: '24rem' } } })
                            .on('changed', function (e) {

                            });
                        line = $('<div></div>').appendTo(div);
                        dlg.css({ overflow: 'visible' });
                    });
                self._setOrder(settings).appendTo(contents);
            });
        },

        _setOrder: function () {
            var self = this, o = self.options, el = self.element;
            var grp = $('<fieldset></fieldset>').attr('id', 'orderOfElements');
            let _setDefaultOrder = function () {
                col1ullg.empty().text('Column 1');
                col2ullg.empty().text('Column 2');
                col3ullg.empty().text('Column 3');
                colhiddenullg.empty().text('Hidden Items');
                let numCols = parseInt(getStorage('--number-of-columns', parseInt($(':root').css('--number-of-columns'))));
                if (numCols === 3) {
                    setStorage('--dashContainer2-display', 'block');
                    $(':root').css('--dashContainer2-display', 'block');
                    setStorage('--dashContainer3-display', 'block');
                    $(':root').css('--dashContainer3-display', 'block');
                }
                else if (numCols === 2) {
                    setStorage('--dashContainer2-display', 'block');
                    $(':root').css('--dashContainer2-display', 'block');
                    setStorage('--dashContainer3-display', 'none');
                    $(':root').css('--dashContainer3-display', 'none');
                }
                else {
                    setStorage('--dashContainer2-display', 'none');
                    $(':root').css('--dashContainer2-display', 'none');
                    setStorage('--dashContainer3-display', 'none');
                    $(':root').css('--dashContainer3-display', 'none');
                }

                let arr = ['picBodies', 'picCircuits', 'picLights', 'picSchedules', 'picChemistry', 'picPumps', 'picVirtualCircuits', 'picFilters'];

                arr.forEach(id => {
                    let el = $(`.${id}`);
                    let elVarName = '';
                    let disp = '';
                    elVarName = `--${id}-order`;
                    disp = id.substring(3);
                    console.log(elVarName);
                    // Logic for Large Screen Format
                    let orderLg = getStorage(elVarName, parseInt($(':root').css(elVarName)));
                    if (orderLg >= 400) {
                        $(`<li>${disp}</li>`).addClass('btn').attr({ 'data-orderLg': elVarName, 'data-id': id }).appendTo(colhiddenullg);
                    }
                    else if (orderLg >= 200 && numCols === 3) {
                        $(`<li>${disp}</li>`).addClass('btn').attr({ 'data-orderLg': elVarName, 'data-id': id }).appendTo(col3ullg);
                    }
                    else if (orderLg >= 200 && numCols < 3) {
                        // less columns than currently displayed; set to col 1
                        $(`<li>${disp}</li>`).addClass('btn').attr({ 'data-orderLg': elVarName, 'data-id': id }).css('order', 90).appendTo(col1ullg);
                        setStorage(elVarName, 90);
                        $(':root').css(elVarName, 90);
                        $(el).appendTo('.container1');
                    }
                    else if (orderLg >= 100 && numCols > 1) {
                        $(`<li>${disp}</li>`).addClass('btn').attr({ 'data-orderLg': elVarName, 'data-id': id }).appendTo(col2ullg);
                    }
                    else if (orderLg >= 100 && numCols === 1) {
                        $(`<li>${disp}</li>`).addClass('btn').attr({ 'data-orderLg': elVarName, 'data-id': id }).css('order', 90).appendTo(col1ullg);
                        setStorage(elVarName, 90);
                        $(':root').css(elVarName, 90);
                        $(el).appendTo('.container1');
                    }
                    else {
                        $(`<li>${disp}</li>`).addClass('btn').attr({ 'data-orderLg': elVarName, 'data-id': id }).appendTo(col1ullg);
                        $(el).appendTo('.container1');
                    }
                });
            };
            $('<legend>Order of Elements</legend>').appendTo(grp);
            var outerOrderInstDiv = $('<div></div>').addClass('lgOrderInstructions').appendTo(grp);
            var innerOrderInstDiv = $('<label>Drag and drop the items to the desired format.  Screens smaller than 744px will display the columns vertically.</label>').addClass('orderInstructions');
            innerOrderInstDiv.appendTo(outerOrderInstDiv);
            var orderSpinnerDiv = $('<div></div>').appendTo(outerOrderInstDiv).addClass('orderDiv');
            $('<div></div>').appendTo(orderSpinnerDiv).valueSpinner({
                canEdit: true, labelText: '# of Columns', min: 1, max: 3, step: 1,
                value: getStorage('--number-of-columns', parseInt($(':root').css('--number-of-columns'))),
                labelAttrs: { style: { width: '6.7rem' } },
                inputAttrs: { style: { width: '2rem' } }
            })
                .on('change', function (e) {
                    setStorage('--number-of-columns', e.target.val());
                    $(':root').css('--number-of-columns', e.target.val());
                    _setDefaultOrder();
                });
            var col1ullg = $('<ul>Column 1</ul>').attr('id', 'appearance-order-col-1').addClass('connectedSortable').appendTo(outerOrderInstDiv);
            var col2ullg = $('<ul>Column 2</ul>').attr('id', 'appearance-order-col-2').addClass('connectedSortable').appendTo(outerOrderInstDiv);
            var col3ullg = $('<ul>Column 3</ul>').attr('id', 'appearance-order-col-3').addClass('connectedSortable').appendTo(outerOrderInstDiv);
            var colhiddenullg = $('<ul>Hidden Items</ul>').attr('id', 'appearance-order-col-hidden').addClass('connectedSortable').appendTo(outerOrderInstDiv);
            _setDefaultOrder();
            $(function () {
                $("#appearance-order-col-1, #appearance-order-col-2, #appearance-order-col-3, #appearance-order-col-hidden").sortable({
                    connectWith: ".connectedSortable",
                    placeholder: "ui-sort-placeholder",
                    stop: function (event, ui) {
                        console.log(`moving element ${ui.item.data('id')} from ${event.target.id} to ${ui.item[0].parentElement.id}`);
                        let col1ids = $('#appearance-order-col-1').sortable('toArray', { attribute: 'data-orderLg' });
                        let col2ids = $('#appearance-order-col-2').sortable('toArray', { attribute: 'data-orderLg' });
                        let col3ids = $('#appearance-order-col-3').sortable('toArray', { attribute: 'data-orderLg' });
                        let colhiddenids = $('#appearance-order-col-hidden').sortable('toArray', { attribute: 'data-orderLg' });
                        // var numberCols = col1ids.length > 0 ? 1 : 0 + col2ids.length > 0 ? 1 : 0 + col3ids.length > 0 ? 1 : 0;
                        for (let i = 0; i < col3ids.length; i++) {
                            let elVarName = col3ids[i];
                            let order = (i * 5) + 200;
                            setStorage(elVarName, order);
                            $(':root').css(elVarName, order);
                            let disp = elVarName.replace('order', 'display');
                            $(':root').css(disp, 'block');
                            setStorage(disp, 'block');
                            let el = $(`.${elVarName.substring(2).split('-')[0]}`)
                            $(el).appendTo($('.container3'));
                        }
                        for (let i = 0; i < col2ids.length; i++) {
                            let elVarName = col2ids[i];
                            let order = (i * 5) + 100;
                            setStorage(elVarName, order);
                            $(':root').css(elVarName, order);
                            let disp = elVarName.replace('order', 'display');
                            $(':root').css(disp, 'block');
                            setStorage(disp, 'block');
                            let el = $(`.${elVarName.substring(2).split('-')[0]}`)
                            $(el).appendTo($('.container2'));
                        }
                        for (let i = 0; i < col1ids.length; i++) {
                            let elVarName = col1ids[i];
                            let order = (i * 5);
                            setStorage(elVarName, order);
                            $(':root').css(elVarName, order);
                            let disp = elVarName.replace('order', 'display');
                            $(':root').css(disp, 'block');
                            setStorage(disp, 'block');
                            let el = $(`.${elVarName.substring(2).split('-')[0]}`)
                            $(el).appendTo($('.container1'));
                        }
                        for (let i = 0; i < colhiddenids.length; i++) {
                            let elVarName = colhiddenids[i];
                            let order = (i * 5) + 400;
                            setStorage(elVarName, order);
                            $(':root').css(elVarName, order);
                            let disp = elVarName.replace('order', 'display');
                            $(':root').css(disp, 'none');
                            setStorage(disp, 'none');
                        }
                    }
                }).disableSelection();
            });
            return grp;
        },
        _buildConnectionsTab: function (settings) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabConnections', text: 'Connections' };
                var contents = this.addTab(tabObj);
                var divOuter = $('<div class="picConnections"></div>');
                divOuter.appendTo(contents);
                var line = $('<div></div>').appendTo(divOuter);
                var binding = 'services.';
                $('<div></div>').appendTo(line).pickList({
                    labelText: 'Server', binding: binding + 'protocol', required: true,
                    inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft: '.25rem' } },
                    columns: [{ binding: 'val', hidden: true, text: 'Protocol', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Protocol', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Description', style: { whiteSpace: 'nowrap' } }],
                    bindColumn: 0, displayColumn: 1, items: [{ val: 'http://', name: 'http:', desc: 'The nodejs-PoolController is communicating without an SSL certificate' },
                    { val: 'https://', name: 'https:', desc: 'The nodejs-PoolController is communicating using an SSL certificate.' }]
                });
                $('<div></div>').appendTo(line).inputField({ labelText: '', binding: binding + 'ip', inputAttrs: { maxlength: 20 } });
                $('<div></div>').appendTo(line).inputField({ labelText: ':', dataType: 'int', binding: binding + 'port', inputAttrs: { maxlength: 7 }, labelAttrs: { style: { marginLeft: '.15rem', marginRight: '.15rem' } } });
                $('<hr></hr>').appendTo(divOuter);
                line = $('<div></div>').appendTo(divOuter);
                $('<div></div').appendTo(line).checkbox({ labelText: 'Use Proxy to njsPC Server', binding: binding + 'useProxy' });
                //$('<div class="picOptionLine"><label>Server Address</label><input class="picServerAddress" type="text" value="' + settings.services.ip + '"></input><span>:</span><input class="picServerPort" type="text" value="' + settings.services.port + '"></input></div>').appendTo(contents);
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>');
                btnPnl.appendTo(contents);
                $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Find Server', icon: '<i class="fas fa-binoculars"></i>' })
                    .on('click', function (e) {
                        var dlg = $.pic.modalDialog.createDialog('dlgFindPoolController', {
                            message: 'Searching for Controllers',
                            width: '400px',
                            height: 'auto',
                            title: 'Find Pool Controller',
                            buttons: [{
                                text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                                click: function () { $.pic.modalDialog.closeDialog(this); }
                            }]
                        });
                        var line = $('<div></div>').appendTo(dlg);
                        var searchStatus = $('<div></div>').appendTo(line).css({ padding: '.5rem' }).addClass('status-text').addClass('picSearchStatus').text('Searching for running nodejs-PoolController servers.');
                        line = $('<div></div>').appendTo(dlg);
                        $('<hr></hr>').appendTo(line);
                        line = $('<div></div>').css({ textAlign: 'center' }).appendTo(dlg);
                        dlg.css({ overflow: 'visible' });

                        $.getLocalService('/config/findPoolControllers', null, 'Searching for Servers...', function (servers, status, xhr) {
                            if (servers.length > 0) {
                                searchStatus.text(servers.length + ' Running nodejs-PoolController server(s) found.');
                                for (var i = 0; i < servers.length; i++) {
                                    var server = servers[i];
                                    var divSelection = $('<div></div>').addClass('picButton').addClass('nodejs-poolController').addClass('server').addClass('btn').css({ maxWidth: '227px', height: '97px', verticalAlign: 'middle', minWidth: '210px' }).appendTo(line);
                                    $('<div></div>').addClass('body-text').css({ textAlign: 'center' }).appendTo(divSelection).append('<i class="fab fa-node-js" style="font-size:30pt;color:green;vertical-align:middle;"></i>').append('<span style="vertical-align:middle;"> Pool Controller</span>');
                                    $('<div></div>').css({ textAlign: 'center', marginLeft: '1rem', marginRight: '1rem' }).appendTo(divSelection).text(server.origin);
                                    divSelection.data('server', server);
                                    divSelection.on('click', function (e) {
                                        var srv = $(e.currentTarget).data('server');
                                        dataBinder.bind(divOuter, { services: { ip: srv.hostname, port: srv.port, protocol: srv.protocol + '//' } });
                                        $.pic.modalDialog.closeDialog(dlg[0]);
                                    });
                                }
                            }
                            else {
                                searchStatus.text('No running nodesjs-PoolController servers could be found.  Enable SSDP on the pool controller application configuration.');
                            }
                        });
                    });

                var btnApply = $('<div></div>');
                btnApply.appendTo(btnPnl);
                btnApply.actionButton({ text: 'Apply', icon: '<i class="fas fa-save"></i>' });
                btnApply.on('click', function (e) {
                    if (dataBinder.checkRequired(divOuter)) {
                        var cfg = dataBinder.fromElement(divOuter);
                        $.putLocalService('/config/serviceUri', cfg.services, 'Updating Connection...', function (data, status, xhr) {
                            $('div.picDashboard, div.picMessageManager').each(function () {
                                this.reset();
                            });

                        });
                    }

                });
                dataBinder.bind(divOuter, settings);
            });
        },
        _buildFirmwareTab: function (settings) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabFirmware', text: 'System' };
                var contents = this.addTab(tabObj);
                var divOuter = $('<div class="picSystem"></div>');
                divOuter.appendTo(contents);
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>');
                btnPnl.appendTo(contents);
                var btnApply = $('<div id="btnReloadConfig"></div>');
                btnApply.appendTo(btnPnl);
                btnApply.actionButton({ text: 'Reload Config', icon: '<i class="fas fa-redo-alt"></i>' });
                btnApply.addClass('disabled');
                btnApply.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('fa-spin');
                    // Send this off to the server.
                    $(this).find('span.picButtonText').text('Loading Config...');
                    $.putApiService('/app/config/reload', function (data, status, xhr) {

                    });
                    ///$.putApiService(obj.id === 0 ? '/config/intellibrite/setColors' : '/config/lightGroup/' + obj.id + '/setColors', obj, function (data, status, xhr) {

                });
            });
            let njsPcInfo = $('<div class="picFirmware"></div>').attr('id', 'picNjsPCInfo').appendTo($('div.picSystem'));
            let dpInfo = $('<div class="picFirmware"></div>').attr('id', 'picdpInfo').appendTo($('div.picSystem'));
            $.getApiService('/state/appVersion', null, function (sdata, status, xhr) {
                console.log('getting the state from the server');
                console.log(sdata);
                if (sdata.hasOwnProperty('gitLocalBranch')) {
                    $('<div class="picOptionLine"><label>git branch</label><span>' + sdata.gitLocalBranch + '</span></div>').appendTo(njsPcInfo);
                    $('<div class="picOptionLine"><label>git commit</label><span>' + sdata.gitLocalCommit.substring(sdata.gitLocalCommit.length - 7) + '</span></div>').appendTo(njsPcInfo);
                }
                else {
                    $('<div class="picOptionLine"><label>git status</label><span>Git is not in use</span></div>').appendTo(njsPcInfo);
                }
                $('<hr></hr>').appendTo(njsPcInfo);
            });
            $.getLocalService('/config/appVersion', null, function (data, status, xhr) {
                console.log(`getting dashPanel version info`);
                console.log(data);
                $('<div class="picOptionLine dashPanelVersion"><label>dashPanel</label><span>' + data.installed + '</span></div>').prependTo(dpInfo);
                if (data.hasOwnProperty('gitLocalBranch')) {
                    $('<div class="picOptionLine"><label>git branch</label><span>' + data.gitLocalBranch + '</span></div>').appendTo(dpInfo);
                    $('<div class="picOptionLine"><label>git commit</label><span>' + data.gitLocalCommit.substring(data.gitLocalCommit.length - 7) + '</span></div>').appendTo(dpInfo);
                }
                else {
                    $('<div class="picOptionLine"><label>git status</label><span>Git is not in use</span></div>').appendTo(dpInfo);
                }
                $('<hr></hr>').appendTo(dpInfo);
            })
            $.getApiService('/config/all', null, function (data, status, xhr) {
                console.log('getting the configuration from the server');
                console.log(data);
                $('<div class="picOptionLine"><label>njsPC</label><span>' + data.appVersion + '</span></div>').prependTo(njsPcInfo);

                el.find('div.picTabPanel:first').find('div.picSystem').each(function () {
                    let $div = $('<div class="picFirmware"></div>').appendTo($(this));

                    let $divMods = $('<div class="picModules"></div>').appendTo($div);
                    let $hdr = $('<table><tbody><tr><td><label>Panel</label></td><td><label>Module</label></td></tr></tbody></table>').appendTo($divMods);
                    let $tbody = $divMods.find('table:first > tbody');
                    if (typeof data.equipment.modules === 'undefined') {
                        $divMods.hide();
                    }
                    else {
                        $divMods.show();
                        for (let i = 0; i < data.equipment.modules.length; i++) {
                            let mod = data.equipment.modules[i];
                            $('<tr><td><span>Master</span></td><td><div>' + mod.desc + '</div><div>P/N: ' + mod.part + '</div></td></tr>').appendTo($tbody);
                        }
                    }
                    if (typeof data.equipment.expansions !== 'undefined') {
                        for (var j = 0; j < data.equipment.expansions.length; j++) {
                            var exp = data.equipment.expansions[j];
                            if (typeof exp.modules !== 'undefined') {
                                for (var k = 0; k < exp.modules.length; k++) {
                                    var m = exp.modules[k];
                                    $(`<tr><td><span>Exp ${j + 1}</span></td><td><div>${m.desc}</div><div>P/N: ${m.part}</div></td></tr>`).appendTo($tbody);
                                }
                            }
                        }
                    }
                    $('<div class="picOptionLine"><label>Firmware</label><span>' + data.equipment.softwareVersion + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Schedules</label><span>' + data.schedules.length + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Circuits</label><span>' + data.circuits.length + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Features</label><span>' + data.features.length + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Valves</label><span>' + data.valves.length + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Pumps</label><span>' + data.pumps.length + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Schedules</label><span>' + data.schedules.length + '</span></div>').appendTo($div);
                    let btn = el.find('div[id$=btnReloadConfig]');
                    let status = parseInt($('div.picController').attr('data-status'), 10);
                    if (status === 1) {
                        btn.removeClass('disabled');
                    }
                    else {
                        btn.find('i').addClass('fa-spin');
                        btn.find('span.picButtonText').text('Loading Config...');
                    }
                });
            });


        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            var tabs = $('<div class="picTabPanel"></div>');
            console.log('Building controls');
            tabs.appendTo(el);
            tabs.tabBar();
            $.getLocalService('/options', null, function (configData, status, xhr) {
                console.log(configData);
                o.initializing = true;
                self._buildAppearanceTab(configData);
                self._buildConnectionsTab(configData.web);
                self._buildLoggingTab();
                self._buildFirmwareTab(configData.web);
                tabs[0].selectTabById('tabAppearance');
                var evt = $.Event('loaded');
                o.initializing = false;
                el.trigger(evt);

            });
        },
        setState: function (data) {
            var self = this, o = self.options, el = self.element;
        },
        uploadBackgroundFile: function (uploader, opts) {
            var self = this, o = self.options, el = self.element;
            var divPopover = $('<div></div>');
            divPopover.appendTo(document.body);
            divPopover.on('initPopover', function (e) {
                var progress = $('<div></div>').appendTo(e.contents()).uploadProgress();
                e.stopImmediatePropagation();
                uploader[0].upload({
                    url: 'upload/backgroundFile',
                    params: { preserveFile: false },
                    progress: function (xhr, evt, prog) {
                        //console.log(xhr, evt, prog);
                        progress[0].setUploadProgress(prog.loaded, prog.total);
                    },
                    complete: function (data, status, xhr) {
                        data.backgrounds.unshift({ name: 'Use Theme Default', url: '' });
                        progress.parents('div.picPopover:first')[0].close();
                        console.log(el);
                        el.find('div.picPickList#dashBackground').each(function () {
                            this.items(data.backgrounds);
                            this.val(data.uploaded.url);
                        });
                        $.pic.modalDialog.closeDialog(uploader[0]);
                    }
                });
                //console.log(opts);

            });
            divPopover.popover({ autoClose: false, title: 'Uploading Background File', popoverStyle: 'modal', placement: { my: 'center center', at: '50% 50%', of: document.body } });
            divPopover[0].show(uploader);
        },
        resetState: function () {
            var self = this, o = self.options, el = self.element;
        }
    });
    $.widget('pic.packetFilter', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            o = { processing: false };
        },
        _buildActionTab: function (op, actions) {
            var self = this, o = self.options, el = self.element;
            var ucase = op[0].toUpperCase() + op.slice(1);
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tab' + ucase, text: ucase };
                var contents = this.addTab(tabObj);
                var divOuter = $('<div class="picMessageActions"></div>').css({ width: '14.5rem' });
                divOuter.appendTo(contents);
                var btn = $('<div></div>').css({ width: '14rem' });
                btn.appendTo(divOuter);
                btn.optionButton({ text: op === 'exclude' ? 'Exclude None' : 'Include All' });
                btn.attr('data-actionid', 'all');
                for (var i = 0; i < actions.length; i++) {
                    var act = actions[i];
                    // Create an option for each one of the messages.
                    btn = $('<div></div>').css({ width: '14rem' });
                    btn.appendTo(divOuter);
                    btn.optionButton({ text: '[' + act.val + '] ' + act.desc });
                    btn.attr('data-actionid', act.val);
                }
                divOuter.on('click', 'div.picOptionButton', function (e) {
                    e.stopImmediatePropagation();
                    var actid = $(e.currentTarget).attr('data-actionid');
                    var arr = [];
                    var b = makeBool(e.currentTarget.val());
                    var obj = { packet: {} };
                    obj.packet[o.protocol] = {};

                    //console.log({ actid: actid, b: b });
                    if (actid === 'all') {
                        // Deselect/select everything else.
                        contents.find('div.picOptionButton').each(function () {
                            actid = $(this).attr('data-actionid');
                            if (actid !== 'all') this.val(!b);
                        });
                    }
                    divOuter.find('div.picOptionButton').each(function () {
                        actid = $(this).attr('data-actionid');
                        if (actid !== 'all' && makeBool(this.val()))
                            arr.push(parseInt(actid, 10));
                    });
                    divOuter.find('div.picOptionButton[data-actionid=all]')[0].val(arr.length === 0);
                    //console.log(arr);
                    obj.packet[o.protocol][op + 'Actions'] = arr;
                    //console.log(obj);
                    $.putApiService('app/logger/setOptions', obj);

                });
            });
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            var tabs = $('<div class="picTabPanel"></div>');
            tabs.appendTo(el);
            tabs.tabBar();
            $.getApiService('/app/messages/' + o.protocol + '/actions', undefined, function (actions, status, xhr) {
                console.log(actions);
                self._buildActionTab('include', actions);
                self._buildActionTab('exclude', actions);
                tabs[0].selectTabById('tabInclude');

                var evt = $.Event('loaded');
                el.trigger(evt);
                $.getApiService('/app/config/log.packet.' + o.protocol, null, function (data, status, xhr) {
                    console.log(data);
                    self.setState(data);
                });
            });
        },
        setState: function (data) {
            var self = this, o = self.options, el = self.element;
            try {
                var tabBar = el.find('div.picTabBar:first')[0];
                var tabInclude = tabBar.tabContent('tabInclude');
                var tabExclude = tabBar.tabContent('tabExclude');
                //console.log({ include: tabInclude, exclude: tabExclude });
                tabInclude.find('div.picOptionButton[data-actionid=all]')[0].val(data.includeActions.length === 0);
                tabExclude.find('div.picOptionButton[data-actionid=all]')[0].val(data.excludeActions.length === 0);
                for (var i = 0; i < data.includeActions.length; i++) {
                    tabInclude.find('div.picOptionButton[data-actionid=' + data.includeActions[i] + ']')[0].val(true);
                }
                for (var i = 0; i < data.excludeActions.length; i++) {
                    tabExclude.find('div.picOptionButton[data-actionid=' + data.excludeActions[i] + ']')[0].val(true);
                }

            } catch (err) { console.error(err); }
        }
    });
})(jQuery);


