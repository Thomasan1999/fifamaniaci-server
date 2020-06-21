"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modules_1 = require("../../modules");
const fs_extra_1 = require("fs-extra");
const path = require("path");
module.exports = ({ app, route }) => {
    app.get(route, async (req, res) => {
        const params = {
            lang: {}
        };
        const query = new modules_1.Query({ authRequired: false, params, query: req.query, res });
        if (!query.valid) {
            return;
        }
        const localesDir = path.resolve(__dirname, `../../locales`);
        const localesPath = path.resolve(localesDir, query.value.lang, `index.js`);
        if (!await fs_extra_1.pathExists(localesPath)) {
            res.status(400).json({ message: `Locale not found` });
            return;
        }
        res.json(require(localesPath).default);
    });
};
//# sourceMappingURL=locales.js.map