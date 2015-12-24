/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../target/ts/makerjs.d.ts" />
/// <reference path="../typings/marked/marked.d.ts" />

import fs = require('fs');
var browserify = require('browserify');
var pjson = require('../package.json');
var makerjs = <typeof MakerJs>require('../target/js/node.maker.js');
var marked = <MarkedStatic>require('marked');

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

function jekyll(layout: string, title: string) {
    //Jekyll liquid layout
    var dashes = '---';
    return [dashes, 'layout: ' + layout, 'title: ' + title, dashes, ''].join('\n');    
}

function demoIndexPage() {

    var listFile = fs.openSync('./demos/index.html', 'w');

    fs.write(listFile, jekyll('page', 'Demos'));

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

function homePage() {
    console.log('writing homepage');

    var homeFile = fs.openSync('./home.html', 'w');

    fs.write(homeFile, jekyll('page', 'Home'));

    writeHeading(homeFile, 'Latest demos');

    var max = 6;
    var i = 0;

    for (var key in pjson.dependencies) {
        if (key.indexOf(prefix) == 0) {
            var name = <string>key.substring(prefixLen);

            var ctor = <MakerJs.IKit>require(prefix + name);

            writeThumbnail(homeFile, name, ctor);
        }
        i++;
        if (i >= max) break;
    }

    //todo - link to "see all demos"

    console.log('writing about markdown');

    var readmeFile = fs.readFileSync('README.md', 'UTF8');
    var html = marked(readmeFile);

    fs.write(homeFile, html);

    fs.close(homeFile);
}

//demoIndexPage();

homePage();
