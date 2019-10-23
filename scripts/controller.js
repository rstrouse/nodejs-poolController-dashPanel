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

            let row = $('<div class="picHeaderRow picControllerTitle" />');
            $('<div class= "picModel"><i class="fas fa-bars" /><span class="picModelData" /></div >').appendTo(row);
            $('<div class="picControllerTime"><span class="picControllerTime"/></div>').appendTo(row);
            $('<div class="picControllerStatus"><span class="picStatusData"/><span class="picPercentData" /><div class="picIndicator" data-status="error" /></div>').appendTo(row);
            row.appendTo(el);

            row = $('<div class="picFreezeProtect" data-status="on"><i class="fas fa-snowflake burst-animated"/><label>FREEZE PROTECTION</label><i class="fas fa-snowflake burst-animated"/></div>');
            row.appendTo(el);
            row = $('<div class="picPanelMode" data-status="auto"><i class="far fa-pause-circle burst-animated"/><label></label><i class="far fa-pause-circle burst-animated"/></div>');
            row.appendTo(el);

            el.find('div.picModel > i').on('click', function (evt) {
                // Open up the settings window.
                var divPopover = $('<div class="picAppSettings"/>');
                var btn = evt.currentTarget;
                divPopover.appendTo(el.parent());
                divPopover.on('initPopover', function (e) {
                    let divSettings = $('<div class="picAppSettings" />');
                    divSettings.appendTo(e.contents());
                    divSettings.settingsPanel();
                    divSettings.on('loaded', function (e) { divPopover[0].show(btn); });
                });
                divPopover.popover({ title: 'Settings', popoverStyle: 'modal', placement: { target: btn } });
                divPopover[0].show(btn);
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });
            self.setControllerState(data);
            self.setEquipmentState(data.equipment);
        },
        formatDate: function (dt) {
            let pad = function (n) { return (n < 10 ? '0' : '') + n; };
            return typeof dt !== 'undefined' ? pad(dt.getMonth() + 1) + '/' + pad(dt.getDate()) + '/' + dt.getFullYear() + '  '
                + pad(dt.getHours() > 12 ? dt.getHours() - 12 : dt.getHours()) + ':' + pad(dt.getMinutes()) + (dt.getHours() >= 12 ? 'pm' : 'am') : '--/--/---- --:--';
        },
        setConnectionError: function (data) {
            var self = this, o = self.options, el = self.element;
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
            let dt = new Date(data.time);
            el.find('span.picControllerTime').each(function () {
                $(this).text(self.formatDate(dt));
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
})(jQuery);
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
            var divOuter = $('<div class="picLogging" />');
            divOuter.appendTo(contents);

            var grp = $('<fieldset></fieldset>');

            //<legend><input id="cbEnableAppLog" type="checkbox" name="cbEnableAppLog" data-datatype="boolean" data-bind="app.enabled" /><label for="cbEnableAppLog">Application</label></legend>
            grp.appendTo(divOuter);
            var leg = $('<legend />').appendTo(grp);
            var btn = $('<div />');
            btn.appendTo(leg);
            btn.optionButton({ text: 'Application', bind: 'app.enabled' });

            var divLine = $('<div class="picAppLogging"><label>Level</label></div>');
            divLine.appendTo(grp);
            var selApp = $('<select data-bind="app.level" />');
            selApp.appendTo(divLine);
            $('<option value="info">Info</option>').appendTo(selApp);
            $('<option value="debug">Debug</option>').appendTo(selApp);
            $('<option value="warn">Warn</option>').appendTo(selApp);
            $('<option value="verbose">Verbose</option>').appendTo(selApp);
            $('<option value="error">Error</option>').appendTo(selApp);
            $('<option value="silly">Silly</option>').appendTo(selApp);
            $('').appendTo(divLine);

            grp = $('<fieldset></fieldset>');
            leg = $('<legend />').appendTo(grp);

            //<legend><input id="cbEnablePacketLog" type="checkbox" name="cbEnablePacketLog" data-datatype="boolean" data-bind="packet.enabled" /><label for="cbEnablePacketLog">Packets</label></legend>
            grp.appendTo(divOuter);
            btn = $('<div />');
            btn.appendTo(leg);
            btn.optionButton({ text: 'Packets', bind: 'packet.enabled' });




            divLine = $('<div class="picPacketLogging"><label>Log to</label></div>');
            divLine.appendTo(grp);


            btn = $('<div />');
            btn.appendTo(divLine);
            btn.optionButton({ text: 'Console', bind: 'packet.logToConsole' });

            btn = $('<div />');
            btn.appendTo(divLine);
            btn.optionButton({ text: 'File', bind: 'packet.logToFile' });

            //$('<input id="cbLogToConsole" type="checkbox" data-datatype="boolean" data-bind="packet.logToConsole" /><label for="cbLogToConsole">Console</label>').appendTo(divLine);
            //$('<input id="cbLogToFile" type="checkbox" data-datatype="boolean" data-bind="packet.logToFile" /><label for="cbLogToFile">File</label>').appendTo(divLine);

            divLine = $('<div class="picPacketLogging"><label>Include</label></div>');
            divLine.appendTo(grp);


            btn = $('<div />');
            btn.appendTo(divLine);
            btn.optionButton({ text: 'Broadcast', bind: 'packet.broadcast.enabled', dropdownButton: $('<i class="fas fa-filter" />') });

            btn = $('<div />');
            btn.appendTo(divLine);
            btn.optionButton({ text: 'Pump', bind: 'packet.pump.enabled' });

            divLine = $('<div class="picPacketLogging"><label></label></div>');
            divLine.appendTo(grp);
            btn = $('<div />');
            btn.appendTo(divLine);
            btn.optionButton({ text: 'Chlorinator', bind: 'packet.chlorinator.enabled' });

            btn = $('<div />');
            btn.appendTo(divLine);
            btn.optionButton({ text: 'Replay', bind: 'packet.replay' });

            contents.on('click', 'div.picOptionButton', function (evt) {
                var opt = $(evt.currentTarget);
                var obj = dataBinder.fromElement(opt);
                $.putApiService('app/logger/setOptions', obj);
            });
            contents.on('change', 'select', function (evt) {
                var opt = $(evt.currentTarget);
                var obj = dataBinder.fromElement(opt);
                $.putApiService('app/logger/setOptions', obj);
            });
            $.getApiService('app/config/log', undefined, function (data, status, xhr) {
                console.log(data);
                dataBinder.bind(contents, data);
            });

        });

    },
    _buildConnectionsTab: function (settings) {
        var self = this, o = self.options, el = self.element;
        el.find('div.picTabPanel:first').each(function () {
            var tabObj = { id: 'tabConnections', text: 'Connections' };
            var contents = this.addTab(tabObj);
            var divOuter = $('<div class="picConnections" />');
            divOuter.appendTo(contents);
            $('<div class="picOptionLine"><label>Server Address</label><input class="picServerAddress" type="text" value="' + settings.services.ip + '" /><span>:</span><input class="picServerPort" type="text" value="' + settings.services.port + '" /></div>').appendTo(contents);
            var btnPnl = $('<div class="picBtnPanel" />');
            btnPnl.appendTo(contents);
            var btnApply = $('<div />');
            btnApply.appendTo(btnPnl);
            btnApply.actionButton({ text: 'Apply', icon: '<i class="fas fa-save" />' });
            btnApply.on('click', function (e) {
                
                // Send this off to the server.
                ///$.putApiService(obj.id === 0 ? '/config/intellibrite/setColors' : '/config/lightGroup/' + obj.id + '/setColors', obj, function (data, status, xhr) {

            });
        });
    },
    _buildControls: function () {
        var self = this, o = self.options, el = self.element;
        var tabs = $('<div class="picTabPanel" />');
        tabs.appendTo(el);
        tabs.tabBar();
        $.getJSON('/config/web', null, function (data, status, xhr) {
            console.log(data);
            self._buildConnectionsTab(data);
            self._buildLoggingTab();
            tabs[0].selectTabById('tabConnections');
            var evt = $.Event('loaded');
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

