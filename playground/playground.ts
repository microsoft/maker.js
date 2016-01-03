/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/core/exporter.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/core/svg.ts" />
/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/intersect.ts" />

module MakerJsPlayground {

    export var myCodeMirror: CodeMirror.Editor;
    export var svgStrokeWidthInPixels = 2;
    export var makerjs: typeof MakerJs;

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

            var renderOptions: MakerJs.exporter.ISVGRenderOptions = {
                //origin: svgOrigin,
                //viewBox: false,
                //stroke: 'red',
                strokeWidth: svgStrokeWidthInPixels + 'px',
                //annotate: document.getElementById('checkAnnotate').checked,
                //scale: Viewer.ViewScale * .8,
                //useSvgPathOnly: false,
                //svgAttrs: { id: 'svg1' }
            };

            //handle old IE
            if (model.units && window.navigator.userAgent.indexOf('Trident') > 0) {
                var pixelsPerInch = 100;
                var scale = makerjs.units.conversionScale(makerjs.unitType.Inch, model.units);
                var pixel = scale / pixelsPerInch;
                renderOptions.strokeWidth = (svgStrokeWidthInPixels * pixel * makerjs.exporter.svgUnit[model.units].scaleConversion).toString();
            }

            html += makerjs.exporter.toSVG(model, renderOptions);
        }

        document.getElementById('view').innerHTML = html;

        document.body.removeChild(iframe);
    }

    //export function downloadScript(url) {
    //    //require.returnSource = true;
    //    var script = require(url);
    //    //require.returnSource = false;
    //    return script;
    //}

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
        myCodeMirror = CodeMirror.fromTextArea(textarea, { lineNumbers: true, theme: 'twilight', viewportMargin: Infinity });

        var qps = new QueryStringParams();
        var scriptname = qps['script'];

        if (scriptname && !isHttp(scriptname)) {

            //var script = downloadScript(scriptname);


            //textarea1.value = script;
            //var html = runJavaScriptGetHTML(script);

            //document.getElementById('view').innerHTML = html;
        }


    };
}