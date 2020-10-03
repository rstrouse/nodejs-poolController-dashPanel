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
            el[0].upload = function (opts) {
                form.attr('action', opts.url);
                form.attr('method', 'post');
                el.find('input[type=hidden]:first').val(opts.params? JSON.stringify(opts.params) : '{}');
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
                            mxhr.upload.addEventListener('progress', function (evt) {
                                if (evt.lengthComputable) {
                                    if (typeof opts.progress === 'function') {
                                        opts.progress(mxhr, evt, { loaded: evt.loaded, total:evt.total });
                                    }
                                }
                            });
                        }
                        return mxhr;
                    }
                }).done(function (data, status, xhr) {
                    if (typeof opts.complete === 'function') opts.complete(data, status, xhr);
                });
            };
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
        }
    });
})(jQuery); // File Upload

