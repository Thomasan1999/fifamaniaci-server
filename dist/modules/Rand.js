"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rand = void 0;
class Rand {
    static float({ min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
        return (Math.random() * (max - min)) + min;
    }
    static int({ min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
        return Math.floor((Math.random() * (max - min + 1))) + min;
    }
}
exports.Rand = Rand;
//# sourceMappingURL=Rand.js.map