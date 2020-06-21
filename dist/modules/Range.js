"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Range {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    enumerate() {
        return Array(this.max - this.min + 1).fill(null).map((_, index) => {
            return this.min + index;
        });
    }
    includes(number) {
        return number >= this.min && number <= this.max;
    }
    incorporate(number) {
        return Math.min(Math.max(this.min, number), this.max);
    }
}
exports.Range = Range;
//# sourceMappingURL=Range.js.map