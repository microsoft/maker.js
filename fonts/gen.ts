/// <reference path="../typings/node/node.d.ts" />

import * as fs from "fs";
import * as path from "path";

//TypeScript can't resolve import :(
var sortKeys = require("sort-keys");
var pc = require("pretty-camel");
var tags = require("./tags");

var out = {};

var dirs = fs.readdirSync(__dirname).filter(function (file) {
    return fs.statSync(path.join(__dirname, file)).isDirectory();
});

dirs.forEach(function (dir) {
    var ext = '.ttf';

    var fonts = fs.readdirSync(path.join(__dirname, dir)).filter(function (file) {
        return path.extname(file).toLowerCase() == ext;
    });

    fonts.forEach(function (font) {
        var name = font.substring(0, font.length - ext.length);
        var display = pc(name.replace(/-regular/i, '').replace('-', ''));
        var key = name.toLowerCase();
        out[key] = { displayName: display, path: [dir, font].join('/') };
    });
})

function write(fileName, content) {
    var fd = fs.openSync(path.join(__dirname, fileName), 'w');
    fs.writeSync(fd, content);
    fs.closeSync(fd);
}

var sorted = sortKeys(out, {
    compare: (a, b) => out[a].displayName.localeCompare(out[b].displayName)
});

for (var id in sorted) {
    sorted[id].tags = tags[id];
}

var json = JSON.stringify(sorted, null, '  ');

write('fonts.js', 'var fonts = ' + json + ';\n');
