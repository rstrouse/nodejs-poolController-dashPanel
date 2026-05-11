(function ($) {
    $.widget('pic.covers', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].initCovers = function (data) { self._initCovers(data); };
            el[0].setCoverData = function (data) { self.setCoverData(data); };
        },
        _initCovers: function (data) {
            var self = this, o = self.options, el = self.element;
            el.empty();
            var div = $('<div class="picCircuitTitle control-panel-title"></div>');
            div.appendTo(el);
            $('<span class="picCircuitTitle">Covers</span>').appendTo(div);

            var covers = Array.isArray(data?.covers) ? data.covers : [];
            covers = covers.filter(function (c) { return typeof c.isActive === 'undefined' || makeBool(c.isActive); });
            if (covers.length === 0) {
                el.hide();
                return;
            }
            el.show();
            for (var i = 0; i < covers.length; i++) {
                $('<div class="picCover"></div>').appendTo(el).cover(covers[i]);
            }
        },
        setCoverData: function (data) {
            var self = this, o = self.options, el = self.element;
            if (typeof data === 'undefined' || data === null) return;
            var id = parseInt(data.id, 10);
            if (isNaN(id)) return;

            var cover = el.find('div.picCover[data-id=' + id + ']');
            if (typeof data.isActive !== 'undefined' && !makeBool(data.isActive)) {
                cover.remove();
                if (el.find('div.picCover').length === 0) el.hide();
                return;
            }
            if (cover.length === 0) {
                cover = $('<div class="picCover"></div>').appendTo(el);
                cover.cover(data);
            } else {
                cover.each(function () { this.setCoverData(data); });
            }
            if (el.find('div.picCover').length > 0) el.show();
        }
    });

    $.widget('pic.cover', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].setCoverData = function (data) { self.setCoverData(data); };
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picCover');

            $('<span class="picCoverTypeIcon"><i class="fas fa-shield-alt"></i></span>').appendTo(el);
            $('<label class="picCoverName" data-bind="name"></label>').appendTo(el);
            var status = $('<span class="picCoverStatus"></span>').appendTo(el);
            $('<div class="picIndicator picCoverIndicator"></div>').appendTo(status);
            $('<span class="picCoverStatusText"></span>').appendTo(status);

            self.setCoverData(o);
        },
        setCoverData: function (data) {
            var self = this, o = self.options, el = self.element;
            if (typeof data === 'undefined' || data === null) return;
            if (typeof data.isActive !== 'undefined' && !makeBool(data.isActive)) {
                el.remove();
                return;
            }

            var closed = makeBool(data.isClosed);
            el.attr('data-id', data.id);
            el.attr('data-eqid', data.id);
            el.attr('data-closed', closed);

            var indicator = el.find('div.picCoverIndicator');
            indicator.attr('data-status', closed ? 'on' : 'off');
            var statusText = el.find('span.picCoverStatusText');
            statusText.text(closed ? 'Closed' : 'Open');

            dataBinder.bind(el, data);
        }
    });
})(jQuery);
