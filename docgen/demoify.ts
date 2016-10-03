/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/maker.js/makerjs.d.ts" />

import fs = require('fs');
var browserify = require('browserify');
var packageJson = require('../package.json');
var makerjs = <typeof MakerJs>require('../target/js/node.maker.js');
var marked = <MarkedStatic>require('marked');
var detective = require('detective');
var opentype = require('opentype.js') as typeof opentypejs;

class QueryStringParams {

    constructor(querystring: string = document.location.search.substring(1)) {
        if (querystring) {
            var pairs = querystring.split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                this[pair[0]] = decodeURIComponent(pair[1]);
            }
        }
    }
}

// Synchronous highlighting with highlight.js
marked.setOptions({
    highlight: function (code) {
        return require('highlight.js').highlightAuto(code).value;
    }
});

var thumbSize = { width: 140, height: 100 };
var allRequires = { 'makerjs': 1 };

function thumbnail(key: string, kit: Kit, baseUrl: string) {
    var parameters = kit.params || makerjs.kit.getParameterValues(kit.ctor);

    if (key === 'Text') {
        parameters = [
            opentype.loadSync('./fonts/stardosstencil/StardosStencil-Regular.ttf'),
            'A'
        ];
    } else {
        if (kit.ctor.metaParameters) {
            kit.ctor.metaParameters.forEach((metaParameter, i) => {
                if (metaParameter.type === 'font') {
                    parameters[i] = opentype.loadSync('./fonts/allertastencil/AllertaStencil-Regular.ttf')
                }
            });
        }
    }

    var model = makerjs.kit.construct(kit.ctor, parameters);

    var measurement = makerjs.measure.modelExtents(model);
    var scaleX = measurement.high[0] - measurement.low[0];
    var scaleY = measurement.high[1] - measurement.low[1];

    var scale = Math.max(scaleX, scaleY);
    makerjs.model.scale(model, 100 / scale);

    var svg = makerjs.exporter.toSVG(model);

    var div = new makerjs.exporter.XmlTag('div', { "class": 'thumb' });
    div.innerText = svg;
    div.innerTextEscaped = true;

    return anchor(div.toString(), baseUrl + 'playground/?script=' + key, key, true, 'thumb-link');
}

function jekyll(layout: string, title: string) {
    //Jekyll liquid layout
    var dashes = '---';
    return [dashes, 'layout: ' + layout, 'title: ' + title, dashes, ''].join('\n');
}

function anchor(text: string, href: string, title?: string, isEscaped?: boolean, cssClass?: string) {
    var a = new makerjs.exporter.XmlTag('a', { "href": href, "title": title, "class": cssClass });
    a.innerText = text;

    if (isEscaped) {
        a.innerTextEscaped = true;
    }

    return a.toString();
}

function sectionTag() {
    return new makerjs.exporter.XmlTag('section', { "class": 'tsd-panel' });
}
function section(innerHtml: string) {
    var s = sectionTag();
    s.innerText = innerHtml;
    s.innerTextEscaped = true;
    return s.toString();
}

interface Kit {
    ctor: MakerJs.IKit;
    params?: any[];
}

function getRequireKit(spec: string): Kit {

    var split = spec.split('#');
    var key = split[0];
    var kvp = split[1];

    var result: Kit;

    if (key in packageJson.dependencies) {
        result = {
            ctor: require(key)
        };
    } else if (key in makerjs.models) {
        result = {
            ctor: makerjs.models[key]
        };
    } else {
        result = {
            ctor: require('../demos/js/' + key)
        };
    }

    if (kvp) {
        var qp = new QueryStringParams(kvp);
        var params = qp['params'];
        if (params) {
            result.params = JSON.parse(params);
        }
    }

    return result;
}

function demoIndexPage() {

    var stream = fs.createWriteStream('./demos/index.html');
    stream.once('open', function (fd) {

        function writeHeading(level: number, heading: string) {
            var h = new makerjs.exporter.XmlTag('h' + level);
            h.innerTextEscaped = true;
            h.innerText = heading;
            stream.write(h.toString());
            stream.write('\n\n');
        }

        function writeThumbnail(key: string, kit: Kit, baseUrl: string) {
            console.log('writing thumbnail ' + key);
            stream.write(thumbnail(key, kit, baseUrl));
            stream.write('\n\n');
        }

        var st = sectionTag();

        stream.write(jekyll('default', 'Demos'));

        writeHeading(1, 'Demos');

        var yourDemoHtml = marked('### How to add your own demo to this gallery:\n 1. Fork the Maker.js repo on GitHub.\n 2. Add your code to [the demos folder](https://github.com/Microsoft/maker.js/tree/gh-pages/demos/js).\n 3. Submit a pull request!');

        stream.write(section(yourDemoHtml));

        stream.write(st.getOpeningTag(false));

        writeHeading(2, 'Models published on ' + anchor('NPM', 'https://www.npmjs.com/search?q=makerjs', 'search NPM for keyword "makerjs"'));

        for (var i = 0; i < packageJson.ordered_demo_list.length; i++) {
            var key = packageJson.ordered_demo_list[i];
            var kit = getRequireKit(key);

            writeThumbnail(key, kit, '../');
        }

        stream.write(st.getClosingTag());

        stream.write(st.getOpeningTag(false));

        writeHeading(2, 'Models included with Maker.js');

        var sorted = [];
        for (var modelType in makerjs.models) sorted.push(modelType);
        sorted.sort();

        for (var i = 0; i < sorted.length; i++) {
            var modelType2 = sorted[i];
            writeThumbnail(modelType2, { ctor: makerjs.models[modelType2] }, '../');
        }

        stream.write(st.getClosingTag());

        stream.end();
    });
}

function homePage() {
    console.log('writing homepage');

    var stream = fs.createWriteStream('./index.html');
    stream.once('open', function (fd) {

        stream.write(jekyll('default', 'Create parametric CNC drawings using JavaScript'));

        var anim = new makerjs.exporter.XmlTag('img', { src: '/maker.js/images/anim-wheel.gif' });

        var h2 = new makerjs.exporter.XmlTag('h2');
        h2.innerText = 'Latest demos';

        var demos = [anim.toString(), h2.toString()];

        var max = 6;

        for (var i = 0; i < packageJson.ordered_demo_list.length && i < max; i++) {
            var key = packageJson.ordered_demo_list[i];
            var kit = getRequireKit(key);

            demos.push(thumbnail(key, kit, ''));
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

    fs.writeFileSync('./demos/js/' + copyTo + key + '.js', src, 'UTF8');

    var requires = <string[]>detective(src);

    console.log('...requires ' + requires.length + ' libraries');

    for (var i = 0; i < requires.length; i++) {
        var irequire = requires[i];

        if (!(irequire in allRequires)) {
            console.log('requiring ' + irequire);

            copyRequire(dirpath + 'node_modules', irequire, '');
        } else {
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
