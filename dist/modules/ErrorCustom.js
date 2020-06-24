"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCustom = void 0;
class ErrorCustom {
    constructor({ at, err }) {
        this.value = { at, err };
        console.log(`${new Date().toISOString()} Error at ${at}: ${err}`);
    }
}
exports.ErrorCustom = ErrorCustom;
//# sourceMappingURL=ErrorCustom.js.map