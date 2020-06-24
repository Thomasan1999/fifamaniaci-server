"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
const _1 = require(".");
class Token {
    constructor(length = 64) {
        const alphanumerical = `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`;
        this.value = Array(length).fill(null).map(() => {
            return alphanumerical[_1.Rand.int({ max: alphanumerical.length - 1 })];
        }).join(``);
    }
}
exports.Token = Token;
//# sourceMappingURL=Token.js.map