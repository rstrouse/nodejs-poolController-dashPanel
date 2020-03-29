(function ($) {
    $.widget('pic.configPage', {
        options: {circuitReferences:[] },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            var tabs = $('<div class="picTabPanel" />');
            console.log('Building controls');
            tabs.appendTo(el);
            tabs.tabBar();
            $.getApiService('/config/all', null, function (data, status, xhr) {
                console.log(data);
                $.getApiService('/config/circuit/references', null, function(refs, status, xhr) {
                    var evt = $.Event('loaded');
                    console.log(refs);
                    o.circuitReferences = refs;
                    self._buildGeneralTab(data);
                    self._buildBodiesTab(data);
                    self._buildCircuitsTab(data);
                    self._buildFeaturesTab(data);
                    self._buildPumpsTab(data);
                    self._buildValvesTab(data);
                    self._buildChemistryTab(data);
                    self._buildHeatersTab(data);
                    self._buildOtherTab(data);
                    tabs[0].selectTabById('tabGeneral');
                    el.trigger(evt);
                });
            });
        },
        _buildOtherTab: function (cfg) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabOther', text: 'Other' };
                var contents = this.addTab(tabObj);
                contents.parent().addClass('picConfigTabContents');
                var divOuter = $('<div class="picConfigOther" />');
                divOuter.appendTo(contents);
            });
        },

        _buildBodiesTab: function (cfg) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabBodies', text: 'Bodies' };
                var contents = this.addTab(tabObj);
                contents.parent().addClass('picConfigTabContents');
                var divOuter = $('<div class="picConfigHeaters" />');
                divOuter.appendTo(contents);
            });
        },

        _buildHeatersTab: function (cfg) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabHeaters', text: 'Heaters' };
                var contents = this.addTab(tabObj);
                contents.parent().addClass('picConfigTabContents');
                var divOuter = $('<div class="picConfigHeaters" />');
                divOuter.appendTo(contents);
            });
        },

        _buildChemistryTab: function (cfg) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabChemistry', text: 'Chemistry' };
                var contents = this.addTab(tabObj);
                contents.parent().addClass('picConfigTabContents');
                var divOuter = $('<div class="picConfigChemistry" />');
                divOuter.appendTo(contents);
            });
        },

        _buildPumpsTab: function (cfg) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabPumps', text: 'Pumps' };
                var contents = this.addTab(tabObj);
                contents.parent().addClass('picConfigTabContents');
                var divOuter = $('<div class="picConfigPumps" />');
                divOuter.appendTo(contents);
            });
        },

        _buildCircuitsTab: function (cfg) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabCircuits', text: 'Circuits' };
                var contents = this.addTab(tabObj);
                contents.parent().addClass('picConfigTabContents');
                var divOuter = $('<div class="picConfigCircuits" />');
                divOuter.appendTo(contents);
            });
        },
        _buildFeaturesTab: function (cfg) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabFeatures', text: 'Features' };
                var contents = this.addTab(tabObj);
                contents.parent().addClass('picConfigTabContents');
                var divOuter = $('<div class="picConfigFeatures" />');
                divOuter.appendTo(contents);
            });
        },
        _buildCircuitDropdown(lblText, circuits, features, virtual, groups) {
            var self = this, o = self.options, el = self.element;
            var div = $('<div class="picOptionDropdown circuitDropdown" />');
            var lbl = $('<label />').appendTo(div);
            lbl.text(lblText);
            var dd = $('<select />').appendTo(div);
            for (var i = 0; i < o.circuitReferences.length; i++) {
                var ref = o.circuitReferences[i];
                if (ref.equipmentType === 'circuit' && !circuits) continue;
                if (ref.equipmentType === 'feature' && !features) continue;
                if (ref.equipmentType === 'virtual' && !virtual) continue;
                if ((ref.equipmentType === 'lightGroup' || ref.equipmentType === 'circuitGroup') && !groups) continue;
                var opt = $('<option />').appendTo(dd);
                opt.val(o.circuitReferences[i].id);
                opt.text(o.circuitReferences[i].name);
            }
            return div;
            
        },
        _buildValvesTab: function (cfg) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabValves', text: 'Valves' };
                var contents = this.addTab(tabObj);
                contents.parent().addClass('picConfigTabContents');
                var divOuter = $('<div class="picConfigValves" />');
                var dd = self._buildCircuitDropdown('Circuit', true, true, true, false);
                divOuter.appendTo(contents);
                for (var i = 0; i < cfg.valves.length; i++) {
                    var valve = cfg.valves[i];
                    var divValve = $('<div class="picConfigValve" />').appendTo(divOuter);
                    var bind = 'valves[' + i + '].';
                    self._buildOptionField('valveName', 'Name', bind + 'name', valve.name, { maxlength: 16 }).appendTo(divValve);
                    self._buildOptionDropdown('valveType', 'Type', bind + 'type', valve.type, [{ val: 1, text: 'Regular' }, { val: 2, text: 'Intellivalve' }]).appendTo(divValve);
                    dd.clone().appendTo(divValve);
                    divValve.find('div.circuitDropdown').attr('data-bind', bind + 'circuit');
                    divValve.find('div.circuitDropdown option[value=' + valve.circuit + ']').prop('selected', 'selected');
                    divValve.find('div.valveType option[value=' + valve.type + ']').prop('selected', 'selected');
                    if (valve.id === 3 || valve.id === 4) {
                        divValve.find('div.circuitDropdown select').prop('disabled', true);
                    }
                }
                var btnPnl = $('<div class="picBtnPanel" i/>');
                btnPnl.appendTo(contents);
                var btnApply = $('<div id="btnSaveValves" />');
                btnApply.appendTo(btnPnl);
                btnApply.actionButton({ text: 'Save Valves', icon: '<i class="fas fa-save" />' });
                btnApply.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('burst-animated');
                    // Send this off to the server.
                    //$(this).find('span.picButtonText').text('Loading Config...');
                    //$.putApiService('/app/config/reload', function (data, status, xhr) {

                });

            });

        },
        _buildGeneralTab: function (cfg) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabGeneral', text: 'General' };
                var contents = this.addTab(tabObj);
                contents.parent().addClass('picConfigTabContents');
                var divOuter = $('<div class="picConfigGeneral" />');
                divOuter.appendTo(contents);
                var line = self._buildLine().appendTo(divOuter);
                self._buildOptionField('poolAlias', 'Pool Alias', 'pool.alias', cfg.pool.alias, { maxlength: 16 }).appendTo(line);
                line = self._buildLine().appendTo(divOuter);
                self._buildOptionField('ownerName', 'Owner', 'pool.owner.name', cfg.pool.owner.name, { maxlength: 16 }).appendTo(line);
                line = self._buildLine().appendTo(divOuter);
                self._buildOptionField('ownerPhone', 'Phone', 'pool.owner.phone', cfg.pool.owner.phone, { maxlength: 16 }).appendTo(line);
                self._buildOptionField('ownerEmail', 'e-mail', 'pool.owner.email', cfg.pool.owner.email, { maxlength: 32 }).appendTo(line);
                line = self._buildLine().appendTo(divOuter);
                self._buildOptionField('ownerPhone2', 'Alt Phone', 'pool.owner.phone2', cfg.pool.owner.phone2, { maxlength: 16 }).appendTo(line);
                self._buildOptionField('ownerEmail2', 'Alt e-mail', 'pool.owner.email2', cfg.pool.owner.email2, { maxlength: 32 }).appendTo(line);
                line = self._buildLine().appendTo(divOuter);

                self._buildOptionField('locAddress', 'Address', 'pool.location.address', cfg.pool.location.address, { maxlength: 32 }).appendTo(line);
                line = self._buildLine().appendTo(divOuter);
                self._buildOptionField('locCity', 'City', 'pool.location.city', cfg.pool.location.city, { maxlength: 16 }).appendTo(line);
                self._buildOptionField('locState', 'State', 'pool.location.state', cfg.pool.location.state, { maxlength: 16 }).appendTo(line);
                self._buildOptionField('locZip', 'Zip', 'pool.location.zip', cfg.pool.location.zip, { maxlength: 10 }).appendTo(line);
                var btnPnl = $('<div class="picBtnPanel" i/>');
                btnPnl.appendTo(contents);
                var btnApply = $('<div id="btnSaveGeneral" />');
                btnApply.appendTo(btnPnl);
                btnApply.actionButton({ text: 'Save General', icon: '<i class="fas fa-save" />' });
                btnApply.on('click', function (e) {
                    $(this).addClass('disabled');
                    $(this).find('i').addClass('burst-animated');
                    // Send this off to the server.
                    //$(this).find('span.picButtonText').text('Loading Config...');
                    //$.putApiService('/app/config/reload', function (data, status, xhr) {

                });
                ///$.putApiService(obj.id === 0 ? '/config/intellibrite/setColors' : '/config/lightGroup/' + obj.id + '/setColors', obj, function (data, status, xhr) {

            });
        },
        _buildLine: function () { return $('<div class="picOptionLine" />'); },
        _buildOptionDropdown(cssClass, lblText, binding, text, ddOpts, ddAttrs, lblAttrs) {
            var div = $('<div class="picOptionDropdown" />');
            if (cssClass) div.addClass(cssClass);
            var lbl = $('<label />').appendTo(div);
            lbl.text(lblText);
            div.attr('data-bind', binding);
            var dd = $('<select />').appendTo(div);
            dd.attr('data-bind', binding);
            if (typeof ddAttrs !== 'undefined') {
                for (var fprop in fldAttrs) {
                    if (fprop.startsWith('style_'))
                        fld.css(fprop.replace('style_', ''), ddAttrs[fprop]);
                    else {
                        fld.attr(fprop, ddAttrs[fprop]);
                        if (fprop === 'maxlength')
                            fld.css('width', parseInt(ddAttrs[fprop], 10) * .6 + 'rem');
                    }
                }
            }
            if (typeof lblAttrs !== 'undefined') {
                for (var lprop in lblAttrs) {
                    if (lprop.startsWith('style_'))
                        fld.css(lprop.replace('style_', ''), lblAttrs[lprop]);
                    else
                        fld.attr(lprop, lblAttrs[lprop]);
                }
            }
            if (typeof ddOpts !== 'undefined') {
                for (var i = 0; i < ddOpts.length; i++) {
                    var opt = $('<option />').appendTo(dd);
                    opt.val(ddOpts[i].val);
                    opt.text(ddOpts[i].text);
                }
            }
            dd.val(text);
            return div;

        },
        _buildOptionField(cssClass, lblText, binding, text, fldAttrs, lblAttrs) {
            var div = $('<div class="picOptionField" />');
            if (cssClass) div.addClass(cssClass);
            var lbl = $('<label />').appendTo(div);
            lbl.text(lblText);
            div.attr('data-bind', binding);
            var fld = $('<input type="text" />').appendTo(div);
            fld.val(text);
            fld.attr('data-bind', binding);
            if (typeof fldAttrs !== 'undefined') {
                for (var fprop in fldAttrs) {
                    if (fprop.startsWith('style_'))
                        fld.css(fprop.replace('style_', ''), fldAttrs[fprop]);
                    else {
                        fld.attr(fprop, fldAttrs[fprop]);
                        if (fprop === 'maxlength')
                            fld.css('width', parseInt(fldAttrs[fprop], 10) * .6 + 'rem');
                    }
                }
            }
            if (typeof lblAttrs !== 'undefined') {
                for (var lprop in lblAttrs) {
                    if (lprop.startsWith('style_'))
                        fld.css(lprop.replace('style_', ''), lblAttrs[lprop]);
                    else
                        fld.attr(lprop, lblAttrs[lprop]);
                }
            }
            return div;
        }
    });
})(jQuery);
