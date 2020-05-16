var _uniqueId = 1;

if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
        return this.slice(0, str.length) === str;
    };
}
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function (str) {
        return this.slice(-str.length) === str;
    };
}


if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}
function formatType() { };
formatType.MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'
];
formatType.DAYS = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
];
formatType.SUFFIXES = [
    'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th',
    'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th',
    'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th',
    'st'
];
Number.prototype.round = function (dec) { return Number(Math.round(this + 'e' + dec) + 'e-' + dec); };
Number.prototype.format = function (format, empty) {
    if (isNaN(this)) return empty;
    let isNegative = this < 0;
    let tok = ['#', '0'];
    let pfx = '', sfx = '', fmt = format.replace(/[^#\.0\,]/g, '');
    let dec = fmt.lastIndexOf('.') > 0 ? fmt.length - (fmt.lastIndexOf('.') + 1) : 0, fw = '', fd = '', vw = '', vd = '', rw = '', rd = '';
    let val = String(Math.abs(this).round(dec));
    let ret = '', commaChar = ',', decChar = '.';
    for (var i = 0; i < format.length; i++) {
        let c = format.charAt(i);
        if (c === '#' || c === '0' || c === '.' || c === ',')
            break;
        pfx += c;
    }
    for (let i = format.length - 1; i >= 0; i--) {
        let c = format.charAt(i);
        if (c === '#' || c === '0' || c === '.' || c === ',')
            break;
        sfx = c + sfx;
    }
    if (dec > 0) {
        let dp = val.lastIndexOf('.');
        if (dp === -1) {
            val += '.'; dp = 0;
        }
        else
            dp = val.length - (dp + 1);
        while (dp < dec) {
            val += '0';
            dp++;
        }
        fw = fmt.substring(0, fmt.lastIndexOf('.'));
        fd = fmt.substring(fmt.lastIndexOf('.') + 1);
        vw = val.substring(0, val.lastIndexOf('.'));
        vd = val.substring(val.lastIndexOf('.') + 1);
        let ds = val.substring(val.lastIndexOf('.'), val.length);
        for (let i = 0; i < fd.length; i++) {
            if (fd.charAt(i) === '#' && vd.charAt(i) !== '0') {
                rd += vd.charAt(i);
                continue;
            } else if (fd.charAt(i) === '#' && vd.charAt(i) === '0') {
                var np = vd.substring(i);
                if (np.match('[1-9]')) {
                    rd += vd.charAt(i);
                    continue;
                }
                else
                    break;
            }
            else if (fd.charAt(i) === '0' || fd.charAt(i) === '#')
                rd += vd.charAt(i);
        }
        if (rd.length > 0) rd = decChar + rd;
    }
    else {
        fw = fmt;
        vw = val;
    }
    var cg = fw.lastIndexOf(',') >= 0 ? fw.length - fw.lastIndexOf(',') - 1 : 0;
    var nw = Math.abs(Math.floor(this.round(dec)));
    if (!(nw === 0 && fw.substr(fw.length - 1) === '#') || fw.substr(fw.length - 1) === '0') {
        var gc = 0;
        for (let i = vw.length - 1; i >= 0; i--) {
            rw = vw.charAt(i) + rw;
            gc++;
            if (gc === cg && i !== 0) {
                rw = commaChar + rw;
                gc = 0;
            }
        }
        if (fw.length > rw.length) {
            var pstart = fw.indexOf('0');
            if (pstart > 0) {
                var plen = fw.length - pstart;
                var pos = fw.length - rw.length - 1;
                while (rw.length < plen) {
                    let pc = fw.charAt(pos);
                    if (pc === ',') pc = commaChar;
                    rw = pc + rw;
                    pos--;
                }
            }
        }
    }
    if (isNegative) rw = '-' + rw;
    if (rd.length === 0 && rw.length === 0) return '';
    return pfx + rw + rd + sfx;
};
Date.prototype.isDateTimeEmpty = function() {
    return (this.getFullYear() < 1970 || this.getFullYear() > 9999);
}
Date.prototype.format = function (fmtMask, emptyMask) {
    if (fmtMask.match(/[hHmt]/g) !== null) {
        if (this.isDateTimeEmpty()) return typeof (emptyMask) !== 'undefined' ? emptyMask : '';
    }
    if (fmtMask.match(/[Mdy]/g) !== null) {
        if (this.isDateEmpty()) return typeof (emptyMask) !== 'undefined' ? emptyMask : '';
    }
    let formatted = (typeof (fmtMask) !== 'undefined' && fmtMask !== null) ? fmtMask : 'MM-dd-yyyy HH:mm:ss';
    let letters = 'dMyHhmst'.split('');
    let temp = [];
    let count = 0;
    let regexA;
    let regexB = /\[(\d+)\]/;
    let year = this.getFullYear().toString();
    let formats = {
        d: this.getDate().toString(),
        dd: this.getDate().toString().padStart(2, '00'),
        ddd: this.getDay() >= 0 ? formatType.DAYS[this.getDay()].substring(0, 3) : '',
        dddd: this.getDay() >= 0 ? formatType.DAYS[this.getDay()] : '',
        M: (this.getMonth() + 1).toString(),
        MM: (this.getMonth() + 1).toString().padStart(2, '00'),
        MMM: this.getMonth() >= 0 ? formatType.MONTHS[this.getMonth()].substring(0, 3) : '',
        MMMM: this.getMonth() >= 0 ? formatType.MONTHS[this.getMonth()] : '',
        y: year.charAt(2) === '0' ? year.charAt(4) : year.substring(2, 4),
        yy: year.substring(2, 4),
        yyyy: year,
        H: this.getHours().toString(),
        HH: this.getHours().toString().padStart(2, '00'),
        h: this.getHours() === 0 ? '12' : (this.getHours() > 12) ? Math.abs(this.getHours() - 12).toString() : this.getHours().toString(),
        hh: this.getHours() === 0 ? '12' : (this.getHours() > 12) ? Math.abs(this.getHours() - 12).toString().padStart(2, '00') : this.getHours().toString().padStart(2, '00'),
        m: this.getMinutes().toString(),
        mm: this.getMinutes().toString().padStart(2, '00'),
        s: this.getSeconds().toString(),
        ss: this.getSeconds().toString().padStart(2, '00'),
        t: (this.getHours() < 12 || this.getHours() === 24) ? 'a' : 'p',
        tt: (this.getHours() < 12 || this.getHours() === 24) ? 'am' : 'pm'
    };
    for (let i = 0; i < letters.length; i++) {
        regexA = new RegExp('(' + letters[i] + '+)');
        while (regexA.test(formatted)) {
            temp[count] = RegExp.$1;
            formatted = formatted.replace(RegExp.$1, '[' + count + ']');
            count++;
        }
    }
    while (regexB.test(formatted))
        formatted = formatted.replace(regexB, formats[temp[RegExp.$1]]);
    //console.log({ formatted: formatted, fmtMask: fmtMask });
    return formatted;
};
Date.prototype.addMinutes = function (nMins) {
    this.setTime(this.getTime() + (nMins * 60000));
    return this;
}
function makeBool(val) {
    if (typeof (val) === 'boolean') return val;
    if (typeof (val) === 'undefined') return false;
    if (typeof (val) === 'number') return val >= 1;
    if (typeof (val) === 'string') {
        if (val === '') return false;
        switch (val.toLowerCase().trim()) {
            case 'on':
            case 'true':
            case 'yes':
            case 'y':
                return true;
            case 'off':
            case 'false':
            case 'no':
            case 'n':
                return false;
        }
        if (!isNaN(parseInt(val, 10))) return parseInt(val, 10) >= 1;
    }
    return false;
}
// PUT and Delete for ReST calls.
jQuery.each(["put", "delete"], function (i, method) {
    jQuery[method] = function (url, data, callback, type) {
        if (jQuery.isFunction(data) || (jQuery.isArray(data) && jQuery.isFunction(data[0]))) {
            type = type || callback;
            callback = data;
            data = undefined;
        }
        if (typeof (data) === 'object') {
            for (var v in data) {
                if (typeof (data[v]) === 'function') continue;
                url.indexOf('?') === -1 ? url += '?' : url += '&';
                if (data[v] instanceof Date && !isNaN(data[v].getTime()))
                    url += (v + '=' + encodeURIComponent(data[v].format('yyyy-mm-ddTHH:MM:ss')));
                else if (typeof (data[v]) === 'object')
                    url += (v + '=' + encodeURIComponent(JSON.stringify(data[v])));
                url += (v + '=' + encodeURIComponent(data[v].toString()));
            }
        }
        //console.log({ method: method, url: url, type: typeof (data), data: typeof (data) === 'string' && !data.startsWith('=') ? '=' + data : data });
        return $.ajax({
            url: url,
            type: method,
            dataType: type,
            data: typeof (data) === 'string' && !data.startsWith('=') ? '=' + data : data,
            success: callback
        });
    };
});
jQuery.each(['put', 'delete', 'post'], function (i, method) {
    jQuery[method + 'JSON'] = function (url, data, successCallback, errorCallback, completeCallback) {
        if (jQuery.isFunction(data) || (jQuery.isArray(data) && jQuery.isFunction(data[0]))) {
            method = method || successCallback;
            completeCallback = errorCallback;
            errorCallback = successCallback;
            successCallback = data;
            data = undefined;
        }

        // Set up the callbacks.
        var cbComplete = function (jqXHR, status) { };
        var cbShowError = function (jqXHR, status, error) { };
        var cbShowSuccess = function (data, status, jqXHR) { };

        // Set up the callbacks.
        successCallback = $.mergeCallbacks(successCallback, cbShowSuccess);
        errorCallback = $.mergeCallbacks(errorCallback, cbShowError);
        completeCallback = $.mergeCallbacks(completeCallback, cbComplete);
        console.log({ method: method, url: url, data: typeof (data) === 'string' ? data : JSON.stringify(data) });
        return jQuery.ajax({
            url: url,
            type: method,
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: typeof (data) === 'string' ? data : JSON.stringify(data),
            error: errorCallback,
            success: successCallback,
            complete: completeCallback
        });
    };
});
jQuery.mergeCallbacks = function (target, source) {
    if (typeof (target) === 'undefined') return source;
    else if (typeof (target) === 'function') {
        if (typeof (source) === 'undefined') return target;
        else if (typeof (source) === 'function') return [source, target];
        else if (Array.isArray(source)) return source.concat([target]);
        else return target;
    }
    else if (Array.isArray(target)) {
        if (typeof (source) === 'undefined') return target;
        else if (typeof (source) === 'function') return [source].concat(target);
        else if (Array.isArray(source)) return source.concat(target);
        else return target;
    }
};
jQuery.each(['get', 'put', 'delete', 'post'], function (i, method) {
    jQuery[method + 'ApiService'] = function (url, data, message, successCallback, errorCallback, completeCallback) {
        if (jQuery.isFunction(data) || (jQuery.isArray(data) && jQuery.isFunction(data[0]))) {
            method = method || successCallback;
            completeCallback = errorCallback;
            errorCallback = successCallback;
            successCallback = data;
            data = undefined;
        }
        if (typeof message === 'function') {
            // Shift all the parameters because we aren't calling the service with a status message.
            completeCallback = errorCallback;
            errorCallback = successCallback;
            successCallback = message;
            message = undefined;
        }
        var msg;
        var overlay;
        if (typeof message !== 'undefined') {
            console.log('Showing message: ' + message);
            // We are displaying a message while the service is underway.
            msg = $('<div style="visibility:hidden;" />').addClass('picServiceStatusMsg').appendTo(document.body);
            overlay = $('<div style="background-color:lavender;opacity:.15" />').addClass('ui-widget-overlay').addClass('ui-front').appendTo(document.body);
            if (message instanceof jQuery) message.appendTo(msg);
            else
                $('<div />').html(message).appendTo(msg);
            msg.css({
                visibility: '',
                left: ($(document).width() - msg.width()) / 2,
                top: ($(document).height() - msg.height()) / 2
            });

        }
        // Set up the callbacks.
        var cbComplete = function (jqXHR, status) {
            if (typeof msg !== 'undefined') {
                msg.fadeOut(300, function () {
                    msg.remove();
                    if (typeof overlay !== 'undefined') overlay.remove();
                });
            }
        };
        var cbShowError = function (jqXHR, status, error) {
            var err = { httpCode: jqXHR.status, status: status, error: jqXHR.responseJSON };
            console.log(err);
            if (err.httpCode >= 299) {
                $.pic.modalDialog.createApiError(err);
            }
        };
        var cbShowSuccess = function (data, status, jqXHR) { };
        let serviceUrl = $('div.picDashboard').dashboard('option').apiServiceUrl + (!url.startsWith('/') ? '/' : '') + url;


        // Set up the callbacks.
        successCallback = $.mergeCallbacks(successCallback, cbShowSuccess);
        errorCallback = $.mergeCallbacks(errorCallback, cbShowError);
        completeCallback = $.mergeCallbacks(completeCallback, cbComplete);
        console.log({ method: method, url: url, data: typeof data === 'string' ? data : JSON.stringify(data) });
        return jQuery.ajax({
            url: serviceUrl,
            type: method,
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: typeof data === 'string' ? data : JSON.stringify(data),
            error: errorCallback,
            success: successCallback,
            complete: completeCallback
        });
    };
});


var dataBinder = {
    checkRequired: function (el, show) {
        var isValid = true;
        el.find('*[data-required=true]').each(function () {
            var val = null;
            if (typeof this.isEmpty === 'function') {
                if (this.isEmpty()) {
                    isValid = false;
                    if (typeof this.label === 'function')
                        $('<div />').appendTo($(this)).fieldTip({ message: this.label().text() + ' is Required' });
                    else 
                        $('<div />').appendTo($(this)).fieldTip({ message: 'Value is Required' });
                }
            }
            else if (typeof this.val === 'function') {
                val = this.val();
                if (typeof val === 'undefined') {
                    isValid = false;
                    if (typeof this.label === 'function')
                        $('<div />').appendTo($(this)).fieldTip({ message: this.label().text() + ' is Required' });
                    else
                        $('<div />').appendTo($(this)).fieldTip({ message: 'Value is Required' });
                }
            }
        });
        return isValid;
    },
    bind: function (el, val) {
        el.find('*[data-bind]').each(function () {
            $this = $(this);
            let prop = $this.attr('data-bind');
            let arr = prop.split('.');
            let tval = val;
            for (let i = 0; i < arr.length; i++) {
                var s = arr[i];
                if (typeof s === 'undefined' || !s) continue;
                let ndx = s.indexOf('[');
                if (ndx !== -1) {
                    ndx = parseInt(s.substring(ndx + 1, s.indexOf(']') - 1), 10);
                    s = s.substring(0, ndx - 1);
                }
                tval = tval[s];
                if (typeof tval === 'undefined') break;
                if (ndx >= 0) tval = tval[ndx];
            }
            if (typeof tval !== 'undefined') {
                if (typeof this.val === 'function') this.val(tval);
                else {
                    switch ($this.attr('data-fmttype')) {
                        case 'time':
                            {
                                var dt = new Date();
                                dt.setHours(0, 0, 0);
                                dt.addMinutes(tval);
                                tval = dt.format($this.attr('data-fmtmask'), $this.attr('data-fmtempty') || '');
                            }
                            break;
                        case 'date':
                        case 'datetime':
                            {
                                let dt = new Date(tval);
                                tval = dt.format($this.attr('data-fmtmask'), $this.attr('data-fmtempty') || '');
                            }
                            break;
                        case 'number':
                            if (typeof (tval) !== 'number') tval = parseFloat(tval);
                            tval = tval.format($this.attr('data-fmtmask'), $this.attr('data-fmtempty') || '');
                            break;
                        case 'duration':
                            tval = dataBinder.formatDuration(tval);
                            break;
                    }
                    if ($this.is('input')) {
                        if (this.type === 'checkbox') $this.prop('checked', makeBool(tval));
                        else { $this.val(tval); }
                    }
                    else if ($this.is('select')) $this.val(tval);
                    else $this.text(tval);
                }
            }
        });
    },
    parseNumber: function (val) {
        if (typeof val === 'number') return val;
        var tval = val.replace(/[^0-9\.\-]+/g, '');
        return tval.indexOf('.') !== -1 ? parseFloat(tval) : parseInt(tval, 10);
    },
    formatDuration: function (dur) {
        var fmt = '';
        let hrs = Math.floor(dur / 3600);
        let min = Math.floor((dur - (hrs * 3600)) / 60);
        let sec = dur - ((hrs * 3600) + (min * 60));
        if (hrs > 1) fmt += (hrs + 'hrs');
        else if (hrs > 0) fmt += (hrs + 'hr');

        if (min > 0) fmt += ' ' + (min + 'min');
        if (sec > 0) fmt += ' ' + (sec + 'sec');
        return fmt.trim();
    },
    fromElement: function (el, obj, arrayRef) {
        if (typeof arrayRef === 'undefined' || arrayRef === null) arrayRef = [];
        if (typeof obj === 'undefined' || obj === null) obj = {};
        var self = this;
        if (el.is(':input')) {
            if (el[0].type === 'checkbox') self._bindValue(obj, el, el.is(':checked'), arrayRef);
            else self._bindValue(obj, el, el.val(), arrayRef);
        }
        else if (el.is('select')) 
            self._bindValue(obj, el, el.val(), arrayRef);
        else {
            if (typeof el.attr('data-bind') !== 'undefined') {
                if (typeof el[0].val === 'function')
                    self._bindValue(obj, el, el[0].val(), arrayRef);
                else
                    self._bindValue(obj, el, el.text(), arrayRef);
            }
            el.find('*[data-bind]').each(function () {
                $this = $(this);
                if (typeof this.val === 'function')
                    self._bindValue(obj, $this, this.val(), arrayRef);
                else if ($this.is('input')) {
                    if (this.type === 'checkbox') self._bindValue(obj, $this, $this.is(':checked'), arrayRef);
                    else self._bindValue(obj, $this, $this.val(), arrayRef);
                }
                else if ($this.is('select'))
                    self._bindValue(obj, $this, $this.val(), arrayRef);
                else
                    self._bindValue(obj, $this, $this.text(), arrayRef);
            });
        }
        
        return obj;
    },
    _bindValue: function (obj, el, val, arrayRef) {
        var binding = el.attr('data-bind');
        var dataType = el.attr('data-datatype');
        if (binding && binding.length > 0) {
            var sRef = '';
            var arr = binding.split('.');
            var t = obj;
            for (var i = 0; i < arr.length - 1; i++) {
                s = arr[i];
                if (typeof s === 'undefined' || s.length === 0) continue;
                sRef += ('.' + s);
                var ndx = s.lastIndexOf('[');
                if (ndx !== -1) {
                    var v = s.substring(0, ndx);
                    var ndxEnd = s.lastIndexOf(']');
                    var ord = parseInt(s.substring(ndx + 1, ndxEnd), 10);
                    if (isNaN(ord)) ord = 0;
                    if (typeof arrayRef[sRef] === 'undefined') {
                        if (typeof t[v] === 'undefined') {
                            t[v] = new Array();
                            t[v].push(new Object());
                            t = t[v][0];
                            arrayRef[sRef] = ord;
                        }
                        else {
                            k = arrayRef[sRef];
                            if (typeof k === 'undefined') {
                                a = t[v];
                                k = a.length;
                                arrayRef[sRef] = k;
                                a.push(new Object());
                                t = a[k];
                            }
                            else
                                t = t[v][k];
                        }
                    }
                    else {
                        k = arrayRef[sRef];
                        if (typeof k === 'undefined') {
                            a = t[v];
                            k = a.length;
                            arrayRef[sRef] = k;
                            a.push(new Object());
                            t = a[k];
                        }
                        else
                            t = t[v][k];
                    }
                }
                else if (typeof t[s] === 'undefined') {
                    t[s] = new Object();
                    t = t[s];
                }
                else
                    t = t[s];
            }
            if (typeof dataType === 'undefined') dataType = 'string';
            switch (dataType) {
                case 'number':
                case 'int':
                case 'float':
                    t[arr[arr.length - 1]] = this.parseNumber(val);
                    break;
                case 'datetime':
                    t[arr[arr.length - 1]] = Date.parse(val);
                    break;
                case 'phone':
                    var ph = val.replace(/[^\d.,]+/g, '');
                    ph = ph.replace(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, "($1)$2-$3");
                    if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(val))
                        t[arr[arr.length - 1]] = '';
                    else
                        t[arr[arr.length - 1]] = ph;
                    break;
                case 'bool':
                case 'boolean':
                    t[arr[arr.length - 1]] = makeBool(val);
                    break;
                default:
                    t[arr[arr.length - 1]] = val;
                    break;
            }
        }
    }
};
$.ui.position.fieldTip = {
    left: function (position, data) {
        console.log({ fn: 'left', position: position, data: data });
        var initPos = position.left;
        $.ui.position.flip.left(position, data);
        if (initPos !== position.left) {
            data.elem.removeClass('right').addClass('left');
        } else {
            data.elem.removeClass('left').addClass('right');
        }
    },
    top: function (position, data) {
        var initPos = position.top;
        console.log({ fn: 'top', position: position, data: data });
        $.ui.position.flip.top(position, data);
        if (initPos !== position.top) {
            data.elem.addClass('tooltipFlipTop');
        } else {
            data.elem.removeClass('tooltipFlipTop');
        }
    }
};
(function ($) {
    $.widget("pic.fieldTip", {
        options: {
            placement: {}
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initFieldTip();
        },
        _initFieldTip: function () {
            var self = this, o = self.options, el = self.element;
            let div = $('<div class="picFieldTip-message" />');
            var fld = o.field || el.parent();
            if (o.message instanceof jQuery)
                o.message.appendTo(div);
            else
                div.html(o.message);
            el.addClass('picFieldTip');
            el.css({ visibility: 'hidden' });
            if (typeof fld !== 'undefined') {
                var parent = el.parents('div.picAccordian-contents:first') || el.parents('div.picTabContent:first') || el.parents('div.picConfigContainer:first') || el.parents('div.picDashContainer:first');
                //el.appendTo(parent);
                var p = {
                    my: o.placement.my || 'left center',
                    at: o.placement.at || 'right+7 center',
                    of: fld,
                    collision: 'fieldTip',
                    within: parent[0]
                };
                setTimeout(function () {
                    el.position(p); el.css({ visibility: 'visible' });
                }, 0);

                if (typeof o.closeAfter === 'undefined') o.closeAfter = Math.max(o.message.length * 100, 5000);
                if (o.closeAfter > 0) setTimeout(function () {
                    el.fadeOut(400, function () { el.remove(); });
                }, o.closeAfter);
            }
            div.appendTo(el);
            el.on('click', function (evt) { el.remove(); evt.preventDefault(); evt.stopPropagation(); });
        }
    });
})(jQuery); // Field Tip
(function ($) {
    $.widget("pic.toggleButton", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initToggleButton();
        },
        _initToggleButton: function () {
            var self = this, o = self.options, el = self.element;
            let div = $('<div class="picIndicator" />');
            el.addClass('picToggleButton');
            el[0].val = function (val) { return self.val(val); };
            if (o.bind) el.attr('data-bind', o.bind);
            div.appendTo(el);
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof (val) !== 'undefined')
                el.find('div.picIndicator').attr('data-status', val);
            else
                return el.find('div.picIndicator').attr('data-status');
        }
    });
})(jQuery); // Toggle Button
(function ($) {
    $.widget("pic.actionButton", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initActionButton();
        },
        _initActionButton: function () {
            var self = this, o = self.options, el = self.element;
            let icon = $('<span class="picButtonIcon" />');
            let text = $('<span class="picButtonText" />');
            icon.appendTo(el);
            text.appendTo(el);
            if (o.icon) icon.html(o.icon);
            el.addClass('picActionButton');
            if (o.text) text.text(o.text);
            el[0].buttonText = function (val) { return self.buttonText(val); };
            if (o.bind) el.attr('data-bind', o.bind);
        },
        buttonText: function (val) {
            var self = this, o = self.options, el = self.element;
            return el.find('span.picButtonText').text(val);
        }
    });
})(jQuery); // Action Button
(function ($) {
    $.widget("pic.optionButton", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].val = function (val) { return self.val(val); };
            el[0].buttonText = function (val) { return self.buttonText(val); };
            el[0].isEmpty = function () { return self.isEmpty(); };
            el[0].required = function (val) { return self.required(val); };
            if (o.required === true) self.required(true);
            self._initOptionButton();
        },
        _initOptionButton: function () {
            var self = this, o = self.options, el = self.element;
            let text = $('<span class="picButtonText" />');
            var toggle = $('<div class="picOptionToggle"/>');
            toggle.appendTo(el);
            toggle.toggleButton();
            text.appendTo(el);
            if (o.icon) icon.html(o.icon);
            el.addClass('picOptionButton');
            if (typeof o.id !== 'undefined') el.prop('id', o.id);
            el.attr('data-datatype', 'boolean');
            if (o.text) text.text(o.text);
            if (o.bind) el.attr('data-bind', o.bind);
            if (o.dropdownButton) o.dropdownButton.appendTo(el);
            el.on('click', function (e) {
                if (el.hasClass('disabled')) {
                    e.stopImmediatePropagation();
                    return;
                }
                el.find('div.picIndicator').each(function () {
                    var v = makeBool($(this).attr('data-status'));
                    $(this).attr('data-status', !v);
                });
            });
        },
        buttonText: function (val) {
            var self = this, o = self.options, el = self.element;
            return el.find('span.picButtonText').text(val);
        },
        required: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return makeBool(el.attr('data-required'));
            else el.attr('data-required', makeBool(val));
        },
        isEmpty: function () {
            var self = this, o = self.options, el = self.element;
            var val = self.val();
            return typeof val === 'undefined' || val === '';
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined')
                el.find('div.picIndicator').attr('data-status', val);
            else
                return el.find('div.picIndicator').attr('data-status');
        }
       
    });
})(jQuery); // Option Button
(function ($) {
    $.widget("pic.valueSpinner", {
        options: {
            lastChange: 0, ramp: 40, ramps: 0, fmtMask: '#,##0.####', fmtEmpty: '', step: 1, inputAttrs: {}, labelAttrs: {} },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initValueSpinner();
        },
        _rampIncrement: function() {
            var self = this, o = self.options, el = self.element;
            if (o.timer) clearTimeout(o.timer);
            self.increment();
            o.timer = setTimeout(function () {
                o.ramps++;
                self._rampIncrement();
            }, Math.max(400 - ((o.ramps + 1) * o.ramp), o.ramp));
        },
        _rampDecrement: function () {
            var self = this, o = self.options, el = self.element;
            if (o.timer) clearTimeout(o.timer);
            self.decrement();
            o.timer = setTimeout(function () {
                o.ramps++;
                self._rampDecrement();
            }, Math.max(500 - ((o.ramps + 1) * o.ramp), o.ramp));
        },
        _fireValueChanged: function () {
            var self = this, o = self.options, el = self.element;
            var evt = $.Event('change');
            evt.value = o.val;
            el.trigger(evt);
        },
        _initValueSpinner: function () {
            var self = this, o = self.options, el = self.element;
            if (!el.hasClass) el.addClass('picSpinner');
            el[0].increment = function () { return self.increment(); };
            el[0].decrement = function () { return self.decrement(); };
            el[0].val = function (val) { return self.val(val); };
            el[0].options = function (opts) { return self.opts(opts); };
            el[0].isEmpty = function () { return self.isEmpty(); };
            el[0].required = function (val) { return self.required(val); };
            if (o.required === true) self.required(true);
            $('<label class="picSpinner-label" /><div class="picSpinner-down"><i class="fas fa-minus"/></div><div class="picSpinner-value"/><div class="picSpinner-up"><i class="fas fa-plus" /></div><span class="picSpinner-units" />').appendTo(el);
            if (typeof o.min === 'undefined') o.min = 0;
            if (typeof o.val === 'undefined') o.val = o.min;
            el.find('div.picSpinner-value').text(o.val.format(o.fmtMask, o.fmtEmpty));
            el.find('span.picSpinner-units').text(o.units);
            self._applyStyles();
            if (typeof o.value !== 'undefined') self.val(o.value);
            if (typeof o.binding !== 'undefined') el.attr('data-bind', o.binding);
            if (o.labelText) el.find('label.picSpinner-label:first').html(o.labelText);
            el.on('mousedown', 'div.picSpinner-down', function (evt) {
                self._rampDecrement();
                evt.preventDefault();
                evt.stopPropagation();
            });
            el.on('mousedown', 'div.picSpinner-up', function (evt) {
                self._rampIncrement();
                evt.preventDefault();
                evt.stopPropagation();
            });
            el.on('mouseup', 'div.picSpinner-up, div.picSpinner-down', function (evt) {
                o.ramps = 0;
                clearTimeout(o.timer);
                o.timer = null;
                self._fireValueChanged();
            });
            el.on('mouseleave', 'div.picSpinner-up, div.picSpinner-down', function (evt) {
                o.ramps = 0;
                if (!o.timer) return;
                clearTimeout(o.timer);
                o.timer = null;
                self._fireValueChanged();
            });
        },
        opts: function (opts) {
            var self = this, o = self.options, el = self.element;
            if (typeof opts !== 'undefined') {
                $.extend(o, opts);
                if (typeof opts.val !== 'undefined') self.val(opts.val);
            }
            else
                return o;
        },
        _applyStyles: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picValueSpinner');
            if (typeof o.style !== 'undefined') el.css(o.style);
            var fld = el.find('div.picSpinner-value:first');
            var lbl = el.find('label.picSpinner-label:first');
            for (var ia in o.inputAttrs) {
                switch (ia) {
                    case 'style':
                        if (typeof o.inputAttrs[ia] === 'object') fld.css(o.inputAttrs[ia]);
                        break;
                    case 'maxlength':
                    case 'maxLength':
                        //if (typeof o.inputStyle.width === 'undefined')
                        fld.css({ width: parseInt(o.inputAttrs[ia], 10) * .7 + 'rem' });
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
        },
        increment: function () {
            var self = this, o = self.options, el = self.element;
            o.val = Math.min(o.max, o.val + o.step);
            el.find('div.picSpinner-value').text(o.val.format(o.fmtMask, o.fmtEmpty));
            o.lastChange = new Date().getTime();
            return o.val;
        },
        decrement: function () {
            var self = this, o = self.options, el = self.element;
            o.val = Math.max(o.min, o.val - o.step);
            el.find('div.picSpinner-value').text(o.val.format(o.fmtMask, o.fmtEmpty));
            o.lastChange = new Date().getTime();
            return o.val;
        },
        required: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return makeBool(el.attr('data-required'));
            else el.attr('data-required', makeBool(val));
        },
        isEmpty: function () {
            var self = this, o = self.options, el = self.element;
            return isNaN(self.val());
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return o.val;
            if (val > o.max) val = o.max;
            else if (val < o.min) val = o.min;
            o.val = Math.min(Math.max(o.min, val), o.max);
            el.find('div.picSpinner-value').text(o.val.format(o.fmtMask, o.fmtEmpty));
        }
    });
})(jQuery); // Value Spinner
(function ($) {
    $.widget("pic.selector", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initSelector();
        },
        _initSelector: function () {
            var self = this, o = self.options, el = self.element;
            el[0].isEmpty = function () { return self.isEmpty(); };
            el[0].required = function (val) { return self.required(val); };
            if (o.required === true) self.required(true);
            el.addClass('picSelector');
            for (let i = 0; i < o.opts.length; i++) {
                let opt = o.opts[i];
                let divOpt = $('<div class="picOption"><div class="picIndicator"/><label class="picOption"/></div>');
                divOpt.appendTo(el);
                divOpt.find('label.picOption').text(opt.desc);
                divOpt.attr('data-name', opt.name);
                divOpt.attr('data-val', opt.val);
                if (opt.val === o.val) divOpt.find('div.picIndicator').attr('data-status', 'selected');
                
            }
            el.on('click', 'div.picOption', function (evt) {
                let opt = $(this);
                evt.preventDefault();
                if (opt.attr('data-val') === o.val.toString()) return;
                else {
                    let old = o.val;
                    o.val = opt.attr('data-val');
                    el.find('div.picOption').each(function () {
                        let $this = $(this);
                        let ind = $this.find('div.picIndicator:first');
                        ind.attr('data-status', $this.attr('data-val') === o.val.toString() ? 'selected' : '');
                    });
                    let e = $.Event('selchange');
                    e.oldVal = old;
                    e.newVal = o.val;
                    el.trigger(e);
                }
            });
        },
        required: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return makeBool(el.attr('data-required'));
            else el.attr('data-required', makeBool(val));
        },
        isEmpty: function () {
            var self = this, o = self.options, el = self.element;
            return el.find('div.picOption div.picIndicator[data-status=selected]').length === 0;
        }

    });
})(jQuery); // Selector
(function ($) {
    $.widget("pic.tabBar", {
        options: {
            isInteractive: true,
            isEnabled: true
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picTabBar');
            $('<div class="picTabs"></div>').prependTo(el);
            $('<div class="picTabContents"/>').appendTo(el);
            el.find('div.picTabs:first').on('click', 'div.picTab', function (evt) {
                // Set the active tab here.
                self.selectTabById($(evt.currentTarget).attr('data-tabid'));
                evt.preventDefault();
            });
            el[0].tabContent = function (tabId) { return self.tabContent(tabId); };
            el[0].selectTabById = function (tabId) { return self.selectTabById(tabId); };
            el[0].selectedTabId = function (tabId) { return self.selectedTabId(tabId); };
            el[0].addTab = function (tabObj) { return self.addTab(tabObj); };
            var evt = $.Event('initTabs');
            evt.contents = function () { return self.contents(); };
            el.trigger(evt);
        },
        isInDOM: function () { return $.contains(this.element[0].ownerDocument.documentElement, this.element[0]); },
        selectTabById: function (tabId) {
            var self = this, o = self.options, el = self.element;
            var evt = $.Event('tabchange');
            if (o.tabId) evt.oldTab = { id: o.tabId, contents: self.tabContent(o.tabId) };
            evt.newTab = { id: tabId, contents: self.tabContent(tabId) };
            el.trigger(evt);
            //console.log(evt);
            if (!evt.isDefaultPrevented()) {
                el.find('div.picTabs:first').children('div.picTab').each(function () {
                    var $this = $(this);
                    var id = $this.attr('data-tabid');
                    if (id === tabId) {
                        $this.addClass('picTabSelected');
                        self.contents().find('div.picTabContent[data-tabid=' + id + ']').show();
                        o.tabId = id;
                    }
                    else {
                        $this.removeClass('picTabSelected');
                        self.contents().find('div.picTabContent[data-tabid=' + id + ']').hide();
                    }
                });
            }
        },
        selectedTabId: function (tabId) {
            var self = this, o = self.options, el = self.element;
            if (typeof tabId === 'undefined') return o.tabId;
            else if(tabId !== o.tadId)
                return self.selectTabById(tabId);
        },
        tabs: function () { return this.element.find('div.picTabs:first'); },
        contents: function () { return this.element.find('div.picTabContents:first'); },
        tabContent: function (tabId) { return this.contents().find('div.picTabContent[data-tabid=' + tabId + ']:first'); },
        addTab: function (tabObj) {
            var self = this, o = self.options, el = self.element;
            var tab = $('<div class="picTab"><span class="picTabText"/></div>');
            tab.appendTo(self.tabs());
            tab.attr('data-tabid', tabObj.id);
            tab.find('span.picTabText').each(function () { $(this).text(tabObj.text); });
            var content = $('<div class="picTabContent" />');
            content.attr('data-tabid', tabObj.id);
            content.appendTo(self.contents());

            if (typeof tabObj.contents === 'string') content.html(tabObj.contents);
            else if (typeof tabObj.contents === 'function') tabObj.contents(content);
            else if (typeof tabObj.contents !== 'undefined') tabObj.contents.appendTo(content);
            return content;
        },
        _destroy: function () {
            var self = this, o = self.options, el = self.element;
        }

    });
})(jQuery); // Tab Bar
(function ($) {
    $.widget("pic.popover", {
        options: {
            id: _uniqueId,
            isInteractive: true,
            isPositioned: false,
            isEnabled: true,
            trigger: 'manual',
            targetSelector: null,
            positionStyle: 'movable',
            popoverStyle: 'modal',
            animation: {
                type: 'fade',
                delay: { show: 500, hide: 100 }
            },
            placement: {
                target: null,
                attachment: 'left middle',
                targetAttachment: 'top center',
                collision: 'fit',
                constraints: [
                    {
                        to: 'window',
                        attachment: 'together',
                        pin: true
                    }]
            }
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            o.id = _uniqueId++;
            el.addClass('picPopover');
            el.attr('data-popoverid', o.id);
            el[0].toggle = function (elTarget) { self.toggle(elTarget); };
            el[0].show = function (elTarget) { self.show(elTarget); };
            el[0].hide = function () { self.hide(); };
            el[0].interactive = function (val) { self.interactive(val); };
            el[0].titleText = function (val) { return el.find('div.picPopoverTitle').html(val); };
            el[0].close = function () { return self.close(); };
            $('<div class="picPopoverHeader"><div class="picPopoverTitle" /></div>').prependTo(el);
            $('<div class="picPopoverBody" />').appendTo(el);
            el.find('div.picPopoverTitle').html(o.title);
            //el.on('click', function (evt) { evt.preventDefault(); });
            var evt = $.Event('initPopover');
            evt.contents = function () { return el.find('div.picPopoverBody'); };
            el.trigger(evt);
        },
        interactive: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof (val) === 'undefined') return o.isInteractive;
            else {
                o.isInteractive = makeBool(val);
                if (self.isOpen()) self.hide();
            }
        },
        isOpen: function () { return this.element.is(':visible'); },
        isInDOM: function () { return $.contains(this.element[0].ownerDocument.documentElement, this.element[0]); },
        toggle: function (elTarget) {
            var self = this, o = self.options, el = self.element;
            if (!o.isEnabled) return;
            if (!self.isOpen()) self.show(elTarget);
            else self.hide();
        },
        close: function () {
            var self = this, o = self.options, el = self.element;
            el.remove();
            $('div.ui-widget-overlay[data-popoverid=' + o.id + ']').remove();
        },
        show: function (elTarget) {
            var self = this, o = self.options, el = self.element;
            if (self.isOpen() || !o.isInteractive) return;

            var evt = $.Event('showPopover');
            evt.contents = function () { return el.find('div.picPopoverBody'); };
            el.trigger(evt);
            if (evt.isDefaultPrevented() || !self.isInDOM()) return;
            if (o.popoverStyle === 'modal') {
                o.overlay = $('<div class="ui-widget-overlay ui-front"></div>');
                o.overlay.attr('data-popoverid', o.id);
                o.overlay.one('click', function () {
                    el.remove();
                    $('div.ui-widget-overlay[data-popoverid=' + o.id + ']').remove();
                });
                o.overlay.appendTo(document.body);
                if (o.trigger === 'focus' || o.trigger === 'hover')
                    o.overlay.one('click', function (evt) { self.hide(); });
            }
            else if (o.trigger === 'hover') {
                elTarget.one('mouseleave', function (evt) { self.hide(); });
            }
            else if (o.trigger === 'focus') {
                elTarget.one('focusout', function (evt) { self.hide(); });
            }

            if (el.hasClass('ui-draggable')) el.draggable('destroy');
            el.show();
            // We are going to position it with jquery.
            var p = {
                my: o.placement.my || 'center top',
                at: o.placement.at || 'center bottom',
                of: elTarget,
                collision: 'flipfit',
                within: o.placement.within
            };
            if (p.within === 'window') p.within = window;
            if (p.within === 'document') p.within = document;
            if (typeof (p.within) === 'string') p.within = $(p.within);
            el.position(p);
            if (o.positionStyle === 'movable') {
                var d = { cursor: 'crosshair', handle: 'div.picPopoverHeader', opacity: 0.55 };
                if (o.placement.within === 'window' || o.placement.within === 'document')
                    d.containment = o.placement.within;
                else if (o.placement.within === 'parent')
                    d.containment = elTarget.parent()[0];
                else if (typeof (p.within) === 'string')
                    d.containment = p.within;
                else if (typeof (p.within) !== 'undefined' && typeof (p.within.css) === 'function')
                    d.containment = p.within[0];
                else
                    d.containment = p.within;
                el.draggable(d);
                el.find('div.picPopoverHeader').css({ cursor: 'move' });
            }
            else
                el.find('div.picPopoverHeader').css({ cursor: '' });
        },
        hide: function () {
            var self = this, o = self.options, el = self.element;
            if (o.overlay && typeof (o.overlay) !== 'undefined') o.overlay.remove();
            o.overlay = null;
            el.hide();
        },
        _destroy: function () {
            var self = this, o = self.options, el = self.element;
            if (o.overlay !== null) o.overlay.remove();
            o.overlay = null;
        }

    });
})(jQuery); // Popover
(function ($) {
    $.widget("pic.pickList", {
        options: {
            items: [],
            columns: [{ binding: 'id', hidden: true, text: 'Id', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Name', style: { whiteSpace: 'nowrap' } }],
            bindColumn: 0,
            displayColumn: 1,
            inputAttrs: {},
            labelAttrs: {},
            pickListStyle: { maxHeight: '300px' }
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initPickList();
        },
        _initPickList: function () {
            var self = this, o = self.options, el = self.element;
            if (o.bind) el.attr('data-bind', o.bind);
            $('<label class="picPickList-label" />').appendTo(el).text(o.labelText);
            var itm = self._getItem(o.value);
            $('<div class="picPickList-value" />').appendTo(el);
            var col = self._getColumn(o.displayColumn);
            if (itm && col) self.text(itm[col.binding]);
            $('<div class="picPickList-drop"><i class="fas fa-caret-down"/></div>').appendTo(el);
            el.attr('data-bind', o.binding);
            el[0].label = function () { return el.find('label.picPickList-label:first'); };
            el[0].field = function () { return el.find('div.picPickList-value:first'); };
            el[0].text = function (text) { return self.text(text); };
            el[0].val = function (val) { return self.val(val); };
            el[0].disabled = function (val) { return self.disabled(val); };
            el[0].isEmpty = function () { return self.isEmpty(); };
            el[0].required = function (val) { return self.required(val); };
            el.attr('data-val', o.value);
            if (o.required === true) self.required(true);
            self._applyStyles();
            el.find('div.picPickList-drop').on('click', function (evt) {
                var div = el.find('div.picPickList-options:first');
                if (div.length > 0) {
                    div.remove();
                    return;
                }
                else {
                    $('div.picPickList-options:first').remove();
                    if (!el.hasClass('disabled'))
                        self._buildOptionList();
                    evt.stopPropagation();
                }
            });
        },
        _applyStyles: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picPickList');
            var fld = el.find('div.picPickList-value:first');
            var lbl = el.find('label.picPickList-label:first');
            if (typeof o.style !== 'undefined') el.css(o.style);

            for (var ia in o.inputAttrs) {
                switch (ia) {
                    case 'style':
                        if (typeof o.inputAttrs[ia] === 'object') fld.css(o.inputAttrs[ia]);
                        break;
                    case 'maxlength':
                    case 'maxLength':
                        //if (typeof o.inputStyle.width === 'undefined')
                        fld.css({ width: parseInt(o.inputAttrs[ia], 10) * .7 + 'rem' });
                        break;
                    default:
                        if (ia.startsWith('data')) lbl.attr(ia, o.inputAttrs[ia]);
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
        },
        _buildOptionHeader: function () {
            var self = this, o = self.options, el = self.element;
            var tbl = $('<table class="optHeader"><tbody><tr></tr></tbody></table>');
            var row = tbl.find('tr:first');
            for (var i = 0; i < o.columns.length; i++) {
                var col = self._getColumn(i);
                var td = $('<td><span class="optText">' + col.text + '</span></td>').appendTo(row);
                if (col.hidden) td.hide();
            }
            return tbl;
        },
        _buildOptionList: function () {
            var self = this, o = self.options, el = self.element;
            div = $('<div class="picPickList-options" />');
            var tblOuter = $('<table class="optOuter"><tbody><tr class="optHeader"><td></td></tr><tr class="optBody"><td><div class="optBody"><div /></div></td></tr><tr class="optFooter"><td></td></tr></tbody></table>').appendTo(div);
            self._buildOptionHeader().appendTo(tblOuter.find('tr.optHeader:first > td'));
            var tbody = $('<table class="optBody"><tbody></tbody></table>').appendTo(tblOuter.find('div.optBody > div:first'));
            var val = self.val();

            for (var i = 0; i < o.items.length; i++) {
                var row = $('<tr />').appendTo(tbody);
                var itm = o.items[i];
                for (var j = 0; j < o.columns.length; j++) {
                    var col = o.columns[j];
                    if (j === o.bindColumn) {
                        row.attr('data-value', itm[col.binding]);
                        if (typeof val !== 'undefined' && val !== null && val.toString() === itm[col.binding].toString()) row.addClass('selected');
                    }
                    var td = $('<td />').appendTo(row);
                    var span = $('<span class="optText" />').appendTo(td);
                    if (col.style) td.css(col.style);
                    if (col.hidden) td.hide();
                    span.text(itm[col.binding]);

                }
            }
            div.appendTo(el);
            el.parents('body').one('click', function (evt) { div.remove(); });
            var cols = tblOuter.find('table.optHeader > tbody > tr:first > td');
            var firstRow = tblOuter.find('table.optBody > tbody > tr:first > td');
            if (cols.length > 0 && firstRow.length > 0) {
                for (var k = cols.length - 2; k >= 0; k--) {
                    var hdrCol$ = $(cols[k]);
                    var dtaCol$ = $(firstRow[k]);
                    var colWidth = Math.max(hdrCol$.outerWidth(), dtaCol$.outerWidth());
                    hdrCol$.css('width', colWidth + 'px');
                    dtaCol$.css('width', colWidth + 'px');
                }
            }
            var width = tblOuter.find('table.optBody').outerWidth();
            var height = tblOuter.find('table.optBody').outerHeight();
            height += tblOuter.find('table.optHeader').outerHeight() + 2;

            css = { width: 'calc(' + width + 'px + 1.5rem)', height: 'calc(' + height + 'px + .5rem)' };
            //console.log(css);
            if (o.pickListStyle) div.css(o.pickListStyle);
            div.css(css);

            self._positionPickList(div);
            div.on('click', 'table.optBody > tbody > tr', function (evt) {
                self.val($(evt.currentTarget).attr('data-value'));
            });
        },
        _positionPickList: function (div) {
            var self = this, o = self.options, el = self.element;
            var offField = el.find('div.picPickList-value:first').offset();
            div.css({ left: offField.left + 'px' });
            var divDims = { off: div.offset(), pos: div.position(), height: div.outerHeight(), width: div.outerWidth() };
            var docDims = { height: document.documentElement.clientHeight, width: $(document).outerWidth() };
            //console.log({ div: divDims, doc: docDims });
            if (divDims.height > docDims.height) {
                div.css({ height: docDims.height + 'px' });
                divDims.height = docDims.height;
            }
            if (divDims.off.top + divDims.height > docDims.height)
                divDims.pos.top -= (divDims.off.top + divDims.height - docDims.height);
            div.css({ top: divDims.pos.top + 'px' });

            // We have to treat the width and height separately as we will be repositioning after a scrollbar disappears potentially.
            divDims = { off: div.offset(), pos: div.position(), height: div.outerHeight(), width: div.outerWidth() };
            docDims = { height: document.documentElement.clientHeight, width: $(document).outerWidth() };
            if (divDims.off.left + divDims.width > docDims.width) {
                docDims.pos.left -= (divDims.off.left + divDims.width - docDims.width);
            }
            div.css({ left: divDims.pos.left + 'px' });
        },
        _getColumn: function (nCol) {
            var self = this, o = self.options, el = self.element;
            return o.columns[nCol];
        },
        _getItem: function (value) {
            var self = this, o = self.options, el = self.element;
            if (typeof value === 'undefined') return;
            var bind = self._getColumn(o.bindColumn);
            for (var i = 0; i < o.items.length; i++) {
                var itm = o.items[i];
                var val = typeof itm !== 'undefined' && typeof itm[bind.binding] !== 'undefined' ? itm[bind.binding] : '';
                if (value.toString() === val.toString()) return itm;
            }
        },
        disabled: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined')
                return el.hasClass('disabled');
            else {
                if (val) el.addClass('disabled');
                else el.removeClass('disabled');
            }
        },
        text: function (text) {
            var self = this, o = self.options, el = self.element;
            if (typeof text !== 'undefined')
                el.find('div.picPickList-value').html(text);
            else
                return el.find('div.picPickList-value').text();
        },
        required: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return makeBool(el.attr('data-required'));
            else el.attr('data-required', makeBool(val));
        },
        isEmpty: function () {
            var self = this, o = self.options, el = self.element;
            return o.value === null || typeof o.value === 'undefined';
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined') {
                var itm = self._getItem(val);
                var colVal = self._getColumn(o.bindColumn);
                if (typeof itm !== 'undefined') {
                    if (itm[colVal.binding] !== o.value) {
                        var colText = self._getColumn(o.displayColumn);
                        // Trigger a selection changed.
                        var oldItem = typeof o.value !== 'undefined' ? self._getItem(o.value) : undefined;
                        var evt = $.Event('beforeselchange');
                        evt.oldItem = oldItem;
                        evt.newItem = itm;
                        el.trigger(evt);
                        if (!evt.isDefaultPrevented()) {
                            o.value = itm[colVal.binding];
                            self.text(itm[colText.binding]);
                            evt = $.Event('selchanged');
                            evt.oldItem = oldItem;
                            evt.newItem = itm;
                            el.trigger(evt);
                        }
                    }
                }
                else {
                    self.text('');
                    o.value = null;
                }
            }
            else {
                //if (typeof o.value === 'undefined') console.log(o);
                return o.value;
            }
        }
    });
})(jQuery); // PickList
(function ($) {
    $.widget("pic.inputField", {
        options: {
            inputAttrs: {},
            labelAttrs: {}
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initField();
        },
        _initField: function () {
            var self = this, o = self.options, el = self.element;
            //el[0].val = function (val) { return self.val(val); };
            if (o.bind) el.attr('data-bind', o.bind);
            el.addClass('picInputField');
            $('<label/>').appendTo(el).text(o.labelText);
            $('<input type="text" class="picInputField-value" />').appendTo(el);
            
            self.val(o.value);
            el.attr('data-bind', o.binding);
            self._applyStyles();
            el[0].label = function () { return el.find('label:first'); };
            el[0].field = function () { return el.find('input.picInputField-value:first'); };
            el[0].text = function (text) { return self.text(text); };
            el[0].val = function (val) { return self.val(val); };
            el[0].disabled = function (val) { return self.disabled(val); };
            el[0].isEmpty = function () { return self.isEmpty(); };
            el[0].required = function (val) { return self.required(val); };
            if (o.required === true) self.required(true);

        },
        _applyStyles: function () {
            var self = this, o = self.options, el = self.element;
            var fld = el.find('input.picInputField-value:first');
            var lbl = el.find('label:first');
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
            //console.log(o);
            //if (typeof o.inputStyle !== 'undefined') fld.css(o.inputStyle);
            //if (typeof o.labelStyle !== 'undefined') lbl.css(o.labelStyle);
        },
        required: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return makeBool(el.attr('data-required'));
            else el.attr('data-required', makeBool(val));
        },
        isEmpty: function () {
            var self = this, o = self.options, el = self.element;
            var val = self.val();
            return typeof val === 'undefined' || val.toString() === '';
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            //if (typeof val === 'undefined') console.log({ msg: 'Getting field value', val: el.find('input.picInputField-value:first').val(val) });
            return typeof val !== 'undefined' ? el.find('input.picInputField-value:first').val(val) : el.find('input.picInputField-value:first').val();
        },
        disabled: function (val) {
            var self = this, o = self.options, el = self.element;
            var fld = el.find('input.picInputField-value:first');
            if (typeof val === 'undefined') return el.hasClass('disabled');
            else {
                if (val) {
                    el.addClass('disabled');
                    fld.prop('disabled', true);
                    fld.attr('disabled', true);
                }
                else {
                    el.remove('disabled');
                    fld.prop('disabled', false);
                    fld.removeAttr('disabled');
                }
            }
        }
    });
})(jQuery); // Input Field
(function ($) {
    $.widget("pic.checkbox", {
        options: {
            inputStyle: {},
            labelStyle: {},
            inputAttrs: {},
            labelAttrs: {}
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initCheckbox();
        },
        _initCheckbox: function () {
            var self = this, o = self.options, el = self.element;
            //el[0].val = function (val) { return self.val(val); };
            if (o.bind) el.attr('data-bind', o.bind);
            if (typeof o.id === 'undefined') o.id = 'cb_' + _uniqueId++;
            el.addClass('picCheckbox');
            $('<input type="checkbox" class="picCheckbox-value" />').appendTo(el).attr('id', o.id);
            $('<label/>').attr('for', o.id).appendTo(el).text(o.labelText);
            self.val(o.value);
            el.attr('data-bind', o.binding);
            self._applyStyles();
            el[0].label = function () { return el.find('label:first'); };
            el[0].checkbox = function () { return el.find('input.picCheckbox-value:first'); };
            el[0].text = function (text) { return self.text(text); };
            el[0].val = function (val) { return self.val(val); };
        },
        _applyStyles: function () {
            var self = this, o = self.options, el = self.element;
            var fld = el.find('input.picCheckbox-value:first');
            var lbl = el.find('label:first');
            if (typeof o.style !== 'undefined') el.css(o.style);

            for (var la in o.labelAttrs) {
                lbl.attr(la, o.labelAttrs[la]);
            }
            if (typeof o.inputStyle !== 'undefined') fld.css(o.inputStyle);
            if (typeof o.labelStyle !== 'undefined') lbl.css(o.labelStyle);
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            var cb = el.find('input.picCheckbox-value:first');
            if (typeof val !== 'undefined') cb.prop('checked', makeBool(val));
            else return cb.is(':checked');
        }
    });
})(jQuery); // Checkbox
(function ($) {
    $.widget("pic.accordian", {
        options: {
            columns: []
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initAccordian();
        },
        _initAccordian: function () {
            var self = this, o = self.options, el = self.element;
            //el[0].val = function (val) { return self.val(val); };
            if (o.bind) el.attr('data-bind', o.bind);
            el.addClass('picAccordian');
            var title = self._buildTitle().appendTo(el);
            var contents = $('<div class="picAccordian-contents" />').appendTo(el);
            el[0].titleBlock = function () { return el.find('div.picAccordian-title:first'); };
            el[0].text = function (text) { return self.text(text); };
            el[0].expanded = function (val) { return self.expanded(val); };
            el[0].columns = function () { return self.columns(); }
            el.on('click', 'div.picAccordian-title', function () {
                self.toggle();
            });
            el.attr('data-expanded', false);
            contents.hide();
            self.expanded(makeBool(o.expanded));
        },
        columns: function () {
            var self = this, o = self.options, el = self.element;
            var arr = [];
            el.find('div.picAccordian-title:first > div.picAccordian-titlecol').each(function () {
                arr.push({
                    el: $(this),
                    elText: function () { return this.el.find('span.picAccordian-title-text'); },
                    elGlyph: function () { return this.el.find('i:first'); }
                });
            });
            return arr;
        },
        _buildTitle: function () {
            var self = this, o = self.options, el = self.element;
            var title = $('<div class="picAccordian-title" />');
            for (var i = 0; i < o.columns.length; i++) {
                var div = $('<div class="picAccordian-titlecol" />').appendTo(title);
                var col = o.columns[i];
                div.attr('col-binding', col.binding);
                var icon = $('<i />').appendTo(div);
                if (col.glyph) icon.addClass(col.glyph);
                var text = $('<span class="picAccordian-title-text" />').appendTo(div);
                div.css(col.style);
                text.html(col.text);
            }
            $('<i class="picAccordian-title-expand fas fa-angle-double-right" />').appendTo(title);
            return title;
        },
        
        toggle: function () {
            var self = this, o = self.options, el = self.element;
            var exp = makeBool(el.attr('data-expanded'));
            self.expanded(!exp);
        },
        expanded: function (val) {
            var self = this, o = self.options, el = self.element;
            var exp = makeBool(el.attr('data-expanded'));
            if (typeof val !== 'undefined') {
                if (exp !== val) {
                    var ico = el.find('i.picAccordian-title-expand:first');
                    el.attr('data-expanded', val);
                    if (val) {
                        el.find('div.picAccordian-contents:first').slideDown(250);
                        ico.removeClass('fa-angle-double-right');
                        ico.addClass('fa-angle-double-down');
                    }
                    else {
                        el.find('div.picAccordian-contents:first').slideUp(250);
                        ico.removeClass('fa-angle-double-down');
                        ico.addClass('fa-angle-double-right');
                    }
                }
            }
            else return exp;
        }
    });
})(jQuery); // Accordian
(function ($) {
    $.widget("pic.colorPicker", {
        options: { labelText: '', binding: ''},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initColorPicker();
        },
        _initColorPicker: function () {
            var self = this, o = self.options, el = self.element;
            $('<label class="picColorPicker-label" />').text(o.labelText).appendTo(el);
            $('<div class="picColorPicker-value picCSColor" />').appendTo(el);
            el.attr('data-datatype', 'int');
            el[0].val = function (val) { return self.val(val); };
            el[0].isEmpty = function (val) { return self.isEmpty(); };
            el[0].required = function (val) { return self.required(val); };
            el[0].label = function () { return el.find('label.picColorPicker.label:first'); };
            if (o.required === true) self.required(true);
            if (o.binding) el.attr('data-bind', o.binding);
            el.on('click', function (evt) { self._showPopover(); });
            self.val(o.value);
            self._applyStyles();
        },
        _showPopover: function () {
            var self = this, o = self.options, el = self.element;
            var divVal = el.find('div.picColorPicker-value:first');
            var divPopover = $('<div class="picCSColors" />');
            divPopover.appendTo(el.parent());
            divPopover.on('initPopover', function (evt) {
                let curr = el.find('div.picColorPicker-value:first').attr('data-color');
                let divColors = $('<div class= "picLightColors" data-bind="color" />').appendTo(evt.currentTarget);
                for (let i = 0; i < o.colors.length; i++) {
                    let color = o.colors[i];
                    let div = $('<div class="picCSColor picCSColorSelector" data-color="' + color.name + '"><div class="picToggleButton"/><label class="picCSColorLabel" /></div>');
                    div.appendTo(divColors);
                    div.attr('data-val', color.val);
                    div.attr('data-name', color.name);
                    div.find('label.picCSColorLabel').text(color.desc);
                    div.find('div.picToggleButton').toggleButton();
                    div.find('div.picToggleButton > div.picIndicator').attr('data-status', curr === color.name ? 'on' : 'off');
                    div.on('click', function (e) {
                        // Select the option and close
                        divVal.attr('data-color', $(e.currentTarget).attr('data-color'));
                        divVal.attr('data-val', $(e.currentTarget).attr('data-val'));
                        divPopover[0].close();
                        e.preventDefault();
                        e.stopPropagation();
                    });
                }
                evt.preventDefault();
                evt.stopImmediatePropagation();

            });
            divPopover.popover({ title: 'Select a Color', popoverStyle: 'modal', placement: { target: el } });
            divPopover[0].show(el);

        },
        _applyStyles: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picColorPicker');
            var fld = el.find('div.picColorPicker-value:first');
            var lbl = el.find('label.picColorPicker-label:first');
            if (typeof o.style !== 'undefined') el.css(o.style);

            for (var ia in o.inputAttrs) {
                switch (ia) {
                    case 'style':
                        if (typeof o.inputAttrs[ia] === 'object') fld.css(o.inputAttrs[ia]);
                        break;
                    case 'maxlength':
                    case 'maxLength':
                        //if (typeof o.inputStyle.width === 'undefined')
                        fld.css({ width: parseInt(o.inputAttrs[ia], 10) * .7 + 'rem' });
                        break;
                    default:
                        if (ia.startsWith('data')) lbl.attr(ia, o.inputAttrs[ia]);
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
        },
        _getColor: function (val) {
            var self = this, o = self.options, el = self.element;
            return o.colors.find(elem => elem.val === val);
        },
        required: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return makeBool(el.attr('data-required'));
            else el.attr('data-required', makeBool(val));
        },
        isEmpty: function () {
            var self = this, o = self.options, el = self.element;
            return self.val() === 'undefined';
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined') {
                var color = self._getColor(val);
                el.find('div.picColorPicker-value:first').attr('data-color', typeof color !== 'undefined' ? color.name : 'white').attr('data-val', val);
            }
            else {
                return el.find('div.picColorPicker-value:first').attr('data-val');
            }
        }
    });
})(jQuery); // Color Picker
(function ($) {
    $.widget("pic.modalDialog", $.ui.dialog, {
        options: {

        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].returnValue = function (value) { return self.returnValue(value); };
            el[0].dialogArguments = function (args) { return self.dialogArguments(args); };
            var btns = o.buttons.slice();
            o.buttons = [];
            this._super('_create');
            if (typeof btns !== 'undefined') setTimeout(function () { self._buildButtons(btns); }, 0);
        },
        _buildButtons: function (btns) {
            var self = this, o = self.options, el = self.element;
            if (typeof btns !== 'undefined') {
                var btnPnl = $('<div class="picBtnPanel" />').appendTo(el);
                for (var i = 0; i < btns.length; i++) {
                    var btn = btns[i];
                    var b = $('<div />').appendTo(btnPnl).actionButton({ text: btn.text, icon: btn.icon });
                    if (typeof btn.click === 'function') b.on('click', btn.click);
                }
            }
        },
        _destroy: function () {
            var self = this, o = self.options, el = self.element;
            this._super('_destroy');
            el.parents('.ui-dialog:first').remove();
        },
        returnValue: function (value) {
            var self = this, o = self.options, el = self.element;
            if (typeof value === 'undefined') return o.returnValue;
            else o.returnValue = value;
        },
        dialogArguments: function (args) {
            var self = this, o = self.options, el = self.element;
            if (typeof args === 'undefined') return o.dialogArguments;
            else o.dialogArguments = value;
        },
        close: function (event, ui) {
            var self = this, o = self.options, el = self.element;
            this._super('_close');
            this._destroy();
        }
    });
})(jQuery); // Modal Dialog
(function ($) {
    $.widget("pic.errorPanel", {
        options: {

        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picErrorPanel');
            var line = $('<div />').appendTo(el);
            if (typeof o.error !== 'undefined') {
                $('<label />').appendTo(line).addClass('errorLabel').text('Message');
                $('<span />').appendTo(line).addClass('errorMessage').text(o.error.message);
                if (typeof o.error.equipmentType !== 'undefined') {
                    line = $('<div />').appendTo(el);
                    $('<label />').appendTo(line).addClass('errorLabel').text('Eq Type');
                    $('<span />').appendTo(line).text(o.error.equipmentType);
                }
                if (typeof o.error.id !== 'undefined') {
                    line = $('<div />').appendTo(el);
                    $('<label />').appendTo(line).addClass('errorLabel').text('Eq Id');
                    $('<span />').appendTo(line).text(o.error.id);
                }
                if (typeof o.error.parameter !== 'undefined') {
                    line = $('<div />').appendTo(el);
                    $('<label />').appendTo(line).addClass('errorLabel').text('Param');
                    $('<span />').appendTo(line).text(o.error.parameter);
                    if (typeof o.error.value !== 'undefined') {
                        $('<label />').appendTo(line).text(' = ');
                        $('<span />').appendTo(line).text(o.error.value);
                    }
                }
                if (typeof o.error.stack !== 'undefined') {
                    var acc = $('<div />').appendTo(el).accordian({ columns: [{ text: 'Stack Trace', glyph: 'fab fa-stack-overflow', style: { width: '10rem' } }] });
                    var pnl = acc.find('div.picAccordian-contents');
                    var div = $('<div />').appendTo(pnl).addClass('picStackTrace').html(o.error.stack);
                }
            }
        }
    });
})(jQuery); // Error Panel

