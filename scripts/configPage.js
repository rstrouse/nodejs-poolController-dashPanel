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
            switch (evt.newTab.id) {
                case 'tabGeneral':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configGeneral();
                    break;
                case 'tabBodySetup':
                    self._buildBodySetupTab(evt.newTab.contents);
                    break;
                case 'tabBodies':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configBodies();
                    break;
                case 'tabFilters':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configFilters();
                    break;
                case 'tabCircuits':
                    self._buildCircuitsTab(evt.newTab.contents);
                    break;
                case 'tabController':
                    self._buildControllerTab(evt.newTab.contents);
                    break;
                case 'tabControllerType':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configControllerType();
                    break;
                case 'tabRS485':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configRS485();
                    break;
                case 'tabEquipment':
                    self._buildEquipmentTab(evt.newTab.contents);
                    break;
                case 'tabAuxCircuits':
                    console.log({ msg: 'Building Aux Circuits tab', newTab: evt.newTab });
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configAuxCircuits();
                    break;
                case 'tabCircuitGroups':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configCircuitGroups();
                    break;
                case 'tabFeatures':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configFeatures();
                    break;
                case 'tabCustomNames':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configCustomNames();
                    break;
                case 'tabValves':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configValves();
                    break;
                case 'tabPumps':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configPumps();
                    break;
                case 'tabChemistry':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configChemistry();
                    break;

                case 'tabLightGroups':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configLightGroups();
                    break;
                case 'tabRemotes':
                    self._buildRemotesTab(evt.newTab.contents);
                    break;
                case 'tabHeaters':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configHeaters();
                    break;
                case 'tabSchedules':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configSchedules();
                    break;
                case 'tabInterfaces':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configInterfaces();
                    break;
                case 'tabMockControllerType':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configMockControllerType();
                    break;
            }
            if (typeof evt.oldTab !== 'undefined') {
                // Need to clear the tab so that we stop getting the RS485 output messages
                if (evt.oldTab.id === 'tabRS485' && evt.newTab.id !== 'tabRS485') evt.oldTab.contents.empty();
            }
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            var tabs = $('<div class="picTabPanel"></div>');
            tabs.appendTo(el);
            tabs.tabBar();
            tabs.find('div.picTabContents').addClass('picConfigTabContents');
            tabs.on('tabchange', function (evt) { self._onTabChanged(evt); });
            $.getApiService('/config/all', null, function (data, status, xhr) {
                console.log(data);
                o.cfg = data;
                var evt = $.Event('loaded');
                var tab;
                tab = self._addConfigTab({ id: 'tabController', text: 'Controller', cssClass: 'cfgController' },
                    [{ id: 'tabControllerType', text: 'Model', cssClass: 'cfgControllerType' },
                    { id: 'tabRS485', text: 'RS485 Port', cssClass: 'cfgRS485Port' },
                    { id: 'tabInterfaces', text: 'Interfaces', cssClass: 'cfgInterfaces' },
                    { id: 'tabMockControllerType', text: 'Anslq25 (Mock Controller)', cssClass: 'cfgMockControllerType' }],
                );
                //tabs[0].showTab('tabController', false);
                tab = self._addConfigTab({ id: 'tabGeneral', text: 'General', cssClass: 'cfgGeneral' });
                tab = self._addConfigTab({ id: 'tabBodySetup', text: 'Bodies', cssClass: 'cfgTabBodies' },
                    [
                        { id: 'tabBodies', text: 'Bodies', cssClass: 'cfgBodies' },
                        { id: 'tabFilters', text: 'Filters', cssClass: 'cfgFiters' }
                    ]);
                tab = self._addConfigTab({ id: 'tabCircuits', text: 'Circuits', cssClass: 'cfgCircuits' },
                    [{ id: 'tabAuxCircuits', text: 'Aux-Circuits', cssClass: 'cfgAuxCircuits' },
                    { id: 'tabFeatures', text: 'Features', cssClass: 'cfgFeatures' },
                    { id: 'tabCircuitGroups', text: 'Circuit Groups', cssClass: 'cfgCircuitGroups' },
                    { id: 'tabLightGroups', text: 'Light Groups', cssClass: 'cfgLightGroups' }]);
                if (typeof data.equipment !== 'undefined' && typeof data.equipment.maxCustomNames !== 'undefined' && data.equipment.maxCustomNames > 0)
                    tab.parent().find('div.picTabBar:first')[0].addTab({ id: 'tabCustomNames', text: 'Custom Names', cssClass: 'cfgCustomNames' });
                //tab = self._addConfigTab({ id: 'tabEquipment', text: 'Equipment', cssClass: 'cfgCircuits' },
                //    [{ id: 'tabPumps', text: 'Pumps', cssClass: 'cfgPumps' },
                //    { id: 'tabValves', text: 'Valves', cssClass: 'cfgValves' },
                //    { id: 'tabChemistry', text: 'Chemistry', cssClass: 'cfgChemistry' },
                //    { id: 'tabHeaters', text: 'Heaters', cssClass: 'cfgHeaters' },
                //    { id: 'tabRemotes', text: 'Remotes', cssClass: 'cfgRemotes' }]);

                tab = self._addConfigTab({ id: 'tabPumps', text: 'Pumps', cssClass: 'cfgPumps' });
                tab = self._addConfigTab({ id: 'tabValves', text: 'Valves', cssClass: 'cfgValves' });
                tab = self._addConfigTab({ id: 'tabChemistry', text: 'Chemistry', cssClass: 'cfgChemistry' });
                tab = self._addConfigTab({ id: 'tabHeaters', text: 'Heaters', cssClass: 'cfgHeaters' });
                //tab = self._addConfigTab({ id: 'tabRemotes', text: 'Remotes', cssClass: 'cfgRemotes' });

                tab = self._addConfigTab({ id: 'tabSchedules', text: 'Schedules', cssClass: 'cfgSchedules' });
                tabs[0].selectTabById('tabGeneral');
                el.trigger(evt);
            });
        },
        _addConfigTab: function (attrs, subTabs) {
            var self = this, o = self.options, el = self.element;
            var divOuter = $('<div class="picConfigCategory"></div>');
            el.find('div.picTabPanel:first').each(function () {
                var contents = this.addTab(attrs);
                if (attrs.cssClass) divOuter.addClass(attrs.cssClass);
                divOuter.appendTo(contents);
                if (typeof attrs.oncreate === 'function') attrs.oncreate(contents);
                if (typeof subTabs !== 'undefined') {
                    var tabs = $('<div class="picTabPanel"></div>');
                    tabs.appendTo(contents);
                    tabs.tabBar();
                    tabs.find('div.picTabContents').addClass('picConfigTabContents');
                    //tabs.on('tabchange', function (evt) { self._onTabChanged(evt); });
                    for (var i = 0; i < subTabs.length; i++) {
                        var t = subTabs[i];
                        var c = tabs[0].addTab(t);
                        var d = $('<div class="picConfigCategory"></div>');
                        if (t.cssClass) d.addClass(t.cssClass);
                        d.appendTo(c);
                    }
                }
            });
            return divOuter;
        },
        _buildCircuitsTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            // Find the currently selected tab.  We want to reload it.
            var tabs = contents.find('div.picTabBar:first');
            var tabId = tabs.length > 0 ? tabs[0].selectedTabId() : 'tabAuxCircuits';
            console.log({ msg: 'Building Circuits Tab', tabId: tabId });
            switch (tabId) {
                case 'tabFeatures':
                case 'tabCircuitGroups':
                case 'tabLightGroups':
                case 'tabAuxCircuits':
                case 'tabCustomNames':
                    //tabs.selectedTabId(tabId);
                    break;
                default:
                    tabs[0].selectTabById('tabAuxCircuits');
                    break;
            }
        },
        _buildBodySetupTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            // Find the currently selected tab.  We want to reload it.
            var tabs = contents.find('div.picTabBar:first')[0];
            var tabId = tabs.selectedTabId();
            console.log({ msg: 'Building Body Setup Tab', tabId: tabId });
            switch (tabId) {
                case 'tabBodies':
                case 'tabFilters':
                    //tabs.selectedTabId(tabId);
                    break;
                default:
                    tabs.selectTabById('tabBodies');
                    break;
            }
        },

        _buildControllerTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            // Find the currently selected tab.  We want to reload it.
            var tabs = contents.find('div.picTabBar:first')[0];
            var tabId = tabs.selectedTabId();
            //tabs.showTab('tabControllerType', false);
            //tabs.showTab('tabRS485', false);
            switch (tabId) {
                case 'tabControllerType':
                case 'tabRS485':
                case 'tabInterfaces':
                    //tabs.selectedTabId(tabId);
                    break;
                default:
                    tabs.selectTabById('tabInterfaces');
                    break;
            }
        },

        _buildEquipmentTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            // Find the currently selected tab.  We want to reload it.
            var tabs = contents.find('div.picTabBar:first')[0];
            var tabId = tabs.selectedTabId();
            console.log({ msg: 'Building Equipment Tab', tabId: tabId });
            switch (tabId) {
                case 'tabValves':
                case 'tabPumps':
                case 'tabChemistry':
                case 'tabHeaters':
                case 'tabRemotes':
                    //tabs.selectedTabId(tabId);
                    break;
                default:
                    tabs.selectTabById('tabValves');
                    break;
            }
        }
    });
})(jQuery);
