"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cookies = void 0;
class Cookies {
    constructor({ value }) {
        this.value = value ? Cookies.parse({ value }) : {};
    }
    static parse({ value }) {
        return value.split(`;`).reduce((a, cookiePart) => {
            const [cookieKey, cookieValue] = cookiePart.trim().replace(/= /g, `=`).split(`=`).map(decodeURIComponent);
            a[cookieKey] = (cookieKey.includes(`Active`) || cookieKey.match(/^id$|(Id)/)) ? Number(cookieValue) : cookieValue;
            return a;
        }, {});
    }
    update({ value }) {
        this.value = { ...this.value, ...Cookies.parse({ value }) };
    }
}
exports.Cookies = Cookies;
//# sourceMappingURL=Cookies.js.map