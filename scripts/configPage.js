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
                case 'tabBodies':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configBodies();
                    break;
                case 'tabCircuits':
                    self._buildCircuitsTab(evt.newTab.contents);
                    break;
                case 'tabEquipment':
                    self._buildEquipmentTab(evt.newTab.contents);
                    break;
                case 'tabAuxCircuits':
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
                case 'tabLightGroups':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configLightGroups();
                    break;
                case 'tabRemotes':
                    self._buildRemotesTab(evt.newTab.contents);
                    break;
                case 'tabHeaters':
                    self._buildHeatersTab(evt.newTab.contents);
                    break;
                case 'tabSchedules':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents).configSchedules();
                    break;
                case 'tabDashboard':
                case 'tabInterfaces':
                    evt.newTab.contents.empty();
                    $('<div></div>').appendTo(evt.newTab.contents);
                    break;
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
                tab = self._addConfigTab({ id: 'tabGeneral', text: 'General', cssClass: 'cfgGeneral' });
                tab = self._addConfigTab({ id: 'tabBodies', text: 'Bodies', cssClass: 'cfgBodies' });
                tab = self._addConfigTab({ id: 'tabCircuits', text: 'Circuits', cssClass: 'cfgCircuits' },
                    [{ id: 'tabAuxCircuits', text: 'Aux-Circuits', cssClass: 'cfgAuxCircuits' },
                    { id: 'tabFeatures', text: 'Features', cssClass: 'cfgFeatures' },
                    { id: 'tabCircuitGroups', text: 'Circuit Groups', cssClass: 'cfgCircuitGroups' },
                    { id: 'tabLightGroups', text: 'Light Groups', cssClass: 'cfgLightGroups' }]);
                if (data.equipment.maxCustomNames > 0)
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
                tab = self._addConfigTab({ id: 'tabRemotes', text: 'Remotes', cssClass: 'cfgRemotes' });

                tab = self._addConfigTab({ id: 'tabSchedules', text: 'Schedules', cssClass: 'cfgSchedules' });

                //tab = self._addConfigTab({ id: 'tabInterfaces', text: 'Interfaces', cssClass: 'cfgInterfaces' });
                //tab = self._addConfigTab({ id: 'tabDashboard', text: 'Dashboard', cssClass: 'cfgDashboard' });

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
            var tabs = contents.find('div.picTabBar:first')[0];
            var tabId = tabs.selectedTabId();
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
                    tabs.selectTabById('tabAuxCircuits');
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
        },

        _buildSchedulesTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgSchedules"></div>').appendTo(contents);
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
            var divOuter = $('<div class="picConfigCategory cfgOther"></div>').appendTo(contents);
        },
        _buildHeatersTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgHeaters"></div>').appendTo(contents);
        },
        _buildChemistryTab: function (contents) {
            var self = this, o = self.options, el = self.element;
            contents.empty();
            var divOuter = $('<div class="picConfigCategory cfgChemistry"></div>').appendTo(contents);
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
        _buildLine: function () { return $('<div class="picOptionLine"></div>'); },
        _buildCircuitList: function (attrs) {
            var div = $('<div class="picCircuitsList"></div>');
            var pnl = $('<div class="picCircuitsList-btnPanel"></div>').appendTo(div);
            $('<div><label>' + attrs.labelText + '</label></div>').appendTo(pnl);
            var btnCPnl = $('<div class="picBtnPanel"></div>').appendTo(pnl);
            var btnAddCircuit = $('<div></div>').appendTo(btnCPnl).actionButton({ text: 'Add Circuit', icon: '<i class="fas fa-plus" ></i>' });
            var list = $('<div class="picCircuitsList-list"></div>').appendTo(div);
            return div;
        },
        _buildAccordian: function (cssClass, opts) {
            var div = $('<div class="picAccordian"></div>').accordian(opts);
            div.addClass(cssClass);
            return div;
        },
        _buildOptionDropdown: function (cssClass, ddAttrs) {
            var div = $('<div class="picOptionDropdown"></div>');
            if (cssClass) div.addClass(cssClass);
            div.attr('data-bind', ddAttrs.binding);
            var dd = $('<div class="picPickList"></div>').appendTo(div).pickList(ddAttrs)[0];
            return div;
        },
        _buildOptionField: function (cssClass, lblText, binding, text, fldAttrs, lblAttrs) {
            var div = $('<div class="picOptionField"></div>');
            if (cssClass) div.addClass(cssClass);
            div.attr('data-bind', binding);
            var fld = $('<div class="picInputField"></div>').appendTo(div);
            fld.attr('data-bind', binding);
            fld.inputField({ labelText: lblText, value: text, inputAttrs: fldAttrs, labelAttrs: lblAttrs });
            return div;
        },
        _buildOptionCheckbox: function (cssClass, lblText, binding, text, fldAttrs, lblAttrs) {
            var div = $('<div class="picOptionCheckbox"></div>');
            if (cssClass) div.addClass(cssClass);
            var fld = $('<div class="picCheckbox"></div>').appendTo(div);
            fld.attr('data-bind', binding);
            fld.checkbox({ labelText: lblText, value: text, inputAttrs: fldAttrs, labelAttrs: lblAttrs });
            return div;

            //var id = 'cfgField_' + binding.replace('.', '_').replace('[', '_').replace(']', '_');
            //var fld = $('<input type="checkbox"></input>').appendTo(div);
            //fld.prop('id', id);
            //fld.val(text);
            //fld.attr('data-bind', binding);
            //if (makeBool(text)) fld.attr('checked', 'checked');
            //var lbl = $('<label></label>').appendTo(div);
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
            var div = $('<div class="picOptionField"></div>');
            if (cssClass) div.addClass(cssClass);
            var fld = $('<div class="picValueSpinner"></div>').appendTo(div);
            fld.attr('data-bind', binding);
            fld.valueSpinner({ labelText: lblText, value: value, inputAttrs: spinAttrs, labelAttrs: lblAttrs });
            return div;
        }
    });
})(jQuery);
