/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../target/ts/makerjs.d.ts" />
/// <reference path="../typings/marked/marked.d.ts" />

import fs = require('fs');
var browserify = require('browserify');
var pjson = require('../package.json');
var makerjs = <typeof MakerJs>require('../target/js/node.maker.js');
var marked = <MarkedStatic>require('marked');
var detective = require('detective');

// Synchronous highlighting with highlight.js
marked.setOptions({
    highlight: function (code) {
        return require('highlight.js').highlightAuto(code).value;
    }
});

var prefix = 'makerjs-';
var prefixLen = prefix.length;
var thumbSize = { width: 140, height: 100 };
var allRequires = { 'makerjs': 1 };

function demoify(name: string) {
    var filename = './demos/' + name + '.js';
    console.log('writing ' + filename);
    var b = browserify();
    b.exclude('makerjs');
    b.require(prefix + name, { expose: name });
    b.bundle().pipe(fs.createWriteStream(filename));
}

function thumbnail(name: string, constructor: MakerJs.IKit, baseUrl: string) {
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

    return anchor(div.toString(), baseUrl + 'demo.html?demo=' + name, name, true);
}

function jekyll(layout: string, title: string) {
    //Jekyll liquid layout
    var dashes = '---';
    return [dashes, 'layout: ' + layout, 'title: ' + title, dashes, ''].join('\n');    
}

function anchor(text: string, href: string, title?: string, isEscaped?: boolean) {
    var a = new makerjs.exporter.XmlTag('a', { "href": href, "title": title });
    a.innerText = text;

    if (isEscaped) {
        a.innerTextEscaped = true;
    }

    return a.toString();
}

function demoIndexPage() {

    var stream = fs.createWriteStream('./demos/index.html');
    stream.once('open', function (fd) {

        function writeHeading(heading: string) {
            var h2 = new makerjs.exporter.XmlTag('h2');
            h2.innerTextEscaped = true;
            h2.innerText = heading;
            stream.write(h2.toString());
            stream.write('\n\n');
        }

        function writeThumbnail(name: string, constructor, baseUrl: string) {
            console.log('writing thumbnail ' + name);
            stream.write(thumbnail(name, constructor, baseUrl));
            stream.write('\n\n');
        }

        stream.write(jekyll('page', 'Demos'));

        writeHeading('Models published on ' + anchor('NPM', 'https://www.npmjs.com/search?q=makerjs', 'search NPM for keyword "makerjs"'));

        for (var key in pjson.dependencies) {
            if (key.indexOf(prefix) == 0) {
                var name = <string>key.substring(prefixLen);
                demoify(name);

                var ctor = <MakerJs.IKit>require(prefix + name);

                writeThumbnail(name, ctor, '');
            }
        }

        writeHeading('Models included with Maker.js');

        var sorted = [];
        for (var modelType in makerjs.models) sorted.push(modelType);
        sorted.sort();

        for (var i = 0; i < sorted.length; i++) {
            var modelType = sorted[i];
            writeThumbnail(modelType, makerjs.models[modelType], '');
        }

        stream.end();
    });
}

function homePage() {
    console.log('writing homepage');

    var stream = fs.createWriteStream('./index.html');
    stream.once('open', function (fd) {

        stream.write(jekyll('page', 'Maker.js'));

        var h2 = new makerjs.exporter.XmlTag('h2');
        h2.innerText = 'Latest demos';

        var demos = [h2.toString()];

        var max = 6;
        var i = 0;

        for (var key in pjson.dependencies) {
            if (key.indexOf(prefix) == 0) {
                var name = <string>key.substring(prefixLen);

                var ctor = <MakerJs.IKit>require(prefix + name);

                demos.push(thumbnail(name, ctor, 'demos/'));
            }
            i++;
            if (i >= max) break;
        }


        var allDemosP = new makerjs.exporter.XmlTag('p');
        allDemosP.innerText = anchor('see all demos', "/maker.js/demos/#content");
        allDemosP.innerTextEscaped = true;

        demos.push(allDemosP.toString());

        var demosHtml = demos.join('\n');

        stream.write(demosHtml + '\n');

        console.log('writing about markdown');

        var readmeMarkdown = fs.readFileSync('README.md', 'UTF8');
        var find = '## Features';
        var pos = readmeMarkdown.indexOf(find);
        var html = marked(readmeMarkdown.substring(pos));

        stream.write(html);

        stream.end();
    });

}

function copyRequire(root, key, copyTo) {

    var dirpath = root + '/' + key + '/';

    console.log(dirpath);

    var dirjson: string = null;

    try {
        dirjson = fs.readFileSync(dirpath + 'package.json', 'UTF8');
    }
    catch (e) {
    }

    if (!dirjson) return;

    var djson = JSON.parse(dirjson);
    var main = djson.main;
    var src = fs.readFileSync(dirpath + main, 'UTF8');

    allRequires[key] = 1;
    fs.writeFileSync('./playground/' + copyTo + key + '.js', src, 'UTF8');

    var requires = <string[]>detective(src);

    for (var i = 0; i < requires.length; i++) {
        var irequire = requires[i];
        if (!(irequire in allRequires)) {

            copyRequire(dirpath + 'node_modules', irequire, 'requirements/');
        }
    }
}

function playground() {

    var root = './';

    for (var key in pjson.dependencies) {
        copyRequire('./node_modules', key, 'dependencies/');
    }

}

demoIndexPage();

homePage();

//playground();
