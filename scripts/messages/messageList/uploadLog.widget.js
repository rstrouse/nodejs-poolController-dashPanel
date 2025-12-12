(function ($) {
    $.widget("pic.uploadLog", {
        options: { isBinding: false },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initUpload();
        },
        _initUpload: function () {
            var self = this, o = self.options, el = self.element;
            var div = $('<div></div>').appendTo(el).addClass('upload-logfile');
            var line = $('<div></div>').css({ minWidth: '30rem' }).appendTo(div);
            $('<div></div>').appendTo(line).fileUpload({ binding: 'logFile', labelText: 'Log File', inputAttrs: { style: { width: '24rem' } }, hasPostProcess: true });
            line = $('<div></div>').appendTo(div);
            $('<hr></hr>').appendTo(line);
            line = $('<div></div>').appendTo(div);
            var fset = $('<fieldset></fieldset>').appendTo(line);
            $('<legend></legend>').appendTo(fset).text('Options');
            line = $('<div></div>').appendTo(fset);
            //$('<div></div>').appendTo(line).pickList({
            //    displayColumn:0,
            //    labelText: 'Playback To', binding: 'playbackTo',
            //    columns: [{ binding: 'name', text: 'Name', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Playback Destination', style: { width:'450px' } }],
            //    items: [{ name: 'Message List', desc: 'Plays the log file back to the message list' },
            //        { name: 'Pool Controller', desc: 'Plays the log file back to the poolController Instance' } ],
            //    inputAttrs: { style: { width: '9rem' } }, labelAttrs: { style: {} }, dropdownStyle: {width:'450px'}
            //});
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Begin Processing File', icon: '<i class="fas fa-upload"></i>' }).on('click', function (e) {
                self._uploadLogFile();
            });
        },
        _uploadLogFile: function () {
            var self = this, o = self.options, el = self.element;
            var divPopover = $('<div></div>');
            divPopover.appendTo(document.body);
            divPopover.on('initPopover', function (e) {
                var progress = $('<div></div>').appendTo(e.contents()).uploadProgress({ hasPostProcess: true });
                e.stopImmediatePropagation();
                var opts = dataBinder.fromElement(el);
                var uploader = $('div[data-bind=logFile]');
                // Capture the filename before upload
                var uploadedFile = uploader[0].val();
                var filename = uploadedFile ? uploadedFile.name : null;
                uploader[0].upload({
                    url: 'upload/logFile',
                    params: { preserveFile: false },
                    progress: function (xhr, evt, prog) {
                        //console.log(xhr, evt, prog);
                        progress[0].setUploadProgress(prog.loaded, prog.total);
                    },
                    complete: function (data, status, xhr) {
                        //console.log(data);
                        // Play the file back to the message list.
                        var msgList = $('div.picMessages:first')[0];
                        msgList.pinSelection(true);
                        msgList.logMessages(false);
                        progress[0].setProcessProgress(0, data.length);
                        if (progress[0].isCancelled()) {
                            msgList.cancelBulkMessages();
                            divPopover[0].close();
                        }
                        else {
                            msgList.clear();
                            // Store the filename and update the title
                            var msgListWidget = $('div.picMessages:first').data('pic-messageList');
                            if (msgListWidget && filename) {
                                msgListWidget.options.loadedFilename = filename;
                                msgListWidget._updateTitle();
                            }
                            self._processNextMessage(msgList, progress[0], data);
                        }
                    }
                });
                //console.log(opts);

            });
            divPopover.popover({ autoClose: false, title: 'Uploading Log File', popoverStyle: 'modal', placement: { my: 'center center', at: '50% 50%', of: document.body } });
            divPopover[0].show($('div.picMessageListTitle:first'));
        },
        _processNextMessage(msgList, prog, arr) {
            var self = this, o = self.options, el = self.element;
            var msg = arr.shift();
            if (prog.isCancelled()) {
                msgList.cancelBulkMessages();
                msgList.commitBulkMessages();
                $(prog).parents('div.picPopover:first')[0].close();
                return;
            }
            prog.incrementProcessProgress();
            if (typeof msg !== 'undefined' && msg !== null) {
                if (typeof msg !== 'undefined' && typeof msg.proto !== 'undefined' && msg.proto !== 'api') {
                    //if (msg.proto !== 'chlorinator' && msg.proto !== 'pump') {
                    //console.log(msg.port);
                    msgList.addBulkMessage({
                        isValid: typeof msg.valid !== 'undefined' ? msg.valid : typeof msg.isValid !== 'undefined' ? msg.isValid : true,
                        _id: msg.id,
                        portId: typeof msg.port !== 'undefined' ? msg.port : msg.portId,
                        responseFor: msg.for,
                        protocol: msg.proto,
                        direction: msg.dir,
                        padding: msg.pkt[0],
                        preamble: msg.pkt[1],
                        header: msg.pkt[2],
                        payload: msg.pkt[3],
                        term: msg.pkt[4],
                        timestamp: msg.ts
                    });
                    //}
                }
                else if (typeof msg !== 'undefined' && typeof msg.proto !== 'undefined' && msg.proto === 'api') {
                    // We are now going to add the api call to the message list.
                    msgList.addBulkApiCall({
                        direction: msg.dir,
                        protocol: msg.proto,
                        requestor: msg.requestor,
                        method: msg.method,
                        path: msg.path,
                        body: msg.body,
                        timestamp: msg.ts
                    });
                }
                else {
                    console.log(msg);
                }
            }
            else { console.log(msg); }
            if (arr.length > 0) setTimeout(function () { self._processNextMessage(msgList, prog, arr); }, 0);
            else {
                msgList.commitBulkMessages();
                $(prog).parents('div.picPopover:first')[0].close();
                el.parents('div.picPopover:first')[0].close();
                //let byte = 2;
                //console.log({ msg: 'Testing', on1: ((byte & (1 << (1))) >> 1), on4: ((byte & (1 << (4))) >> 4), on5: ((byte & (1 << (5))) >> 5) });
            }
        }
    });
})(jQuery);
