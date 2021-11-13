(function ($) {
    $.widget('pic.messageDoc', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('messageDoc');
            el[0].bindMessage = function (msg) { return self.bindMessage(msg); };
            //$.getLocalService('/messages/docs/constants', undefined, function (data, status, xhr) {
            //console.log(data);
            o.constants = msgManager.constants;
            var tabs = $('<div class="picTabPanel"></div>');
            console.log('Building controls');
            tabs.appendTo(el);
            tabs.tabBar();
            self._buildMessageTab();
            self._buildPayloadTab();
            tabs[0].selectTabById('tabMessage');
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>');
            btnPnl.appendTo(el);
            var btnApply = $('<div></div>');
            btnApply.appendTo(btnPnl);
            btnApply.actionButton({ text: 'Save Documentation', icon: '<i class="fas fa-save"></i>' });
            btnApply.addClass('disabled');
            btnApply.on('click', function (e) {

            });
            if (typeof o.message !== 'undefined') self.bindMessage(o.message);
            //});
        },
        _buildMessageTab: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabMessage', text: 'Message' };
                var contents = this.addTab(tabObj);
                var divOuter = $('<div class="edit-message-doc"></div>');
                divOuter.appendTo(contents);
                var line = $('<div></div>').appendTo(divOuter);
                var proto = $('<div></div>').appendTo(line).pickList({
                    labelText: 'Protocol', binding: 'protocol',
                    displayColumn: 1,
                    columns: [{ binding: 'name', hidden: true, text: 'Name', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Protocol', style: { whiteSpace: 'nowrap' } }],
                    items: o.constants.protocols,
                    inputAttrs: { style: { width: '7rem' } }, labelAttrs: { style: { width: '4.5rem' } }
                });
                $('<div></div>').appendTo(line).pickList({
                    labelText: 'Type', binding: 'messageType',
                    displayColumn: 0,
                    columns: [{ binding: 'name', hidden: false, text: 'Name', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Message Type', style: { whiteSpace: 'nowrap' } }],
                    items: o.constants.messageTypes,
                    inputAttrs: { style: { width: '7rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
                });
                proto.on('selchanged', function (evt) {
                    var proto = evt.newItem || { name: 'undefined' };
                    switch (proto.name) {
                        case 'chlorinator':
                            self._initChlorinator();
                            break;
                        case 'undefined':
                            el.find('div.edit-message-panel').empty();
                            break;
                        default:
                            self._initBroadcast();
                            break;
                    }
                    console.log(proto);
                    if (proto.controller === false) {
                        el.find('div.picPickList[data-bind=controller]').each(function () {
                            $(this).hide();
                            this.required(false);
                        });
                        el.find('div.picCheckbox[data-bind=ocpSpecific]').each(function () {
                            $(this).hide();
                            this.val(false);
                        });
                    }
                    else {
                        el.find('div.picPickList[data-bind=controller]').each(function () {
                            $(this).show();
                            this.required(true);
                        });
                        el.find('div.picCheckbox[data-bind=ocpSpecific]').each(function () {
                            $(this).show();
                        });
                    }
                    // Set our addresses.
                    var addrs = [];
                    for (var i = 0; i < o.constants.addresses.length; i++) {
                        var addr = o.constants.addresses[i];
                        if (typeof addr.protocol !== 'string') addrs.push(addr);
                        else if (addr.protocol.indexOf('!' + proto.name) !== -1) continue;
                        else if (addr.protocol.indexOf(proto.name) !== -1) addrs.push(addr);
                        else if (addr.protocol.indexOf('any') !== -1) addrs.push(addr);
                    }
                    el.find('div.picPickList[data-bind=source]').each(function () { console.log(addrs); this.items(addrs); });
                    el.find('div.picPickList[data-bind=dest]').each(function () { this.items(addrs); });

                    self._setActions();
                    self._setMessageKey();
                });
                $('<label></label>').addClass('message-doc-key').attr('data-bind', 'messageKey').appendTo(line);
                line = $('<div></div>').appendTo(divOuter).addClass('edit-message-panel');
                line = $('<div></div>').appendTo(divOuter);
                $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: 'name', inputAttrs: { maxlength: 27, style: { width: '14rem' } }, labelAttrs: { style: { width: '4.5rem' } } });
                $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Label', binding: 'shortName', inputAttrs: { maxlength: 27, style: { width: '8rem' } }, labelAttrs: { style: { paddingLeft:'.25rem' } } });
                line = $('<div></div>').appendTo(divOuter);
                $('<div></div>').appendTo(line).inputField({ required: false, multiLine: true, labelText: 'Description', binding: 'desc', inputAttrs: { maxlength: 100, style: { width: '29rem', height: '7rem' } }, labelAttrs: { style: { width: '4.5rem' } } });
            });
        },
        _setActions: function () {
            var self = this, o = self.options, el = self.element;
            // Set our actions
            var div = el.find('div.edit-message-doc');
            var obj = dataBinder.fromElement(div);
            var actions = [];
            var controller = o.constants.controllers.find(elem => elem.val === obj.controller) || { val: 0, name: '', class: '' };
            var proto = o.constants.protocols.find(elem => elem.name === obj.protocol) || { name: 'undefined', actions: {} };
            console.log({ proto: proto, controller: controller });
            if (typeof proto.actions.all !== 'undefined')
                actions.push.apply(actions, proto.actions.all);
            if (typeof proto.actions[controller.class] !== 'undefined')
                actions.push.apply(actions, proto.actions[controller.class]);
            el.find('div.picPickList[data-bind=action]').each(function () { console.log(actions); this.items(actions); });
        },
        _setMessageKey: function () {
            var self = this, o = self.options, el = self.element;
            var div = el.find('div.edit-message-doc');
            var obj = dataBinder.fromElement(div);
            var proto = o.constants.protocols.find(elem => elem.name === obj.protocol) || { name: 'undefined', keyFormat: '' };
            var key = proto.keyFormat;
            var addrSource = o.constants.addresses.find(elem => elem.val === obj.source) || { val:obj.source || 0, key: obj.dest || 0 };
            var addrDest = o.constants.addresses.find(elem => elem.val === obj.dest) || { val: obj.dest || 0, key: obj.dest || 0 };
            var action = obj.action || 0;
            var length = obj.payloadLength || 0;
            var controller = obj.ocpSpecific ? obj.controller : 'P';
            key = key.replace(/\<controller\>/g, controller);
            key = key.replace(/\<source\>/g, addrSource.key);
            key = key.replace(/\<dest\>/g, addrDest.key);
            key = key.replace(/\<action\>/g, action);
            key = key.replace(/\<length\>/g, length);
            el.find('label.message-doc-key').text(key);
        },
        _initChlorinator: function () {
            var self = this, o = self.options, el = self.element;
            var div = el.find('div.edit-message-panel');
            if (div.attr('data-paneltype') === 'chlorinator') return;
            div.attr('data-paneltype', 'chlorinator');
            div.empty();
            var line = $('<div></div>').appendTo(div);
            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Dest', binding: 'dest',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Address', style: { whiteSpace: 'nowrap' } }],
                items: o.constants.addresses,
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '4.5rem' } }
            }).on('changed', function (evt) {
                self._setMessageKey();
            });
            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Action', binding: 'action',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Action', style: { whiteSpace: 'nowrap' } }],
                items: [],
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '2.7rem', paddingLeft: '.25rem' } }
            }).on('changed', function (evt) {
                self._setMessageKey();
            });

        },
        _initBroadcast: function () {
            var self = this, o = self.options, el = self.element;
            var div = el.find('div.edit-message-panel');
            if (div.attr('data-paneltype') === 'broadcast') return;
            div.attr('data-paneltype', 'broadcast');
            div.empty();
            var line = $('<div></div>').appendTo(div);
            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Controller', binding: 'controller',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Controller', style: { whiteSpace: 'nowrap' } }],
                items: o.constants.controllers,
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '4.5rem' } }
            }).on('changed', function (evt) {
                self._setActions();
                self._setMessageKey();
            });
            $('<div></div>').appendTo(line).checkbox({
                labelText: 'Controller Specific', binding: 'ocpSpecific'
            }).on('changed', function (evt) {
                self._setMessageKey();
            });
            line = $('<div></div>').appendTo(div);
            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Source', binding: 'source',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Address', style: { whiteSpace: 'nowrap' } }],
                items: o.constants.addresses,
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '4.5rem' } }
            }).on('changed', function (evt) {
                self._setMessageKey();
            });

            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Dest', binding: 'dest',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Address', style: { whiteSpace: 'nowrap' } }],
                items: o.constants.addresses,
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '2.7rem', paddingLeft: '.25rem' } }
            }).on('changed', function (evt) {
                self._setMessageKey();
            });
            $('<div></div>').appendTo(line).pickList({
                canEdit: true,
                dataType: 'int',
                labelText: 'Action', binding: 'action',
                displayColumn: 1,
                columns: [{ binding: 'val', hidden: false, text: 'byte', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Action', style: { whiteSpace: 'nowrap' } }],
                items: [],
                inputAttrs: { maxlength: 3, style: { width: '2.25rem' } }, labelAttrs: { style: { width: '2.7rem', paddingLeft: '.25rem' } }
            }).on('changed', function (evt) {
                self._setMessageKey();
            });
        },
        _buildPayloadTab: function () {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabPanel:first').each(function () {
                var tabObj = { id: 'tabPayload', text: 'Payload' };
                var contents = this.addTab(tabObj);
                var divOuter = $('<div class="picPayload"></div>');
                divOuter.appendTo(contents);
            });
        },
        bindMessage: function (msg) {
            var self = this, o = self.options, el = self.element;
            console.log(msg);
            if (typeof msg === 'string') {
                $.getLocalService('/messages/docs/' + msg, undefined, function (data, status, xhr) {
                    console.log(data);
                    self.bindMessage(data);
                });
            }
            else {
                dataBinder.bind(el, msg);
            }
            //[255, 0, 255][166, 1, 176, 12, 103, 1][0][1, 203]
            //[255, 0, 255][165, 1,  16, 12,  82, 8][0, 128, 216, 128, 57, 64, 25, 166][4, 44]
        }

    });
})(jQuery);
