(function ($) {
    $.widget("pic.circuits", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initCircuits = function (data) { self._initCircuits(data); };
            el[0].setItem = function (type, data) { self.setItem(type, data); };
        },
        _initCircuits: function (data) {
            var self = this, o = self.options, el = self.element;
            el.empty();
            if (typeof data !== 'undefined') {
                el.show();
                div = $('<div class="picFeatures"></div>');
                div.appendTo(el);
                div.features(data);
                div = $('<div class="picLights"></div>');
                div.appendTo(el);
                div.lights(data);
            }
            else {
                el.hide();
            }
        },
        _isLight: function (name) {
            switch (name) {
                case 'light':
                case 'intellibrite':
                case 'globrite':
                case 'globritewhite':
                case 'magicstream':
                case 'dimmer':
                case 'colorcascade':
                case 'samlight':
                case 'sallight':
                case 'photongen':
                    return true;
            }
            return false;
        },
        setItem: function (type, data) {
            var self = this, o = self.options, el = self.element;
            if (typeof data.type === 'undefined') return;
            if (type === 'lightGroup' || self._isLight(data.type.name)) {
                el.find('div.picLights').each(function () {
                    this.setItem(type, data);
                });
            }
            else
                el.find('div.picFeatures').each(function () {
                    this.setItem(type, data);
                });
        }
    });
    $.widget("pic.features", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self.initFeatures(o);
            el[0].setItem = function (type, data) { self.setItem(type, data); };
            o = {};
        },
        initFeatures: function (data) {
            var self = this, o = self.options, el = self.element;
            el.empty();
            let div = $('<div class="picCircuitTitle control-panel-title"></div>');
            div.appendTo(el);
            let span = $('<span class="picCircuitTitle"></span>');
            span.appendTo(div);
            span.text('Features');
            for (let i = 0; i < data.circuits.length; i++) {
                // Create a new feature for each of the circuits.  We will hide them if they
                // are not to be shown in the features menu.
                let div = $('<div class="picFeature picCircuit btn"></div>');
                let circuit = data.circuits[i];
                div.appendTo(el);
                div.circuit(data.circuits[i]);
                if (typeof circuit.showInFeatures !== 'undefined') div.attr('data-showinfeatures', circuit.showInFeatures);
            }
            for (let i = 0; i < data.features.length; i++) {
                let div = $('<div class="picFeature picCircuit btn"></div>');
                div.appendTo(el);
                div.feature(data.features[i]);
            }
            for (let i = 0; i < data.circuitGroups.length; i++) {
                let div = $('<div class="picFeature picCircuitGroup btn"></div>');
                div.appendTo(el);
                div.circuitGroup(data.circuitGroups[i]);
            }
        },
        setItem: function (type, data) {
            var self = this, o = self.options, el = self.element;
            // See if the item exists.
            var selector = '';
            var div = el.find('div.picFeature[data-eqid=' + data.id + ']');
            if (div.length === 0) {
                // We need to add it.
                var bAdded = false;
                var id = parseInt(data.id, 10);
                el.children('div.picFeature').each(function () {
                    //console.log({ msg: 'Found Feature', id: this.equipmentId() });
                    if (this.equipmentId() > id) {
                        //console.log({ msg: 'Setting Item', type: type, data: data });
                        div = $('<div class="picFeature"></div>').insertBefore($(this));
                        bAdded = true;
                        return false;
                    }
                });
                if (!bAdded) div = $('<div class="picFeature"></div>').appendTo(el);
                switch (type) {
                    case 'circuit':
                        div.addClass('picCircuit');
                        div.circuit(data);
                        break;
                    case 'feature':
                        div.addClass('picCircuit');
                        div.feature(data);
                        break;
                    case 'circuitGroup':
                        div.addClass('picCircuitGroup');
                        div.circuitGroup(data);
                        break;
                }

                // Remove it from the lights section if it existed there before.
                el.parents('div.picCircuits.picControlPanel:first').find('div.picLights > div.picFeature[data-eqid=' + data.id + ']').remove();


            }
        }
    });
    $.widget('pic.feature', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setState = function (data) { self.setState(data); };
            el[0].equipmentId = function () { return parseInt(el.attr('data-eqid'), 10); };
            o = {};
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            if (!el.hasClass('btn')) el.addClass('btn');
            var toggle = $('<div class="picFeatureToggle"></div>');
            el.attr('data-featureid', o.id);
            el.attr('data-eqid', o.id);
            el.attr('data-type', 'feature');
            toggle.appendTo(el);
            toggle.toggleButton();
            var lbl = $('<label class="picFeatureLabel" data-bind="name"></label>');
            lbl.appendTo(el);
            lbl.text(o.name);
            if (typeof o.showInFeatures !== 'undefined') el.attr('data-showinfeatures', o.showInFeatures);
            self.setState(o);
            el.on('click', function () {
                el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', 'pending');
                $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-featureid'), 10), state: !makeBool(el.attr('data-state')) }, function (data, status, xhr) {
                    self.setState(data);
                });
                setTimeout(function () { self.resetState(); }, 3000);
            });
        },

        setState: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
            el.attr('data-state', data.isOn);
            if (typeof data.name !== 'undefined') el.find('label.picFeatureLabel:first').text(data.name);
            if (typeof data.showInFeatures !== 'undefined') el.attr('data-showinfeatures', data.showInFeatures);
        },
        resetState: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', makeBool(el.attr('data-state')) ? 'on' : 'off');
        }
    });
    $.widget('pic.circuitGroup', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setState = function (data) { self.setState(data); };
            el[0].equipmentId = function () { return parseInt(el.attr('data-eqid'), 10); };
            o = {};
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            if (!el.hasClass('btn')) el.addClass('btn');
            var toggle = $('<div class="picFeatureToggle"></div>');
            el.attr('data-groupid', o.id);
            el.attr('data-eqid', o.id);
            el.attr('data-type', 'circuitGroup');
            toggle.appendTo(el);
            toggle.toggleButton();
            var lbl = $('<label class="picFeatureLabel"></label>');
            lbl.appendTo(el);
            lbl.text(o.name);
            if (typeof o.showInFeatures !== 'undefined') el.attr('data-showinfeatures', o.showInFeatures);
            self.setState(o);
            el.on('click', function () {
                el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', 'pending');
                $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-groupid'), 10), state: !makeBool(el.attr('data-state')) }, function (data, status, xhr) {
                    self.setState(data);
                });
                setTimeout(function () { self.resetState(); }, 3000);
            });
        },

        setState: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
            el.attr('data-state', data.isOn);
            if (typeof data.name !== 'undefined') el.find('label.picFeatureLabel:first').text(data.name);
            if (typeof data.showInFeatures !== 'undefined') el.attr('data-showinfeatures', data.showInFeatures);
        },
        resetState: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', makeBool(el.attr('data-state')) ? 'on' : 'off');
        }
    });
    $.widget('pic.virtualCircuit', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setState = function (data) { self.setState(data); };
            el[0].equipmentId = function () { return parseInt(el.attr('data-eqid'), 10); };

            o = {};
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            if (!el.hasClass('picVirtualCircuit')) el.addClass('picVirtualCircuit');
            if (!el.hasClass('btn')) el.addClass('btn');
            if (!el.hasClass('btn-stateonly')) el.addClass('btn-stateonly');

            el.attr('data-circuitid', o.id);
            el.attr('data-eqid', o.id);

            var toggle = $('<div class="picFeatureToggle"></div>');
            toggle.appendTo(el);
            toggle.toggleButton();
            $('<label class="picFeatureLabel" data-bind="name"></label>').appendTo(el);
            self.setState(o);
        },
        setState: function (data) {
            var self = this, o = self.options, el = self.element;
            dataBinder.bind(el.parent().find('div.picPopover[data-circuitid=' + data.id + ']'), data);
            el.find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
            el.attr('data-state', data.isOn);
            el.find('label.picFeatureLabel').text(data.name);
        }
    });
    $.widget('pic.circuit', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setState = function (data) { self.setState(data); };
            el[0].equipmentId = function () { return parseInt(el.attr('data-eqid'), 10); };
            o = {};
        },
        _buildPopover: function () {
            var self = this, o = self.options, el = self.element;
            if (self.hasPopover(o)) {
                if (self.hasLightThemes(o)) {
                    var color = $('<i class="fas fa-palette picDropdownButton"></i>');
                    color.appendTo(el);
                    var theme = $('<div class="picIBColor" data-color="none"></div>');
                    theme.appendTo(el);
                    color.on('click', function (evt) {
                        $.getApiService('config/circuit/' + el.attr('data-circuitid') + '/lightThemes', function (data, status, xhr) {
                            var divPopover = $('<div class="picIBThemes"></div>');
                            divPopover.appendTo(el.parent());
                            divPopover.on('initPopover', function (evt) {
                                let curr = el.find('div.picIBColor').attr('data-color');
                                let divThemes = $('<div class= "picLightThemes" data-bind="lightingTheme"></div>');
                                divThemes.appendTo(evt.contents());
                                divThemes.attr('data-circuitid', el.attr('data-circuitId'));
                                for (let i = 0; i < data.length; i++) {
                                    let theme = data[i];
                                    let div = $('<div class="picIBColor picIBColorSelector" data-color="' + theme.name + '"><div class="picToggleButton"></div><label class="picIBThemeLabel"></label></div>');
                                    div.appendTo(divThemes);
                                    div.attr('data-val', theme.val);
                                    div.attr('data-name', theme.name);
                                    div.find('label.picIBThemeLabel').text(theme.desc);
                                    div.find('div.picToggleButton').toggleButton();
                                    div.find('div.picToggleButton > div.picIndicator').attr('data-status', curr === theme.name ? 'on' : 'off');
                                    div.on('click', function (e) {
                                        e.stopPropagation();
                                        // Set the lighting theme.
                                        $.putApiService('state/circuit/setTheme', { id: parseInt(el.attr('data-circuitid'), 10), theme: parseInt(theme.val, 10) });
                                    });
                                }

                            });
                            divPopover.popover({ title: 'Intellibrite Theme', popoverStyle: 'modal', placement: { target: evt.target } });
                            divPopover[0].show(evt.target);
                        });
                        evt.preventDefault();
                        evt.stopImmediatePropagation();
                    });
                }
                if (self.hasDimmer(o)) {
                    var dim = $('<i class="fas fa-sliders-h picDropdownButton"></i>');
                    dim.appendTo(el);
                    dim.on('click', function (evt) {
                        evt.stopImmediatePropagation();
                        evt.preventDefault();
                        $.getApiService('state/circuit/' + el.attr('data-circuitid'), function (data, status, xhr) {
                            var divPopover = $('<div class="picDimmer"></div>');
                            divPopover.attr('data-circuitid', el.attr('data-circuitid'));
                            divPopover.appendTo(el.parent());
                            divPopover.on('initPopover', function (evt) {
                                let divDim = $('<div class="picValueSpinner picDimmer" data-bind="level"></div>');
                                divDim.appendTo(evt.contents());
                                divDim.valueSpinner({ val: data.level, min: 1, max: 100, step: 10 });
                                divDim.attr('data-circuitid', el.attr('data-circuitId'));
                                $(this).on('change', function (e) {
                                    $.putApiService('state/circuit/setDimmerLevel', { id: parseInt(el.attr('data-circuitid'), 10), level: parseInt(e.value, 10) });
                                });
                            });
                            divPopover.popover({ title: 'Dimmer Level', popoverStyle: 'modal', placement: { target: evt.target } });
                            divPopover[0].show(evt.target);
                        });

                    });
                }
            }
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            if (!el.hasClass('picCircuit')) el.addClass('picCircuit');
            if (!el.hasClass('btn')) el.addClass('btn');

            var toggle = $('<div class="picFeatureToggle"></div>');

            toggle.appendTo(el);
            toggle.toggleButton();
            el.attr('data-circuitid', o.id);
            el.attr('data-eqid', o.id);

            el.attr('data-type', 'circuit');
            $('<label class="picFeatureLabel" data-bind="name"></label>').appendTo(el);
            self._buildPopover();
            el.on('click', function (evt) {
                el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', 'pending');
                evt.stopPropagation();
                $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-circuitid'), 10), state: !makeBool(el.attr('data-state')) }, function (data, status, xhr) {
                    self.setState(data);
                });
                setTimeout(function () { self.resetState(); }, 2000);
            });
            self.setState(o);
        },
        hasPopover: function (circuit) { return this.hasLightThemes(circuit) || this.hasDimmer(circuit); },
        hasLightThemes: function (circuit) {
            var self = this, o = self.options, el = self.element;
            if (makeBool(el.attr('data-hidethemes'))) return false;
            switch (circuit.type.name) {
                case 'intellibrite':
                case 'globrite':
                case 'magicstream':
                case 'colorcascade':
                case 'samlight':
                case 'sallight':
                    return true;
            }
            return false;
        },
        hasDimmer: function (circuit) {
            var self = this, o = self.options, el = self.element;
            if (makeBool(el.attr('data-hidethemes'))) return false;
            switch (circuit.type.name) {
                case 'dimmer':
                    return true;
            }
            return false;
        },
        isLight: function (circuit) {
            if (typeof circuit === 'undefined' || typeof circuit.type === 'undefined') return false;
            // Create a new feature for light types only.
            switch (circuit.type.name) {
                case 'light':
                case 'intellibrite':
                case 'globrite':
                case 'globritewhite':
                case 'magicstream':
                case 'dimmer':
                case 'colorcascade':
                case 'samlight':
                case 'sallight':
                case 'photongen':
                    return true;
            }
            return false;
        },
        setState: function (data) {
            var self = this, o = self.options, el = self.element;
            try {
                dataBinder.bind(el.parent().find('div.picPopover[data-circuitid=' + data.id + ']'), data);
                el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
                el.find('div.picIBColor').attr('data-color', typeof data.lightingTheme !== 'undefined' ? data.lightingTheme.name : 'none');
                el.attr('data-state', data.isOn);
                el.parent().find('div.picLightThemes[data-circuitid=' + data.id + ']').each(function () {
                    let pnl = $(this);
                    pnl.find('div.picIBColorSelector:not([data-color=' + data.lightingTheme.name + ']) div.picIndicator').attr('data-status', 'off');
                    pnl.find('div.picIBColorSelector[data-color=' + data.lightingTheme.name + '] div.picIndicator').attr('data-status', 'on');
                });
                el.find('label.picFeatureLabel').text(data.name);
                if (typeof data.showInFeatures !== 'undefined') el.attr('data-showinfeatures', data.showInFeatures);
                if (self.isLight(data)) {
                    // Alright we are a light.  Make sure we have an entry in the lights panel.
                    if ($('div.picLights > div.picCircuit[data-circuitid=' + data.id + ']').length === 0) {
                        let divLight = $('<div class="picLight picFeature picCircuit"></div>').appendTo('div.picLights');
                        divLight.circuit(data);
                    }
                }
                else {
                    if ($('div.picLights > div.picCircuit[data-circuitid=' + data.id + ']').length > 0) {
                        //console.log('remove id: ' + data.id);
                        $('div.picLights > div.picCircuit[data-circuitid=' + data.id + ']').remove();
                    }
                }
            } catch (err) { console.error(err); }
        },
        resetState: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', makeBool(el.attr('data-state')) ? 'on' : 'off');
        }
    });
    $.widget('pic.lights', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls(o);
            el[0].setItem = function (type, data) { self.setItem(type, data); };
            o = {};
        },
        _buildControls: function (data) {
            var self = this, o = self.options, el = self.element;
            let div = $('<div class="picCircuitTitle control-panel-title"><div>');
            div.appendTo(el);
            let span = $('<span class="picCircuitTitle"></span>');
            span.appendTo(div);
            span.text('Lights');
            let ibIcon = $('<span class="picIntelliBriteIcon"><i class="fas fa-palette picDropdownButton"></i></span>');
            ibIcon.appendTo(div);
            ibIcon.on('click', 'i.picDropdownButton', function (evt) {
                var divPopover = $('<div class="picIBThemes"></div>');
                var btn = evt.currentTarget;
                divPopover.appendTo(el.parent());
                divPopover.on('initPopover', function (e) {
                    console.log('initializing popover');
                    let divThemes = $('<div class= "picLightSettings" data-bind="lightingTheme"></div>');
                    divThemes.appendTo(e.contents());
                    divThemes.attr('data-circuitid', '0');
                    divThemes.lightGroupPanel({ id: '0'});
                    divThemes.on('loaded', function (e) {
                        divPopover[0].show(btn);
                        console.log('Loaded called');
                    });
                });
                divPopover.popover({ title: 'IntelliBrite Settings', popoverStyle: 'modal', placement: { target: btn } });
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });
            for (let i = 0; i < data.circuits.length; i++) {
                try {
                    // Create a new feature for light types only.
                    switch (data.circuits[i].type.name) {
                        case 'light':
                        case 'intellibrite':
                        case 'globrite':
                        case 'globritewhite':
                        case 'magicstream':
                        case 'dimmer':
                        case 'colorcascade':
                        case 'samlight':
                        case 'sallight':
                        case 'photongen':
                            let div = $('<div class="picLight picFeature picCircuit btn"></div>');
                            div.appendTo(el);
                            if (typeof data.circuits[i].showInFeatures !== 'undefined') div.attr('data-showinfeatures', data.circuits[i].showInFeatures);
                            div.circuit(data.circuits[i]);
                            break;
                    }
                } catch (err) { console.error(err); }
            }
            for (let i = 0; i < data.lightGroups.length; i++) {
                let div = $('<div class="picLight picFeature picLightGroup btn"></div>');
                div.appendTo(el);
                div.lightGroup(data.lightGroups[i]);
                
            }
        },
        isLight: function (circuit) {
            try {
                // Create a new feature for light types only.
                switch (circuit.type.name) {
                    case 'light':
                    case 'intellibrite':
                    case 'globrite':
                    case 'globritewhite':
                    case 'magicstream':
                    case 'dimmer':
                    case 'colorcascade':
                    case 'samlight':
                    case 'sallight':
                    case 'photongen':
                        return true;
                }
            } catch (err) { console.error(err); }
            return false;
        },
        setItem: function (type, data) {
            var self = this, o = self.options, el = self.element;
            // See if the item exists.
            var selector = '';
            var div = el.find('div.picFeature[data-eqid=' + data.id + ']');
            if (div.length === 0) {
                // We need to add it.
                var bAdded = false;
                var id = parseInt(data.id, 10);
                el.children('div.picLight').each(function () {
                    if (this.equipmentId() > id) {
                        div = $('<div class="picLight picFeature btn"></div>').insertBefore($(this));
                        bAdded = true;
                        return false;
                    }
                });
                if (!bAdded) div = $('<div class="picFeature"></div>').appendTo(el);
                switch (type) {
                    case 'circuit':
                        div.addClass('picCircuit');
                        div.circuit(data);
                        break;
                    case 'feature':
                        div.addClass('picCircuit');
                        div.feature(data);
                        break;
                    case 'circuitGroup':
                        div.addClass('picCircuitGroup');
                        div.circuitGroup(data);
                        break;
                    case 'lightGroup':
                        div.addClass('picLightGroup');
                        div.lightGroup(data);
                        break;
                }

                // Remove it from the lights section if it existed there before.
                el.parents('div.picCircuits.picControlPanel:first').find('div.picFeatures > div.picFeature[data-eqid=' + data.id + ']').remove();
            }
        }

    });
    $.widget('pic.light', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].setState = function (data) { self.setState(data); };
            el[0].equipmentId = function () { return parseInt(el.attr('data-eqid'), 10); };
            self._buildControls();
            o = {};
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            var toggle = $('<div class="picFeatureToggle"></div>');
            toggle.appendTo(el);
            toggle.toggleButton();
            
            el.attr('data-circuitid', o.id);
            el.attr('data-eqid', o.id);

            var lbl = $('<label class="picFeatureLabel" data-bind="name"></label>');
            lbl.appendTo(el);
            lbl.text(o.name);
            var color = $('<i class="fas fa-palette picDropdownButton"></i>');
            color.appendTo(el);

            var theme = $('<div class="picIBColor" data-color="none"></div>');
            theme.appendTo(el);
            if (typeof o.showInFeatures !== 'undefined') el.attr('data-showinfeatures', o.showInFeatures);
            self.setState(o);
            el.on('click', function (evt) {
                el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', 'pending');
                evt.stopPropagation();
                $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-circuitid'), 10), state: !makeBool(el.attr('data-state')) }, function (data, status, xhr) {
                    self.setState(data);
                });
                setTimeout(function () { self.resetState(); }, 2000);
            });
            el.on('click', 'i.picDropdownButton', function (evt) {
                $.getApiService('config/circuit/' + el.attr('data-circuitid') + '/lightThemes', function (data, status, xhr) {
                    var divPopover = $('<div class="picIBThemes"></div>');
                    divPopover.appendTo(el.parent());
                    divPopover.on('initPopover', function (evt) {
                        let curr = el.find('div.picIBColor').attr('data-color');
                        let divThemes = $('<div class= "picLightThemes" data-bind="lightingTheme"></div>');
                        divThemes.appendTo(evt.contents());
                        divThemes.attr('data-circuitid', el.attr('data-circuitId'));
                        for (let i = 0; i < data.length; i++) {
                            let theme = data[i];
                            let div = $('<div class="picIBColor picIBColorSelector" data-color="' + theme.name + '"><div class="picToggleButton"></div><label class="picIBThemeLabel"></label></div>');
                            div.appendTo(divThemes);
                            div.attr('data-val', theme.val);
                            div.attr('data-name', theme.name);
                            div.find('label.picIBThemeLabel').text(theme.desc);
                            div.find('div.picToggleButton').toggleButton();
                            div.find('div.picToggleButton > div.picIndicator').attr('data-status', curr === theme.name ? 'on' : 'off');
                            div.on('click', function (e) {
                                evt.stopPropagation();
                                // Set the lighting theme.
                                $.putApiService('state/circuit/setTheme', { id: parseInt(el.attr('data-circuitid'), 10), theme: parseInt(theme.val, 10) });
                            });
                        }

                    });
                    divPopover.popover({ title: 'Intellibrite Theme', popoverStyle: 'modal', placement: { target: evt.target } });
                    divPopover[0].show(evt.target);
                });
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });
        },
        isLight: function (circuit) {
            // Create a new feature for light types only.
            switch (circuit.type.name) {
                case 'light':
                case 'intellibrite':
                case 'globrite':
                case 'globritewhite':
                case 'magicstream':
                case 'dimmer':
                case 'colorcascade':
                case 'samlight':
                case 'sallight':
                case 'photongen':
                    return true;
            }
            return false;
        },
        setState: function (data) {
            var self = this, o = self.options, el = self.element;
            try {
                el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
                el.find('div.picIBColor').attr('data-color', typeof data.lightingTheme !== 'undefined' ? data.lightingTheme.name : 'none');
                el.attr('data-state', data.isOn);
                el.parent().find('div.picLightThemes[data-circuitid=' + data.id + ']').each(function () {
                    let pnl = $(this);
                    pnl.find('div.picIBColorSelector:not([data-color=' + data.lightingTheme.name + ']) div.picIndicator').attr('data-status', 'off');
                    pnl.find('div.picIBColorSelector[data-color=' + data.lightingTheme.name + '] div.picIndicator').attr('data-status', 'on');
                });
            } catch (err) { console.error(err); }
            //if (!self.isLight(data)) el.remove(true);
        },
        resetState: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', makeBool(el.attr('data-state')) ? 'on' : 'off');
        }


    });
})(jQuery);
