/// <reference path="../typings/tsd.d.ts" />
/// <reference path="export-format.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/models/connectthedots.ts" />
/// <reference path="../typings/codemirror/codemirror.d.ts" />
/// <reference path="../typings/marked/marked.d.ts" />

declare var makerjs: typeof MakerJs;

module MakerJsPlayground {

    //classes

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

    //interfaces

    interface IProcessedResult {
        html: string;
        kit: MakerJs.IKit;
        model: MakerJs.IModel;
        paramValues: any[],
        paramHtml: string;
    }

    export interface IJavaScriptErrorDetails {
        colno: number;
        lineno: number;
        message: string;
        name: string;
    }

    //private members

    var pixelsPerInch = 100;
    var iframe: HTMLIFrameElement;
    var customizeMenu: HTMLDivElement;
    var view: HTMLDivElement;
    var progress: HTMLDivElement;
    var preview: HTMLTextAreaElement;
    var hMargin: number;
    var vMargin: number;
    var processed: IProcessedResult = {
        html: '',
        kit: null,
        model: null,
        paramValues: [],
        paramHtml: ''
    };
    var init = true;
    var errorMarker: CodeMirror.TextMarker;
    var exportWorker: Worker = null;
    var paramActiveTimeout: NodeJS.Timer;

    function getZoom() {
        var landscape = (Math.abs(<number>window.orientation) == 90) || window.orientation == 'landscape';

        var zoom = (landscape ? window.innerWidth : window.innerHeight) / document.body.clientWidth;

        MakerJsPlayground.windowZoom = Math.max(0.15, Math.min(zoom, 1));
    }

    function isHttp(url: string): boolean {
        return "http" === url.substr(0, 4);
    }

    function isIJavaScriptErrorDetails(result: any) {
        var sample: IJavaScriptErrorDetails = {
            colno: 0,
            lineno: 0,
            message: '',
            name: ''
        };
        
        for (var key in sample) {
            if (!(key in result)) {
                return false;
            }
        }

        return true;
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

                var input: MakerJs.exporter.XmlTag = null;
                var textbox: MakerJs.exporter.XmlTag = null;

                switch (attrs.type) {

                    case 'range':
                        attrs.title = attrs.value;
                        input = new makerjs.exporter.XmlTag('input', attrs);
                        input.attrs['onchange'] = 'this.title=this.value;MakerJsPlayground.setParam(' + i + ', makerjs.round(this.valueAsNumber, .001))';
                        input.attrs['ontouchstart'] = 'MakerJsPlayground.activateParam(this)';
                        input.attrs['ontouchend'] = 'MakerJsPlayground.deActivateParam(this, 1500)';

                        var textboxAttrs = {
                            "id": id,
                            "type": 'text',
                            "value": attrs.value,
                            "onchange": 'MakerJsPlayground.setParam(' + i + ', makerjs.round(this.value, .001))'
                        };

                        var formAttrs = {
                            "action": 'javascript:void(0);',
                            "onsubmit": 'MakerJsPlayground.setParam(' + i + ', makerjs.round(this.elements[0].value, .001))'
                        };

                        textbox = new makerjs.exporter.XmlTag('form', formAttrs);
                        textbox.innerText = new makerjs.exporter.XmlTag('input', textboxAttrs).toString();
                        textbox.innerTextEscaped = true;

                        paramValues.push(attrs.value);

                        label.attrs['title'] = 'click to toggle slider / textbox for ' + label.attrs['title'];
                        label.attrs['onclick'] = 'MakerJsPlayground.toggleSliderTextbox(this)';

                        break;

                    case 'bool':

                        var checkboxAttrs = {
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

                if (textbox) {
                    div.innerText += textbox.toString();
                }

                div.innerTextEscaped = true;
                paramHtml += div.toString();
            }
        }

        processed.paramValues = paramValues;
        processed.paramHtml = paramHtml;
    }

