"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class VueNumber extends Number {
    get currencyFormat() {
        return new Intl.NumberFormat(`sk-SK`, {
            style: `currency`,
            currency: `EUR`
        }
        // @ts-ignore
        ).format(this).replace(/\s+(?=[^\d]+$)/, ``).replace(/[^\d]00(?=[^\d])/, ``);
    }
}
exports.VueNumber = VueNumber;
//# sourceMappingURL=VueNumber.js.map