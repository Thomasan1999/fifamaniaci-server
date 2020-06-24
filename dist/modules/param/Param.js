"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Param = void 0;
const __1 = require("..");
const params_1 = require("./params");
const types_1 = require("./types");
class Param {
    constructor({ length, max, min, name, required = true, type }) {
        this.name = name;
        this.type = type || (params_1.default[name] && params_1.default[name].type) || this._type;
        this.required = required;
        Object.entries(__1.Tomwork.merge(types_1.default.any, types_1.default[this.type])).forEach(([prop, value]) => {
            this[prop] = value;
        });
        Object.entries(params_1.default[name] || {}).forEach(([prop, value]) => {
            this[prop] = value;
        });
        this.length = { ...this.length, ...length };
        if (this.type === `integer` || this.type === `float`) {
            if (typeof this.min === `undefined`) {
                this.min = min || types_1.default[this.type].min || 0;
            }
            if (typeof this.max === `undefined`) {
                this.max = max || types_1.default[this.type].max;
            }
        }
    }
    get _type() {
        if (this.name.match(/^id$|Id/)) {
            return `integer`;
        }
        if (this.name.match(/token/i)) {
            return `hexadecimal`;
        }
        return `any`;
    }
}
exports.Param = Param;
//# sourceMappingURL=Param.js.map