    function generateCodeFromKit(id: string, kit: MakerJs.IKit): string {
        var values: string[] = [];
        var comment: string[] = [];
        var code: string[] = [];

        var firstComment = "//" + id + " parameters: ";

        for (var i in kit.metaParameters) {
            comment.push(firstComment + kit.metaParameters[i].title);
            firstComment = "";

            var value = kit.metaParameters[i].value;

            if (kit.metaParameters[i].type === 'select') {
                value = value[0];
            }

            if (typeof value === 'object') {
                values.push(JSON.stringify(value));
            } else {
                values.push(value);
            }
        }

        code.push("var makerjs = require('makerjs');");
        code.push("");
        code.push(comment.join(", "));
        code.push("");
        code.push("this.models = {");
        code.push("  my" + id + ": new makerjs.models." + id + "(" + values.join(', ') + ")");
        code.push("};");
        code.push("");

        return code.join('\n');
    }

    function resetDownload() {
        cancelExport();
        document.body.classList.remove('download-ready');
    }

    function highlightCodeError(error: IJavaScriptErrorDetails) {

        if (error.lineno || error.colno) {
            processed.html = error.name + ' at line ' + error.lineno + ' column ' + error.colno + ' : ' + error.message;

            var editorLine = error.lineno - 1;

            var from: CodeMirror.Position = {
                line: editorLine, ch: error.colno - 1
            };

            var to: CodeMirror.Position = {
                line: editorLine, ch: codeMirrorEditor.getDoc().getLine(editorLine).length
            };

            errorMarker = codeMirrorEditor.getDoc().markText(from, to, { title: error.message, clearOnEnter: true, className: 'code-error' });
        } else {
            processed.html = error.name + ' : ' + error.message;
        }
    }

    //public members

    export var codeMirrorEditor: CodeMirror.Editor;
    export var codeMirrorOptions: CodeMirror.EditorConfiguration = {
        lineNumbers: true,
        theme: 'twilight',
        viewportMargin: Infinity
    };
    export var relativePath = '';
    export var svgFontSize = 14;
    export var svgStrokeWidth = 2;
    export var windowZoom = 1;
    export var querystringParams: QueryStringParams;

    export function runCodeFromEditor() {
        iframe = document.createElement('iframe');
        iframe.style.display = 'none';

        document.body.appendChild(iframe);

        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write('<html><head><script src="require-iframe.js"></script></head><body></body></html>');
        iframe.contentWindow.document.close();
    }

    export function setNotes(markdown: string) {
        var className = 'no-notes';
        var html = '';
        if (markdown) {
            html = marked(markdown);
            document.body.classList.remove(className);
        } else {
            document.body.classList.add(className);
        }
        document.getElementById('notes').innerHTML = html;
    }

    export function processResult(html: string, result: any) {

        if (errorMarker) {
            errorMarker.clear();
            errorMarker = null;
        }

        resetDownload();
        setNotes('');

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

            setNotes(processed.model.notes || processed.kit.notes);

        } else if (makerjs.isModel(result)) {
            processed.model = result;

            setNotes(processed.model.notes);

        } else if (isIJavaScriptErrorDetails(result)) {
            
            //render script error
            highlightCodeError(result as IJavaScriptErrorDetails);
        }

        document.getElementById('params').innerHTML = processed.paramHtml;

        render();

