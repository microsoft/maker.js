/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../target/ts/makerjs.d.ts" />
/// <reference path="../typings/marked/marked.d.ts" />
var fs = require('fs');
var browserify = require('browserify');
var packageJson = require('../package.json');
var makerjs = require('../target/js/node.maker.js');
var marked = require('marked');
var detective = require('detective');
// Synchronous highlighting with highlight.js
marked.setOptions({
    highlight: function (code) {
        return require('highlight.js').highlightAuto(code).value;
    }
});
var thumbSize = { width: 140, height: 100 };
var allRequires = { 'makerjs': 1 };
function thumbnail(key, constructor, baseUrl) {
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
    return anchor(div.toString(), baseUrl + 'playground/?script=' + key, key, true);
}
function jekyll(layout, title) {
    //Jekyll liquid layout
    var dashes = '---';
    return [dashes, 'layout: ' + layout, 'title: ' + title, dashes, ''].join('\n');
}
function anchor(text, href, title, isEscaped) {
    var a = new makerjs.exporter.XmlTag('a', { "href": href, "title": title });
    a.innerText = text;
    if (isEscaped) {
        a.innerTextEscaped = true;
    }
    return a.toString();
}
function section(innerHtml) {
    var s = new makerjs.exporter.XmlTag('section', { "class": 'tsd-panel' });
    s.innerText = innerHtml;
    s.innerTextEscaped = true;
    return s.toString();
}
function getRequireKit(key) {
    if (key in packageJson.dependencies) {
        return require(key);
    }
    else {
        return require('../demos/js/' + key);
    }
}
function demoIndexPage() {
    var stream = fs.createWriteStream('./demos/index.html');
    stream.once('open', function (fd) {
        function writeHeading(heading) {
            var h2 = new makerjs.exporter.XmlTag('h2');
            h2.innerTextEscaped = true;
            h2.innerText = heading;
            stream.write(h2.toString());
            stream.write('\n\n');
        }
        function writeThumbnail(key, constructor, baseUrl) {
            console.log('writing thumbnail ' + key);
            stream.write(thumbnail(key, constructor, baseUrl));
            stream.write('\n\n');
        }
        stream.write(jekyll('page', 'Demos'));
        writeHeading('Models published on ' + anchor('NPM', 'https://www.npmjs.com/search?q=makerjs', 'search NPM for keyword "makerjs"'));
        for (var i = 0; i < packageJson.ordered_demo_list.length; i++) {
            var key = packageJson.ordered_demo_list[i];
            var ctor = getRequireKit(key);
            writeThumbnail(key, ctor, '../');
        }
        writeHeading('Models included with Maker.js');
        var sorted = [];
        for (var modelType in makerjs.models)
            sorted.push(modelType);
        sorted.sort();
        for (var i = 0; i < sorted.length; i++) {
            var modelType = sorted[i];
            writeThumbnail(modelType, makerjs.models[modelType], '../');
        }
        stream.end();
    });
}
function homePage() {
    console.log('writing homepage');
    var stream = fs.createWriteStream('./index.html');
    stream.once('open', function (fd) {
        stream.write(jekyll('default', 'Create parametric CNC drawings using JavaScript'));
        var h2 = new makerjs.exporter.XmlTag('h2');
        h2.innerText = 'Latest demos';
        var demos = [h2.toString()];
        var max = 6;
        for (var i = 0; i < packageJson.ordered_demo_list.length && i < max; i++) {
            var key = packageJson.ordered_demo_list[i];
            var ctor = getRequireKit(key);
            demos.push(thumbnail(key, ctor, ''));
        }
        var allDemosP = new makerjs.exporter.XmlTag('p');
        allDemosP.innerText = anchor('see all demos', "/maker.js/demos/#content");
        allDemosP.innerTextEscaped = true;
        demos.push(allDemosP.toString());
        stream.write(section(demos.join('\n')) + '\n');
        console.log('writing about markdown');
        var readmeMarkdown = fs.readFileSync('README.md', 'UTF8');
        var sections = readmeMarkdown.split('\n## ');
        //skip the first section, begin with 1
        for (var i = 1; i < sections.length; i++) {
            var sectionHtml = marked('## ' + sections[i]);
            stream.write(section(sectionHtml));
        }
        stream.end();
    });
}
function copyRequire(root, key, copyTo) {
    var dirpath = root + '/' + key + '/';
    console.log(dirpath);
    var dirjson = null;
    try {
        dirjson = fs.readFileSync(dirpath + 'package.json', 'UTF8');
    }
    catch (e) {
    }
    if (!dirjson)
        return;
    var djson = JSON.parse(dirjson);
    var main = djson.main;
    var src = fs.readFileSync(dirpath + main, 'UTF8');
    allRequires[key] = 1;
    fs.writeFileSync('./demos/js/' + copyTo + key + '.js', src, 'UTF8');
    var requires = detective(src);
    console.log('...requires ' + requires.length + ' libraries');
    for (var i = 0; i < requires.length; i++) {
        var irequire = requires[i];
        if (!(irequire in allRequires)) {
            console.log('requiring ' + irequire);
            copyRequire(dirpath + 'node_modules', irequire, '');
        }
        else {
            console.log('ignoring ' + irequire);
        }
    }
}
function copyDependencies() {
    var root = './';
    for (var key in packageJson.dependencies) {
        copyRequire('./node_modules', key, '');
    }
}
demoIndexPage();
homePage();
copyDependencies();
