/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/core/exporter.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/core/svg.ts" />
/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/intersect.ts" />
var MakerJsPlayground;
(function (MakerJsPlayground) {
    MakerJsPlayground.relativePath = '../examples/';
    var iframe;
    var processed = {
        html: '',
        model: null
    };
    function processResult(html, result) {
        processed.html = html;
        processed.model = null;
        //see if output is either a Node module, or a MakerJs.IModel
        if (typeof result === 'function') {
            //construct an IModel from the Node module
            var params = MakerJsPlayground.makerjs.kit.getParameterValues(result);
            processed.model = MakerJsPlayground.makerjs.kit.construct(result, params);
        }
        else if (MakerJsPlayground.makerjs.isModel(result)) {
            processed.model = result;
        }
        document.body.removeChild(iframe);
        render();
    }
    MakerJsPlayground.processResult = processResult;
    function render() {
        if (processed.model) {
            var pixelsPerInch = 100;
            var measure = MakerJsPlayground.makerjs.measure.modelExtents(processed.model);
            var viewScale = 1;
            if (processed.model.units) {
                //cast into inches, then to pixels
                viewScale *= MakerJsPlayground.makerjs.units.conversionScale(processed.model.units, MakerJsPlayground.makerjs.unitType.Inch) * pixelsPerInch;
            }
            var renderOptions = {
                //origin: [150, 0],
                annotate: document.getElementById('check-annotate').checked,
                //viewBox: false,
                scale: viewScale
            };
            var renderModel = {
                models: {
                    model: processed.model
                },
            };
            if (true) {
                renderModel.paths = {
                    'crosshairs-vertical': new MakerJsPlayground.makerjs.paths.Line([0, measure.low[1]], [0, measure.high[1]]),
                    'crosshairs-horizontal': new MakerJsPlayground.makerjs.paths.Line([measure.low[0], 0], [measure.high[0], 0])
                };
            }
            var html = processed.html;
            html += MakerJsPlayground.makerjs.exporter.toSVG(renderModel, renderOptions);
        }
        document.getElementById('view').innerHTML = html;
    }
    MakerJsPlayground.render = render;
    function filenameFromRequireId(id) {
        return MakerJsPlayground.relativePath + id + '.js';
    }
    MakerJsPlayground.filenameFromRequireId = filenameFromRequireId;
    function downloadScript(url, callback) {
        var x = new XMLHttpRequest();
        x.open('GET', url, true);
        x.onreadystatechange = function () {
            if (x.readyState == 4 && x.status == 200) {
                callback(x.responseText);
            }
        };
        x.send();
    }
    MakerJsPlayground.downloadScript = downloadScript;
    function runCodeFromEditor() {
        iframe = document.createElement('iframe');
        iframe.src = 'require-iframe.html';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }
    MakerJsPlayground.runCodeFromEditor = runCodeFromEditor;
    function isHttp(url) {
        return "http" === url.substr(0, 4);
    }
    var QueryStringParams = (function () {
        function QueryStringParams(querystring) {
            if (querystring === void 0) { querystring = document.location.search.substring(1); }
            if (querystring) {
                var pairs = querystring.split('&');
                for (var i = 0; i < pairs.length; i++) {
                    var pair = pairs[i].split('=');
                    this[pair[0]] = decodeURIComponent(pair[1]);
                }
            }
        }
        return QueryStringParams;
    })();
    window.onload = function (ev) {
        MakerJsPlayground.makerjs = require('makerjs');
        var textarea = document.getElementById('javascript-code-textarea');
        MakerJsPlayground.codeMirrorEditor = CodeMirror.fromTextArea(textarea, { lineNumbers: true, theme: 'twilight', viewportMargin: Infinity });
        var qps = new QueryStringParams();
        var scriptname = qps['script'];
        if (scriptname && !isHttp(scriptname)) {
            downloadScript(filenameFromRequireId(scriptname), function (download) {
                MakerJsPlayground.codeMirrorEditor.getDoc().setValue(download);
                runCodeFromEditor();
            });
        }
        else {
            runCodeFromEditor();
        }
    };
})(MakerJsPlayground || (MakerJsPlayground = {}));
//# sourceMappingURL=playground.js.map