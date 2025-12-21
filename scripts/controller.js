(function ($) {
    $.widget("pic.controller", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initController = function (data) { self._initController(data); };
            el[0].setControllerState = function (data) { self.setControllerState(data); };
            el[0].setEquipmentState = function (data) { self.setEquipmentState(data); };
            el[0].setConnectionError = function (data) { self.setConnectionError(data); };
            el[0].setPanelMode = function (data) { self.setPanelMode(data); };
            el[0].enablePanels = function (bEnable) { self.enablePanels(bEnable); };
            // allow other widgets (e.g. Settings) to trigger a re-evaluation of locked UI
            el[0].refreshSecurity = function () { self._refreshSecurityStatus(function () { self._applySecurityUi(); }); };
        },
        _refreshSecurityStatus: function (cb) {
            var self = this, o = self.options, el = self.element;
            $.getLocalService('/security/status', null, function (data) {
                o.security = data || {};
                if (typeof cb === 'function') cb(o.security);
            }, function () {
                // If the security route doesn't exist or errors, fail open.
                o.security = { enabled: false, hasPassword: false, unlocked: true, lockUiStyle: 'LOCKED_VISIBLE' };
                if (typeof cb === 'function') cb(o.security);
            });
        },
        _isSecurityActive: function () {
            var self = this, o = self.options, el = self.element;
            return !!(o.security && o.security.enabled === true && o.security.hasPassword === true);
        },
        _applySecurityUi: function () {
            var self = this, o = self.options, el = self.element;
            var active = self._isSecurityActive();
            var unlocked = !!(o.security && o.security.unlocked === true);
            var style = (o.security && o.security.lockUiStyle) ? o.security.lockUiStyle : 'LOCKED_VISIBLE';
            // In hide mode, only hide the hamburger/gear while locked. Once unlocked, show them.
            var hideIcons = active && style === 'HIDE_SHOW_LOCK_ICON' && !unlocked;
            // Hamburger/gear should be gray only when locked.
            var dimIcons = active && !unlocked;

            // Visual treatment when locked (subtle gray).
            el.find('div.picModel > i').toggleClass('picAdminLocked', dimIcons);
            el.find('div.picConfigIcon').toggleClass('picAdminLocked', dimIcons);
            // Ensure the icon itself is gray even if styles target the <i> element.
            el.find('div.picConfigIcon > i').toggleClass('picAdminLocked', dimIcons);

            // Hide/show hamburger + gear and lock icon depending on style.
            el.find('div.picModel > i').css({ display: hideIcons ? 'none' : '' });
            el.find('div.picConfigIcon').css({ display: hideIcons ? 'none' : '' });
            // Lock icon should always be visible when security is active, and flip between lock/unlock glyph.
            el.find('div.picLockIcon').css({ display: active ? 'inline-block' : 'none' });
            // Flip icon based on current state (subtle cue)
            el.find('div.picLockIcon > i').attr('class', (active && unlocked) ? 'fas fa-unlock' : 'fas fa-lock');
        },
        _showSecurityDialog: function (mode, onSuccess) {
            // mode: 'setup' | 'unlock'
            var self = this, o = self.options, el = self.element;
            var isSetup = mode === 'setup';
            var pwInput, confirmInput;
            var doPrimaryAction;
            var dlg = $.pic.modalDialog.createDialog(isSetup ? 'dlgAdminSetup' : 'dlgAdminUnlock', {
                width: '380px',
                height: 'auto',
                title: isSetup ? 'Set Admin Password' : 'Admin Unlock',
                position: { my: "center bottom", at: "center top", of: el },
                buttons: [{
                    text: isSetup ? 'Set Password' : 'Unlock', icon: '<i class="fas fa-lock"></i>',
                    click: function () {
                        return doPrimaryAction && doPrimaryAction();
                    }
                }, {
                    text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                    click: function () { $.pic.modalDialog.closeDialog(this); }
                }]
            });

            doPrimaryAction = function () {
                        try {
                            $.pic.fieldTip.clearTips(dlg);
                        } catch (e) { }
                        var pw = pwInput && pwInput.length ? (pwInput.val() || '').toString() : '';
                        var confirm = confirmInput && confirmInput.length ? (confirmInput.val() || '').toString() : '';
                        if (typeof pw !== 'string' || pw.length < 4 || pw.length > 20) {
                            $.pic.fieldTip.showTip(pwInput, { message: 'Password must be 4–20 characters.' });
                            return;
                        }
                        if (isSetup) {
                            if (pw !== confirm) {
                                $.pic.fieldTip.showTip(confirmInput, { message: 'Passwords do not match.' });
                                return;
                            }
                            $.postLocalService('/security/setup', { password: pw }, 'Setting admin password...', function () {
                                $.pic.modalDialog.closeDialog(dlg);
                                self._refreshSecurityStatus(function () {
                                    self._applySecurityUi();
                                    if (typeof onSuccess === 'function') onSuccess();
                                });
                            });
                        }
                        else {
                            $.postLocalService('/security/unlock', { password: pw }, 'Unlocking...', function () {
                                $.pic.modalDialog.closeDialog(dlg);
                                self._refreshSecurityStatus(function () {
                                    self._applySecurityUi();
                                    if (typeof onSuccess === 'function') onSuccess();
                                });
                            });
                        }
            };
            var line = $('<div></div>').appendTo(dlg);
            $('<div></div>').appendTo(line).addClass('info-message').text(isSetup
                ? 'Set an admin password to lock the Settings and Configuration areas. Password is required after restart.'
                : 'Enter the admin password to unlock Settings and Configuration.');
            $('<hr></hr>').appendTo(dlg);
            line = $('<div class="picOptionLine"></div>').appendTo(dlg);
            $('<label></label>').appendTo(line).css({ width: '9rem', display: 'inline-block' }).addClass('field-label').text(isSetup ? 'New Password' : 'Password');
            pwInput = $('<input/>').appendTo(line)
                .attr('type', 'password')
                .attr('maxlength', '20')
                .css({ width: '14rem' });
            pwInput.on('keydown', function (evt) {
                if (evt.key === 'Enter') {
                    evt.preventDefault();
                    evt.stopImmediatePropagation();
                    if (doPrimaryAction) doPrimaryAction();
                }
            });
            if (isSetup) {
                line = $('<div class="picOptionLine"></div>').appendTo(dlg);
                $('<label></label>').appendTo(line).css({ width: '9rem', display: 'inline-block' }).addClass('field-label').text('Confirm');
                confirmInput = $('<input/>').appendTo(line)
                    .attr('type', 'password')
                    .attr('maxlength', '20')
                    .css({ width: '14rem' });
                confirmInput.on('keydown', function (evt) {
                    if (evt.key === 'Enter') {
                        evt.preventDefault();
                        evt.stopImmediatePropagation();
                        if (doPrimaryAction) doPrimaryAction();
                    }
                });
            }
            dlg.css({ overflow: 'visible' });
        },
        _ensureAdminAccess: function (onAllowed) {
            var self = this, o = self.options, el = self.element;
            self._refreshSecurityStatus(function () {
                // Not active => allow access (prevents lockout before password configured)
                if (!self._isSecurityActive()) {
                    if (o.security && o.security.hasPassword !== true) {
                        // If user has enabled security but no password, allow setup when they try.
                        if (o.security && o.security.enabled === true) return self._showSecurityDialog('setup', onAllowed);
                    }
                    return (typeof onAllowed === 'function') ? onAllowed() : undefined;
                }
                if (o.security.unlocked === true) return (typeof onAllowed === 'function') ? onAllowed() : undefined;
                return self._showSecurityDialog('unlock', onAllowed);
            });
        },
        _showPanelMode: function () {
            var self = this, o = self.options, el = self.element;
            var dlg = $.pic.modalDialog.createDialog('dlgPanelMode', {
                width: '357px',
                height: 'auto',
                title: `Select a Panel Mode`,
                position: { my: "center bottom", at: "center top", of: el },
                buttons: [
                    {
                        text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }
                ]
            });
            $('<div></div>').appendTo(dlg).serviceModePanel();
            dlg.css({ overflow: 'visible' });
        },
        _initController: function (data) {
            var self = this, o = self.options, el = self.element;
            el.empty();

            let row = $('<div class="picHeaderRow picControllerTitle control-panel-title"></div>').appendTo(el);
            $('<div class= "picModel"><i class="fas fa-bars"></i><span class="picModelData"></span></div>').appendTo(row);
            $('<div class="picControllerTime"><span class="picControllerTime"></span></div>').appendTo(row);
            $('<div></div>').appendTo(row).sysMessageIcon({hideOnEmpty: true}).addClass('picSysMessages');
            if ($('div.dashOuter').length) {
                var divStatus = $('<div></div>').addClass('picControllerStatus').appendTo(row);
                var cstatus = $('<div></div>').appendTo(divStatus)
                    .on('click', function (evt) {
                        var controller = $('body').attr('data-controllertype');
                        if(controller === 'nixie') self._showPanelMode();

                    }).css({ display: 'inline-block' });

                $('<span></span>').addClass('picStatusData').appendTo(cstatus);
                $('<span></span>').addClass('picPercentData').appendTo(cstatus);
                $('<div></div>').addClass('picIndicator').attr('data-status', 'error').appendTo(cstatus);
                $('<i></i>').addClass('fas fa-lock').appendTo($('<div></div>').addClass('picLockIcon').appendTo(divStatus));
                $('<i></i>').addClass('fas fa-cogs').appendTo($('<div></div>').addClass('picConfigIcon').appendTo(divStatus));
                //$('<div class="picControllerStatus"><span class="picStatusData"></span><span class="picPercentData"></span><div class="picIndicator" data-status="error"></div><div class="picConfigIcon"><i class="fas fa-cogs"></i></div></div>').appendTo(row);
            }
            else {
                
                $('<div class="picControllerStatus"><span class="picStatusData"></span><span class="picPercentData"></span><div class="picIndicator" data-status="error"></div></div>').appendTo(row);

            }
            console.log('jQuery:' + jQuery.fn.jquery + ' jQueryUI:' + ($.ui.version || 'pre 1.6'));
            row = $('<div class="picFreezeProtect" data-status="off"><i class="fas fa-snowflake burst-animated"></i><label>FREEZE PROTECTION</label><i class="fas fa-snowflake burst-animated"></i></div>');
            row.appendTo(el);
            row = $('<div class="picPanelMode" data-status="auto"><i class="far fa-pause-circle burst-animated"></i><label></label><span class="service-timeout-remaining"></span><i class="far fa-pause-circle burst-animated"></i></div>');
            row.appendTo(el);
            $('<div class="picSpaDrain" data-status="off"><i class="fas fa-skull-crossbones burst-animated"></i><label>SPA DRAIN ACTIVE</label><i class="fas fa-skull-crossbones burst-animated"></i></div>').appendTo(el);
            el.find('div.picModel > i').on('click', function (evt) {
                var btn = evt.currentTarget;
                self._ensureAdminAccess(function () {
                    // Open up the settings window.
                    var divPopover = $('<div class="picAppSettings"></div>');
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
                });
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });

            el.find('div.picConfigIcon').on('click', function (evt) {
                let btn = $(this);
                self._ensureAdminAccess(function () {
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
            });

            el.find('div.picLockIcon').on('click', function (evt) {
                evt.preventDefault();
                evt.stopImmediatePropagation();
                self._refreshSecurityStatus(function () {
                    if (self._isSecurityActive() && o.security.unlocked === true) {
                        $.postLocalService('/security/lock', {}, 'Locking...', function () {
                            self._refreshSecurityStatus(function () { self._applySecurityUi(); });
                        });
                    }
                    else {
                        // If not configured but enabled, allow setup.
                        if (o.security && o.security.enabled === true && o.security.hasPassword !== true) {
                            return self._showSecurityDialog('setup', function () { });
                        }
                        return self._showSecurityDialog('unlock', function () { });
                    }
                });
            });

            // Initialize lock UI (fails open if route is missing).
            self._refreshSecurityStatus(function () { self._applySecurityUi(); });
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
            self.enablePanels(false);
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
        enablePanels: function (bEnable) {
            var self = this, o = self.options, el = self.element;
            var dc = $('.dashContainer');
            var cc = $('.configContainer');
            if (!bEnable) {
                dc.children('div').css({ opacity: .7 });
                cc.css({ opacity: .7 });
                //dc.css({ opacity: .7 });
                if (dc.find('div.disable-overlay').length === 0) {
                    $('<div></div>').appendTo(dc).addClass('disable-overlay').on('click', function (evt) { evt.preventDefault(); evt.stopImmediatePropagation(); });
                }
                if (cc.find('div.disable-overlay').length === 0) {
                    $('<div></div>').appendTo(cc).addClass('disable-overlay').on('click', function (evt) { evt.preventDefault(); evt.stopImmediatePropagation(); });
                }
            }
            else {
                dc.children('div').css({ opacity: '' });
                cc.css({ opacity: 1 });
                //dc.css({ opacity: 1 });
                dc.find('div.disable-overlay').remove();
                cc.find('div.disable-overlay').remove();
            }
        },
        setPanelMode: function (data) {
            var self = this, o = self.options, el = self.element;
            try {
                var pnlMode = el.find('div.picPanelMode');
                pnlMode.attr('data-status', data.mode.name);
                pnlMode.find('label').text(`${data.mode.desc} Mode`);
                if (data.mode.name !== 'timeout' || isNaN(data.remaining) || !data.remaining) pnlMode.find('span').text('');
                else {
                    pnlMode.find('span').text(`: ${dataBinder.formatDuration(Math.round(data.remaining))} `);
                }
                var dc = $('.dashContainer');
                if (data.mode.name !== 'auto') {
                    self.enablePanels(false);
                }
                else {
                    self.enablePanels(true);
                }

            } catch(err) { console.error(err); }
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
                    var pnlMode = el.find('div.picPanelMode');
                    pnlMode.attr('data-status', data.mode.name);
                    pnlMode.find('label').text(`${data.mode.desc} Mode`);
                    if (data.mode.name !== 'timeout') pnlMode.find('span').text('');
                    if (data.mode.name !== 'auto') self.enablePanels(false);
                    else self.enablePanels(true);
                    el.find('div.picFreezeProtect').attr('data-status', data.freeze ? 'on' : 'off');
                    if (typeof data.valveMode !== 'undefined') el.find('div.picSpaDrain').attr('data-status', data.valveMode.name === 'spadrain' ? 'on' : 'off');
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
                el.find('div.picModel > i').click();
            }
        }
    });
    $.widget('pic.serviceModePanel', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            var line = $('<div></div>').appendTo(el);
            $('<div></div>').addClass('info-message').text('Enabling Service or Timeout Modes will disable all circuits and returns local control to any connected equipment.').appendTo(line);
            $('<hr></hr>').appendTo(el);
            var btnStyle = { width: '7rem', margin: '0px auto', display: 'block' };
            //var btnStyle = { width: '7rem', margin: '0px auto' };
            line = $('<div></div>').appendTo(el).css({ marginBottom: '5px' });
            $('<div></div>').appendTo(line).actionButton({ id: 'btnAutoMode', text: 'Auto', icon: '<i class="fas fa-circle-check"></i>' }).on('click', function (evt) {
                // Maybe at some point we prompt for the user to restart any cancelled schedules.  At this point however popping back into auto mode does not do that.
                $.putApiService('/state/panelMode', { mode: 'auto' }, 'Setting Auto Mode...', function (data, status, xhr) {

                });

            }).css(btnStyle);
            line = $('<div></div>').appendTo(el).css({ marginBottom: '5px' });
            $('<div></div>').appendTo(line).actionButton({ id: 'btnServiceMode', text: 'Service', icon: '<i class="fas fa-circle-pause"></i>' }).on('click', function (evt) {
                self._promptService();

            }).css(btnStyle);
            line = $('<div></div>').appendTo(el).css({ marginBottom: '7px' });
            $('<div></div>').appendTo(line).actionButton({ id: 'btnTimeoutMode', text: 'Timeout', icon: '<i class="fas fa-stopwatch"></i>' }).on('click', function (evt) {
                // For this we will be bringing up another dialog so two deep
                self._promptTimeout();
            }).css(btnStyle);
        },
        _promptTimeout: function() {
            var self = this, o = self.options, el = self.element;
            var dlg = $.pic.modalDialog.createDialog('dlgServiceTimeoutPrompt', {
                width: '357px',
                height: 'auto',
                title: `Begin Service Timeout`,
                position: { my: "center bottom", at: "center top", of: el },
                buttons: [
                    {
                        text: 'Begin Service Timeout', icon: '<i class="fas fa-stopwatch"></i>',
                        click: function () {
                            var t = dataBinder.fromElement(dlg);
                            console.log(t);
                            var sec = (t.hours * 3600) + (t.minutes * 60);
                            if (!sec) $.pic.fieldTip.showTip(dlg.find('div[data-bind=hours'), { message: 'You must supply the time' });
                            else {
                                $.putApiService('/state/panelMode', { mode: 'timeout', timeout: sec }, 'Beginning Service Timeout...', function (data, status, xhr) {
                                    $.pic.modalDialog.closeDialog(dlg);
                                });
                            }
                        }
                    },
                    {
                        text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }
                ]
            });
            $('<div></div>').addClass('warning-message').appendTo(dlg).html('<span style="font-weight:bold">WARNING:</span> When using this feature you should assume that equipment may start at any time.  Do not disassemble, disconnect, or maintain equipment without first removing power.').css({ margin: '4px', fontSize:'.9rem' });
            $('<div></div>').addClass('info-message').text('The panel will return to Auto mode after the specified number of hours and minutes.').appendTo(dlg);

            $('<hr></hr>').appendTo(dlg);
            var line = $('<div></div>').appendTo(dlg);
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding:'hours', labelText: 'Timeout', units: 'hrs', min: 0, max: 999, step: 1, fmtMask: '#,##0', labelAttrs: { style: { marginRight: '.25rem' } } }).css({ marginRight: '.25rem' });
            $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, binding: 'minutes', labelText: 'Minutes', units: 'min', min: 0, max: 59, step: 1, fmtMask: '#,##0', labelAttrs: { style: { display: 'none' } } });
            dlg.css({ overflow: 'visible' });
        },
        _promptService: function () {
            var self = this, o = self.options, el = self.element;
            var dlg = $.pic.modalDialog.createDialog('dlgServicePrompt', {
                width: '357px',
                height: 'auto',
                title: `Set Service Mode`,
                position: { my: "center bottom", at: "center top", of: el },
                buttons: [
                    {
                        text: 'Begin Service', icon: '<i class="fas fa-stopwatch"></i>',
                        click: function () {
                            $.putApiService('/state/panelMode', { mode: 'service' }, 'Beginning Service Mode...', function (data, status, xhr) {
                                $.pic.modalDialog.closeDialog(dlg);
                            });
                        }
                    },
                    {
                        text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }
                ]
            });
            $('<div></div>').addClass('warning-message').appendTo(dlg).html('<span style="font-weight:bold">WARNING:</span> When using this feature you should assume that equipment may start at any time.  Do not disassemble, disconnect, or maintain equipment without first removing power.').css({ margin: '4px', fontSize: '.9rem' });
            $('<div></div>').addClass('info-message').text('Are you sure you want to begin Service Mode?  The panel will remain in service mode until njsPC is restarted or you manually return to Auto mode.').appendTo(dlg);
            dlg.css({ overflow: 'visible' });
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
        _buildSecurityTab: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabSecurity', text: 'Security' };
                var contents = this.addTab(tabObj);
                var divOuter = $('<div class="picSecurity"></div>').appendTo(contents);

                var optsLine = $('<div class="picOptionLine"></div>').appendTo(divOuter);
                $('<label></label>').appendTo(optsLine).css({ width: '9rem', display: 'inline-block' }).addClass('field-label').text('Lock UI Style');
                var selStyle = $('<div></div>').appendTo(optsLine).pickList({
                    id: 'lockUiStyle',
                    bindColumn: 0, displayColumn: 1,
                    labelText: '',
                    binding: 'lockUiStyle',
                    columns: [{ binding: 'val', hidden: true, text: 'Val' }, { binding: 'name', text: 'Style' }, { binding: 'desc', text: 'Description' }],
                    items: [
                        { val: 'LOCKED_VISIBLE', name: 'Locked Visible', desc: 'Show hamburger/gear but require password.' },
                        { val: 'HIDE_SHOW_LOCK_ICON', name: 'Hide + Lock Icon', desc: 'Hide hamburger/gear and show gray lock icon.' }
                    ],
                    inputAttrs: { style: { width: '14rem' } },
                    labelAttrs: { style: { display: 'none' } }
                });

                $('<hr></hr>').appendTo(divOuter);

                var pwLine = $('<div class="picOptionLine"></div>').appendTo(divOuter);
                $('<label></label>').appendTo(pwLine).css({ width: '9rem', display: 'inline-block' }).addClass('field-label').text('Password');
                var pwWrap = $('<div class="picSecurityPasswordWrap"></div>').appendTo(pwLine).css({ display: 'inline-block' });
                var pwInput = $('<input/>').appendTo(pwWrap)
                    .attr('type', 'password')
                    .attr('maxlength', '20')
                    .addClass('picSecurityPassword')
                    .css({ width: '14rem' });
                // Save button next to password field
                var btnSaveInline = $('<div></div>').appendTo(pwWrap).actionButton({ text: 'Save', icon: '<i class="fas fa-save"></i>' })
                    .css({ display: 'inline-block', marginLeft: '.35rem' });

                var btnLine2 = $('<div class="picBtnPanel btn-panel"></div>').appendTo(divOuter).css({ marginTop: '.6rem' });
                var btnToggle = $('<div></div>').appendTo(btnLine2).actionButton({ text: 'Enable Security', icon: '<i class="fas fa-toggle-on"></i>' });
                var btnCloseAndLock = $('<div></div>').appendTo(btnLine2).actionButton({ text: 'Close and Lock', icon: '<i class="fas fa-lock"></i>' });
                var btnClose = $('<div></div>').appendTo(btnLine2).actionButton({ text: 'Close', icon: '<i class="far fa-window-close"></i>' });

                function refresh() {
                    $.getLocalService('/security/status', null, function (s) {
                        o.security = s || {};
                        // Track baseline for cancel.
                        o._securityInitial = { enabled: !!o.security.enabled, lockUiStyle: o.security.lockUiStyle, hasPassword: !!o.security.hasPassword };
                        o._securityPending = { lockUiStyle: o.security.lockUiStyle };
                        // bind current style into UI
                        try { dataBinder.bind(divOuter, { lockUiStyle: o.security.lockUiStyle }); } catch (e) { }
                        // show a fixed number of bullets if password exists, otherwise blank placeholder
                        pwInput.val('');
                        pwInput.attr('placeholder', o.security.hasPassword ? '••••••••' : '');
                        pwInput.attr('type', 'password');
                        // Update toggle button based on current enabled state
                        if (o.security.enabled === true) {
                            btnToggle.find('span.picButtonText').text('Disable Security');
                            btnToggle.find('i').attr('class', 'fas fa-toggle-off');
                            btnCloseAndLock.show();
                        }
                        else {
                            btnToggle.find('span.picButtonText').text('Enable Security');
                            btnToggle.find('i').attr('class', 'fas fa-toggle-on');
                            btnCloseAndLock.hide();
                        }
                    }, function () {
                        // If security status unavailable, hide close+lock (safe default)
                        btnCloseAndLock.hide();
                    });
                }

                function applyPendingLockUiStyle(cb) {
                    var pending = (dataBinder.fromElement(divOuter) || {}).lockUiStyle;
                    if (!pending) pending = (o._securityInitial || {}).lockUiStyle;
                    if (o._securityInitial && pending !== o._securityInitial.lockUiStyle) {
                        $.putLocalService('/config/security', { lockUiStyle: pending }, 'Saving...', function () {
                            if (typeof cb === 'function') cb();
                        });
                    }
                    else {
                        if (typeof cb === 'function') cb();
                    }
                }

                // Apply lock UI style immediately when changed (preferred UX).
                selStyle.on('selchanged', function (evt) {
                    if (!evt || !evt.newItem || !evt.newItem.val) return;
                    $.putLocalService('/config/security', { lockUiStyle: evt.newItem.val }, 'Saving...', function () {
                        // Refresh state and re-apply header UI immediately
                        refresh();
                        $('div.picController').each(function () { if (this.refreshSecurity) this.refreshSecurity(); });
                    });
                });

                // No "eye" toggle: password cannot be revealed because only hashes are stored.

                btnSaveInline.on('click', function () {
                    applyPendingLockUiStyle(function () {
                        var pw = (pwInput.val() || '').toString();
                        // Blank password => disable security
                        $.postLocalService('/security/setPassword', { password: pw }, 'Saving...', function () {
                            refresh();
                            $('div.picController').each(function () { if (this.refreshSecurity) this.refreshSecurity(); });
                        });
                    });
                });

                btnToggle.on('click', function () {
                    applyPendingLockUiStyle(function () {
                        // Toggle based on current enabled state
                        if (o.security && o.security.enabled === true) {
                            return $.postLocalService('/security/disable', {}, 'Disabling...', function () {
                                refresh();
                                $('div.picController').each(function () { if (this.refreshSecurity) this.refreshSecurity(); });
                            });
                        }
                        // enabling
                        var pw = (pwInput.val() || '').toString();
                        if (pw.length > 0) {
                            return $.postLocalService('/security/setPassword', { password: pw }, 'Enabling...', function () {
                                refresh();
                                $('div.picController').each(function () { if (this.refreshSecurity) this.refreshSecurity(); });
                            });
                        }
                        // If no new password entered, only enable if password exists already.
                        if (o.security && o.security.hasPassword === true) {
                            return $.putLocalService('/config/security', { enabled: true }, 'Enabling...', function () {
                                refresh();
                                $('div.picController').each(function () { if (this.refreshSecurity) this.refreshSecurity(); });
                            });
                        }
                        $.pic.modalDialog.createApiError({ httpCode: 400, message: 'Set a password before enabling security.' });
                    });
                });

                btnCloseAndLock.on('click', function () {
                    // Save style (if needed), lock immediately, refresh header UI, then close settings.
                    applyPendingLockUiStyle(function () {
                        $.postLocalService('/security/lock', {}, 'Locking...', function () {
                            $('div.picController').each(function () { if (this.refreshSecurity) this.refreshSecurity(); });
                            try {
                                var pop = divOuter.closest('div.picPopover');
                                if (pop.length && pop[0].close) return pop[0].close();
                            } catch (e) { }
                        });
                    });
                });

                btnClose.on('click', function () {
                    // Close the Settings popover dialog
                    try {
                        var pop = divOuter.closest('div.picPopover');
                        if (pop.length && pop[0].close) return pop[0].close();
                    } catch (e) { }
                });

                refresh();
            });
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




                contents.on('click', 'div.picOptionButton.logger', function (evt) {
                    var opt = $(evt.currentTarget);
                    var obj = dataBinder.fromElement(opt);
                    $.putApiService('app/logger/setOptions', obj);
                });

                grp = $('<fieldset></fieldset>');
                leg = $('<legend></legend>').appendTo(grp);

                grp.appendTo(divOuter);
                btn = $('<div class="logger"></div>').appendTo(leg).optionButton({ text: 'Screenlogic', bind: 'screenlogic.enabled' });

                divLine = $('<div class="picPacketLogging"><label>Log to</label></div>');
                divLine.appendTo(grp);


                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'Console', bind: 'screenlogic.logToConsole' });
                btn = $('<div class="logger"></div>').appendTo(divLine).optionButton({ text: 'File', bind: 'screenlogic.logToFile' });
        
                contents.on('click', 'div.picOptionButton.logger', function (evt) {
                    var opt = $(evt.currentTarget);
                    var obj = dataBinder.fromElement(opt);
                    $.putApiService('app/logger/setOptions', obj);
                });
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>');
                btnPnl.appendTo(divOuter);

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
                                    btnStartCapture[0].buttonText('End Capture');
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
                        //btnStartCapture[0].buttonText('End Capture');
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
                        btnStartCapture[0].buttonText('End Capture');
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
                        { code: 'android-material', name: 'Android/Material', desc: 'Material 3 inspired theme.' },
                        { code: 'purple', name: 'Purple', desc: 'A mix of purple and teal.' },
                        { code: 'nurple', name: 'Nurple', desc: 'A mix of purple and black.' },
                        { code: 'bootstrap', name: 'Bootstrap', desc: 'Original Bootstrap inspired theme.' },
                        { code: 'ios-cupertino', name: 'iOS/Cupertino', desc: 'Cupertino inspired theme.' }
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
                        let display = evt.target.checked ? 'inline-block' : 'none';
                        setStorage('--show-time-remaining', display);
                        $(':root').css('--show-time-remaining', display);
                        $('div.picFeature').each(function () {
                            try {
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
                    labelText: 'Server', binding: binding + 'protocol', required: true, canEdit: true,
                    inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginLeft: '.25rem' } },
                    columns: [{ binding: 'val', hidden: true, text: 'Protocol', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Protocol', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Description', style: { whiteSpace: 'nowrap' } }],
                    bindColumn: 0, displayColumn: 1, items: [{ val: 'http://', name: 'http:', desc: 'The nodejs-PoolController is communicating without an SSL certificate' },
                    { val: 'https://', name: 'https:', desc: 'The nodejs-PoolController is communicating using an SSL certificate.' }]
                });
                $('<div></div>').appendTo(line).inputField({ labelText: '', binding: binding + 'ip', inputAttrs: { maxlength: 20, style: { width: '14rem' } } });
                $('<div></div>').appendTo(line).inputField({ labelText: ':', dataType: 'int', fmtMask: '######', binding: binding + 'port', inputAttrs: { maxlength: 7, style: { width: '4rem' } }, labelAttrs: { style: { paddingLeft: '.15rem', marginRight: '.15rem' } } });
                $('<hr></hr>').appendTo(divOuter);
                line = $('<div></div>').appendTo(divOuter);
                $('<div></div').appendTo(line).checkbox({ labelText: 'Use Proxy to njsPC Server', binding: binding + 'useProxy' });
                // Internal-only hostname warning container (hidden by default)
                var warnLine = $('<div class="picOptionLine internal-host-warning" style="display:none;margin-top:.5rem;"></div>').appendTo(divOuter);
                $('<div class="picMessage warn internal-host-msg"></div>')
                    .css({ color: '#c09853', background: '#fcf8e3', padding: '.35rem .5rem', border: '1px solid #fbeed5', borderRadius: '.25rem', fontSize: '.8rem', maxWidth: '32rem' })
                    .html('<i class="fas fa-exclamation-triangle" style="margin-right:.35rem;"></i> Hostname looks internal-only. Enable "Use Proxy" or change to a resolvable host / IP for direct browser access.')
                    .appendTo(warnLine);
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
                                    var divSelection = $('<div></div>').addClass('picButton').addClass('REM').addClass('server').addClass('btn').css({ maxWidth: '227px', height: '97px', verticalAlign: 'middle', minWidth: '210px' }).appendTo(line);
                                    $('<div></div>').addClass('body-text').css({ textAlign: 'center' }).appendTo(divSelection).append('<i class="fab fa-node-js" style="font-size:30pt;color:green;vertical-align:middle;"></i>').append('<span style="vertical-align:middle;"> njsPC Server</span>');
                                    var hostname = server.hostnames && typeof server.hostnames !== 'undefined' && server.hostnames.length === 1 ? server.hostnames[0] : server.hostname;
                                    var ipadddress = server.hostname;
                                    server.resolvedHost = hostname;
                                    if (server.port && typeof server.port !== 'undefined' && !isNaN(server.port)) {
                                        hostname += `:${server.port}`;
                                        ipadddress += `:${server.port}`;
                                    }

                                    $('<div></div>').css({ textAlign: 'center', marginLeft: '1rem', marginRight: '1rem' }).appendTo(divSelection).text(hostname);
                                    $('<div></div>').css({ textAlign: 'center', marginLeft: '1rem', marginRight: '1rem' }).appendTo(divSelection).text(ipadddress);
                                    divSelection.data('server', server);
                                    divSelection.on('click', function (e) {
                                        var srv = $(e.currentTarget).data('server');
                                        dataBinder.bind(divOuter, { services: { ip: srv.resolvedHost, port: srv.port, protocol: srv.protocol + '//' } });
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
                function evaluateInternalHostWarning() {
                    try {
                        var cfg = dataBinder.fromElement(divOuter) || {};
                        var services = cfg.services || {};
                        var host = (services.ip || '').trim();
                        var useProxy = !!services.useProxy;
                        var warn = false;
                        if (!useProxy && host) {
                            var isIPv4 = /^\d+\.\d+\.\d+\.\d+$/.test(host);
                            var isIPv6 = /:/.test(host); // coarse check
                            var hasDot = host.indexOf('.') !== -1;
                            if (!isIPv4 && !isIPv6 && !hasDot && host.toLowerCase() !== 'localhost') warn = true;
                        }
                        if (warn) warnLine.show(); else warnLine.hide();
                    } catch (ex) { /* ignore */ }
                }
                // Bind events to re-evaluate
                divOuter.on('keyup change', 'input', evaluateInternalHostWarning);
                divOuter.on('click', '.picCheckbox', evaluateInternalHostWarning);
                // Initial eval after binding
                setTimeout(evaluateInternalHostWarning, 150);

                btnApply.on('click', function (e) {
                    if (dataBinder.checkRequired(divOuter)) {
                        var cfg = dataBinder.fromElement(divOuter);
                        evaluateInternalHostWarning();
                        $.putLocalService('/config/serviceUri', cfg.services, 'Updating Connection...', function (data, status, xhr) {
                            $('div.picDashboard, div.picMessageManager').each(function () { this.reset(); });
                        });
                    }
                });
                dataBinder.bind(divOuter, settings);
                // Re-evaluate after final bind (in case settings loaded asynchronously)
                setTimeout(evaluateInternalHostWarning, 300);
            });
        },
        _buildBackupTab: function (settings) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabBackup', text: 'Backups' };
                var contents = this.addTab(tabObj);
                var divOuter = $('<div class="picBackups"></div>');
                divOuter.appendTo(contents);
                $.getApiService('/app/config/options/backup', null, function (opts, status, xhr) {
                    console.log(opts);
                    var line = $('<div></div>').appendTo(divOuter);
                    var bo = $('<div></div>').appendTo(divOuter).addClass('pnl-autobackup-options').hide();
                    $('<div></div>').appendTo(line).checkbox({ id: 'cbAutoBackup', labelText: 'Automatic Backups', binding: 'automatic' }).
                        on('changed', function (e) {
                            if (e.newVal === true) bo.show();
                            else bo.hide();
                        });
                    line = $('<div></div>').appendTo(bo);
                    $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'Backup Every', fmtMask: "#,##0", emptyMask: "---", binding: 'interval.days', min: 0, max: 365, step: 1, units: 'days', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '7rem', marginRight: '.25rem' } } });
                    $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: '', fmtMask: "#,##0", emptyMask: "---", binding: 'interval.hours', min: 0, max: 23, step: 1, units: 'hours', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { marginRight: '.25rem' } } });
                    line = $('<div></div>').appendTo(bo);
                    $('<div></div>').appendTo(line).valueSpinner({ canEdit: true, labelText: 'Keep the Last', fmtMask: "#,##0", emptyMask: "---", binding: 'keepCount', min: 1, max: 50, step: 1, units: 'backups on-line', inputAttrs: { maxlength: 4 }, labelAttrs: { style: { width: '7rem', marginRight: '.25rem' } } });
                    line = $('<div></div>').appendTo(bo);
                    $('<hr></hr>').appendTo(line);

                    var servers = $('<div></div>').appendTo(bo).addClass('pnl-autobackup-options-servers');
                    $('<div></div>').appendTo(servers).addClass('info-message').text('Select all the servers you would like to automatically back up');
                    line = $('<div></div>').appendTo(servers);
                    $('<div></div>').appendTo(line).checkbox({ labelText: 'njsPC', binding: 'njsPC' });
                    if (typeof opts.servers !== 'undefined' && opts.servers.length > 0) {
                        for (let i = 0; i < opts.servers.length; i++) {
                            line = $('<div></div>').appendTo(servers);
                            console.log(opts.servers[i]);
                            $('<input></input>').attr('type', 'hidden').appendTo(line).attr('data-bind', `servers[${i}].name`).val(opts.servers[i].name);
                            $('<input></input>').attr('type', 'hidden').appendTo(line).attr('data-bind', `servers[${i}].uuid`).val(opts.servers[i].uuid);
                            $('<div></div>').appendTo(line).checkbox({ labelText: opts.servers[i].name, binding: `servers[${i}].backup` })[0].val(opts.servers[i].backup);
                        }
                    }
                    var btnPnl = $('<div class="picBtnPanel btn-panel"></div>');
                    btnPnl.appendTo(contents);
                    var btnApply = $('<div id="btnSaveBackupConfig"></div>');
                    btnApply.actionButton({ text: 'Apply Settings', icon: '<i class="fas fa-save"></i>' });
                    btnApply.on('click', function (e) {
                        var pnl = divOuter;
                        $.pic.fieldTip.clearTips(pnl);
                        var bk = dataBinder.fromElement(pnl);
                        if (bk.automatic && bk.njsPC !== true && typeof bk.servers.find(elem => elem.backup === true) === 'undefined') {
                            console.log(pnl.find('div[data-bind="automatic"]'));
                            console.log(pnl.find('div[data-bind="interval.days"]'));
                            $.pic.fieldTip.showTip(pnl.find('div[data-bind="automatic"]'), { message: 'You must select at least one server to automatically back up.' });
                        }
                        else {
                            $.putApiService('app/config/options/backup', bk, 'Saving Auto-Backup Configuration...', function (data, status, xhr) {
                                dataBinder.bind(divOuter, data);
                            });
                        }
                    });
                    var btnBackup = $('<div></div>').attr('id', 'btnBackup').actionButton({ text: 'Backup', icon: '<i class="fas fa-tape"></i>' })
                        .on('click', function (e) {
                            self._createBackupDialog();
                        });
                    var btnRestore = $('<div></div>').attr('id', 'btnBackup').actionButton({ text: 'Restore', icon: '<i class="fas fa-tape fa-flip-horizontal"></i>' })
                        .on('click', function (e) {
                            self._createRestoreDialog();
                        });
                    btnRestore.appendTo(btnPnl);
                    btnBackup.appendTo(btnPnl);
                    btnApply.appendTo(btnPnl);
                    dataBinder.bind(divOuter, opts);
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
                btnApply.actionButton({ text: 'Reload Config', icon: '<i class="fas fa-redo-alt"></i>' });
                btnApply.addClass('disabled');
                btnApply.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('fa-spin');
                    // Send this off to the server.
                    $(this).find('span.picButtonText').text('Loading Config...');
                    $.putApiService('/app/config/reload', function (data, status, xhr) {

                    });
                });
                btnApply.appendTo(btnPnl);
            });
            let pnl = el.find('div.picSystem');
            let pnlVer = $('<div></div>').appendTo(pnl).css({ whiteSpace: 'nowrap' });
            let njsPcInfo = $('<div></div>').addClass('picFirmware').attr('id', 'picNjsPCInfo').appendTo(pnlVer);
            let dpInfo = $('<div></div>').addClass('picFirmware').attr('id', 'picdpInfo').appendTo(pnlVer);
            pnlVer.find('div.picFirmware').css({ width: '50%', padding: '4px', display: 'inline-block' });
            //let njsPcInfo = $('<div class="picFirmware"></div>').attr('id', 'picNjsPCInfo').appendTo($('div.picSystem'));
            //let dpInfo = $('<div class="picFirmware"></div>').attr('id', 'picdpInfo').appendTo($('div.picSystem'));
            //$('<div></div>').appendTo(pnl).serviceModePanel({});

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
            });
            $.getApiService('/config/all', null, function (data, status, xhr) {
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
                    let divStats = $('<div></div>').appendTo($div).css({ paddingLeft: '1em' });
                    $('<div class="picOptionLine"><label>Firmware</label><span>' + data.equipment.softwareVersion + '</span></div>').appendTo(divStats);
                    //$('<div class="picOptionLine"><label>Schedules</label><span>' + data.schedules.length + '</span></div>').appendTo(divStats);
                    $('<div class="picOptionLine"><label>Circuits</label><span>' + data.circuits.length + '</span></div>').appendTo(divStats);
                    $('<div class="picOptionLine"><label>Features</label><span>' + data.features.length + '</span></div>').appendTo(divStats);
                    $('<div class="picOptionLine"><label>Valves</label><span>' + data.valves.length + '</span></div>').appendTo(divStats);
                    $('<div class="picOptionLine"><label>Pumps</label><span>' + data.pumps.length + '</span></div>').appendTo(divStats);
                    $('<div class="picOptionLine"><label>Schedules</label><span>' + data.schedules.length + '</span></div>').appendTo(divStats);
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
                self._buildSecurityTab();
                self._buildLoggingTab();
                self._buildFirmwareTab(configData.web);
                self._buildBackupTab(configData);
                let model = $('.picModelData').first().text();
                if (model.includes('Unknown')){
                    tabs[0].selectTabById('tabConnections');
                }
                else {
                    tabs[0].selectTabById('tabAppearance');
                }
                var evt = $.Event('loaded');
                o.initializing = false;
                el.trigger(evt);

            });
        },
        setState: function (data) {
            var self = this, o = self.options, el = self.element;
        },
        _createUploadBackupDialog: function (restoreDialog) {
            var self = this, o = self.options, el = self.element;
            var dlg = $.pic.modalDialog.createDialog('dlgUploadBackground', {
                message: 'Upload Backup File',
                width: '470px',
                height: 'auto',
                title: 'Upload a Backup File',
                buttons: [{
                    text: 'Upload File', icon: '<i class="fas fa-upload"></i>',
                    click: function () {
                        var bf = dataBinder.fromElement(dlg);
                        var useProxy = makeBool($('body').attr('data-apiproxy'));
                        var url = '/app/backup/file';
                        var serviceUrl = useProxy ? '/njsPC' + (!url.startsWith('/') ? '/' : '') + url : $('body').attr('data-apiserviceurl') + (!url.startsWith('/') ? '/' : '') + url;
                        dlg.find('div.picFileUploader').each(function () {
                            this.upload({ url: serviceUrl, showProgress: true });
                        });
                    }
                },
                {
                    text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                    click: function () { $.pic.modalDialog.closeDialog(this); }
                }]
            });
            var line = $('<div>Select a valid backup file to upload then click the upload file to add it to the list available backups.</div>').appendTo(dlg);
            $('<hr></hr>').appendTo(dlg);
            line = $('<div></div>').appendTo(dlg);
            $('<div></div>').appendTo(line).fileUpload({ binding: 'backupFile', showProgress: true, accept: '.zip', labelText: 'Backup File', inputAttrs: { style: { width: '24rem' } } })
                .on('changed', function (e) {
                    console.log(e);
                })
                .on('complete', function (e) {
                    console.log(e);
                    $.pic.modalDialog.closeDialog(dlg);
                    if (restoreDialog.length > 0) restoreDialog[0].loadRestoreFiles(e.fileData.filePath);
                });
            line = $('<div></div>').appendTo(div);
            dlg.css({ overflow: 'visible' });
        },
        _createBackupDialog: function () {
            var self = this, o = self.options, el = self.element;
            var dlg = $.pic.modalDialog.createDialog('dlgBackupController', {
                width: '400px',
                height: 'auto',
                title: 'Create Backup File',
                buttons: [
                    {
                        id: 'btnCreateBackup',
                        text: 'Create Backup', icon: '<i class="fas fa-tape"></i>',
                        click: function () {
                            $.pic.fieldTip.clearTips(dlg);
                            // Build the options data.
                            let opts = dataBinder.fromElement(dlg);
                            opts.automatic = false;
                            // Check to see if there are any servers to back up.  If not then tell the user they are idiots.
                            if (opts.njsPC !== true && opts.dashPanel !== true && typeof opts.servers.find(elem => elem.backup === true) === 'undefined') {
                                $.pic.fieldTip.showTip(dlg.find('div[data-bind=njsPC'), { message: 'You must select at least one server to back up.' });
                            }
                            else {
                                $.putFileApiService('/app/config/createBackup', opts, function (data, status, xhr) {
                                    var url = window.URL.createObjectURL(new Blob([data]));
                                    var link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', 'backup.zip');
                                    document.body.appendChild(link);
                                    link.click();
                                    $(link).remove();
                                    $.pic.modalDialog.closeDialog(dlg);
                                });
                            }
                        },
                        style: { display: 'none' }
                    },
                    {
                        text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }]
            });
            var line = $('<div></div>').appendTo(dlg);
            $('<div></div>').appendTo(line).css({ padding: '.5rem' }).addClass('status-text').addClass('picSearchStatus').text('Provide a name for this backup and select the servers that you want to include in the backup');
            line = $('<div></div>').appendTo(dlg);
            $('<hr></hr>').appendTo(line);
            line = $('<div></div>').css({ textAlign: 'center' }).appendTo(dlg);
            dlg.css({ overflow: 'visible' });
            var servers = $('<div></div>').appendTo(dlg);
            $.getApiService('/app/config/options/backup', null, 'Loading Backup Options...', function (opts, status, xhr) {
                line = $('<div></div>').appendTo(servers);
                $('<div></div>').appendTo(line).inputField({ labelText: 'Name', binding: 'name', inputAttrs: { style: { width: '20rem' } }, labelAttrs: { style: { marginRight: '.25rem' } } });
                line = $('<div></div>').appendTo(servers);
                $('<div></div>').appendTo(line).checkbox({ labelText: 'njsPC', binding: 'njsPC' });
                if (typeof opts.servers !== 'undefined' && opts.servers.length > 0) {
                    for (let i = 0; i < opts.servers.length; i++) {
                        line = $('<div></div>').appendTo(servers);
                        $('<input></input>').attr('type', 'hidden').appendTo(line).attr('data-bind', `servers[${i}].name`).val(opts.servers[i].name);
                        $('<input></input>').attr('type', 'hidden').appendTo(line).attr('data-bind', `servers[${i}].uuid`).val(opts.servers[i].uuid);
                        $('<input></input>').attr('type', 'hidden').appendTo(line).attr('data-bind', `servers[${i}].host`).val(opts.servers[i].host);
                        $('<div></div>').appendTo(line).checkbox({ labelText: opts.servers[i].name, binding: `servers[${i}].backup` });
                    }
                }
                dlg.find('#btnCreateBackup').show();
            });
        },
        _createConfirmRestoreDialog: function (opts, ctx) {
            var self = this, o = self.options, el = self.element;
            var dlg = $.pic.modalDialog.createDialog('dlgConfirmRestoreFile', {
                width: '400px',
                height: 'auto',
                title: 'Confirm Restore from Backup',
                buttons: [
                    {
                        id: 'btnRestoreFile',
                        text: 'Restore', icon: '<i class="fas fa-tape fa-flip-horizontal"></i>',
                        style: { display: 'none' },
                        click: function () {
                            $.pic.fieldTip.clearTips(dlg);
                            // Alright we are ready to begin restoring it all.
                            dlg[0].dialogResult(true);
                            $.pic.modalDialog.closeDialog(this);
                            this.disabled = true;
                            var dlg2 = $.pic.modalDialog.createDialog('restoreResults', {
                                width: '447px',
                                height: 'auto',
                                title: `Restore Results`,
                                position: { my: "center bottom", at: "center top", of: el }
                            });
                            $('<div></div>').appendTo(dlg2).html(`Restore is running.`);
                            $.putApiService('/app/restore/file', opts, function (data, status, xhr) {
                                console.log(data);
                                $('<div></div>').appendTo(dlg2).html(`Restore is done.`);
                                $('<pre></pre>').appendTo(dlg2).css({whiteSpace: 'pre-wrap', wordWrap: 'break-word'}).html(JSON.stringify(data,null,2));

                             });
                        }
                    },
                    {
                        text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }]
            });
            var line = $('<div></div>').appendTo(dlg);
            var instructions = $('<div></div>').appendTo(line).css({ padding: '.5rem' }).addClass('status-text').addClass('picSearchStatus')
            let d = { errors: [], warnings: [], add: 0, update: 0, remove: 0 };

            let hasErrors = false;
            if (opts.options.njsPC) {
                // Extract all the warnings and errors from the server.
                for (let s in ctx.njsPC) {
                    let c = ctx.njsPC[s];
                    if (typeof c.errors !== 'undefined') d.errors.push(...c.errors);
                    if (typeof c.warnings !== 'undefined') d.warnings.push(...c.warnings);
                    if (typeof c.add !== 'undefined') d.add += c.add.length;
                    if (typeof c.update !== 'undefined') d.update += c.update.length;
                    if (typeof c.remove !== 'undefined') d.remove += c.remove.length;
                }
                if (d.errors.length > 0) {
                    let errors = $('<div></div>').appendTo(dlg).css({ maxHeight: '100px', overflowY: 'auto' });
                    line = $('<div></div>').appendTo(errors);
                    $('<span></span>').appendTo(line).css({ fontSize: '.8em', fontWeight: 'bold' }).text(`njsPC Errors`);
                    for (let i = 0; i < d.errors.length; i++) {
                        line = $('<div></div>').appendTo(errors);
                        $('<span></span>').appendTo(line).css({ fontSize: '.7em', marginLeft: '.5em' }).text(d.errors[i]);
                    }
                    hasErrors = true;
                }
                if (d.warnings.length > 0) {
                    let warnings = $('<div></div>').appendTo(dlg).css({ maxHeight: '100px' });
                    line = $('<div></div>').appendTo(warnings);
                    $('<span></span>').appendTo(line).css({ fontSize: '.8em', fontWeight: 'bold' }).text(`njsPC Warnings`);
                    for (let i = 0; i < d.warnings.length; i++) {
                        line = $('<div></div>').appendTo(warnings);
                        $('<span></span>').appendTo(line).css({ fontSize: '.7em', marginLeft: '.5em' }).text(d.warnings[i]);
                    }
                    hasErrors = true;
                }
            }
            
            if (typeof opts.options.servers !== 'undefined') {
                for (let i = 0; i < ctx.servers.length; i++) {
                    let srv = opts.options.servers.find(elem => elem.uuid === ctx.servers[i].server.uuid);
                    for (let s in ctx.servers[i]) {
                        let c = ctx.servers[i][s];
                        if (typeof c.errors !== 'undefined') d.errors.push(...c.errors);
                        if (typeof c.warnings !== 'undefined') d.warnings.push(...c.warnings);
                        if (typeof c.add !== 'undefined') d.add += c.add.length;
                        if (typeof c.update !== 'undefined') d.update += c.update.length;
                        if (typeof c.remove !== 'undefined') d.remove += c.remove.length;
                    }
                    if (d.errors.length > 0) {
                        let errors = $('<div></div>').appendTo(dlg).css({ maxHeight: '100px', overflowY: 'auto' });
                        line = $('<div></div>').appendTo(errors);
                        $('<span></span>').appendTo(line).css({ fontSize: '.8em', fontWeight: 'bold' }).text(`${srv.name} Errors`);
                        for (let i = 0; i < d.errors.length; i++) {
                            line = $('<div></div>').appendTo(errors);
                            $('<span></span>').appendTo(line).css({ fontSize: '.7em', marginLeft: '.5em' }).text(d.errors[i]);
                        }
                        hasErrors = true;
                    }
                    if (d.warnings.length > 0) {
                        let warnings = $('<div></div>').appendTo(dlg).css({ maxHeight: '100px' });
                        line = $('<div></div>').appendTo(warnings);
                        $('<span></span>').appendTo(line).css({ fontSize: '.8em', fontWeight: 'bold' }).text(`${srv.name} Warnings`);
                        for (let i = 0; i < d.warnings.length; i++) {
                            line = $('<div></div>').appendTo(warnings);
                            $('<span></span>').appendTo(line).css({ fontSize: '.7em', marginLeft: '.5em' }).text(d.warnings[i]);
                        }
                    }
                }

            }
            if (!hasErrors) {
                $('<div></div>').appendTo(instructions).css({ fontSize: '.8rem', marginBottom:'4px' }).addClass('warning-message').html('<span style="font-weight:bold">WARNING:</span> This feature is still in BETA.  Please do not use it if you have not been asked to try it out.  This will attempt to send the stored configuration from the backup file to your OCP.');
                $('<div></div>').appendTo(instructions).text('Are you sure you would like to restore this file?  Once the restore process begins it cannot be cancelled.');

                // Don't let them blow by the errors.  The init method needs to be called before we get here anyway.
                setTimeout(() => { dlg.find('div[id=btnRestoreFile]').show(); }, 2000);
            }
            else {
                instructions.text('This file cannot be restored because the following reasons are preventing it.');
            }
            line = $('<div></div>').appendTo(dlg);
            $('<hr></hr>').appendTo(line);
            return dlg;
        },
        _createRestoreDialog: function () {
            var self = this, o = self.options, el = self.element;
            var dlg = $.pic.modalDialog.createDialog('dlgRestoreFile', {
                width: '400px',
                height: 'auto',
                title: 'Restore from Backup',
                buttons: [
                    {
                        id: 'btnUploadBackup',
                        text: 'Upload', icon: '<i class="fas fa-tape fa-rotate-90"></i>',
                        click: function () {
                            $.pic.fieldTip.clearTips(dlg);
                            self._createUploadBackupDialog(dlg);
                        },
                        style: { display: 'none' }
                    },
                    {
                        id: 'btnRestoreBackup',
                        text: 'Restore', icon: '<i class="fas fa-tape fa-flip-horizontal"></i>',
                        style: { display: 'none' },
                        click: function () {
                            $.pic.fieldTip.clearTips(dlg);
                            let opts = dataBinder.fromElement(selectOpts);
                            // Check to see if there are any servers to back up.  If not then tell the user they are idiots.
                            if (opts.options.njsPC !== true && opts.dashPanel !== true && typeof opts.options.servers.find(elem => elem.restore === true) === 'undefined') {
                                $.pic.fieldTip.showTip(selectOpts.find('div[data-bind="options.njsPC"]'), { message: 'You must select at least one server to restore.' });
                            }
                            else {
                                $.putApiService('/app/restore/validate', opts, 'Validating Restore...', function (data, status, xhr) {
                                    console.log(data);
                                    // So we have validated the restore.  Now we need to show a confirm dialog.  Yeah I know this is a lot of layers deep but
                                    // we want to make sure that the user's hand is held all the way on this.
                                    var cdlg = self._createConfirmRestoreDialog(opts, data)
                                        .on('closemodal', function (evt) {
                                            if (evt.dialogResult === true) $.pic.modalDialog.closeDialog(dlg);
                                        });
                                });
                            }
                        }
                    },
                    {
                        id: 'btnToRestoreOptions',
                        //text: 'Next', icon: '<i class="fas fa-tape fa-flip-horizontal"></i>',
                        text: 'Next', icon: '<i class="far fa-hand-point-right"></i>',
                        click: function () {
                            // Move to the next pane but only if we have selected a file.
                            $.pic.fieldTip.clearTips(dlg);
                            if (sel[0].getSelectedIndex() >= 0) {
                                selectFile.hide();
                                selectOpts.show();
                                $('#btnToRestoreOptions').hide();
                                $('#btnToSelectFile').show();
                                $('#btnRestoreBackup').show();
                                $('#btnUploadBackup').hide();
                            }
                            else
                                $.pic.fieldTip.showTip(sel.find('span.crud-header-text:first'), { message: 'You must select a file to restore.' });
                        },
                        style: { display: 'none' }

                    },
                    {
                        id: 'btnToSelectFile',
                        text: 'Back', icon: '<i class="far fa-hand-point-left"></i>',
                        click: function () {
                            $.pic.fieldTip.clearTips(dlg);
                            // Go back to selecting a file.
                            selectOpts.hide();
                            selectFile.show();
                            $('#btnToRestoreOptions').show();
                            $('#btnToSelectFile').hide();
                            $('#btnRestoreBackup').hide();
                            $('#btnUploadBackup').show();
                        },
                        style: { display: 'none' }
                    },
                    {
                        text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }]
            });
            dlg.attr('data-step', 'selectFile');
            // Step 1: Select File.
            var selectFile = $('<div></div>').appendTo(dlg);
            var line = $('<div></div>').appendTo(selectFile);
            $('<div></div>').appendTo(line).css({ padding: '.5rem' }).addClass('status-text').addClass('picSearchStatus').text('Select a backup file from the list or upload one.  Once you have made your selection press the next button to continue.');
            line = $('<div></div>').appendTo(selectFile);
            $('<hr></hr>').appendTo(line);
            line = $('<div></div>').css({ textAlign: 'center' }).appendTo(selectFile);
            dlg.css({ overflow: 'visible' });
            var files = $('<div></div>').appendTo(selectFile);
            var sel = $('<div></div>').appendTo(files).crudList({
                id: 'lstBackupFiles',
                key: 'filePath',
                canCreate: false,
                canRemove: true,
                actions: { canCreate: false, canRemove: true },
                caption: 'Backup Files', itemName: 'File',
                columns: [
                    {
                        binding: 'options.backupDate', fmtType: 'date', fmtMask: 'MM/dd/yy hh:mmtt', text: 'Date', cellStyle: { width: '97px' },
                        style: { width: '117px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                    },
                    {
                        binding: 'options.name', text: 'Name', cellStyle: { width: '227px' },
                        style: { width: '227px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                    }
                ]
            }).css({ width: '376px', fontSize: '.8rem' });
            sel.find('div.slist-body').css({ fontSize: '.8rem', maxHeight: '127px', overflowY: 'auto' });
            sel.on('removeItem', function (evt) {
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteBackup', {
                    message: 'Are you sure you want to delete backup file ' + (evt.item.options.name || ('from ' + evt.item.options.backupDate)) + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Backup File',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            $.deleteApiService('app/backup/file', evt.item, 'Deleting Backup File...', function (c, status, xhr) {
                                sel[0].removeItemByIndex(evt.itemIndex);
                            });
                        }
                    },
                    {
                        text: 'No', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }]
                });
            });
            sel.on('selchanged', function (evt) {
                console.log(evt);
                dlg[0].selectRestoreFile(evt.newItem);
            });
            dlg[0].loadRestoreFiles = function (selFile) {
                dlg.find('#btnToRestoreOptions').hide();
                dlg.find('#btnUploadBackup').hide();
                $.getApiService('/app/config/options/restore', null, 'Loading Restore Options...', function (opts, status, xhr) {
                    sel[0].clear();
                    for (var i = 0; i < opts.backupFiles.length; i++) {
                        sel[0].addRow(opts.backupFiles[i]);
                        if (typeof selFile === 'string' && opts.backupFiles[i].filePath === selFile) sel[0].selectItemByIndex(i);
                    }
                    dlg.find('#btnToRestoreOptions').show();
                    dlg.find('#btnUploadBackup').show();

                });
            };
            dlg[0].loadRestoreFiles();
            // Step 2: Select Restore options
            var selectOpts = $('<div></div>').appendTo(dlg).hide();
            line = $('<div></div>').appendTo(selectOpts);
            $('<div></div>').appendTo(line).css({ padding: '.5rem' }).addClass('status-text').addClass('picSearchStatus').text('Select from the available options contained in the backup file.  When satisfied press the restore button to begin restoring the file.  If you would like to select another file, press the back button.');
            line = $('<div></div>').appendTo(selectOpts);
            $('<hr></hr>').appendTo(line);
            var fileAttrs = $('<div></div>').addClass('pnl-restorebackup-fileattrs').appendTo(selectOpts);
            line = $('<div></div>').appendTo(fileAttrs);
            $('<label></label>').appendTo(line).text('File');
            $('<span></span>').appendTo(line).attr('data-bind', 'filename');
            $('<label></label>').appendTo(line).css({ marginLeft: '2rem' }).text('Version');
            $('<span></span>').appendTo(line).attr('data-bind', 'options.version').attr('data-fmttype', 'number').attr('data-fmtmask', '#,##0.0');
            $('<input></input>').appendTo(line).attr('type', 'hidden').attr('data-bind', 'filePath');
            line = $('<div></div>').appendTo(fileAttrs);
            $('<label></label>').appendTo(line).text('Name');
            $('<span></span>').appendTo(line).attr('data-bind', 'options.name');
            line = $('<div></div>').appendTo(fileAttrs);
            $('<label></label>').appendTo(line).text('Date');
            $('<span></span>').appendTo(line).attr('data-bind', 'options.backupDate').attr('data-fmttype', 'date').attr('data-fmtmask', 'MM/dd/yyyy hh:mm:sstt');
            line = $('<div></div>').appendTo(selectOpts);
            $('<hr></hr>').appendTo(line);
            line = $('<div></div>').appendTo(selectOpts);
            $('<div></div>').appendTo(line).addClass('status-text').addClass('picSearchStatus').text('Select the servers you would like to restore.');
            var restoreOpts = $('<div></div>').appendTo(selectOpts);
            dlg[0].selectRestoreFile = function (fileOpts) {
                restoreOpts.empty();
                line = $('<div></div>').appendTo(restoreOpts);
                // Create the available options from the file.
                let cb = $('<div></div>').appendTo(line).checkbox({ labelText: 'njsPC', binding: 'options.njsPC' });
                if (!fileOpts.options.njsPC) cb.disabled(true);

                dataBinder.bind(selectOpts, fileOpts);
                if (typeof fileOpts.options.servers !== 'undefined') {
                    for (let i = 0; i < fileOpts.options.servers.length; i++) {
                        let srv = fileOpts.options.servers[i];
                        line = $('<div></div>').appendTo(restoreOpts);
                        $('<input></input>').appendTo(line).attr('type', 'hidden').attr('data-bind', `options.servers[${i}].uuid`).val(srv.uuid);
                        $('<input></input>').appendTo(line).attr('type', 'hidden').attr('data-bind', `options.servers[${i}].name`).val(srv.name);
                        $('<input></input>').appendTo(line).attr('type', 'hidden').attr('data-bind', `options.servers[${i}].host`).val(srv.host);
                        cb = $('<div></div>').appendTo(line).checkbox({ labelText: srv.name, binding: `options.servers[${i}].restore` });
                        if (!srv.backup) line.hide();
                        else if (!srv.success) cb[0].disabled(true);
                        cb[0].val(srv.backup && srv.success);
                        if (typeof srv.errors !== 'undefined' && srv.errors.length > 0) {
                            for (let j = 0; j < srv.errors.length; j++) {
                                line = $('<div></div>').css({ paddingLeft: '2rem', fontSize: '.7em' }).appendTo(restoreOpts);
                                $('<span></span>').appendTo(line).text(srv.errors[j]);
                            }
                        }
                    }
                }
            };
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
                for (let i = 0; i < data.includeActions.length; i++) {
                    tabInclude.find('div.picOptionButton[data-actionid=' + data.includeActions[i] + ']')[0].val(true);
                }
                for (let i = 0; i < data.excludeActions.length; i++) {
                    tabExclude.find('div.picOptionButton[data-actionid=' + data.excludeActions[i] + ']')[0].val(true);
                }

            } catch (err) { console.error(err); }
        }
    });
})(jQuery);


