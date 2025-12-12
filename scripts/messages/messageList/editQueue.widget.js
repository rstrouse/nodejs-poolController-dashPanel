(function ($) {
    $.widget("pic.editQueue", {
        options: { isBinding: false },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initQueue();
            self.bindQueue(o.queue);
        },
        _fromWindow(showError) {
            var self = this, o = self.options, el = self.element;
            var q = dataBinder.fromElement(el);
            var valid = dataBinder.checkRequired(el, showError);
            if (!valid && showError) return;
            return q;
        },
        _initQueue: function () {
            var self = this, o = self.options, el = self.element;
            var div = $('<div></div>').appendTo(el).addClass('edit-queue');
            var line = $('<div></div>').appendTo(div);
            $('<input type="hidden" data-datatype="int" data-bind="id"></input>').appendTo(line);
            $('<div></div>').appendTo(line).inputField({ required: true, labelText: 'Name', binding: 'name', inputAttrs: { maxlength: 27, style: { width: '12rem' } }, labelAttrs: { style: { width: '5.5rem', paddingLeft: '.25rem' } } });
            line = $('<div></div>').appendTo(div);
            $('<div></div>').appendTo(line).inputField({ required: false, multiLine:true, labelText: 'Description', binding: 'description', inputAttrs: { maxlength: 100, style: { width: '19rem', height:'4rem' } }, labelAttrs: { style: { width: '5.5rem', paddingLeft: '.25rem' } } });

            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Queue', icon: '<i class="far fa-save"></i>' }).on('click', function (e) {
                var queue = self._fromWindow(true);
                
                if (queue) {
                    $('div.picSendMessageQueue').each(function () {
                        this.bindQueue(queue);
                        this.saveMessage();
                    });
                    // Close the window.
                    el.parents('div.picPopover:first')[0].close();
                }
            });
        },
        bindQueue: function (queue) {
            var self = this, o = self.options, el = self.element;
            if (typeof queue.id !== 'number' || queue.id <= 0) el.parents('div.picPopover:first')[0].titleText('Create Queue');
            dataBinder.bind(el, queue);
        }
    });
})(jQuery);
