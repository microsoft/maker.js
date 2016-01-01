/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/core/exporter.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/core/svg.ts" />
/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/intersect.ts" />

//for TKRequire
interface NodeRequire {
    relativePath: string;
    returnSource: boolean;
    httpAlwaysGet: boolean;
}

require.relativePath = '../examples/';
require.httpAlwaysGet = true;

module MakerJsPlayground {

    var makerjs: typeof MakerJs;

    export var myCodeMirror: CodeMirror.Editor;

    interface MockNodeModule {
        exports?: any;
    }

    export function runJavaScriptGetHTML(javaScript: string): string {
        var module: MockNodeModule = {};
        var html = '';
        var model: MakerJs.IModel = null;

        //temporarily override document.write
        var originalDocumentWrite = document.write;
        document.write = function (markup) {
            html += markup;
        };

        //evaluate the javaScript code
        var Fn: any = new Function('require', 'module', 'document', javaScript);
        var result: any = new Fn(require, module, document); //call function with the "new" keyword so the "this" keyword is an instance

        //restore document.write to original
        document.write = originalDocumentWrite;

        //see if output is either a Node module, or a MakerJs.IModel
        if (module.exports) {

            //construct an IModel from the Node module
            var params = makerjs.kit.getParameterValues(module.exports);
            model = makerjs.kit.construct(module.exports, params);

        } else if (makerjs.isModel(result)) {
            model = result;
        }

        if (model) {
            html += makerjs.exporter.toSVG(model);
        }

        return html;
    }

    export function downloadScript(url) {
        require.returnSource = true;
        var script = require(url);
        require.returnSource = false;
        return script;
    }

    export function doEval() {
        var text = myCodeMirror.getDoc().getValue();

        var html = runJavaScriptGetHTML(text);

        document.getElementById('view').innerHTML = html;
    }

    function isHttp(url: string): boolean {
        return "http" === url.substr(0, 4);
    }

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

    window.onload = function (ev) {

        //need to call this to cache it once
        makerjs = require('makerjs');

        var textarea1 = document.getElementById('textarea1') as HTMLTextAreaElement;

        var qps = new QueryStringParams();
        var scriptname = qps['script'];

        if (scriptname && !isHttp(scriptname)) {

            var script = downloadScript(scriptname);
            textarea1.value = script;
            var html = runJavaScriptGetHTML(script);

            document.getElementById('view').innerHTML = html;
        }

        myCodeMirror = CodeMirror.fromTextArea(textarea1, { lineNumbers: true, theme: 'twilight', viewportMargin: Infinity });

    };
}