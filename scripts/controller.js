(function ($) {
    $.widget("pic.controller", {
        options: { },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initController = function (data) { self._initController(data); };
            el[0].setControllerState = function (data) { self.setControllerState(data); };
            el[0].setEquipmentState = function (data) { self.setEquipmentState(data); };
            el[0].setConnectionError = function (data) { self.setConnectionError(data); };
        },
        _initController: function(data) {
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

            row = $('<div class="picFreezeProtect" data-status="on"><i class="fas fa-snowflake burst-animated"></i><label>FREEZE PROTECTION</label><i class="fas fa-snowflake burst-animated"></i></div>');
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
            self.setEquipmentState(data.equipment);
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
                let dt = new Date.parseISO(data.time);
                el.find('span.picControllerTime').each(function () {
                    if (typeof data.clockMode !== 'undefined' && data.clockMode.val === 24) {
                        $(this).text(dt.format('MM/dd/yyyy HH:mm'));
                    }
                    else
                        $(this).text(dt.format('MM/dd/yyyy h:mmtt'));
                    //$(this).text(self.formatDate(dt));
                });
                el.find('div.picControllerStatus').each(function () {
                    let ln = $(this);
                    ln.find('span.picPercentData').text(data.status.name === 'loading' ? data.status.percent + '%' : '');
                    ln.find('span.picStatusData').text(data.status.desc);
                    ln.find('div.picIndicator').attr('data-status', data.status.name);
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
            } catch (err) { console.error(err); }

        },
        setEquipmentState: function (data) {
            var self = this, o = self.options, el = self.element;
            el.attr('data-maxbodies', data.maxBodies);
            el.attr('data-maxvalves', data.maxValves);
            el.attr('data-maxcircuits', data.maxCircuits);
            el.attr('data-shared', data.shared);
            el.find('div.picModel > span.picModelData').text(data.model);
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
                        $('<div></div>').appendTo(line).checkbox({ labelText: 'Capture Configuration Reload', binding: 'reload' })[0].val(true);


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
                        { code: 'default', name: 'Default', desc: 'The default theme for the dashPanel' },
                        { code: 'sketchy', name: 'Sketchy', desc: 'A whimsical display that looks like it is hand drawn' }
                    ], inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: { width: '4rem' } }
                }).on('selchanged', function (evt) {
                    console.log(evt.newItem);
                    setCookie('dashTheme', evt.newItem.code);
                    var ss = $(document).find('link[id="cssref_theme"]');
                    if (ss.length > 0) {
                        if (ss[0].href !== 'themes/' + evt.newItem.code + '/theme.css') { // Don't change the theme if it isn't changing.
                            ss[0].sheet.disabled = true;
                            ss[0].href = 'themes/' + evt.newItem.code + '/theme.css';
                            ss[0].sheet.disabled = false;
                        }
                    }
                    else
                        $('<link id="cssref_theme" rel="stylesheet" type="text/css" href="themes/' + evt.newItem.code + '/theme.css" />').appendTo($('head'));


                })[0].val(getCookie('dashTheme', 'default'));
            });
        },
        _buildConnectionsTab: function (settings) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabConnections', text: 'Connections' };
                var contents = this.addTab(tabObj);
                var divOuter = $('<div class="picConnections"></div>');
                divOuter.appendTo(contents);
                $('<div class="picOptionLine"><label>Server Address</label><input class="picServerAddress" type="text" value="' + settings.services.ip + '"></input><span>:</span><input class="picServerPort" type="text" value="' + settings.services.port + '"></input></div>').appendTo(contents);
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>');
                btnPnl.appendTo(contents);
                var btnApply = $('<div></div>');
                btnApply.appendTo(btnPnl);
                btnApply.actionButton({ text: 'Apply', icon: '<i class="fas fa-save"></i>' });
                btnApply.addClass('disabled');
                btnApply.on('click', function (e) {

                });
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
                    $.putApiService('/app/config/reload', function(data, status, xhr) {
                        
                    });
                    ///$.putApiService(obj.id === 0 ? '/config/intellibrite/setColors' : '/config/lightGroup/' + obj.id + '/setColors', obj, function (data, status, xhr) {

                });
            });
            $.getApiService('/config/all', null, function (data, status, xhr) {
                console.log('getting the configuration from the server');
                console.log(data);
                el.find('div.picTabPanel:first').find('div.picSystem').each(function () {
                    let $div = $('<div class="picFirmware"></div>').appendTo($(this));
                    $('<div class="picOptionLine"><label>Version</label><span>' + data.equipment.softwareVersion + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Bodies</label><span>' + data.bodies.length + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Circuits</label><span>' + data.circuits.length + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Features</label><span>' + data.features.length + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Valves</label><span>' + data.valves.length + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Pumps</label><span>' + data.pumps.length + '</span></div>').appendTo($div);
                    $('<div class="picOptionLine"><label>Schedules</label><span>' + data.schedules.length + '</span></div>').appendTo($div);
                    let $divMods = $('<div class="picModules"></div>').appendTo($(this));
                    let $hdr = $('<table><tbody><tr><td><label>Panel</label></td><td><label>Module</label></td></tr></tbody></table>').appendTo($divMods);
                    let $tbody = $divMods.find('table:first > tbody');
                    if (data.equipment.modules === 'undefined') {
                        $divMods.hide();
                    }
                    else {
                        $divMods.show();
                        for (let i = 0; i < data.equipment.modules.length; i++) {
                            let mod = data.equipment.modules[i];
                            let $row = $('<tr><td><span>Master</span></td><td><div>' + mod.desc + '</div><div>P/N: ' + mod.part + '</div></td></tr>').appendTo($tbody);
                        }
                    }
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
            $.getJSON('/config/web', null, function (configData, status, xhr) {
                console.log(configData);
                o.initializing = true;
                self._buildAppearanceTab(configData);
                self._buildConnectionsTab(configData);
                self._buildLoggingTab();
                self._buildFirmwareTab(configData);
                tabs[0].selectTabById('tabAppearance');
                var evt = $.Event('loaded');
                o.initializing = false;
                el.trigger(evt);

            });
        },
        setState: function (data) {
            var self = this, o = self.options, el = self.element;
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
        _buildActionTab: function(op, actions) {
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
            } catch (err) { console.error(err); }
        }
    });
})(jQuery);


