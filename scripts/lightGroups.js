$.widget('pic.lightGroup', {
    options: { processing:false },
    _create: function () {
        var self = this, o = self.options, el = self.element;
        el[0].setState = function (data) { self.setState(data); };
        el[0].equipmentId = function () { return parseInt(el.attr('data-eqid'), 10); };
        self._buildControls();
        o = {};
    },
    _buildControls: function () {
        var self = this, o = self.options, el = self.element;
        var toggle = $('<div class="picFeatureToggle"/>');
        toggle.appendTo(el);
        toggle.toggleButton();
        el.attr('data-groupid', o.id);
        el.attr('data-equid', o.id);

        var lbl = $('<label class="picFeatureLabel"/>');
        lbl.appendTo(el);
        lbl.text(o.name);
        var color = $('<i class="fas fa-palette picDropdownButton"/>');
        color.appendTo(el);

        var theme = $('<div class="picIBColor" data-color="none"/>');
        theme.appendTo(el);
        if (typeof o.showInFeatures !== 'undefined') el.attr('data-showinfeatures', o.showInFeatures);
        self.setState(o);
        el.on('click', function (evt) {
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', 'pending');
            evt.stopPropagation();
            $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-groupid'), 10), state: !makeBool(el.attr('data-state')) }, function () {
                console.log('Put message');
            });
            setTimeout(function () { self.resetState(); }, 2000);
        });
        el.on('click', 'i.picDropdownButton', function (evt) {
            var divPopover = $('<div class="picIBThemes"/>');
            var btn = evt.currentTarget;
            divPopover.appendTo(el.parent());
            divPopover.on('initPopover', function (e) {
                let divThemes = $('<div class="picLightSettings" data-bind="lightingTheme" />');
                divThemes.appendTo(e.contents());
                divThemes.attr('data-circuitid', el.attr('data-groupid'));
                divThemes.lightGroupPanel({ id: el.attr('data-groupid') });
                divThemes.on('loaded', function (e) { divPopover[0].show(btn); });
            });
            divPopover.popover({ title: 'Light Group Settings', popoverStyle: 'modal', placement: { target: btn } });
            evt.preventDefault();
            evt.stopImmediatePropagation();
        });
    },
    setState: function (data) {
        var self = this, o = self.options, el = self.element;
        el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
        el.find('div.picIBColor').attr('data-color', typeof (data.lightingTheme) !== 'undefined' ? data.lightingTheme.name : 'none');
        el.attr('data-state', data.isOn);
        if (data.action.val !== 0) {
            el.find('i.picDropdownButton').addClass('fa-spin');
        }
        else {
            el.find('i.picDropdownButton').removeClass('fa-spin');
        }
        el.parent().find('div.picLightSettings[data-circuitid=' + data.id + ']').each(function () {
            //let pnl = $(this);
            //pnl.find('div.picIBColorSelector:not([data-color=' + data.lightingTheme.name + ']) div.picIndicator').attr('data-status', 'off');
            //pnl.find('div.picIBColorSelector[data-color=' + data.lightingTheme.name + '] div.picIndicator').attr('data-status', 'on');
            this.setState(data);
        });
    },
    resetState: function () {
        var self = this, o = self.options, el = self.element;
        el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', makeBool(el.attr('data-state')) ? 'on' : 'off');
    }
});
$.widget('pic.lightGroupPanel', {
    options: {},
    _create: function () {
        var self = this, o = self.options, el = self.element;
        el[0].setState = function (data) { self.setState(data); };
        self._buildControls();
        console.log(o);
        o = { processing: false };
    },
    _buildColors: function (group) {
        var self = this, o = self.options, el = self.element;
        var tabObj = { id: 'tabColors', text: 'Colors' };
        var contents = el.find('div.picTabPanel:first')[0].addTab(tabObj);
        $('<div><span class="picInstructions">Drag each light into position, set the color, and delay.  When finished press the apply button to save your changes.</span></div>').appendTo(contents);
        var circuits = $('<div class="picLightCircuits" />');
        circuits.appendTo(contents);
        for (var i = 0; i < group.circuits.length; i++) {
            var circuit = group.circuits[i];
            // Add in a row for each light group.
            var divCircuit = $('<div class="picLightGroupCircuit"><span class="picLabel" style="cursor:ns-resize;" /><div class="picLightGroupCircuitColor picCSColor" /><div class="picValueSpinner picSwimDelay" /></div>');
            divCircuit.appendTo(circuits);
            divCircuit.attr('data-position', i);
            divCircuit.attr('data-circuitid', circuit.circuit.id);
            divCircuit.find('span.picLabel:first').text(circuit.circuit.name);
            divCircuit.find('div.picValueSpinner').valueSpinner({ val: circuit.swimDelay, min: 0, max: 60, step: 1 });
            divCircuit.find('div.picLightGroupCircuitColor').attr('data-color', circuit.color.name);
            divCircuit.find('div.picLightGroupCircuitColor').attr('data-val', circuit.color.val);
            divCircuit.find('div.picCSColor').on('click', function (evtCircuit) {
                $.getApiService('config/intellibrite/colors', function (data, status, xhr) {
                    var divPopover = $('<div class="picCSColors" />');
                    divPopover.appendTo(el.parent());
                    divPopover.on('initPopover', function (evt) {
                        let curr = $(evtCircuit.currentTarget).attr('data-color');
                        let divColors = $('<div class= "picLightColors" data-bind="color" />');
                        divColors.appendTo(evt.contents());
                        divColors.attr('data-circuitid', circuit.id);
                        for (let i = 0; i < data.length; i++) {
                            let color = data[i];
                            let div = $('<div class="picCSColor picCSColorSelector" data-color="' + color.name + '"><div class="picToggleButton"/><label class="picCSColorLabel" /></div>');
                            div.appendTo(divColors);
                            div.attr('data-val', color.val);
                            div.attr('data-name', color.name);
                            div.find('label.picCSColorLabel').text(color.desc);
                            div.find('div.picToggleButton').toggleButton();
                            div.find('div.picToggleButton > div.picIndicator').attr('data-status', curr === color.name ? 'on' : 'off');
                            div.on('click', function (e) {
                                // Select the option and close
                                $(evtCircuit.currentTarget).attr('data-color', $(e.currentTarget).attr('data-color'));
                                $(evtCircuit.currentTarget).attr('data-val', $(e.currentTarget).attr('data-val'));
                                divPopover[0].close();
                                e.preventDefault();
                                e.stopPropagation();
                            });
                        }
                        evt.preventDefault();
                        evt.stopImmediatePropagation();

                    });
                    divPopover.popover({ title: 'Select a Color', popoverStyle: 'modal', placement: { target: evtCircuit.target } });
                    divPopover[0].show(evtCircuit.target);
                });
                evtCircuit.preventDefault();
                evtCircuit.stopImmediatePropagation();

            });
            //divCircuit.sortable({ connectWith:'div.picLightCircuits' });
        }
        el.find('div.picLightCircuits').sortable({ axis: 'y', containment:'parent' });
        el.find('div.picLightCircuits').disableSelection();
        var btnPnl = $('<div class="picBtnPanel" />');
        btnPnl.appendTo(contents);
        var btnApply = $('<div />');
        btnApply.appendTo(btnPnl);
        btnApply.actionButton({ text: 'Apply', icon: '<i class="fas fa-save" />' });
        btnApply.on('click', function (e) {
            var obj = self.fromWindow();
            // Send this off to the server.
            $.putApiService(obj.id === 0 ? '/config/intellibrite/setColors' : '/config/lightGroup/' + obj.id + '/setColors', obj, function (data, status, xhr) {

            });
        });
    },
    fromWindow: function () {
        var self = this, o = self.options, el = self.element;
        console.log('Apply clicked');
        // First get the selected theme.
        var themes = el.find('div.picLightThemes:first');
        var obj = { id: parseInt(themes.attr('data-circuitid'), 10), circuits:[] };
        themes.find('div.picIBColorSelector').each(function () {
            var stat = $(this).find('div.picToggleButton:first')[0].val();
            if (stat === 'on') {
                obj.lightingTheme = parseInt($(this).attr('data-val'), 10);
                return false;
            }
        });
        // Now get the circuits.
        var circuits = el.find('div.picLightCircuits:first');
        var pos = 0;
        circuits.find('div.picLightGroupCircuit').each(function () {
            var $this = $(this);
            var circuit = {
                circuit: parseInt($this.attr('data-circuitid'), 10), position: pos++,
                color: parseInt($this.find('div.picLightGroupCircuitColor').attr('data-val'), 10),
                swimDelay: $this.find('div.picSwimDelay')[0].val()
            };
            obj.circuits.push(circuit);
        });
        return obj;
    },
    _buildThemes: function (group) {
        var self = this, o = self.options, el = self.element;
        el.find('div.picTabPanel:first').each(function () {
            var tabObj = { id: 'tabThemes', text: 'Light Shows' };
            var contents = this.addTab(tabObj);
            let circuitId = parseInt(el.attr('data-circuitid'), 10) || 0;
            let cmd = circuitId === 0 ? 'config/intellibrite/themes' : '/config/circuit/' + circuitId + '/lightThemes';
            $.getApiService(cmd, function (data, status, xhr) {
                let curr = group.lightingTheme.name;
                let divThemes = $('<div class= "picLightThemes" data-bind="lightingTheme" />');
                divThemes.appendTo(contents);
                divThemes.attr('data-circuitid', el.attr('data-circuitid'));
                for (let i = 0; i < data.length; i++) {
                    let theme = data[i];
                    let div = $('<div class="picIBColor picIBColorSelector" data-color="' + theme.name + '"><div class="picToggleButton"/><label class="picIBThemeLabel"></label></div>');
                    div.appendTo(divThemes);
                    div.attr('data-val', theme.val);
                    div.attr('data-name', theme.name);
                    div.find('label.picIBThemeLabel').text(theme.desc);
                    div.find('div.picToggleButton').toggleButton();
                    div.find('div.picToggleButton > div.picIndicator').attr('data-status', curr === theme.name ? 'on' : 'off');
                    div.on('click', function (evt) {
                        evt.stopPropagation();
                        // Set the lighting theme.
                        if (circuitId !== 0)
                            $.putApiService('state/circuit/setTheme', { id: circuitId, theme: parseInt(theme.val, 10) });
                        else
                            $.putApiService('state/intellibrite/setTheme', { theme: parseInt(theme.val, 10) });

                    });
                }
                var evt = $.Event('loaded');
                el.trigger(evt);
            });
        });
    },
    _buildControls: function () {
        var self = this, o = self.options, el = self.element;
        el.attr('data-circuitid', o.id);
        // Tabs at the top.
        var tabs = $('<div class="picTabPanel" />');
        tabs.appendTo(el);
        tabs.tabBar();
        let circuitId = parseInt(el.attr('data-circuitid'), 10) || 0;
        let cfgCmd = circuitId === 0 ? '/config/intellibrite' : '/config/lightGroup/' + circuitId;
        let stateCmd = circuitId === 0 ? '/state/intellibrite' : '/state/lightGroup/' + circuitId;
        let obj;
        $.getApiService(cfgCmd, function (group, status, xhr) {
            console.log(group);
            self._buildThemes(group);
            self._buildColors(group);
            tabs[0].selectTabById('tabThemes');
            self._setProcessing(group.action);

        });
        var actions = $('<div class="picBtnPanel" style="text-align:center" />');
        
        actions.appendTo(el);
        var btnSync = $('<div />');
        btnSync.appendTo(actions);
        btnSync.actionButton({ text: 'Sync', icon: '<i class="fas fa-sync" />' });
        btnSync.on('click', function (evt) {
            $.putApiService(stateCmd + '/colorSync', obj, function (data, status, xhr) {

            });
        });
        var btnSet = $('<div />');
        btnSet.appendTo(actions);
        btnSet.actionButton({ text: 'Set', icon: '<i class="fas fa-ellipsis-h" />' });
        btnSet.on('click', function (evt) {
            $.putApiService(stateCmd + '/colorSet', obj, function (data, status, xhr) {

            });
        });
        var btnSwim = $('<div />');
        btnSwim.appendTo(actions);
        btnSwim.actionButton({ text: 'Swim', icon: '<i class="fas fa-swimmer" />' });
        btnSwim.on('click', function (evt) {
            $.putApiService(stateCmd + '/colorSwim', obj, function (data, status, xhr) {

            });
            
        });
    },
    _setOverlay: function (action) {
        var self = this, o = self.options, el = self.element;
        if (action.val === 0)
            el.find('div.picIntelliBriteOverlay').remove();
        else {
            let overlay = el.find('div.picIntelliBriteOverlay:first');
            if (overlay.length === 0) {
                overlay = $('<div class="picIntelliBriteOverlay"><div /><div><span></span></div></div>');
                overlay.appendTo(el);
            }
            overlay.find('span:first').text(action.desc + '... Please Wait!');
        }
    },
    _setProcessing: function (action) {
        var self = this, o = self.options, el = self.element;
        if (typeof action === 'undefined') action = { val: 0, name: 'ready', desc: 'Ready' };
        switch (action.name) {
            case 'sync':
                o.processing = true;
                el.find('i.fa-sync').addClass('fa-spin');
                break;
            case 'set':
                o.processing = true;
                el.find('i.fa-ellipsis-h').addClass('burst-animated');
                break;
            case 'swim':
                o.processing = true;
                el.find('i.fa-swimmer').addClass('burst-animated');
                break;
            default:
                o.processing = false;
                el.find('i.fa-sync').removeClass('fa-spin');
                el.find('i.fa-ellipsis-h').removeClass('burst-animated');
                el.find('i.fa-swimmer').removeClass('burst-animated');
                break;
        }
        self._setOverlay(action);
    },
    setState: function (data) {
        var self = this, o = self.options, el = self.element;
        //el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
        //el.find('div.picIBColor').attr('data-color', typeof data.lightingTheme !== 'undefined' ? data.lightingTheme.name : 'none');
        //el.attr('data-state', data.isOn);
        el.find('div.picIBColorSelector:not([data-color=' + data.lightingTheme.name + ']) div.picIndicator').attr('data-status', 'off');
        el.find('div.picIBColorSelector[data-color=' + data.lightingTheme.name + '] div.picIndicator').attr('data-status', 'on');
        self._setProcessing(data.action);
    },
    resetState: function () {
        var self = this, o = self.options, el = self.element;
        el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', makeBool(el.attr('data-state')) ? 'on' : 'off');
    }
});
