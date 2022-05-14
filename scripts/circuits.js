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
            el.find('div.picLight').each(function () {
                try {
                    this.stopCountdownEndTime();
                }
                catch (err) { console.log({ msg: `Error stopping countdown timer for light circuit #${$(this).attr('data-circuitid')}`, err: err }); }
            });
            el.find('div.picFeature').each(function () {
                try {
                    this.stopCountdownEndTime();
                }
                catch (err) { console.log({ msg: `Error stopping countdown timer for feature #${$(this).attr('data-circuitid')}`, err: err }); }
            });
            el.find('div.picCircuit').each(function () {
                try {
                    this.stopCountdownEndTime();
                }
                catch (err) { console.log({ msg: `Error stopping countdown timer for aux circuit #${$(this).attr('data-circuitid')}`, err: err }); }
            });
            el.empty();
            if (typeof data !== 'undefined') {
                el.show();
                div = $('<div class="picFeatures"></div>');
                div.appendTo(el);
                div.features(data);
                //div = $('div.picLights').lights(data);
                //div.lights(data);
                div = $('.picVirtualCircuits');
                div.virtualCircuits(data);
            }
            else {
                el.hide();
            }
        },
        _isLight: function (name) {
            switch (name) {
                case 'light':
                case 'intellibrite':
                case 'pooltone':
                case 'colorlogic':
                case 'globrite':
                case 'globritewhite':
                case 'magicstream':
                case 'dimmer':
                case 'colorcascade':
                case 'samlight':
                case 'sallight':
                case 'photongen':
                    console.log(name);
                    return true;
            }
            return false;
        },
        setItem: function (type, data) {
            var self = this, o = self.options, el = self.element;
            //if (typeof data.type === 'undefined') return;
            if (type === 'lightGroup' || (typeof data.type !== 'undefined' && self._isLight(data.type.name))) {
                el.parents('div.dashContainer:first').find('div.picLights').each(function () {
                    this.setItem(type, data);
                });
                if (data.showInFeatures === true) {
                    el.find('div.picFeatures').each(function () {
                        this.setItem(type, data);
                    });
                }
            }
            else if (typeof data.type !== 'undefined')
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
            if (typeof o.countdownEndTime !== 'undefined' && o.countdownEndTime) { clearTimeout(o.countdownEndTime); o.countdownEndTime = null; }
            el.empty();
            let div = $('<div class="picCircuitTitle control-panel-title"></div>');
            div.prependTo(el);
            let span = $('<span class="picCircuitTitle"></span>');
            span.appendTo(div);
            span.text('Features');
            let inner = $('<div></div>').addClass('picFeatureGrid').appendTo(el);
            for (let i = 0; i < data.circuits.length; i++) {
                // Create a new feature for each of the circuits.  We will hide them if they
                // are not to be shown in the features menu.
                let div = $('<div class="picFeature picCircuit btn"></div>');
                let circuit = data.circuits[i];
                div.appendTo(inner);
                div.circuit(circuit);
                if (typeof circuit.showInFeatures !== 'undefined') div.attr('data-showinfeatures', circuit.showInFeatures);
            }
            for (let i = 0; i < data.features.length; i++) {
                let div = $('<div class="picFeature picCircuit btn"></div>');
                div.appendTo(inner);
                div.feature(data.features[i]);
            }
            for (let i = 0; i < data.circuitGroups.length; i++) {
                let div = $('<div class="picFeature picCircuitGroup btn"></div>');
                div.appendTo(inner);
                div.circuitGroup(data.circuitGroups[i]);
            }
        },
        setItem: function (type, data) {
            var self = this, o = self.options, el = self.element;
            // See if the item exists.
            var selector = '';
            var div = el.find('div.picFeature[data-eqid=' + data.id + ']');
            if (data.isActive === false) {
                div.remove();
                return;
            }
            if (div.length === 0) {
                // We need to add it.
                var bAdded = false;
                var id = parseInt(data.id, 10);
                el.find('div.picFeatureGrid').children('div.picFeature').each(function () {
                    //console.log({ msg: 'Found Feature', id: this.equipmentId() });
                    if (this.equipmentId() > id) {
                        div = $('<div class="picFeature"></div>').insertBefore($(this));
                        bAdded = true;
                        return false;
                    }
                });
                if (!bAdded) div = $('<div class="picFeature"></div>').appendTo(el.find('div.picFeatureGrid:first'));
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
                // el.parents('div.picCircuits.picControlPanel:first').find('div.picLights > div.picFeature[data-eqid=' + data.id + ']').remove();
                // $('div.picLights > div.picFeature[data-eqid=' + data.id + ']').remove();
            }
            $('div.picLights > div.picFeature[data-eqid=' + data.id + ']:not(:first)').each(function () { try { this.stopCountdownEndTime(); } catch (err) { console.log(err); } });
            $('div.picLights > div.picFeature[data-eqid=' + data.id + ']:not(:first)').remove();
        }
    });
    $.widget('pic.feature', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setState = function (data) { self.setState(data); };
            el[0].equipmentId = function () { return parseInt(el.attr('data-eqid'), 10); };
            el[0].countdownEndTime = function () { self.countdownEndTime(); };
            el[0].stopCountdownEndTime = function () { self.stopCountdownEndTime(); };
            o = {};
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            if (typeof o.countdownEndTime !== 'undefined' && o.countdownEndTime) { clearTimeout(o.countdownEndTime); o.countdownEndTime = null; }
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
            $('<span class="picCircuitEndTime"></span>').appendTo(el);
            if (typeof o.showInFeatures !== 'undefined') el.attr('data-showinfeatures', o.showInFeatures);
            self.setState(o);
            let start = function (evt) {
                $(this).data('lastPressed', new Date().getTime());
            }
            let end = function (evt) {
                var lastPressed = $(this).data('lastPressed');
                if (lastPressed) {
                    var duration = new Date().getTime() - lastPressed;
                    $(this).data('lastPressed', false);
                    let ind = el.find('div.picFeatureToggle').find('div.picIndicator')
                    ind.attr('data-status', 'pending');
                    if (duration > 750) {
                        if (makeBool(el.attr('data-state'))) {
                            $.putApiService('state/manualOperationPriority', { id: parseInt(el.attr('data-featureid'), 10) }, function (circ, status, xhr) {
                                self.setState(circ);
                            }, function () {
                                if (ind.attr('data-status') === 'pending') ind.attr('data-status', makeBool(ind.attr('data-state')) ? 'on' : 'off');
                            });
                            ind.attr('data-status', 'pending');
                        }
                    } else {
                        $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-featureid'), 10), state: !makeBool(el.attr('data-state')) }, function (data, status, xhr) {
                            self.setState(data);
                        });
                        setTimeout(function () { self.resetState(); }, 3000);
                    }
                }
            }
            el
                .on('mousedown', start)
                .on('touchstart', start)
                .on('click', end)
                .on('mouseup', end)
                .on('touchend', end)
                .on('mouseout', end)
                .on('touchcancel', end)
        },
        setState: function (data) {
            var self = this, o = self.options, el = self.element;
            try {
                if (data.isActive === false) {
                    el.remove();
                    return;
                }
                if (data.isOn && data.stopDelay) {
                    el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', 'delayoff');
                }
                else if (!data.isOn && data.startDelay) {
                    el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', 'delayon');
                }
                else {
                    el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
                }
                el.attr('data-state', data.isOn);
                if (typeof data.endTime === 'undefined') {
                    el.attr('data-endtime', null)
                    o.endTime = undefined;
                }
                else {
                    el.attr('data-endtime', data.endTime);
                }
                self.countdownEndTime();
                if (typeof data.name !== 'undefined') el.find('label.picFeatureLabel:first').text(data.name);
                if (typeof data.showInFeatures !== 'undefined') el.attr('data-showinfeatures', data.showInFeatures);
            } catch (err) { console.error(`Error processing circuit setState ${err.message}`); }
        },
        resetState: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', makeBool(el.attr('data-state')) ? 'on' : 'off');
        },
        countdownEndTime: function () {
            var self = this, o = self.options, el = self.element;
            this.stopCountdownEndTime();
            let endTime = new Date(el.attr('data-endtime'));
            if (isNaN(endTime) || !makeBool(el.attr('data-state')) || endTime.getTime() === 0 || endTime === null) {
                $(`div[data-featureid=${o.id}] > span.picCircuitEndTime`).empty();
            }
            else {
                let dt = new Date($('span.picControllerTime').data('dt'));
                if (endTime.getTime() > dt.getTime()) tnowStr = dataBinder.formatEndTime(dt, endTime);
                else return;
                $(`div[data-featureid=${o.id}] > span.picCircuitEndTime`).text(`${tnowStr}`);
                o.countdownEndTime = setTimeout(() => { this.countdownEndTime(); }, 1000 * 30);
            }
        },
        stopCountdownEndTime: function () {
            var self = this, o = self.options, el = self.element;
            if (typeof o.countdownEndTime !== 'undefined' && o.countdownEndTime) { clearTimeout(o.countdownEndTime); o.countdownEndTime = null; }
        }
    });
    $.widget('pic.circuitGroup', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setState = function (data) { self.setState(data); };
            el[0].equipmentId = function () { return parseInt(el.attr('data-eqid'), 10); };
            el[0].countdownEndTime = function () { self.countdownEndTime(); }
            el[0].stopCountdownEndTime = function () { self.stopCountdownEndTime(); }
            o = {};
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            if (typeof o.countdownEndTime !== 'undefined' && o.countdownEndTime) { clearTimeout(o.countdownEndTime); o.countdownEndTime = null; }
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
            $('<span class="picCircuitEndTime"></span>').appendTo(el);
            if (typeof o.showInFeatures !== 'undefined') el.attr('data-showinfeatures', o.showInFeatures);
            self.setState(o);
            let start = function (evt) {
                $(this).data('lastPressed', new Date().getTime());
            }
            let end = function (evt) {
                var lastPressed = $(this).data('lastPressed');
                if (lastPressed) {
                    var duration = new Date().getTime() - lastPressed;
                    $(this).data('lastPressed', false);
                    let ind = el.find('div.picFeatureToggle').find('div.picIndicator')
                    ind.attr('data-status', 'pending');
                    if (duration > 750) {
                        if (makeBool(el.attr('data-state'))) {
                            $.putApiService('state/manualOperationPriority', { id: parseInt(el.attr('data-groupid'), 10) }, function (circ, status, xhr) {
                                self.setState(circ);
                            }, function () {
                                if (ind.attr('data-status') === 'pending') ind.attr('data-status', makeBool(ind.attr('data-state')) ? 'on' : 'off');
                            });
                            ind.attr('data-status', 'pending');
                        }
                    } else {
                        $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-groupid'), 10), state: !makeBool(el.attr('data-state')) }, function (data, status, xhr) {
                            self.setState(data);
                        });
                        setTimeout(function () { self.resetState(); }, 3000);
                    }
                }
            }
            el
            .on('mousedown', start)
            .on('touchstart', start)
            .on('click', end)
            .on('mouseup', end)
            .on('touchend', end)
            .on('mouseout', end)
            .on('touchcancel', end)
            
            // .on('click', function () {
            //     el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', 'pending');
            //     $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-groupid'), 10), state: !makeBool(el.attr('data-state')) }, function (data, status, xhr) {
            //         self.setState(data);
            //     });
            //     setTimeout(function () { self.resetState(); }, 3000);
            // });
        },

        setState: function (data) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
            el.attr('data-state', data.isOn);
            if (typeof data.endTime === 'undefined') {
                el.attr('data-endtime', null);
                o.endTime = undefined;
            }
            else {
                el.attr('data-endtime', data.endTime);
            }
            self.countdownEndTime();
            if (typeof data.name !== 'undefined') el.find('label.picFeatureLabel:first').text(data.name);
            if (typeof data.showInFeatures !== 'undefined') el.attr('data-showinfeatures', data.showInFeatures);
        },
        resetState: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', makeBool(el.attr('data-state')) ? 'on' : 'off');
        },
        countdownEndTime: function () {
            var self = this, o = self.options, el = self.element;
            this.stopCountdownEndTime();
            let endTime = new Date(el.attr('data-endtime'));
            if (!makeBool(el.attr('data-state')) || endTime.getTime() === 0 || endTime === null) {
                $(`div[data-groupid=${o.id}] > span.picCircuitEndTime`).empty();
            }
            else {
                let dt = new Date($('span.picControllerTime').data('dt'));
                if (endTime.getTime() > dt.getTime()) tnowStr = dataBinder.formatEndTime(dt, endTime);
                else return;
                $(`div[data-groupid=${o.id}] > span.picCircuitEndTime`).text(`${tnowStr}`);
                o.countdownEndTime = setTimeout(() => { this.countdownEndTime(); }, 1000 * 30);
            }
        },
        stopCountdownEndTime: function () {
            var self = this, o = self.options, el = self.element;
            if (typeof o.countdownEndTime !== 'undefined' && o.countdownEndTime) { clearTimeout(o.countdownEndTime); o.countdownEndTime = null; }
        }
    });
    $.widget("pic.virtualCircuits", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self.initVirtualCircuits(o);
            el[0].setItem = function (type, data) { self.setItem(type, data); };
            o = {};
        },
        initVirtualCircuits: function (data) {
            var self = this, o = self.options, el = self.element;
            el.empty();
            let div = $('<div class="picCircuitTitle control-panel-title"></div>');
            div.appendTo(el);
            let span = $('<span class="picCircuitTitle"></span>');
            span.appendTo(div);
            span.text('Virtual Circuits');
            let inner = $('<div></div>').addClass('picFeatureGrid').appendTo(el);
            for (let i = 0; i < data.virtualCircuits.length; i++) {
                // Create a new feature for each of the virtualCircuits. 
                let div = $('<div class="picVirtualCircuit btn"></div>');
                let vcircuit = data.virtualCircuits[i];
                div.appendTo(inner);
                div.virtualCircuit(data.virtualCircuits[i])
            }
        },
        setItem: function (type, data) {
            var self = this, o = self.options, el = self.element;
            // See if the item exists.
            var selector = '';
            var div = el.find('div.picVirtualCircuit[data-eqid=' + data.id + ']');
            if (div.length === 0) {
                // We need to add it.
                var bAdded = false;
                var id = parseInt(data.id, 10);
                el.children('div.picVirtualCircuit').each(function () {
                    //console.log({ msg: 'Found Feature', id: this.equipmentId() });
                    if (this.equipmentId() > id) {
                        //console.log({ msg: 'Setting Item', type: type, data: data });
                        div = $('<div class="picVirtualCircuit"></div>').insertBefore($(this));
                        bAdded = true;
                        return false;
                    }
                });
            }
        }
    });
    $.widget('pic.virtualCircuit', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setState = function (data) { self.setState(data); };
            el[0].equipmentId = function () { return parseInt(el.attr('data-eqid'), 10); };
            el[0].countdownEndTime = function () { self.countdownEndTime(); }
            el[0].stopCountdownEndTime = function () { self.stopCountdownEndTime(); }
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
        options: { popoverEnabled: true },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setState = function (data) { self.setState(data); };
            el[0].equipmentId = function () { return parseInt(el.attr('data-eqid'), 10); };
            el[0].enablePopover = function (val) { return self.enablePopover(val); };
            el[0].countdownEndTime = function () { self.countdownEndTime(); }
            el[0].stopCountdownEndTime = function () { self.stopCountdownEndTime(); }
            el[0].disabled = function (val) { return self.disabled(val); };
            o = {};
        },
        _buildPopover: function () {
            var self = this, o = self.options, el = self.element;
            if (self.hasPopover(o)) {
                if (self.hasLightThemes(o)) {
                    el.attr('data-haslighttheme', true);
                    var color = $('<i class="fas fa-palette picDropdownButton"></i>');
                    color.appendTo(el);
                    $('<span class="picLightEndTime"></span>').appendTo(el);
                    var theme = $('<div class="picIBColor" data-color="none"></div>');
                    theme.appendTo(el);
                    color.on('click', function (evt) {
                        var divPopover = $('<div class="picIBThemes"></div>');
                        var btn = evt.currentTarget;
                        divPopover.appendTo(el.parent());
                        divPopover.on('initPopover', function (e) {
                            let divThemes = $('<div class="picLightSettings" data-bind="lightingTheme"></div>');
                            divThemes.appendTo(e.contents());
                            divThemes.attr('data-circuitid', el.attr('data-circuitid'));
                            divThemes.lightPanel({ id: el.attr('data-circuitid') });
                            divThemes.on('loaded', function (e) { divPopover[0].show(btn); });
                        });
                        divPopover.popover({ title: 'Light Settings', popoverStyle: 'modal', placement: { target: btn } });
                        evt.preventDefault();
                        evt.stopImmediatePropagation();
                    });
                }
                if (self.hasDimmer(o)) {
                    var dim = $('<i class="fas fa-sliders-h picDropdownButton"></i>');
                    el.attr('data-hasdimmer', true);
                    dim.appendTo(el);
                    $('<span class="picLightEndTime"></span>').appendTo(el);
                    dim.on('click', function (evt) {
                        evt.stopImmediatePropagation();
                        evt.preventDefault();
                        if (self.disabled()) return;
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
                self.enablePopover(o.popoverEnabled);
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
            $('<span class="picCircuitEndTime"></span>').appendTo(el);
            self._buildPopover();
            let start = function (evt) {
                $(this).data('lastPressed', new Date().getTime());
            };
            let end = function (evt) {
                evt.preventDefault();
                evt.stopImmediatePropagation();
                var lastPressed = $(this).data('lastPressed');
                if (lastPressed) {
                    var duration = new Date().getTime() - lastPressed;
                    $(this).data('lastPressed', false);
                    if (duration > 750) {
                        if (self.disabled()) return;
                        let ind = el.find('div.picFeatureToggle').find('div.picIndicator');
                        if (makeBool(el.attr('data-state')) && ind.attr('data-status') !== 'delayon') {
                            $.putApiService('state/manualOperationPriority', { id: parseInt(el.attr('data-circuitid'), 10) }, function (circ, status, xhr) {
                                self.setState(circ);
                            }, function () {
                                if (ind.attr('data-status') === 'pending') ind.attr('data-status', makeBool(ind.attr('data-state')) ? 'on' : 'off');
                            });
                            ind.attr('data-status', 'pending');
                        }
                    } else {
                        if (self.disabled()) return;
                        let ind = el.find('div.picFeatureToggle').find('div.picIndicator');
                        if (ind.attr('data-status') === 'delayon') {
                            //(url, data, message, successCallback, errorCallback, completeCallback)
                            $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-circuitid'), 10), state: false }, function (circ, status, xhr) {
                                self.setState(circ);
                            }, function () { ind.attr('data-status', 'delayon'); });
                            ind.attr('data-status', 'pending');
                        }
                        else {
                            $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-circuitid'), 10), state: !makeBool(el.attr('data-state')) }, function (circ, status, xhr) {
                                self.setState(circ);
                            }, function () {
                                if (ind.attr('data-status') === 'pending') ind.attr('data-status', makeBool(ind.attr('data-state')) ? 'on' : 'off');
                            });
                            ind.attr('data-status', 'pending');
                        }
                    }
                }
            }
            el
            .on('mousedown', start)
            .on('touchstart', start)
            .on('click', end)
            .on('mouseup', end)
            .on('touchend', end)
            .on('mouseout', end)
            .on('touchcancel', end)
            self.setState(o);
            /*              .on('click', function (evt) {
                                evt.stopPropagation();
                                if (self.disabled()) return;
                                let ind = el.find('div.picFeatureToggle').find('div.picIndicator');
                                if (ind.attr('data-status') === 'delayon') {
                                    //(url, data, message, successCallback, errorCallback, completeCallback)
                                    $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-circuitid'), 10), state: false }, function (circ, status, xhr) {
                                        self.setState(circ);
                                    }, function () { ind.attr('data-status', 'delayon'); });
                                    ind.attr('data-status', 'pending');
                                }
                                else {
                                    $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-circuitid'), 10), state: !makeBool(el.attr('data-state')) }, function (circ, status, xhr) {
                                        self.setState(circ);
                                    }, function () {
                                        if (ind.attr('data-status') === 'pending') ind.attr('data-status', makeBool(ind.attr('data-state')) ? 'on' : 'off');
                                    });
                                    ind.attr('data-status', 'pending');
                                }
                        })
                        self.setState(o); */
        },
        hasPopover: function (circuit) { return this.hasLightThemes(circuit) || this.hasDimmer(circuit); },
        hasLightThemes: function (circuit) {
            var self = this, o = self.options, el = self.element;
            if (makeBool($('div.picDashboard').attr('data-hidethemes'))) return false;
            switch (circuit.type.name) {
                case 'colorlogic':
                case 'intellibrite':
                case 'pooltone':
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
                case 'pooltone':
                case 'colorlogic':
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
            if (data.isActive === false) {
                el.remove();
                return;
            }
            try {
                dataBinder.bind(el.parent().find('div.picPopover[data-circuitid=' + data.id + ']'), data);
                //el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
                self.disabled(data.stopDelay);
                if (data.isOn && data.stopDelay) {
                    el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', 'delayoff');
                }
                else if (!data.isOn && data.startDelay) {
                    el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', 'delayon');
                }
                else {
                    el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', data.isOn ? 'on' : 'off');
                }

                el.find('div.picIBColor').attr('data-color', typeof data.lightingTheme !== 'undefined' ? data.lightingTheme.name : 'none');
                el.attr('data-state', data.isOn);
                if (typeof data.endTime === 'undefined' || !data.isOn) {
                    el.attr('data-endtime', null);
                    o.endTime = undefined;
                }
                else {
                    el.attr('data-endtime', data.endTime);
                }
                self.countdownEndTime();
                el.parent().find('div.picLightThemes[data-circuitid=' + data.id + ']').each(function () {
                    let pnl = $(this);
                    pnl.find('div.picIBColorSelector:not([data-color=' + data.lightingTheme.name + ']) div.picIndicator').attr('data-status', 'off');
                    pnl.find('div.picIBColorSelector[data-color=' + data.lightingTheme.name + '] div.picIndicator').attr('data-status', 'on');
                });
                if (typeof data.name !== 'undefined') el.find('label.picFeatureLabel').text(data.name);
                if (typeof data.showInFeatures !== 'undefined') el.attr('data-showinfeatures', data.showInFeatures);
                if (self.isLight(data)) {
                    el.addClass('picLight');
                    // Alright we are a light.  Make sure we have an entry in the lights panel.
                    if ($('div.picLights > div.picFeatureGrid > div.picCircuit[data-circuitid=' + data.id + ']').length === 0) {
                        let divLight = $('<div class="picLight picFeature picCircuit"></div>').appendTo('div.picLights > div.picFeatureGrid');
                        divLight.circuit(data);
                    }
                }
                else {
                    if ($('div.picLights > div.picCircuit[data-circuitid=' + data.id + ']').length > 0) {
                        //console.log('remove id: ' + data.id);
                        $('div.picLights > div.picCircuit[data-circuitid=' + data.id + ']').each(function () { try { this.stopCountdownEndTime(); } catch (err) { console.log(err); }});
                        $('div.picLights > div.picCircuit[data-circuitid=' + data.id + ']').remove();
                    }
                }
                el.parent().find('div.picLightSettings[data-circuitid=' + data.id + ']').each(function () {
                    this.setState(data);
                });
            } catch (err) { console.error(err); }
        },
        disabled: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined')
                return el.hasClass('disabled');
            else {
                if (val) el.addClass('disabled');
                else el.removeClass('disabled');
            }
        },
        resetState: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', makeBool(el.attr('data-state')) ? 'on' : 'off');
        },
        enablePopover: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return o.popoverEnabled;
            else {
                if (makeBool(val)) el.find('i.picDropdownButton').show();
                else el.find('i.picDropdownButton').hide();
                o.popoverEnabled = makeBool(val);
            }
        },
        countdownEndTime: function () {
            var self = this, o = self.options, el = self.element;
            this.stopCountdownEndTime();
            let et = el.attr('data-endtime');
            let endTime = typeof et !== 'undefined' ? new Date(et) : null;
            if (!makeBool(el.attr('data-state')) || endTime === null) {
                if (self.hasLightThemes(o) || self.hasDimmer(o)) {
                    $(`div[data-circuitid=${o.id}] > span.picLightEndTime`).empty();
                }
                else {
                    $(`div[data-circuitid=${o.id}] > span.picCircuitEndTime`).empty();
                }
                // set body here in addition to circuits
                $(`div[data-circuitid=${o.id}].outerBodyEndTime`).css('display', 'none');
                $(`div[data-circuitid=${o.id}] > span.bodyCircuitEndTime`).empty();
            }
            else {
                let dt = new Date($('span.picControllerTime').data('dt'));
                if (endTime.getTime() > dt.getTime()) tnowStr = dataBinder.formatEndTime(dt, endTime);
                else return;
                if (self.hasLightThemes(o) || self.hasDimmer(o)) {
                    $(`div[data-circuitid=${o.id}] > span.picLightEndTime`).text(`${tnowStr}`);
                }
                else {
                    $(`div[data-circuitid=${o.id}] > span.picCircuitEndTime`).text(`${tnowStr}`);
                }
                let body;
                if (o.type.name === 'spa' || o.type.name === 'pool') {
                    // bodies may be rendered/updated after circuits so these need to be updated more frequently
                    body = $(`div[data-circuitid=${o.id}].outerBodyEndTime`);
                    if (body.length) {
                        body.css('display', 'inline-block');
                        $(`div[data-circuitid=${o.id}] > span.bodyCircuitEndTime`).text(`${tnowStr}`);
                    }
                }
                o.countdownEndTime = setTimeout(() => { this.countdownEndTime(); }, 1000 * (typeof body !== 'undefined' && body.length === 0 ? .5 : 5));
            }
        },
        stopCountdownEndTime: function () {
            var self = this, o = self.options, el = self.element;
            if (typeof o.countdownEndTime !== 'undefined' && o.countdownEndTime) { clearTimeout(o.countdownEndTime); o.countdownEndTime = null; }
        }
    });
    $.widget('pic.lights', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            console.log({ msg: `Calling lights method`, o: o });
            self._buildControls(o);
            el[0].setItem = function (type, data) { self.setItem(type, data); };
            el[0].initLights = function (data) { self._initLights(data); };
            //o = {};
        },
        _initLights: function (data) {
            var self = this, o = self.options, el = self.element;
            var inner = el.find('div.picFeatureGrid:first');
            el.find('div.picLight').each(function () {
                try {
                    this.stopCountdownEndTime();
                }
                catch (err) { console.log({ msg: `Error stopping countdown timer for light circuit #${$(this).attr('data-circuitid')}`, err: err }); }
            });
            el.find('div.picLight').remove();
            //el.empty();
            if (typeof data !== 'undefined') {
                for (let i = 0; i < data.circuits.length; i++) {
                    try {
                        // Create a new feature for light types only.
                        switch (data.circuits[i].type.name) {
                            case 'light':
                            case 'intellibrite':
                            case 'pooltone':
                            case 'colorlogic':
                            case 'globrite':
                            case 'globritewhite':
                            case 'magicstream':
                            case 'dimmer':
                            case 'colorcascade':
                            case 'samlight':
                            case 'sallight':
                            case 'photongen':
                                let div = $('<div class="picLight picFeature picCircuit btn"></div>');
                                //console.log({ msg: 'Building light', light: data.circuits[i] });
                                div.appendTo(inner);
                                if (typeof data.circuits[i].showInFeatures !== 'undefined') div.attr('data-showinfeatures', data.circuits[i].showInFeatures);
                                div.circuit(data.circuits[i]);
                                self.setItem(data.circuits[i].type.name, data.circuits[i]);
                                break;
                        }
                    } catch (err) { console.error(err); }
                }
                for (let i = 0; i < data.lightGroups.length; i++) {
                    let div = $('<div class="picLight picFeature picLightGroup btn"></div>');
                    div.appendTo(inner);
                    div.lightGroup(data.lightGroups[i]);

                }
            }
        },
        _buildControls: function (data) {
            var self = this, o = self.options, el = self.element;
            let div = $('<div class="picCircuitTitle control-panel-title"><div>');
            div.prependTo(el);
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
                    divThemes.lightGroupPanel({ id: '0' });
                    divThemes.on('loaded', function (e) {
                        divPopover[0].show(btn);
                        console.log('Loaded called');
                    });
                });
                divPopover.popover({ title: 'IntelliBrite Settings', popoverStyle: 'modal', placement: { target: btn } });
                evt.preventDefault();
                evt.stopImmediatePropagation();
            });
            $('<div></div>').addClass('picFeatureGrid').appendTo(el);
        },
        isLight: function (circuit) {
            try {
                // Create a new feature for light types only.
                switch (circuit.type.name) {
                    case 'light':
                    case 'intellibrite':
                    case 'pooltone':
                    case 'colorlogic':
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
            var inner = el.find('div.picFeatureGrid:first');
            var div = el.find('div.picFeature[data-eqid=' + data.id + ']');
            if (data.isActive === false) {
                div.remove();
                return;
            }
            //console.log({ msg: `Setting light`, data: data, found: div.length });
            if (div.length === 0) {
                // We need to add it.
                var bAdded = false;
                var id = parseInt(data.id, 10);
                inner.children('div.picLight').each(function () {
                    if (this.equipmentId() > id) {
                        div = $('<div class="picLight picFeature btn"></div>').insertBefore($(this));
                        bAdded = true;
                        return false;
                    }
                });
                if (!bAdded) div = $('<div class="picLight picFeature btn"></div>').appendTo(inner);
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
                        console.log('Setting Light Group');
                        div.addClass('picLightGroup');
                        div.lightGroup(data);
                        break;
                }

                // Remove it from the lights section if it existed there before.
                // el.parents('div.picCircuits.picControlPanel:first').find('div.picFeatures > div.picFeature[data-eqid=' + data.id + ']').remove();
                // $('div.picLights > div.picFeature[data-eqid=' + data.id + ']').remove();
            }
            else {
                div.each(function () {
                    $(this).find('label.picFeatureLabel').text(data.name);
                });
            }
            $('div.picLights > div.picCircuit[data-eqid=' + data.id + ']:not(:first)').each(function () { try { this.stopCountdownEndTime(); } catch (err) { console.log(err); }});
            $('div.picLights > div.picFeature[data-eqid=' + data.id + ']:not(:first)').remove();
        }

    });
    $.widget('pic.light', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].setState = function (data) { self.setState(data); };
            el[0].equipmentId = function () { return parseInt(el.attr('data-eqid'), 10); };
            el[0].countdownEndTime = function () { self.countdownEndTime(); };
            el[0].stopCountdownEndTime = function () { self.stopCountdownEndTime(); };
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
            $('<span class="picLightEndTime"></span>').appendTo(el);
            var color = $('<i class="fas fa-palette picDropdownButton"></i>');
            color.appendTo(el);

            var theme = $('<div class="picIBColor" data-color="none"></div>');
            theme.appendTo(el);
            if (typeof o.showInFeatures !== 'undefined') el.attr('data-showinfeatures', o.showInFeatures);
            self.setState(o);
            let start = function (evt) {
                $(this).data('lastPressed', new Date().getTime());
            };
            let end = function (evt) {
                var lastPressed = $(this).data('lastPressed');
                if (lastPressed) {
                    var duration = new Date().getTime() - lastPressed;
                    $(this).data('lastPressed', false);
                    let ind = el.find('div.picFeatureToggle').find('div.picIndicator')
                    ind.attr('data-status', 'pending');
                    if (duration > 750) {
                        if (makeBool(el.attr('data-state'))) {
                            $.putApiService('state/manualOperationPriority', { id: parseInt(el.attr('data-featureid'), 10) }, function (circ, status, xhr) {
                                self.setState(circ);
                            }, function () {
                                if (ind.attr('data-status') === 'pending') ind.attr('data-status', makeBool(ind.attr('data-state')) ? 'on' : 'off');
                            });
                            ind.attr('data-status', 'pending');
                        }
                    } else {
                        if (ind.attr('data-status') === 'delayon') {
                            ind.attr('data-status', 'pending');
                            //(url, data, message, successCallback, errorCallback, completeCallback)
                            $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-circuitid'), 10), state: false }, function (circ, status, xhr) {
                                self.setCircuitState(circ);
                            }, function () { ind.attr('data-status', 'delayon'); });
                        }
                        else {
                            ind.attr('data-status', 'pending');
                            $.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-circuitid'), 10), state: !makeBool(ind.attr('data-state')) }, function (circ, status, xhr) {
                                consele.log(`RETURNED`);
                                console.log(circ);
                                self.setCircuitState(circ);
                            }, function () {
                                if (ind.attr('data-status') === 'pending') ind.attr('data-status', makeBool(ind.attr('data-state')) ? 'on' : 'off');
                            });
                        }
                    }
                }
            }
            el
            .on('mousedown', start)
            .on('touchstart', start)
            .on('click', end)
            .on('mouseup', end)
            .on('touchend', end)
            .on('mouseout', end)
            .on('touchcancel', end)


            //el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', 'pending');
            //evt.stopPropagation();
            //$.putApiService('state/circuit/setState', { id: parseInt(el.attr('data-circuitid'), 10), state: !makeBool(el.attr('data-state')) }, function (data, status, xhr) {
            //    self.setState(data);
            //});
            //setTimeout(function () { self.resetState(); }, 2000);
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
                    divPopover.popover({ title: 'Light Theme', popoverStyle: 'modal', placement: { target: evt.target } });
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
                case 'colorlogic':
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
                if (typeof data.name !== 'undefined') el.find('label.picFeatureLabel').text(data.name);
                if (typeof data.endTime === 'undefined' || !data.isOn) {
                    el.attr('data-endtime', null);
                    o.endTime = undefined;
                }
                else {
                    el.attr('data-endtime', data.endTime);
                }
                self.countdownEndTime();
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
        },
        countdownEndTime: function () {
            var self = this, o = self.options, el = self.element;
            this.stopCountdownEndTime();
            let endTime = new Date(el.attr('data-endtime'));
            if (!makeBool(el.attr('data-state')) || endTime.getTime() === 0 || endTime === null) {
                if (self.hasLightThemes(o) || self.hasDimmer(o)) {
                    $(`div[data-circuitid=${o.id}] > span.picLightEndTime`).empty();
                }
                else {
                    $(`div[data-circuitid=${o.id}] > span.picCircuitEndTime`).empty();
                }
            }
            else {
                let dt = new Date($('span.picControllerTime').data('dt'));
                if (endTime.getTime() > dt.getTime()) tnowStr = dataBinder.formatEndTime(dt, endTime);
                else return;
                if (self.hasLightThemes(o) || self.hasDimmer(o)) {
                    $(`div[data-circuitid=${o.id}] > span.picLightEndTime`).text(`${tnowStr}`);
                }
                else {
                    $(`div[data-circuitid=${o.id}] > span.picCircuitEndTime`).text(`${tnowStr}`);
                }
                o.countdownEndTime = setTimeout(() => { this.countdownEndTime(); }, 1000 * 30);
            }
        },
        stopCountdownEndTime: function () {
            var self = this, o = self.options, el = self.element;
            if (typeof o.countdownEndTime !== 'undefined' && o.countdownEndTime) { clearTimeout(o.countdownEndTime); o.countdownEndTime = null; }
        }
    });
    $.widget('pic.lightPanel', {
        options: { themesLoaded: false, commandsLoaded: false },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].setState = function (data) { self.setState(data); };
            self._buildControls();
            console.log(o);
            o = { processing: false };
        },
        _buildCommands: function (circ) {
            var self = this, o = self.options, el = self.element;
            $.getApiService(`/config/circuit/${circ.id}/lightCommands`, function (commands, status, xhr) {
                // Add in all our buttons.
                el.find(`div.pnl-light-commands`).each(function () {
                    // This should be the button panel
                    console.log(commands);
                    let pnl = $(this);
                    pnl.empty();
                    let row1 = $('<div></div>').appendTo(pnl);
                    let row2 = $('<div></div>').appendTo(pnl);

                    for (let i = 0; i < commands.length; i++) {
                        let cmd = commands[i];
                        let icon = 'fas fa-ghost';
                        let row = row1;
                        switch (cmd.name) {
                            case 'colorset':
                                icon = 'fas fa-ellipsis-h';
                                break;
                            case 'colorswim':
                                icon = 'fas fa-swimmer';
                                break;
                            case 'colorsync':
                                icon = 'fas fa-sync';
                                break;
                            case 'colorhold':
                                icon = 'fas fa-eye-dropper';
                                row = row2;
                                break;
                            case 'colorrecall':
                                icon = 'fas fa-bookmark';
                                row = row2;
                                break;
                            case 'lightthumper':
                            case 'thumper':
                                icon = 'fas fa-hammer';
                                row = row2;
                                break;
                        }
                        $('<div></div>').appendTo(row).actionButton({ text: cmd.desc, icon: `<i class="${icon}"></i>` })
                            .on('click', function (evt) {
                                $.putApiService(`/state/light/runCommand`, { id: circ.id, command: cmd.name }, function (data, status, xhr) {

                                });
                            });
                    }
                    self.setCommandsLoaded(true);
                });
            });
        },
        _buildThemes: function (circ) {
            var self = this, o = self.options, el = self.element;
            let circuitId = parseInt(el.attr('data-circuitid'), 10) || 0;
            let cmd = '/config/circuit/' + circuitId + '/lightThemes';
            var hideThemes = makeBool($('div.picDashboard').attr('data-hidethemes'));
            $.getApiService(cmd, function (data, status, xhr) {
                console.log(circ);
                let curr = typeof circ.lightingTheme === 'undefined' ? '' : circ.lightingTheme.name;
                let divThemes = el.find('div.picLightThemes');
                for (let i = 0; i < data.length; i++) {
                    let theme = data[i];
                    if (hideThemes && (theme.val > 197 || theme.val < 177 || theme.name === 'save' || theme.name === 'hold' || theme.name === 'recall')) continue;
                    let div = $('<div class="picIBColor picIBColorSelector" data-color="' + theme.name + '"><div class="picToggleButton"></div><label class="picIBThemeLabel"></label></div>');
                    div.appendTo(divThemes);
                    div.attr('data-val', theme.val);
                    div.attr('data-name', theme.name);
                    div.find('label.picIBThemeLabel').text(theme.desc);
                    div.find('div.picToggleButton').toggleButton();
                    div.find('div.picToggleButton > div.picIndicator').attr('data-status', curr === theme.name ? 'on' : 'off');
                    div.on('click', function (evt) {
                        evt.stopPropagation();
                        // Set the lighting theme.
                        //if (circuitId !== 0)
                        $.putApiService('state/circuit/setTheme', { id: circuitId, theme: parseInt(theme.val, 10) });
                        //else
                        //    $.putApiService('state/intellibrite/setTheme', { theme: parseInt(theme.val, 10) });

                    });
                }
                self.setThemesLoaded(true);
            });
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.attr('data-circuitid', o.id);
            let circuitId = parseInt(el.attr('data-circuitid'), 10) || 0;
            $('<div class= "picLightThemes" data-bind="lightingTheme"></div>').attr('data-circuitid', circuitId).appendTo(el);
            $('<div class="picBtnPanel btn-panel pnl-light-commands" style="text-align:center"></div>').appendTo(el);
            $.getApiService(`/state/circuit/${circuitId}`, function (circ, status, xhr) {
                console.log(circ);
                self._buildThemes(circ);
                self._buildCommands(circ);
                self._setProcessing(circ.action);

            });
        },
        _setOverlay: function (action) {
            var self = this, o = self.options, el = self.element;
            if (action.val === 0)
                el.find('div.picIntelliBriteOverlay').remove();
            else {
                let overlay = el.find('div.picIntelliBriteOverlay:first');
                if (overlay.length === 0) {
                    overlay = $('<div class="picIntelliBriteOverlay"><div></div><div><span></span></div></div>');
                    overlay.appendTo(el);
                }
                overlay.find('span:first').text(action.desc + '... Please Wait!');
            }
        },
        _setProcessing: function (action) {
            var self = this, o = self.options, el = self.element;
            if (typeof action === 'undefined') action = { val: 0, name: 'ready', desc: 'Ready' };
            switch (action.name) {
                case 'colorsync':
                case 'sync':
                    o.processing = true;
                    el.find('i.fa-sync').addClass('fa-spin');
                    break;
                case 'colorset':
                case 'set':
                    o.processing = true;
                    el.find('i.fa-ellipsis-h').addClass('burst-animated');
                    break;
                case 'colorswim':
                case 'swim':
                    o.processing = true;
                    el.find('i.fa-swimmer').addClass('burst-animated');
                    break;
                case 'lightthumper':
                case 'thumper':
                    o.processing = true;
                    el.find('i.fa-hammer').addClass('burst-animated');
                    break;
                case 'colorhold':
                case 'hold':
                    o.processing = true;
                    el.find('i.fa-eye-dropper').addClass('burst-animated');
                    break;
                case 'colorrecall':
                case 'recall':
                    o.processing = true;
                    el.find('i.fa-bookmark').addClass('burst-animated');
                    break;
                default:
                    o.processing = false;
                    el.find('i.fa-sync').removeClass('fa-spin');
                    el.find('i.fa-ellipsis-h').removeClass('burst-animated');
                    el.find('i.fa-swimmer').removeClass('burst-animated');
                    el.find('i.fa-eye-dropper').removeClass('burst-animated');
                    el.find('i.fa-bookmark').removeClass('burst-animated');
                    el.find('i.fa-hammer').removeClass('burst-animated');
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
            console.log(data.action);
            self._setProcessing(data.action);
        },
        resetState: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picFeatureToggle').find('div.picIndicator').attr('data-status', makeBool(el.attr('data-state')) ? 'on' : 'off');
        },
        setThemesLoaded: function (val) {
            var self = this, o = self.options, el = self.element;
            o.themesLoaded = val;
            if (o.themesLoaded && o.commandsLoaded) {
                var evt = $.Event('loaded');
                el.trigger(evt);
            }
        },
        setCommandsLoaded: function (val) {
            var self = this, o = self.options, el = self.element;
            o.commandsLoaded = val;
            if (o.themesLoaded && o.commandsLoaded) {
                var evt = $.Event('loaded');
                el.trigger(evt);
            }
        }
    });

})(jQuery);