/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/core/exporter.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/core/svg.ts" />
/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/intersect.ts" />

declare var makerjs: typeof MakerJs;

module MakerJsPlayground {

    export var codeMirrorEditor: CodeMirror.Editor;
    export var relativePath = '../examples/';

    var pixelsPerInch = 100;
    var iframe: HTMLIFrameElement;
    var renderingOptionsMenu: HTMLDivElement;
    var view: HTMLDivElement;
    var hMargin: number;
    var vMargin: number;

    interface IProcessedResult {
        html: string;
        kit: MakerJs.IKit;
        model: MakerJs.IModel;
        paramValues: any[],
        paramHtml: string;
    }

    var processed: IProcessedResult = {
        html: '',
        kit: null,
        model: null,
        paramValues: [],
        paramHtml: ''
    };

    export function processResult(html: string, result: any) {

        processed.html = html;
        processed.model = null;
        processed.paramValues = null;
        processed.paramHtml = '';

        //see if output is either a Node module, or a MakerJs.IModel
        if (typeof result === 'function') {

            populateParams((<MakerJs.IKit>result).metaParameters);

            processed.kit = result;

            //construct an IModel from the Node module
            processed.model = makerjs.kit.construct(result, processed.paramValues);

        } else if (makerjs.isModel(result)) {
            processed.model = result;
        }

        //document.body.removeChild(iframe);

        document.getElementById('params').innerHTML = processed.paramHtml;

        render();
    }

    function populateParams(metaParameters: MakerJs.IMetaParameter[]) {

        if (metaParameters) {

            var paramValues = [];
            var paramHtml = '';

            for (var i = 0; i < metaParameters.length; i++) {
                var attrs = makerjs.cloneObject(metaParameters[i]);

                var id = 'input_' + i;
                var label = new makerjs.exporter.XmlTag('label', { "for": id, title: attrs.title });
                label.innerText = attrs.title + ': ';

                var input = null;

                switch (attrs.type) {

                    case 'range':
                        attrs.title = attrs.value;
                        input = new makerjs.exporter.XmlTag('input', attrs);
                        input.attrs['onchange'] = 'this.title=this.value;MakerJsPlayground.setParam(' + i + ', makerjs.round(this.valueAsNumber, .001))';
                        input.attrs['id'] = id;

                        paramValues.push(attrs.value);

                        break;

                    case 'bool':

                        var checkboxAttrs = {
                            id: id,
                            type: 'checkbox',
                            onchange: 'MakerJsPlayground.setParam(' + i + ', this.checked)'
                        };

                        if (attrs.value) {
                            checkboxAttrs['checked'] = true;
                        }

                        input = new makerjs.exporter.XmlTag('input', checkboxAttrs);

                        paramValues.push(attrs.value);

                        break;

                    case 'select':

                        var selectAttrs = {
                            id: id,
                            onchange: 'MakerJsPlayground.setParam(' + i + ', JSON.parse(this.options[this.selectedIndex].innerText))'
                        };

                        input = new makerjs.exporter.XmlTag('select', selectAttrs);
                        var options = '';

                        for (var j = 0; j < attrs.value.length; j++) {
                            var option = new makerjs.exporter.XmlTag('option');
                            option.innerText = JSON.stringify(attrs.value[j]);

                            options += option.toString();
                        }

                        input.innerText = options;
                        input.innerTextEscaped = true;

                        paramValues.push(attrs.value[0]);

                        break;
                }

                if (!input) continue;

                var div = new makerjs.exporter.XmlTag('div');
                div.innerText = label.toString() + input.toString();
                div.innerTextEscaped = true;
                paramHtml += div.toString();
            }
        }

        processed.paramValues = paramValues;
        processed.paramHtml = paramHtml;
    }

    export function setParam(index: number, value: any) {
        processed.paramValues[index] = value;

        //see if output is either a Node module, or a MakerJs.IModel
        if (processed.kit) {

            //construct an IModel from the kit
            processed.model = makerjs.kit.construct(processed.kit, processed.paramValues);
        }

        render();
    }

    export function render() {

        //remove content so default size can be measured
        view.innerHTML = '';

        if (processed.model) {

            var measure = makerjs.measure.modelExtents(processed.model);
            var height: number;
            var width: number;
            var viewScale = 1;

            //width mode
            if (true) {
                width = renderingOptionsMenu.offsetLeft - 2 * hMargin;
            } else {
                width = document.getElementById('view-params').offsetWidth;
            }
            height = view.offsetHeight - 2 * vMargin;

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

        view.innerHTML = html;
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

        renderingOptionsMenu = document.getElementById('rendering-options-menu') as HTMLDivElement;
        view = document.getElementById('view') as HTMLDivElement;

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