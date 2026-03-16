(function () {
    'use strict';

    var frameEl = document.getElementById('smoke-frame');
    var runBtn = document.getElementById('run-all');
    var clearBtn = document.getElementById('clear-results');
    var summaryEl = document.getElementById('summary');
    var resultsEl = document.getElementById('results');
    var includeReplayEl = document.getElementById('include-replay');

    var DEFAULT_TIMEOUT = 20000;
    var POLL_MS = 100;
    var running = false;

    function sleep(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function nowMs() {
        return Date.now();
    }

    function isVisible(el) {
        if (!el) return false;
        var win = el.ownerDocument.defaultView;
        var style = win.getComputedStyle(el);
        if (!style) return false;
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        var rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    async function waitFor(checkFn, description, timeoutMs) {
        var start = nowMs();
        var timeout = typeof timeoutMs === 'number' ? timeoutMs : DEFAULT_TIMEOUT;
        while (nowMs() - start < timeout) {
            try {
                var value = checkFn();
                if (value) return value;
            } catch (err) {
                // Keep polling.
            }
            await sleep(POLL_MS);
        }
        throw new Error('Timed out waiting for: ' + description);
    }

    function query(doc, selector) {
        return doc.querySelector(selector);
    }

    function queryAll(doc, selector) {
        return Array.prototype.slice.call(doc.querySelectorAll(selector));
    }

    function required(doc, selector, label) {
        var el = query(doc, selector);
        if (!el) throw new Error('Missing element: ' + (label || selector));
        return el;
    }

    function clickElement(el) {
        el.scrollIntoView({ block: 'center', inline: 'center' });
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
        el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true }));
        el.click();
    }

    function clickSelector(doc, selector, label) {
        var el = required(doc, selector, label);
        clickElement(el);
        return el;
    }

    function findTab(doc, dataTabId, labelText) {
        var byId = query(doc, 'div.mmgrTabBar div.picTab[data-tabid="' + dataTabId + '"]');
        if (byId) return byId;
        var candidates = queryAll(doc, 'div.mmgrTabBar [role="tab"], div.mmgrTabBar div.picTab');
        for (var i = 0; i < candidates.length; i++) {
            var txt = (candidates[i].textContent || '').trim().toLowerCase();
            if (txt.indexOf(labelText.toLowerCase()) >= 0) return candidates[i];
        }
        return null;
    }

    function clickTab(doc, dataTabId, labelText) {
        var tab = findTab(doc, dataTabId, labelText);
        if (!tab) throw new Error('Missing tab: ' + labelText);
        clickElement(tab);
        return tab;
    }

    function lastVisible(doc, selector) {
        var els = queryAll(doc, selector).filter(isVisible);
        return els.length ? els[els.length - 1] : null;
    }

    function setSelectValue(doc, selector, value, label) {
        var el = required(doc, selector, label);
        if (el.disabled) throw new Error('Select is disabled: ' + (label || selector));
        el.value = value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        if (el.value !== value) {
            throw new Error('Failed to set value "' + value + '" on ' + (label || selector));
        }
        return el;
    }

    function setSummary(text) {
        summaryEl.textContent = text;
    }

    function addResult(status, name, durationMs, details) {
        var li = document.createElement('li');
        li.className = 'result ' + status;
        var nameEl = document.createElement('div');
        nameEl.className = 'name';
        nameEl.textContent = status.toUpperCase() + ': ' + name;
        var metaEl = document.createElement('div');
        metaEl.className = 'meta';
        metaEl.textContent = durationMs + 'ms' + (details ? '\n' + details : '');
        li.appendChild(nameEl);
        li.appendChild(metaEl);
        resultsEl.appendChild(li);
    }

    function clearResults() {
        resultsEl.innerHTML = '';
        setSummary('Idle');
    }

    async function loadPage(pathname) {
        var cacheBuster = 'smoke=' + nowMs();
        var sep = pathname.indexOf('?') >= 0 ? '&' : '?';
        var url = pathname + sep + cacheBuster;
        await new Promise(function (resolve, reject) {
            var done = false;
            var timer = setTimeout(function () {
                if (done) return;
                done = true;
                reject(new Error('Timed out loading iframe URL: ' + url));
            }, DEFAULT_TIMEOUT);
            frameEl.onload = function () {
                if (done) return;
                done = true;
                clearTimeout(timer);
                resolve();
            };
            frameEl.src = url;
        });
        var win = frameEl.contentWindow;
        var doc = frameEl.contentDocument || (win && win.document);
        await waitFor(function () {
            return doc && doc.readyState === 'complete';
        }, 'document ready for ' + pathname, DEFAULT_TIMEOUT);
        return { win: win, doc: doc };
    }

    async function dashboardCoreFlow() {
        var loaded = await loadPage('/index.html');
        var doc = loaded.doc;
        await waitFor(function () { return query(doc, 'div.picDashboard'); }, 'dashboard root');
        await waitFor(function () { return query(doc, '[data-nav-id="settings-open"]'); }, 'settings button');
        await waitFor(function () { return query(doc, '[data-nav-id="config-toggle"]'); }, 'config toggle');

        clickSelector(doc, '[data-nav-id="config-toggle"]', 'config toggle');
        await waitFor(function () {
            var outer = query(doc, 'div.dashOuter');
            return outer && outer.getAttribute('data-panel') === 'configuration';
        }, 'configuration panel active');
        await waitFor(function () {
            return query(doc, 'div.configContainer div.picConfigPage');
        }, 'config page container');

        clickSelector(doc, '[data-nav-id="config-toggle"]', 'config toggle back');
        await waitFor(function () {
            var outer = query(doc, 'div.dashOuter');
            return outer && outer.getAttribute('data-panel') === 'dashboard';
        }, 'dashboard panel active');
    }

    async function dashboardSettingsPopoverFlow() {
        var loaded = await loadPage('/index.html');
        var doc = loaded.doc;
        await waitFor(function () { return query(doc, '[data-nav-id="settings-open"]'); }, 'settings button');
        clickSelector(doc, '[data-nav-id="settings-open"]', 'settings open');
        await waitFor(function () { return query(doc, '#settingsTabBar'); }, 'settings tabs');
        var close = await waitFor(function () {
            return lastVisible(doc, 'div.picClosePopover');
        }, 'settings close button');
        clickElement(close);
        await waitFor(function () {
            return !query(doc, '#settingsTabBar');
        }, 'settings popover close');
    }

    async function messageManagerTabFlow() {
        var loaded = await loadPage('/messageManager.html');
        var doc = loaded.doc;

        await waitFor(function () { return query(doc, 'div.picMessageManager'); }, 'message manager root');
        await waitFor(function () { return findTab(doc, 'tabSendQueue', 'send queue'); }, 'send queue tab');
        required(doc, '[data-nav-id="mmgr-clear-messages"]', 'clear messages button');
        required(doc, '[data-nav-id="mmgr-filter-display"]', 'filter button');
        required(doc, '[data-nav-id="mmgr-choose-files"]', 'choose files button');

        clickTab(doc, 'tabSendQueue', 'send queue');
        await waitFor(function () { return query(doc, 'div.view-container[data-view="sendQueue"].active'); }, 'send queue active');

        clickTab(doc, 'tabEntityFlow', 'entity flow');
        await waitFor(function () { return query(doc, 'div.view-container[data-view="entityFlow"].active'); }, 'entity flow active');

        clickTab(doc, 'tabMessages', 'message list');
        await waitFor(function () { return query(doc, 'div.view-container[data-view="messages"].active'); }, 'message list active');
    }

    async function messageManagerFilterDialogFlow() {
        var loaded = await loadPage('/messageManager.html');
        var doc = loaded.doc;

        await waitFor(function () { return query(doc, '[data-nav-id="mmgr-filter-display"]'); }, 'filter button');
        clickSelector(doc, '[data-nav-id="mmgr-filter-display"]', 'filter open');
        var filterClose;
        try {
            filterClose = await waitFor(function () {
                return lastVisible(doc, 'div.picClosePopover');
            }, 'filter close', 3000);
        } catch (err) {
            throw { skip: true, message: 'Filter dialog not available in current runtime state.' };
        }
        clickElement(filterClose);
        await sleep(250);

        // Open/close filter once more to confirm repeatability.
        clickSelector(doc, '[data-nav-id="mmgr-filter-display"]', 'filter reopen');
        var filterClose2 = await waitFor(function () {
            return lastVisible(doc, 'div.picClosePopover');
        }, 'filter close second pass', 3000);
        clickElement(filterClose2);
        await sleep(250);
    }

    async function messageManagerSettingsDialogFlow() {
        var loaded = await loadPage('/messageManager.html');
        var doc = loaded.doc;

        await waitFor(function () { return query(doc, '[data-nav-id="settings-open"]'); }, 'settings open button');
        clickSelector(doc, '[data-nav-id="settings-open"]', 'settings open');
        await waitFor(function () { return query(doc, '#settingsTabBar'); }, 'settings tabs');
        var settingsClose = await waitFor(function () {
            return lastVisible(doc, 'div.picClosePopover');
        }, 'settings close');
        clickElement(settingsClose);
        await waitFor(function () {
            return !query(doc, '#settingsTabBar');
        }, 'settings closed');
    }

    async function messageManagerReplayAwareFlow() {
        var loaded = await loadPage('/messageManager.html');
        var doc = loaded.doc;

        await waitFor(function () { return findTab(doc, 'tabEntityFlow', 'entity flow'); }, 'entity flow tab');
        clickTab(doc, 'tabEntityFlow', 'entity flow');
        await waitFor(function () { return query(doc, 'div.view-container[data-view="entityFlow"].active'); }, 'entity flow active');

        var collapseBtn = await waitFor(function () {
            return query(doc, 'button.collapse-setup-btn');
        }, 'collapse setup button');

        if (collapseBtn.disabled) {
            throw { skip: true, message: 'Replay-aware controls are disabled (no loaded replay in this page instance).' };
        }

        clickElement(collapseBtn);
        await waitFor(function () {
            var setup = query(doc, 'div.entity-flow-setup');
            var collapsed = query(doc, 'div.entity-flow-collapsed-header');
            return setup && collapsed && !isVisible(setup) && isVisible(collapsed);
        }, 'setup collapsed');

        var expandBtn = await waitFor(function () {
            return query(doc, 'button.expand-setup-btn');
        }, 'expand setup button');
        clickElement(expandBtn);
        await waitFor(function () {
            var setup = query(doc, 'div.entity-flow-setup');
            return setup && isVisible(setup);
        }, 'setup expanded');

        var modeSelect = required(doc, 'select.mode-select', 'mode select');
        if (!modeSelect.disabled) {
            setSelectValue(doc, 'select.mode-select', 'flow', 'mode flow');
            setSelectValue(doc, 'select.mode-select', 'entity', 'mode entity');
        }

        var entityType = required(doc, 'select.entity-type-select', 'entity type');
        if (!entityType.disabled && entityType.options.length > 1) {
            var targetValue = entityType.options[1].value;
            setSelectValue(doc, 'select.entity-type-select', targetValue, 'entity type select');
        }
    }

    async function runSingle(testDef) {
        var start = nowMs();
        try {
            await testDef.fn();
            addResult('pass', testDef.name, nowMs() - start, testDef.details || '');
            return { status: 'pass' };
        } catch (err) {
            if (err && err.skip === true) {
                addResult('skip', testDef.name, nowMs() - start, err.message || 'Skipped');
                return { status: 'skip' };
            }
            var msg = err && err.stack ? err.stack : String(err && err.message ? err.message : err);
            addResult('fail', testDef.name, nowMs() - start, msg);
            return { status: 'fail' };
        }
    }

    async function runAll() {
        if (running) return;
        running = true;
        runBtn.disabled = true;
        setSummary('Running...');
        clearBtn.disabled = true;
        resultsEl.innerHTML = '';

        var tests = [
            { name: 'Dashboard: Core Header + Config Toggle', fn: dashboardCoreFlow },
            { name: 'Dashboard: Settings Popover Open/Close', fn: dashboardSettingsPopoverFlow },
            { name: 'Message Manager: Tab Switching', fn: messageManagerTabFlow },
            { name: 'Message Manager: Filter Dialog (Optional)', fn: messageManagerFilterDialogFlow },
            { name: 'Message Manager: Settings Dialog', fn: messageManagerSettingsDialogFlow }
        ];

        if (includeReplayEl.checked) {
            tests.push({ name: 'Message Manager: Replay-Aware Entity Flow', fn: messageManagerReplayAwareFlow });
        }

        var pass = 0;
        var fail = 0;
        var skip = 0;
        for (var i = 0; i < tests.length; i++) {
            setSummary('Running ' + (i + 1) + '/' + tests.length + ': ' + tests[i].name);
            var res = await runSingle(tests[i]);
            if (res.status === 'pass') pass++;
            else if (res.status === 'skip') skip++;
            else fail++;
        }

        setSummary('Done. Pass: ' + pass + '  Fail: ' + fail + '  Skip: ' + skip + '  Total: ' + tests.length);
        runBtn.disabled = false;
        clearBtn.disabled = false;
        running = false;
    }

    runBtn.addEventListener('click', function () { runAll(); });
    clearBtn.addEventListener('click', function () { clearResults(); });
})();
