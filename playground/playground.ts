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

    interface IProcessedResult {
        html: string;
        model: MakerJs.IModel;
    }

    var processed: IProcessedResult = {
        html: '',
        model: null
    };

    export function processResult(html: string, result: any) {

        processed.html = html;
        processed.model = null;

        //see if output is either a Node module, or a MakerJs.IModel
        if (typeof result === 'function') {

            //construct an IModel from the Node module
            var params = makerjs.kit.getParameterValues(result);
            processed.model = makerjs.kit.construct(result, params);

        } else if (makerjs.isModel(result)) {
            processed.model = result;
        }

        document.body.removeChild(iframe);

        render();
    }

    export function render() {

        if (processed.model) {

            var pixelsPerInch = 100;

            var measure = makerjs.measure.modelExtents(processed.model);

            var viewScale = 1;

            if (processed.model.units) {                
                //cast into inches, then to pixels
                viewScale *= makerjs.units.conversionScale(processed.model.units, makerjs.unitType.Inch) * pixelsPerInch;
            }

            var renderOptions: MakerJs.exporter.ISVGRenderOptions = {
                //origin: [150, 0],
                annotate: (<HTMLInputElement>document.getElementById('check-annotate')).checked,
                //viewBox: false,
                scale: viewScale
            };

            var renderModel: MakerJs.IModel = {
                models: {
                    model: processed.model
                },
            };

            if (true) {

                renderModel.paths = {
                    'crosshairs-vertical': new makerjs.paths.Line([0, measure.low[1]], [0, measure.high[1]]),
                    'crosshairs-horizontal': new makerjs.paths.Line([measure.low[0], 0], [measure.high[0], 0])
                };

            }

            var html = processed.html;

            html += makerjs.exporter.toSVG(renderModel, renderOptions);
        }

        document.getElementById('view').innerHTML = html;
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