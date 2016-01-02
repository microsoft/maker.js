/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/core/exporter.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/core/svg.ts" />
/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/intersect.ts" />
require.relativePath = '../examples/';
require.httpAlwaysGet = true;
var MakerJsPlayground;
(function (MakerJsPlayground) {
    var makerjs;
    MakerJsPlayground.svgStrokeWidthInPixels = 2;
    function runJavaScriptGetHTML(javaScript) {
        var module = {};
        var html = '';
        var model = null;
        //temporarily override document.write
        var originalDocumentWrite = document.write;
        document.write = function (markup) {
            html += markup;
        };
        //evaluate the javaScript code
        var Fn = new Function('require', 'module', 'document', javaScript);
        var result = new Fn(require, module, document); //call function with the "new" keyword so the "this" keyword is an instance
        //restore document.write to original
        document.write = originalDocumentWrite;
        //see if output is either a Node module, or a MakerJs.IModel
        if (module.exports) {
            //construct an IModel from the Node module
            var params = makerjs.kit.getParameterValues(module.exports);
            model = makerjs.kit.construct(module.exports, params);
        }
        else if (makerjs.isModel(result)) {
            model = result;
        }
        if (model) {
            var renderOptions = {
                //                origin: svgOrigin,
                //viewBox: false,
                //                stroke: 'red',
                strokeWidth: MakerJsPlayground.svgStrokeWidthInPixels + 'px',
            };
            if (model.units && window.navigator.userAgent.indexOf('Trident') > 0) {
                var pixelsPerInch = 100;
                var scale = makerjs.units.conversionScale(makerjs.unitType.Inch, model.units);
                var pixel = scale / pixelsPerInch;
                renderOptions.strokeWidth = (MakerJsPlayground.svgStrokeWidthInPixels * pixel * makerjs.exporter.svgUnit[model.units].scaleConversion).toString();
            }
            html += makerjs.exporter.toSVG(model, renderOptions);
        }
        return html;
    }
    MakerJsPlayground.runJavaScriptGetHTML = runJavaScriptGetHTML;
    function downloadScript(url) {
        require.returnSource = true;
        var script = require(url);
        require.returnSource = false;
        return script;
    }
    MakerJsPlayground.downloadScript = downloadScript;
    function doEval() {
        var text = MakerJsPlayground.myCodeMirror.getDoc().getValue();
        var html = runJavaScriptGetHTML(text);
        document.getElementById('view').innerHTML = html;
    }
    MakerJsPlayground.doEval = doEval;
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
        //need to call this to cache it once
        makerjs = require('makerjs');
        var textarea1 = document.getElementById('textarea1');
        var qps = new QueryStringParams();
        var scriptname = qps['script'];
        if (scriptname && !isHttp(scriptname)) {
            var script = downloadScript(scriptname);
            textarea1.value = script;
            var html = runJavaScriptGetHTML(script);
            document.getElementById('view').innerHTML = html;
        }
        MakerJsPlayground.myCodeMirror = CodeMirror.fromTextArea(textarea1, { lineNumbers: true, theme: 'twilight', viewportMargin: Infinity });
    };
})(MakerJsPlayground || (MakerJsPlayground = {}));
//# sourceMappingURL=playground.js.map