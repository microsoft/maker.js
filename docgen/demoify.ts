/// <reference path="../typings/node/node.d.ts" />

import fs = require('fs');
var browserify = require('browserify');
var pjson = require('../package.json');
var makerjs = <typeof MakerJs>require('../target/js/node.maker.js');

var prefix = 'makerjs-';
var prefixLen = prefix.length;
var thumbSize = { width: 140, height: 100 };

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

    var measurement = makerjs.measure.modelExtents(model);
    var scaleX = measurement.high[0] - measurement.low[0];
    var scaleY = measurement.high[1] - measurement.low[1];

    var scale = Math.max(scaleX, scaleY);
    makerjs.model.scale(model, 100 / scale);

    var svg = makerjs.exporter.toSVG(model);

    var div = new makerjs.exporter.XmlTag('div', { "class": 'thumb' });
    div.innerText = svg;
    div.innerTextEscaped = true;

    var a = new makerjs.exporter.XmlTag('a', { "href": 'demo.html?demo=' + name, "title": name });
    a.innerText = div.toString();
    a.innerTextEscaped = true;
    
    return a.toString();
}

function writeThumbnail(filenumber: number, name: string, constructor) {
    console.log('writing thumbnail ' + name);
    fs.write(filenumber, thumbnail(name, constructor));
    fs.write(filenumber, '\n\n');
}

function writeHeading(filenumber: number, heading: string) {
    var h2 = new makerjs.exporter.XmlTag('h2');
    h2.innerText = heading;
    fs.write(filenumber, h2.toString());
    fs.write(filenumber, '\n\n');
}

function main() {

    var listFile = fs.openSync('./demos/index.html', 'w');

    //Jekyll liquid layout
    fs.write(listFile, '---\nlayout: page\ntitle: Demos\n---\n');

    writeHeading(listFile, 'Models published on NPM');

    for (var key in pjson.dependencies) {
        if (key.indexOf(prefix) == 0) {
            var name = <string>key.substring(prefixLen);
            demoify(name);

            var ctor = <MakerJs.IKit>require(prefix + name);

            writeThumbnail(listFile, name, ctor);
        }
    }

    writeHeading(listFile, 'Models included with Maker.js');

    var sorted = [];
    for (var modelType in makerjs.models) sorted.push(modelType);
    sorted.sort();

    for (var i = 0; i < sorted.length; i++) {
        var modelType = sorted[i];
        writeThumbnail(listFile, modelType, makerjs.models[modelType]);
    }

    fs.closeSync(listFile);
}

main();
