/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/core/exporter.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/core/svg.ts" />
/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/intersect.ts" />
require.relativePath = '../examples/';
var MakerJsPlayground;
(function (MakerJsPlayground) {
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
            html += makerjs.exporter.toSVG(model);
        }
        return html;
    }
    MakerJsPlayground.runJavaScriptGetHTML = runJavaScriptGetHTML;
})(MakerJsPlayground || (MakerJsPlayground = {}));
