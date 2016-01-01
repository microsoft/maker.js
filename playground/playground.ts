/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/core/exporter.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/core/svg.ts" />
/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/intersect.ts" />

declare var makerjs: typeof MakerJs;

//for TKRequire
interface NodeRequire {
    relativePath: string;
}

require.relativePath = '../examples/';

module MakerJsPlayground {

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

}