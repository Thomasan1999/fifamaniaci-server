"use strict";
exports.__esModule = true;
var gulp = require("gulp");
var child_process_1 = require("child_process");
gulp.task("nodemon", function () {
    var _a = child_process_1.spawn("nodemon.cmd", ["--exec", "npm", "start"]), stdout = _a.stdout, stderr = _a.stderr;
    stdout.on("data", function (data) {
        console.log(data.toString());
    });
    stderr.on("data", function (data) {
        console.log(data.toString());
    });
});
