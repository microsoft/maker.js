/// <reference path="../typings/node/node.d.ts" />

import fs = require('fs');
var browserify = require('browserify');
var pjson = require('../package.json');
var makerjs = <typeof MakerJs>require('../target/js/node.maker.js');

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

function thumbnail(name: string, constructor: MakerJs.IKit) {
    var parameters = makerjs.kit.getParameterValues(constructor);
    var model = makerjs.kit.construct(constructor, parameters);

    var svg = makerjs.exporter.toSVG(model);

    var attrs = { 'class': 'thumb', 'title': name };

    var x = new makerjs.exporter.XmlTag('div', attrs);
    x.innerText = svg;
    x.innerTextEscaped = true;

    return x.toString();
}

function writeThumbnail(filenumber: number, name: string, constructor) {
    console.log('writing thumbnail ' + name);
    fs.write(filenumber, thumbnail(name, constructor));
    fs.write(filenumber, '\n\n');
}

function main() {

    var listFile = fs.openSync('./demos/list.html', 'w');
    fs.write(listFile, '---\nlayout: page\ntitle: Demos\n---\n');

    for (var key in pjson.dependencies) {
        if (key.indexOf(prefix) == 0) {
            var name = <string>key.substring(prefixLen);
            demoify(name);

            var ctor = <MakerJs.IKit>require(prefix + name);

            writeThumbnail(listFile, name, ctor);
        }
    }

    var sorted = [];

    for (var modelType in makerjs.models) {
        sorted.push(modelType);
    }

    sorted.sort();

    for (var i = 0; i < sorted.length; i++) {
        var modelType = sorted[i];
        writeThumbnail(listFile, modelType, makerjs.models[modelType]);
    }

    fs.closeSync(listFile);
}

main();
