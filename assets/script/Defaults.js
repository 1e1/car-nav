String.prototype.format = function (...a) {
    return (a[0]?.constructor === Object)
        ? this.replaceAll(/\${([^}]+)}/g, (match, name) => a[0].hasOwnProperty(name) ? a[0][name] : match)
        : this.replaceAll(/{([0-9]+)}/g, (match, index) => typeof a[index] == 'undefined' ? match : a[index]);
};

class Defaults {
    constructor(className, defaults) {
        // this.engine = localStorage;
        this.engine = sessionStorage;
        this.item = className;

        const r = this.read(className) ?? {};
        const p = Object.assign(r, defaults);
        this.write(p);
    }

    read() {
        const value = this.engine.getItem(this.item);

        return value===null ? {} : JSON.parse(value);
    }

    write(value) {
        this.engine.setItem(this.item, JSON.stringify(value));
    }

    reset() {
        this.engine.removeItem(this.item);
    }

    getRaw(key, defaultValue=null) {
        const o = this.read();
        return o.hasOwnProperty(key) ? o[key] : defaultValue;
    }

    get(key, ...replacements) {
        const v = this.getRaw(key, null);

        if (typeof v !== 'string') {
            return v;
        }
        
        return (replacements[0]?.constructor === Object)
            ? v.replaceAll(/\${([^}]+)}/g, (match, name) => replacements[0].hasOwnProperty(name) ? replacements[0][name] : match)
            : v.replaceAll(/{([0-9]+)}/g, (match, index) => typeof replacements[index] == 'undefined' ? match : replacements[index]);
    }

    _(...x) {
        this.get(...x);
    }
}

//Defaults._ = Defaults.get;

export { Defaults };
