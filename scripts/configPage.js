(function ($) {
    $.widget('pic.configPage', {
        options: {
            cfg: {},
            circuitReferences: []
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _onTabChanged: function (evt) {
            var self = this, o = self.options, el = self.element;
            console.log(evt.newTab);
            switch (evt.newTab.id) {
                case 'tabGeneral':
                    self._buildGeneralTab(evt.newTab.contents);
                    break;
                case 'tabBodies':
                    self._buildBodiesTab(evt.newTab.contents);
                    break;
                case 'tabCircuits':
                    self._buildCircuitsTab(evt.newTab.contents);
                    break;
                case 'tabAuxCircuits':
                    self._buildAuxCircuitsTab(evt.newTab.contents);
                    break;
                case 'tabFeatures':
                    self._buildFeaturesTab(evt.newTab.contents);
                    break;
                case 'tabValves':
                    self._buildValvesTab(evt.newTab.contents);
                    break;
                case 'tabPumps':
                    self._buildPumpsTab(evt.newTab.contents);
                    break;
                case 'tabCircuitGroups':
                    self._buildCircuitGroupsTab(evt.newTab.contents);
                    break;
                case 'tabLightGroups':
                    self._buildLightGroupsTab(evt.newTab.contents);
                    break;
                case 'tabRemotes':
                    self._buildRemotesTab(evt.newTab.contents);
                    break;
                case 'tabHeaters':
                    self._buildHeatersTab(evt.newTab.contents);
                    break;
                case 'tabSchedules':
                    self._buildSchedulesTab(evt.newTab.contents);
                    break;
            }
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            var tabs = $('<div class="picTabPanel" />');
            tabs.appendTo(el);
            tabs.tabBar();
            tabs.find('div.picTabContents').addClass('picConfigTabContents');
            tabs.on('tabchange', function (evt) { self._onTabChanged(evt); });
            $.getApiService('/config/all', null, function (data, status, xhr) {
                console.log(data);
                o.cfg = data;
                $.getApiService('/config/circuit/references', null, function (refs, status, xhr) {
                    var evt = $.Event('loaded');
                    o.circuitReferences = refs;
                    var tab;
                    tab = self._addConfigTab({ id: 'tabGeneral', text: 'General', cssClass: 'cfgGeneral' });//, oncreate: function (contents) { self._buildGeneralTab(contents); } });
                    tab = self._addConfigTab({ id: 'tabBodies', text: 'Bodies', cssClass: 'cfgBodies' });//, oncreate: function (contents) { self._buildBodiesTab(contents); } });
                    tab = self._addConfigTab({ id: 'tabCircuits', text: 'Circuits', cssClass: 'cfgCircuits' },
                        [{ id: 'tabAuxCircuits', text: 'Aux-Circuits', cssClass: 'cfgAuxCircuits' },
                        { id: 'tabFeatures', text: 'Features', cssClass: 'cfgFeatures' },
                        { id: 'tabCircuitGroups', text: 'Circuit Groups', cssClass: 'cfgCircuitGroups' },
                        { id: 'tabLightGroups', text: 'Light Groups', cssClass: 'cfgLightGroups' }]);
                    tab = self._addConfigTab({ id: 'tabPumps', text: 'Pumps', cssClass: 'cfgPumps' });
                    tab = self._addConfigTab({ id: 'tabValves', text: 'Valves', cssClass: 'cfgValves' });// self._buildValvesTab(data);
                    tab = self._addConfigTab({ id: 'tabChemistry', text: 'Chemistry', cssClass: 'cfgChemistry' });
                    tab = self._addConfigTab({ id: 'tabHeaters', text: 'Heaters', cssClass: 'cfgHeaters' });
                    tab = self._addConfigTab({ id: 'tabRemotes', text: 'Remotes', cssClass: 'cfgRemotes' });
                    tab = self._addConfigTab({ id: 'tabSchedules', text: 'Schedules', cssClass: 'cfgSchedules' });

                    //self._buildChemistryTab(data);
                    //self._buildHeatersTab(data);
                    //self._buildOtherTab(data);
                    tabs[0].selectTabById('tabGeneral');
                    el.trigger(evt);
                });
            });
        },
        _addConfigTab: function (attrs, subTabs) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var contents = this.addTab(attrs);
                var divOuter = $('<div class="picConfigCategory" />');
                if (attrs.cssClass) divOuter.addClass(attrs.cssClass);
                divOuter.appendTo(contents);
                if (typeof attrs.oncreate === 'function') attrs.oncreate(contents);
                if (typeof subTabs !== 'undefined') {
                    var tabs = $('<div class="picTabPanel" />');
                    tabs.appendTo(contents);
                    tabs.tabBar();
                    tabs.find('div.picTabContents').addClass('picConfigTabContents');
                    tabs.on('tabchange', function (evt) { self._onTabChanged(evt); });
                    for (var i = 0; i < subTabs.length; i++) {
                        var t = subTabs[i];
                        var c = tabs[0].addTab(t);
                        var d = $('<div class="picConfigCategory" />');
                        if (t.cssClass) d.addClass(t.cssClass);
                        d.appendTo(c);
                    }
                }
                return divOuter;
            });
        },
        _buildCircuitsTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            // Find the currently selected tab.  We want to reload it.
            var tabs = contents.find('div.picTabBar:first')[0];
            var tabId = tabs.selectedTabId();
            console.log({ msg: 'Building Circuits Tab', tabId: tabId });
            switch (tabId) {
                case 'tabFeatures':
                    self._buildFeaturesTab(tabs.tabContent(tabId));
                    break;
                case 'tabCircuitGroups':
                    self._buildCircuitGroupsTab(tabs.tabContent(tabId));
                    break;
                case 'tabLightGroups':
                    self._buildLightGroupsTab(tabs.tabContent(tabId));
                    break;
                case 'tabAuxCircuits':
                    self._buildAuxCircuitsTab(tabs.tabContent(tabId));
                    break;
                default:
                    tabs.selectTabById('tabAuxCircuits');
                    break;

            }
        },
        _buildSchedulesTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgSchedules" />').appendTo(contents);
            $.getApiService('/config/options/schedules', null, function (opts, status, xhr) {
                console.log(opts);
                var schedules = opts.schedules;
                for (var i = 0; i < schedules.length; i++) {
                    var sched = schedules[i];
                }
            });
        },
        _buildRemotesTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgOther" />').appendTo(contents);
        },
        _buildBodiesTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgBodies" />').appendTo(contents);
            $.getApiService('/config/options/bodies', null, function (opts, status, xhr) {
                console.log(opts);
                var bodies = opts.bodies;
                for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    var acc = {
                        columns: [{ text: body.name, glyph: body.type !== 1 ? 'fas fa-swimming-pool' : 'fas fa-hot-tub', style: { width: '10rem' } },
                        { text: body.capacity.format('#,##0') + ' gallons', style: { width: '10rem', textAlign: 'right' } }]
                    };
                    var a = self._buildAccordian('cfgBody', acc).appendTo(divOuter);
                    var pnl = a.find('div.picAccordian-contents');
                    var line = self._buildLine().appendTo(pnl);
                    var binding = 'bodies[' + i + '].';
                    self._buildOptionField('bodyName', 'Name', binding + 'name', body.name, { maxlength: 16 }).appendTo(line);
                    self._buildOptionSpinner('bodyCapacity', 'Capacity', binding + 'capacity', body.capacity, { min: 0, max: 500000, step: 1000, maxlength: 7 }).appendTo(line);
                    if (body.type === 1)
                        self._buildOptionCheckbox('bodySpaManualHeat', 'Spa Manual Heat', binding + 'spaManualHeat').appendTo(line);
                    var btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
                    var btnSave = $('<div id="btnSaveBody" />').appendTo(btnPnl).actionButton({ text: 'Save Body', icon: '<i class="fas fa-save" />' });
                    btnSave.on('click', function (e) {
                        $(this).addClass('disabled');
                        $(this).find('i').addClass('burst-animated');
                        // Send this off to the server.
                        //$(this).find('span.picButtonText').text('Loading Config...');
                        //$.putApiService('/app/config/reload', function (data, status, xhr) {
                    });

                }
            });
        },
        _buildHeatersTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgHeaters" />').appendTo(contents);
        },
        _buildChemistryTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgChemistry" />').appendTo(contents);
        },
        _buildCircuitGroupsTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgCircuitGroups" />').appendTo(contents);
            $.getApiService('/config/options/circuitGroups', null, function (opts, status, xhr) {
                console.log(opts);
                var groups = opts.circuitGroups;
                for (var i = 0; i < groups.length; i++) {
                    var group = groups[i];
                    var hrs = Math.floor(group.eggTimer / 60);
                    var mins = group.eggTimer - (hrs * 60);
                    var acc = {
                        columns: [{ text: group.name, glyph: 'fas fa-sitemap', style: { width: '9rem' } },
                        { text: hrs + 'h' + ' ' + mins + 'm', style: { width: '5rem' } }]
                    };

                    var a = self._buildAccordian('cfgCircuitGroup', acc).appendTo(divOuter);
                    var pnl = a.find('div.picAccordian-contents');
                    var line = self._buildLine().appendTo(pnl);
                    var binding = '';
                    if (opts.equipmentNames.length > 0) {
                        self._buildOptionDropdown('groupName', {
                            bindColumn: 0,
                            displayColumn: 2,
                            labelText: 'Name', binding: binding + 'nameId', value: group.nameId,
                            columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Circuit Function', style: { whiteSpace: 'nowrap' } }],
                            items: opts.functions, inputStyle: { width: "7rem" }
                        }).appendTo(line);
                    }
                    else
                        self._buildOptionField('groupName', 'Name', binding + 'name', group.name, { maxlength: 16 }, { style_display: 'none' }).appendTo(line);
                    self._buildOptionSpinner('circuitEggHours', 'Egg Timer Hrs', binding + 'eggTimerHours', hrs, { min: 0, max: 24, step: 1, maxlength: 3 }).appendTo(line);
                    self._buildOptionSpinner('circuitEggMins', 'Mins', binding + 'eggTimerMinutes', mins, { min: 0, max: 59, step: 1, maxlength: 3 }).appendTo(line);
                    line = self._buildLine().appendTo(pnl);
                    $('<hr />').appendTo(line);
                    line = self._buildLine().appendTo(pnl);
                    line.css({ textAlign: 'right' });
                    var circuitsList = self._buildCircuitList({ labelText: 'Group Circuits' }).appendTo(line);
                    var list = circuitsList.find('div.picCircuitsList-list:first');
                    for (var k = 0; k < group.circuits.length; k++) {
                        var circ = group.circuits[k];
                        var c = opts.circuits.find(elem => elem.id === circ.circuit);
                        var d = $('<div class="picCircuitOption" />').appendTo(list);
                        self._buildOptionDropdown('groupCircuit', {
                            labelText: '', binding: binding + 'circuit', value: c.id,
                            columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                            items: opts.circuits, inputStyle: { width: "7rem" }
                        }).appendTo(d);
                        $('<i class="fas fa-trash picRemoveOption" />').appendTo(d);
                    }
                    var btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
                    var btnRemove = $('<div id="btnRemoveCircuitGroup_"' + i + ' />').appendTo(btnPnl).actionButton({ text: 'Remove Group', icon: '<i class="fas fa-trash" />' });
                    btnRemove.on('click', function (e) {
                        $(this).addClass('disabled');
                        $(this).find('i').addClass('burst-animated');
                        // Send this off to the server.
                        //$(this).find('span.picButtonText').text('Loading Config...');
                        //$.putApiService('/app/config/reload', function (data, status, xhr) {
                    });


                    var btnSave = $('<div id="btnSaveCircuitGroup_"' + i + ' />').appendTo(btnPnl).actionButton({ text: 'Save Group', icon: '<i class="fas fa-save" />' });
                    btnSave.on('click', function (e) {
                        $(this).addClass('disabled');
                        $(this).find('i').addClass('burst-animated');
                        // Send this off to the server.
                        //$(this).find('span.picButtonText').text('Loading Config...');
                        //$.putApiService('/app/config/reload', function (data, status, xhr) {
                    });
                }
                var btnPPnl = $('<div class="picBtnPanel" />').appendTo(divOuter);
                var btnAdd = $('<div id="btnAddCircuitGroup" />').appendTo(btnPPnl).actionButton({ text: 'Add Group', icon: '<i class="fas fa-plus" />' });
                btnAdd.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('burst-animated');
                    // Send this off to the server.
                    //$(this).find('span.picButtonText').text('Loading Config...');
                    //$.putApiService('/app/config/reload', function (data, status, xhr) {
                });

            });
        },
        _buildLightGroupsTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgLightGroups" />').appendTo(contents);
        },
        _buildPumpsTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgPumps" />').appendTo(contents);
            $.getApiService('/config/options/pumps', null, function (opts, status, xhr) {
                console.log(opts);
                var addrs = [];
                for (var k = 0; k < opts.maxPumps; k++) addrs.push({ val: k + 96, desc: k + 1 });
                for (var i = 0; i < opts.pumps.length; i++) {
                    var pump = opts.pumps[i];
                    var type = opts.pumpTypes.find(elem => elem.val === pump.type);
                    var pnl = self._buildPumpPanel(pump, type, opts).appendTo(divOuter);
                }
                var btnPnl = $('<div class="picBtnPanel" />').appendTo(contents);
                var btnAdd = $('<div id="btnAddPump" />').appendTo(btnPnl).actionButton({ text: 'Add Pump', icon: '<i class="fas fa-plus" />' });
                btnAdd.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('burst-animated');
                    // Send this off to the server.
                    //$(this).find('span.picButtonText').text('Loading Config...');
                    //$.putApiService('/app/config/reload', function (data, status, xhr) {

                });

            });
        },
        _buildAuxCircuitsTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgAuxCircuits" />').appendTo(contents);
            $.getApiService('/config/options/circuits', null, function (opts, status, xhr) {
                console.log(opts);
                var circuits = opts.circuits;
                for (var i = 0; i < circuits.length; i++) {
                    var circuit = circuits[i];
                    var func = opts.functions.find(elem => elem.val === circuit.type);
                    var hrs = Math.floor(circuit.eggTimer / 60);
                    var mins = circuit.eggTimer - (hrs * 60);
                    var acc = {
                        columns: [{ text: circuit.name, glyph: 'fas fa-code-branch', style: { width: '9rem' } },
                        { glyph: circuit.freeze ? 'fas fa-icicles' : '', style: { width: '1.5rem' } },
                        { text: func.desc, style: { width: '8rem' } },
                        { text: circuit.showInFeatures ? 'Feature' : '', style: { width: '8rem' } },
                        { text: hrs + 'h' + ' ' + mins + 'm', style: { width: '5rem' } }]
                    };

                    var a = self._buildAccordian('cfgCircuit', acc).appendTo(divOuter);
                    var pnl = a.find('div.picAccordian-contents');
                    var line = self._buildLine().appendTo(pnl);
                    var binding = '';
                    if (opts.equipmentNames.length > 0) {
                        self._buildOptionDropdown('circuitName', {
                            bindColumn: 0,
                            displayColumn: 2,
                            labelText: 'Name', binding: binding + 'nameId', value: circuit.nameId,
                            columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Circuit Function', style: { whiteSpace: 'nowrap' } }],
                            items: opts.functions, inputStyle: { width: "7rem" }
                        }).appendTo(line);
                    }
                    else
                        self._buildOptionField('circuitName', 'Name', binding + 'name', circuit.name, { maxlength: 16 }, { style_display: 'none' }).appendTo(line);
                    if (circuit.id !== 1 && circuit.id !== 6) {
                        self._buildOptionDropdown('circuitType', {
                            bindColumn: 0,
                            displayColumn: 2,
                            labelText: 'Type', binding: binding + 'type', value: circuit.type,
                            columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Circuit Function', style: { whiteSpace: 'nowrap' } }],
                            items: opts.functions, inputStyle: { width: "7rem" }
                        }).appendTo(line);
                    }
                    self._buildOptionCheckbox('circuitShowAsFeature', 'Show as Feature', binding + 'showInFeatures', circuit.showInFeatures).appendTo(line);
                    line = self._buildLine().appendTo(line);
                    line.css({ 'text-align': 'right', 'padding-bottom': '.25rem' });
                    self._buildOptionCheckbox('circuitFreeze', 'Freeze Protection', binding + 'freeze', circuit.freeze).appendTo(line);
                    self._buildOptionSpinner('circuitEggHours', 'Egg Timer Hrs', binding + 'eggTimerHours', hrs, { min: 0, max: 24, step: 1, maxlength: 3 }).appendTo(line);
                    self._buildOptionSpinner('circuitEggMins', 'Mins', binding + 'eggTimerMinutes', mins, { min: 0, max: 59, step: 1, maxlength: 3 }).appendTo(line);
                    var btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
                    var btnSave = $('<div id="btnSaveCircuit_"' + i + ' />').appendTo(btnPnl).actionButton({ text: 'Save Circuit', icon: '<i class="fas fa-save" />' });
                    btnSave.on('click', function (e) {
                        $(this).addClass('disabled');
                        $(this).find('i').addClass('burst-animated');
                        // Send this off to the server.
                        //$(this).find('span.picButtonText').text('Loading Config...');
                        //$.putApiService('/app/config/reload', function (data, status, xhr) {
                    });
                }
            });
        },
        _buildFeaturesTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgFeatures" />').appendTo(contents);
            $.getApiService('/config/options/features', null, function (opts, status, xhr) {
                console.log(opts);
                var features = opts.features;
                for (var i = 0; i < features.length; i++) {
                    var feature = features[i];
                    var func = opts.functions.find(elem => elem.val === feature.type);
                    var hrs = Math.floor(feature.eggTimer / 60);
                    var mins = feature.eggTimer - (hrs * 60);
                    var acc = {
                        columns: [{ text: feature.name, glyph: 'fas fa-code-branch', style: { width: '9rem' } },
                        { glyph: feature.freeze ? 'fas fa-icicles' : '', style: { width: '1.5rem' } },
                        { text: func.desc, style: { width: '8rem' } },
                        { text: feature.showInFeatures ? 'Feature' : '', style: { width: '8rem' } },
                        { text: hrs + 'h' + ' ' + mins + 'm', style: { width: '5rem' } }]
                    };

                    var a = self._buildAccordian('cfgFeature', acc).appendTo(divOuter);
                    var pnl = a.find('div.picAccordian-contents');
                    var line = self._buildLine().appendTo(pnl);
                    var binding = '';
                    if (opts.equipmentNames.length > 0) {
                        self._buildOptionDropdown('featureName', {
                            bindColumn: 0,
                            displayColumn: 2,
                            labelText: 'Name', binding: binding + 'nameId', value: feature.nameId,
                            columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Feature Name', style: { whiteSpace: 'nowrap' } }],
                            items: opts.functions, inputStyle: { width: "7rem" }
                        }).appendTo(line);
                    }
                    else
                        self._buildOptionField('featureName', 'Name', binding + 'name', feature.name, { maxlength: 16 }, { style_display: 'none' }).appendTo(line);
                    if (feature.id !== 1 && feature.id !== 6) {
                        self._buildOptionDropdown('featureType', {
                            bindColumn: 0,
                            displayColumn: 2,
                            labelText: 'Type', binding: binding + 'type', value: feature.type,
                            columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Feature Function', style: { whiteSpace: 'nowrap' } }],
                            items: opts.functions, inputStyle: { width: "7rem" }
                        }).appendTo(line);
                    }
                    self._buildOptionCheckbox('featureShowAsFeature', 'Show as Feature', binding + 'showInFeatures', feature.showInFeatures).appendTo(line);
                    line = self._buildLine().appendTo(line);
                    line.css({ 'text-align': 'right', 'padding-bottom': '.25rem' });
                    self._buildOptionCheckbox('featureFreeze', 'Freeze Protection', binding + 'freeze', feature.freeze).appendTo(line);
                    self._buildOptionSpinner('featureEggHours', 'Egg Timer Hrs', binding + 'eggTimerHours', hrs, { min: 0, max: 24, step: 1, maxlength: 3 }).appendTo(line);
                    self._buildOptionSpinner('featureEggMins', 'Mins', binding + 'eggTimerMinutes', mins, { min: 0, max: 59, step: 1, maxlength: 3 }).appendTo(line);
                    var btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
                    var btnRemove = $('<div id="btnRemoveFeature_"' + i + ' />').appendTo(btnPnl).actionButton({ text: 'Remove Feature', icon: '<i class="fas fa-trash" />' });
                    btnRemove.on('click', function (e) {
                        $(this).addClass('disabled');
                        $(this).find('i').addClass('burst-animated');
                        // Send this off to the server.
                        //$(this).find('span.picButtonText').text('Loading Config...');
                        //$.putApiService('/app/config/reload', function (data, status, xhr) {
                    });

                    var btnSave = $('<div id="btnSaveFeature_"' + i + ' />').appendTo(btnPnl).actionButton({ text: 'Save Feature', icon: '<i class="fas fa-save" />' });
                    btnSave.on('click', function (e) {
                        $(this).addClass('disabled');
                        $(this).find('i').addClass('burst-animated');
                        // Send this off to the server.
                        //$(this).find('span.picButtonText').text('Loading Config...');
                        //$.putApiService('/app/config/reload', function (data, status, xhr) {
                    });
                }
                var btnPPnl = $('<div class="picBtnPanel" />').appendTo(divOuter);
                var btnAdd = $('<div id="btnAddFeature" />').appendTo(btnPPnl).actionButton({ text: 'Add Feature', icon: '<i class="fas fa-plus" />' });
                btnAdd.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('burst-animated');
                    // Send this off to the server.
                    //$(this).find('span.picButtonText').text('Loading Config...');
                    //$.putApiService('/app/config/reload', function (data, status, xhr) {
                });

            });
        },
        _getCircuitReferences(circuits, features, virtual, groups) {
            var self = this, o = self.options, el = self.element;
            var arr = [];
            for (var i = 0; i < o.circuitReferences.length; i++) {
                var ref = o.circuitReferences[i];
                if (ref.equipmentType === 'circuit' && !circuits) continue;
                if (ref.equipmentType === 'feature' && !features) continue;
                if (ref.equipmentType === 'virtual' && !virtual) continue;
                if ((ref.equipmentType === 'lightGroup' || ref.equipmentType === 'circuitGroup') && !groups) continue;
                arr.push(o.circuitReferences[i]);
            }
            return arr;
        },
        _buildValvesTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgValves" />').appendTo(contents);
            $.getApiService('/config/options/valves', null, function (opts, status, xhr) {
                console.log(opts);
                for (var i = 0; i < opts.valves.length; i++) {
                    var valve = opts.valves[i];
                    self._buildValvePanel(valve, opts).appendTo(divOuter);
                }
            });
        },
        _buildValvePanel: function (valve, opts) {
            var self = this, o = self.options, el = self.element;
            var type = opts.valveTypes.find(elem => elem.val === valve.type);
            var circuit = opts.circuits.find(elem => elem.id === valve.circuit);
            var acc = {
                columns: [{ text: valve.name, glyph: 'fas fa-compass', style: { width: '14rem' } },
                { text: type.desc, style: { width: '8rem' } },
                { text: typeof circuit !== 'undefined' ? circuit.name : '', style: { width: '8rem' } }
                ]
            };

            var a = self._buildAccordian('cfgValve', acc);
            var pnl = a.find('div.picAccordian-contents');
            var line = self._buildLine().appendTo(pnl);
            var bind = '';
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'id').val(valve.id).appendTo(line);
            self._buildOptionField('valveName', 'Name', bind + 'name', valve.name, { maxlength: 16 }).appendTo(line);
            self._buildOptionDropdown('valveType', {
                labelText: 'Type', binding: bind + 'type', value: valve.type,
                displayColumn: 2, bindColumn: 0,
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Valve Type', style: { whiteSpace: 'nowrap' } }],
                items: opts.valveTypes, inputStyle: { width: '5.7rem' }
            }).appendTo(line);
            if (!valve.isIntake && !valve.isReturn) {
                self._buildOptionDropdown('circuit', {
                    labelText: 'Circuit', binding: bind + 'circuit', value: valve.circuit,
                    columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                    items: opts.circuits, inputStyle: { width: '7rem' }
                }).appendTo(line);
                var btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
                var btnSave = $('<div id="btnSaveValve_"' + valve.id + ' />').appendTo(btnPnl).actionButton({ text: 'Save Valve', icon: '<i class="fas fa-save" />' });
                btnSave.on('click', function (e) {
                    //$(this).addClass('disabled');
                    //$(this).find('i').addClass('burst-animated');
                    var p = $(e.target).parents('div.picAccordian-contents:first');
                    var v = dataBinder.fromElement(p);
                    $.putApiService('/config/valve/' + v.id, v, function (data, status, xhr) {
                        console.log({ data: data, status: status, xhr: xhr });
                        var vpnl = self._buildValvePanel(data, opts);
                        p.parents('div.picAccordian:first').replaceWith(vpnl);
                        vpnl[0].expanded(true);
                    });
                });
            }
            else {
                a.find('div.picInputField[data-bind$=name]')[0].disabled(true);
                a.find('div.picPickList[data-bind$=type]')[0].disabled(true);
            }
            return a;
        },
        _buildGeneralTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgGeneral" />').appendTo(contents);
            $.getApiService('/config/options/general', null, function (opts, status, xhr) {
                var cfg = opts;
                var acc = { columns: [{ text: 'Personal Information', glyph: 'far fa-newspaper', style: { width: '20rem' } }] };
                var a = self._buildAccordian('cfgGeneralPersonal', acc).appendTo(divOuter);
                var pnl = a.find('div.picAccordian-contents');


                var line = self._buildLine().appendTo(pnl);
                console.log(opts);
                self._buildOptionField('poolAlias', 'Pool Alias', 'alias', cfg.pool.alias, { maxlength: 16 }).appendTo(line);
                self._buildOptionField('ownerName', 'Owner', 'owner.name', cfg.pool.owner.name, { maxlength: 16 }).appendTo(line);
                line = self._buildLine().appendTo(pnl);
                self._buildOptionField('ownerPhone', 'Phone', 'owner.phone', cfg.pool.owner.phone, { maxlength: 16 }).appendTo(line);
                self._buildOptionField('ownerEmail', 'e-mail', 'owner.email', cfg.pool.owner.email, { maxlength: 32 }).appendTo(line);
                line = self._buildLine().appendTo(pnl);
                self._buildOptionField('ownerPhone2', 'Alt Phone', 'owner.phone2', cfg.pool.owner.phone2, { maxlength: 16 }).appendTo(line);
                self._buildOptionField('ownerEmail2', 'Alt e-mail', 'owner.email2', cfg.pool.owner.email2, { maxlength: 32 }).appendTo(line);
                line = self._buildLine().appendTo(pnl);
                self._buildOptionDropdown('country', {
                    labelText: 'Country', binding: 'location.country', value: cfg.pool.location.country,
                    columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Country', style: { whiteSpace: 'nowrap' } }],
                    items: cfg.countries, inputStyle: { width: '7rem' }, bindColumn: 1
                }).appendTo(line);
                line = self._buildLine().appendTo(pnl);
                self._buildOptionField('locAddress', 'Address', 'location.address', cfg.pool.location.address, { maxlength: 32 }).appendTo(line);
                line = self._buildLine().appendTo(pnl);
                self._buildOptionField('locCity', 'City', 'location.city', cfg.pool.location.city, { maxlength: 16 }).appendTo(line);
                self._buildOptionField('locState', 'State', 'location.state', cfg.pool.location.state, { maxlength: 16 }).appendTo(line);
                self._buildOptionField('locZip', 'Zip', 'location.zip', cfg.pool.location.zip, { maxlength: 10 }).appendTo(line);
                var btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
                var btnSave = $('<div id="btnSavePersonal" />').appendTo(btnPnl).actionButton({ text: 'Save Personal', icon: '<i class="fas fa-save" />' });
                btnSave.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('burst-animated');
                    // Send this off to the server.
                    //$(this).find('span.picButtonText').text('Loading Config...');
                    //$.putApiService('/app/config/reload', function (data, status, xhr) {
                });

                acc = { columns: [{ text: 'Time & Date', glyph: 'far fa-clock', style: { width: '20rem' } }] };
                a = self._buildAccordian('cfgGeneralDate', acc).appendTo(divOuter);
                pnl = a.find('div.picAccordian-contents');
                line = self._buildLine().appendTo(pnl);
                self._buildOptionDropdown('timeZone', {
                    labelText: 'Time Zone',
                    binding: 'pool.location.timeZone',
                    value: cfg.pool.location.timeZone || 0,
                    displayColumn: 2,
                    columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'abbrev', hidden: false, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Time Zone', style: { whiteSpace: 'nowrap' } }],
                    items: cfg.timeZones, inputStyle: { width: '12rem' }
                }).appendTo(line);
                self._buildOptionCheckbox('advAutoDST', 'Auto Adjust DST', 'pool.options.adjustDST', cfg.pool.options.adjustDST).appendTo(line);
                line = self._buildLine().appendTo(pnl);
                self._buildOptionDropdown('clockMode', {
                    labelText: 'Clock Mode',
                    binding: 'pool.options.clockMode',
                    bindColumn: 0,
                    value: cfg.pool.options.clockMode,
                    columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Mode', style: { whiteSpace: 'nowrap' } }],
                    items: cfg.clockModes, inputStyle: { width: '5rem' }
                }).appendTo(line);
                if (cfg.clockSources.length > 1) {
                    self._buildOptionDropdown('clockSource', {
                        labelText: 'Clock Source',
                        binding: 'pool.options.clockSource',
                        value: cfg.pool.options.clockSource,
                        bindColumn: 0,
                        columns: [{ binding: 'name', hidden: true, text: 'Name', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Source', style: { whiteSpace: 'nowrap' } }],
                        items: cfg.clockSources, inputStyle: { width: '5rem' }
                    }).appendTo(line);
                }
                btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
                btnSave = $('<div id="btnSaveTimeDate" />').appendTo(btnPnl).actionButton({ text: 'Save Time & Date', icon: '<i class="fas fa-save" />' });
                btnSave.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('burst-animated');
                    // Send this off to the server.
                    //$(this).find('span.picButtonText').text('Loading Config...');
                    //$.putApiService('/app/config/reload', function (data, status, xhr) {
                });

                acc = { columns: [{ text: 'Delays', glyph: 'fas fa-stopwatch', style: { width: '9rem' } }] };
                a = self._buildAccordian('cfgGeneralDelays', acc).appendTo(divOuter);
                pnl = a.find('div.picAccordian-contents');

                line = self._buildLine().appendTo(pnl);
                self._buildOptionCheckbox('advManualOperationPriority', 'Manual OP Priority', 'options.manualPriority', cfg.pool.options.manualPriority).appendTo(line);
                line = self._buildLine().appendTo(pnl);
                self._buildOptionCheckbox('advPumpDelay', 'Pump Off During Valve Action', 'options.pumpDelay', cfg.pool.options.pumpDelay).appendTo(line);
                self._buildOptionCheckbox('advHeaterCooldownDelay', 'Heater Cooldown Delay', 'options.cooldownDelay', cfg.pool.options.cooldownDelay).appendTo(line);
                btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
                btnSave = $('<div id="btnSaveDelays" />').appendTo(btnPnl).actionButton({ text: 'Save Delays', icon: '<i class="fas fa-save" />' });
                btnSave.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('burst-animated');
                    // Send this off to the server.
                    //$(this).find('span.picButtonText').text('Loading Config...');
                    //$.putApiService('/app/config/reload', function (data, status, xhr) {
                });

                acc = { columns: [{ text: 'Sensor Calibration', glyph: 'fas fa-balance-scale-right', style: { width: '20rem' } }] };
                a = self._buildAccordian('cfgGeneralCalibration', acc).appendTo(divOuter);
                pnl = a.find('div.picAccordian-contents');
                btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
                btnSave = $('<div id="btnSaveCalibration" />').appendTo(btnPnl).actionButton({ text: 'Save Calibration', icon: '<i class="fas fa-save" />' });
                btnSave.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('burst-animated');
                    // Send this off to the server.
                    //$(this).find('span.picButtonText').text('Loading Config...');
                    //$.putApiService('/app/config/reload', function (data, status, xhr) {
                });


                acc = { columns: [{ text: 'Alerts', glyph: 'far fa-bell', style: { width: '20rem' } }] };
                a = self._buildAccordian('cfgGeneralAlerts', acc).appendTo(divOuter);
                pnl = a.find('div.picAccordian-contents');
                btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
                btnSave = $('<div id="btnSaveAlerts" />').appendTo(btnPnl).actionButton({ text: 'Save Alerts', icon: '<i class="fas fa-save" />' });
                btnSave.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('burst-animated');
                    // Send this off to the server.
                    //$(this).find('span.picButtonText').text('Loading Config...');
                    //$.putApiService('/app/config/reload', function (data, status, xhr) {
                });

                acc = { columns: [{ text: 'Security', glyph: 'fas fa-user-secret', style: { width: '20rem' } }] };
                a = self._buildAccordian('cfgGeneralSecurity', acc).appendTo(divOuter);

                pnl = a.find('div.picAccordian-contents');
                btnPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
                btnSave = $('<div id="btnSaveSecurity" />').appendTo(btnPnl).actionButton({ text: 'Save Security', icon: '<i class="fas fa-save" />' });
                btnSave.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('burst-animated');
                    // Send this off to the server.
                    //$(this).find('span.picButtonText').text('Loading Config...');
                    //$.putApiService('/app/config/reload', function (data, status, xhr) {
                });
            });
        },
        _buildLine: function () { return $('<div class="picOptionLine" />'); },
        _buildCircuitList: function (attrs) {
            var div = $('<div class="picCircuitsList" />');
            var pnl = $('<div class="picCircuitsList-btnPanel" />').appendTo(div);
            $('<div><label>' + attrs.labelText + '</label></div>').appendTo(pnl);
            var btnCPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
            var btnAddCircuit = $('<div />').appendTo(btnCPnl).actionButton({ text: 'Add Circuit', icon: '<i class="fas fa-plus" />' });
            var list = $('<div class="picCircuitsList-list" />').appendTo(div);
            return div;
        },
        _buildAccordian: function (cssClass, opts) {
            var div = $('<div class="picAccordian" />').accordian(opts);
            div.addClass(cssClass);
            return div;
        },
        _buildOptionDropdown: function (cssClass, ddAttrs) {
            var div = $('<div class="picOptionDropdown" />');
            if (cssClass) div.addClass(cssClass);
            div.attr('data-bind', ddAttrs.binding);
            var dd = $('<div class="picPickList" />').appendTo(div).pickList(ddAttrs)[0];
            return div;
        },
        _buildOptionField: function (cssClass, lblText, binding, text, fldAttrs, lblAttrs) {
            var div = $('<div class="picOptionField" />');
            if (cssClass) div.addClass(cssClass);
            div.attr('data-bind', binding);
            var fld = $('<div class="picInputField" />').appendTo(div);
            fld.attr('data-bind', binding);
            fld.inputField({ labelText: lblText, value: text, inputAttrs: fldAttrs, labelAttrs: lblAttrs });
            return div;
        },
        _buildOptionCheckbox: function (cssClass, lblText, binding, text, fldAttrs, lblAttrs) {
            var div = $('<div class="picOptionCheckbox" />');
            if (cssClass) div.addClass(cssClass);
            var fld = $('<div class="picCheckbox" />').appendTo(div);
            fld.attr('data-bind', binding);
            fld.checkbox({ labelText: lblText, value: text, inputAttrs: fldAttrs, labelAttrs: lblAttrs });
            return div;

            //var id = 'cfgField_' + binding.replace('.', '_').replace('[', '_').replace(']', '_');
            //var fld = $('<input type="checkbox" />').appendTo(div);
            //fld.prop('id', id);
            //fld.val(text);
            //fld.attr('data-bind', binding);
            //if (makeBool(text)) fld.attr('checked', 'checked');
            //var lbl = $('<label />').appendTo(div);
            //lbl.attr('for', id);
            //lbl.text(lblText);
            //div.attr('data-bind', binding);
            //if (typeof fldAttrs !== 'undefined') {
            //    for (var fprop in fldAttrs) {
            //        if (fprop.startsWith('style_'))
            //            fld.css(fprop.replace('style_', ''), fldAttrs[fprop]);
            //        else {
            //            fld.attr(fprop, fldAttrs[fprop]);
            //        }
            //    }
            //}
            //if (typeof lblAttrs !== 'undefined') {
            //    for (var lprop in lblAttrs) {
            //        if (lprop.startsWith('style_'))
            //            fld.css(lprop.replace('style_', ''), lblAttrs[lprop]);
            //        else
            //            fld.attr(lprop, lblAttrs[lprop]);
            //    }
            //}
            //return div;
        },
        _buildOptionSpinner: function (cssClass, lblText, binding, value, spinAttrs, lblAttrs) {
            var div = $('<div class="picOptionField" />');
            if (cssClass) div.addClass(cssClass);
            var lbl = $('<label />').appendTo(div);
            lbl.text(lblText);
            div.attr('data-bind', binding);
            var fld = $('<div class="picValueSpinner" />').appendTo(div);
            fld.attr('data-bind', binding);
            fld.valueSpinner(spinAttrs);
            fld[0].val(value);
            if (typeof spinAttrs !== 'undefined') {
                for (var fprop in spinAttrs) {
                    if (fprop.startsWith('style_'))
                        fld.css(fprop.replace('style_', ''), fldAttrs[fprop]);
                    else {
                        if (fprop === 'maxlength')
                            fld.find('div.picSpinner-value').css('width', parseInt(spinAttrs[fprop], 10) * .6 + 'rem');
                    }
                }
            }
            if (typeof lblAttrs !== 'undefined') {
                for (var lprop in lblAttrs) {
                    if (lprop === 'style')
                        lbl.css(lblAttrs[lprop]);
                    else
                        lbl.attr(lprop, lblAttrs[lprop]);
                }
            }
            return div;

        },
        _buildPumpPanel: function (pump, type, opts) {
            var self = this, o = self.options, el = self.element;
            var acc = { columns: [{ text: pump.name, glyph: 'fas fa-cog', style: { width: '9rem' } }, { text: type.desc, style: { width: '20rem' } }] };
            var a = self._buildAccordian('cfgPump', acc);
            var pnl = a.find('div.picAccordian-contents');
            var line = self._buildLine().appendTo(pnl);
            self._buildOptionField('pumpName', 'Name', 'name', pump.name, { maxlength: 16 }).appendTo(line);
            self._buildOptionDropdown('pumpType', {
                bindColumn: 0,
                displayColumn: 2,
                labelText: 'Type', binding: 'type', value: pump.type,
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Pump Type', style: { whiteSpace: 'nowrap' } }],
                items: opts.pumpTypes, inputStyle: { width: "7rem" }
            }).appendTo(line);
            if (makeBool(type.hasAddress)) {
                var addrs = [];
                for (var k = 0; k < opts.maxPumps; k++) addrs.push({ val: k + 96, desc: k + 1 });
                self._buildOptionDropdown('pumpAddress', {
                    bindColumn: 0,
                    displayColumn: 1,
                    labelText: 'Address', binding: 'address', value: pump.address,
                    columns: [{ binding: 'val', text: 'Id', hidden: true, style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Address', style: { whiteSpace: 'nowrap' } }],
                    items: addrs, inputStyle: { width: "2rem" }
                }).appendTo(line);
            }
            line = self._buildLine().appendTo(pnl);
            a.on('selchanged', 'div.picPickList[data-bind=type]', function (evt) {
                //console.log(a.parent());
                var p = dataBinder.fromElement(a);
                var pt = opts.pumpTypes.find(elem => elem.val === p.type);
                console.log(p);
                var panel = self._buildPumpPanel(p, pt, opts);
                console.log(evt.delegateTarget);
                panel[0].expanded(true);
                $(evt.delegateTarget).replaceWith(panel);
            });
            switch (type.name) {
                case 'vs':
                case 'vs+svrs':
                    self._buildVSPumpPanel(pump, type, opts).appendTo(line);
                    break;
                case 'vsf':
                    self._buildVSFPumpPanel(pump, type, opts).appendTo(line);
                    break;
                case 'vf':
                    self._buildVFPumpPanel(pump, type, opts).appendTo(line);
                    break;
            }
            var btnPPnl = $('<div class="picBtnPanel" />').appendTo(pnl);
            var btnRemove = $('<div id="btnRemovePump_"' + pump.id + '/>').appendTo(btnPPnl).actionButton({ text: 'Remove Pump', icon: '<i class="fas fa-trash" />' });
            btnRemove.on('click', function (e) {
                $(this).addClass('disabled');
                $(this).find('i').addClass('burst-animated');

                // Send this off to the server.
                //$(this).find('span.picButtonText').text('Loading Config...');
                //$.putApiService('/app/config/reload', function (data, status, xhr) {
            });
            var btnApply = $('<div id="btnSavePump_"' + pump.id + '/>').appendTo(btnPPnl).actionButton({ text: 'Save Pump', icon: '<i class="fas fa-save" />' });
            btnApply.on('click', function (e) {
                $(this).addClass('disabled');
                $(this).find('i').addClass('burst-animated');
                // Send this off to the server.
                //$(this).find('span.picButtonText').text('Loading Config...');
                //$.putApiService('/app/config/reload', function (data, status, xhr) {
            });
            return a;
        },
        _buildVSFPumpPanel: function (pump, pt, opts) {
            var self = this, o = self.options, el = self.element;
            var div = $('<div />');
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'id').val(pump.id).appendTo(div);
            var line = self._buildLine().appendTo(div);
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'primingTime').val(pump.primingTime).appendTo(line);
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'primingSpeed').val(pump.primingSpeed).appendTo(line);
            self._buildOptionSpinner('minSpeed', 'Minimum Speed', 'minSpeed', pump.minSpeed, { min: pt.minSpeed, max: pt.maxSpeed, step: 10, maxlength: 5, units: 'rpm' }, { style: { width: '8rem' } }).appendTo(line);
            self._buildOptionSpinner('maxSpeed', 'Maximum Speed', 'maxSpeed', pump.maxSpeed, { min: pt.minSpeed, max: pt.maxSpeed, step: 10, maxlength: 5, units: 'rpm' }, { style: { width: '8rem' } }).appendTo(line);
            line = self._buildLine().appendTo(div);
            self._buildOptionSpinner('minFlow', 'Minimum Flow', 'minFlow', pump.minFlow, { min: pt.minFlow, max: pt.maxFlow, step: 1, maxlength: 5, units: 'gpm' }, { style: { width: '8rem' } }).appendTo(line);
            self._buildOptionSpinner('maxFlow', 'Maximum Flow', 'maxFlow', pump.maxFlow, { min: pt.minFlow, max: pt.maxFlow, step: 1, maxlength: 5, units: 'gpm' }, { style: { width: '8rem' } }).appendTo(line);
            line = self._buildLine().appendTo(div);
            $('<hr />').appendTo(line);
            line = self._buildLine().appendTo(div);
            line.css({ textAlign: 'right' });
            var circuitsList = self._buildCircuitList({ labelText: 'Pump Circuits' }).appendTo(line);
            if (typeof pump.circuits !== 'undefined') {
                var list = circuitsList.find('div.picCircuitsList-list:first');
                for (var k = 0; k < pump.circuits.length; k++) {
                    var binding = 'circuits[' + k + '].';
                    var circ = pump.circuits[k];
                    var c = opts.circuits.find(elem => elem.id === circ.circuit);
                    var d = $('<div class="picCircuitOption" />').appendTo(list);
                    $('<input type="hidden" data-datatype="int" />').attr('data-bind', binding + 'id').val(k + 1).appendTo(d);
                    $('<input type="hidden" data-datatype="int" />').attr('data-bind', binding + 'units').val(circ.units).appendTo(d);
                    $('<input type="hidden" data-datatype="int" />').attr('data-bind', binding + 'speed').val(circ.speed).appendTo(d);
                    $('<input type="hidden" data-datatype="int" />').attr('data-bind', binding + 'flow').val(circ.flow).appendTo(d);
                    self._buildOptionDropdown('pumpCircuit', {
                        labelText: '', binding: binding + 'circuit', value: c.id,
                        columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                        items: opts.circuits, inputStyle: { width: "7rem" }
                    }).appendTo(d);
                    var u = opts.pumpUnits.find(elem => elem.val === circ.units);
                    if (u.name === 'rpm')
                        self._buildOptionSpinner('circuitSpeed', '', binding + 'speed', circ.speed || pt.maxSpeed, { min: pt.minSpeed, max: pt.maxSpeed, step: 10, maxlength: 5 }).appendTo(d);
                    else
                        self._buildOptionSpinner('circuitSpeed', '', binding + 'flow', circ.flow || pt.maxFlow, { min: pt.minFlow, max: pt.maxFlow, step: 1, maxlength: 5 }).appendTo(d);
                    self._buildOptionDropdown('pumpCircuitUnits', {
                        labelText: '', binding: binding + 'units', value: circ.units,
                        columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Units', style: { whiteSpace: 'nowrap' } }],
                        items: opts.pumpUnits, inputStyle: { width: "3rem" }
                    }).appendTo(d);

                    $('<i class="fas fa-trash picRemoveOption" />').appendTo(d);
                }
            }
            circuitsList.on('selchanged', 'div.picPickList[data-bind$=units]', function (evt) {
                var row = $(evt.target).parents('div.picCircuitOption:first');
                var spin = row.find('div.picValueSpinner:first');
                var circuit = dataBinder.fromElement(row, { circuits: [] });
                var binding = spin.attr('data-bind');
                console.log(circuit);
                if (evt.newItem.name === 'rpm') {
                    spin[0].options({ val: circuit.circuits[0].speed || pt.maxSpeed, min: pt.minSpeed, max: pt.maxSpeed, step: 10 });
                    spin.attr('data-bind', binding.replace('flow', 'speed'));
                }
                else {
                    spin[0].options({ val: circuit.circuits[0].flow || pt.maxFlow, min: pt.minFlow, max: pt.maxFlow, step: 1 });
                    spin.attr('data-bind', binding.replace('speed', 'flow'));
                }
            });

            return div;
        },
        _buildVFPumpPanel: function (pump, pt, opts) {
            var self = this, o = self.options, el = self.element;
            var div = $('<div />');
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'id').val(pump.id).appendTo(div);
            var line = self._buildLine().appendTo(div);
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'primingTime').val(pump.primingTime).appendTo(line);
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'primingSpeed').val(pump.primingSpeed).appendTo(line);
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'minSpeed').val(pump.minSpeed).appendTo(line);
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'maxSpeed').val(pump.maxSpeed).appendTo(line);
            self._buildOptionSpinner('minFlow', 'Minimum Flow', 'minFlow', pump.minFlow, { min: pt.minFlow, max: pt.maxFlow, step: 1, maxlength: 5, units: 'gpm' }, { style: { width: '8rem' } }).appendTo(line);
            self._buildOptionSpinner('maxFlow', 'Maximum Flow', 'maxFlow', pump.maxFlow, { min: pt.minFlow, max: pt.maxFlow, step: 1, maxlength: 5, units: 'gpm' }, { style: { width: '8rem' } }).appendTo(line);
            line = self._buildLine().appendTo(div);
            $('<hr />').appendTo(line);
            line = self._buildLine().appendTo(div);
            line.css({ textAlign: 'right' });
            var circuitsList = self._buildCircuitList({ labelText: 'Pump Circuits' }).appendTo(line);
            if (typeof pump.circuits !== 'undefined') {
                var list = circuitsList.find('div.picCircuitsList-list:first');
                for (var k = 0; k < pump.circuits.length; k++) {
                    var binding = 'circuits[' + k + '].';
                    var circ = pump.circuits[k];
                    var c = opts.circuits.find(elem => elem.id === circ.circuit);
                    var d = $('<div class="picCircuitOption" />').appendTo(list);
                    $('<input type="hidden" data-datatype="int" />').attr('data-bind', binding + 'id').val(k + 1).appendTo(d);
                    $('<input type="hidden" data-datatype="int" />').attr('data-bind', binding + 'units').val(circ.units).appendTo(d);
                    $('<input type="hidden" data-datatype="int" />').attr('data-bind', binding + 'speed').val(circ.speed).appendTo(d);
                    self._buildOptionDropdown('pumpCircuit', {
                        labelText: '', binding: binding + 'circuit', value: c.id,
                        columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                        items: opts.circuits, inputStyle: { width: "7rem" }
                    }).appendTo(d);
                    self._buildOptionSpinner('circuitSpeed', 'Flow', binding + 'flow', circ.flow || pt.maxFlow, { min: pt.minFlow, max: pt.maxFlow, step: 1, maxlength: 5, units: 'gpm' }).appendTo(d);
                    $('<i class="fas fa-trash picRemoveOption" />').appendTo(d);
                }
            }
            return div;
        },
        _buildVSPumpPanel: function (pump, pt, opts) {
            var self = this, o = self.options, el = self.element;
            var div = $('<div />');
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'id').val(pump.id).appendTo(div);
            var line = self._buildLine().appendTo(div);
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'minFlow').val(pump.minFlow).appendTo(line);
            $('<input type="hidden" data-datatype="int" />').attr('data-bind', 'maxFlow').val(pump.maxFlow).appendTo(line);
            self._buildOptionSpinner('primingTime', 'Priming Time', 'primingTime', pump.primingTime, { min: 0, max: 6, maxlength: 5, units: 'min' }, { style: { width: '8rem' } }).appendTo(line);
            self._buildOptionSpinner('primingSpeed', 'Priming Speed', 'primingSpeed', pump.primingSpeed, { min: pt.minSpeed, max: pt.maxSpeed, step: 10, maxlength: 5, units: 'rpm' }, { style: { width: '8rem' } }).appendTo(line);
            line = self._buildLine().appendTo(div);
            self._buildOptionSpinner('minSpeed', 'Minimum Speed', 'minSpeed', pump.minSpeed, { min: pt.minSpeed, max: pt.maxSpeed, step:10, maxlength: 5, units: 'rpm' }, { style: { width: '8rem' } }).appendTo(line);
            self._buildOptionSpinner('maxSpeed', 'Maximum Speed', 'maxSpeed', pump.maxSpeed, { min: pt.minSpeed, max: pt.maxSpeed, step:10, maxlength: 5, units: 'rpm' }, { style: { width: '8rem' } }).appendTo(line);
            line = self._buildLine().appendTo(div);
            $('<hr />').appendTo(line);
            line = self._buildLine().appendTo(div);
            line.css({ textAlign: 'right' });
            var circuitsList = self._buildCircuitList({ labelText: 'Pump Circuits' }).appendTo(line);
            if (typeof pump.circuits !== 'undefined') {
                var list = circuitsList.find('div.picCircuitsList-list:first');
                for (var k = 0; k < pump.circuits.length; k++) {
                    var binding = 'circuits[' + k + '].';
                    var circ = pump.circuits[k];
                    var c = opts.circuits.find(elem => elem.id === circ.circuit);
                    var d = $('<div class="picCircuitOption" />').appendTo(list);
                    $('<input type="hidden" data-datatype="int" />').attr('data-bind', binding + 'id').val(k + 1).appendTo(d);
                    $('<input type="hidden" data-datatype="int" />').attr('data-bind', binding + 'units').val(circ.units).appendTo(d);
                    $('<input type="hidden" data-datatype="int" />').attr('data-bind', binding + 'flow').val(circ.flow).appendTo(d);
                    self._buildOptionDropdown('pumpCircuit', {
                        labelText: '', binding: binding + 'circuit', value: c.id,
                        columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Circuit', style: { whiteSpace: 'nowrap' } }],
                        items: opts.circuits, inputStyle: { width: "7rem" }
                    }).appendTo(d);
                    self._buildOptionSpinner('circuitSpeed', 'Speed', binding + 'speed', circ.speed || pt.maxSpeed, { min: pt.minSpeed, max: pt.maxSpeed, step: 10, maxlength: 5, units: 'rpm' }).appendTo(d);
                    $('<i class="fas fa-trash picRemoveOption" />').appendTo(d);
                }
            }
            return div;
        }
    });
})(jQuery);
