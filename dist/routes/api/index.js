"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs_extra_1 = require("fs-extra");
module.exports = async ({ app, io, pg, subdomain = true }) => {
    const parentDir = await fs_extra_1.promises.readdir(path.dirname(__filename));
    parentDir.filter((filename) => {
        return path.extname(filename) !== `.map` && filename !== `index.js`;
    }).forEach((filename) => {
        const fileDir = path.resolve(__dirname, filename);
        const parentRoute = `/${path.relative(`${__dirname}${subdomain ? `` : `/..`}`, fileDir)}`;
        require(`./${filename}`)({ app, io, pg, route: parentRoute.replace(`\\`, `/`).split(`.`)[0] });
    });
};
//# sourceMappingURL=index.js.map