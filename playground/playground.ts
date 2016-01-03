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

    var pixelsPerInch = 100;
    var iframe: HTMLIFrameElement;
    var hMargin: number;
    var vMargin: number;

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

        //remove content so default size can be measured
        document.getElementById('view').innerHTML = '';

        if (processed.model) {

            var measure = makerjs.measure.modelExtents(processed.model);
            var height: number;
            var width: number;
            var viewScale = 1;

            //width mode
            if (true) {
                width = document.getElementById("params").offsetLeft - 2 * hMargin;
            } else {
                width = document.getElementById("view-params").offsetWidth;
            }
            height = window.innerHeight - 9.75 * vMargin;

            if (processed.model.units) {
                //cast into inches, then to pixels
                viewScale *= makerjs.units.conversionScale(processed.model.units, makerjs.unitType.Inch) * pixelsPerInch;
            }

            if ((<HTMLInputElement>document.getElementById('check-fit-on-screen')).checked) {
                var modelHeightNatural = measure.high[1] - measure.low[1];
                var modelHeightInPixels = modelHeightNatural * viewScale;
                var modelWidthNatural = measure.high[0] - measure.low[0];
                var modelWidthInPixels = modelWidthNatural * viewScale;

                var scaleHeight = height / modelHeightInPixels;
                var scaleWidth = width / modelWidthInPixels;

                viewScale *= Math.min(scaleWidth, scaleHeight);
            }

            var renderOptions: MakerJs.exporter.ISVGRenderOptions = {
                origin: [width / 2, measure.high[1] * viewScale],
                annotate: (<HTMLInputElement>document.getElementById('check-annotate')).checked,
                svgAttrs: { id: 'view-svg' },
                scale: viewScale
            };

            var renderModel: MakerJs.IModel = {
                models: {
                    model: processed.model
                },
            };

            if ((<HTMLInputElement>document.getElementById('check-show-origin')).checked) {

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

        var viewMeasure = document.getElementById('view-measure');

        hMargin = viewMeasure.offsetLeft;
        vMargin = viewMeasure.offsetTop;

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