$.pic.modalDialog.createConfirm = function (id, options) {
    var opt = typeof options !== 'undefined' && options !== null ? options : {
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true,
        message: '',
        buttons: {
            Cancel: function () { dlg.modalDialog("close"); }
        }
    };
    opt.modal = true;
    if (typeof opt.autoOpen === 'undefined') opt.autoOpen = false;
    var dlg = $('div#' + id);
    if (dlg.length === 0) {
        dlg = $('<div id="' + id + '" style="display:block;position:relative;padding:4px;"/>');
        dlg.modalDialog(opt);
    }
    dlg.html(opt.message);
    dlg.modalDialog('open');
    return dlg;
};
$.pic.modalDialog.closeDialog = function (el) {
    var dlg = $(el);
    if (!dlg.hasClass('ui-dialog-content'))
        dlg = dlg.parents('.ui-dialog-content:first');
    dlg.modalDialog('close');
    return dlg;
};
$.pic.modalDialog.createApiError = function (err, options) {
    var opt = typeof options !== 'undefined' && options !== null ? options : {
        autoOpen: false,
        height: 'auto',
        width: '30rem',
        modal: true,
        message: '',
        buttons: [
            { text: 'Close', icon: '<i class="far fa-window-close" />', click: function () { dlg.modalDialog("close"); } }
        ]
    };
    opt.modal = true;
    opt.title = 'Error: ' + typeof err.error !== 'undefined' ? err.error.name : 'General Error';
    var id = 'errorDialog' + _uniqueId++;
    if (typeof opt.autoOpen === 'undefined') opt.autoOpen = false;
    var dlg = $('div#' + id);
    if (dlg.length === 0) {
        dlg = $('<div id="' + id + '" style="display:block;position:relative;padding:4px;"/>');
        $('<div />').appendTo(dlg).errorPanel(err);
        dlg.modalDialog(opt);
    }

    dlg.modalDialog('open');
    return dlg;
};



