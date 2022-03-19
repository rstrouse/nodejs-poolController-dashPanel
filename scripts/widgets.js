var _uniqueId = 1;
var _screenLayer = 100;

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
window.console = window.console || (function () { var c = {}; c.log = c.warn = c.debug = c.info = c.error = c.time = c.dir = c.profile = c.clear = c.exception = c.trace = c.assert = function (s) { }; return c; })();
window.console.error = window.console.error || (function () { })();
if (!Date.parseISO) {
    Date.parseISO = function (sDate) {
        if (typeof sDate === 'undefined') return new Date();
        var s = sDate.split(/[^0-9]/);
        return new Date(s[0], s[1] - 1, s[2], s[3], s[4], s[5]);
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
function formatType() { }
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
    if (isNaN(this)) return empty || '';
    if (typeof format === 'undefined') return this.toString();
    let isNegative = this < 0;
    let tok = ['#', '0'];
    let pfx = '', sfx = '', fmt = format.replace(/[^#\.0\,]/g, '');
    let dec = fmt.lastIndexOf('.') > 0 ? fmt.length - (fmt.lastIndexOf('.') + 1) : 0,
        fw = '', fd = '', vw = '', vd = '', rw = '', rd = '';
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
Number.prototype.formatTime = function (format, empty) {
    // Formats the time in minutes from midnight.
    if (isNaN(this) || this < 0) return empty;
    var hrs = Math.floor(this / 60);
    var mins = this - (hrs * 60);
    var secs = 0;
    var tok = {
        'hh': (hrs > 12 ? hrs - 12 : hrs === 0 ? 12 : hrs).toString().padStart(2, '0'),
        'h': (hrs > 12 ? hrs - 12 : hrs === 0 ? 12 : hrs).toString(),
        'HH': hrs.toString().padStart(2, '0'),
        'H': hrs.toString(),
        'mm': mins.toString().padStart(2, '0'),
        'm': mins.toString(),
        'ss': secs.toString().padStart(2, '0'),
        's': secs.toString(),
        'tt': hrs >= 12 ? 'pm' : 'am',
        't': hrs >= 12 ? 'p' : 'a',
        'TT': hrs >= 12 ? 'PM' : 'AM',
        'T': hrs >= 12 ? 'P' : 'A'
    };
    //console.log(tok);
    var formatted = format;
    for (var t in tok) {
        formatted = formatted.replace(t, tok[t]);
    }
    return formatted;
};
Date.prototype.isDateEmpty = function () {
    return (isNaN(this.getTime()) || this.getFullYear() < 1970 || this.getFullYear() > 9999);
};
Date.prototype.isDateTimeEmpty = function () {
    return (isNaN(this.getTime()) || this.getFullYear() < 1970 || this.getFullYear() > 9999);
};
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
};
Date.format = function (date, fmtMask, emptyMask) {
    if (typeof date === 'undefined') return emptyMask;
    var dt;
    if (typeof date === 'string') {
        if (date.indexOf('T') !== -1)
            dt = Date.parseISO(date);
        else
            dt = new Date(date);
    }
    else if (typeof date === 'number') dt = new Date(date);
    else if (typeof date.format === 'function') dt = date;
    if (typeof dt.format !== 'function' || isNaN(dt.getTime())) return emptyMask;
    return dt.format(fmtMask, emptyMask);
};
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
        if (url.startsWith('/')) {
            url = url.substring(1);
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
jQuery.each(['get', 'put', 'delete', 'post'], function (i, method) {
    jQuery[method + 'LocalService'] = function (url, data, message, successCallback, errorCallback, completeCallback) {
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
            msg = $('<div style="visibility:hidden;"></div>').addClass('picServiceStatusMsg').appendTo(document.body);
            overlay = $('<div style="background-color:lavender;opacity:.15"></div>').addClass('ui-widget-overlay').addClass('ui-front').appendTo(document.body);
            if (message instanceof jQuery) message.appendTo(msg);
            else
                $('<div></div>').html(message).appendTo(msg);
            msg.css({
                visibility: '',
                left: ($(document).width() - msg.width()) / 2,
                top: ($(document).height() - msg.height()) / 2
            });
            overlay.css({ zIndex: _screenLayer + 1 });
            msg.css({ zIndex: _screenLayer + 2 });
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
            var err = { httpCode: jqXHR.status, status: status, error: jqXHR.responseJSON, message: error };
            if (err.httpCode >= 299) {
                $.pic.modalDialog.createApiError(err);
            }
        };
        var cbShowSuccess = function (data, status, jqXHR) { };
        var serviceUrl = url;

        // Set up the callbacks.
        if (serviceUrl.startsWith('/')) {
            serviceUrl = serviceUrl.substring(1);
        }
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
            msg = $('<div style="visibility:hidden;"></div>').addClass('picServiceStatusMsg').appendTo(document.body);
            overlay = $('<div style="background-color:lavender;opacity:.15"></div>').addClass('ui-widget-overlay').addClass('ui-front').appendTo(document.body);
            overlay.css({ zIndex: _screenLayer + 1 });
            msg.css({ zIndex: _screenLayer + 2 });
            if (message instanceof jQuery) message.appendTo(msg);
            else
                $('<div></div>').html(message).appendTo(msg);
            msg.css({
                visibility: '',
                left: ($(document).width() - msg.width()) / 2,
                top: ($(document).height() - msg.height()) / 2
            });
            overlay.css({ zIndex: _screenLayer + 1 });
            msg.css({ zIndex: _screenLayer + 2 });
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
            var err = { httpCode: jqXHR.status, status: status, error: jqXHR.responseJSON, message: error };
            console.log({ err: err, xhr: jqXHR });
            if (err.httpCode >= 299) {
                $.pic.modalDialog.createApiError(err);
            }
        };
        var cbShowSuccess = function (data, status, jqXHR) { };
        var useProxy = makeBool($('body').attr('data-apiproxy'));
        var serviceUrl = useProxy ? '/njsPC' + (!url.startsWith('/') ? '/' : '') + url : $('body').attr('data-apiserviceurl') + (!url.startsWith('/') ? '/' : '') + url;
        if (serviceUrl.startsWith('/')) {
            serviceUrl = serviceUrl.substring(1);
        }

        console.log({ serviceUrl: serviceUrl, useProxy: useProxy });

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
jQuery.each(['get', 'put', 'delete', 'post'], function (i, method) {
    jQuery[method + 'FileApiService'] = function (url, data, message, successCallback, errorCallback, completeCallback) {
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
            msg = $('<div style="visibility:hidden;"></div>').addClass('picServiceStatusMsg').appendTo(document.body);
            overlay = $('<div style="background-color:lavender;opacity:.15"></div>').addClass('ui-widget-overlay').addClass('ui-front').appendTo(document.body);
            if (message instanceof jQuery) message.appendTo(msg);
            else
                $('<div></div>').html(message).appendTo(msg);
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
            var err = { httpCode: jqXHR.status, status: status, error:error };
            console.log(err);
            if (err.httpCode >= 299) {
                $.pic.modalDialog.createApiError(err);
            }
        };
        var cbShowSuccess = function (data, status, jqXHR) { };
        var useProxy = makeBool($('body').attr('data-apiproxy'));
        var serviceUrl = useProxy ? '/njsPC' + (!url.startsWith('/') ? '/' : '') + url : $('body').attr('data-apiserviceurl') + (!url.startsWith('/') ? '/' : '') + url;
        if (serviceUrl.startsWith('/')) serviceUrl = serviceUrl.substring(1);
        console.log({ serviceUrl: serviceUrl, useProxy: useProxy });

        // Set up the callbacks.
        successCallback = $.mergeCallbacks(successCallback, cbShowSuccess);
        errorCallback = $.mergeCallbacks(errorCallback, cbShowError);
        completeCallback = $.mergeCallbacks(completeCallback, cbComplete);
        console.log({ method: method, url: url, data: typeof data === 'string' ? data : JSON.stringify(data) });
        return jQuery.ajax({
            url: serviceUrl,
            type: method,
            dataType: 'binary',
            processData: false,
            contentType: 'application/json; charset=utf-8',
            data: typeof data === 'string' ? data : JSON.stringify(data),
            cache: false,
            xhrFields: { responseType: 'blob' },
            error: errorCallback,
            success: successCallback,
            complete: completeCallback
        });
    };
});
function getStorage(name, def) {
    if (typeof Storage === 'undefined') return getCookie(name, def);
    else {
        var val = localStorage.getItem(name);
        //console.log(`Getting data using local storage method: ${name}/${val}`);
        return typeof val === 'undefined' || !val ? def : val;
    }
}
function setStorage(name, value) {
    if (typeof Storage === 'undefined') return setCookie(name, val);
    else {
        //console.log(`Setting data using local storage method: ${name}/${value}`);
        localStorage.setItem(name, value);
    }
}
function getCookie(name, def ) {
    var cooks = document.cookie.split(';');
    for (var i = 0; i < cooks.length; i++) {
        var cook = cooks[i];
        while (cook.charAt(0) === ' ') cook = cook.substring(1, cook.length);
        if (cook.indexOf(name + '=') === 0) return cook.substring(name.length + 1, cook.length);
    }
    return def;
}
function setCookie(name, value, days) {
    var expires = '';
    if (typeof days === 'number' && data !== 0) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toGMTString();
    }
    else if (typeof days === 'undefined')
    document.cookie = name + '=' + value + ';expires=' + expires + '; path=/';
}


var dataBinder = {
    checkRequired: function (el, show) {
        var isValid = true;
        el.find('*[data-required=true]').each(function () {
            var val = null;
            if (typeof this.isEmpty === 'function') {
                if (this.isEmpty()) {
                    isValid = false;
                    if (typeof this.label === 'function')
                        $('<div></div>').appendTo($(this)).fieldTip({ message: this.label().text() + ' is Required' });
                    else 
                        $('<div></div>').appendTo($(this)).fieldTip({ message: 'Value is Required' });
                }
            }
            else if (typeof this.val === 'function') {
                val = this.val();
                if (typeof val === 'undefined') {
                    isValid = false;
                    if (typeof this.label === 'function')
                        $('<div></div>').appendTo($(this)).fieldTip({ message: this.label().text() + ' is Required' });
                    else
                        $('<div></div>').appendTo($(this)).fieldTip({ message: 'Value is Required' });
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
                            if (typeof tval !== 'number') tval = parseFloat(tval);
                            tval = tval.format($this.attr('data-fmtmask'), $this.attr('data-fmtempty') || '');
                            break;
                        case 'duration':
                            tval = dataBinder.formatDuration(tval, $this.attr('data-fmtmask'));
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
        if (val === null) return;
        if (typeof val === 'undefined') return val;
        if (typeof val === 'number') return val;
        if (typeof val.getMonth === 'function') return val.getTime();
        var tval = val.replace(/[^0-9\.\-]+/g, '');
        return tval.indexOf('.') !== -1 ? parseFloat(tval) : parseInt(tval, 10);
    },
    formatDuration: function (dur, fmtMask) {
        var fmt = '';
        let hrs = Math.floor(dur / 3600);
        let min = Math.floor((dur - (hrs * 3600)) / 60);
        let sec = dur - ((hrs * 3600) + (min * 60));
        if (hrs > 1) fmt += (hrs + 'hrs');
        else if (hrs > 0) fmt += (hrs + 'hr');
        if (min > 0) fmt += ' ' + (min + 'min');
        if (sec > 0) {
            if (typeof fmtMask !== 'undefined') {
                let ssec = sec.format(fmtMask, '');
                if (ssec !== '' && ssec.length > 0)
                    fmt += (' ' + ssec + 'sec');
            }
            else
                fmt += ' ' + (sec + 'sec');
        }
        return fmt.trim();
    },
    formatEndTime: function (tnow, endTime) {
        // this fn takes two dates
        let diffInMS = (endTime -tnow) / 1000;
        let days = Math.floor(diffInMS / 86400);
        diffInMS -= days * 86400;
        let hrs = Math.floor(diffInMS / 3600) % 24;
        diffInMS -= hrs * 3600;
        let min = Math.floor(diffInMS / 60) % 60;
        var fmt = '';
        if (days > 0) fmt += days + 'd';
        if (hrs > 0) fmt += (hrs + 'h');
        if (days === 0 && min > 0) fmt += ' ' + (min + 'm');
        if (days <= 0 && hrs <= 0 && min <= 1) fmt = "<1m";
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
    },
    parseValue: function (val, dataType) {
        switch (dataType) {
            case 'int':
                return Math.floor(this.parseNumber(val));
            case 'uint':
                return Math.abs(this.parseNumber(val));
            case 'float':
            case 'real':
            case 'double':
            case 'decimal':
            case 'number':
                return this.parseNumber(val);
            case 'date':
                if (typeof val === 'string') return Date.parseISO(val);
                else if (typeof val === 'number') return new Date(number);
                else if (typeof val.getMonth === 'function') return val;
                return undefined;
            case 'time':
                var dt = new Date();
                if (typeof val === 'number') {
                    dt.setHours(0, 0, 0);
                    dt.addMinutes(tval);
                    return dt;
                }
                else if (typeof val === 'string' && val.indexOf(':') !== -1) {
                    var n = val.lastIndexOf(':');
                    var min = this.parseNumber(val.substring(n));
                    var nsp = val.substring(0, n).lastIndexOf(' ') + 1;
                    var hrs = this.parseNumber(val.substring(nsp, n));
                    dt.setHours(0, 0, 0);
                    if (hrs <= 12 && val.substring(n).indexOf('p')) hrs += 12;
                    dt.addMinutes(hrs * 60 + min);
                    return dt;
                }
                break;
            case 'duration':
                if (typeof val === 'number') return val;
                return Math.floor(this.parseNumber(val));
            default:
                return val;
        }
    },
    formatValue: function (val, dataType, fmtMask, emptyMask) {
        var v = this.parseValue(val, dataType);
        if (typeof v === 'undefined') return emptyMask || '';
        switch (dataType) {
            case 'int':
            case 'uint':
            case 'float':
            case 'real':
            case 'double':
            case 'decimal':
            case 'number':
                return v.format(fmtMask, emptyMask || '');
            case 'time':
            case 'date':
            case 'dateTime':
                return v.format(fmtMask, emptyMask || '');
            case 'duration':
                return this.formatDuration(dur);
        }
        return v;
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
            let div = $('<div class="picFieldTip-message"></div>');
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
    $.widget("pic.toggleButton", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initToggleButton();
        },
        _initToggleButton: function () {
            var self = this, o = self.options, el = self.element;
            let div = $('<div class="picIndicator"></div>');
            el.addClass('picToggleButton');
            //el.addClass('btn');
            el[0].val = function (val) { return self.val(val); };
            if (o.bind) el.attr('data-bind', o.bind);
            if (typeof o.style === 'object') el.css(o.style);
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
    $.widget("pic.actionButton", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initActionButton();
        },
        _initActionButton: function () {
            var self = this, o = self.options, el = self.element;
            if (typeof o.id !== 'undefined') el.attr('id', o.id);
            let icon = $('<span class="picButtonIcon"></span>');
            let text = $('<span class="picButtonText"></span>');
            icon.appendTo(el);
            text.appendTo(el);
            if (o.icon) icon.html(o.icon);
            el.addClass('picActionButton');
            el.addClass('btn');
            if (o.text) text.text(o.text);
            el[0].buttonText = function (val) { return self.buttonText(val); };
            if (o.bind) el.attr('data-bind', o.bind);
            el[0].buttonIcon = function (val) { return self.buttonIcon(val); };
            el[0].disabled = function (val) { return self.disabled(val); };
            if (typeof o.style === 'object') el.css(o.style);
        },
        buttonText: function (val) {
            var self = this, o = self.options, el = self.element;
            return el.find('span.picButtonText').text(val);
        },
        buttonIcon: function (val) {
            var self = this, o = self.options, el = self.element;
            el.find('span.picButtonIcon').html(val);
        },
        disabled: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined')
                return el.hasClass('disabled');
            else {
                if (val) el.addClass('disabled');
                else el.removeClass('disabled');
            }
        }
    });
    $.widget("pic.optionButton", {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].val = function (val) { return self.val(val); };
            el[0].buttonText = function (val) { return self.buttonText(val); };
            el[0].isEmpty = function () { return self.isEmpty(); };
            el[0].required = function (val) { return self.required(val); };
            if (o.required === true) self.required(true);
            el[0].disabled = function (val) { return self.disabled(val); };
            self._initOptionButton();
        },
        _initOptionButton: function () {
            var self = this, o = self.options, el = self.element;
            let text = $('<span class="picButtonText"></span>');
            var toggle = $('<div class="picOptionToggle"></div>');
            toggle.appendTo(el);
            toggle.toggleButton();
            text.appendTo(el);
            if (o.icon) icon.html(o.icon);
            el.addClass('picOptionButton');
            el.addClass('btn-border');
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
            if (typeof o.style === 'object') el.css(o.style);
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
        },
        disabled: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined')
                return el.hasClass('disabled');
            else {
                if (val) el.addClass('disabled');
                else el.removeClass('disabled');
            }
        }
    });
    $.widget("pic.valueSpinner", {
        options: {
            lastChange: 0, min:0, max:9999999999, ramp: 40, ramps: 0, fmtMask: '#,##0.####', fmtEmpty: '', step: 1, inputAttrs: {}, labelAttrs: {} },
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
            el[0].minVal = function (val) { return self.minVal(val); };
            el[0].maxVal = function (val) { return self.maxVal(val); };
            el[0].units = function (val) { return self.units(val); };
            el[0].disabled = function (val) { return self.disabled(val); };
            if (o.required === true) self.required(true);
            //$('<label class="picSpinner-label"></label><div class="picSpinner-down fld-btn-left"><i class="fas fa-minus"></i></div><div class="picSpinner-value fld-value-center"></div><div class="picSpinner-up fld-btn-right"><i class="fas fa-plus"></i></div><span class="picSpinner-units picUnits"></span>').appendTo(el);
            $('<label></label>').addClass('picSpinner-label').appendTo(el);
            $('<div></div>').addClass('picSpinner-down').addClass('fld-btn-left').appendTo(el).append($('<i class="fas fa-minus"></i>'));
            if (o.canEdit) {
                $('<div></div>').addClass('picSpinner-value').addClass('fld-value-center').attr('contenteditable', true).appendTo(el)
                    .on('focusout', function (evt) {
                        var v = o.val;
                        var val = Number($(evt.target).text().replace(/[^0-9\.\-]+/g, ''));
                        if (isNaN(val)) self.val(o.min);
                        else self.val(val);
                        if (v !== o.val) self._fireValueChanged();
                    });
            }
            else {
                $('<div></div>').addClass('picSpinner-value').addClass('fld-value-center').appendTo(el);
            }
            $('<div></div>').addClass('picSpinner-up').addClass('fld-btn-right').appendTo(el).append($('<i class="fas fa-plus"></i>'));
            $('<span></span>').addClass('picSpinner-units').addClass('picUnits').attr('data-bind', o.unitsBinding).appendTo(el);

            if (typeof o.min === 'undefined' || o.min === null) o.min = 0;
            if (typeof o.val === 'undefined' || o.val === null) o.val = o.min;
            el.find('div.picSpinner-value').text(o.val.format(o.fmtMask, o.fmtEmpty));
            el.find('span.picSpinner-units').html(o.units);
            self._applyStyles();
            if (typeof o.value !== 'undefined') self.val(o.value);
            if (typeof o.binding !== 'undefined') el.attr('data-bind', o.binding);
            if (o.labelText) el.find('label.picSpinner-label:first').html(o.labelText);
            el.on('mousedown touchstart', 'div.picSpinner-down', function (evt) {
                if (!el.hasClass('disabled')) self._rampDecrement();
                evt.preventDefault();
                evt.stopPropagation();
            });
            el.on('mousedown touchstart', 'div.picSpinner-up', function (evt) {
                if (!el.hasClass('disabled')) self._rampIncrement();
                evt.preventDefault();
                evt.stopPropagation();
            });
            el.on('mouseup touchend', 'div.picSpinner-up, div.picSpinner-down', function (evt) {
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
            o.val = Math.round(Math.max(o.min, o.val - o.step) * 100000000) / 100000000;
            if (isNaN(o.val)) {
                console.log({ msg: 'Got a NaN value from the format', val: o.val, min: o.min, step: o.step });
            }
            var txt = o.val.format(o.fmtMask, o.fmtEmpty);
            if (txt === 'NaN') console.log({ msg: 'Got a NaN value from the format', val: o.val, min: o.min, step: o.step });

            el.find('div.picSpinner-value').text(txt);
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
        minVal: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return o.min;
            o.min = val;
            if (o.val < o.min) self.val(o.min);
        },
        maxVal: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return o.max;
            o.max = val;
            if (o.val > o.max) self.val(o.max);
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return o.val;
            if (val > o.max) val = o.max;
            else if (val < o.min) val = o.min;
            o.val = Math.min(Math.max(o.min, val), o.max);
            let fld = el.find('div.picSpinner-value');
            // Only set the value back if we are not editing it.
            if (fld[0] !== document.activeElement) fld.text(o.val.format(o.fmtMask, o.fmtEmpty));
        },
        units: function (val) {
            var self = this, o = self.options, el = self.element;
            return el.find('span.picSpinner-units').text(val);
        },
        disabled: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return el.hasClass('disabled');
            else {
                if (val) {
                    el.addClass('disabled');
                    el.children('div').addClass('disabled');
                }
                else {
                    el.removeClass('disabled');
                    el.children('div').removeClass('disabled');
                }
                el.find('.picSpinner-value').attr('contenteditable', val || !o.canEdit ? false : true);
            }
        }

    });
    $.widget("pic.timeSpinner", {
        options: {
            lastChange: 0, ramp: 40, ramps: 0, fmtMask: 'hh:mmtt', fmtEmpty: '', step: 30, inputAttrs: {}, labelAttrs: {}
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initValueSpinner();
        },
        _rampIncrement: function () {
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
            el[0].units = function (val) { return self.units; };
            if (o.required === true) self.required(true);
            $('<label class="picSpinner-label"></label><div class="picSpinner-down fld-btn-left"><i class="fas fa-minus"></i></div><input type="text" class="picSpinner-value fld-value-center"></input><div class="picSpinner-up fld-btn-right"><i class="fas fa-plus"></i></div><span class="picSpinner-units picUnits"></span>').appendTo(el);
            if (typeof o.min === 'undefined') o.min = 0;
            if (typeof o.val === 'undefined') o.val = o.min;
            // format our time based upon minutes from midnight.
            el.find('input.picSpinner-value').val(o.val.formatTime(o.fmtMask, o.fmtEmpty));
            el.find('span.picSpinner-units').text(o.units);
            self._applyStyles();
            if (typeof o.value !== 'undefined') self.val(o.value);
            if (typeof o.binding !== 'undefined') el.attr('data-bind', o.binding);
            if (o.labelText) el.find('label.picSpinner-label:first').html(o.labelText);
            el.on('mousedown touchstart', 'div.picSpinner-down', function (evt) {
                self._rampDecrement();
                evt.preventDefault();
                evt.stopPropagation();
            });
            el.on('mousedown touchstart', 'div.picSpinner-up', function (evt) {
                self._rampIncrement();
                evt.preventDefault();
                evt.stopPropagation();
            });
            el.on('mouseup touchend', 'div.picSpinner-up, div.picSpinner-down', function (evt) {
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
            el.on('change', 'input.picSpinner-value', function (evt) {
                self.val(self.parseTime($(evt.currentTarget).val()));
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
            var fld = el.find('input.picSpinner-value:first');
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
            el.find('input.picSpinner-value').val(o.val.formatTime(o.fmtMask, o.fmtEmpty));
            o.lastChange = new Date().getTime();
            return o.val;
        },
        decrement: function () {
            var self = this, o = self.options, el = self.element;
            o.val = Math.max(o.min, o.val - o.step);
            el.find('input.picSpinner-value').val(o.val.formatTime(o.fmtMask, o.fmtEmpty));
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
        parseTime: function (val) {
            var self = this, o = self.options, el = self.element;
            var indexOfAny = function (str, arrChars) {
                for (var char in arrChars) {
                    var ndx = str.indexOf(arrChars[char]);
                    if (ndx !== -1) return ndx;
                }
                return -1;
            };
            // RSG: 3/18/22 made changes because 8:00pm was not parsing properly
            var bAddHrs = indexOfAny(val, ['P', 'p']) !== -1;
            var hrs = 0;
            var mins = 0;
            // Get rid of any text that is not a number or a colon.
            var stripped = val.replace(/[^\d\:\s]/g, '');
            // Remove multiple spaces for colon
            stripped = stripped.replace(/\s+/g, ':');
            // Remove multiple colons
            stripped = stripped.replace(/\:+/g, ':');
            if (stripped.indexOf(':') !== -1) arr = stripped.split(':');
            else if (stripped.length === 1) arr = [stripped.substring(0, 1), '0'];
            else if (stripped.length === 2) arr = [stripped, '0'];
            else if (stripped.length === 3) arr = [stripped.substring(0, 1), stripped.substring(1)];
            else if (stripped.length > 2) arr = [stripped.substring(0, 1), stripped.substring(2)];
            if (arr.length > 0) {
                hrs = parseInt(arr[0].replace(/\D/g), 10);
                //bAddHrs = (indexOfAny(arr[0], ['P', 'p']) !== -1);
                if (hrs === 12 && !bAddHrs) hrs = 0;
            }
            if (arr.length > 1) {
                mins = parseInt(arr[1].replace(/\D/g), 10);
                //bAddHrs = (indexOfAny(arr[1], ['P', 'p']) !== -1);
                //if (hrs === 12 && !bAddHrs) hrs = 0;
            }
            if (isNaN(hrs)) hrs = 0;
            if (isNaN(mins)) mins = 0;
            if (bAddHrs && hrs < 12) hrs += 12;
            //console.log({ val: val, hrs: hrs, mins: mins, num:(hrs * 60) + mins });
            return (hrs * 60) + mins;

        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') { return o.val; }
            if (val > o.max) val = o.max;
            else if (val < o.min) val = o.min;
            //console.log({ m: 'Setting time', val: val, fmt: o.fmtMask, text: val.formatTime(o.fmtMask, o.fmtEmpty) });
            o.val = Math.min(Math.max(o.min, val), o.max);
            el.find('input.picSpinner-value').val(val.formatTime(o.fmtMask, o.fmtEmpty));
        },
        units: function (val) {
            var self = this, o = self.options, el = self.element;
            el.find('input.picSpinner-units').text(val);
        }
    });
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
                let divOpt = $('<div class="picOption"><div class="picIndicator"></div><label class="picOption"></label></div>');
                divOpt.appendTo(el);
                divOpt.find('label.picOption').text(opt.desc);
                divOpt.attr('data-name', opt.name);
                divOpt.attr('data-val', opt.val);
                if (opt.val === o.val) divOpt.find('div.picIndicator').attr('data-status', 'selected');
                if (typeof o.style !== 'undefined') el.css(o.style);
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
    $.widget("pic.tabBar", {
        options: {
            isInteractive: true,
            isEnabled: true
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picTabBar');
            $('<div class="picTabs"></div>').prependTo(el);
            $('<div class="picTabContents tab-contents"></div>').appendTo(el);
            el.find('div.picTabs:first').on('click', 'div.picTab', function (evt) {
                // Set the active tab here.
                self.selectTabById($(evt.currentTarget).attr('data-tabid'));
                evt.preventDefault();
            });
            el[0].tabContent = function (tabId) { return self.tabContent(tabId); };
            el[0].selectTabById = function (tabId) { return self.selectTabById(tabId); };
            el[0].selectedTabId = function (tabId) { return self.selectedTabId(tabId); };
            el[0].addTab = function (tabObj) { return self.addTab(tabObj); };
            el[0].showTab = function (tabId, show) { return self.showTab(tabId, show); }
            el[0].selectFirstVisibleTab = function () { return self.selectFirstVisibleTab(); }

            if (typeof o.style !== 'undefined') el.css(o.style);
            var evt = $.Event('initTabs');
            evt.contents = function () { return self.contents(); };
            el.trigger(evt);

        },
        isInDOM: function () { return $.contains(this.element[0].ownerDocument.documentElement, this.element[0]); },
        showTab: function (tabId, show) {
            var self = this, o = self.options, el = self.element;
            var tab = el.find('div.picTabs:first').children('div.picTab[data-tabid="' + tabId + '"]');
            //console.log({ msg: 'Showing tab', tab: tab, show: show });
            if (show) tab.show();
            else tab.hide();
            if (tab.hasClass('picTabSelected')) {
                if (show) self.contents().find('div.picTabContent[data-tabid=' + tabId + ']').show();
                else self.contents().find('div.picTabContent[data-tabid=' + tabId + ']').hide();
            }
        },
        selectFirstVisibleTab: function () {
            var self = this, o = self.options, el = self.element;
            var tabId = '';
            el.find('div.picTabs:first').children('div.picTab').each(function () {
                if ($(this).css('display') !== 'none') {
                    tabId = $(this).attr('data-tabId');
                    self.selectTabById(tabId);
                    return false;
                }
            });
            return tabId;
        },
        selectTabById: function (tabId) {
            var self = this, o = self.options, el = self.element;
            var evt = $.Event('tabchange');
            if (o.tabId) {
                evt.oldTab = { id: o.tabId, contents: self.tabContent(o.tabId) };
            }
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
            var tab = $('<div class="picTab tab-item"><span class="picTabText"></span></div>');
            tab.appendTo(self.tabs());
            tab.attr('data-tabid', tabObj.id);
            tab.find('span.picTabText').each(function () { $(this).text(tabObj.text); });
            var content = $('<div class="picTabContent"></div>');
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
            autoClose: true,
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
            el.addClass('popover');
            el.attr('data-popoverid', o.id);
            el[0].toggle = function (elTarget) { self.toggle(elTarget); };
            el[0].show = function (elTarget) { self.show(elTarget); };
            el[0].hide = function () { self.hide(); };
            el[0].interactive = function (val) { self.interactive(val); };
            el[0].titleText = function (val) { return el.find('span.picPopoverTitle').html(val); };
            el[0].close = function () { return self.close(); };
            var header = $('<div class="picPopoverHeader control-panel-title"><div class="picPopoverTitle"><span class="picPopoverTitle"></span></div>').prependTo(el);
            if (!o.autoClose) {
                $('<div class="picClosePopover pover-icon picIconRight" title="Close"><i class="far fa-window-close"></i></div>').appendTo(header.find('div.picPopoverTitle:first'));
                el.on('click', 'div.picClosePopover', function (evt) { el[0].close(); });
            }
            $('<div class="picPopoverBody"></div>').appendTo(el);
            el.find('span.picPopoverTitle').html(o.title);
            if (typeof o.style !== 'undefined') el.css(o.style);
            //el.on('click', function (evt) { evt.preventDefault(); });
            var evt = $.Event('initPopover');
            evt.contents = function () { return el.find('div.picPopoverBody'); };
            if (o.popoverStyle === 'modal') {
                o.screenLayer = _screenLayer;
                el.css({ zIndex: _screenLayer++ });
            }
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
            if (o.popoverStyle === 'modal') _screenLayer = o.screenLayer;
            if (!self.isInDOM()) return;
            var evt = $.Event('beforeClose');
            
            el.trigger(evt);
            if (evt.isDefaultPrevented() || !self.isInDOM()) return;
            $('div.ui-widget-overlay[data-popoverid=' + o.id + ']').remove();
            el.remove();
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
                o.overlay.css({ zIndex: o.screenLayer - 1 });
                if (o.autoClose) {
                    o.overlay.one('click', function () {
                        el.remove();
                        $('div.ui-widget-overlay[data-popoverid=' + o.id + ']').remove();
                    });
                }
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
            $('<label class="picPickList-label field-label"></label>').appendTo(el).text(o.labelText);
            var itm = self._getItem(o.value);
            if (o.canEdit)
                $('<div class="picPickList-value fld-value-combo"><input type="text" class="picPickList-value"></input><div>').addClass('editable').appendTo(el);
            else
                $('<div class="picPickList-value fld-value-combo"></div>').appendTo(el).attr('data-placeholder', o.placeHolder);
            var col = self._getColumn(o.displayColumn);
            if (itm && col) self.text(itm[col.binding]);
            $('<div class="picPickList-drop fld-btn-right"><i class="fas fa-caret-down"></i></div>').appendTo(el);
            $('<span></span>').addClass('picSpinner-units').addClass('picUnits').attr('data-bind', o.unitsBinding).appendTo(el);

            el.attr('data-bind', o.binding);
            el[0].label = function () { return el.find('label.picPickList-label:first'); };
            el[0].field = function () { return el.find('div.picPickList-value:first'); };
            el[0].text = function (text) { return self.text(text); };
            el[0].val = function (val) { return self.val(val); };
            el[0].disabled = function (val) { return self.disabled(val); };
            el[0].isEmpty = function () { return self.isEmpty(); };
            el[0].required = function (val) { return self.required(val); };
            el[0].items = function (val) { self.itemList(val); };
            el[0].placeHolder = function (val) { el.find('div.picPickList-value:first').attr('data-placeholder', val); };
            if (typeof o.id !== 'undefined') el.attr('id', o.id);
            el.attr('data-val', o.value);
            if (o.required === true) self.required(true);
            el.attr('data-datatype', o.dataType);
            el.find('span.picSpinner-units').html(o.units);
            self._applyStyles();
            el.find('div.picPickList-drop').on('click', function (evt) {
                var div = el.find('div.picPickList-options:first');
                evt.stopImmediatePropagation();
                evt.preventDefault();
                if (div.length > 0) {
                    div.remove();
                    return;
                }
                else {
                    $('div.picPickList-options:first').remove();
                    if (!el.hasClass('disabled'))
                        self._buildOptionList();
                }
            });
            el.find('div.picPickList-drop').on('mousedown touchstart', function (evt) {
                evt.stopImmediatePropagation();
               
            });
            el.on('change', 'input.picPickList-value', function (evt) {
                self.val(el.find('input.picPickList-value:first').val());
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
                        if (o.canEdit) fld.attr('maxlength', o.inputAttrs[ia]);
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
        _buildTblOuter: function () {
            var self = this, o = self.options, el = self.element;
            var tblOuter = $('<table></table>').addClass('optOuter');
            var tblBody = $('<tbody></tbody>').appendTo(tblOuter);
            var rowHeader = $('<tr></tr>').addClass('optHeader').addClass('header-background').appendTo(tblBody);
            var cellHeader = $('<td></td>').appendTo(rowHeader);
            self._buildOptionHeader().appendTo(cellHeader);
            var rowBody = $('<tr></tr>').appendTo(tblBody).addClass('optBody');
            var cellBody = $('<td></td>').appendTo(rowBody);
            var divBody = $('<div></div>').addClass('optBody').appendTo(cellBody);
            $('<div></div>').appendTo(divBody);
            var rowFooter = $('<tr></tr>').addClass('optFooter').appendTo(tblBody);
            $('<td></td>').appendTo(rowFooter);
            return tblOuter;
        },
        _buildOptionList: function () {
            var self = this, o = self.options, el = self.element;
            div = $('<div class="picPickList-options dropdown-panel"></div>');
            //var tblOuter = $('<table class="optOuter"><tbody><tr class="optHeader header-background"><td></td></tr><tr class="optBody"><td><div class="optBody"><div></div></div></td></tr><tr class="optFooter"><td></td></tr></tbody></table>').appendTo(div);
            var tblOuter = self._buildTblOuter().appendTo(div);
            //self._buildOptionHeader().appendTo(tblOuter.find('tr.optHeader:first > td'));
            var tbody = $('<table class="optBody"><tbody></tbody></table>').appendTo(tblOuter.find('div.optBody > div:first'));
            var val = self.val();
            for (var i = 0; i < o.items.length; i++) {
                var row = $('<tr></tr>').appendTo(tbody);
                var itm = o.items[i];
                for (var j = 0; j < o.columns.length; j++) {
                    var col = o.columns[j];
                    if (j === o.bindColumn) {
                        row.attr('data-value', itm[col.binding]);
                        if (typeof val !== 'undefined' && val !== null && val.toString() === itm[col.binding].toString()) row.addClass('selected');
                    }
                    var td = $('<td></td>').appendTo(row);
                    var span = $('<span class="optText"></span>').appendTo(td);
                    if (col.style) td.css(col.style);
                    if (col.hidden) td.hide();
                    span.text(itm[col.binding]);

                }
            }
            div.appendTo(el);
            if (o.dropdownStyle) div.css(o.dropdownStyle);
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
                evt.stopImmediatePropagation();
                self.val($(evt.currentTarget).attr('data-value'));
                setTimeout(function () { div.remove(); }, 0);
            });
        },
        _getOffset: function (el) {
            var off = { left: 0, top: 0 };
            el = el[0];
            while (el) {
                off.left += el.offsetLeft;
                off.top += el.offsetTop;
                el = el.offsetParent;
            }
            return off;
        },
        _getPosition: function (el) {
            el = el[0];
            parent = el.parent;
            var rect = el.getBoundingClientRect(el);
            var prect = parent ? parent.getBoundingClientRect(parent) : { left: 0, top: 0 };
            return { left: rect.left - prect.left, top: rect.top - prect.top };
        },
        _positionPickList: function (div) {
            var self = this, o = self.options, el = self.element;
            var fld = el.find('div.picPickList-value:first');
            var fldDims = { pos: fld.position(), off: fld.offset() };
            div.css({ left: fldDims.pos.left + 'px' });
            var divDims = { off: self._getOffset(div), pos: div.position(), height: div.outerHeight(), width: div.outerWidth() };
            var docDims = { height: document.documentElement.clientHeight, width: $(document).outerWidth() };

            var lbl = el.find('label.picPickList-label:first');
            var lblDims = { off: self._getOffset(lbl), pos: lbl.position(), height: lbl.outerHeight, width: lbl.outerWidth() };
            if (divDims.height > docDims.height) {
                div.css({ height: docDims.height + 'px' });
                divDims.height = docDims.height;
            }
            if (divDims.off.top + divDims.height > docDims.height)
                divDims.pos.top -= (divDims.off.top + divDims.height - docDims.height);
            div.css({ top: divDims.pos.top + 'px' });

            // We have to treat the width and height separately as we will be repositioning after a scrollbar disappears potentially.
            divDims = { off: div.offset(), pos: div.position(), height: div.outerHeight(), width: div.outerWidth() };
            docDims = { pos: $(document.documentElement).position(), height: document.documentElement.clientHeight, width: $(document).outerWidth() };
            if (divDims.off.left + divDims.width > docDims.width) {
                divDims.pos.left -= (divDims.off.left + divDims.width - docDims.width);
                div.css({ left: divDims.pos.left });
            }
        },
        _getColumn: function (nCol) {
            var self = this, o = self.options, el = self.element;
            return o.columns[nCol];
        },
        _getItem: function (value) {
            var self = this, o = self.options, el = self.element;
            if (typeof value === 'undefined' || value === null) return;
            var bind = self._getColumn(o.bindColumn);
            for (var i = 0; i < o.items.length; i++) {
                var itm = o.items[i];
                var val = typeof itm !== 'undefined' && typeof itm[bind.binding] !== 'undefined' ? itm[bind.binding] : '';
                if (value.toString() === val.toString()) return itm;
            }
        },
        itemList: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return o.items;
            else {
                var cv = self.val();
                o.items = val;
                self.val(cv);
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
            if (typeof text !== 'undefined') {
                if (o.canEdit)
                    el.find('input.picPickList-value').val(text);
                else
                    el.find('div.picPickList-value').html(text);
            }
            else
                return o.canEdit ? el.find('input.picPickList-value').val : el.find('div.picPickList-value').text();
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
            var itm, oldItem;
            if (o.canEdit) {
                var fld = el.find('input.picPickList-value:first');
                if (typeof val !== 'undefined') {
                    if (el.attr('data-datatype') === 'int' && typeof val === 'string') {
                        var match = val.match(/(\d+)/g);
                        if (match) {
                            val = parseInt(match.join(''), 10);
                        }
                    }
                    //console.log({ m: 'Setting Val', oldVal: o.value, newVal: val });
                    evt = $.Event('changed');
                    evt.oldVal = o.value;
                    evt.newVal = val;
                    itm = self._getItem(evt.newVal);
                    o.value = evt.newVal;
                    if (evt.oldVal !== evt.newVal) {
                        fld.val(val);
                        // Trigger a selection changed.
                        oldItem = typeof o.value !== 'undefined' ? self._getItem(o.value) : undefined;
                        evt.oldItem = oldItem;
                        evt.newItem = itm;
                        el.trigger(evt);
                    }
                }
                else return fld.val();
            }
            else {
                if (typeof val !== 'undefined') {
                    itm = self._getItem(val);
                    var colVal = self._getColumn(o.bindColumn);
                    if (typeof itm !== 'undefined') {
                        if (itm[colVal.binding] !== o.value) {
                            var colText = self._getColumn(o.displayColumn);
                            // Trigger a selection changed.
                            oldItem = typeof o.value !== 'undefined' ? self._getItem(o.value) : undefined;
                            let bcevt = $.Event('beforeselchange');
                            bcevt.oldItem = oldItem;
                            bcevt.newItem = itm;
                            el.trigger(bcevt);
                            if (!bcevt.isDefaultPrevented()) {
                                o.value = bcevt.newItem[colVal.binding];
                                self.text(bcevt.newItem[colText.binding]);
                                let evt = $.Event('selchanged');
                                evt.oldItem = bcevt.oldItem;
                                evt.newItem = bcevt.newItem;
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
        }
    });
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
            $('<label></label>').appendTo(el).text(o.labelText);
            if (o.multiLine) {
                el.addClass('multiline');
                $('<textarea class="picInputField-value"></textarea>').addClass('fld-value').appendTo(el);
            }
            else
                $('<input type="text" class="picInputField-value"></input>').addClass('fld-value').appendTo(el);
            
            self.val(o.value);
            el.attr('data-bind', o.binding);
            el.attr('data-datatype', o.dataType);
            el.attr('data-fmtmask', o.fmtMask);
            el.attr('data-emptyMask', o.emptyMask);
            self._applyStyles();
            el[0].label = function () { return el.find('label:first'); };
            el[0].field = function () { return el.find('.picInputField-value:first'); };
            el[0].text = function (text) { return self.text(text); };
            el[0].val = function (val) { return self.val(val); };
            el[0].disabled = function (val) { return self.disabled(val); };
            el[0].isEmpty = function () { return self.isEmpty(); };
            el[0].required = function (val) { return self.required(val); };
            if (o.required === true) self.required(true);
            el.on('change', '.picInputField-value', function (evt) { self.formatField(); });
        },
        _applyStyles: function () {
            var self = this, o = self.options, el = self.element;
            var fld = el.find('.picInputField-value:first');
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
        formatField: function () {
            var self = this, o = self.options, el = self.element;
            var dataType = el.attr('data-datatype') || 'string';
            if (dataType !== 'string') {
                var v = self.val();
                self.val(v);
            }
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            //if (typeof val === 'undefined') console.log({ msg: 'Getting field value', val: el.find('input.picInputField-value:first').val(val) });
            var dataType = el.attr('data-datatype') || 'string';
            var fld = el.find('.picInputField-value:first');
            if (typeof val === 'undefined')
                return dataBinder.parseValue(fld.val(), dataType);
            else {
                // Do not set the value on an active field the user is editing here.
                //if (document.activeElement === fld[0]) return;
                fld.val(dataBinder.formatValue(val, dataType, el.attr('data-fmtmask'), el.attr('data-emptymask')));
            }
        },
        disabled: function (val) {
            var self = this, o = self.options, el = self.element;
            var fld = el.find('.picInputField-value:first');
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
    $.widget("pic.staticField", {
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
            if (o.bind) el.attr('data-bind', o.bind);
            if (typeof o.id !== 'undefined') el.attr('id', o.id);
            el.addClass('picStaticField');
            $('<label></label>').appendTo(el).text(o.labelText);
            if (o.multiLine) {
                el.addClass('multiline');
                $('<div class="picStaticField-value"></div>').addClass('static-fld-value').appendTo(el);
            }
            else
                $('<span type="text" class="picStaticField-value"></span>').addClass('static-fld-value').appendTo(el);
            el.attr('data-bind', o.binding);
            el.attr('data-datatype', o.dataType);
            el.attr('data-fmtMask', o.fmtMask);
            el.attr('data-emptyMask', o.emptyMask);
            $('<span class="picStatic-units picUnits"></span>').attr('data-bind', o.unitsBinding).appendTo(el);
            if (typeof o.units !== 'undefined') el.find('span.picStatic-units').html(o.units);

            self._applyStyles();
            el[0].label = function () { return el.find('label:first'); };
            el[0].field = function () { return el.find('.picStaticField-value:first'); };
            el[0].text = function (text) { return self.text(text); };
            el[0].val = function (val) { return self.val(val); };
            el[0].isEmpty = function () { return self.isEmpty(); };
            self.val(o.value);
        },
        _applyStyles: function () {
            var self = this, o = self.options, el = self.element;
            var fld = el.find('.picStaticField-value:first');
            var lbl = el.find('label:first');
            if (typeof o.style !== 'undefined') el.css(o.style);

            for (var ia in o.inputAttrs) {
                switch (ia) {
                    case 'style':
                        if (typeof o.inputAttrs[ia] === 'object') {
                            //console.log({ style: o.inputAttrs[ia], fld: fld });
                            fld.css(o.inputAttrs[ia]);
                        }
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
        },
        isEmpty: function () {
            var self = this, o = self.options, el = self.element;
            var val = self.val();
            return typeof val === 'undefined' || val.toString() === '';
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            var dataType = el.attr('data-datatype') || 'string';
            var fld = el.find('.picStaticField-value:first');
            if (typeof val === 'undefined')
                return dataBinder.parseValue(fld.html(), dataType);
            else
                fld.html(dataBinder.formatValue(val, dataType, el.attr('data-fmtmask'), el.attr('data-emptymask')));

            ////if (typeof val === 'undefined') console.log({ msg: 'Getting field value', val: el.find('input.picStaticField-value:first').val(val) });
            //if (el.attr('data-datatype') === 'int' && typeof val === 'undefined') {
            //    var v = el.find('.picStaticField-value:first').html();
            //    var match = v.match(/(\d+)/g);
            //    return (match) ? parseInt(match.join(''), 10) : undefined;
            //}
            //return typeof val !== 'undefined' ? el.find('.picStaticField-value:first').html(val) : el.find('.picStaticField-value:first').html();
        },
        disabled: function (val) {
            var self = this, o = self.options, el = self.element;
            var fld = el.find('.picStaticField-value:first');
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
    $.widget("pic.dateField", {
        options: {
            inputAttrs: {},
            labelAttrs: {}
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initDateField();
        },
        _initDateField: function () {
            var self = this, o = self.options, el = self.element;
            if (o.bind) el.attr('data-bind', o.bind);
            $('<label class="picPickList-label"></label>').appendTo(el).text(o.labelText);
            if (o.canEdit)
                $('<div class="picPickList-value"><input type="text" class="picPickList-value"></input><div>').addClass('editable').appendTo(el);
            else
                $('<div class="picPickList-value"></div>').appendTo(el);
            $('<input class="datepicker-hidden" type="text" style="display:none;"></input>').appendTo(el).datepicker();

            $('<div class="picPickList-drop"><i class="fas fa-calendar-day"></i></div>').appendTo(el);
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
            el.attr('data-datatype', o.dataType);
            self._applyStyles();
            el.find('div.picPickList-drop').on('click', function (evt) {
                el.find('input.datepicker-hidden').datepicker('show');
            });
            el.on('change', 'input.datepicker-hidden', function (evt) {
                var val = el.find('input.datepicker-hidden:first').val();
                self.val(el.find('input.datepicker-hidden:first').val());
            });
            el.on('change', 'input.picPickList-value', function (evt) {
                el.find('input.picPickList-value:first').val(self.val());
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
                        if (o.canEdit) fld.attr('maxlength', o.inputAttrs[ia]);
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
            if (typeof text !== 'undefined') {
                if (o.canEdit)
                    el.find('input.picPickList-value').val(text);
                else
                    el.find('div.picPickList-value').html(text);
            }
            else
                return o.canEdit ? el.find('input.picPickList-value').val : el.find('div.picPickList-value').text();
        },
        required: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') return makeBool(el.attr('data-required'));
            else el.attr('data-required', makeBool(val));
        },
        isEmpty: function () {
            var self = this, o = self.options, el = self.element;
            var val = (o.canEdit) ? el.find('input.picPickList-value:first').val() : el.find('div.picPickList-value:first').text();;
            return val === null || typeof val === 'undefined';
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            var fld;
            if (o.canEdit) {
                fld = el.find('input.picPickList-value:first');
                if (typeof val !== 'undefined') {
                    if (typeof val.parseISO === 'function') {
                        fld.val(val.format('MM/dd/yyy'));
                    }
                    else if (typeof val === 'string') {
                        var dt;
                        if (val.indexOf('T') !== -1)
                            dt = Date.parseISO(val);
                        else
                            dt = new Date(Date.parse(val));
                        fld.val(dt.format('MM/dd/yyyy', ''));
                    }
                    else fld.val(val);
                    el.find('input.datepicker-hidden:first').val(fld.val());
                }
                else return fld.val();
            }
            else {
                fld = el.find('div.picPickList-value:first');
                if (typeof val !== 'undefined') {
                    if (typeof val.parseISO === 'function') {
                        fld.text(val.format('MM/dd/yyy'));
                    }
                    else if (typeof val === 'string') {
                        var d = Date.parseISO(val);
                        fld.text(d.format('MM/dd/yyyy', ''));
                    }
                    else fld.text(val);
                    el.find('input.datepicker-hidden:first').val(fld.text());
                }
                else {
                    //if (typeof o.value === 'undefined') console.log(o);
                    return fld.text();
                }
            }
        }
    });
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
            $('<input type="checkbox" class="picCheckbox-value"></input>').appendTo(el).attr('id', o.id).on('change', function (e) {
                evt = $.Event('changed');
                evt.newVal = $(e.currentTarget).is(':checked');
                evt.oldVal = !evt.newVal;
                el.trigger(evt);
            });
            if (typeof o.labelHtml !== 'undefined')
                $('<label></label>').attr('for', o.id).appendTo(el).html(o.labelHtml);
            else
                $('<label></label>').attr('for', o.id).appendTo(el).text(o.labelText);
            self.val(o.value);
            el.attr('data-bind', o.binding);
            self._applyStyles();
            el[0].label = function () { return el.find('label:first'); };
            el[0].checkbox = function () { return el.find('input.picCheckbox-value:first'); };
            el[0].text = function (text) { return self.text(text); };
            el[0].labelHtml = function (html) { return el.find('label:first').html(html); };
            el[0].val = function (val) { return self.val(val); };
            el[0].disabled = function (val) { return self.disabled(val); };
            el[0].indeterminate = function (val) { return el.find('input.picCheckbox-value:first').prop('indeterminate', val); }
        },
        _applyStyles: function () {
            var self = this, o = self.options, el = self.element;
            var fld = el.find('input.picCheckbox-value:first');
            var lbl = el.find('label:first');
            if (typeof o.style !== 'undefined') el.css(o.style);
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
            if (typeof o.inputStyle !== 'undefined') fld.css(o.inputStyle);
            if (typeof o.labelStyle !== 'undefined') lbl.css(o.labelStyle);
        },
        disabled: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined')
                return el.hasClass('disabled');
            else {
                if (val) {
                    el.addClass('disabled');
                    el.find('input.picCheckbox-value:first').attr('disabled', true);
                }
                else {
                    el.removeClass('disabled');
                    el.find('input.picCheckbox-value:first').removeAttr('disabled');
                }
            }
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            var cb = el.find('input.picCheckbox-value:first');
            if (typeof val !== 'undefined') {
                var oldVal = cb.is(':checked');
                cb.prop('checked', makeBool(val));
                if (makeBool(val) !== makeBool(oldVal)) {
                    //console.log('Triggering checkbox');
                    evt = $.Event('changed');
                    evt.newVal = makeBool(val);
                    evt.oldVal = !evt.newVal;
                    el.trigger(evt);
                }
            }
            else return cb.is(':checked');
        }
    });
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
            var contents = $('<div class="picAccordian-contents"></div>').appendTo(el);
            el[0].titleBlock = function () { return el.find('div.picAccordian-title:first'); };
            el[0].text = function (text) { return self.text(text); };
            el[0].expanded = function (val) { return self.expanded(val); };
            el[0].columns = function () { return self.columns(); };
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
            var title = $('<div class="picAccordian-title header-background"></div>');
            for (var i = 0; i < o.columns.length; i++) {
                var div = $('<div class="picAccordian-titlecol"></div>').appendTo(title);
                var col = o.columns[i];
                div.attr('col-binding', col.binding);
                var icon = $('<i></i>').appendTo(div);
                if (col.glyph) icon.addClass(col.glyph);
                var text = $('<span class="picAccordian-title-text"></span>').appendTo(div);
                div.css(col.style);
                text.html(col.text);
            }
            $('<i class="picAccordian-title-expand fas fa-angle-double-right"></i>').appendTo(title);
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
    $.widget("pic.colorPicker", {
        options: { labelText: '', binding: ''},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initColorPicker();
        },
        _initColorPicker: function () {
            var self = this, o = self.options, el = self.element;
            $('<label class="picColorPicker-label"></label>').text(o.labelText).appendTo(el);
            $('<div class="picColorPicker-value picCSColor"></div>').appendTo(el);
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
            var divPopover = $('<div class="picCSColors"></div>');
            divPopover.appendTo(el.parent());
            divPopover.on('initPopover', function (evt) {
                let curr = el.find('div.picColorPicker-value:first').attr('data-color');
                let divColors = $('<div class= "picLightColors" data-bind="color"></div>').appendTo(evt.currentTarget);
                for (let i = 0; i < o.colors.length; i++) {
                    let color = o.colors[i];
                    let div = $('<div class="picCSColor picCSColorSelector" data-color="' + color.name + '"><div class="picToggleButton"></div><label class="picCSColorLabel"></label></div>');
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
    $.widget("pic.modalDialog", $.ui.dialog, {
        options: {
            screenLayer: 0
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].returnValue = function (value) { return self.returnValue(value); };
            el[0].dialogArguments = function (args) { return self.dialogArguments(args); };
            el[0].dialogResult = function (result) { return self.dialogResult(result); };
            var btns = o.buttons.slice();
            o.buttons = [];
            this._super('_create');
            if (typeof btns !== 'undefined') setTimeout(function () { self._buildButtons(btns); }, 0);
            o.screenLayer = _screenLayer;
            el.css({ zIndex: ++_screenLayer });
        },
        _buildButtons: function (btns) {
            var self = this, o = self.options, el = self.element;
            if (typeof btns !== 'undefined') {
                var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
                for (var i = 0; i < btns.length; i++) {
                    var btn = btns[i];
                    var b = $('<div></div>').appendTo(btnPnl).actionButton({ id: btn.id, text: btn.text, icon: btn.icon, style: btn.style });
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
        dialogArguments: function (dargs) {
            var self = this, o = self.options, el = self.element;
            if (typeof dargs === 'undefined') return o.dialogArguments;
            else o.dialogArguments = dargs;
        },
        dialogResult: function (res) {
            var self = this, o = self.options, el = self.element;
            if (typeof res === 'undefined') return o.dialogResult;
            else o.dialogResult = res;
        },
        close: function (event, ui) {
            var self = this, o = self.options, el = self.element;
            _screenLayer = o.screenLayer;
            var evt = $.Event('closemodal');
            evt.returnValue = o.returnValue;
            evt.dialogArguments = o.dialogArguments;
            evt.dialogResult = o.dialogResult;
            el.trigger(evt);
            // Close all others that are greater than this one.
            this._super('_close');
            this._destroy();
        }
    });
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
            var line = $('<div></div>').appendTo(el);
            if (typeof o.error !== 'undefined') {
                $('<label></label>').appendTo(line).addClass('errorLabel').text('Message');
                $('<span></span>').appendTo(line).addClass('errorMessage').text(o.error.message);
                if (typeof o.error.equipmentType !== 'undefined') {
                    line = $('<div></div>').appendTo(el);
                    $('<label></label>').appendTo(line).addClass('errorLabel').text('Eq Type');
                    $('<span></span>').appendTo(line).text(o.error.equipmentType);
                }
                if (typeof o.error.id !== 'undefined') {
                    line = $('<div></div>').appendTo(el);
                    $('<label></label>').appendTo(line).addClass('errorLabel').text('Eq Id');
                    $('<span></span>').appendTo(line).text(o.error.id);
                }
                if (typeof o.error.parameter !== 'undefined') {
                    line = $('<div></div>').appendTo(el);
                    $('<label></label>').appendTo(line).addClass('errorLabel').text('Param');
                    $('<span></span>').appendTo(line).text(o.error.parameter);
                    if (typeof o.error.value !== 'undefined') {
                        $('<label></label>').appendTo(line).text(' = ');
                        $('<span></span>').appendTo(line).text(o.error.value);
                    }
                }
                if (typeof o.error.service !== 'undefined') {
                    line = $('<div></div>').appendTo(el);
                    $('<label></label>').appendTo(line).addClass('errorLabel').text('Service');
                    $('<span></span>').appendTo(line).text(o.error.service);
                }
                if (typeof o.error.process !== 'undefined') {
                    line = $('<div></div>').appendTo(el);
                    $('<label></label>').appendTo(line).addClass('errorLabel').text('Process');
                    $('<span></span>').appendTo(line).text(o.error.process);
                }
                if (typeof o.error.stack !== 'undefined') {
                    var acc = $('<div></div>').appendTo(el).accordian({ columns: [{ text: 'Stack Trace', glyph: 'fab fa-stack-overflow', style: { width: '10rem' } }] });
                    var pnl = acc.find('div.picAccordian-contents');
                    var div = $('<div></div>').appendTo(pnl).addClass('picStackTrace').html(o.error.stack);
                }
            }
            else {
                $('<label></label>').appendTo(line).addClass('errorLabel').text('Message');
                if (typeof o.httpCode !== 'undefined') $('<span></span>').appendTo(line).addClass('errorMessage').text(`HTTP ${o.httpCode}: ${o.message}`);
            }
        }
    });
    $.widget("pic.virtualList", {
        options: {
            selectionType: 'none',
            columns: [],
            rows: [],
            rowHeight: 16,
            rowsPerBlock: 50,
            blocksPerCluster: 4,
            selectedIndex: -1,
            resizeDebounce: null,
            scrollDebounce: null,
            data: [],
            blockHeight: 0,
            rowsPerCluster: 0,
            currentBlock: { length: 0 },
            scrollTop: 0,
            lastCluster: 0,
            lastBlock: 0,
            hiddenRows: 0,
            blocks: {},
            isRendering: false
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].addRows = function (data) { return self.addRows(data); };
            el[0].addRow = function (data) { return self.addRow(data); };
            el[0].select = function (row) { return self.selectRow(row); };
            el[0].selectedIndex = function (ndx, scrollTo) { return typeof ndx === 'undefined' ? o.selectedIndex : self.selectRow($(o.rows[ndx].row), scrollTo); };
            el[0].clear = function (fn) { self.clear(fn); };
            el[0].render = function (recalc) { if (recalc) self._calculateBlocks(); self.render(); };
            el[0].applyFilter = function (cb) { self.applyFilter(cb); self._calculateBlocks(); self.render(); };
            el[0].clearFilter = function () { o.hiddenRows = 0; self._calculateBlocks(true); self.render(); };
            el[0].scrollTo = function (ndx) { self.scrollTo(ndx); };

        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            if (typeof o.style !== 'undefined') el.css(o.style);
            el.addClass('picVirtualList');
            var tbody = $('<tbody></tbody>').appendTo($('<table></table>').appendTo(el).addClass('vlist-outer')).addClass('vlist-outer');
            $('<tr></tr>').appendTo(tbody).addClass('vlist-header-outer');
            self._addHeaderColumns();
            var body = $('<tr></tr>').appendTo(tbody).addClass('vlist-body-outer');
            var tdbody = $('<td></td>').appendTo(body).addClass('vlist-body-outer');
            var divBody = $('<div></div>').appendTo(tdbody).addClass('vlist-body-outer');
            divBody = $('<div></div>').appendTo(divBody).addClass('vlist-body');
            //$('<div></div>').addClass('vlist-space').addClass('vlist-parity').appendTo(divBody);
            var divTop = $('<div></div>').addClass('vlist-space').addClass('vlist-top').appendTo(divBody);
            tbody = $('<tbody></tbody>').appendTo($('<table></table>').addClass('vlist-body').appendTo(divBody)).addClass('vlist-body');
            var divBottom = $('<div></div>').addClass('vlist-space').addClass('vlist-bottom').appendTo(divBody);
            o.blockHeight = o.rowHeight * o.rowsPerBlock;
            o.rowsPerCluster = o.blocksPerCluster * o.rowsPerBlock;
            o.clusterHeight = o.blocksPerCluster * o.blockHeight;
            if (typeof o.style !== 'undefined') el.css(o.style);
            divBody.on('scroll', function (evt) {
                if (o.scrollDebounce) clearTimeout(o.scrollDebounce);
                o.pointerSet = true;
                var startBlock = self._getStartingBlock();
                if (o.currentBlock !== startBlock) {
                    //o.scrollDebounce = setTimeout(function () {
                    o.scrollTop = divBody.scrollTop();
                    self.render(startBlock);
                    o.currentBlock = startBlock;
                    //}, 20);
                }
            });
            el.on('click', 'tr.vlist-data', function (e) { self.selectRow($(e.currentTarget)); });
        },
        _calculateBlocks: function (clearFilter) {
            var self = this, o = self.options, el = self.element;
            var block = { start: 0, end: 0, above: 0, count: 0 };
            var above = 0;
            var id = 0;
            var count = 0;
            var rowId = -1;
            o.blocks = { '0': block };
            for (var k = 0; k < o.rows.length; k++) {
                var r = o.rows[k];
                if (clearFilter) r.hidden = false;
                if (!r.hidden) {
                    if (count === 0) {
                        block.start = r.rowId;
                        o.blocks[id.toString()] = block;
                    }
                    count++;
                    rowId = r.rowId;
                }
                if (count && count % o.rowsPerBlock === 0) {
                    block.end = r.rowId;
                    block.count = count;
                    block.above = above;
                    above += count;
                    count = 0;
                    id++;
                    block = { start: 0, end: 0, above: above, count: 0 };
                }
            }
            if (count > 0) {
                block.count = count;
                block.end = rowId;
                block.above = above;
                o.blocks[id.toString()] = block;
            }
        },
        _calculate: function (startBlock) {  // This is the same as the generate function.
            var self = this, o = self.options, el = self.element;
            startBlock = startBlock || self._getStartingBlock();
            var cluster = self._getBlockCluster(startBlock);
            var offTop = cluster.offTop;
            var itmStart = cluster.startItem;
            var minRows = cluster.count;
            var rows = [];
            for (var i = itmStart; rows.length <= minRows && i < o.rows.length; i++) {
                var r = o.rows[i];
                if (typeof r !== 'undefined' && !r.hidden) rows.push(r.row);
            }
            var offBottom = ((o.rows.length - o.hiddenRows) * o.rowHeight) - offTop - (rows.length * o.rowHeight);
            return { offset: { top: offTop, bottom: offBottom }, rows: rows };
        },

        render(startBlock) { // This is the same as the insertToDom method
            var self = this, o = self.options, el = self.element;
            var body = el.find('div.vlist-body');
            var attrs = self._calculate(startBlock);
            var html = '<div class="vlist-space vlist-top" style="height:' + attrs.offset.top + 'px;"></div>'
                + '<table class="vlist-body"><tbody class="vlist-body">' + attrs.rows.join('') + '</tbody></table>'
                + '<div class="vlist-space vlist-bottom" style="height:' + attrs.offset.bottom + 'px;"></div>';
            body[0].innerHTML = html;
        },
        _getCurrentCluster: function () {
            var self = this, o = self.options, el = self.element;
            o.scrollTop = el.find('div.vlist-body').scrollTop();
            //console.log({ cyCluster: o.clusterHeight, cyBlock: o.blockHeight, top: o.scrollTop });
            return Math.floor(o.scrollTop / (o.clusterHeight - o.blockHeight)) || 0;
        },
        _getBlockCluster: function (blockNumber) {
            var self = this, o = self.options, el = self.element;
            var curr = o.blocks[blockNumber.toString()];
            if (typeof curr === 'undefined') {
                curr = o.blocks["0"];
                blockNumber = 0;
            }
            var prev = o.blocks[(blockNumber - 1).toString()];
            var next = o.blocks[(blockNumber + 1).toString()];
            return {
                currentBlock: blockNumber,
                offTop: typeof prev !== 'undefined' ? prev.above * o.rowHeight : curr.above * o.rowHeight,
                startItem: typeof prev !== 'undefined' ? prev.start : curr.start,
                count: (typeof prev !== 'undefined' ? prev.count : 0) + curr.count + (typeof next !== 'undefined' ? next.count + 0 : 0)
            };
        },
        _getStartingBlock: function () {
            var self = this, o = self.options, el = self.element;
            o.scrollTop = el.find('div.vlist-body').scrollTop();
            //console.log({ cyCluster: o.clusterHeight, cyBlock: o.blockHeight, top: o.scrollTop });
            return Math.floor(o.scrollTop / o.blockHeight) || 0;
        },

        _getRowsHeight: function () {
            var self = this, o = self.options, el = self.element;
            o.blockHeight = o.rowHeight * o.rowsPerBlock;
            o.rowsPerCluster = o.blocksPerCluster * o.rowsPerBlock;
            o.clusterHeight = o.blocksPerCluster * o.blockHeight;
            return o.rows.length * o.rowHeight;
        },
        _addHeaderColumns: function () {
            var self = this, o = self.options, el = self.element;
            var trHeader = el.find('tr.vlist-header-outer');
            trHeader.empty();
            var tdHeader = $('<td></td>').appendTo(trHeader).addClass('vlist-header');
            var tbody = $('<tbody></tbody>').appendTo($('<table></table>').appendTo(tdHeader).addClass('vlist-header')).addClass('vlist-header');
            var tr = $('<tr></tr>').appendTo(tbody).addClass('vlist-header');
            for (var i = 0; i < o.columns.length; i++) {
                var col = o.columns[i];
                var td = $('<td></td>').appendTo(tr).addClass('vlist-header-col');
                if (typeof col.header.style !== 'undefined') td.css(col.header.style);
                if (typeof col.header.label !== 'undefined') {
                    if (col.header.label instanceof jQuery) col.header.label.appendTo(td);
                    else if (typeof col.header.label === 'string') td.html(col.header.label);
                    else if (typeof col.header.label.nodeType !== 'undefined') $(col.header.label).appendTo(td);
                }
                if (typeof col.header.attrs !== 'undefined') {
                    for (var s in col.header.attrs) td.attr(s, col.header.attrs[s]);
                }
                if (typeof col.width !== 'undefined') td.css({ width: col.width });
            }
        },
        applyFilter: function (cb) {
            var self = this, o = self.options, el = self.element;
            o.hiddenRows = 0;
            for (var i = 0; i < o.rows.length; i++) {
                var r = o.rows[i];
                cb(r);
                if (r.hidden) {
                    o.hiddenRows++;
                }
            }
        },
        createDataRow: function () {
            var self = this, o = self.options, el = self.element;
            var tr = $('<tr></tr>').addClass('vlist-data');
            for (var i = 0; i < o.columns.length; i++) {
                var col = o.columns[i];
                var td = $('<td></td>').appendTo(tr).addClass('vlist-data');
                if (typeof col.data !== 'undefined') {
                    if (typeof col.data.style !== 'undefined') td.css(col.data.style);
                    if (typeof col.data.elem !== 'undefined') {
                        if (col.data.elem instanceof jQuery) col.data.elem.clone().appendTo(td);
                        else if (typeof col.data.elem === 'string') col.html(col.data.elem);
                        else if (typeof col.data.elem.nodeType !== 'undefined') $(col.data.elem).appendTo(td);
                    }
                    if (col.data.attrs !== 'undefined')
                        for (var s in col.data.attrs) td.attr(s, col.data.attrs[s]);
                }
                if (typeof col.width !== 'undefined') td.css({ width: col.width });
            }
            return tr;
        },
        addRows: function (arrData) {
            var self = this, o = self.options, el = self.element;
            var added = [];
            for (var i = 0; i < arrData.length; i++) {
                var row = self.createDataRow();
                var data = arrData[i];
                row.attr('data-rowid', o.rows.length);
                var evt = $.Event('bindrow');
                evt.row = { hidden: false, rowId: o.rows.length, row: row };
                evt.rowData = data;
                el.trigger(evt);
                evt.row.row = row[0].outerHTML;
                if (evt.row.hidden) o.hiddenRows++;
                o.rows.push(evt.row);
                added.push(evt.row);
            }
            return added;
        },
        addRow: function (data) {
            var self = this, o = self.options, el = self.element;
            var rc = self.addRows([data]);
            if (!rc[0].hidden) {
                self._calculateBlocks();
                self.render();
            }
            return rc;
        },
        selectRow: function (row, scrollTo) {
            var self = this, o = self.options, el = self.element;
            var ndx = typeof row !== 'undefined' ? parseInt(row.attr('data-rowid'), 10) : -1;
            if (o.selectedIndex !== ndx && o.selectionType === 'single') {
                var evt = $.Event('selchanged');
                evt.oldRow = o.selectedIndex !== -1 && o.selectedIndex < o.rows.length ? $(o.rows[o.selectedIndex].row).removeClass('selected') : undefined;
                evt.newRow = row;
                evt.allRows = o.rows;
                if (evt.oldRow) {
                    evt.oldRow.removeClass('selected');
                    el.find('tr.vlist-data.selected').removeClass('selected');
                    o.rows[o.selectedIndex].row = evt.oldRow[0].outerHTML;
                }
                o.selectedIndex = ndx;
                if (typeof row !== 'undefined') {
                    el.find('tr.vlist-data[data-rowid=' + ndx + ']').addClass('selected');
                    if(!row.hasClass) row.addClass('selected');
                    o.rows[ndx].row = row[0].outerHTML;
                }
                else o.selectedIndex = -1;
                el.trigger(evt);
                if (scrollTo) {
                    self.scrollTo(ndx);
                }
            }
        },
        clear: function (fn) {
            var self = this, o = self.options, el = self.element;
            if (typeof fn === 'function')
                o.rows = o.rows.filter(fn);
            else
                o.rows = [];
            self._calculateBlocks();
            el.find('div.vlist-body').scrollTop(0);
            o.selectedIndex = -1;
            self.render();
        },
        
        scrollTo: function (ndx) {
            var self = this, o = self.options, el = self.element;
            if (ndx < o.rows.length) {
                el.find('div.vlist-body').scrollTop(ndx * o.rowHeight);
            }
        }
    });
    $.widget("pic.chemTank", {
        options: {
            labelText: '', binding: '', min: 0, max: 6, bindTank: false, format: {} },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initChemTank();
        },
        _initChemTank: function () {
            var self = this, o = self.options, el = self.element;
            el.attr('data-datatype', 'int');
            el[0].val = function (val) { return self.val(val); };
            el[0].tank = function (val) { return self.tank(val); };
            el[0].isEmpty = function (val) { return self.isEmpty(); };
            el[0].incrementStep = function (val) { return typeof val === 'number' ? o.step = val : o.step || 1; };
            var liquid = $('<div></div>').addClass('chemTank-liquid').appendTo(el);
            $('<div></div>').addClass('chemTank-level-top').appendTo(liquid);
            $('<div></div>').addClass('chemTank-level').appendTo(liquid);
            $('<div></div>').addClass('chemTank-scale').appendTo(liquid);

            // Create all the ticks for the scale by starting at the top and drawing down.
            var tickpos = 100 / 7;
            el.attr('data-chemtype', o.chemType);
            for (var i = 1; i <= 6; i++) {
                $('<div></div>').addClass('chemTank-scale-tick').css({ top: 'calc(' + (tickpos * i) + '% + 10.5px)' }).appendTo(liquid);
            }
            $('<label></label>').addClass('chemTank-label').text(o.labelText).appendTo(el);
            $('<div></div>').addClass('chemTank-alarmEmptyLevel').css({ top: 'calc(100% + 0px)', position: 'relative', overflow: 'hidden'}).appendTo(liquid);
            if (o.required === true) self.required(true);
            if (o.binding) el.attr('data-bind', o.binding);
            self.val(o.value || o.min);
            self._applyStyles();
        },
        _applyStyles: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picChemTank');
            if (typeof o.style !== 'undefined') el.css(o.style);
        },
        isEmpty: function () {
            var self = this, o = self.options, el = self.element;
            return self.val() === 'undefined';
        },
        tank: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined') {
                var lvl;
                if (typeof val === 'number') lvl = val;
                else if (typeof val === 'object') {
                    lvl = typeof val.level !== 'undefined' ? val.level : o.value;
                    o.max = (typeof val.capacity !== 'undefined') ? val.capacity : o.max;
                    if (typeof val.units === 'string') o.units === val.units;
                    else if (typeof val.units === 'object') o.units = val.units.name;
                    var opts;
                    switch (o.units) {
                        case 'L':
                        case 'liters':
                        case 'litres':
                        case 'gal':
                        case 'gals':
                        case 'gallons':
                            opts = { step: .1, fmtMask: '#,##0.####', emptyMask: '' };
                            break;
                        case 'cL':
                        case 'quarts':
                        case 'pints':
                        case 'qt':
                        case 'pt':
                            opts = { step: .1, fmtMask: '#,##0.##', emptyMask: '' };
                            break;
                        case 'oz':
                        case 'mL':
                            opts = { step: 1, fmtMask: '#,##0', emptyMask: '' };
                            break;
                        default:
                            opts = { step: 1, fmtMask: '#,##0', emptyMask: '' };
                            break;
                    }
                    o.step = opts.step;
                    el.attr('data-fmtMask', opts.fmtMask);
                   
                }
                var tot = o.max - o.min;
                // Calculate the left value.
                var pct = Math.max(0, Math.min(100, ((lvl - o.min) / (tot)) * 100));
                var liquid = el.find('div.chemTank-liquid');
                //console.log(liquid);
                liquid.find('div.chemTank-level-top').css({ top: 'calc(' + (100 - pct) + '% - 12.5px)' });
                liquid.find('div.chemTank-level').css({ top: 'calc(' + (100 - pct) + '% - 12.5px)', height: 'calc(' + pct + '% + 25px)' });
                liquid.find('div.chemTank-alarmEmptyLevel').css({ top: 'calc(' + (100 - val.alarmEmptyLevel) + '%)' });
                o.value = lvl;
            }
            else {
                return { capacity: o.max, units: o.units, level: o.value, chemType: el.attr('data-chemtype') };
            }
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined') {
                var lvl;
                if (typeof val === 'number') lvl = val;
                else if (typeof val === 'object') {
                    self.tank(val);
                    return;
                }
                var tot = o.max - o.min;
                // Calculate the left value.
                var pct = Math.max(0, Math.min(100, ((lvl - o.min) / (tot)) * 100));
                var liquid = el.find('div.chemTank-liquid');
                //console.log(liquid);
                liquid.find('div.chemTank-level-top').css({ top: 'calc(' + (100 - pct) + '% - 12.5px)' });
                liquid.find('div.chemTank-level').css({ top: 'calc(' + (100 - pct) + '% - 12.5px)', height: 'calc(' + pct + '% + 25px)' });
                o.value = lvl;
            }
            else {
                return o.bindTank ? self.tank() : o.value;
            }
        }
    });
    $.widget("pic.chemLevel", {
        options: { labelText: '', binding: '', scales:[] },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initChemLevel();
        },
        _initChemLevel: function () {
            var self = this, o = self.options, el = self.element;
            el.attr('data-datatype', 'int');
            el[0].val = function (val) { return self.val(val); };
            el[0].isEmpty = function (val) { return self.isEmpty(); };
            el[0].target = function (val) { return self.target(val); };
            el[0].scales = function (val) { return self._createScales(val); };
            $('<label></label>').text(o.labelText).addClass('chemLevel-label').appendTo(el);
            $('<div></div>').addClass('chemLevel-level').appendTo(el);
            el.attr('data-chemtype', o.chemType);
            if (o.required === true) self.required(true);
            if (o.binding) el.attr('data-bind', o.binding);
            self.val(o.value);
            self._applyStyles();
            if (typeof o.scales !== 'undefined') self._createScales(o.scales);
        },
        _createScales: function (scales) {
            var self = this, o = self.options, el = self.element;
            var lvl = el.find('div.chemLevel-level');
            lvl.empty();
            var maxWidth = lvl.width();
            var tot = o.max - o.min;
            o.scales = scales;
            for (var i = 0; i < o.scales.length; i++) {
                var scale = o.scales[i];
                var d = $('<div></div>').addClass('chemLevel-scale').appendTo(lvl);
                if (i === 0) d.css({ 'border-top-left-radius': '5px', 'border-bottom-left-radius': '5px'});
                else if (i === o.scales.length - 1) d.css({ 'border-top-right-radius': '5px', 'border-bottom-right-radius': '5px' });
                d.addClass(scale.class);
                // Calculate the positions
                //var left = ((scale.min - o.min) !== 0) ? tot / (scale.min - o.min) : 0;
                var width = ((scale.max - scale.min) / tot ) * 100;
                d.css({ width: width + '%' });
                var lbl = $('<label></label>').addClass('chemLevel-scale-label').text(scale.labelEnd).appendTo(lvl);
            }
            self.target(o.target);
            self.val(o.value);
        },
        _applyStyles: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picChemLevel');
            if (typeof o.style !== 'undefined') el.css(o.style);
        },
        isEmpty: function () {
            var self = this, o = self.options, el = self.element;
            return self.val() === 'undefined';
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined') {
                var lvl = el.find('div.chemLevel-level');
                // Find the target div.
                var pin = lvl.find('div.chemLevel-value');
                if (pin.length === 0) {
                    pin = $('<div></div>').addClass('chemLevel-value').appendTo(lvl);
                    $('<div></div>').addClass('chemLevel-value-label').appendTo(pin);
                    pin.append('<i class="fas fa-map-marker-alt"></i>');
                }
                var maxWidth = lvl.width();
                var tot = o.max - o.min;
                var minval = o.scales[0].min;
                var maxval = o.scales[o.scales.length - 1].max;
                // Calculate the left value.
                var left = Math.max(0, Math.min(100, ((val - minval) / (tot)) * 100));
                //console.log({ val: val, minval: minval, maxval: maxval, tot: tot, left: left });
                pin.css({ left: left + '%' });
                pin.find('div.chemLevel-value-label').text(typeof val === 'number' ? val.format(o.fmtMask) : o.emptyMask);
                o.value = val;
            }
            else return o.value;
        },
        target: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined') {
                var lvl = el.find('div.chemLevel-level');
                // Find the target div.
                var tgt = lvl.find('div.chemLevel-target');
                if (tgt.length === 0) tgt = $('<div></div>').addClass('chemLevel-target').appendTo(lvl).append('<i class="fas fa-crosshairs"></i>');
                var maxWidth = lvl.width();
                var tot = o.max - o.min;
                var minval = o.scales[0].min;
                var maxval = o.scales[o.scales.length - 1].max;
                // Calculate the left value.
                var left = Math.max(0, Math.min(100, ((val - minval) / (tot)) * 100));
                console.log({ msg:'Setting target', tgt: tgt, val: val, minval: minval, maxval: maxval, tot:tot, left: left });
                tgt.css({ left: left + '%' });
                o.target = val;
                
            }
            else return o.target;
        }
    });
    $.widget("pic.REMBinding", {
        options: {binding:''},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initREMBinding();
        },
        _initREMBinding: function () {
            var self = this, o = self.options, el = self.element;
            line = $('<div></div>').appendTo(el);
            var binding = '';
            el.addClass('picREMBinding');
            if (typeof o.binding !== 'undefined' && o.binding.length > 0) binding = `${o.binding}.`;
            let srv = o.servers.slice();
            srv.unshift({ uuid:'', name: 'No Connection', devices: [] });
            var conn = $('<div></div>').appendTo(line).pickList({
                binding: `${binding}connectionId`,
                bindColumn: 0, displayColumn: 1,
                labelText: 'Connection',
                columns: [{ binding: 'uuid', text: 'uuid', hidden: true }, { binding: 'name', text: 'Name', style: { whiteSpace: 'nowrap' } }],
                items: srv,
                placeHolder: 'Select Server',
                inputAttrs: { style: { width: '8.5rem' } },
                labelAttrs: { style: { width: '5.4rem' } }
            }).on('beforeselchange', function (evt) {
                if (evt.newItem.uuid === '') evt.newItem = {uuid:null, name: '', devices: [] };
            })
            .on('selchanged', function (evt) {
                el.find('div[data-bind$="deviceBinding"]').each(function () {
                    this.items(evt.newItem.devices);
                    this.val('');
                    if (evt.newItem.devices.length === 0) {
                        $(this).hide();
                    }
                    else {
                        $(this).show();
                    }
                });
            }).addClass('pnl-rem-address');
            if (o.showLabel === false) conn.find('.field-label').css({ display: 'none' });
            if(o.horizontal !== true) line = $('<div></div>').appendTo(el);
            var bind = $('<div></div>').appendTo(line).pickList({
                binding: `${binding}deviceBinding`,
                bindColumn: 0, displayColumn: 2,
                labelText: 'Device',
                columns: [{ binding: 'binding', text: 'binding', hidden: true }, { binding: 'category', text: 'Category', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Device', style: { whiteSpace: 'nowrap' } }],
                items: [],
                placeHolder: 'Select Device',
                inputAttrs: { style: { width: '8.5rem' } },
                labelAttrs: { style: { width: '5.4rem' } }
            }).addClass('pnl-rem-address').hide();
            if (o.showLabel === false) bind.find('.field-label').css({ display: 'none' });
        }
    });
    $.widget("pic.buttonOptions", {
        options: { items:[], selectionType:'single', toggleType:'' },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('picButtonOptions');
            el.addClass('btnarray');
            el.attr('data-bind', o.binding);
            self._createButtons();
            el[0].val = function (val) { return self.val(val); };
            el.on('click', 'div.btn-toggle', function (evt) {
                console.log(evt);
                var val = $(evt.currentTarget).attr('data-value');
                self.selectItemByVal(val);

            });
            if (typeof o.value !== 'undefined') self.val(o.value);
        },
        _createButtons: function () {
            var self = this, o = self.options, el = self.element;
            el.empty();
            for (var i = 0; i < o.items.length; i++) {
                var itm = o.items[i];
                var btn = $('<div></div>').appendTo(el);
                btn.addClass('btn-toggle');
                btn.attr('data-value', itm.val);
                self._applyAttrs(btn, o.btnAttrs);
                if (typeof itm.btnAttrs !== 'undefined') self._applyAttrs(btn, itm.btnAttrs);
                if (i === 0) btn.addClass('fld-btn-left');
                if (i === o.items.length - 1) btn.addClass('fld-btn-right');
                else if (i !== 0) btn.addClass('fld-btn-center');
                var label = $('<span></span>').appendTo(btn).html(itm.labelText || itm.desc).attr('data-btnindex', i);
                self._applyAttrs(label, o.labelAttrs);
                if (typeof itm.labelAttrs !== 'undefined') self._applyAttrs(label, itm.labelAttrs);
                if (typeof o.style !== 'undefined') el.css(o.style);
            }
            return btn;
        },
        _applyAttrs: function (elem, attrs) {
            if (typeof attrs === 'undefined') return;
            for (var a in attrs) {
                switch (a) {
                    case 'style':
                        if (typeof attrs[a] === 'object') elem.css(attrs[a]);
                        break;
                    case 'maxlength':
                    case 'maxLength':
                        //if (typeof o.inputStyle.width === 'undefined')
                        elem.css({ width: parseInt(attrs[a], 10) * .55 + 'rem' });
                        break;
                    default:
                        if (a.startsWith('data')) elem.attr(a, attrs[a]);
                        break;
                }
            }
        },
        _findItemByVal: function (val) {
            var self = this, o = self.options, el = self.element;
            for (var i = 0; i < o.items.length; i++) {
                var itm = o.items[i];
                if (itm.val.toString() === val.toString()) return itm;
            }
        },
        selectItemByVal: function (val) {
            var self = this, o = self.options, el = self.element;
            var oldVal = self.val();
            var itm = self._findItemByVal(val);
            if (typeof itm === 'undefined' && typeof val !== 'undefined') return;
            var btn = el.find('div.btn-toggle[data-value="' + val + '"]');
            var bSelect = true;
            var changed = false;
            if (o.selectionType === 'multi') {
                if (o.toggleType === 'toggle') {
                    if (typeof oldVal.find(elem => elem.val.toString() === val.toString()) !== 'undefined') bSelect = false;
                    changed = true;
                }
                else {
                    changed = makeBool(btn.attr('data-selected'));
                }
            }
            else {
                if (typeof oldVal === 'undefined' || oldVal.toString() !== val.toString()) {
                    changed = true;
                    // We need to unselect the old button.
                    el.find('div.btn-toggle[data-selected="true"]').attr('data-selected', false);
                }
            }
            if (changed) {
                btn.attr('data-selected', bSelect);
                var evt = $.Event('selchanged');
                evt.oldVal = oldVal;
                evt.newVal = (typeof newVal !== 'undefined') ? itm.val : undefined;
                el.trigger(evt);
            }
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') {
                var arr = [];
                el.find('div.btn-toggle[data-selected=true]').each(function () {
                    var ai = self._findItemByVal($(this).attr('data-value'));
                    if (typeof ai !== 'undefined') arr.push(ai.val);
                });
                return o.selectionType === 'multi' ? arr : arr[0];
            }
            else
                self.selectItemByVal(val);
        }
    });
    $.widget("pic.uploadProgress", {
        options: { procTotal: 0, procProcessed: 0, uploadTotal: 0, uploadProcessed: 0 },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initProgress();
            el[0].setUploadProgress = function (processed, total) { self.setUploadProgress(processed, total); };
            el[0].setProcessProgress = function (processed, total) { self.setProcessedProgress(processed, total); };
            el[0].incrementProcessProgress = function (total) { self.incrementProcessProgress(total); };
            el[0].isCancelled = function () { return o.isCancelled || false; };
        },
        _initProgress: function () {
            var self = this, o = self.options, el = self.element;
            if (typeof o.style !== 'undefined') el.css(o.style);
            var div = $('<div></div>').appendTo(el).addClass('upload-progress');
            var line = $('<div></div>').css({ minWidth: '30rem' }).appendTo(div);
            $('<div></div>').appendTo(el).addClass('upload-file-label').text('File Upload Progress');
            var fileProg = $('<div></div>').appendTo(el).addClass('upload-file-progress').progressbar();
            $('<div></div>').appendTo(el).addClass('upload-process-label').text('Log Processing Progress');
            var procProg = $('<div></div>').appendTo(el).addClass('upload-process-progress').progressbar();
            var btnPnl = $('<div class="picBtnPanel btn-panel"></div>').appendTo(el);
            $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Cancel Upload', icon: '<i class="fas fa-plane-slash"></i>' }).on('click', function (e) {
                o.isCancelled = true;
            });
            if (!o.hasPostProcess) {
                procProg.hide();
                el.find('div.upload-process-label').hide();
            }
        },
        incrementProcessProgress: function (total) {
            var self = this, o = self.options, el = self.element;
            var label = el.find('div.upload-process-label:first');
            var prog = el.find('div.upload-process-progress:first');
            if (typeof total !== 'undefined') o.procTotal = total;
            var pct = o.procTotal !== 0 ? ++o.procProcessed / o.procTotal : 1;
            prog.progressbar('value', pct * 100);
            label.text('Log Processing Progress: ' + o.procProcessed + ' of ' + o.procTotal);
        },
        setUploadProgress: function (processed, total) {
            var self = this, o = self.options, el = self.element;
            var label = el.find('div.upload-file-label:first');
            var prog = el.find('div.upload-file-progress:first');
            var pct = total !== 0 ? processed / total : 1;
            prog.progressbar('value', pct * 100);
            o.uploadTotal = total;
            o.uploadProcessed = processed;
            label.text('File Upload Progress: ' + o.uploadProcessed.format('#,##0') + ' of ' + o.uploadTotal.format('#,##0') + ' bytes');
        },
        setProcessedProgress: function (processed, total) {
            var self = this, o = self.options, el = self.element;
            var label = el.find('div.upload-process-label:first');
            var prog = el.find('div.upload-process-progress:first');
            var pct = total !== 0 ? processed / total : 1;
            prog.progressbar('value', pct * 100);
            o.procTotal = total;
            o.procProcessed = processed;
            label.text('Log Processing Progress: ' + o.procProcessed + ' of ' + o.procTotal);
        }
    });
    $.widget("pic.selectList", {
        options: {
            caption: '',
            itemName: 'Item',
            columns: [],
            actions: { canCreate: false, canEdit: false, canRemove: false, canClear: false }
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initList();
            el[0].addRow = function (data) { return self.addRow(data); };
            el[0].saveRow = function (data) { return self.saveRow(data); };
            el[0].clear = function () { self.clear(); }
            el[0].actions = function (val) { return self.actions(val); };
            el[0].val = function (val) { return self.val(val); }
        },
        _getColumn: function (nCol) { return this.options.columns[nCol]; },
        _createCaption: function () {
            var self = this, o = self.options, el = self.element;
            var caption = $('<div></div>').addClass('slist-caption').addClass('table-caption').text(o.caption);
            $('<span></span>').appendTo(caption).addClass('header-icon-btn').addClass('btn-add').append($('<i class="fas fa-plus"></i>')).attr('title', 'Add a new ' + o.itemName)
                .on('click', function (e) {
                    var evt = $.Event('additem');
                    el.trigger(evt);
                });
            return caption;
        },
        _createHeader: function () {
            var self = this, o = self.options, el = self.element;
            var header = $('<div></div>').addClass('slist-header');
            var tbody = $('<tbody></tbody>').appendTo($('<table></table>').appendTo(header));
            var row = $('<tr></tr>').appendTo(tbody).addClass('slist-header');
            //var btn = $('<td></td>').appendTo(row).addClass('slist-button'); // This is the buttons column.
            //$('<span></span>').appendTo(btn).addClass('slist-row-btn');
            for (var i = 0; i < o.columns.length; i++) {
                var col = self._getColumn(i);
                var td = $('<td></td>').appendTo(row);
                var span = $('<span class="slist-header-text"></span>').appendTo(td).text(col.text);
                if (typeof col.style !== 'undefined') span.css(col.style);
                if (typeof col.headStyle !== 'undefined') div.css(col.headStyle);

                if (col.hidden) td.hide();
            }
            //btn = $('<td></td>').appendTo(row).addClass('slist-button'); // This is the buttons column.
            //$('<span></span>').appendTo(btn).addClass('slist-row-btn');
            return header;
        },
        _createBody: function () {
            var self = this, o = self.options, el = self.element;
            var body = $('<div></div>').addClass('slist-body');
            var tbody = $('<tbody></tbody>').appendTo($('<table></table>').appendTo(body).addClass('slist-table'));
            tbody.on('click', 'span.slist-row-btn.btn-edit', function (e) {
                var evt = $.Event('edititem');
                var row = $(e.currentTarget).parents('tr:first');
                evt.dataKey = row.data('key');
                evt.dataRow = row;
                el.trigger(evt);
            });
            tbody.on('click', 'span.slist-row-btn.btn-remove', function (e) {
                var evt = $.Event('removeitem');
                var row = $(e.currentTarget).parents('tr:first');
                evt.dataKey = row.data('key');
                evt.dataRow = row;
                el.trigger(evt);
            });
            return body;
        },
        _createActionButton: function (icon, title, cssClass) {
            var self = this, o = self.options, el = self.element;
            var span = $('<span></span>').addClass('slist-row-btn').addClass(cssClass).attr('title', title);
            $('<i></i>').appendTo(span).addClass(icon);
            return span;
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val !== 'undefined') {
                self.clear();
                for (data in val) {
                    self.addRow(val[data]);
                    console.log(val[data]);
                }
            }
        },
        addRow: function (data) {
            var self = this, o = self.options, el = self.element;
            var tbl = el.find('table.slist-table:first');
            var tbody = tbl.find('tbody:first');
            var row = $('<tr></tr>').appendTo(tbody);
            //var btn = $('<td></td>').appendTo(row);
            //self._createActionButton('fas fa-edit', 'Edit ' + o.itemName).addClass('btn-edit').appendTo(btn);
            for (var i = 0; i < o.columns.length; i++) {
                var col = o.columns[i];
                var td = $('<td></td>').appendTo(row);
                var div = $('<div></div>').appendTo(td).attr('data-bind', col.binding).attr('data-fmttype', col.fmtType).attr('data-fmtMask', col.fmtMask);
                if (typeof col.style !== 'undefined') div.css(col.style);
                if (typeof col.cellStyle !== 'undefined') td.css(col.cellStyle);
            }
            //btn = $('<td></td>').appendTo(row);
            // Add in the buttons.
            self.dataBindRow(row, data);
            //self._createActionButton('fas fa-trash', 'Remove ' + o.itemName).addClass('btn-remove').appendTo(btn);
            return row;
        },
        saveRow: function (data) {
            var self = this, o = self.options, el = self.element;
            if (typeof o.key !== 'undefined') {
                // See if the key exists.
                var key = data[o.key];
                var row;
                el.find('table.slist-table:first > tbody > row').each(function () {
                    if (key === $(this).data('key')) {
                        row = $(this);
                        dataBinder.bind(row, data);
                        return false;
                    }
                });
                return (typeof row === 'undefined') ? addRow(data) : row;
            }
            else
                self.addRow(data);
        },
        actions: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') {
                return o.actions = {
                    canCreate: makeBool(el.attr('data-cancreate')),
                    canEdit: makeBool(el.attr('data-canedit')),
                    canRemove: makeBool(el.attr('data-canremove')),
                    canClear: makeBool(el.attr('data-canclear'))
                }
            }
            else {
                var acts = typeof o.actions !== 'undefined' ? o.actions : o.actions = {}
                for (var prop in val) {
                    var name = prop.toLowerCase();
                    switch (name) {
                        case 'cancreate':
                            acts.canCreate = makeBool(val[prop]);
                            el.attr(`data-${name}`, makeBool(val[prop]));
                            break;
                        case 'canedit':
                            acts.canUpdate = makeBool(val[prop]);
                            el.attr(`data-${name}`, makeBool(val[prop]));
                            break;
                        case 'canremove':
                            acts.canRemove = makeBool(val[prop]);
                            el.attr(`data-${name}`, makeBool(val[prop]));
                            break;
                        case 'canclear':
                            acts.canClear = makeBool(val[prop]);
                            el.attr(`data-${name}`, makeBool(val[prop]));
                    }
                }
            }
        },
        clear: function () {
            var self = this, o = self.options, el = self.element;
            el.find('table.slist-table:first > tbody > tr').remove();
        },
        dataBindRow: function (row, data) {
            var self = this, o = self.options, el = self.element;
            if (typeof o.key !== 'undefined') row.data('key', data[o.key]);
            dataBinder.bind(row, data);
        },
        _initList: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('slist-list');
            var caption = self._createCaption().appendTo(el);
            var header = self._createHeader().appendTo(el);
            var body = self._createBody().appendTo(el);
            if (typeof o.id !== 'undefined') el.attr('id', o.id);
            if (typeof o.bind !== 'undefined') el.attr('data-bind', o.bind);
            el.on('click', 'table.slist-table > tbody > tr', function (evt) {
                self.selectRow($(evt.currentTarget));
            });
            self.actions(o.actions);
            if (typeof o.style !== 'undefined') el.css(o.style);
        },
        selectRow: function (row) {
            var self = this, o = self.options, el = self.element;
            el.find('table.slist-table > tbody > tr.selected').removeClass('selected');
            row.addClass('selected');
            var evt = $.Event('selected');
            evt.dataKey = row.data('key');
            el.trigger(evt);
        }

    });
    $.widget("pic.crudList", {
        options: {
            caption: '',
            itemName: 'Item',
            columns: [],
            actions: { canCreate: false, canEdit: false, canRemove: false, canClear: false },
            items: [],
            selType: 'none'
        },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._initList();
            el[0].insertRow = function (ndx, data) { return self.insertRow(ndx, data); };
            el[0].addRow = function (data) { return self.addRow(data); };
            el[0].saveRow = function (data) { return self.saveRow(data); };
            el[0].removeItemByIndex = function (val) { return self.removeItemByIndex(val); };
            el[0].selectItemByKey = function (key) { return self.selectItemByKey(key); };
            el[0].selectItemByIndex = function (ndx) { return self.selectItemByIndex(ndx); };
            el[0].getSelectedIndex = function () { return self.getSelectedIndex(); };
            el[0].clear = function () { self.clear(); };
            el[0].actions = function (val) { return self.actions(val); };
            el[0].val = function (val) { return self.val(val); };
            el[0].getItems = function () { return o.items; };
        },
        _getColumn: function (nCol) { return this.options.columns[nCol]; },
        _createCaption: function () {
            var self = this, o = self.options, el = self.element;
            var caption = $('<div></div>').addClass('crud-caption').html(o.caption);
            $('<span></span>').appendTo(caption).addClass('header-icon-btn').addClass('btn-add').append($('<i class="fas fa-plus"></i>')).attr('title', 'Add a new ' + o.itemName)
                .on('click', function (e) {
                    var evt = $.Event('additem');
                    el.trigger(evt);
                });
            $('<span></span>').appendTo(caption).addClass('header-icon-btn').addClass('btn-clear').append($('<i class="fas fa-broom"></i>')).attr('title', 'Clear all ' + o.itemName)
                .on('click', function (e) {
                    var evt = $.Event('clearitems');
                    el.trigger(evt);
                });
            return caption;
        },
        _createHeader: function () {
            var self = this, o = self.options, el = self.element;
            var header = $('<div></div>').addClass('crud-header');
            var tbody = $('<tbody></tbody>').appendTo($('<table></table>').appendTo(header));
            var row = $('<tr></tr>').appendTo(tbody).addClass('crud-header');
            var btn = $('<td></td>').appendTo(row).addClass('crud-button').addClass('btn-edit'); // This is the buttons column.
            $('<span></span>').appendTo(btn).addClass('crud-row-btn');
            for (var i = 0; i < o.columns.length; i++) {
                var col = self._getColumn(i);
                var td = $('<td></td>').appendTo(row);
                var span = $('<span class="crud-header-text"></span>').appendTo(td).text(col.text);
                if (typeof col.style !== 'undefined') span.css(col.style);
                if (typeof col.headStyle !== 'undefined') div.css(col.headStyle);

                if (col.hidden) td.hide();
            }
            btn = $('<td></td>').appendTo(row).addClass('crud-button').addClass('btn-remove'); // This is the buttons column.
            $('<span></span>').appendTo(btn).addClass('crud-row-btn');
            return header;
        },
        _createBody: function () {
            var self = this, o = self.options, el = self.element;
            var body = $('<div></div>').addClass('crud-body');
            var tbody = $('<tbody></tbody>').appendTo($('<table></table>').appendTo(body).addClass('crud-table').attr('data-seltype', o.selType));
            tbody.on('click', 'span.crud-row-btn.btn-edit', function (e) {
                var evt = $.Event('edititem');
                var row = $(e.currentTarget).parents('tr:first');
                evt.dataKey = row.data('key');
                evt.dataRow = row;
                el.trigger(evt);
            });
            tbody.on('click', 'span.crud-row-btn.btn-remove', function (e) {
                var evt = $.Event('removeitem');
                var row = $(e.currentTarget).parents('tr:first');
                evt.dataKey = row.data('key');
                evt.dataRow = row;
                el.trigger(evt);
            });
            tbody.on('click', 'tr > td:not(.btn-remove, .btn-edit)', function (e) {
                var row = $(e.currentTarget).parents('tr:first');
                self.selectItemByIndex(row[0].rowIndex);
            });
            return body;
        },
        _createActionButton: function (icon, title, cssClass) {
            var self = this, o = self.options, el = self.element;
            var span = $('<span></span>').addClass('crud-row-btn').addClass(cssClass).attr('title', title);
            $('<i></i>').appendTo(span).addClass(icon);
            return span;
        },
        addRow: function (data) {
            var self = this, o = self.options, el = self.element;
            var tbl = el.find('table.crud-table:first');
            var tbody = tbl.find('tbody:first');
            var row = $('<tr></tr>').appendTo(tbody);
            var btn = $('<td></td>').addClass('btn-edit').appendTo(row);
            self._createActionButton('fas fa-edit', 'Edit ' + o.itemName).addClass('btn-edit').appendTo(btn);
            for (var i = 0; i < o.columns.length; i++) {
                var col = o.columns[i];
                var td = $('<td></td>').appendTo(row);
                var div = $('<div></div>').appendTo(td).attr('data-bind', col.binding).attr('data-fmttype', col.fmtType).attr('data-fmtMask', col.fmtMask);
                if (typeof col.style !== 'undefined') div.css(col.style);
                if (typeof col.cellStyle !== 'undefined') td.css(col.cellStyle);
            }
            btn = $('<td></td>').addClass('btn-remove').appendTo(row);
            // Add in the buttons.
            self.dataBindRow(row, data);
            o.items.push(data);
            self._createActionButton('fas fa-trash', 'Remove ' + o.itemName).addClass('btn-remove').appendTo(btn);
            return row;
        },
        insertRow: function (ndx, data) {
            var self = this, o = self.options, el = self.element;
            if (ndx < 0 || ndx > o.items.length) ndx = o.items.length;
            var tbl = el.find('table.crud-table:first');
            var tbody = tbl.find('tbody:first');
            var row = tbody.find('tr').eq(ndx).after('<tr></tr>');
            var btn = $('<td></td>').addClass('btn-edit').appendTo(row);
            self._createActionButton('fas fa-edit', 'Edit ' + o.itemName).addClass('btn-edit').appendTo(btn);
            for (var i = 0; i < o.columns.length; i++) {
                var col = o.columns[i];
                var td = $('<td></td>').appendTo(row);
                var div = $('<div></div>').appendTo(td).attr('data-bind', col.binding).attr('data-fmttype', col.fmtType).attr('data-fmtMask', col.fmtMask);
                if (typeof col.style !== 'undefined') div.css(col.style);
                if (typeof col.cellStyle !== 'undefined') td.css(col.cellStyle);
            }
            btn = $('<td></td>').addClass('btn-remove').appendTo(row);
            // Add in the buttons.
            self.dataBindRow(row, data);
            o.items.splice(ndx, 0, data);
            self._createActionButton('fas fa-trash', 'Remove ' + o.itemName).addClass('btn-remove').appendTo(btn);
            return row;
        },
        saveRow: function (data) {
            var self = this, o = self.options, el = self.element;
            if (typeof o.key !== 'undefined') {
                // See if the key exists.
                var key = data[o.key];
                var row;
                el.find('table.crud-table:first > tbody > row').each(function () {
                    if (key === $(this).data('key')) {
                        row = $(this);
                        dataBinder.bind(row, data);
                        return false;
                    }
                });
                return typeof row === 'undefined' ? addRow(data) : row;
            }
            else
                self.addRow(data);
        },
        removeItemByIndex: function (ndx) {
            var self = this, o = self.options, el = self.element;
            let tbl = el.find('table.crud-table:first');
            tbl[0].deleteRow(ndx);
            if (o.items.length > ndx) o.items.splice(ndx, 1);
        },
        clear: function () {
            var self = this, o = self.options, el = self.element;
            el.find('table.crud-table:first > tbody > tr').remove();
            o.items = [];
        },
        dataBindRow: function (row, data) {
            var self = this, o = self.options, el = self.element;
            if (typeof o.key !== 'undefined') row.data('key', data[o.key]);
            dataBinder.bind(row, data);
        },
        _initList: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('crud-list');
            var caption = self._createCaption().appendTo(el);
            var header = self._createHeader().appendTo(el);
            var body = self._createBody().appendTo(el);
            if (typeof o.id !== 'undefined') el.attr('id', o.id);
            el.on('click', 'span.crud-row-btn.btn-edit', function (evt) {
                console.log('Edit clicked');
            });
            el.on('click', 'span.crud-row-btn.btn-remove', function (e) {
                e.stopPropagation();
                let row = $(e.currentTarget).parents('tr:first');
                // Now get the item from the list.
                let evt = $.Event('removeItem');
                evt.item = o.items.length > row[0].rowIndex ? o.items[row[0].rowIndex] : undefined;
                evt.itemIndex = row[0].rowIndex;
                el.trigger(evt);
            });
            self.actions(o.actions);
        },
        actions: function (val) {
            var self = this, o = self.options, el = self.element;
            if (typeof val === 'undefined') {
                return o.actions = {
                    canCreate: makeBool(el.attr('data-cancreate')),
                    canEdit: makeBool(el.attr('data-canedit')),
                    canRemove: makeBool(el.attr('data-canremove')),
                    canClear: makeBool(el.attr('data-canclear'))
                };
            }
            else {
                var acts = typeof o.actions !== 'undefined' ? o.actions : o.actions = {}
                for (var prop in val) {
                    var name = prop.toLowerCase();
                    switch (name) {
                        case 'cancreate':
                            acts.canCreate = makeBool(val[prop]);
                            el.attr(`data-${name}`, makeBool(val[prop]));
                            break;
                        case 'canedit':
                            acts.canUpdate = makeBool(val[prop]);
                            el.attr(`data-${name}`, makeBool(val[prop]));
                            break;
                        case 'canremove':
                            acts.canRemove = makeBool(val[prop]);
                            el.attr(`data-${name}`, makeBool(val[prop]));
                            break;
                        case 'canclear':
                            acts.canClear = makeBool(val[prop]);
                            el.attr(`data-${name}`, makeBool(val[prop]));
                    }
                }
            }
        },
        getItemByIndex: function (ndx) {
            var self = this, o = self.options, el = self.element;
            return ndx < o.items.length ? o.items[ndx] : undefined;
        },
        getItemIndexByKey: function (keyVal) {
            var self = this, o = self.options, el = self.element;
            if (typeof o.key !== 'string' || o.key === '') return -1;
            // Do it the hard way because there are issues with findIndex in some browsers.
            for (let i = 0; i < o.items.length; i++) {
                let itm = o.items[i];
                if (itm[o.key] === keyVal) return i;
            }
        },
        setSelectedIndex: function (ndx) {
            var self = this, o = self.options, el = self.element;
            let tbody = el.find('table.crud-table:first > tbody:first');
            let oldIndex = self.getSelectedIndex();
            if (oldIndex !== ndx) {
                // Clear any selections.
                if (oldIndex >= 0) tbody.children('tr').removeClass('selected');
                tbody.children('tr').eq(ndx).addClass('selected');
            }
            return oldIndex;
        },
        selectItemByIndex: function (ndx) {
            var self = this, o = self.options, el = self.element;
            var item = self.getItemByIndex(ndx);
            self.val(self.getKeyValue(item));
        },
        selectItemByKey: function (key) {
            var self = this, o = self.options, el = self.element;
            self.selectItemByIndex(self.getItemIndexByKey(key));
        },
        getSelectedIndex: function () {
            var self = this, o = self.options, el = self.element;
            let tbody = el.find('table.crud-table:first > tbody:first');
            let row = tbody.children('tr.selected:first');
            return row.length > 0 ? row[0].rowIndex : -1;
        },
        getKeyValue: function (obj) {
            var self = this, o = self.options, el = self.element;
            if (typeof o.key === 'undefined' || o.key === '' || typeof obj === 'undefined') return undefined;
            try {
                return eval(`obj['${o.key}']`);
            } catch (err) { console.log({ msg: `Error getting key value from crud list: ${err.message}`, obj: obj }); }
        },
        val: function (val) {
            var self = this, o = self.options, el = self.element;
            let tbl = el.find('table.crud-table:first');
            let oldSel = tbl.find('tbody:first > tr.selected');
            let oldIndex = oldSel.length > 0 ? oldSel[0].rowIndex : -1;
            let oldItem = oldIndex >= 0 ? self.getItemByIndex(oldSel[0].rowIndex) : undefined;
            if (typeof val !== 'undefined') {
                // We need to select the row from the incoming value.  This should
                // match what we have set for the key.
                let newIndex = self.getItemIndexByKey(val);
                let newItem = newIndex >= 0 ? o.items[newIndex] : undefined;

                // So now we should have the old item and the new item as well as the value
                // so trigger an event to see whether we should change to the new value.
                if (oldIndex !== newIndex) {
                    let evt = $.Event('beforeselchange');
                    evt.oldItem = oldItem;
                    evt.newItem = newItem;
                    evt.newIndex = newIndex;
                    el.trigger(evt);
                    if (!evt.isDefaultPrevented()) {
                        // The consumer said it was ok to change the value or didn't say no.
                        self.setSelectedIndex(evt.newIndex);
                        evt = $.Event('selchanged');
                        evt.oldItem = oldItem;
                        evt.newItem = newItem;
                        el.trigger(evt);
                    }
                }
            }
            else {
                return self.getKeyValue(oldItem);
            }
        }
    });
})(jQuery);
$.pic.fieldTip.showTip = function (el, opts) {
    $('<div></div>').appendTo(el).fieldTip(opts);
};
$.pic.fieldTip.clearTips = function (el) {
    if (el instanceof jQuery) {
        el.find('div.picFieldTip').remove();
    }
    else if (typeof el !== 'undefined')
        $(el).find('div.picFieldTip').remove();
    else
        $('div.picFieldTip').remove();
};
$.pic.modalDialog.createDialog = function (id, options) {
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
        dlg = $('<div id="' + id + '" style="display:block;position:relative;padding:4px;"></div>');
        dlg.modalDialog(opt);
    }
    dlg.modalDialog('open');
    return dlg;
};
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
        dlg = $('<div id="' + id + '" style="display:block;position:relative;padding:4px;"></div>');
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
            { text: 'Close', icon: '<i class="far fa-window-close"></i>', click: function () { dlg.modalDialog("close"); } }
        ]
    };
    opt.modal = true;
    opt.title = 'Error: ';
    if (typeof err.error === 'object' && err.error !== undefined && err.error.name)
        opt.title += err.error.name;
    else
        opt.title += 'General Error';
    var id = 'errorDialog' + _uniqueId++;
    if (typeof opt.autoOpen === 'undefined') opt.autoOpen = false;
    var dlg = $('div#' + id);
    if (dlg.length === 0) {
        dlg = $('<div id="' + id + '" style="display:block;position:relative;padding:4px;"></div>');
        $('<div></div>').appendTo(dlg).errorPanel(err);
        dlg.modalDialog(opt);
    }

    dlg.modalDialog('open');
    return dlg;
};



