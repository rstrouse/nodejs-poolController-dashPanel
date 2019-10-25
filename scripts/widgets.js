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
    jQuery[method + 'ApiService'] = function (url, data, successCallback, errorCallback, completeCallback) {
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
                    else $this.val(val);
                }
                else if ($this.is('select')) $this.val(tval);
                else $this.text(tval);
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
})(jQuery);
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
})(jQuery);
(function ($) {
    $.widget("pic.optionButton", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].val = function (val) { return self.val(val); };
            el[0].buttonText = function (val) { return self.buttonText(val); };
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
        options: { lastChange: 0, ramp:40, ramps:0, fmtMask:'#,##0.####', fmtEmpty:'' },
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
            $('<div class="picSpinner-down"/><div class="picSpinner-value"/><div class="picSpinner-up"/>').appendTo(el);
            if (typeof o.min === 'undefined') o.min = 0;
            if (typeof o.val === 'undefined') o.val = o.min;
            el.find('div.picSpinner-value').text(o.val.format(o.fmtMask, o.fmtEmpty));
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
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return o.val;
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
        }
    });
})(jQuery);
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
            el.on('click', 'div.picTab', function (evt) {
                evt.preventDefault();
                // Set the active tab here.
                self.selectTabById($(evt.currentTarget).attr('data-tabid'));
            });
            el[0].tabContent = function (tabId) { return self.tabContent(tabId); };
            el[0].selectTabById = function (tabId) { return self.selectTabById(tabId); };
            el[0].addTab = function (tabObj) { return self.addTab(tabObj); };
            var evt = $.Event('initTabs');
            evt.contents = function () { return self.contents(); };

            el.trigger(evt);
        },
        isInDOM: function () { return $.contains(this.element[0].ownerDocument.documentElement, this.element[0]); },
        selectTabById: function (tabId) {
            var self = this, o = self.options, el = self.element;
            el.find('div.picTabs:first').find('div.picTab').each(function () {
                var $this = $(this);
                var id = $this.attr('data-tabid');
                if (id === tabId) {
                    $this.addClass('picTabSelected');
                    self.contents().find('div.picTabContent[data-tabid=' + id + ']').show();
                }
                else {
                    $this.removeClass('picTabSelected');
                    self.contents().find('div.picTabContent[data-tabid=' + id + ']').hide();
                }
            });
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
})(jQuery);
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
})(jQuery);
