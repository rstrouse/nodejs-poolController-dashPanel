(function ($) {
    $.widget("pic.loadQueue", {
        options: { isBinding: false },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initQueue();
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
            var line = $('<div></div>').css({ minWidth: '20rem' }).appendTo(div);
            $.getLocalService('/messages/queues', undefined, function (data, status, xhr) {
                console.log(data);
                $('<div></div>').appendTo(line).pickList({ required: true,
                    labelText: 'Queue', binding: 'id',
                    displayColumn: 1,
                    columns: [{ binding: 'id', text: 'Id', hidden:true, style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Name', style: { whiteSpace: 'nowrap', width:'7rem' } }, { binding: 'description', text: 'Description', style: { whiteSpace: 'nowrap' } }],
                    items: data,
                    pickListStyle: { minWidth: '30rem', maxHeight: '300px' },
                    inputAttrs: { style: { width: '20rem' } }, labelAttrs: { style: { width: '4rem' } }
                });
            });

            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Load Queue', icon: '<i class="fas fa-download"></i>' }).on('click', function (e) {
                console.log('Loading queue');
                var queue = self._fromWindow(true);

                if (queue) {
                    console.log(queue);
                    $('div.picSendMessageQueue').each(function () {
                        this.loadQueue(queue.id);
                    });
                    // Close the window.
                    el.parents('div.picPopover:first')[0].close();
                }
            });
        },
        bindQueues: function (queue) {
            var self = this, o = self.options, el = self.element;
            //dataBinder.bind(el, queue);

        }
    });
})(jQuery);
