/// <reference path="../typings/node/node.d.ts" />

import * as fs from "fs";
import * as path from "path";

var out = {};

var dirs = fs.readdirSync(__dirname).filter(function (file) {
    return fs.statSync(path.join(__dirname, file)).isDirectory();
});

dirs.forEach(function (dir) {
    var ext = '.ttf';
     
    var fonts = fs.readdirSync(path.join(__dirname, dir)).filter(function (file) {
        return path.extname(file).toLowerCase() == ext;
    });

    fonts.forEach(function(font){
        var name = font.substring(0, font.length - ext.length);
        var display = name.replace(/-regular/i, '');
        var key = name.toLowerCase();
        out[key] = { displayName: display, path: [dir, font].join('/'), bin: null };
    });
})

function write(fileName, content) {
    var fd = fs.openSync(path.join(__dirname, fileName), 'w');
    fs.writeSync(fd, content);
    fs.closeSync(fd);
}

var json = JSON.stringify(out, null, '  ');

write('fonts.json', json);
write('fonts.js', 'var fonts = ' + json + ';\n');
