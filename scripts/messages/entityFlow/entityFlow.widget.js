(function ($) {
    // Check if JSZip loaded (warn only if missing)
    $(document).ready(function() {
        if (typeof JSZip === 'undefined') {
            console.warn('JSZip not loaded - ZIP upload will not work');
        }
    });
    
    $.widget("pic.entityFlow", {
        options: {
            messages: [],           // Reference to message list
            poolConfig: null,       // Loaded from replay
            poolState: null,        // Loaded from replay
            controllerType: null,   // intellicenter, intellitouch, etc.
            entityFlowConfig: null, // Loaded from /messages/docs/entityFlow
            analysisMode: 'entity', // 'entity' | 'flow'
            selectedFlowPresets: ['registration'], // flow preset keys (multi-select)
            lastEntityType: 'none',
            lastEntityId: null,
            selectedEntityType: 'features',
            selectedEntityId: null,
            entityTypeExplicitlySelected: false
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('entity-flow-analyzer');
            self._buildControls();
            self._loadEntityFlowConfig();
            // Enable styled tooltips for action descriptions
            try {
                el.tooltip({
                    items: '[title]',
                    track: true
                });
            } catch (err) {
                console.warn('Tooltip init failed:', err);
            }
            
            // Public methods
            el[0].loadReplayData = function(config, state) { return self.loadReplayData(config, state); };
            el[0].setMessages = function(msgs) { return self.setMessages(msgs); };
            el[0].refresh = function() { return self.refresh(); };
            el[0].getSelectedEntity = function() { return self.getSelectedEntity(); };
            el[0].importFiles = function(files) { return self.importFiles(files); };
            el[0].clearAll = function() { return self.clearAll(); };
            el[0].scrollToPacket = function(index, msg) { return self.scrollToPacket(index, msg); };
            el[0].scrollToPacketById = function(msgId) { return self.scrollToPacketById(msgId); };
            
            // Listen for filter changes from Message List
            $('div.picMessages').on('messageFiltersChanged', function(e) {
                self.refresh();
            });
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            
            // === COLLAPSED HEADER (shown when ready) ===
            o.collapsedHeader = $('<div class="entity-flow-collapsed-header" style="display:none"></div>').appendTo(el);
            
            var collapsedLeft = $('<div class="collapsed-header-left"></div>').appendTo(o.collapsedHeader);
            o.controllerDisplayCollapsed = $('<span class="controller-badge"></span>').appendTo(collapsedLeft);
            
            var collapsedControls = $('<div class="collapsed-header-controls"></div>').appendTo(o.collapsedHeader);
            $('<label>Mode:</label>').appendTo(collapsedControls);
            o.modeSelectCollapsed = $('<select class="mode-select-sm"></select>').appendTo(collapsedControls);
            $('<option value="entity">Entity</option>').appendTo(o.modeSelectCollapsed);
            $('<option value="flow">Flow</option>').appendTo(o.modeSelectCollapsed);

            $('<label class="flow-only">Flow:</label>').appendTo(collapsedControls);
            o.flowMultiBtnCollapsed = $('<button type="button" class="flow-multi-btn flow-multi-btn-sm flow-only"></button>').appendTo(collapsedControls);
            // Floating menu anchored to the collapsed header (positioned via JS)
            o.flowMultiMenuCollapsed = $('<div class="flow-multi-menu flow-only"></div>').appendTo(document.body).hide();

            $('<label class="entity-only">Type:</label>').appendTo(collapsedControls);
            o.entityTypeSelectCollapsed = $('<select class="entity-type-select-sm entity-only"></select>').appendTo(collapsedControls);
            $('<label class="entity-only">Entity:</label>').appendTo(collapsedControls);
            o.entitySelectCollapsed = $('<select class="entity-select-sm entity-only"></select>').appendTo(collapsedControls);
            
            var collapsedRight = $('<div class="collapsed-header-right"></div>').appendTo(o.collapsedHeader);
            var expandBtn = $('<button class="expand-setup-btn" title="Show setup panel"><i class="fas fa-chevron-down"></i></button>').appendTo(collapsedRight);
            expandBtn.on('click', function() { self._toggleSetupPanel(true); });
            
            // Collapsed dropdowns sync with expanded ones
            o.modeSelectCollapsed.on('change', function() {
                o.modeSelect.val($(this).val()).trigger('change');
            });
            o.entityTypeSelectCollapsed.on('change', function() {
                o.entityTypeSelect.val($(this).val()).trigger('change');
            });
            o.entitySelectCollapsed.on('change', function() {
                o.entitySelect.val($(this).val()).trigger('change');
            });
            
            // === EXPANDED SETUP PANEL (shown initially) ===
            o.setupPanel = $('<div class="entity-flow-setup"></div>').appendTo(el);
            
            // === STEP 1: File Loading ===
            var step1 = $('<div class="entity-flow-step step-1"></div>').appendTo(o.setupPanel);
            $('<div class="step-header"><span class="step-number">1</span><span class="step-title">Load Replay Files</span></div>').appendTo(step1);
            o.fileStatusPanel = $('<div class="step-content file-status-panel"></div>').appendTo(step1);
            
            // === STEP 2: Entity Selection ===
            o.step2Container = $('<div class="entity-flow-step step-2 step-disabled"></div>').appendTo(o.setupPanel);
            var step2Header = $('<div class="step-header"><span class="step-number">2</span><span class="step-title">Select Entity to Analyze</span></div>').appendTo(o.step2Container);
            var collapseBtn = $('<button class="collapse-setup-btn" title="Collapse to header"><i class="fas fa-chevron-up"></i></button>').appendTo(step2Header);
            collapseBtn.on('click', function() { self._toggleSetupPanel(false); });
            
            var step2Content = $('<div class="step-content"></div>').appendTo(o.step2Container);
            
            // Controller type display (read-only, from replay data)
            var ctrlRow = $('<div class="entity-flow-row"></div>').appendTo(step2Content);
            $('<label>Controller:</label>').appendTo(ctrlRow);
            o.controllerDisplay = $('<span class="controller-type-display">Not loaded</span>').appendTo(ctrlRow);

            // Analysis mode selector (Entity vs Flow)
            var modeRow = $('<div class="entity-flow-row"></div>').appendTo(step2Content);
            $('<label>Mode:</label>').appendTo(modeRow);
            o.modeSelect = $('<select class="mode-select"></select>').appendTo(modeRow);
            $('<option value="entity">Entity</option>').appendTo(o.modeSelect);
            $('<option value="flow">Flow</option>').appendTo(o.modeSelect);
            o.modeSelect.val(o.analysisMode || 'entity');

            // Flow preset selector (only in Flow mode)
            var flowRow = $('<div class="entity-flow-row flow-only"></div>').appendTo(step2Content);
            $('<label>Flow:</label>').appendTo(flowRow);
            o.flowMultiBtn = $('<button type="button" class="flow-multi-btn"></button>').appendTo(flowRow);
            o.flowMultiMenu = $('<div class="flow-multi-menu"></div>').appendTo(document.body).hide();
            self._buildFlowPresetMenu();
            
            // Entity type selector
            var typeRow = $('<div class="entity-flow-row entity-only"></div>').appendTo(step2Content);
            $('<label>Entity Type:</label>').appendTo(typeRow);
            o.entityTypeSelect = $('<select class="entity-type-select"></select>').appendTo(typeRow);
            // Fallback until config loads: default to NONE (do not auto-filter)
            $('<option value="none">None</option>').appendTo(o.entityTypeSelect);
            $('<option value="features">Features</option>').appendTo(o.entityTypeSelect);
            o.selectedEntityType = 'none';
            o.entityTypeSelect.val('none');
            
            o.entityTypeSelect.on('change', function() {
                o.entityTypeExplicitlySelected = true;
                o.selectedEntityType = $(this).val();
                // Reset selection when changing type
                o.selectedEntityId = null;
                self._populateEntityDropdown();
                self.refresh();
                self._emitEntityTypeChanged();
                // Sync collapsed dropdown
                o.entityTypeSelectCollapsed.val(o.selectedEntityType);
            });
            
            // Entity selector
            var entityRow = $('<div class="entity-flow-row entity-only"></div>').appendTo(step2Content);
            $('<label>Entity:</label>').appendTo(entityRow);
            o.entitySelect = $('<select class="entity-select"></select>').appendTo(entityRow);
            $('<option value="">-- Select Entity --</option>').appendTo(o.entitySelect);
            
            o.entitySelect.on('change', function() {
                o.selectedEntityId = $(this).val() ? parseInt($(this).val(), 10) : null;
                self.refresh();
                // Sync collapsed dropdown
                o.entitySelectCollapsed.val($(this).val());
                // Auto-collapse when first entity is selected
                if (o.selectedEntityId && !o.hasAutoCollapsed) {
                    o.hasAutoCollapsed = true;
                    self._toggleSetupPanel(false);
                }
            });
            
            // Refresh button (always visible; works in either mode)
            var actionsRow = $('<div class="entity-flow-row"></div>').appendTo(step2Content);
            $('<label></label>').appendTo(actionsRow);
            var btnRefresh = $('<button class="entity-flow-btn"><i class="fas fa-sync-alt"></i> Refresh</button>').appendTo(actionsRow);
            btnRefresh.on('click', function() { self.refresh(); });

            // Mode change behavior
            o.modeSelect.on('change', function() {
                o.analysisMode = $(this).val() || 'entity';
                // Persist/restore previous entity selection when toggling modes
                if (o.analysisMode === 'flow') {
                    o.lastEntityType = o.selectedEntityType;
                    o.lastEntityId = o.selectedEntityId;
                    o.selectedEntityId = null;
                } else {
                    if (o.lastEntityType) o.selectedEntityType = o.lastEntityType;
                    if (o.lastEntityId) o.selectedEntityId = o.lastEntityId;
                }
                self._applyModeVisibility();
                self._syncCollapsedDropdowns();
                self._emitEntityTypeChanged(); // drives Message List filtering
                self.refresh();
            });

            self._applyModeVisibility();
            
            // Timeline container
            var timelineContainer = $('<div class="entity-timeline-container"></div>').appendTo(el);
            
            // Timeline header
            var timelineHeader = $('<div class="entity-timeline-header"></div>').appendTo(timelineContainer);
            o.timelineTitle = $('<h3>Select an entity to view its packet history</h3>').appendTo(timelineHeader);
            
            // === Flow Timeline (Flame Graph-style spans) ===
            var flowTimelineWrapper = $('<div class="flow-timeline-wrapper"></div>').appendTo(timelineContainer);
            $('<div class="flow-timeline-label">Flow Timeline:</div>').appendTo(flowTimelineWrapper);
            o.flowTimelineLegend = $('<div class="flow-timeline-legend"></div>').appendTo(flowTimelineWrapper);
            o.flowTimelineLegend.append(
                '<span class="legend-item legend-config-sweep" data-flowkey="configSweep"><span class="legend-swatch swatch-config-sweep"></span>Config sweep</span>' +
                '<span class="legend-item legend-config-item" data-flowkey="configItem"><span class="legend-swatch swatch-config-item"></span>Config item</span>' +
                '<span class="legend-item legend-set-circuit" data-flowkey="setCircuit"><span class="legend-swatch swatch-set-circuit"></span>Set circuit</span>' +
                '<span class="legend-item legend-bcast-2" data-flowkey="broadcast2"><span class="legend-swatch swatch-bcast-2"></span>Broadcast 2</span>' +
                '<span class="legend-item legend-bcast-204" data-flowkey="broadcast204"><span class="legend-swatch swatch-bcast-204"></span>Broadcast 204</span>' +
                '<span class="legend-hint">Click a bar to filter the same range in the message list</span>'
            );
            var flowTimelineContainer = $('<div class="flow-timeline-container"></div>').appendTo(flowTimelineWrapper);
            o.flowTimelineTrack = $('<div class="flow-timeline-track"></div>').appendTo(flowTimelineContainer);
            o.flowTimelineLayers = $('<div class="flow-timeline-layers"></div>').appendTo(o.flowTimelineTrack);

            // === State Timeline Bar (Tesla-style traffic view) ===
            var stateTimelineWrapper = $('<div class="state-timeline-wrapper"></div>').appendTo(timelineContainer);
            $('<div class="state-timeline-label">State Timeline:</div>').appendTo(stateTimelineWrapper);
            
            var stateTimelineContainer = $('<div class="state-timeline-container"></div>').appendTo(stateTimelineWrapper);
            o.stateTimelineTrack = $('<div class="state-timeline-track"></div>').appendTo(stateTimelineContainer);
            o.stateTimelineSegments = $('<div class="state-timeline-segments"></div>').appendTo(o.stateTimelineTrack);
            
            // Range handles with tooltips
            o.rangeHandleStart = $('<div class="state-timeline-handle handle-start"><div class="handle-tooltip"></div><div class="handle-grip"></div></div>').appendTo(stateTimelineContainer);
            o.rangeHandleEnd = $('<div class="state-timeline-handle handle-end"><div class="handle-tooltip"></div><div class="handle-grip"></div></div>').appendTo(stateTimelineContainer);
            
            // Range info display
            o.rangeInfo = $('<div class="state-timeline-range-info"></div>').appendTo(stateTimelineWrapper);
            
            // Initialize range (full range)
            o.rangeStart = 0;
            o.rangeEnd = 1;
            
            // Setup drag handlers
            self._setupRangeHandlers();
            
            // Timeline table
            var tableWrapper = $('<div class="entity-timeline-table-wrapper"></div>').appendTo(timelineContainer);
            o.timelineTable = $('<table class="entity-timeline-table">' +
                '<thead><tr>' +
                '<th class="col-time">Time</th>' +
                '<th class="col-pkt">Pkt#</th>' +
                '<th class="col-action">Action</th>' +
                '<th class="col-direction">Direction</th>' +
                '<th class="col-state">State</th>' +
                '<th class="col-bytes">Relevant Bytes</th>' +
                '<th class="col-bits">Bit Details</th>' +
                '<th class="col-flags">Flags</th>' +
                '</tr></thead>' +
                '<tbody></tbody></table>').appendTo(tableWrapper);
            
            // Status bar
            o.statusBar = $('<div class="entity-flow-status"></div>').appendTo(el);
            
            // Initialize file status panel
            self._updateFileStatusPanel();
        },
        importFiles: function(files) {
            var self = this, o = self.options;
            if (!files || files.length === 0) return;
            // Always clear before loading (user requirement)
            self._clearAll();
            self._handleFiles(files);
        },
        clearAll: function() {
            var self = this;
            self._clearAll();
            self.refresh();
        },
        _clearAll: function() {
            var self = this, o = self.options;
            // Clear Entity Flow state
            o.messages = [];
            o.poolConfig = null;
            o.poolState = null;
            o.controllerType = null;
            o.selectedEntityId = null;
            o.hasAutoCollapsed = false; // Reset so it collapses again on next load
            // Reset range to full
            o.rangeStart = 0;
            o.rangeEnd = 1;
            self._updateHandlePositions();
            // Show expanded panel again
            self._toggleSetupPanel(true);
            // Clear UI selections if built
            if (o.entitySelect) {
                o.entitySelect.empty();
                $('<option value="">-- Select Entity --</option>').appendTo(o.entitySelect);
            }
            if (o.controllerDisplay) o.controllerDisplay.text('Not loaded');
            self._setLoadStatus('');
            // Update file status panel (shows empty checkboxes)
            self._updateFileStatusPanel();
            // Clear Message List
            var msgList = $('div.picMessages:first')[0];
            if (msgList && msgList.clear) msgList.clear();
        },
        _setLoadStatus: function(text) {
            var self = this, o = self.options, el = self.element;
            if (o.statusBar) o.statusBar.text(text || '');
            // Also emit event for the top bar to display status
            var evt = $.Event('replayLoadStatus');
            evt.text = text || '';
            el.trigger(evt);
        },
        _updateFileStatusPanel: function() {
            var self = this, o = self.options;
            if (!o.fileStatusPanel) return;
            
            var hasConfig = !!o.poolConfig;
            var hasState = !!o.poolState;
            var hasLog = o.messages && o.messages.length > 0;
            var hasEntitySource = hasConfig || hasState;
            var allLoaded = hasEntitySource && hasLog;
            
            // Build checklist
            var checkIcon = '<i class="fas fa-check-square file-status-loaded"></i>';
            var emptyIcon = '<i class="far fa-square file-status-missing"></i>';
            
            var html = '';
            
            // Config
            html += '<div class="file-status-item">' + (hasConfig ? checkIcon : emptyIcon) + 
                    '<span class="' + (hasConfig ? 'loaded' : 'missing') + '">poolConfig.json</span></div>';
            
            // State
            html += '<div class="file-status-item">' + (hasState ? checkIcon : emptyIcon) + 
                    '<span class="' + (hasState ? 'loaded' : 'missing') + '">poolState.json</span></div>';
            
            // Log
            html += '<div class="file-status-item">' + (hasLog ? checkIcon : emptyIcon) + 
                    '<span class="' + (hasLog ? 'loaded' : 'missing') + '">packetLog (.log)</span>' +
                    (hasLog ? ' <span class="file-status-count">(' + o.messages.length + ' packets)</span>' : '') + '</div>';
            
            // Hint when something missing
            if (!allLoaded) {
                html += '<p class="file-status-hint">';
                if (!hasConfig && !hasState && !hasLog) {
                    html += 'Use "Choose Files" above to load a .zip or individual files';
                } else if (!hasEntitySource) {
                    html += 'Need poolConfig.json OR poolState.json for entity names';
                } else if (!hasLog) {
                    html += 'Need packetLog for timeline';
                }
                html += '</p>';
            } else {
                html += '<p class="file-status-complete"><i class="fas fa-check-circle"></i> Ready to analyze</p>';
            }
            
            o.fileStatusPanel.html(html);
            
            // Update Step 2 availability
            self._updateStep2Availability();
        },
        _updateStep2Availability: function() {
            var self = this, o = self.options;
            if (!o.step2Container) return;
            
            var hasEntitySource = o.poolConfig || o.poolState;
            var hasLog = o.messages && o.messages.length > 0;
            var allLoaded = hasLog; // Flow mode can work with log-only
            
            if (allLoaded) {
                o.step2Container.removeClass('step-disabled');
                if (o.modeSelect) o.modeSelect.prop('disabled', false);
                if (o.flowMultiBtn) o.flowMultiBtn.prop('disabled', false);
                if (o.flowMultiBtnCollapsed) o.flowMultiBtnCollapsed.prop('disabled', false);
                // Entity-only controls still require config/state
                if (o.entityTypeSelect) o.entityTypeSelect.prop('disabled', !hasEntitySource);
                if (o.entitySelect) o.entitySelect.prop('disabled', !hasEntitySource);
            } else {
                o.step2Container.addClass('step-disabled');
                if (o.modeSelect) o.modeSelect.prop('disabled', true);
                if (o.flowMultiBtn) o.flowMultiBtn.prop('disabled', true);
                if (o.flowMultiBtnCollapsed) o.flowMultiBtnCollapsed.prop('disabled', true);
                if (o.entityTypeSelect) o.entityTypeSelect.prop('disabled', true);
                if (o.entitySelect) o.entitySelect.prop('disabled', true);
            }
        },
        _applyModeVisibility: function() {
            var self = this, o = self.options, el = self.element;
            var isFlow = o.analysisMode === 'flow';
            // Show/hide rows
            el.find('.flow-only').toggle(isFlow);
            el.find('.entity-only').toggle(!isFlow);
            // Update selects
            if (o.modeSelect) o.modeSelect.val(o.analysisMode || 'entity');
            if (o.modeSelectCollapsed) o.modeSelectCollapsed.val(o.analysisMode || 'entity');
            self._updateFlowMultiButtonText();
        },
        _toggleSetupPanel: function(showExpanded) {
            var self = this, o = self.options;
            if (showExpanded) {
                o.setupPanel.show();
                o.collapsedHeader.hide();
            } else {
                o.setupPanel.hide();
                o.collapsedHeader.show();
                // Update collapsed header info
                o.controllerDisplayCollapsed.text(o.controllerDisplay.text());
            }
        },
        _syncCollapsedDropdowns: function() {
            var self = this, o = self.options;
            if (!o.entityTypeSelectCollapsed || !o.entitySelectCollapsed) return;
            
            // Mode + flow preset
            if (o.modeSelectCollapsed) o.modeSelectCollapsed.val(o.analysisMode || 'entity');
            self._updateFlowMultiButtonText();

            // Sync entity type dropdown
            o.entityTypeSelectCollapsed.empty();
            o.entityTypeSelect.find('option').each(function() {
                o.entityTypeSelectCollapsed.append($(this).clone());
            });
            o.entityTypeSelectCollapsed.val(o.selectedEntityType);
            
            // Sync entity dropdown
            o.entitySelectCollapsed.empty();
            o.entitySelect.find('option').each(function() {
                o.entitySelectCollapsed.append($(this).clone());
            });
            o.entitySelectCollapsed.val(o.selectedEntityId || '');
        },
        _loadEntityFlowConfig: function() {
            var self = this, o = self.options;
            $.getLocalService('/messages/docs/entityFlow', undefined, function(cfg) {
                o.entityFlowConfig = cfg || null;
                self._populateEntityTypeDropdown();
            }).fail(function(xhr, status, err) {
                console.warn('Failed to load entityFlow config:', err);
                o.entityFlowConfig = null;
            });
        },
        _populateEntityTypeDropdown: function() {
            var self = this, o = self.options;
            if (!o.entityTypeSelect) return;
            var cfg = self._getControllerEntityTypesConfig();
            if (!cfg) return; // keep fallback option
            o.entityTypeSelect.empty();
            Object.keys(cfg).forEach(function(key) {
                var t = cfg[key];
                $('<option></option>').val(key).text(t.label || key).appendTo(o.entityTypeSelect);
            });
            // Default behavior: do NOT auto-filter. Prefer 'none' unless user explicitly selected something.
            if (!o.entityTypeExplicitlySelected && o.entityTypeSelect.find('option[value="none"]').length) {
                o.selectedEntityType = 'none';
                o.entityTypeSelect.val('none');
                self._syncCollapsedDropdowns();
                return;
            }
            // Otherwise keep existing selection if still valid
            if (o.selectedEntityType && o.entityTypeSelect.find('option[value="' + o.selectedEntityType + '"]').length) {
                o.entityTypeSelect.val(o.selectedEntityType);
                self._syncCollapsedDropdowns();
                return;
            }
            // Fallback to first option
            var firstVal = o.entityTypeSelect.find('option:first').val();
            o.selectedEntityType = firstVal;
            o.entityTypeSelect.val(firstVal);
            self._syncCollapsedDropdowns();
        },
        _getFlowPresets: function() {
            // Minimal useful presets for now (can expand as we learn more)
            return [
                { key: 'registration', label: 'Registration + Config (228/164/222/30/ACK)' },
                { key: 'config', label: 'Config only (222/30)' },
                { key: 'set', label: 'Set circuit/feature (168/184 + ACK + 222[15,0] + 30[15,0])' },
                { key: 'broadcasts', label: 'Broadcasts (2 + 204)' },
                { key: 'all', label: 'All packets (no filter)' }
            ];
        },
        _buildFlowPresetMenu: function() {
            var self = this, o = self.options;
            if (!o.flowMultiMenu || !o.flowMultiBtn || !o.flowMultiMenuCollapsed || !o.flowMultiBtnCollapsed) return;

            var presets = self._getFlowPresets();
            var selected = new Set(Array.isArray(o.selectedFlowPresets) ? o.selectedFlowPresets : []);

            function rebuild(menuEl) {
                menuEl.empty();
                $('<div class="flow-multi-menu-title"></div>').text('Include flows:').appendTo(menuEl);
                for (var i = 0; i < presets.length; i++) {
                    (function(p) {
                        var row = $('<label class="flow-multi-item"></label>').appendTo(menuEl);
                        var cb = $('<input type="checkbox" />').appendTo(row);
                        cb.prop('checked', selected.has(p.key));
                        $('<span></span>').text(p.label).appendTo(row);
                        cb.on('change', function() {
                            var cur = new Set(Array.isArray(o.selectedFlowPresets) ? o.selectedFlowPresets : []);
                            if ($(this).is(':checked')) cur.add(p.key);
                            else cur.delete(p.key);
                            o.selectedFlowPresets = Array.from(cur);
                            // Keep both menus in sync
                            selected = new Set(o.selectedFlowPresets);
                            rebuild(o.flowMultiMenu);
                            rebuild(o.flowMultiMenuCollapsed);
                            self._updateFlowMultiButtonText();
                            self._emitEntityTypeChanged();
                            self.refresh();
                        });
                    })(presets[i]);
                }
                $('<div class="flow-multi-menu-hint"></div>').text('Select 1+ to filter; select none to show all packets.').appendTo(menuEl);
            }

            rebuild(o.flowMultiMenu);
            rebuild(o.flowMultiMenuCollapsed);

            // Toggle behavior + positioning
            function bind(btnEl, menuEl) {
                if (btnEl.data('flowMultiBound')) return;
                btnEl.data('flowMultiBound', true);
                btnEl.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var rect = btnEl[0].getBoundingClientRect();
                    menuEl.css({ top: (rect.bottom + window.scrollY + 6) + 'px', left: (rect.left + window.scrollX) + 'px' });
                    menuEl.toggle();
                });
            }
            bind(o.flowMultiBtn, o.flowMultiMenu);
            bind(o.flowMultiBtnCollapsed, o.flowMultiMenuCollapsed);

            // Close on outside click (one handler)
            $(document).off('mousedown.flowMulti').on('mousedown.flowMulti', function(evt) {
                var $t = $(evt.target);
                var keep = $t.closest(o.flowMultiMenu).length ||
                           $t.closest(o.flowMultiMenuCollapsed).length ||
                           $t.closest(o.flowMultiBtn).length ||
                           $t.closest(o.flowMultiBtnCollapsed).length;
                if (!keep) {
                    o.flowMultiMenu.hide();
                    o.flowMultiMenuCollapsed.hide();
                }
            });

            self._updateFlowMultiButtonText();
        },
        _updateFlowMultiButtonText: function() {
            var self = this, o = self.options;
            var presets = self._getFlowPresets();
            var labelByKey = {};
            for (var i = 0; i < presets.length; i++) labelByKey[presets[i].key] = presets[i].label;

            var sel = Array.isArray(o.selectedFlowPresets) ? o.selectedFlowPresets : [];
            var text = '';
            if (sel.length === 0) text = 'All flows';
            else if (sel.length === 1) text = labelByKey[sel[0]] || sel[0];
            else text = sel.length + ' flows selected';

            if (o.flowMultiBtn) o.flowMultiBtn.text(text);
            if (o.flowMultiBtnCollapsed) o.flowMultiBtnCollapsed.text(text);
        },
        _getFlowPresetMatchers: function() {
            var self = this, o = self.options;
            var keys = Array.isArray(o.selectedFlowPresets) ? o.selectedFlowPresets : [];
            if (keys.length === 0) return []; // none selected => no filter
            // If "all" selected, treat as no filter
            if (keys.includes('all')) return [];

            function matchersFor(key) {
                if (key === 'broadcasts') return [{ protocol: 'broadcast', action: 2 }, { protocol: 'broadcast', action: 204 }];
                if (key === 'config') return [{ protocol: 'broadcast', action: 222 }, { protocol: 'broadcast', action: 30 }];
                if (key === 'set') {
                    return [
                        { protocol: 'broadcast', action: 168 },
                        { protocol: 'broadcast', action: 184 },
                        { protocol: 'broadcast', action: 1 },
                        { protocol: 'broadcast', action: 222, payload0: 15 },
                        { protocol: 'broadcast', action: 30, payload0: 15 }
                    ];
                }
                // registration (default)
                return [
                    { protocol: 'broadcast', action: 228 },
                    { protocol: 'broadcast', action: 164 },
                    { protocol: 'broadcast', action: 222 },
                    { protocol: 'broadcast', action: 30 },
                    { protocol: 'broadcast', action: 1 }
                ];
            }

            var seen = new Set();
            var merged = [];
            for (var i = 0; i < keys.length; i++) {
                var arr = matchersFor(keys[i]) || [];
                for (var j = 0; j < arr.length; j++) {
                    var m = arr[j];
                    var k = String(m.protocol || '') + '|' + String(typeof m.action !== 'undefined' ? m.action : '') + '|' + String(typeof m.payload0 !== 'undefined' ? m.payload0 : '');
                    if (seen.has(k)) continue;
                    seen.add(k);
                    merged.push(m);
                }
            }
            return merged;
        },
        _getControllerEntityTypesConfig: function() {
            var self = this, o = self.options;
            if (!o.entityFlowConfig || !o.entityFlowConfig.controllers) return null;
            var ctype = o.controllerType || 'intellicenter';
            var controllerCfg = o.entityFlowConfig.controllers[ctype];
            if (!controllerCfg || !controllerCfg.entityTypes) return null;
            return controllerCfg.entityTypes;
        },
        _getSelectedEntityTypeConfig: function() {
            var self = this, o = self.options;
            var types = self._getControllerEntityTypesConfig();
            if (!types) return null;
            return types[o.selectedEntityType] || null;
        },
        _handleFiles: function(files) {
            var self = this, o = self.options;
            
            if (!files || files.length === 0) return;
            
            self._setLoadStatus('Loading...');
            
            var poolConfig = null;
            var poolState = null;
            var packetLogText = null;
            var logFileName = null;
            var pendingReads = 0;
            
            // Check if it's a zip file (case-insensitive)
            var fileName = files[0].name.toLowerCase();
            
            if (files.length === 1 && fileName.endsWith('.zip')) {
                self._handleZipUpload(files[0]);
                return;
            }
            
            // Handle individual JSON files
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var lower = (file.name || '').toLowerCase();
                if (lower.endsWith('.log') || lower.includes('packetlog')) {
                    logFileName = file.name; // Capture original filename
                    pendingReads++;
                    self._readTextFile(file, function(txt) {
                        packetLogText = txt;
                        pendingReads--;
                        if (pendingReads === 0) self._finishLoad(poolConfig, poolState, packetLogText, logFileName);
                    });
                } else if (file.name === 'poolConfig.json' || file.name.includes('poolConfig')) {
                    pendingReads++;
                    self._readJsonFile(file, function(data) {
                        poolConfig = data;
                        pendingReads--;
                        if (pendingReads === 0) self._finishLoad(poolConfig, poolState, packetLogText, logFileName);
                    });
                } else if (file.name === 'poolState.json' || file.name.includes('poolState')) {
                    pendingReads++;
                    self._readJsonFile(file, function(data) {
                        poolState = data;
                        pendingReads--;
                        if (pendingReads === 0) self._finishLoad(poolConfig, poolState, packetLogText, logFileName);
                    });
                }
            }
            
            if (pendingReads === 0) {
                self._setLoadStatus('No matching files found (need .zip, .log, poolConfig.json, poolState.json)');
            }
        },
        _readTextFile: function(file, callback) {
            var reader = new FileReader();
            reader.onload = function(e) {
                callback(e.target.result);
            };
            reader.onerror = function() {
                console.error('Error reading file:', file && file.name);
                callback(null);
            };
            reader.readAsText(file);
        },
        _readJsonFile: function(file, callback) {
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var data = JSON.parse(e.target.result);
                    callback(data);
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    callback(null);
                }
            };
            reader.readAsText(file);
        },
        _handleZipUpload: function(file) {
            var self = this, o = self.options;
            
            if (typeof JSZip === 'undefined') {
                self._setLoadStatus('JSZip library not loaded. Please upload files separately.');
                return;
            }
            
            self._setLoadStatus('Extracting ZIP...');
            
            var reader = new FileReader();
            reader.onload = function(e) {
                JSZip.loadAsync(e.target.result).then(function(zip) {
                    var poolConfig = null;
                    var poolState = null;
                    var packetLog = null;
                    var promises = [];
                    
                    // Find the relevant files in the ZIP
                    zip.forEach(function(relativePath, zipEntry) {
                        var lowerPath = relativePath.toLowerCase();
                        
                        // Look for poolConfig.json
                        if (lowerPath.endsWith('poolconfig.json')) {
                            promises.push(
                                zipEntry.async('string').then(function(content) {
                                    try {
                                        poolConfig = JSON.parse(content);
                                    } catch (err) {
                                        console.error('Error parsing poolConfig.json:', err);
                                    }
                                })
                            );
                        }
                        // Look for poolState.json
                        else if (lowerPath.endsWith('poolstate.json')) {
                            promises.push(
                                zipEntry.async('string').then(function(content) {
                                    try {
                                        poolState = JSON.parse(content);
                                    } catch (err) {
                                        console.error('Error parsing poolState.json:', err);
                                    }
                                })
                            );
                        }
                        // Look for packet log
                        else if (lowerPath.includes('packetlog') && lowerPath.endsWith('.log')) {
                            promises.push(
                                zipEntry.async('string').then(function(content) {
                                    packetLog = content;
                                })
                            );
                        }
                    });
                    
                    // Wait for all files to be extracted
                    Promise.all(promises).then(function() {
                        if (poolConfig || poolState) {
                            var status = [];
                            if (poolConfig) status.push('config');
                            if (poolState) status.push('state');
                            
                            // Parse and load packet log FIRST (before loadReplayData)
                            if (packetLog) {
                                status.push('packetLog');
                                var packets = self._parsePacketLog(packetLog);
                                // Load into Message List so Entity Flow + Message List share the same data
                                self._loadMessagesIntoMessageList(packets, file.name);
                                // Use Message List as the canonical source after loading
                                var msgList = $('div.picMessages:first')[0];
                                if (msgList && msgList.getMessages) {
                                    o.messages = msgList.getMessages();
                                } else {
                                    o.messages = packets;
                                }
                            }
                            
                            // Now load replay data (which populates dropdown and auto-selects)
                            self.loadReplayData(poolConfig, poolState);
                            // Update file status panel (checkboxes)
                            self._updateFileStatusPanel();
                            self._setLoadStatus('');
                            
                            // Auto-refresh timeline
                            self.refresh();
                        } else {
                            self._setLoadStatus('No poolConfig.json or poolState.json found in ZIP');
                        }
                    }).catch(function(err) {
                        console.error('Error extracting ZIP:', err);
                        self._setLoadStatus('Error extracting ZIP');
                    });
                }).catch(function(err) {
                    console.error('Error loading ZIP:', err);
                    self._setLoadStatus('Error loading ZIP file');
                });
            };
            reader.onerror = function() {
                self._setLoadStatus('Error reading ZIP file');
            };
            reader.readAsArrayBuffer(file);
        },
        _parsePacketLog: function(logContent) {
            var self = this, o = self.options;
            var packets = [];
            var lines = logContent.split('\n');
            
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line) continue;
                
                try {
                    var logEntry = JSON.parse(line);
                    
                    // Convert log entry to Message List-compatible message object
                    // Log format: { port, id, valid, dir, proto, for?, pkt: [padding, preamble, header, payload, term], ts }
                    if (logEntry.pkt && logEntry.pkt.length >= 5) {
                        packets.push({
                            isValid: typeof logEntry.valid !== 'undefined' ? logEntry.valid : true,
                            _id: logEntry.id,
                            portId: typeof logEntry.port !== 'undefined' ? logEntry.port : logEntry.portId,
                            responseFor: logEntry.for,
                            protocol: logEntry.proto,
                            direction: logEntry.dir,
                            padding: logEntry.pkt[0] || [],
                            preamble: logEntry.pkt[1] || [],
                            header: logEntry.pkt[2] || [],
                            payload: logEntry.pkt[3] || [],
                            term: logEntry.pkt[4] || [],
                            timestamp: logEntry.ts
                        });
                    } else if (logEntry.pkt && logEntry.pkt.length >= 4) {
                        // Some logs omit term; still load what we can
                        packets.push({
                            isValid: typeof logEntry.valid !== 'undefined' ? logEntry.valid : true,
                            _id: logEntry.id,
                            portId: typeof logEntry.port !== 'undefined' ? logEntry.port : logEntry.portId,
                            responseFor: logEntry.for,
                            protocol: logEntry.proto,
                            direction: logEntry.dir,
                            padding: logEntry.pkt[0] || [],
                            preamble: logEntry.pkt[1] || [],
                            header: logEntry.pkt[2] || [],
                            payload: logEntry.pkt[3] || [],
                            term: [],
                            timestamp: logEntry.ts
                        });
                    }
                } catch (err) {
                    // Skip malformed lines
                    if (i < 5) console.warn('Failed to parse line ' + i + ':', err.message);
                }
            }
            
            return packets;
        },
        _loadMessagesIntoMessageList: function(packets, filename) {
            var self = this, o = self.options;
            var msgList = $('div.picMessages:first')[0];
            if (!msgList) return;
            try {
                // Mirror behavior of Upload Log: stop live logging and pin
                if (msgList.pinSelection) msgList.pinSelection(true);
                if (msgList.logMessages) msgList.logMessages(false);
                if (msgList.clear) msgList.clear();
                for (var i = 0; i < packets.length; i++) {
                    msgList.addBulkMessage(packets[i]);
                }
                if (msgList.commitBulkMessages) msgList.commitBulkMessages();
                // Update the message list title with the loaded filename
                if (filename) {
                    var msgListWidget = $('div.picMessages:first').data('pic-messageList');
                    if (msgListWidget) {
                        msgListWidget.options.loadedFilename = filename;
                        msgListWidget._updateTitle();
                    }
                    // Update the upload button text in the top bar
                    var uploadBtn = $('button.view-bar-upload');
                    if (uploadBtn.length) {
                        uploadBtn.html('<i class="fas fa-folder-open"></i> ' + filename);
                        uploadBtn.attr('title', 'Loaded: ' + filename + ' (click to load new file)');
                    }
                }
            } catch (err) {
                console.error('Failed to load packets into Message List:', err);
            }
        },
        _finishLoad: function(config, state, packetLogText, filename) {
            var self = this, o = self.options;
            if (config || state || packetLogText) {
                if (packetLogText) {
                    var packets = self._parsePacketLog(packetLogText);
                    self._loadMessagesIntoMessageList(packets, filename);
                    var msgList = $('div.picMessages:first')[0];
                    if (msgList && msgList.getMessages) o.messages = msgList.getMessages();
                    else o.messages = packets;
                }
                if (config || state) {
                    self.loadReplayData(config, state);
                }
                // Update file status panel (checkboxes)
                self._updateFileStatusPanel();
                self._setLoadStatus('');
                self.refresh();
            } else {
                self._setLoadStatus('Failed to load files');
            }
        },
        loadReplayData: function(config, state) {
            var self = this, o = self.options;
            o.poolConfig = config;
            o.poolState = state;
            
            // Determine controller type
            if (state && state.equipment && state.equipment.controllerType) {
                o.controllerType = state.equipment.controllerType;
            } else if (config && config.equipment && config.equipment.type) {
                // Fallback to config
                o.controllerType = self._mapEquipmentType(config.equipment.type);
            }
            
            // Update display
            var ctrlText = o.controllerType || 'Unknown';
            if (state && state.equipment && state.equipment.model) {
                ctrlText += ' (' + state.equipment.model + ')';
            }
            if (config && config.equipment && config.equipment.softwareVersion) {
                ctrlText += ' v' + config.equipment.softwareVersion;
            }
            o.controllerDisplay.text(ctrlText);
            
            // Update entity types from config once controller is known
            self._populateEntityTypeDropdown();
            self._emitEntityTypeChanged();
            self._applyModeVisibility();

            // Populate entity dropdown
            self._populateEntityDropdown();
            
            return self;
        },
        _emitEntityTypeChanged: function() {
            var self = this, o = self.options, el = self.element;
            var evt = $.Event('entityTypeChanged');
            evt.mode = o.analysisMode || 'entity';
            if (evt.mode === 'flow') {
                evt.entityType = 'flow';
                evt.flowPresets = Array.isArray(o.selectedFlowPresets) ? o.selectedFlowPresets : [];
                evt.matchers = self._getFlowPresetMatchers();
            } else {
                var typeCfg = self._getSelectedEntityTypeConfig();
                evt.entityType = o.selectedEntityType;
                evt.matchers = (typeCfg && typeCfg.matches) ? typeCfg.matches : [];
            }
            el.trigger(evt);
        },
        _mapEquipmentType: function(typeNum) {
            // Map numeric equipment type to string
            var types = {
                0: 'intellitouch',
                4: 'intellicenter',
                5: 'suntouch',
                13: 'easytouch',
                14: 'intellicom',
                21: 'intellicenter'  // IntelliCenter i10PS
            };
            return types[typeNum] || 'unknown';
        },
        _populateEntityDropdown: function() {
            var self = this, o = self.options;
            var select = o.entitySelect;
            select.empty();
            $('<option value="">-- Select Entity --</option>').appendTo(select);
            
            var entities = self._getEntitiesFromConfig();
            
            for (var i = 0; i < entities.length; i++) {
                var ent = entities[i];
                $('<option></option>')
                    .val(ent.id)
                    .text(ent.id + ' - ' + (ent.name || 'Unnamed'))
                    .appendTo(select);
            }
            
            // Auto-select first entity if we have data and packets
            if (entities.length > 0 && o.messages && o.messages.length > 0) {
                select.val(entities[0].id);
                o.selectedEntityId = entities[0].id;
                // Auto-collapse when first entity is auto-selected
                if (!o.hasAutoCollapsed) {
                    o.hasAutoCollapsed = true;
                    self._toggleSetupPanel(false);
                }
            }
            
            // Sync collapsed dropdowns
            self._syncCollapsedDropdowns();
        },
        _getEntitiesFromConfig: function() {
            var self = this, o = self.options;
            var entities = [];
            
            // Get from poolConfig first, fallback to poolState
            var source = o.poolConfig || o.poolState;
            if (!source) return entities;
            
            if (o.selectedEntityType === 'none') return entities;

            switch (o.selectedEntityType) {
                case 'features':
                    if (source.features && Array.isArray(source.features)) {
                        entities = source.features.filter(function(f) {
                            return f.isActive !== false;
                        }).map(function(f) {
                            return { id: f.id, name: f.name, type: f.type };
                        });
                    }
                    break;
                case 'circuits':
                    if (source.circuits && Array.isArray(source.circuits)) {
                        entities = source.circuits.filter(function(c) {
                            return c.isActive !== false;
                        }).map(function(c) {
                            return { id: c.id, name: c.name, type: c.type };
                        });
                    }
                    break;
                case 'bodies':
                    if (source.bodies && Array.isArray(source.bodies)) {
                        entities = source.bodies.map(function(b) {
                            return { id: b.id, name: b.name, type: b.type };
                        });
                    }
                    break;
                case 'temps':
                    // Temperature sensors are fixed entities
                    entities = [
                        { id: 1, name: 'Water Sensor 1 (Pool)' },
                        { id: 2, name: 'Water Sensor 2 (Spa)' },
                        { id: 3, name: 'Air' },
                        { id: 4, name: 'Solar Sensor 1' }
                    ];
                    // Add more sensors for multi-body systems
                    if (source.bodies && source.bodies.length > 2) {
                        entities.push({ id: 5, name: 'Solar Sensor 2' });
                        entities.push({ id: 6, name: 'Water Sensor 3' });
                    }
                    if (source.bodies && source.bodies.length > 3) {
                        entities.push({ id: 7, name: 'Water Sensor 4' });
                    }
                    break;
                case 'bodySettings':
                    // Body settings for Pool and Spa (bodies 1 and 2)
                    if (source.bodies && Array.isArray(source.bodies)) {
                        // Only include Pool (body 1) and Spa (body 2)
                        entities = source.bodies.filter(function(b) {
                            return b.id === 1 || b.id === 2;
                        }).map(function(b) {
                            return { id: b.id, name: b.name || (b.id === 1 ? 'Pool' : 'Spa') };
                        });
                    }
                    // Fallback if no bodies in config
                    if (entities.length === 0) {
                        entities = [
                            { id: 1, name: 'Pool' },
                            { id: 2, name: 'Spa' }
                        ];
                    }
                    break;
            }
            
            return entities;
        },
        setMessages: function(msgs) {
            var self = this, o = self.options;
            o.messages = msgs || [];
            self.refresh();
            return self;
        },
        refresh: function() {
            var self = this, o = self.options;
            var tbody = o.timelineTable.find('tbody');
            tbody.empty();
            
            var isFlowMode = o.analysisMode === 'flow';
            // Hide/show flow/state timelines based on mode
            if (o.stateTimelineTrack) {
                o.stateTimelineTrack.closest('.state-timeline-wrapper').toggle(isFlowMode || (o.selectedEntityType !== 'none' && !!o.selectedEntityId));
            }
            if (o.flowTimelineTrack) {
                o.flowTimelineTrack.closest('.flow-timeline-wrapper').toggle(isFlowMode || (o.selectedEntityType !== 'none' && !!o.selectedEntityId));
            }
            
            if (isFlowMode) {
                var fp = Array.isArray(o.selectedFlowPresets) ? o.selectedFlowPresets : [];
                o.timelineTitle.text('Flow - ' + (fp.length ? fp.join(', ') : 'all'));
                // Build packets from the currently visible (Message List filtered) packet set
                var allFlowPackets = self._findFlowPackets(true);
                self._buildFlowTimeline(allFlowPackets);
                // Build a generic range timeline (uses state timeline for handles)
                self._buildStateTimeline(allFlowPackets);
                var flowPackets = self._findFlowPackets(false);
                if (flowPackets.length === 0) {
                    var row0 = $('<tr><td colspan="8" class="no-data">No packets found for this flow</td></tr>');
                    tbody.append(row0);
                    o.statusBar.text('0 packets in range (of ' + allFlowPackets.length + ' total)');
                    return;
                }
                for (var fi = 0; fi < flowPackets.length; fi++) {
                    var fp = flowPackets[fi];
                    var rowF = self._buildTimelineRow(fp, null, null);
                    tbody.append(rowF);
                }
                o.statusBar.text(flowPackets.length + ' packets in range (of ' + allFlowPackets.length + ' total)');
                return;
            }

            if (o.selectedEntityType === 'none') {
                o.timelineTitle.text('Select an entity type to begin analysis');
                o.statusBar.text('');
                return;
            }

            if (!o.selectedEntityId) {
                o.timelineTitle.text('Select an entity to view its packet history');
                o.statusBar.text('');
                return;
            }
            
            // Get entity name
            var entities = self._getEntitiesFromConfig();
            var entity = entities.find(function(e) { return e.id === o.selectedEntityId; });
            var entityName = entity ? entity.name : 'Unknown';
            
            o.timelineTitle.text(o.selectedEntityType.charAt(0).toUpperCase() + o.selectedEntityType.slice(1, -1) + 
                ' ' + o.selectedEntityId + ' (' + entityName + ') - Packet History');
            
            // Get ALL relevant packets (unfiltered by range) for the state timeline
            var allRelevantPackets = self._findRelevantPackets(true); // true = ignore range filter
            
            // Build the flow flame graph visualization (uses the same packet axis as state timeline)
            self._buildFlowTimeline(allRelevantPackets);

            // Build the state timeline visualization
            self._buildStateTimeline(allRelevantPackets);
            
            // Get range-filtered packets for the table
            var relevantPackets = self._findRelevantPackets(false); // false = apply range filter
            
            if (relevantPackets.length === 0) {
                var row = $('<tr><td colspan="8" class="no-data">No packets found for this entity</td></tr>');
                tbody.append(row);
                o.statusBar.text('0 packets in range (of ' + allRelevantPackets.length + ' total)');
                return;
            }
            
            // Track state changes for conflict detection
            var lastState = null;
            var lastAuthoritativeState = null;
            
            for (var i = 0; i < relevantPackets.length; i++) {
                var pkt = relevantPackets[i];
                var row = self._buildTimelineRow(pkt, lastState, lastAuthoritativeState);
                tbody.append(row);
                
                // Update state tracking
                lastState = pkt.extractedState;
                if (pkt.isAuthoritative) {
                    lastAuthoritativeState = pkt.extractedState;
                }
            }
            
            o.statusBar.text(relevantPackets.length + ' packets in range (of ' + allRelevantPackets.length + ' total)');
        },
        _findFlowPackets: function(ignoreRange) {
            var self = this, o = self.options;
            var relevant = [];
            if (!o.messages || o.messages.length === 0) return relevant;
            var msgList = $('div.picMessages:first')[0];

            // First pass: collect all matching packets to know total count for range calc
            var allMatching = [];
            for (var i = 0; i < o.messages.length; i++) {
                var msg = o.messages[i];
                if (msgList && msgList.isMessageFiltered && msgList.isMessageFiltered(msg)) continue;
                allMatching.push({ index: i, message: msg });
            }
            var totalCount = allMatching.length;
            var rangeStartIdx = ignoreRange ? 0 : Math.floor(o.rangeStart * totalCount);
            var rangeEndIdx = ignoreRange ? totalCount : Math.ceil(o.rangeEnd * totalCount);

            for (var j = 0; j < allMatching.length; j++) {
                if (!ignoreRange && (j < rangeStartIdx || j >= rangeEndIdx)) continue;
                var msg2 = allMatching[j].message;
                var idx = allMatching[j].index;
                // Flow packets are not entity-extracted; build minimal row model to reuse table + timelines.
                relevant.push({
                    index: idx,
                    rangeIndex: j,
                    message: msg2,
                    extractedState: null,
                    stateType: 'data',
                    heatModeName: null,
                    setpoint: null,
                    coolSetpoint: null,
                    heatMode: null,
                    relevantBytes: null,
                    bitDetails: null,
                    isAuthoritative: false,
                    flags: (msg2 && msg2.isValid === false) ? [{ type: 'warning', text: 'invalid/collision' }] : [],
                    hasEntityData: false,
                    isConfiguredFlowPacket: true
                });
            }
            return relevant;
        },
        _buildFlowTimeline: function(packets) {
            var self = this, o = self.options;
            if (!o.flowTimelineLayers || !o.flowTimelineTrack) return;

            o.flowTimelineLayers.empty();

            if (!packets || packets.length === 0) {
                o.flowTimelineLayers.append('<div class="flow-layer flow-layer-empty">No packets</div>');
                self._updateFlowLegendVisibility(null);
                return;
            }

            // Keep the same range overlay visuals as the State Timeline
            o.flowTimelineTrack.css('--range-start', (o.rangeStart * 100) + '%');
            o.flowTimelineTrack.css('--range-end', (o.rangeEnd * 100) + '%');

            var model = self._computeFlowTimelineModel(packets);
            self._updateFlowLegendVisibility(model);
            self._renderFlowTimelineModel(model, packets.length);
        },
        _updateFlowLegendVisibility: function(model) {
            var self = this, o = self.options;
            if (!o.flowTimelineLegend) return;
            if (!model) {
                // Show nothing except hint when no packets
                o.flowTimelineLegend.find('.legend-item').hide();
                return;
            }
            var hasSweep = model.spans && model.spans.configSweep && model.spans.configSweep.length > 0;
            var hasItem = model.spans && model.spans.configItem && model.spans.configItem.length > 0;
            var hasSet = model.spans && model.spans.setCircuit && model.spans.setCircuit.length > 0;
            var hasB2 = model.ticks && model.ticks.broadcast2 && model.ticks.broadcast2.length > 0;
            var hasB204 = model.ticks && model.ticks.broadcast204 && model.ticks.broadcast204.length > 0;

            o.flowTimelineLegend.find('.legend-config-sweep').toggle(!!hasSweep);
            o.flowTimelineLegend.find('.legend-config-item').toggle(!!hasItem);
            o.flowTimelineLegend.find('.legend-set-circuit').toggle(!!hasSet);
            o.flowTimelineLegend.find('.legend-bcast-2').toggle(!!hasB2);
            o.flowTimelineLegend.find('.legend-bcast-204').toggle(!!hasB204);
        },
        _computeFlowTimelineModel: function(packets) {
            var self = this;

            // The Entity Flow "packet axis" is the visible (Message List filtered) packet list,
            // indexed 0..N-1. We build spans in that same index space so everything lines up.
            var total = packets.length;

            var SWEEP_IDLE_MS = 400;
            var SET_FLOW_WINDOW_MS = 2500;
            var MAX_INCOMPLETE_SPAN_MS = 10000;

            function toMs(ts) {
                if (!ts) return null;
                try {
                    var t = Date.parse(ts);
                    return isNaN(t) ? null : t;
                } catch (e) { return null; }
            }

            // Cache timestamps for fast "timeout end index" lookup.
            var tsCache = new Array(total);
            for (var ti = 0; ti < total; ti++) tsCache[ti] = null;

            function msgAt(i) { return packets[i] && packets[i].message ? packets[i].message : null; }
            function actionAt(i) { return self._extractActionByte(msgAt(i)); }
            function dirAt(i) { var m = msgAt(i); return m ? m.direction : null; }
            function payloadAt(i) { var m = msgAt(i); return (m && Array.isArray(m.payload)) ? m.payload : []; }
            function tsAt(i) {
                if (i < 0 || i >= total) return null;
                if (tsCache[i] !== null || tsCache[i] === 0) return tsCache[i];
                var m = msgAt(i);
                var ms = m ? toMs(m.timestamp) : null;
                tsCache[i] = ms;
                return ms;
            }
            function isConfigRelated(i) {
                var a = actionAt(i);
                if (a === 222 && dirAt(i) === 'out') return true;
                if (a === 30 && dirAt(i) === 'in') return true;
                // Include collisions/invalid frames as context during config runs
                var m = msgAt(i);
                if (m && m.isValid === false) return true;
                return false;
            }

            var configItemSpans = [];
            var configSweepSpans = [];
            var setCircuitSpans = [];
            var broadcast2Ticks = [];
            var broadcast204Ticks = [];

            // Config item tracking: key = "cat,item"
            var openReqByKey = new Map();
            var openReqOrder = []; // [{ key, span }]

            function openReqKeyFromPayload(pl) {
                if (!pl || pl.length < 2) return null;
                return String(pl[0]) + ',' + String(pl[1]);
            }
            function endIndexByTimeout(startIdx, startTsMs, maxMs) {
                if (startTsMs === null) return null;
                var limit = startTsMs + maxMs;
                for (var j = Math.max(0, startIdx); j < total; j++) {
                    var t = tsAt(j);
                    if (t === null) continue;
                    if (t >= limit) return j; // exclusive end index at first ts >= limit
                }
                return null;
            }
            function getOrOpenConfigReq(i) {
                var pl = payloadAt(i);
                var key = openReqKeyFromPayload(pl) || '?,?';
                var existing = openReqByKey.get(key);
                if (existing) {
                    existing.attempts++;
                    existing.lastIdx = i;
                    existing.lastTs = tsAt(i);
                    return existing;
                }
                var span = {
                    kind: 'configItem',
                    key: key,
                    cat: (pl && pl.length > 0) ? pl[0] : null,
                    item: (pl && pl.length > 1) ? pl[1] : null,
                    start: i,
                    end: null, // endExclusive
                    attempts: 1,
                    startTs: tsAt(i),
                    lastIdx: i,
                    lastTs: tsAt(i),
                    matchedBy: null,
                    notes: [],
                    failed: false
                };
                openReqByKey.set(key, span);
                openReqOrder.push({ key: key, span: span });
                return span;
            }
            function closeConfigReq(span, endExclusive, matchInfo) {
                if (!span || span.end !== null) return;
                span.end = endExclusive;
                if (matchInfo) {
                    span.matchedBy = matchInfo.matchedBy || null;
                    if (matchInfo.note) span.notes.push(matchInfo.note);
                }
                configItemSpans.push(span);
                openReqByKey.delete(span.key);
                // Remove from order
                for (var k = 0; k < openReqOrder.length; k++) {
                    if (openReqOrder[k].span === span) { openReqOrder.splice(k, 1); break; }
                }
            }
            function chooseOldestOpenReq() {
                return openReqOrder.length > 0 ? openReqOrder[0].span : null;
            }

            // Config sweep tracking
            var activeSweep = null; // { start, end, startTs, lastIdx, lastTs }
            var lastConfigIdx = null;
            var lastConfigTs = null;

            function ensureSweep(i) {
                if (activeSweep) return;
                activeSweep = { kind: 'configSweep', start: i, end: null, startTs: tsAt(i), lastIdx: i, lastTs: tsAt(i) };
            }
            function markConfigActivity(i) {
                lastConfigIdx = i;
                lastConfigTs = tsAt(i);
                if (activeSweep) {
                    activeSweep.lastIdx = i;
                    activeSweep.lastTs = lastConfigTs;
                }
            }
            function maybeCloseSweep(i) {
                if (!activeSweep) return;
                if (openReqOrder.length > 0) return;
                if (lastConfigIdx === null) return;
                // Close on the first non-config packet after a quiet gap
                if (isConfigRelated(i)) return;
                var nowTs = tsAt(i);
                if (nowTs !== null && lastConfigTs !== null) {
                    if ((nowTs - lastConfigTs) < SWEEP_IDLE_MS) return;
                }
                activeSweep.end = lastConfigIdx + 1; // include last config-related packet
                configSweepSpans.push(activeSweep);
                activeSweep = null;
                lastConfigIdx = null;
                lastConfigTs = null;
            }

            // Set-circuit tracking (168/184 → ACK(1) → 222[15,0] → 30[15,0])
            var openSet = []; // spans
            function openSetSpan(i, cmdAction) {
                openSet.push({
                    kind: 'setCircuit',
                    cmdAction: cmdAction,
                    start: i,
                    end: null,
                    stage: 'sent',
                    sentTs: tsAt(i),
                    ackIdx: null,
                    ackTs: null,
                    stateReqIdx: null,
                    stateReqTs: null,
                    stateRespIdx: null,
                    stateRespTs: null,
                    notes: [],
                    failed: false
                });
            }
            function findLatestOpenSetByStage(stage, cmdAction) {
                for (var s = openSet.length - 1; s >= 0; s--) {
                    var sp = openSet[s];
                    if (sp.end !== null) continue;
                    if (sp.stage !== stage) continue;
                    if (cmdAction !== null && sp.cmdAction !== cmdAction) continue;
                    return sp;
                }
                return null;
            }
            function closeSetSpan(span, endExclusive, note) {
                if (!span || span.end !== null) return;
                span.end = endExclusive;
                if (note) span.notes.push(note);
                setCircuitSpans.push(span);
            }

            for (var i = 0; i < total; i++) {
                var a = actionAt(i);
                var dir = dirAt(i);
                var pl = payloadAt(i);
                var ts = tsAt(i);

                // Broadcast ticks (frequency)
                if (dir === 'in') {
                    if (a === 2) broadcast2Ticks.push({ idx: i });
                    else if (a === 204) broadcast204Ticks.push({ idx: i });
                }

                // Config sweep / items
                if (a === 222 && dir === 'out') {
                    ensureSweep(i);
                    markConfigActivity(i);
                    getOrOpenConfigReq(i);
                } else if (a === 30 && dir === 'in') {
                    // Attempt to match response to an open request
                    markConfigActivity(i);
                    var key = openReqKeyFromPayload(pl);
                    var matched = null;
                    if (key && openReqByKey.has(key)) {
                        matched = openReqByKey.get(key);
                        closeConfigReq(matched, i + 1, { matchedBy: 'payload', note: null });
                    } else if (!key) {
                        if (openReqOrder.length === 1) {
                            matched = openReqOrder[0].span;
                            closeConfigReq(matched, i + 1, { matchedBy: 'single-open', note: 'Matched Action 30 with empty/short payload to the only open request' });
                        } else if (openReqOrder.length > 1) {
                            matched = chooseOldestOpenReq();
                            closeConfigReq(matched, i + 1, { matchedBy: 'ambiguous', note: 'Matched Action 30 with empty/short payload to oldest open request (ambiguous)' });
                        }
                    } else if (key && !openReqByKey.has(key) && openReqOrder.length === 1) {
                        matched = openReqOrder[0].span;
                        closeConfigReq(matched, i + 1, { matchedBy: 'single-open', note: 'Matched Action 30 payload to the only open request (key mismatch)' });
                    } else if (key && openReqOrder.length > 0) {
                        matched = chooseOldestOpenReq();
                        closeConfigReq(matched, i + 1, { matchedBy: 'fallback-oldest', note: 'Matched Action 30 payload to oldest open request (key mismatch)' });
                    }
                } else if (isConfigRelated(i)) {
                    // invalid frames etc
                    markConfigActivity(i);
                }

                // Set flow
                if ((a === 168 || a === 184) && dir === 'out') {
                    openSetSpan(i, a);
                } else if (a === 1 && dir === 'in') {
                    // ACK: payload[0] indicates acked action
                    var acked = (pl && pl.length > 0) ? pl[0] : null;
                    if (acked === 168 || acked === 184) {
                        var spAck = findLatestOpenSetByStage('sent', acked);
                        if (spAck) {
                            spAck.stage = 'acked';
                            spAck.ackIdx = i;
                            spAck.ackTs = ts;
                        }
                    }
                } else if (a === 222 && dir === 'out') {
                    // State read-back request 222[15,0]
                    if (pl && pl.length >= 2 && pl[0] === 15 && pl[1] === 0) {
                        var spReq = findLatestOpenSetByStage('acked', null);
                        if (spReq) {
                            // Only associate if within the set-flow time window
                            if (spReq.ackTs === null || ts === null || (ts - spReq.ackTs) <= SET_FLOW_WINDOW_MS) {
                                spReq.stage = 'stateReq';
                                spReq.stateReqIdx = i;
                                spReq.stateReqTs = ts;
                            }
                        }
                    }
                } else if (a === 30 && dir === 'in') {
                    // State read-back response 30[15,0,...] (authoritative state)
                    if (pl && pl.length >= 2 && pl[0] === 15 && pl[1] === 0) {
                        var spResp = findLatestOpenSetByStage('stateReq', null);
                        if (spResp) {
                            if (spResp.stateReqTs === null || ts === null || (ts - spResp.stateReqTs) <= SET_FLOW_WINDOW_MS) {
                                spResp.stage = 'done';
                                spResp.stateRespIdx = i;
                                spResp.stateRespTs = ts;
                                closeSetSpan(spResp, i + 1, null);
                            }
                        }
                    }
                }

                // Close sweep if appropriate
                if (activeSweep) maybeCloseSweep(i);
            }

            // Finalize open config requests as partial spans
            for (var oi = 0; oi < openReqOrder.length; oi++) {
                var openSpan = openReqOrder[oi].span;
                openSpan.failed = true;
                // Cap incomplete spans to a fixed max duration so they don't smear to end of capture.
                var cap = endIndexByTimeout(openSpan.start, openSpan.startTs, MAX_INCOMPLETE_SPAN_MS);
                openSpan.end = (cap !== null) ? Math.max(openSpan.start + 1, cap) : total;
                openSpan.notes.push('Did not receive a matching Action 30 (timeout ≤ 10s)');
                configItemSpans.push(openSpan);
            }
            openReqByKey.clear();
            openReqOrder = [];

            // Finalize sweep
            if (activeSweep) {
                activeSweep.end = (lastConfigIdx !== null) ? (lastConfigIdx + 1) : total;
                configSweepSpans.push(activeSweep);
            }

            // Finalize set spans not closed
            for (var si = 0; si < openSet.length; si++) {
                var ssp = openSet[si];
                if (ssp.end === null) {
                    ssp.failed = (ssp.stage !== 'done');
                    var baseTs = (ssp.sentTs !== null) ? ssp.sentTs : (ssp.ackTs !== null ? ssp.ackTs : null);
                    var cap2 = endIndexByTimeout(ssp.start, baseTs, MAX_INCOMPLETE_SPAN_MS);
                    ssp.end = (cap2 !== null) ? Math.max(ssp.start + 1, cap2) : total;
                    if (ssp.stage !== 'done') ssp.notes.push('Incomplete set flow (timeout ≤ 10s)');
                    setCircuitSpans.push(ssp);
                }
            }

            return {
                spans: {
                    configSweep: configSweepSpans,
                    configItem: configItemSpans,
                    setCircuit: setCircuitSpans
                },
                ticks: {
                    broadcast2: broadcast2Ticks,
                    broadcast204: broadcast204Ticks
                }
            };
        },
        _renderFlowTimelineModel: function(model, totalPackets) {
            var self = this, o = self.options;
            if (!o.flowTimelineLayers) return;

            function clamp01(x) { return Math.max(0, Math.min(1, x)); }
            function pct(n) { return (n * 100).toFixed(4) + '%'; }

            var ROW_H = 14;
            var ROW_GAP = 2;
            var PAD_Y = 12; // track padding in CSS (top+bottom)

            function setRangeByIndices(startIdx, endExclusive) {
                if (!totalPackets || totalPackets <= 0) return;
                var s = clamp01(startIdx / totalPackets);
                var e = clamp01(endExclusive / totalPackets);
                // Ensure visible range
                if (e - s < 0.01) e = clamp01(s + 0.01);
                o.rangeStart = s;
                o.rangeEnd = e;
                self._updateHandlePositions();
                self._updateHandleTooltips();
                self.refresh();
                self._emitRangeChanged();
            }

            function buildLanes(spans) {
                // Greedy lane packing: each lane holds non-overlapping spans.
                var lanes = [];
                if (!Array.isArray(spans) || spans.length === 0) return lanes;
                var sorted = spans.slice().sort(function(a, b) {
                    if (a.start !== b.start) return a.start - b.start;
                    return (a.end || 0) - (b.end || 0);
                });
                for (var i = 0; i < sorted.length; i++) {
                    var sp = sorted[i];
                    if (!sp || typeof sp.start !== 'number' || typeof sp.end !== 'number') continue;
                    if (sp.end <= sp.start) continue;
                    var placed = false;
                    for (var l = 0; l < lanes.length; l++) {
                        var last = lanes[l].lastEnd;
                        if (sp.start >= last) {
                            lanes[l].spans.push(sp);
                            lanes[l].lastEnd = sp.end;
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) {
                        lanes.push({ lastEnd: sp.end, spans: [sp] });
                    }
                }
                return lanes.map(function(x) { return x.spans; });
            }

            function renderLane(spans, clsBase, titleBuilder) {
                var row = $('<div class="flow-layer-row"></div>');
                for (var i = 0; i < spans.length; i++) {
                    var sp = spans[i];
                    if (typeof sp.start !== 'number' || typeof sp.end !== 'number') continue;
                    if (sp.end <= sp.start) continue;
                    var left = sp.start / totalPackets;
                    var width = (sp.end - sp.start) / totalPackets;
                    var bar = $('<div class="flow-span"></div>');
                    bar.addClass(clsBase);
                    if (sp.notes && sp.notes.length) bar.addClass('flow-span-partial');
                    if (sp.failed) bar.addClass('flow-span-failed');
                    bar.css({ left: pct(left), width: pct(width) });
                    bar.attr('title', titleBuilder(sp));
                    if (sp.failed) {
                        bar.append('<span class="flow-span-x" title="Failed">&times;</span>');
                    }
                    bar.on('click', (function(start, end) {
                        return function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            setRangeByIndices(start, end);
                        };
                    })(sp.start, sp.end));
                    row.append(bar);
                }
                return row;
            }

            // Rows are stacked in a fixed order (bottom -> top)
            var sweep = model.spans.configSweep || [];
            var items = model.spans.configItem || [];
            var sets = model.spans.setCircuit || [];
            var b2 = model.ticks.broadcast2 || [];
            var b204 = model.ticks.broadcast204 || [];

            // Build lanes like a proper flame graph:
            // - bottom: sweep (usually 1 lane)
            // - above: config items (multiple lanes if overlapping)
            // - above: set circuit flows (multiple lanes if overlapping)
            // - top: broadcast ticks
            var itemLanes = buildLanes(items);
            var setLanes = buildLanes(sets);

            // Total row count = 1 sweep + itemLanes + setLanes + 1 ticks
            var rows = 1 + itemLanes.length + setLanes.length + 1;
            var trackH = (rows * ROW_H) + ((rows - 1) * ROW_GAP) + PAD_Y;
            if (o.flowTimelineTrack) o.flowTimelineTrack.css('height', trackH + 'px');
            if (o.flowTimelineTrack && o.flowTimelineTrack.parent()) o.flowTimelineTrack.parent().css('height', trackH + 'px');

            // Append in bottom->top order; CSS uses column-reverse to draw like a flame graph
            // Sweep lane
            o.flowTimelineLayers.append(renderLane(sweep, 'flow-span-config-sweep', function(sp) {
                var dur = (sp.end - sp.start);
                return 'Config sweep: ' + dur + ' packets';
            }));
            // Item lanes
            for (var il = 0; il < itemLanes.length; il++) {
                o.flowTimelineLayers.append(renderLane(itemLanes[il], 'flow-span-config-item', function(sp) {
                    var label = 'Config item: 222 → 30';
                    if (sp.cat !== null && sp.item !== null) label += ' [' + sp.cat + ',' + sp.item + ']';
                    label += ' • ' + sp.attempts + ' attempt(s)';
                    if (sp.notes && sp.notes.length) label += ' • ' + sp.notes.join(' • ');
                    return label;
                }));
            }
            // Set lanes
            for (var sl = 0; sl < setLanes.length; sl++) {
                o.flowTimelineLayers.append(renderLane(setLanes[sl], 'flow-span-set-circuit', function(sp) {
                    var label2 = 'Set circuit: ' + sp.cmdAction + ' → ACK(1) → 222[15,0] → 30[15,0]';
                    if (sp.notes && sp.notes.length) label2 += ' • ' + sp.notes.join(' • ');
                    return label2;
                }));
            }
            // Broadcast ticks lane (top)
            var tickRow = $('<div class="flow-layer-row"></div>');
            for (var t1 = 0; t1 < b2.length; t1++) {
                var left1 = b2[t1].idx / totalPackets;
                var tick1 = $('<div class="flow-tick flow-tick-bcast-2"></div>');
                tick1.css({ left: pct(left1) });
                tick1.attr('title', 'Broadcast Action 2');
                tick1.on('click', (function(idx) {
                    return function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        setRangeByIndices(idx, Math.min(idx + 1, totalPackets));
                    };
                })(b2[t1].idx));
                tickRow.append(tick1);
            }
            for (var t2 = 0; t2 < b204.length; t2++) {
                var left2 = b204[t2].idx / totalPackets;
                var tick2 = $('<div class="flow-tick flow-tick-bcast-204"></div>');
                tick2.css({ left: pct(left2) });
                tick2.attr('title', 'Broadcast Action 204');
                tick2.on('click', (function(idx) {
                    return function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        setRangeByIndices(idx, Math.min(idx + 1, totalPackets));
                    };
                })(b204[t2].idx));
                tickRow.append(tick2);
            }
            o.flowTimelineLayers.append(tickRow);
        },
        _findRelevantPackets: function(ignoreRange) {
            var self = this, o = self.options;
            var relevant = [];
            
            if (!o.messages || o.messages.length === 0) return relevant;

            // In Flow mode, use the dedicated flow packet collector (no entity extraction required).
            if (o.analysisMode === 'flow') return self._findFlowPackets(ignoreRange);
            
            var mapper = self._getEntityMapper();
            var typeCfg = self._getSelectedEntityTypeConfig();
            
            // Get reference to Message List to respect its filter state
            var msgList = $('div.picMessages:first')[0];
            
            // First pass: collect all matching packets to know total count for range calc
            var allMatching = [];
            for (var i = 0; i < o.messages.length; i++) {
                var msg = o.messages[i];
                
                // Respect Message List's filter state (user manual filter changes are source of truth)
                if (msgList && msgList.isMessageFiltered && msgList.isMessageFiltered(msg)) continue;
                
                allMatching.push({ index: i, message: msg });
            }
            
            // Calculate range indices
            var totalCount = allMatching.length;
            var rangeStartIdx = ignoreRange ? 0 : Math.floor(o.rangeStart * totalCount);
            var rangeEndIdx = ignoreRange ? totalCount : Math.ceil(o.rangeEnd * totalCount);
            
            // Second pass: process packets in range
            for (var j = 0; j < allMatching.length; j++) {
                // Skip if outside range (unless ignoreRange)
                if (!ignoreRange && (j < rangeStartIdx || j >= rangeEndIdx)) continue;
                
                var msg = allMatching[j].message;
                var idx = allMatching[j].index;
                
                // Try to extract entity-specific state (may return null for non-entity packets)
                var extraction = null;
                if (mapper && o.selectedEntityId) {
                    var extractOptions = { isV3: self._isV3() };
                    extraction = mapper.extractEntityState(msg, o.selectedEntityType, o.selectedEntityId, extractOptions);
                }
                
                // Include packet even without entity extraction (for debugging/flow analysis)
                var flags = [];
                if (extraction) {
                    flags = extraction.flags || [];
                    self._applyWarnings(flags, msg, typeCfg);
                }
                
                // Check if this packet is part of the configured flow (even without extractable state)
                var isConfiguredFlowPacket = self._matchesEntityTypePacket(msg, typeCfg);
                var isInvalid = msg && msg.isValid === false;

                // To keep the table and timelines usable, only include:
                // - packets with entity extraction
                // - packets matched by the selected entity-type "matches" config (plus base flow matchers)
                // - invalid/collision packets (useful to explain retries)
                if (!extraction && !isConfiguredFlowPacket && !isInvalid) continue;
                
                relevant.push({
                    index: idx,
                    rangeIndex: j,  // Position in full range (for timeline)
                    message: msg,
                    extractedState: extraction ? extraction.state : null,
                    stateType: extraction ? extraction.stateType : 'boolean',
                    heatModeName: extraction ? extraction.heatModeName : null,
                    setpoint: extraction ? extraction.setpoint : null,
                    coolSetpoint: extraction ? extraction.coolSetpoint : null,
                    heatMode: extraction ? extraction.heatMode : null,
                    relevantBytes: extraction ? extraction.bytes : null,
                    bitDetails: extraction ? extraction.bitDetails : null,
                    isAuthoritative: extraction ? extraction.isAuthoritative : false,
                    flags: flags,
                    hasEntityData: !!extraction,
                    isConfiguredFlowPacket: isConfiguredFlowPacket
                });
            }
            
            return relevant;
        },
        _matchesEntityTypePacket: function(msg, typeCfg) {
            var self = this, o = self.options;
            if (!typeCfg || !Array.isArray(typeCfg.matches)) return true;
            var proto = msg.protocol;
            var actionByte = self._extractActionByte(msg);
            var payload0 = (msg.payload && msg.payload.length > 0) ? msg.payload[0] : null;
            for (var i = 0; i < typeCfg.matches.length; i++) {
                var m = typeCfg.matches[i];
                if (m.protocol && m.protocol !== proto) continue;
                if (typeof m.action !== 'undefined' && m.action !== actionByte) continue;
                if (typeof m.payload0 !== 'undefined' && m.payload0 !== payload0) continue;
                return true;
            }
            return false;
        },
        // === State Timeline (Tesla-style traffic view) ===
        _buildStateTimeline: function(packets) {
            var self = this, o = self.options;
            if (!o.stateTimelineSegments) return;
            
            o.stateTimelineSegments.empty();
            
            if (!packets || packets.length === 0) {
                o.stateTimelineSegments.append('<div class="state-segment state-unknown" style="width:100%"></div>');
                self._updateRangeInfo(0, 0);
                return;
            }
            
            // Check if this entity type uses boolean state (ON/OFF) or continuous values (temps)
            var isBoolean = o.selectedEntityType === 'features' || o.selectedEntityType === 'circuits';
            
            if (!isBoolean) {
                // For non-boolean types (temps, bodySettings), show a single "data" segment
                // The timeline still allows range filtering, just no ON/OFF coloring
                var segment = $('<div class="state-segment state-data" style="width:100%"></div>');
                segment.attr('title', packets.length + ' packets with data');
                o.stateTimelineSegments.append(segment);
            } else {
                // Build segments based on state changes
                // Gray = unknown (null), Blue = ON (true), Orange = OFF (false)
                var segments = [];
                var currentState = null;
                var segmentStart = 0;
                
                for (var i = 0; i < packets.length; i++) {
                    var pkt = packets[i];
                    var state = pkt.extractedState; // null, true, or false
                    
                    // Only track entity-relevant packets for state
                    if (!pkt.hasEntityData) continue;
                    
                    if (state !== currentState) {
                        if (i > segmentStart || currentState !== null) {
                            segments.push({
                                state: currentState,
                                start: segmentStart,
                                end: i
                            });
                        }
                        currentState = state;
                        segmentStart = i;
                    }
                }
                
                // Add final segment
                segments.push({
                    state: currentState,
                    start: segmentStart,
                    end: packets.length
                });
                
                // Render segments
                var totalPackets = packets.length;
                for (var j = 0; j < segments.length; j++) {
                    var seg = segments[j];
                    var width = ((seg.end - seg.start) / totalPackets * 100).toFixed(2);
                    var stateClass = 'state-unknown';
                    if (seg.state === true) stateClass = 'state-on';
                    else if (seg.state === false) stateClass = 'state-off';
                    
                    var segment = $('<div class="state-segment ' + stateClass + '"></div>');
                    segment.css('width', width + '%');
                    segment.attr('title', self._getStateLabel(seg.state) + ' (' + (seg.end - seg.start) + ' packets)');
                    o.stateTimelineSegments.append(segment);
                }
            }
            
            // Cache packet info for tooltips
            o.cachedPacketCount = packets.length;
            o.cachedPacketIds = packets.map(function(p) { 
                return p.message && p.message._id ? p.message._id : p.index; 
            });
            
            // Update range handles position
            self._updateHandlePositions();
            self._updateHandleTooltips();
            self._updateRangeInfo(packets.length, packets.length);
        },
        _getStateLabel: function(state, stateType) {
            if (stateType === 'temperature') {
                return state !== null ? state + '°' : 'Unknown';
            }
            if (stateType === 'bodySettings') {
                return state !== null ? state + '°' : 'Unknown';
            }
            // Boolean state
            if (state === true) return 'ON';
            if (state === false) return 'OFF';
            return 'Unknown';
        },
        _setupRangeHandlers: function() {
            var self = this, o = self.options;
            
            // Make handles draggable
            self._makeDraggable(o.rangeHandleStart, 'start');
            self._makeDraggable(o.rangeHandleEnd, 'end');
            
            // Double-click to reset range
            o.stateTimelineTrack.on('dblclick', function() {
                o.rangeStart = 0;
                o.rangeEnd = 1;
                self._updateHandlePositions();
                self.refresh();
                self._emitRangeChanged();
            });
        },
        _makeDraggable: function(handle, type) {
            var self = this, o = self.options;
            var isDragging = false;
            var container = o.stateTimelineTrack.parent();
            
            handle.on('mousedown touchstart', function(e) {
                e.preventDefault();
                isDragging = true;
                handle.addClass('dragging');
                handle.find('.handle-tooltip').addClass('visible');
                
                $(document).on('mousemove.rangeHandle touchmove.rangeHandle', function(e) {
                    if (!isDragging) return;
                    
                    var clientX = e.clientX || (e.originalEvent.touches && e.originalEvent.touches[0].clientX);
                    var rect = container[0].getBoundingClientRect();
                    var pos = (clientX - rect.left) / rect.width;
                    pos = Math.max(0, Math.min(1, pos));
                    
                    if (type === 'start') {
                        // Start handle can't go past end handle
                        o.rangeStart = Math.min(pos, o.rangeEnd - 0.01);
                    } else {
                        // End handle can't go before start handle
                        o.rangeEnd = Math.max(pos, o.rangeStart + 0.01);
                    }
                    
                    self._updateHandlePositions();
                    self._updateHandleTooltips();
                    // Real-time filtering while dragging
                    self.refresh();
                });
                
                $(document).on('mouseup.rangeHandle touchend.rangeHandle', function() {
                    if (isDragging) {
                        isDragging = false;
                        handle.removeClass('dragging');
                        handle.find('.handle-tooltip').removeClass('visible');
                        $(document).off('.rangeHandle');
                        // Emit range change for Message List sync
                        self._emitRangeChanged();
                    }
                });
            });
        },
        _updateHandlePositions: function() {
            var self = this, o = self.options;
            if (!o.rangeHandleStart || !o.rangeHandleEnd) return;
            
            o.rangeHandleStart.css('left', (o.rangeStart * 100) + '%');
            o.rangeHandleEnd.css('left', (o.rangeEnd * 100) + '%');
            
            // Update the selected range overlay
            var track = o.stateTimelineTrack;
            track.css('--range-start', (o.rangeStart * 100) + '%');
            track.css('--range-end', (o.rangeEnd * 100) + '%');
        },
        _updateHandleTooltips: function() {
            var self = this, o = self.options;
            if (!o.cachedPacketCount) return;
            
            var startPkt = Math.floor(o.rangeStart * o.cachedPacketCount);
            var endPkt = Math.ceil(o.rangeEnd * o.cachedPacketCount);
            
            // Get actual packet IDs if available
            var startId = o.cachedPacketIds ? o.cachedPacketIds[startPkt] : startPkt;
            var endId = o.cachedPacketIds ? o.cachedPacketIds[Math.min(endPkt, o.cachedPacketIds.length - 1)] : endPkt;
            
            o.rangeHandleStart.find('.handle-tooltip').text('#' + startId);
            o.rangeHandleEnd.find('.handle-tooltip').text('#' + endId);
        },
        _updateRangeInfo: function(visibleCount, totalCount) {
            var self = this, o = self.options;
            if (!o.rangeInfo) return;
            
            var startPct = Math.round(o.rangeStart * 100);
            var endPct = Math.round(o.rangeEnd * 100);
            
            if (o.rangeStart === 0 && o.rangeEnd === 1) {
                o.rangeInfo.html('<span class="range-full">Full range: ' + totalCount + ' packets</span>');
            } else {
                o.rangeInfo.html('<span class="range-filtered">Range: ' + startPct + '% - ' + endPct + '% (' + visibleCount + ' of ' + totalCount + ' packets)</span>');
            }
        },
        _emitRangeChanged: function() {
            var self = this, o = self.options, el = self.element;
            
            // Emit event so Message List can filter too
            var evt = $.Event('timelineRangeChanged');
            evt.rangeStart = o.rangeStart;
            evt.rangeEnd = o.rangeEnd;
            el.trigger(evt);
            
            // Also directly tell Message List to filter if it supports it
            var msgList = $('div.picMessages:first')[0];
            if (msgList && msgList.setTimelineRange) {
                msgList.setTimelineRange(o.rangeStart, o.rangeEnd, o.messages);
            }
        },
        _applyWarnings: function(flags, msg, typeCfg) {
            var self = this;
            if (!typeCfg || !Array.isArray(typeCfg.warnings)) return;
            var actionByte = self._extractActionByte(msg);
            var version = self._getSoftwareVersion();
            for (var i = 0; i < typeCfg.warnings.length; i++) {
                var w = typeCfg.warnings[i];
                if (!w || !w.when) continue;
                if (typeof w.when.action !== 'undefined' && w.when.action !== actionByte) continue;
                if (typeof w.when.minSoftwareVersion !== 'undefined' && typeof version === 'number' && version < w.when.minSoftwareVersion) continue;
                flags.push({ type: w.type || 'warning', text: w.label || '⚠️ warning' });
            }
        },
        _getSoftwareVersion: function() {
            var self = this, o = self.options;
            var version = null;
            if (o.poolConfig && o.poolConfig.equipment && o.poolConfig.equipment.softwareVersion) version = o.poolConfig.equipment.softwareVersion;
            if (!version && o.poolState && o.poolState.equipment && o.poolState.equipment.softwareVersion) version = o.poolState.equipment.softwareVersion;
            if (!version) return null;
            var n = parseFloat(version);
            return isNaN(n) ? null : n;
        },
        _isV3: function() {
            var version = this._getSoftwareVersion();
            return version !== null && version >= 3.0;
        },
        _extractActionByte: function(msg) {
            try {
                if (typeof msg.action !== 'undefined' && msg.action !== null) return msg.action;
                if (typeof msgManager !== 'undefined' && msgManager.extractActionByte) return msgManager.extractActionByte(msg);
            } catch (e) { /* ignore */ }
            return msg && msg.header && msg.header.length > 4 ? msg.header[4] : null;
        },
        _extractSourceByte: function(msg) {
            try {
                if (typeof msg.source !== 'undefined' && msg.source !== null) return msg.source;
                if (typeof msgManager !== 'undefined' && msgManager.extractSourceByte) return msgManager.extractSourceByte(msg);
            } catch (e) { /* ignore */ }
            return msg && msg.header && msg.header.length > 3 ? msg.header[3] : null;
        },
        _extractDestByte: function(msg) {
            try {
                if (typeof msg.dest !== 'undefined' && msg.dest !== null) return msg.dest;
                if (typeof msgManager !== 'undefined' && msgManager.extractDestByte) return msgManager.extractDestByte(msg);
            } catch (e) { /* ignore */ }
            return msg && msg.header && msg.header.length > 2 ? msg.header[2] : null;
        },
        _extractSubKey: function(actionByte, payload) {
            if (!payload || payload.length === 0) return null;
            // For IntelliCenter, case/subcategory usually lives at payload[0] for 30 and 168
            if (actionByte === 30 || actionByte === 168) return payload[0];
            return null;
        },
        _isIntelliCenterV3: function() {
            var self = this, o = self.options;
            // Check poolConfig or poolState for version
            var version = null;
            
            if (o.poolConfig && o.poolConfig.equipment && o.poolConfig.equipment.softwareVersion) {
                version = o.poolConfig.equipment.softwareVersion;
            } else if (o.poolState && o.poolState.equipment && o.poolState.equipment.softwareVersion) {
                version = o.poolState.equipment.softwareVersion;
            }
            
            if (!version) return false;
            
            // Parse version - v3.004+ has the stale issue
            var versionNum = parseFloat(version);
            return o.controllerType === 'intellicenter' && versionNum >= 3.0;
        },
        _getEntityMapper: function() {
            var self = this, o = self.options;
            
            // Return controller-specific mapper
            switch (o.controllerType) {
                case 'intellicenter':
                    return window.IntelliCenterEntityMapper;
                case 'intellitouch':
                case 'easytouch':
                    return window.IntelliTouchEntityMapper; // Future
                default:
                    // Fallback to IntelliCenter for now
                    return window.IntelliCenterEntityMapper;
            }
        },
        _buildTimelineRow: function(pkt, lastState, lastAuthoritativeState) {
            var self = this, o = self.options;
            var msg = pkt.message;
            
            var row = $('<tr class="timeline-row"></tr>');
            row.attr('data-packet-index', pkt.index);
            row.attr('data-msg-id', msg._id);
            
            // Mark rows without entity-specific data ONLY if they're user-added (not part of configured flow)
            // Configured flow packets (Action 1, 2, etc.) should not be grayed even without extractable state
            if (!pkt.hasEntityData && !pkt.isConfiguredFlowPacket) {
                row.addClass('no-entity-data');
            }
            
            // Time
            var time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '-';
            $('<td class="col-time"></td>').text(time).appendTo(row);
            
            // Packet number
            var pktId = (typeof msg._id !== 'undefined' && msg._id !== null) ? msg._id : (pkt.index + 1);
            var pktCell = $('<td class="col-pkt"></td>').text('#' + pktId).appendTo(row);
            // Keep the timeline index visible for debugging without confusing it with packet id
            pktCell.attr('title', 'Timeline index: ' + (pkt.index + 1));
            
            // Action with tooltip
            var actionByte = self._extractActionByte(msg);
            var subKey = self._extractSubKey(actionByte, msg.payload);
            var actionText = (actionByte !== null && typeof actionByte !== 'undefined') ? actionByte.toString() : '-';
            if (subKey !== null && typeof subKey !== 'undefined') actionText += '/' + subKey;
            var actionDesc = self._getActionDescription(actionByte, subKey);
            var actionCell = $('<td class="col-action"></td>').text(actionText).appendTo(row);
            if (actionDesc) {
                actionCell.attr('title', actionDesc);
            }
            
            // Direction
            var direction = self._getPacketDirection(msg);
            $('<td class="col-direction"></td>').text(direction).appendTo(row);
            
            // State - handle different state types
            var stateText = '-';
            var stateType = pkt.stateType || 'boolean';  // default to boolean for features/circuits
            
            if (pkt.extractedState !== null) {
                if (stateType === 'temperature') {
                    stateText = pkt.extractedState + '°';
                } else if (stateType === 'bodySettings') {
                    // Show setpoint and heat mode
                    stateText = pkt.extractedState + '° ' + (pkt.heatModeName || '');
                } else {
                    // Boolean state (ON/OFF)
                    stateText = pkt.extractedState ? 'ON' : 'OFF';
                }
            }
            var stateCell = $('<td class="col-state"></td>').text(stateText).appendTo(row);
            
            // Highlight state changes
            if (lastState !== null && pkt.extractedState !== lastState) {
                stateCell.addClass('state-changed');
                if (stateType === 'boolean' && pkt.extractedState) {
                    stateCell.addClass('state-on');
                } else if (stateType === 'boolean' && !pkt.extractedState) {
                    stateCell.addClass('state-off');
                }
                // For temps/settings, 'state-changed' class is already added above
            }
            
            // Relevant bytes (hex display)
            var bytesHtml = self._formatRelevantBytes(pkt.relevantBytes);
            $('<td class="col-bytes"></td>').html(bytesHtml).appendTo(row);
            
            // Bit details
            var bitHtml = pkt.bitDetails || '-';
            $('<td class="col-bits"></td>').html(bitHtml).appendTo(row);
            
            // Flags
            var flagsCell = $('<td class="col-flags"></td>').appendTo(row);
            for (var f = 0; f < pkt.flags.length; f++) {
                var flag = pkt.flags[f];
                var flagSpan = $('<span class="flag"></span>').text(flag.text);
                if (flag.type === 'warning') flagSpan.addClass('flag-warning');
                else if (flag.type === 'error') flagSpan.addClass('flag-error');
                else if (flag.type === 'success') flagSpan.addClass('flag-success');
                flagSpan.appendTo(flagsCell);
            }
            
            // Check for conflicts
            if (!pkt.isAuthoritative && lastAuthoritativeState !== null && 
                pkt.extractedState !== null && pkt.extractedState !== lastAuthoritativeState) {
                row.addClass('conflict-row');
                $('<span class="flag flag-error">⚠️ CONFLICT</span>').appendTo(flagsCell);
            }
            
            // Add a "go to packet" link instead of making whole row clickable
            var gotoLink = $('<span class="goto-packet" title="View in Message List"><i class="fas fa-external-link-alt"></i></span>');
            gotoLink.on('click', function(e) {
                e.stopPropagation();
                self._navigateToPacket(pkt.index, pkt.message);
            });
            flagsCell.prepend(gotoLink);
            
            // Row click just highlights, doesn't navigate
            row.on('click', function() {
                // Clear previous selection
                o.timelineTable.find('tr.selected').removeClass('selected');
                $(this).addClass('selected');
            });
            
            return row;
        },
        _getPacketDirection: function(msg) {
            // Determine direction based on source/dest
            var src = this._extractSourceByte(msg);
            var dest = this._extractDestByte(msg);
            
            if (src === null || dest === null) return '-';
            
            // OCP is typically 16, njsPC is typically 33 or 34, Broadcast is 15
            var srcName = this._getDeviceName(src);
            var destName = this._getDeviceName(dest);
            
            return srcName + '→' + destName;
        },
        _getDeviceName: function(addr) {
            // Address mappings from constants.json
            var names = {
                0: 'OCP',           // AquaLink Control Panel
                12: 'Valve',        // IntelliValve
                15: 'Broadcast',    // To whom it may concern
                16: 'OCP',          // Outdoor Control Panel
                17: 'Exp1',         // Expansion Panel 1
                18: 'Exp2',         // Expansion Panel 2
                19: 'Exp3',         // Expansion Panel 3
                32: 'ICP',          // Indoor Control Panel
                33: 'njsPC',        // Default plugin address
                34: 'SL',           // ScreenLogic
                35: 'SL2',          // ScreenLogic2
                36: 'WL',           // IntelliCenter Wireless
                80: 'Chlor[1]',     // Chlorinator #1
                81: 'Chlor[2]',     // Chlorinator #2
                82: 'Chlor[3]',     // Chlorinator #3
                83: 'Chlor[4]',     // Chlorinator #4
                96: 'Pump[1]',      // Pump #1
                97: 'Pump[2]',      // Pump #2
                98: 'Pump[3]',      // Pump #3
                99: 'Pump[4]',      // Pump #4
                100: 'Pump[5]',     // Pump #5
                101: 'Pump[6]',     // Pump #6
                102: 'Pump[7]',     // Pump #7
                103: 'Pump[8]',     // Pump #8
                104: 'Pump[9]',     // Pump #9
                105: 'Pump[10]',    // Pump #10
                106: 'Pump[11]',    // Pump #11
                107: 'Pump[12]',    // Pump #12
                108: 'Pump[13]',    // Pump #13
                109: 'Pump[14]',    // Pump #14
                110: 'Pump[15]',    // Pump #15
                111: 'Pump[16]',    // Pump #16
                144: 'Chem',        // IntelliChem
                160: 'Remote'       // Wireless Remote
            };
            return names[addr] || addr.toString();
        },
        _getActionDescription: function(action, sub) {
            var self = this, o = self.options;
            var cfg = o.entityFlowConfig;
            if (cfg && cfg.actions) {
                var k2 = (sub !== null && typeof sub !== 'undefined') ? (action + '/' + sub) : null;
                if (k2 && cfg.actions[k2]) return cfg.actions[k2];
                if (cfg.actions[action]) return cfg.actions[action];
            }
            return null;
        },
        _formatRelevantBytes: function(bytes) {
            if (!bytes || bytes.length === 0) return '-';
            
            var html = '<span class="byte-display">';
            for (var i = 0; i < bytes.length; i++) {
                var b = bytes[i];
                var hex = '0x' + b.value.toString(16).toUpperCase().padStart(2, '0');
                html += '<span class="byte" title="Byte ' + b.offset + '">';
                html += '<span class="byte-offset">[' + b.offset + ']</span>';
                html += '<span class="byte-value">' + hex + '</span>';
                html += '</span>';
            }
            html += '</span>';
            return html;
        },
        _navigateToPacket: function(index, msg) {
            var self = this, o = self.options, el = self.element;
            
            // Switch to Message List tab first
            var msgListTab = $('button.view-tab[data-view="messages"]');
            if (msgListTab.length) msgListTab.click();
            
            // Trigger event that message list can listen for
            var evt = $.Event('navigateToPacket');
            evt.packetIndex = index;
            evt.message = msg;
            el.trigger(evt);
            
            // Find message list and scroll to the message by its _id
            var messageList = $('div.picMessages');
            if (messageList.length && messageList[0].scrollToMessageById) {
                messageList[0].scrollToMessageById(msg._id);
            }
        },
        getSelectedEntity: function() {
            var self = this, o = self.options;
            return {
                type: o.selectedEntityType,
                id: o.selectedEntityId
            };
        },
        scrollToPacket: function(index, msg) {
            var self = this, o = self.options;
            
            // Find the row in the timeline table that matches this packet index
            var targetRow = null;
            var rows = o.timelineTable.find('tbody tr.timeline-row');
            
            rows.each(function() {
                var rowIndex = parseInt($(this).attr('data-packet-index'), 10);
                if (rowIndex === index) {
                    targetRow = $(this);
                    return false; // break
                }
            });
            
            self._scrollToRow(targetRow, rows);
        },
        scrollToPacketById: function(msgId) {
            var self = this, o = self.options;
            
            console.log('scrollToPacketById called with msgId:', msgId, 'type:', typeof msgId);
            
            // Find the row in the timeline table that matches this message _id
            var targetRow = null;
            var rows = o.timelineTable ? o.timelineTable.find('tbody tr.timeline-row') : $();
            
            console.log('Found rows:', rows.length);
            
            rows.each(function() {
                var rowMsgId = $(this).attr('data-msg-id');
                // Compare as strings to avoid type mismatch
                if (rowMsgId && String(rowMsgId) === String(msgId)) {
                    targetRow = $(this);
                    console.log('Found matching row with data-msg-id:', rowMsgId);
                    return false; // break
                }
            });
            
            if (!targetRow) {
                console.log('No matching row found. First few row IDs:', 
                    rows.slice(0, 5).map(function() { return $(this).attr('data-msg-id'); }).get());
            }
            
            self._scrollToRow(targetRow, rows);
        },
        _scrollToRow: function(targetRow, rows) {
            var self = this, o = self.options;
            
            if (targetRow && targetRow.length) {
                // Scroll to the row
                var wrapper = o.timelineTable.closest('.entity-timeline-table-wrapper');
                if (wrapper.length) {
                    // Calculate row position relative to wrapper
                    var wrapperTop = wrapper.offset().top;
                    var rowOffsetTop = targetRow.offset().top;
                    var rowRelativeTop = rowOffsetTop - wrapperTop + wrapper.scrollTop();
                    var wrapperHeight = wrapper.height();
                    var rowHeight = targetRow.outerHeight();
                    
                    // Center the row in the viewport
                    var targetScroll = rowRelativeTop - (wrapperHeight / 2) + (rowHeight / 2);
                    wrapper.animate({
                        scrollTop: Math.max(0, targetScroll)
                    }, 300);
                }
                
                // Highlight the row
                rows.removeClass('selected flash-highlight');
                targetRow.addClass('selected flash-highlight');
                setTimeout(function() {
                    targetRow.removeClass('flash-highlight');
                }, 2000);
            } else {
                // Row not in current view - show message
                console.log('Packet not found in current Entity Flow view. It may be filtered out or range-limited.');
            }
        }
    });
})(jQuery);

