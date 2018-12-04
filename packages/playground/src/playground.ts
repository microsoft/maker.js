namespace MakerJsPlayground {

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
        lockedPath?: ILockedPath;
        error?: string;
    }

    interface RuntimeError {
        stack: string;
    }

    export interface IJavaScriptErrorDetails {
        colno: number;
        lineno: number;
        message: string;
        name: string;
    }

    //private members
    var minDockSideBySide = 1024;
    var pixelsPerInch = 100;
    var iframe: HTMLIFrameElement;
    var customizeMenu: HTMLDivElement;
    var view: HTMLDivElement;
    var viewSvgContainer: HTMLDivElement;
    var gridPattern: Element;
    var crosshairs: Element;
    var gridPatternFill: Element;
    var paramsDiv: HTMLDivElement;
    var measurementDiv: HTMLDivElement;
    var progress: HTMLDivElement;
    var preview: HTMLTextAreaElement;
    var downloadError: HTMLDivElement;
    var checkFitToScreen: HTMLInputElement;
    var checkShowGrid: HTMLInputElement;
    var checkNotes: HTMLInputElement;
    var margin: MakerJs.IPoint;
    var processed: IProcessedResult = {
        error: '',
        html: '',
        kit: null,
        model: null,
        measurement: null,
        paramValues: []
    };
    var init = true;
    var errorMarker: CodeMirror.TextMarker;
    var exportWorker: Worker = null;
    var paramActiveTimeout: NodeJS.Timer;
    var longHoldTimeout: NodeJS.Timer;
    var viewModelRootSelector = 'svg#drawing > g > g';
    var viewOrigin: MakerJs.IPoint;
    var viewPanOffset: MakerJs.IPoint = [0, 0];
    var keepEventElement: HTMLElement = null;
    var renderInWorker = {
        requestId: 0,
        worker: <Worker>null,
        hasKit: false
    };
    var setParamTimeoutId: NodeJS.Timer;
    var setProcessedModelTimer: NodeJS.Timer;
    var animationTimeoutId: NodeJS.Timer;
    var dockModes = {
        None: '',
        SideBySide: 'side-by-side',
        FullScreen: 'full-screen'
    }

    function isLandscapeOrientation() {
        return (Math.abs(<number>window.orientation) == 90) || window.orientation == 'landscape' || window.orientation === undefined;
    }

    function isHttp(url: string): boolean {
        return "http" === url.substr(0, 4);
    }

    function isIJavaScriptErrorDetails(result: any) {
        if (!result) return false;

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

        var paramValues = [];
        var paramHtml: string[] = [];

        if (metaParameters) {

            var sliders = 0;

            for (var i = 0; i < metaParameters.length; i++) {
                var attrs = makerjs.cloneObject(metaParameters[i]);

                var id = 'input_param_' + i;
                var prepend = false;
                var input: MakerJs.exporter.XmlTag = null;
                var numberBox: MakerJs.exporter.XmlTag = null;

                switch (attrs.type) {

                    case 'range':
                        sliders++;

                        attrs['id'] = id;
                        attrs['onchange'] = 'MakerJsPlayground.setParam(' + i + ', makerjs.round(this.valueAsNumber, .001)); if (MakerJsPlayground.isSmallDevice()) { MakerJsPlayground.activateParam(this); MakerJsPlayground.deActivateParam(this, 1000); }';
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
                            "onchange": 'MakerJsPlayground.setParam(' + i + ', makerjs.round(this.valueAsNumber, .001))'
                        };

                        var formAttrs = {
                            "action": 'javascript:void(0);',
                            "onsubmit": 'MakerJsPlayground.setParam(' + i + ', makerjs.round(this.elements[0].valueAsNumber, .001))'
                        };

                        numberBox = new makerjs.exporter.XmlTag('form', formAttrs);
                        numberBox.innerText = new makerjs.exporter.XmlTag('input', numberBoxAttrs).toString();
                        numberBox.innerTextEscaped = true;

                        paramValues.push(attrs.value);

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

                        prepend = true;

                        break;

                    case 'font':

                        var selectFontAttrs = {
                            id: id,
                            onchange: 'MakerJsPlayground.setParam(' + i + ', this.options[this.selectedIndex].value)'
                        };

                        input = new makerjs.exporter.XmlTag('select', selectFontAttrs);
                        var fontOptions = '';

                        var added = false;

                        for (var fontId in fonts) {
                            var font = fonts[fontId];

                            if (!FontLoader.fontMatches(font, attrs.value)) continue;

                            if (!added) {
                                paramValues.push(fontId);
                                added = true;
                            }
                            var option = new makerjs.exporter.XmlTag('option', { value: fontId });
                            option.innerText = font.displayName;
                            options += option.toString();
                        }

                        input.innerText = options;
                        input.innerTextEscaped = true;

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

                    case 'text':

                        attrs['id'] = id;
                        attrs['onchange'] = 'MakerJsPlayground.setParam(' + i + ', this.value)';

                        input = new makerjs.exporter.XmlTag('input', attrs);

                        paramValues.push(attrs.value);

                        break;
                }

                if (!input) continue;

                var div = new makerjs.exporter.XmlTag('div');
                var label = new makerjs.exporter.XmlTag('label');
                label.innerText = attrs.title;

                if (prepend) {
                    var innerText = input.toString() + ' ' + label.getInnerText();
                    label.innerText = innerText;
                    label.innerTextEscaped = true;
                    div.innerText = label.toString();
                } else {
                    label.attrs = { "for": id };
                    label.innerText += ': ';
                    div.innerText = label.toString() + input.toString();
                }

                if (numberBox) {
                    div.innerText += numberBox.toString();
                }

                div.innerTextEscaped = true;
                paramHtml.push(div.toString());
            }

            //if (sliders) {
            //var button = new makerjs.exporter.XmlTag('input', { type: 'button', onclick:'MakerJsPlayground.animate()', value: 'animate'});
            //paramHtml.push(button.toString());
            //}
        }

        processed.paramValues = paramValues;

        if (paramHtml.length) {
            document.body.classList.add('show-params-link');
        } else {
            document.body.classList.remove('show-params-link');
        }

        paramsDiv.innerHTML = paramHtml.join('');

        saveParamsLink();

        paramsDiv.setAttribute('disabled', 'true');
    }

    function safeParamName(m: MakerJs.IMetaParameter) {
        return m.title.replace(/\(.*\)/gi, '').trim().replace(/\s/gi, '_');
    }

    function metaParameterAsString(m: MakerJs.IMetaParameter) {
        var result: string[] = [];
        for (var prop in m) {
            result.push(prop + ': ' + JSON.stringify(m[prop]));
        }
        return '{ ' + result.join(', ') + ' }';
    }

    function generateCodeFromKit(id: string, kit: MakerJs.IKit): string {
        var code: string[] = [];
        var safeParamNames = kit.metaParameters.map(safeParamName).join(', ');

        code.push("var makerjs = require('makerjs');");
        code.push("");
        code.push("function demo(" + safeParamNames + ") {");
        code.push("");
        code.push("  this.models = {");
        code.push("    example: new makerjs.models." + id + "(" + safeParamNames + ")");
        code.push("  };");
        code.push("");
        code.push("}");
        code.push("");
        code.push("demo.metaParameters = [");
        code.push(kit.metaParameters.map(m => '  ' + metaParameterAsString(m)).join(',\n'));
        code.push("];");
        code.push("");
        code.push("module.exports = demo;");

        return code.join('\n');
    }

    function resetDownload() {
        cancelExport();
        document.body.classList.remove('download-error');
        document.body.classList.remove('download-ready');
    }

    class Frown implements MakerJs.IModel {
        public paths: MakerJs.IPathMap;

        constructor() {
            this.paths = {
                head: new makerjs.paths.Circle([0, 0], 85),
                eye1: new makerjs.paths.Circle([-25, 25], 10),
                eye2: new makerjs.paths.Circle([25, 25], 10),
                frown: new makerjs.paths.Arc([0, -75], 50, 45, 135)
            };
        }
    }

    class StraightFace implements MakerJs.IModel {
        public paths: MakerJs.IPathMap;

        constructor() {
            this.paths = {
                head: new makerjs.paths.Circle([0, 0], 85),
                eye1: new makerjs.paths.Circle([-25, 25], 10),
                eye2: new makerjs.paths.Circle([25, 25], 10),
                mouth: new makerjs.paths.Line([-30, -30], [30, -30])
            };
        }
    }

    class Wait implements MakerJs.IModel {
        public models: MakerJs.IModelMap;

        constructor() {
            var wireFrame: MakerJs.IModel = {
                paths: {
                    rim: new makerjs.paths.Circle([0, 0], 85),
                    hand1: new makerjs.paths.Line([0, 0], [40, 30]),
                    hand2: new makerjs.paths.Line([0, 0], [0, 60])
                }
            };

            this.models = {
                x: makerjs.model.expandPaths(wireFrame, 5)
            }
        }
    }

    class Warning implements MakerJs.IModel {
        public models: MakerJs.IModelMap;
        public paths: MakerJs.IPathMap;

        constructor() {

            this.models = {
                triangle: new makerjs.models.ConnectTheDots(true, [[-200, 0], [200, 0], [0, 346]]),
                exclamation: new makerjs.models.ConnectTheDots(true, [[-10, 110], [10, 110], [16, 210], [-16, 210]])
            }

            this.paths = {
                point: new makerjs.paths.Circle([0, 75], 16)
            }

        }
    }

    function highlightCodeError(error: IJavaScriptErrorDetails) {

        var notes = '';

        if (error.lineno || error.colno) {
            notes = error.name + ' at line ' + error.lineno + ' column ' + error.colno + ' : ' + error.message;

            var editorLine = error.lineno - 1;

            var from: CodeMirror.Position = {
                line: editorLine, ch: error.colno - 1
            };

            var line = codeMirrorEditor.getDoc().getLine(editorLine);

            var to: CodeMirror.Position = {
                line: editorLine, ch: line ? line.length : 0
            };

            errorMarker = codeMirrorEditor.getDoc().markText(from, to, { title: error.message, clearOnEnter: true, className: 'code-error' });

        } else {
            notes = error.name + ' : ' + error.message;
        }

        viewScale = null;

        setProcessedModel(new Frown(), notes);
    }

    function dockEditor(newDockMode: string) {

        for (var modeId in dockModes) {
            var dm = dockModes[modeId];
            if (!dm) continue;
            if (newDockMode === dm) {
                document.body.classList.add(dm);
            } else {
                document.body.classList.remove(dm);
            }
        }

        if (newDockMode === dockModes.SideBySide) {

            var sectionEditor = document.querySelector('section.editor') as HTMLElement;
            var codeHeader = document.querySelector('.code-header') as HTMLElement;

            codeMirrorEditor.setSize(null, sectionEditor.offsetHeight - codeHeader.offsetHeight);
        } else {

            codeMirrorEditor.setSize(null, 'auto');
            codeMirrorEditor.refresh();
        }

        dockMode = newDockMode;
    }

    function arraysEqual(a, b) {
        if (!a || !b) return false;
        if (a.length != b.length) return false;

        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    function lockToPath(path: SVGElement) {

        //trace back to root
        var root = viewSvgContainer.querySelector(viewModelRootSelector) as SVGElement;
        var route: string[] = JSON.parse(path.attributes.getNamedItem('data-route').value);

        if (processed.lockedPath && arraysEqual(processed.lockedPath.route, route)) {

            processed.lockedPath = null;
            setNotesFromModelOrKit();

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
                notes: `Path Info|\n---|---\nRoute|${mdCode(crumb)}\nJSON|`
            };

            updateLockedPathNotes();
        }

        render();

        if (onViewportChange) {
            onViewportChange();
        }

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
        return makerjs.travel(processed.model, processed.lockedPath.route);
    }

    function updateLockedPathNotes() {
        if (processed.model && processed.lockedPath) {
            const pathAndOffset = getLockedPathAndOffset();
            const endpoints = makerjs.point.fromPathEnds(pathAndOffset.result as MakerJs.IPath, pathAndOffset.offset);
            if (pathAndOffset) {
                setNotes([
                    processed.lockedPath.notes + mdCode(pathAndOffset.result),
                    `Offset|${mdCode(pathAndOffset.offset)}`,
                    `Endpoints|${mdCode(endpoints)}`
                ].join('\n'));
            } else {
                setNotesFromModelOrKit();
            }
            return true;
        }
        return false;
    }

    function mdCode(s: string | object) {
        return "``` " + (typeof s === 'string' ? s : JSON.stringify(s)) + " ```";
    }

    function measureLockedPath(): MakerJs.IMeasure {
        var pathAndOffset = getLockedPathAndOffset();
        if (!pathAndOffset) return null;

        var measure = makerjs.measure.pathExtents(pathAndOffset.result as MakerJs.IPath);
        measure.high = makerjs.point.add(measure.high, pathAndOffset.offset);
        measure.low = makerjs.point.add(measure.low, pathAndOffset.offset);

        return measure;
    }

    function getModelNaturalSize(): MakerJs.IPoint {
        var measure = processed.measurement;
        var modelWidthNatural = measure.high[0] - measure.low[0];
        var modelHeightNatural = measure.high[1] - measure.low[1];
        return [modelWidthNatural, modelHeightNatural];
    }

    function getViewSize(): MakerJs.IPoint {
        var viewHeight = view.offsetHeight - 2 * margin[1];
        var viewWidth = view.offsetWidth - 2 * margin[0];
        var menuLeft = customizeMenu.offsetLeft - 2 * margin[0];

        var width = viewWidth;

        //view mode - left of menu
        if (!document.body.classList.contains('collapse-rendering-options') && menuLeft > 100) {
            width = menuLeft;
        }

        return [width, viewHeight];
    }

    function areSameHeightMeasurement(a: MakerJs.IMeasure, b: MakerJs.IMeasure) {
        return a.high[1] == b.high[1] && a.low[1] == b.low[1];
    }

    function initialize() {

        window.addEventListener('resize', onWindowResize);
        window.addEventListener('orientationchange', onWindowResize);

        pointers = new Pointer.Manager(view, '#pointers', margin, getZoom, setZoom, onPointerClick, onPointerReset);

        if (onInit) {
            onInit();
        }
    }

    function onPointerClick(srcElement: Element) {
        if (!keepEventElement && srcElement && srcElement.tagName && srcElement.tagName == 'text') {

            var text = srcElement as SVGTextElement;
            var path = text.previousSibling as SVGElement;

            lockToPath(path);
        }
    }

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

        if (document.body.classList.contains('wait')) return;

        var svgElement = viewSvgContainer.children[0] as HTMLElement;
        if (!svgElement) return;

        checkFitToScreen.checked = false;

        viewPanOffset = panZoom.pan;

        if (panZoom.zoom == viewScale) {
            //just pan

            //no need to re-render, just move the margin
            svgElement.style.marginLeft = viewPanOffset[0] + 'px';
            svgElement.style.marginTop = viewPanOffset[1] + 'px';

            panGrid();

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

    function getGridScale() {
        var gridScale = 1;

        while (viewScale * gridScale < 6) {
            gridScale *= 10;
        }

        while (viewScale * gridScale > 60) {
            gridScale /= 10;
        }

        return gridScale;
    }

    function zoomGrid() {
        var gridScale = (getGridScale() * 10 * viewScale).toString();

        gridPattern.setAttribute('width', gridScale);
        gridPattern.setAttribute('height', gridScale);

        gridPatternFill.setAttribute('width', gridScale);
        gridPatternFill.setAttribute('height', gridScale);
    }

    function panGrid() {
        var p = makerjs.point.add(viewPanOffset, viewOrigin);
        var op = makerjs.point.add(p, margin);
        gridPattern.setAttribute('patternTransform', 'translate(' + p[0] + ',' + p[1] + ')');
        crosshairs.setAttribute('transform', 'translate(' + op[0] + ',' + op[1] + ')');
    }

    function getUnits() {
        if (processed.model && processed.model.units) {
            return processed.model.units;
        }
        return null;
    }

    function isMeasurementEqual(m1: MakerJs.IMeasure, m2: MakerJs.IMeasure): boolean {
        if (!m1 && !m2) return true;
        if (!m1 || !m2) return false;
        if (!makerjs.measure.isPointEqual(m1.low, m2.low)) return false;
        if (!makerjs.measure.isPointEqual(m1.high, m2.high)) return false;
        return true;
    }

    export function setProcessedModel(model: MakerJs.IModel, error?: string) {
        clearTimeout(setProcessedModelTimer);

        var oldUnits = getUnits();
        var oldMeasurement = processed.measurement;

        processed.model = model;
        processed.measurement = null;
        processed.error = error;

        var newUnits = getUnits();

        if (!error) {
            if (errorMarker) {
                errorMarker.clear();
                errorMarker = null;
            }
        }

        if (!processed.model) return;

        //now safe to render, so register a resize listener
        if (init && model) {
            init = false;

            initialize();
        }

        //todo: find minimum viewScale

        if (!makerjs.isPoint(processed.model.origin)) processed.model.origin = [0, 0];
        var newMeasurement = makerjs.measure.modelExtents(processed.model);
        makerjs.model.getAllCaptionsOffset(processed.model).forEach(caption => {
            makerjs.measure.increase(newMeasurement, makerjs.measure.pathExtents(caption.anchor), true);
        });

        processed.measurement = newMeasurement;

        if (!processed.measurement) {
            setProcessedModelTimer = setTimeout(function () {
                setProcessedModel(
                    new StraightFace(),
                    'Your model code was processed, but it resulted in a model with no measurement. It probably does not have any paths. Here is the JSON representation: \n\n' + mdCode(processed.model));
            }, 2500);
            return;
        }

        if ((!viewScale || oldUnits != newUnits) || (!isMeasurementEqual(oldMeasurement, newMeasurement) && checkFitToScreen.checked)) {
            fitOnScreen();
        }

        document.body.classList.remove('wait');

        if (newUnits)
            document.body.classList.add('has-units');
        else {
            document.body.classList.remove('has-units');
        }

        render();

        var measureText: string;

        if (processed.error) {
            setNotes(processed.error);

            //sync notes and checkbox
            if (checkNotes) checkNotes.checked = true;
            document.body.classList.remove('collapse-notes');

            measureText = '';

        } else {
            var size = getModelNaturalSize();
            measureText = size[0].toFixed(2) + ' x ' + size[1].toFixed(2) + ' ' + (newUnits || 'units');

            if (!updateLockedPathNotes()) {
                setNotesFromModelOrKit();
            }
        }

        if (measurementDiv) {
            measurementDiv.innerText = measureText;
        }

        if (onViewportChange) {
            onViewportChange();
        }

    }

    function constructOnMainThread(successCb?: Function) {
        var fontLoader = new FontLoader(fontDir, opentype, processed.kit.metaParameters, processed.paramValues);

        fontLoader.successCb = function (realValues: any[]) {
            constructOnMainThreadReal(realValues, successCb);
        };

        fontLoader.failureCb = function (id) {
            var errorDetails: MakerJsPlayground.IJavaScriptErrorDetails = {
                colno: 0,
                lineno: 0,
                message: 'error loading font ' + fontLoader.baseUrl + fonts[id].path,
                name: 'Network error'
            };

            processResult({ result: errorDetails });
        }

        fontLoader.load();
    }

    function constructOnMainThreadReal(realValues: any[], successCb?: Function) {

        try {

            var result = mainThreadConstructor(processed.kit, realValues);

            processed.html = result.html;
            setProcessedModel(result.model);

            if (successCb) {
                successCb();
            }

        } catch (e) {
            var error = e as RuntimeError;

            var errorDetails: MakerJsPlayground.IJavaScriptErrorDetails = {
                colno: 0,
                lineno: 0,
                message: 'Parameters=' + JSON.stringify(processed.paramValues),
                name: e.toString()
            };

            //try to get column number and line number from stack
            var re = /([0-9]{1,9999})\:([0-9]{1,9999})/;
            var matches = re.exec(error.stack);
            if (matches && matches.length == 3) {
                errorDetails.lineno = parseInt(matches[1]);
                errorDetails.colno = parseInt(matches[2]);
            }

            processResult({ result: errorDetails });
        }
    }

    function constructInWorker(javaScript: string, orderedDependencies: string[], successHandler: (model: MakerJs.IModel) => void, errorHandler: () => void) {

        var idToUrlMap: { [id: string]: string };

        renderInWorker.hasKit = false;

        if (renderInWorker.worker) {
            renderInWorker.worker.terminate();
        }

        renderInWorker.worker = new Worker('js/worker/render-worker.js');
        renderInWorker.worker.onmessage = function (ev: MessageEvent) {
            var response = ev.data as MakerJsPlaygroundRender.IRenderResponse;
            if (response.error) {
                errorHandler();
            } else {
                renderInWorker.hasKit = true;
                processed.html = response.html;
                successHandler(response.model);
            }
        };

        idToUrlMap = {};
        for (var i = 0; i < orderedDependencies.length; i++) {
            //add extra path traversal for worker subfolder
            idToUrlMap[orderedDependencies[i]] = '../../' + filenameFromRequireId(orderedDependencies[i], true);
        }

        var options: MakerJsPlaygroundRender.IRenderRequest = {
            fontDir: '../../' + fontDir,
            requestId: 0,
            javaScript: javaScript,
            orderedDependencies: orderedDependencies,
            dependencyUrls: idToUrlMap,
            paramValues: processed.paramValues
        }

        //tell the worker to process the job
        renderInWorker.worker.postMessage(options);
    }

    function reConstructInWorker(successHandler: (model: MakerJs.IModel) => void, errorHandler: () => void) {

        if (!renderInWorker.hasKit) return;

        renderInWorker.worker.onmessage = function (ev: MessageEvent) {
            var response = ev.data as MakerJsPlaygroundRender.IRenderResponse;
            if (response.requestId == renderInWorker.requestId) {

                if (response.error) {
                    errorHandler();
                } else if (response.model) {
                    processed.html = response.html;
                    successHandler(response.model);
                }
            }
        };

        renderInWorker.requestId = new Date().valueOf();

        var options: MakerJsPlaygroundRender.IRenderRequest = {
            fontDir: '../../' + fontDir,
            requestId: renderInWorker.requestId,
            paramValues: processed.paramValues
        }

        //tell the worker to process the job
        renderInWorker.worker.postMessage(options);
    }

    function getParamUIControl(index: number) {
        var div = document.querySelectorAll('#params > div')[index];
        if (!div) return;

        var checkbox = div.querySelector('input[type=checkbox]') as HTMLInputElement;
        var textbox = div.querySelector('input[type=text]') as HTMLInputElement;
        var select = div.querySelector('select') as HTMLSelectElement;
        var slider = div.querySelector('input[type=range]') as HTMLInputElement;
        var numberBox = div.querySelector('input[type=number]') as HTMLInputElement;

        return {
            classList: div.classList,
            range: slider,
            rangeText: numberBox,
            select: select,
            text: textbox,
            bool: checkbox
        };
    }

    function saveParamsLink() {
        var a = document.querySelector('#params-link') as HTMLAnchorElement;
        if (!a) return;

        a.hash = 'params=' + JSON.stringify(processed.paramValues);
    }

    function getHashParams() {
        var paramValues: any[];

        if (document.location.hash) {
            var hashParams = new QueryStringParams(document.location.hash.substring(1));
            var paramString = hashParams['params'];
            if (paramString) {
                paramValues = JSON.parse(paramString);
            }
        }

        return paramValues;
    }

    window.onhashchange = function () {
        var paramValues: any[];

        if (document.location.hash && document.location.hash.length > 1) {
            paramValues = getHashParams();
        } else if (processed.kit) {

            var fontLoader = new FontLoader(fontDir, null, processed.kit.metaParameters, makerjs.kit.getParameterValues(processed.kit));
            paramValues = fontLoader.getParamValuesWithFontSpec();
        }

        setParamValues(paramValues, true);
    }

    function setParamValues(paramValues: any[], fit: boolean) {

        if (paramValues && paramValues.length) {

            for (var i = 0; i < paramValues.length; i++) {
                setParamIndex(i, paramValues[i], false);
            }

            finalizeSetParam(fit);
        }
    }

    function setParamIndex(index: number, value: any, fromUI: boolean) {

        //sync slider / numberbox
        var div = getParamUIControl(index);

        if (fromUI) {

            if (div.range && div.rangeText) {
                div.range.value = value;
                div.rangeText.value = value;
            }

        } else {

            if (div.range && div.rangeText) {
                div.rangeText.value = value;
                div.range.value = value;

            } else if (div.bool) {
                div.bool.checked = !!value;

            } else if (div.text) {
                div.text.value = value;

            } else if (div.select) {
                let select = div.select;
                let valueAsString = (typeof value === 'string') ? value : JSON.stringify(value);
                for (let i = 0; i < select.options.length; i++) {
                    let optionValue: string;
                    if (select.options[i].attributes.length) {
                        optionValue = select.options[i].getAttribute('value');
                    } else {
                        optionValue = select.options[i].innerText;
                    }
                    if (optionValue === valueAsString) {
                        select.selectedIndex = i;
                        break;
                    }
                }
            }
        }

        processed.paramValues[index] = value;
    }

    function throttledSetParam(index: number, value: any) {

        setParamIndex(index, value, true);
        finalizeSetParam(false);
    }

    function finalizeSetParam(fit: boolean) {

        resetDownload();
        saveParamsLink();

        if (fit) {
            viewScale = null;
        }

        if (useWorkerThreads && Worker) {

            reConstructInWorker(
                setProcessedModel,
                constructOnMainThread
            );

        } else {
            constructOnMainThread();
        }
    }

    function setNotesFromModelOrKit() {
        setNotes(processed.model.notes || (processed.kit ? processed.kit.notes : ''));
    }

    //public members

    export var onInit: Function;
    export var onViewportChange: Function;
    export var fullScreen: boolean
    export var dockMode: string;
    export var codeMirrorEditor: CodeMirror.Editor;
    export var codeMirrorOptions: CodeMirror.EditorConfiguration = {
        extraKeys: {
            "Ctrl-Enter": () => { runCodeFromEditor() },
            "Ctrl-I": () => { toggleClass('collapse-insert-menu') }
        },
        lineNumbers: true,
        gutters: ["CodeMirror-lint-markers"],
        lint: true,
        theme: 'twilight',
        viewportMargin: Infinity
    };
    export var relativePath = '';
    export var svgStrokeWidth = 2;
    export var svgFontSize = 14;
    export var viewScale: number;
    export var querystringParams: QueryStringParams;
    export var pointers: Pointer.Manager;
    export var useWorkerThreads = true;
    export var mainThreadConstructor: IConstructOnMainThread;
    export var fontDir: string;

    export function runCodeFromEditor(paramValues?: any[]) {

        document.body.classList.add('wait');

        processed.kit = null;
        populateParams(null);

        if (iframe) {
            document.body.removeChild(iframe);
        }

        iframe = document.createElement('iframe');
        iframe.style.display = 'none';

        document.body.appendChild(iframe);

        var scripts = ['js/require-iframe.js', '../external/bezier-js/bezier.js', '../external/opentype/opentype.js'];

        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write('<html><head>' + scripts.map(function (src) { return '<script src="' + src + '"></script>'; }).join() + '<script>var paramValues=' + JSON.stringify(paramValues) + ';</script></head><body></body></html>');
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

        var html = '';
        if (markdown) {
            html = marked(markdown);
        }

        html += cleanHtml(processed.html)

        setNotesHtml(html);
    }

    function setNotesHtml(html: string) {
        var className = 'no-notes';
        if (html) {
            document.body.classList.remove(className);
        } else {
            document.body.classList.add(className);
        }
        document.getElementById('notes').innerHTML = html;
    }

    export function updateZoomScale() {
        var unitScale = viewScale;

        if (processed.model.units) {
            //pixels to inch
            unitScale /= pixelsPerInch;

            //inch to units
            unitScale *= makerjs.units.conversionScale(makerjs.unitType.Inch, processed.model.units);
        }

        var z = document.getElementById('zoom-display');
        z.innerText = '[' + (unitScale * 100).toFixed(0) + '%]';

        var g = document.getElementById('grid-unit');
        if (checkShowGrid.checked) {
            var gridScale = makerjs.round(getGridScale());
            g.innerText = '[' + gridScale + ' ' + (processed.model.units || ('unit' + (gridScale < 10 ? '' : 's'))) + ']';
        } else {
            g.innerText = '';
        }
    }

    export interface IConstructOnMainThread {
        (kit: MakerJs.IKit, params: any[]): { model: MakerJs.IModel, html: string };
    }

    export interface IProcessResult {
        html?: string;
        result: any;
        orderedDependencies?: string[];
        paramValues?: any[];
    }

    export function processResult(value: IProcessResult) {

        var result = value.result;

        resetDownload();

        processed.html = value.html || '';

        setProcessedModel(null);

        //see if output is either a Node module, or a MakerJs.IModel
        if (typeof result === 'function') {

            processed.kit = result;
            populateParams(processed.kit.metaParameters);

            if (value.paramValues) {
                setParamValues(value.paramValues, false);
            }

            function enableKit() {
                paramsDiv.removeAttribute('disabled');
            }

            function setKitOnMainThread() {
                constructOnMainThread(enableKit);
            }

            if (useWorkerThreads && Worker) {

                constructInWorker(
                    codeMirrorEditor.getDoc().getValue(),
                    value.orderedDependencies,
                    function (model: MakerJs.IModel) {
                        enableKit();
                        setProcessedModel(model);
                    },
                    setKitOnMainThread
                );

            } else {
                setKitOnMainThread();
            }


        } else if (makerjs.isModel(result)) {
            processed.kit = null;
            populateParams(null);

            setProcessedModel(result);

        } else if (isIJavaScriptErrorDetails(result)) {

            //render script error
            highlightCodeError(result as IJavaScriptErrorDetails);

            if (onViewportChange) {
                onViewportChange();
            }
        } else {
            render();

            if (onViewportChange) {
                onViewportChange();
            }
        }

    }

    export function setParam(index: number, value: any) {
        clearTimeout(setParamTimeoutId);
        setParamTimeoutId = setTimeout(function () {
            throttledSetParam(index, value);
        }, 50);
    }

    export function animate(paramIndex: number = 0, milliSeconds: number = 150, steps = 20) {
        clearInterval(animationTimeoutId);

        var div = getParamUIControl(paramIndex);
        if (!div) return;
        if (!div.range) {
            animate(paramIndex + 1);
            return;
        }

        var max = parseFloat(div.range.max);
        var min = parseFloat(div.range.min);

        do {
            var step = Math.floor((max - min) / steps);
            steps /= 2;
        } while (step === 0)

        div.range.value = min.toString();

        animationTimeoutId = setInterval(function () {

            var currValue = parseFloat(div.range.value);

            if (currValue < max) {
                var newValue = currValue + step;
                div.range.value = newValue.toString();
                throttledSetParam(paramIndex, newValue);
            } else {
                animate(paramIndex + 1);
            }

        }, milliSeconds);
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

    export function fitNatural() {

        if (pointers) pointers.reset();

        if (!processed.measurement) return;

        var size = getViewSize();
        var halfWidth = size[0] / 2;
        var modelNaturalSize = getModelNaturalSize();

        viewScale = 1;
        viewPanOffset = [0, 0];

        checkFitToScreen.checked = false;

        if (processed.model.units) {
            //convert from units to Inch
            viewScale = makerjs.units.conversionScale(processed.model.units, makerjs.unitType.Inch);

            //from inch to pixel
            viewScale *= pixelsPerInch;
        }

        halfWidth -= (modelNaturalSize[0] / 2 + processed.measurement.low[0]) * viewScale;

        viewOrigin = [halfWidth, processed.measurement.high[1] * viewScale];

        updateZoomScale();
    }

    export function fitOnScreen() {

        if (pointers) pointers.reset();

        if (!processed.measurement) return;

        var size = getViewSize();
        var halfWidth = size[0] / 2;
        var modelNaturalSize = getModelNaturalSize();

        viewScale = 1;
        viewPanOffset = [0, 0];

        checkFitToScreen.checked = true;

        var scaleHeight = size[1] / modelNaturalSize[1];
        var scaleWidth = size[0] / modelNaturalSize[0];

        viewScale *= Math.min(scaleWidth, scaleHeight);

        halfWidth -= (modelNaturalSize[0] / 2 + processed.measurement.low[0]) * viewScale;

        viewOrigin = [halfWidth, processed.measurement.high[1] * viewScale];

        updateZoomScale();
    }

    export function browserIsMicrosoft() {
        var clues = ['Edge/', 'Trident/'];

        for (var i = 0; i < clues.length; i++) {
            if (navigator.userAgent.indexOf(clues[i]) > 0) {
                return true;
            }
        }
        return false;
    }

    function cleanHtml(html: string) {
        if (!html) return '';

        var div = document.createElement('div');
        div.innerHTML = html;

        var svg = div.querySelector('svg');
        if (svg) {
            div.removeChild(svg);
            return div.innerHTML;
        }

        return html;
    }

    export function render() {

        viewSvgContainer.innerHTML = '';

        var html = '';

        var strokeWidth = svgStrokeWidth;

        if (processed.model) {

            var fontSize = svgFontSize;

            var renderOptions: MakerJs.exporter.ISVGRenderOptions = {
                origin: viewOrigin,
                annotate: true,
                flow: { size: 8 },
                svgAttrs: {
                    "id": 'drawing',
                    "style": 'margin-left:' + viewPanOffset[0] + 'px; margin-top:' + viewPanOffset[1] + 'px'
                },
                strokeWidth: strokeWidth + 'px',
                fontSize: fontSize + 'px',
                scale: viewScale,
                useSvgPathOnly: false
            };

            panGrid();
            zoomGrid();

            //do not use actual units when rendering
            var units = processed.model.units;
            delete processed.model.units;

            html += makerjs.exporter.toSVG(processed.model, renderOptions);

            if (units) processed.model.units = units;
        }

        viewSvgContainer.innerHTML = html;

        if (processed.lockedPath) {
            var path = getLockedPathSvgElement();
            if (path) {
                path.setAttribute('class', 'locked');
                path.style.strokeWidth = (2 * strokeWidth) + 'px';
            }
        }

    }

    export function filenameFromRequireId(id: string, bustCache?: boolean): string {
        var filename = isHttp(id) ? id : (relativePath + id + '.js');
        if (bustCache) {
            filename += '?' + new Date().valueOf();
        }
        return filename;
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

            processResult({ result: errorDetails });

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

    export function toggleClassAndResize(name: string) {
        toggleClass(name);
        onWindowResize();
    }

    export function toggleClass(name: string, element: HTMLElement = document.body): boolean {
        var c = element.classList;
        var result: boolean;

        if (c.contains(name)) {
            c.remove(name);
            result = true;
        } else {
            c.add(name);
            result = false;
        }

        return result;
    }

    function getExport(ev: MessageEvent) {
        var response = ev.data as MakerJsPlaygroundExport.IExportResponse;

        progress.style.width = response.percentComplete + '%';

        if (response.percentComplete == 100 && response.text || response.error) {

            //allow progress bar to render
            setTimeout(function () {
                setExportText(response.format, response.formatTitle, response.text, response.error);
            }, 300);

        }
    }

    function setExportText(format: MakerJsPlaygroundExport.ExportFormat, title: string, text: string, error: string) {
        if (error) {
            downloadError.innerText = error;

            //put the download ui into ready mode
            toggleClass('download-generating');
            toggleClass('download-error');

            return;
        }

        var fe = MakerJsPlaygroundExport.formatMap[format];

        var encoded = encodeURIComponent(text);
        var uriPrefix = 'data:' + fe.mediaType + ',';
        var filename = (querystringParams['script'] || 'my-drawing') + '.' + fe.fileExtension;
        var dataUri = uriPrefix + encoded;

        //create a download link
        var a = new makerjs.exporter.XmlTag('a', { href: dataUri, download: filename });
        a.innerText = 'download ' + title;
        document.getElementById('download-link-container').innerHTML = a.toString();

        preview.value = text;

        (<HTMLSpanElement>document.getElementById('download-filename')).innerText = filename;

        //put the download ui into ready mode
        toggleClass('download-generating');
        toggleClass('download-ready');
    }

    export function downloadClick(a: HTMLAnchorElement, format: MakerJsPlaygroundExport.ExportFormat) {
        //show options
        FormatOptions.activateOption(format, a.innerText, processed.model);
        toggleClass('download-options');
    }

    export function getFormatOptions() {

        var formatOption = MakerJsPlayground.FormatOptions.current;
        if (!formatOption) {
            return;
        }

        var request: MakerJsPlaygroundExport.IExportRequest = {
            format: formatOption.format,
            formatTitle: formatOption.formatTitle,
            model: processed.model,
            options: formatOption.getOptionObject()
        };

        //put the download ui into generation mode
        progress.style.width = '0';
        toggleClass('download-options');
        toggleClass('download-generating');

        if (useWorkerThreads && Worker) {
            exportOnWorkerThread(request);
        } else {
            if (!exportOnUIThread(request)) {
                exportOnWorkerThread(request);
            }
        }
    }

    function exportOnUIThread(request: MakerJsPlaygroundExport.IExportRequest) {
        var text: string;
        var error: string;

        try {
            switch (request.format) {
                case MakerJsPlaygroundExport.ExportFormat.Dxf:
                    text = makerjs.exporter.toDXF(processed.model, request.options);
                    break;

                case MakerJsPlaygroundExport.ExportFormat.Json:
                    text = JSON.stringify(processed.model, null, 2);
                    break;

                case MakerJsPlaygroundExport.ExportFormat.OpenJsCad:
                    text = makerjs.exporter.toJscadScript(processed.model, request.options);
                    break;

                case MakerJsPlaygroundExport.ExportFormat.Svg:
                    text = makerjs.exporter.toSVG(processed.model, request.options);
                    break;

                case MakerJsPlaygroundExport.ExportFormat.SvgPathData:
                    text = makerjs.exporter.toSVGPathData(processed.model, request.options) as string;
                    break;

                default:
                    return false;
            }
        } catch (e) {
            error = e;
        }

        setExportText(request.format, request.formatTitle, text, error);
        return true;
    }

    function exportOnWorkerThread(request: MakerJsPlaygroundExport.IExportRequest) {

        //initialize a worker - this will download scripts into the worker
        if (!exportWorker) {
            exportWorker = new Worker('js/worker/export-worker.js?' + new Date().valueOf());
            exportWorker.onmessage = getExport;
        }

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

    export function onWindowResize() {
        if (checkFitToScreen.checked) {
            fitOnScreen();
            render();
        }

        if (fullScreen) {
            dockEditor(dockModes.FullScreen);
        } else if (document.body.offsetWidth < minDockSideBySide) {
            dockEditor(dockModes.None);
        } else {
            dockEditor(dockModes.SideBySide);
        }

    }

    export function loadInsertPage() {
        var div = document.querySelector('#insert-menu') as HTMLDivElement;
        var append = div.childNodes.length === 0;
        if (append) {
            var insertIframe = document.createElement('iframe');
            insertIframe.setAttribute('src', 'insert/index.html');
            div.appendChild(insertIframe);
        }

        if (toggleClass('collapse-insert-menu')) {
            //showing

            if (!append) {
                //existing
                div.querySelector('iframe').contentWindow['doFocus']();
            }
        }
    }

    export function command(cmd: string, value: any) {
        switch (cmd) {
            case "insert":
                return setTimeout(() => {
                    var doc = codeMirrorEditor.getDoc();
                    var range = doc.getCursor();
                    range.ch = 0;
                    doc.replaceRange(value + '\n', range);
                }, 0);
            case "run":
                return setTimeout(() => runCodeFromEditor(), 0);
            case "toggle":
                return setTimeout(() => toggleClass(value), 0);
            case "undo":
                return setTimeout(() => {
                    var doc = codeMirrorEditor.getDoc();
                    doc.undo();
                }, 0);
        }
    }

    //execution

    window.onload = function (ev) {

        //hide the customize menu when booting on small screens
        //if (document.body.clientWidth < 540) {
        //    document.body.classList.add('collapse-rendering-options');
        //}

        customizeMenu = document.getElementById('rendering-options-menu') as HTMLDivElement;
        view = document.getElementById('view') as HTMLDivElement;
        paramsDiv = document.getElementById('params') as HTMLDivElement;
        measurementDiv = document.getElementById('measurement') as HTMLDivElement;
        progress = document.getElementById('download-progress') as HTMLDivElement;
        preview = document.getElementById('download-preview') as HTMLTextAreaElement;
        downloadError = document.getElementById('download-error-message') as HTMLDivElement;
        checkFitToScreen = document.getElementById('check-fit-on-screen') as HTMLInputElement;
        checkShowGrid = document.getElementById('check-show-origin') as HTMLInputElement;
        checkNotes = document.getElementById('check-notes') as HTMLInputElement;
        viewSvgContainer = document.getElementById('view-svg-container') as HTMLDivElement;
        gridPattern = document.getElementById('gridPattern');
        crosshairs = document.getElementById('crosshairs');
        gridPatternFill = document.getElementById('gridPatternFill');

        margin = [viewSvgContainer.offsetLeft, viewSvgContainer.offsetTop];

        gridPattern.setAttribute('x', margin[0].toString());
        gridPattern.setAttribute('y', margin[1].toString());

        var pre = document.getElementById('init-javascript-code') as HTMLPreElement;
        codeMirrorOptions.value = pre.innerText;
        codeMirrorOptions["styleActiveLine"] = true;    //TODO use addons in declaration

        codeMirrorEditor = CodeMirror(
            function (elt) {
                pre.parentNode.replaceChild(elt, pre);
            },
            codeMirrorOptions
        );

        if (fullScreen) {
            dockEditor(dockModes.FullScreen);
        } else if (document.body.offsetWidth >= minDockSideBySide) {
            dockEditor(dockModes.SideBySide);
        }

        document.body.classList.add('wait');

        querystringParams = new QueryStringParams();
        useWorkerThreads = !querystringParams['noworker'];

        var parentLoad = querystringParams['parentload'] as string;
        if (parentLoad) {

            var fn: Function = parent[parentLoad];
            var loadCode = fn();
            codeMirrorEditor.getDoc().setValue(loadCode);
            runCodeFromEditor();

        } else {
            var scriptname = querystringParams['script'] as string;

            if (scriptname) {

                if (isHttp(scriptname)) {

                    downloadScript(filenameFromRequireId(scriptname), function (download: string) {
                        codeMirrorEditor.getDoc().setValue(download);

                        setProcessedModel(new Warning(), 'WARNING: The script has been loaded from an external site. \n\n Please inspect the code and proceed at your own risk.');
                    });

                } else {
                    var paramValues = getHashParams();

                    if (scriptname in makerjs.models) {

                        var code = generateCodeFromKit(scriptname, makerjs.models[scriptname]);
                        codeMirrorEditor.getDoc().setValue(code);
                        runCodeFromEditor(paramValues);

                    } else {
                        downloadScript(filenameFromRequireId(scriptname), function (download: string) {
                            codeMirrorEditor.getDoc().setValue(download);
                            runCodeFromEditor(paramValues);
                        });
                    }
                }
            } else {
                runCodeFromEditor();
            }
        }
    };

}