        //now safe to render, so register a resize listener
        if (init) {
            init = false;

            //todo - still need double tap
            window.addEventListener('resize', render);
            window.addEventListener('orientationchange', render);
            view.addEventListener('touchend', function () {
                document.body.classList.add('collapse-rendering-options');
                render();
            });
        }
    }

    export function setParam(index: number, value: any) {

        resetDownload();

        processed.paramValues[index] = value;

        //see if output is either a Node module, or a MakerJs.IModel
        if (processed.kit) {

            //construct an IModel from the kit
            processed.model = makerjs.kit.construct(processed.kit, processed.paramValues);
        }

        render();
    }

    export function toggleSliderTextbox(label: HTMLLabelElement) {
        toggleClass('toggle-text', false, label.parentElement);
    }

    export function activateParam(input: HTMLInputElement) {
        document.body.classList.add('param-active');
        input.parentElement.classList.add('active');
        clearTimeout(paramActiveTimeout);
    }

    export function deActivateParam(input: HTMLInputElement, delay: number) {
        paramActiveTimeout = setTimeout(function () {
            document.body.classList.remove('param-active');
            input.parentElement.classList.remove('active');
        }, delay);
    }

    export function render() {
        getZoom();

        //remove content so default size can be measured
        view.innerHTML = '';

        var html = processed.html;

        if (processed.model) {

            var measure = makerjs.measure.modelExtents(processed.model);
            var modelHeightNatural = measure.high[1] - measure.low[1];
            var modelWidthNatural = measure.high[0] - measure.low[0];
            var height = view.offsetHeight - 2 * vMargin;
            var width = document.getElementById('view-params').offsetWidth - 2 * hMargin;
            var menuLeft = customizeMenu.offsetLeft - 2 * hMargin;
            var viewScale = 1;

            //view mode - left of menu
            if (!document.body.classList.contains('collapse-rendering-options') && menuLeft > 100) {
                width = menuLeft;
            }

            if (processed.model.units) {
                //cast into inches, then to pixels
                viewScale *= makerjs.units.conversionScale(processed.model.units, makerjs.unitType.Inch) * pixelsPerInch;
            }

            var modelWidthInPixels = modelWidthNatural * viewScale;
            var modelHeightInPixels = modelHeightNatural * viewScale;

            if ((<HTMLInputElement>document.getElementById('check-fit-on-screen')).checked) {

                var scaleHeight = height / modelHeightInPixels;
                var scaleWidth = width / modelWidthInPixels;

                viewScale *= Math.min(scaleWidth, scaleHeight);
            }

            var renderOptions: MakerJs.exporter.ISVGRenderOptions = {
                origin: [width / 2 - (modelWidthNatural / 2 + measure.low[0]) * viewScale, measure.high[1] * viewScale],
                annotate: (<HTMLInputElement>document.getElementById('check-annotate')).checked,
                svgAttrs: { id: 'view-svg' },
                fontSize: (windowZoom * svgFontSize) + 'px',
                strokeWidth: (windowZoom * svgStrokeWidth) + 'px',
                scale: viewScale,
                useSvgPathOnly: false
            };

            var renderModel: MakerJs.IModel = {
                models: {
                    model: processed.model
                }
            };

            if ((<HTMLInputElement>document.getElementById('check-show-origin')).checked) {

                renderModel.paths = {
                    'crosshairs-vertical': new makerjs.paths.Line([0, measure.low[1]], [0, measure.high[1]]),
                    'crosshairs-horizontal': new makerjs.paths.Line([measure.low[0], 0], [measure.high[0], 0])
                };
            }

            html += makerjs.exporter.toSVG(renderModel, renderOptions);
        }

        view.innerHTML = html;
    }

    export function filenameFromRequireId(id: string): string {
        return relativePath + id + '.js';
    }

    export function downloadScript(url: string, callback: (download: string) => void) {

        var timeout = setTimeout(function () {
            x.onreadystatechange = null;

            var errorDetails: MakerJsPlayground.IJavaScriptErrorDetails = {
                colno: 0,
                lineno: 0,
                message: 'Could not load script "' + url + '". Possibly a network error, or the file does not exist.',
                name: 'Load module failure'
            };

            processResult('', errorDetails);

        }, 5000);

        var x = new XMLHttpRequest();
        x.open('GET', url, true);
        x.onreadystatechange = function () {
            if (x.readyState == 4 && x.status == 200) {
                clearTimeout(timeout);
                callback(x.responseText);
            }
        };
        x.send();
    }

    export function toggleClass(name: string, render = true, element: HTMLElement = document.body): boolean {
        var c = element.classList;
        var result: boolean;

        if (c.contains(name)) {
            c.remove(name);
            result = true;
        } else {
            c.add(name);
            result = false;
        }

        if (render) {
            MakerJsPlayground.render();
        }

        return result;
    }

    function getExport(ev: MessageEvent) {
        var response = ev.data as MakerJsPlaygroundExport.IExportResponse;

        progress.style.width = response.percentComplete + '%';

        if (response.percentComplete == 100 && response.text) {

            //allow progress bar to render
            setTimeout(function () {
                var fe = MakerJsPlaygroundExport.formatMap[response.request.format];

                var encoded = encodeURIComponent(response.text);
                var uriPrefix = 'data:' + fe.mediaType + ',';
                var filename = (querystringParams['script'] || 'my-drawing') + '.' + fe.fileExtension;
                var dataUri = uriPrefix + encoded;
            
                //create a download link
                var a = new makerjs.exporter.XmlTag('a', { href: dataUri, download: filename });
                a.innerText = 'download ' + response.request.formatTitle;
                document.getElementById('download-link-container').innerHTML = a.toString();

                preview.value = response.text;

                (<HTMLSpanElement>document.getElementById('download-filename')).innerText = filename;

                //put the download ui into ready mode
                toggleClass('download-generating', false);
                toggleClass('download-ready', false);
            }, 300);

        }
    }

    export function downloadClick(a: HTMLAnchorElement, format: MakerJsPlaygroundExport.ExportFormat) {

        var request: MakerJsPlaygroundExport.IExportRequest = {
            format: format,
            formatTitle: a.innerText,
            model: processed.model
        };

        //initialize a worker - this will download scripts into the worker
        if (!exportWorker) {
            exportWorker = new Worker('export-worker.js');
            exportWorker.onmessage = getExport;
        }

        //put the download ui into generation mode
        progress.style.width = '0';
        toggleClass('download-generating', false);

        //tell the worker to process the job
        exportWorker.postMessage(request);
    }

    export function copyToClipboard() {
        preview.select();
        document.execCommand('copy');
    }

    export function cancelExport() {
        if (exportWorker) {
            exportWorker.terminate();
            exportWorker = null;
        }
        document.body.classList.remove('download-generating');
    }

    //execution

    window.onload = function (ev) {

        if (window.orientation === void 0) {
            window.orientation = 'landscape';
        }

        //hide the customize menu when booting on small screens
        //if (document.body.clientWidth < 540) {
        //    document.body.classList.add('collapse-rendering-options');
        //}

        customizeMenu = document.getElementById('rendering-options-menu') as HTMLDivElement;
        view = document.getElementById('view') as HTMLDivElement;
        progress = document.getElementById('download-progress') as HTMLDivElement;
        preview = document.getElementById('download-preview') as HTMLTextAreaElement;

        var viewMeasure = document.getElementById('view-measure');

        hMargin = viewMeasure.offsetLeft;
        vMargin = viewMeasure.offsetTop;

        var pre = document.getElementById('init-javascript-code') as HTMLPreElement;
        codeMirrorOptions.value = pre.innerText;
        codeMirrorEditor = CodeMirror(
            function (elt) {
                pre.parentNode.replaceChild(elt, pre);
            },
            codeMirrorOptions
        );

        querystringParams = new QueryStringParams();
        var scriptname = querystringParams['script'];

        if (scriptname && !isHttp(scriptname)) {

            if (scriptname in makerjs.models) {

                var code = generateCodeFromKit(scriptname, makerjs.models[scriptname]);
                codeMirrorEditor.getDoc().setValue(code);
                runCodeFromEditor();

            } else {
                downloadScript(filenameFromRequireId(scriptname), function (download: string) {
                    codeMirrorEditor.getDoc().setValue(download);
                    runCodeFromEditor();
                });
            }
        } else {
            runCodeFromEditor();
        }

    };

}
