"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const changeCase = require("change-case");
//TypeScript can't resolve import :(
var sortKeys = require("sort-keys");
var fontRoot = path.join(__dirname, "../../docs/fonts/");
var tags = require(path.join(fontRoot, "tags.json"));
var out = {};
var dirs = fs.readdirSync(fontRoot).filter(function (file) {
    return fs.statSync(path.join(fontRoot, file)).isDirectory();
});
dirs.forEach(function (dir) {
    var ext = '.ttf';
    var fonts = fs.readdirSync(path.join(fontRoot, dir)).filter(function (file) {
        return path.extname(file).toLowerCase() == ext;
    });
    fonts.forEach(function (font) {
        var name = font.substring(0, font.length - ext.length);
        var display = changeCase.capitalCase(name.replace(/-regular/i, '').replace('-', ''));
        var key = name.toLowerCase();
        out[key] = { displayName: display, path: [dir, font].join('/') };
    });
});
function write(fileName, content) {
    var fd = fs.openSync(path.join(fontRoot, fileName), 'w');
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
write('../../docs/fonts/fonts.js', 'var playgroundFonts = ' + json + ';\n');
console.log('playgroundFonts written successfully');
