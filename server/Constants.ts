import * as util from 'util';

export class Timestamp {
  public static toISOLocal(dt): string {
    let tzo = dt.getTimezoneOffset();
    var pad = function (n) {
      var t = Math.floor(Math.abs(n));
      return (t < 10 ? '0' : '') + t;
    };
    return new Date(dt.getTime() - (tzo * 60000)).toISOString().slice(0, -1) + (tzo > 0 ? '-' : '+') + pad(tzo / 60) + pad(tzo % 60)
  }
}
export class Utils {
    public makeBool(val) {
        if (typeof (val) === 'boolean') return val;
        if (typeof (val) === 'undefined') return false;
        if (typeof (val) === 'number') return val >= 1;
        if (typeof (val) === 'string') {
            if (val === '' || typeof val === 'undefined') return false;
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
    public uuid(a?, b?) { for (b = a = ''; a++ < 36; b += a * 51 & 52 ? (a ^ 15 ? 8 ^ Math.random() * (a ^ 20 ? 16 : 4) : 4).toString(16) : '-'); return b }
    public convert = {
        temperature: {
            f: {
                k: (val) => { return (val - 32) * (5 / 9) + 273.15; },
                c: (val) => { return (val - 32) * (5 / 9); },
                f: (val) => { return val; }
            },
            c: {
                k: (val) => { return val + 273.15; },
                c: (val) => { return val; },
                f: (val) => { return (val * (9 / 5)) + 32; }
            },
            k: {
                k: (val) => { return val; },
                c: (val) => { return val - 273.15; },
                f: (val) => { return ((val - 273.15) * (9 / 5)) + 32; }
            },
            convertUnits: (val: number, from: string, to: string) => {
                if (typeof val !== 'number') return null;
                let fn = this.convert.temperature[from.toLowerCase()];
                if (typeof fn !== 'undefined' && typeof fn[to.toLowerCase()] === 'function') return fn[to.toLowerCase()](val);
            }
        },
        volume: {
            gal: {
                l: (val) => { return val * 3.78541; },
                ml: (val) => { return val * 3.78541 * 1000; },
                cl: (val) => { return val * 3.78541 * 100; },
                gal: (val) => { return val; },
                oz: (val) => { return val * 128; },
                pint: (val) => { return val / 8; },
                qt: (val) => { return val / 4; },
            },
            l: {
                l: (val) => { return val; },
                ml: (val) => { return val * 1000; },
                cl: (val) => { return val * 100; },
                gal: (val) => { return val * 0.264172; },
                oz: (val) => { return val * 33.814; },
                pint: (val) => { return val * 2.11338; },
                qt: (val) => { return val * 1.05669; },
            },
            ml: {
                l: (val) => { return val * .001; },
                ml: (val) => { return val; },
                cl: (val) => { return val * .1; },
                gal: (val) => { return val * 0.000264172; },
                oz: (val) => { return val * 0.033814; },
                pint: (val) => { return val * 0.00211338; },
                qt: (val) => { return val * 0.00105669; },
            },
            cl: {
                l: (val) => { return val * .01; },
                ml: (val) => { return val * 10; },
                cl: (val) => { return val; },
                gal: (val) => { return val * 0.00264172; },
                oz: (val) => { return val * 0.33814; },
                pint: (val) => { return val * 0.0211338; },
                qt: (val) => { return val * 0.0105669; },
            },
            oz: {
                l: (val) => { return val * 0.0295735; },
                ml: (val) => { return val * 29.5735; },
                cl: (val) => { return val * 2.95735; },
                gal: (val) => { return val * 0.0078125; },
                oz: (val) => { return val; },
                pint: (val) => { return val * 0.0625; },
                qt: (val) => { return val * 0.03125; },
            },
            pint: {
                l: (val) => { return val * 0.473176; },
                ml: (val) => { return val * 473.176; },
                cl: (val) => { return val * 47.3176; },
                gal: (val) => { return val * 0.125; },
                oz: (val) => { return val * 16; },
                pint: (val) => { return val; },
                qt: (val) => { return val * 0.5; },
            },
            qt: {
                l: (val) => { return val * 0.946353; },
                ml: (val) => { return val * 946.353; },
                cl: (val) => { return val * 94.6353; },
                gal: (val) => { return val * 0.25; },
                oz: (val) => { return val * 32; },
                pint: (val) => { return val * 2; },
                qt: (val) => { return val; },

            },
            convertUnits: (val: number, from: string, to: string) => {
                if (typeof val !== 'number') return null;
                let fn = this.convert.volume[from.toLowerCase()];
                if (typeof fn !== 'undefined' && typeof fn[to.toLowerCase()] === 'function') return fn[to.toLowerCase()](val);
            }
        }
    }
    public formatDuration(seconds: number): string {
        if (seconds === 0) return '0sec';
        var fmt = '';
        let hrs = Math.floor(seconds / 3600);
        let min = Math.floor((seconds - (hrs * 3600)) / 60);
        let sec = seconds - ((hrs * 3600) + (min * 60));
        if (hrs > 1) fmt += (hrs.toString() + 'hrs');
        else if (hrs > 0) fmt += (hrs.toString() + 'hr');

        if (min > 0) fmt += ' ' + (min + 'min');
        if (sec > 0) fmt += ' ' + (sec + 'sec');
        return fmt.trim();
    }
    public parseNumber(val: string): number {
        if (typeof val === 'number') return val;
        else if (typeof val === 'undefined' || val === null) return;
        let tval = val.replace(/[^0-9\.\-]+/g, '');
        let v;
        if (tval.indexOf('.') !== -1) {
            v = parseFloat(tval);
            v = this.roundNumber(v, tval.length - tval.indexOf('.'));
        }
        else v = parseInt(tval, 10);
        return v;
    }
    public roundNumber(num, dec) { return +(Math.round(+(num + 'e+' + dec)) + 'e-' + dec); };
    public parseDuration(duration: string): number {
        if (typeof duration === 'number') return parseInt(duration, 10);
        else if (typeof duration !== 'string') return 0;
        let seconds = 0;
        let arr = duration.split(' ');
        for (let i = 0; i < arr.length; i++) {
            let s = arr[i];
            if (s.endsWith('sec')) seconds += this.parseNumber(s);
            if (s.endsWith('min')) seconds += (this.parseNumber(s) * 60);
            if (s.endsWith('hr')) seconds += (this.parseNumber(s) * 3600);
            if (s.endsWith('hrs')) seconds += (this.parseNumber(s) * 3600);
        }
        return seconds;
    }
    public isNullOrEmpty(val: any) { return (typeof val === 'string') ? val === null || val === '' : typeof val === 'undefined' || val === null; }
    public sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    // Use this method to get around the circular references for the toJSON function.
    public serialize(obj, fn?: (key, value) => any): string {
        let op = Object.getOwnPropertyNames(obj);
        let s = '{';
        for (let i in op) {
            let prop = op[i];
            if (typeof obj[prop] === 'undefined' || typeof obj[prop] === 'function') continue;
            let v = typeof fn === 'function' ? fn(prop, obj[prop]) : obj[prop];
            if (typeof v === 'undefined') continue;
            s += `"${prop}": ${JSON.stringify(v, fn)},`;
        }
        if (s.charAt(s.length - 1) === ',') s = s.substring(0, s.length - 1);
        return s + '}';
    }
    public replaceProps(obj, fn?: (key, value) => any): any {
        let op = Object.getOwnPropertyNames(obj);
        if (typeof obj === 'undefined') return undefined;
        let isArray = Array.isArray(obj);
        let o = isArray ? [] : {};
        for (let i in op) {
            let prop = op[i];
            if (typeof obj[prop] === 'undefined' || typeof obj[prop] === 'function') continue;
            let v = typeof fn === 'function' ? fn(prop, obj[prop]) : obj[prop];
            if (typeof v === 'undefined') continue;
            if (util.types.isBoxedPrimitive(v))
                o[prop] = v.valueOf();
            if (Array.isArray(v) || typeof v === 'object')
                o[prop] = utils.replaceProps(v, fn);
            else
                o[prop] = v;
        }
        return o;
    }
}
export const utils = new Utils();