"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulp = require("gulp");
const child_process_1 = require("child_process");
gulp.task(`nodemon`, () => {
    const { stdout, stderr } = child_process_1.spawn(`nodemon.cmd`);
    stdout.on(`data`, (data) => {
        console.log(data.toString());
    });
    stderr.on(`data`, (data) => {
        console.log(data.toString());
    });
});
//# sourceMappingURL=gulpfile.js.map