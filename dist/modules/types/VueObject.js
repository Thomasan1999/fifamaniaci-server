"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VueString_1 = require("./VueString");
class VueObject {
    constructor(object = {}) {
        this.value = object;
    }
    camelCaseTo() {
        return Object.entries(this.value).reduce((a, [columnName, column]) => {
            a[new VueString_1.VueString(columnName).caseCamelTo().toString()] = column;
            return a;
        }, {});
    }
    entries() {
        return Object.entries(this.value);
    }
    filter(callback) {
        return new VueObject(Object.entries(this.value).filter((...args) => {
            //@ts-ignore
            return callback(...args);
        }).reduce((a, [key, value]) => {
            a[key] = value;
            return a;
        }, {}));
    }
    findNested(nestedValues) {
        return nestedValues.reduce((a, nestedValue) => {
            return a && a[nestedValue];
        }, this.value);
    }
    keys() {
        return Object.keys(this.value);
    }
    map(callback) {
        return new VueObject(Object.entries(this.value).reduce((a, [key, value], ...args) => {
            //@ts-ignore
            a[key] = callback([key, value], ...args);
            return a;
        }, {}));
    }
    unwrap() {
        return this.value[Object.keys(this.value)[0]];
    }
    values() {
        return Object.values(this.value);
    }
}
exports.VueObject = VueObject;
//# sourceMappingURL=VueObject.js.map