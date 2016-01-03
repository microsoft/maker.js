/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/core/exporter.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/core/svg.ts" />
/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/intersect.ts" />

module MakerJsPlayground {

    export var codeMirrorEditor: CodeMirror.Editor;
    export var makerjs: typeof MakerJs;
    export var relativePath = '../examples/';

    var iframe: HTMLIFrameElement;

    export function processResult(html: string, result: any) {

        var model: MakerJs.IModel;

        //see if output is either a Node module, or a MakerJs.IModel
        if (typeof result === 'function') {

            //construct an IModel from the Node module
            var params = makerjs.kit.getParameterValues(result);
            model = makerjs.kit.construct(result, params);

        } else if (makerjs.isModel(result)) {
            model = result;
        }

        if (model) {

            var pixelsPerInch = 100;

            var measure = makerjs.measure.modelExtents(model);

            var viewScale = 1;

            if (model.units) {                
                //cast into inches, then to pixels
                viewScale *= makerjs.units.conversionScale(model.units, makerjs.unitType.Inch) * pixelsPerInch;
            }

            var renderOptions: MakerJs.exporter.ISVGRenderOptions = {
                //origin: svgOrigin,
                //annotate: document.getElementById('checkAnnotate').checked,
                //annotate: true,
                scale: viewScale
            };

            var renderModel: MakerJs.IModel;

            if (true) {

                renderModel = {
                    paths: {
                        'crosshairs-vertical': new makerjs.paths.Line([0, measure.low[1]], [0, measure.high[1]]),
                        'crosshairs-horizontal': new makerjs.paths.Line([measure.low[0], 0], [measure.high[0], 0])
                    },
                    models: {
                        model: model
                    },
                };

            } else {

                delete model.units;
                renderModel = model;
            }

            html += makerjs.exporter.toSVG(renderModel, renderOptions);
        }

        document.getElementById('view').innerHTML = html;

        document.body.removeChild(iframe);
    }

    export function filenameFromRequireId(id: string): string {
        return relativePath + id + '.js';
    }

    export function downloadScript(url: string, callback: (download: string) => void) {
        var x = new XMLHttpRequest();
        x.open('GET', url, true);
        x.onreadystatechange = function () {
            if (x.readyState == 4 && x.status == 200) {
                callback(x.responseText);
            }
        };
        x.send();
    }

    export function runCodeFromEditor() {
        iframe = document.createElement('iframe');
        iframe.src = 'require-iframe.html';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
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

        makerjs = require('makerjs');

        var textarea = document.getElementById('javascript-code-textarea') as HTMLTextAreaElement;
        codeMirrorEditor = CodeMirror.fromTextArea(textarea, { lineNumbers: true, theme: 'twilight', viewportMargin: Infinity });

        var qps = new QueryStringParams();
        var scriptname = qps['script'];

        if (scriptname && !isHttp(scriptname)) {

            downloadScript(filenameFromRequireId(scriptname), function (download: string) {
                codeMirrorEditor.getDoc().setValue(download);
                runCodeFromEditor();
            });
        } else {
            runCodeFromEditor();
        }

    };
}