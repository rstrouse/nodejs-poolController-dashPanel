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
            var params = $('<input></input>').attr('type', 'hidden').attr('name', 'params').appendTo(form);
            var fname = $('<input></input>').attr('type', 'file').attr('name', 'logFile').appendTo(form);
            $('<div></div>').appendTo(form).addClass('fiile-drop-area');
            el.attr('data-bind', o.binding);
            el[0].val = function (val) { return el.find('input[type=file]:first')[0].files[0]; };
            el[0].params = function (val) { return el.find('input[type=hidden]:first').val(val); }
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
        }
    });
})(jQuery); // File Upload

