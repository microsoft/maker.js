/// <reference path="../typings/node/node.d.ts" />

import fs = require('fs');
var browserify = require('browserify');
var pjson = require('../package.json');
var makerjs = require('../target/js/node.maker.js');

var prefix = 'makerjs-';
var prefixLen = prefix.length;

function demoify(name: string) {
    var filename = './demos/' + name + '.js';
    console.log('writing ' + filename);
    var b = browserify();
    b.exclude('makerjs');
    b.require(prefix + name, { expose: name });
    b.bundle().pipe(fs.createWriteStream(filename));
}

function getRequireConstructor(name: string) {
    return require(prefix + name);
}

function thumbnail(name: string, constructor) {
    var parameters = makerjs.kit.getParameterValues(constructor);
    var model = makerjs.kit.construct(constructor, parameters);

    var svg = makerjs.exporter.toSVG(model);

    var attrs = { 'class': 'thumb', 'title': name };

    var x = new makerjs.exporter.XmlTag('div', attrs);
    x.innerText = svg;
    x.innerTextEscaped = true;

    return x.toString();
}

function main() {

    var listFile = fs.openSync('./demos/list.html', 'w');
    fs.write(listFile, '---\nlayout: page\ntitle: Demos\n---\n');

    for (var key in pjson.dependencies) {
        if (key.indexOf(prefix) == 0) {
            var name = <string>key.substring(prefixLen);
            demoify(name);

            var ctor = getRequireConstructor(name);
            fs.write(listFile, thumbnail(name, ctor));
            fs.write(listFile, '\n\n');
        }
    }

    fs.closeSync(listFile);
}

main();
