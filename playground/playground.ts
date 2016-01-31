/// <reference path="../typings/tsd.d.ts" />
/// <reference path="export-format.ts" />
/// <reference path="pointer.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/models/connectthedots.ts" />
/// <reference path="../typings/codemirror/codemirror.d.ts" />
/// <reference path="../typings/marked/marked.d.ts" />

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

    interface ILockedPath {
        route: string[];
        notes: string;
    }

    interface IProcessedResult {
        html: string;
        kit: MakerJs.IKit;
        model: MakerJs.IModel;
        measurement: MakerJs.IMeasure;
        paramValues: any[],
        paramHtml: string;
        lockedPath?: ILockedPath;
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
    var viewSvgContainer: HTMLDivElement;
    var progress: HTMLDivElement;
    var preview: HTMLTextAreaElement;
    var checkFitToScreen: HTMLInputElement;
    var hMargin: number;
    var vMargin: number;
    var processed: IProcessedResult = {
        html: '',
        kit: null,
        model: null,
        measurement: null,
        paramValues: [],
        paramHtml: ''
    };
    var init = true;
    var errorMarker: CodeMirror.TextMarker;
    var exportWorker: Worker = null;
    var paramActiveTimeout: NodeJS.Timer;
    var longHoldTimeout: NodeJS.Timer;
    var viewModelRootSelector = 'svg#drawing > g > g > g';
    var viewOrigin: MakerJs.IPoint;
    var viewPanOffset: MakerJs.IPoint = [0, 0];

    function isLandscapeOrientation() {
        return (Math.abs(<number>window.orientation) == 90) || window.orientation == 'landscape';
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

                var id = 'slider_' + i;
                var label = new makerjs.exporter.XmlTag('label', { "for": id, title: attrs.title });
                label.innerText = attrs.title + ': ';

                var input: MakerJs.exporter.XmlTag = null;
                var numberBox: MakerJs.exporter.XmlTag = null;

                switch (attrs.type) {

                    case 'range':
                        attrs.title = attrs.value;
                        attrs['id'] = id;
                        attrs['onchange'] = 'this.title=this.value;MakerJsPlayground.setParam(' + i + ', makerjs.round(this.valueAsNumber, .001)); if (MakerJsPlayground.isSmallDevice()) { MakerJsPlayground.activateParam(this); MakerJsPlayground.deActivateParam(this, 1000); }';
                        attrs['ontouchstart'] = 'MakerJsPlayground.activateParam(this)';
                        attrs['ontouchend'] = 'MakerJsPlayground.deActivateParam(this, 1000)';
                        attrs['onmousedown'] = 'if (MakerJsPlayground.isSmallDevice()) { MakerJsPlayground.activateParam(this); }';
                        attrs['onmouseup'] = 'if (MakerJsPlayground.isSmallDevice()) { MakerJsPlayground.deActivateParam(this, 1000); }';

                        input = new makerjs.exporter.XmlTag('input', attrs);

                        //note: we could also apply the min and max of the range to the number field. however, the useage of the textbox is to deliberately "go out of bounds" when the example range is insufficient.
                        var numberBoxAttrs = {
                            "id": 'numberbox_' + i,
                            "type": 'number',
                            "step": 'any',
                            "value": attrs.value,
                            "onfocus": 'if (MakerJsPlayground.isSmallDevice()) { MakerJsPlayground.activateParam(this.parentElement); }',
                            "onblur": 'if (MakerJsPlayground.isSmallDevice()) { MakerJsPlayground.deActivateParam(this.parentElement, 0); }',
                            "onchange": 'MakerJsPlayground.setParam(' + i + ', makerjs.round(this.value, .001))'
                        };

                        var formAttrs = {
                            "action": 'javascript:void(0);',
                            "onsubmit": 'MakerJsPlayground.setParam(' + i + ', makerjs.round(this.elements[0].value, .001))'
                        };

                        numberBox = new makerjs.exporter.XmlTag('form', formAttrs);
                        numberBox.innerText = new makerjs.exporter.XmlTag('input', numberBoxAttrs).toString();
                        numberBox.innerTextEscaped = true;

                        paramValues.push(attrs.value);

                        label.attrs['title'] = 'click to toggle slider / textbox for ' + label.attrs['title'];
                        label.attrs['onclick'] = 'MakerJsPlayground.toggleSliderNumberBox(this, ' + i + ')';

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

                if (numberBox) {
                    div.innerText += numberBox.toString();
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

    function arraysEqual(a, b) {
        if (!a || !b) return false;
        if (a.length != b.length) return false;

        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    function lockToPath(path: Node) {
        
        //trace back to root
        var root = viewSvgContainer.querySelector(viewModelRootSelector) as SVGGElement;
        var route: string[] = [];
        var element = path;

        while (element !== root) {
            var id = element.attributes.getNamedItem('id').value

            route.unshift(id);

            if (element.nodeName == 'g') {
                route.unshift('models');
            } else {
                route.unshift('paths');
            }
            element = element.parentNode;
        }

        if (processed.lockedPath && arraysEqual(processed.lockedPath.route, route)) {

            processed.lockedPath = null;
            setNotes(processed.model.notes || processed.kit.notes);

        } else {

            var crumb = 'this';
            for (var i = 0; i < route.length; i++) {
                if (i % 2 == 0) {
                    crumb += "." + route[i];
                } else {
                    crumb += '["' + route[i] + '"]';
                }
            }
            
            processed.lockedPath = {
                route: route,
                notes: "Path Info|\n---|---\nRoute|``` " + crumb + " ```\nJSON|"
            };

            updateLockedPathNotes();
        }

        render();
    }

    function getLockedPathSvgElement() {
        var root = viewSvgContainer.querySelector(viewModelRootSelector) as SVGGElement;
        var selector = '';

        for (var i = 0; i < processed.lockedPath.route.length - 2; i += 2) {
            selector += " g[id='" + processed.lockedPath.route[i + 1] + "']";
        }

        selector += " [id='" + processed.lockedPath.route[processed.lockedPath.route.length - 1] + "']";

        return root.querySelector(selector) as HTMLElement;
    }

    function getLockedPathAndOffset() {
        if (!processed.lockedPath) return null;

        var ref = processed.model;
        var origin = processed.model.origin || [0, 0];

        var route = processed.lockedPath.route.slice();

        while (route.length) {
            var prop = route.shift();
            ref = ref[prop];

            if (!ref) return null;

            if (ref.origin && route.length) {
                origin = makerjs.point.add(origin, ref.origin);
            }
        }

        return {
            path: <MakerJs.IPath>ref,
            offset: origin
        };
    }

    function updateLockedPathNotes() {
        if (processed.model && processed.lockedPath) {
            var pathAndOffset = getLockedPathAndOffset();
            if (pathAndOffset) {
                setNotes(processed.lockedPath.notes + "``` " + JSON.stringify(pathAndOffset.path) + "```\nOffset|```" + JSON.stringify(pathAndOffset.offset) + "```");
            } else {
                setNotes(processed.model.notes || processed.kit.notes);
            }
        }
    }

    function measureLockedPath(): MakerJs.IMeasure {
        var pathAndOffset = getLockedPathAndOffset();
        if (!pathAndOffset) return null;

        var measure = makerjs.measure.pathExtents(pathAndOffset.path);
        measure.high = makerjs.point.add(measure.high, pathAndOffset.offset);
        measure.low = makerjs.point.add(measure.low, pathAndOffset.offset);

        return measure;
    }

    function areSameHeightMeasurement(a: MakerJs.IMeasure, b: MakerJs.IMeasure) {
        return a.high[1] == b.high[1] && a.low[1] == b.low[1];
    }

    function initialize() {

        window.addEventListener('resize', render);
        window.addEventListener('orientationchange', render);

        pointers = new Pointer.Manager('#pointers', view, [hMargin, vMargin], getZoom, setZoom, onPointerReset);
    }

    var keepEventElement: HTMLElement = null;

    function onPointerReset() {

        if (keepEventElement) {
            view.removeChild(keepEventElement);
        }

        keepEventElement = null;
    }

    function getZoom(): Pointer.IPanZoom {
        return {
            origin: viewOrigin,
            pan: viewPanOffset,
            zoom: viewScale
        };
    }

    function setZoom(panZoom: Pointer.IPanZoom) {

        checkFitToScreen.checked = false;

        var svgElement = viewSvgContainer.children[0] as HTMLElement;

        viewPanOffset = panZoom.pan;

        if (panZoom.zoom == viewScale) {
            //just pan

            //no need to re-render, just move the margin
            svgElement.style.marginLeft = viewPanOffset[0] + 'px';
            svgElement.style.marginTop = viewPanOffset[1] + 'px';

        } else {
            //zoom and pan

            if (!keepEventElement) {
                keepEventElement = svgElement;
                viewSvgContainer.removeChild(keepEventElement);
                keepEventElement.style.visibility = 'hidden';
                this.view.appendChild(keepEventElement);
            }

            viewScale = panZoom.zoom;

            updateZoomScale();

            render();
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
    export var svgStrokeWidth = 2;
    export var viewScale: number;
    export var querystringParams: QueryStringParams;
    export var pointers: Pointer.Manager;

    export function runCodeFromEditor() {
        iframe = document.createElement('iframe');
        iframe.style.display = 'none';

        document.body.appendChild(iframe);

        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write('<html><head><script src="require-iframe.js"></script></head><body></body></html>');
        iframe.contentWindow.document.close();
    }

    export function setNotes(obj: Object);
    export function setNotes(markdown: string);
    export function setNotes(value: any) {
        var markdown = '';

        if (typeof value === 'string') {
            markdown = value;
        } else {
            markdown = JSON.stringify(value);
        }

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

    export function updateZoomScale() {
        var z = document.getElementById('zoom-display');
        z.innerText = '(' + (viewScale * 100).toFixed(0) + '%)';
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
        processed.measurement = null;
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

        updateLockedPathNotes();

        //now safe to render, so register a resize listener
        if (init) {
            init = false;

            initialize();
        }

        render();
    }

    export function setParam(index: number, value: any) {

        //sync slider / numberbox
        var div = document.querySelectorAll('#params > div')[index];
        var slider = div.querySelector('input[type=range]') as HTMLInputElement;
        var numberBox = div.querySelector('input[type=number]') as HTMLInputElement;

        if (slider && numberBox) {
            if (div.classList.contains('toggle-number')) {
                //numberbox is master
                slider.value = numberBox.value;
            } else {
                //slider is master
                numberBox.value = slider.value;
            }
        }

        resetDownload();

        processed.paramValues[index] = value;

        //see if output is either a Node module, or a MakerJs.IModel
        if (processed.kit) {

            //construct an IModel from the kit
            processed.model = makerjs.kit.construct(processed.kit, processed.paramValues);
            processed.measurement = null;

            updateLockedPathNotes();
        }

        render();
    }

    export function toggleSliderNumberBox(label: HTMLLabelElement, index: number) {
        var id: string;
        if (toggleClass('toggle-number', false, label.parentElement)) {
            id = 'slider_' + index;

            //re-render according to slider value since numberbox may be out of limits
            var slider = document.getElementById(id) as HTMLInputElement;
            slider.onchange(null);

        } else {
            id = 'numberbox_' + index;
        }
        label.htmlFor = id;
    }

    export function activateParam(input: HTMLInputElement, onLongHold: boolean = false) {

        function activate() {
            document.body.classList.add('param-active');
            input.parentElement.classList.add('active');
            clearTimeout(paramActiveTimeout);
        }

        if (onLongHold) {
            longHoldTimeout = setTimeout(activate, 200);
        } else {
            activate();
        }
    }

    export function deActivateParam(input: HTMLInputElement, delay: number) {

        clearTimeout(longHoldTimeout);
        clearTimeout(paramActiveTimeout);

        paramActiveTimeout = setTimeout(function () {
            document.body.classList.remove('param-active');
            input.parentElement.classList.remove('active');
        }, delay);
    }

    export function fitOnScreen() {

        pointers.reset();

        checkFitToScreen.checked = true;

        var measure = processed.measurement;
        var modelHeightNatural = measure.high[1] - measure.low[1];
        var modelWidthNatural = measure.high[0] - measure.low[0];
        var viewHeight = view.offsetHeight - 2 * vMargin;
        var v2 = viewHeight / 2;
        var viewWidth = document.getElementById('view-params').offsetWidth - 2 * hMargin;
        var menuLeft = customizeMenu.offsetLeft - 2 * hMargin;

        viewPanOffset = [0, 0];
        viewScale = 1;

        //view mode - left of menu
        if (!document.body.classList.contains('collapse-rendering-options') && menuLeft > 100) {
            viewWidth = menuLeft;
        }

        if (processed.model.units) {
            //cast into inches, then to pixels
            viewScale *= makerjs.units.conversionScale(processed.model.units, makerjs.unitType.Inch) * pixelsPerInch;
        }

        var modelWidthInPixels = makerjs.round(modelWidthNatural * viewScale, .1);
        var modelHeightInPixels = makerjs.round(modelHeightNatural * viewScale, .1);

        var scaleHeight = viewHeight / modelHeightInPixels;
        var scaleWidth = viewWidth / modelWidthInPixels;

        viewScale *= Math.min(scaleWidth, scaleHeight);

        updateZoomScale();

        viewOrigin = [viewWidth / 2 - (modelWidthNatural / 2 + measure.low[0]) * viewScale, measure.high[1] * viewScale];
    }

    export function render() {

        //remove content so default size can be measured
        viewSvgContainer.innerHTML = '';

        var html = processed.html;

        if (processed.model) {

            if (!processed.measurement) {
                processed.measurement = makerjs.measure.modelExtents(processed.model);
            }

            if (!viewScale) {
                fitOnScreen();
            }

            var renderOptions: MakerJs.exporter.ISVGRenderOptions = {
                origin: viewOrigin,
                annotate: (<HTMLInputElement>document.getElementById('check-annotate')).checked,
                svgAttrs: {
                    "id": 'drawing',
                    "style": 'margin-left:' + viewPanOffset[0] + 'px; margin-top:' + viewPanOffset[1] + 'px'
                },
                strokeWidth: svgStrokeWidth + 'px',
                scale: viewScale,
                useSvgPathOnly: false
            };

            var renderModel: MakerJs.IModel = {
                models: {
                    ROOT: processed.model
                }
            };

            if ((<HTMLInputElement>document.getElementById('check-show-origin')).checked) {

                renderModel.paths = {
                    'crosshairs-vertical': new makerjs.paths.Line([0, Math.min(processed.measurement.low[1], 0)], [0, Math.max(processed.measurement.high[1], 0)]),
                    'crosshairs-horizontal': new makerjs.paths.Line([Math.min(processed.measurement.low[0], 0), 0], [Math.max(processed.measurement.high[0], 0), 0])
                };

            }

            html += makerjs.exporter.toSVG(renderModel, renderOptions);
        }

        viewSvgContainer.innerHTML = html;

        if (processed.lockedPath) {
            var path = getLockedPathSvgElement();
            if (path) {
                path.setAttribute('class', 'locked');
                path.style.strokeWidth = (2 * svgStrokeWidth) + 'px';
            }
        }

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

    export function toggleClass(name: string, doRender = true, element: HTMLElement = document.body): boolean {
        var c = element.classList;
        var result: boolean;

        if (c.contains(name)) {
            c.remove(name);
            result = true;
        } else {
            c.add(name);
            result = false;
        }

        if (doRender) {
            render();
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

    export function isSmallDevice(): boolean {
        return document.body.clientWidth < 540;
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
        checkFitToScreen = document.getElementById('check-fit-on-screen') as HTMLInputElement;

        viewSvgContainer = document.getElementById('view-svg-container') as HTMLDivElement;

        hMargin = viewSvgContainer.offsetLeft;
        vMargin = viewSvgContainer.offsetTop;

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
