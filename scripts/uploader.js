(function ($) {
    $.widget("pic.fileUpload", {
        options: {
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picFileUploader');
            var form = $('<form></form>').appendTo(el).attr('enctype', 'multipart/form-data');
            var line = $('<div></div>').appendTo(el);
            var label = $('<label></label>').addClass('picFileUpload-label').addClass('field-label').appendTo(line).text(o.labelText);
            var fname = $('<div></div>').addClass('picFileUpload-filename').addClass('fld-value-combo').addClass('file-upload-filename').appendTo(line);
            var btn = $('<div></div>').addClass('picFileUpload-choose').addClass('fld-btn-right').appendTo(line)
                .on('click', function (evt) {
                    finput.trigger('click');
                });
            $('<i></i>').appendTo(btn).addClass('fas').addClass('fa-file-upload');

            var params = $('<input></input>').attr('type', 'hidden').attr('name', 'params').appendTo(form);
            var finput = $('<input></input>').attr('type', 'file').addClass('picFileUpload-file').attr('name', o.binding).appendTo(form).on('change', function (e) {
                fname.text(this.files[0].name);
                var evt = $.Event('changed');
                evt.newFile = fname.text;
                el.trigger(evt);
            });
            if (typeof o.accept !== 'undefined') finput.attr('accept', o.accept);
            $('<div></div>').appendTo(form).addClass('file-drop-area');
            el.attr('data-bind', o.binding);
            el.addClass('file-upload');
            el[0].val = function (val) { return el.find('input[type=file]:first')[0].files[0]; };
            el[0].params = function (val) { return el.find('input[type=hidden]:first').val(val); };
            el[0].upload = function (opts) { return self.upload(opts); };
            self._applyStyles();
        },
        _applyStyles: function () {
            var self = this, o = self.options, el = self.element;
            var fld = el.find('.picFileUpload-filename:first');
            var lbl = el.find('.picFileUload-label:first');
            var choose = el.find('.picFileUpload-choose > i:first');
            if (typeof o.style !== 'undefined') el.css(o.style);

            for (var ia in o.inputAttrs) {
                switch (ia) {
                    case 'style':
                        if (typeof o.inputAttrs[ia] === 'object') fld.css(o.inputAttrs[ia]);
                        break;
                    case 'maxlength':
                    case 'maxLength':
                        //if (typeof o.inputStyle.width === 'undefined')
                        fld.css({ width: parseInt(o.inputAttrs[ia], 10) * .55 + 'rem' });
                        fld.attr('maxlength', o.inputAttrs[ia]);
                        break;
                    default:
                        if (ia.startsWith('data')) fld.attr(ia, o.inputAttrs[ia]);
                        break;
                }
            }
            for (var la in o.labelAttrs) {
                switch (la) {
                    case 'style':
                        if (typeof o.labelAttrs[la] === 'object') lbl.css(o.labelAttrs[la]);
                        break;
                    default:
                        lbl.attr(la, o.labelAttrs[la]);
                        break;
                }

            }
            if (typeof o.icon !== 'undefined') choose.addClass(o.icon);
        },
        upload: function (opts) {
            var self = this, o = self.options, el = self.element;
            if (opts.showProgress) self.showProgress();
            var form = el.find('form:first');
            form.attr('action', opts.url);
            form.attr('method', 'post');
            el.find('input[type=hidden]:first').val(opts.params ? JSON.stringify(opts.params) : '{}');
            var data = new FormData(form[0]);
            console.log(opts);
            $.ajax({
                url: opts.url,
                type: 'POST',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                xhr: function () {
                    var mxhr = $.ajaxSettings.xhr();
                    if (mxhr.upload) {
                        mxhr.upload.addEventListener('progress', function (e) {
                            if (e.lengthComputable) {
                                if (typeof opts.progress === 'function') {
                                    opts.progress(mxhr, e, { loaded: e.loaded, total: e.total });
                                }
                                else {
                                    let evt = $.Event('progress');
                                    evt.progress = { loaded: e.loaded, total: e.total };
                                    el.trigger(evt);
                                }
                            }
                        });
                    }
                    return mxhr;
                }
            }).done(function (data, status, xhr) {
                if (typeof opts.complete === 'function') opts.complete(data, status, xhr);
                else {
                    let evt = $.Event('complete');
                    evt.fileData = data;
                    el.trigger(evt);
                }
            }).fail(function (xhr, status) {
                var err = { httpCode: xhr.status, status: status, error: xhr.responseJSON, message: 'Error uploading file' };
                if (err.httpCode >= 299) {
                    $.pic.modalDialog.createApiError(err);
                }
            }).always(function () {
                let evt = $.Event('finished');
                evt.fileData = data;
                el.trigger(evt);
            });
        },
        showProgress: function () {
            var self = this, o = self.options, el = self.element;
            console.log(`Showing Progress`);
            var divPopover = $('<div></div>');
            divPopover.appendTo(document.body);
            divPopover.on('initPopover', function (e) {
                var progress = $('<div></div>').appendTo(e.contents()).uploadProgress();
                el.on('progress', function (evt) {
                    let prog = evt.progress || { loaded: 0, total: 0 };
                    progress[0].setUploadProgress(prog.loaded, prog.total);
                    console.log({ msg: 'Progress Being Made', prog: prog });
                });
                el.on('finished', function (evt) {
                    divPopover[0].close();
                });
            });
            divPopover.popover({ autoClose: false, title: `Uploading ${o.labelText}`, popoverStyle: 'modal', placement: { my: 'center center', at: '50% 50%', of: document.body } });
            divPopover[0].show(el);

        }

    });
})(jQuery); // File Upload

