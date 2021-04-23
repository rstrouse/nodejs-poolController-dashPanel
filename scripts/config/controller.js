(function ($) {
    $.widget('pic.configInterfaces', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgInterfaces');
            pnl = $('<div></div>').addClass('cfgInterfaces').appendTo(el);
            $.getApiService('/app/options/interfaces', null, function (opts, status, xhr) {
                console.log(opts);
                for (var i in opts.interfaces) {
                    $('<div></div>').appendTo(pnl).pnlInterfaces(opts)[0].dataBind(opts.interfaces[i], i);
                }
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                var btnAdd = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Add Interface', icon: '<i class="fas fa-plus" ></i>' });
                btnAdd.on('click', function (e) {
                    console.log(`implement me`)
                });
            });

        }
    });


    $.widget('pic.pnlInterfaces', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            el.addClass('picAppCategory cfgAppInterfaces');
            var binding = '';
            var acc = $('<div></div>').appendTo(el).accordian({
                columns: [{ binding: 'name', glyph: 'fas fa-flask', style: { width: '14rem' } },
                { binding: 'type', glyph: '', style: {} }]
            });

            var pnl = acc.find('div.picAccordian-contents');
            var line = $('<div></div>').appendTo(pnl);
            $('<input type="hidden" data-datatype="string"></input>').attr('data-bind', 'uuid').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 32 }, labelAttrs: { style: {} } });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 0, labelText: 'Type', binding: binding + 'type',
                columns: [{ binding: 'name', hidden: true, text: 'Code', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Type', style: { whiteSpace: 'nowrap' } }],
                items: o.types, inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Enabled', binding: 'enabled' });


            var grpConnection = $('<fieldset></fieldset>').css({ display: 'inline-block', verticalAlign: 'top' }).appendTo(pnl);
            $('<legend></legend>').text('Connection').appendTo(grpConnection);
            line = $('<div></div>').appendTo(grpConnection);
            $('<div></div>').appendTo(line).pickList({
                binding: binding + 'options.protocol',
                bindColumn: 1, displayColumn: 2,
                labelText: 'Protocol',
                columns: [{ binding: 'val', text: 'val', hidden: true }, { binding: 'name', text: 'name', hidden: true }, { binding: 'desc', text: 'Protocol Type', style: { whiteSpace: 'nowrap' } }],
                items: o.protocols,
                inputAttrs: { style: { width: '4rem' } },
                labelAttrs: { style: { marginLeft: '.25rem' } }
            });
            // $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Host', binding: 'options.host', inputAttrs: { maxlength: 16 }, labelAttrs: { style: {} } });
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Port', binding: 'options.port', inputAttrs: { maxlength: 5 }, labelAttrs: { style: {} } });
            var btnPnl = $('<div class="picBtnPanel btn-panel findButton"></div>');
            btnPnl.appendTo(grpConnection);


            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Find REM Controllers', icon: '<i class="fas fa-binoculars"></i>' })
                .on('click', function (e) {
                    var dlg = $.pic.modalDialog.createDialog('dlgFindREMServer', {
                        message: 'Searching for Controllers',
                        width: '400px',
                        height: 'auto',
                        title: 'Find REM Controller',
                        buttons: [{
                            text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                            click: function () { $.pic.modalDialog.closeDialog(this); }
                        }]
                    });
                    var line = $('<div></div>').appendTo(dlg);
                    var searchStatus = $('<div></div>').appendTo(line).css({ padding: '.5rem' }).addClass('status-text').addClass('picSearchStatus').text('Searching for running REM servers.');
                    line = $('<div></div>').appendTo(dlg);
                    $('<hr></hr>').appendTo(line);
                    line = $('<div></div>').css({ textAlign: 'center' }).appendTo(dlg);
                    dlg.css({ overflow: 'visible' });

                    $.getLocalService('/config/findREMControllers', null, 'Searching for Servers...', function (servers, status, xhr) {
                        if (servers.length > 0) {
                            searchStatus.text(servers.length + ' Running REM server(s) found.');
                            for (var i = 0; i < servers.length; i++) {
                                var server = servers[i];
                                var divSelection = $('<div></div>').addClass('picButton').addClass('REM').addClass('server').addClass('btn').css({ maxWidth: '227px', height: '97px', verticalAlign: 'middle', minWidth: '210px' }).appendTo(line);
                                $('<div></div>').addClass('body-text').css({ textAlign: 'center' }).appendTo(divSelection).append('<i class="fab fa-node-js" style="font-size:30pt;color:green;vertical-align:middle;"></i>').append('<span style="vertical-align:middle;"> REM Controller</span>');
                                $('<div></div>').css({ textAlign: 'center', marginLeft: '1rem', marginRight: '1rem' }).appendTo(divSelection).text(server.origin);
                                divSelection.data('server', server);
                                divSelection.on('click', function (e) {
                                    var srv = $(e.currentTarget).data('server');
                                    dataBinder.bind(grpConnection, { options: { host: srv.hostname, port: srv.port, protocol: srv.protocol + '//' } });

                                    $.pic.modalDialog.closeDialog(dlg[0]);
                                });
                            }
                        }
                        else {
                            searchStatus.text('No running REM servers could be found.  Enable SSDP on the REM application configuration.');
                        }
                    });
                });

            $('<hr></hr>').appendTo(pnl);
            $('<div></div>').appendTo(pnl).addClass('pnl-appSettings-type');

            btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
            var btnSave = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Interface', icon: '<i class="fas fa-save"></i>' });
            btnSave.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                console.log(o.interfaces);
                var iface = {}; // capture any items not data bound
                for (var i in o.interfaces) {
                    if (o.interfaces[i].uuid === v.uuid) {
                        iface = o.interfaces[i];
                        break;
                    }
                }
                iface = $.extend(true, iface, v);
                console.log(v);
                if (dataBinder.checkRequired(p)) {
                    $.putApiService('/app/interface', iface, 'Saving interface...', function (c, status, xhr) {
                        self.dataBind(c);
                    });
                }
            });
            var btnDelete = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Delete Interface', icon: '<i class="fas fa-trash"></i>' });
            btnDelete.on('click', function (e) {
                var p = $(e.target).parents('div.picAccordian-contents:first');
                var v = dataBinder.fromElement(p);
                $.pic.modalDialog.createConfirm('dlgConfirmDeleteController', {
                    message: 'Are you sure you want to delete controller ' + v.name + '?',
                    width: '350px',
                    height: 'auto',
                    title: 'Confirm Delete Controller',
                    buttons: [{
                        text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                        click: function () {
                            $.pic.modalDialog.closeDialog(this);
                            if (v.id <= 0) p.parents('div.picConfigCategory.cfgChemController:first').remove();
                            else {
                                $.deleteApiService('/config/chemController', v, 'Deleting Chem Controller...', function (c, status, xhr) {
                                    p.parents('div.picConfigCategory.cfgChemController:first').remove();
                                });
                            }
                        }
                    },
                    {
                        text: 'No', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }]
                });
            });

        },
        dataBind: function (obj) {
            var self = this, o = self.options, el = self.element;
            var acc = el.find('div.picAccordian:first');
            var cols = acc[0].columns();
            cols[0].elText().text(obj.name);
            var type = o.types.find(elem => elem.name === obj.type);
            cols[1].elText().text(typeof type !== 'undefined' ? type.desc : 'Interface');

            if (typeof obj.type !== 'undefined' && obj.type === 'rem') {
                el.find('div.findButton').show();
            }
            else {
                el.find('div.findButton').hide();
            }
            dataBinder.bind(el, obj);
        }
    });
})(jQuery);
(function ($) {  // Controller Type display.
    $.widget('pic.configControllerType', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgControllerType');
            // Alright so now we need to allow the user to select a controller type but only if we are a 
            $.getApiService('/config/options/controllerType', null, function (opts, status, xhr) {
                console.log(opts);
                var type = opts.controllerTypes.find(elem => elem.type === opts.controllerType);
                var model = type.models.find(elem => elem.val === opts.equipment.modules[0].type);
                var line = $('<div></div>').appendTo(el);
                console.log(type);
                $('<input type="hidden" data-bind="controllerType"></input>').appendTo(line).val(opts.controllerType);
                $('<div></div>').staticField({ labelText: `Panel Type`, value: type.name }).appendTo(line);
                $('<div></div>').pickList({
                    required: true, value: opts.equipment.modules[0].type,
                    bindColumn: 0, displayColumn: 2, labelText: 'Model', binding: 'model',
                    columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: false, text: 'Model', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Description', style: { whiteSpace: 'nowrap' } }],
                    items: type.models, inputAttrs: { style: { width: '9.7rem' } }, labelAttrs: { style: { marginLeft: '1rem' } }
                }).appendTo(line).on('selchanged', function (evt) {
                    self._setModelAttributes(evt.newItem);

                })[0].disabled(!makeBool(type.canChange));
                $('<div></div>').appendTo(el).addClass('ct-narrative');
                self._setModelAttributes(model);
                if (type.canChange) {
                    btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                    var btnSave = $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Model', icon: '<i class="fas fa-save"></i>' });
                    btnSave.on('click', function (e) {
                        var v = dataBinder.fromElement(el);
                        console.log(v);
                        if (dataBinder.checkRequired(el)) {
                            $.putApiService('/config/controllerType', v, 'Saving Controller Type...', function (c, status, xhr) {
                                
                            });
                        }
                    });
                }
            });
        },
        _setModelAttributes: function(model) {
            var self = this, o = self.options, el = self.element;
            var narr = el.find('div.ct-narrative');
            narr.empty();
            var bdy = model.shared || model.dual ? 'dual' : model.bodies === 0 ? 'zero' : 'single';
            $('<div></div>').appendTo(narr).html(`The ${model.desc} controller is a ${bdy} body controller.`);
            $('<hr></hr>').appendTo(narr);
            switch (bdy) {
                case 'zero':
                    $('<div></div>').appendTo(narr).html(`Zero body controllers provide no control over body features or filters.  As a result, features such as heaters, water temperature, and chemistry controllers are not defined for this type of controller.`);
                    break;
                case 'single':
                    $('<div></div>').appendTo(narr).html(`Single body controllers are capable of controlling only a single body of water.  For instance a stand-alone pool or spa.`);
                    break;
                case 'dual':
                    if (model.shared) {
                        $('<div></div>').appendTo(narr).html(`This controller is capable of controlling two bodies of water in a shared mode.  This gives you the capability of controlling a pool/spa, pool/pool, or spa/spa combination where there is shared equipment.  An intake and return valve is used to redirect the water through a single filter to the appropriate body depending on which mode is selected.`);
                    }
                    else {
                        $('<div></div>').appendTo(narr).html(`This controller is capable of controlling two bodies of water separately.  The bodies are separate and use their own filtration system and pumps.`);
                    }
                    break;
            }

        }

    });
    $.widget('pic.configRS485', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (obj) { return self.dataBind(obj); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picConfigCategory');
            el.addClass('cfgRS485');
            var port = {
                "enabled": true,
                "rs485Port": "/dev/ttyUSB0",
                "mockPort": false,
                "netConnect": true,
                "netHost": "raspberrypi",
                "netPort": 9801,
                "inactivityRetry": 10,
                "portSettings": {
                    "baudRate": 9600,
                    "dataBits": 8,
                    "parity": "none",
                    "stopBits": 1,
                    "flowControl": false,
                    "autoOpen": false,
                    "lock": false
                }
            };
            var line = $('<div></div>').appendTo(el);
            var binding = '';
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Enabled', binding: binding + 'enabled' });
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 1, labelText: 'Port Type', binding: binding + 'type',
                columns: [{ binding: 'val', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', hidden: false, text: 'Type', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Type', style: { whiteSpace: 'nowrap' } }],
                items: [{ val: 'local', name: 'Local', desc: 'Local RS485 comm port' }, { val: 'network', name: 'Network', desc: 'Network RS485 Port (SOCAT ...etc)' }], inputAttrs: { style: { width: '5rem' } }, labelAttrs: { style: { marginLeft: '1rem' } }
            });

            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Port Name', binding: 'name', inputAttrs: { maxlength: 32}, labelAttrs: { style: { marginRight: '.25rem' } } });


        //    el.addClass('picConfigCategory cfgBody');
        //    var binding = '';
        //    var acc = $('<div></div>').appendTo(el).accordian({ columns: [{ text: '', style: { width: '10rem' }, binding: 'name' }, { binding: 'capacity', text: '', style: { width: '10rem', textAlign: 'right' } }] });
        //    var pnl = acc.find('div.picAccordian-contents');
        //    var line = $('<div></div>').appendTo(pnl);
        //    $('<input type="hidden" data-datatype="int"></input>').attr('data-bind', 'id').appendTo(line);
        //    $('<div></div>').appendTo(line).inputField({ labelText: 'Name', binding: binding + 'name', inputAttrs: { maxlength: 16 }, labelAttrs: { style: { marginRight: '.25rem' } } });
        //    $('<div></div>').appendTo(line).valueSpinner({ labelText: 'Capacity', binding: binding + 'capacity', min: 0, max: 500000, step: 1000, inputAttrs: { maxlength: 7 }, labelAttrs: { style: { marginLeft:'1rem', marginRight:'.25rem' } } });
        //    $('<div></div>').appendTo(line).checkbox({ labelText: 'Spa Manual Heat', binding: binding + 'manualHeat' }).hide();
        //    var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(pnl);
        //    var btnSave = $('<div id="btnSaveBody"></div>').appendTo(btnPnl).actionButton({ text: 'Save Body', icon: '<i class="fas fa-save"></i>' });
        //    btnSave.on('click', function (e) {
        //        var p = $(e.target).parents('div.picAccordian-contents:first');
        //        var v = dataBinder.fromElement(p);
        //        console.log(v);
        //        $.putApiService('/config/body', v, 'Saving ' + v.name + '...', function (data, status, xhr) {
        //            console.log({ data: data, status: status, xhr: xhr });
        //            self.dataBind(data);
        //        });
        //    });
        },
        dataBind: function (obj) {
        //    var self = this, o = self.options, el = self.element;
        //    var acc = el.find('div.picAccordian:first');
        //    var cols = acc[0].columns();
        //    if (typeof obj.type === 'undefined') {
        //        if (name.toLowerCase() === 'pool') obj.type = 0;
        //        else if (name.toLowerCase() === 'spa') obj.type = 1;
        //        else obj.type = 0;
        //    }
        //    if (obj.type === 1) {
        //        el.find('div.picCheckbox[data-bind=manualHeat]').show();
        //        cols[0].elGlyph().attr('class', 'fas fa-hot-tub');
        //    }
        //    else {
        //        el.find('div.picCheckbox[data-bind=manualHeat]').hide();
        //        cols[0].elGlyph().attr('class', 'fas fa-swimming-pool');
        //    }
        //    var capacity = typeof obj.capacity !== 'undefined' ? parseInt(obj.capacity, 10) || 0 : 0;
        //    if (isNaN(capacity)) capacity = 0;
        //    cols[0].elText().text(obj.name);
        //    cols[1].elText().text(capacity.format('#,##0') + ' gallons');
        //    dataBinder.bind(el, obj);
        }
    });
})(jQuery);
