"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Tomwork_1 = require("../Tomwork");
class Row {
    constructor({ io, pg, query = {}, req, res, value = {} } = {}) {
        this.io = io;
        this.pg = pg;
        this.query = query;
        this.req = req;
        this.res = res;
        this.value = value;
    }
    error({ message, status = 500 }) {
        if (this.res && message) {
            this.res.status(status).json({ message });
        }
    }
    get valueIndexed() {
        const copy = Tomwork_1.Tomwork.clone(this.value);
        delete copy.id;
        return { [this.value.id]: copy };
    }
}
exports.Row = Row;
//# sourceMappingURL=Row.js.map