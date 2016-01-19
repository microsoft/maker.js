/// <reference path="../typings/tsd.d.ts" />
/// <reference path="export-format.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/models/connectthedots.ts" />
/// <reference path="../typings/codemirror/codemirror.d.ts" />
/// <reference path="../typings/marked/marked.d.ts" />
var MakerJsPlayground;
(function (MakerJsPlayground) {
    //classes
    var QueryStringParams = (function () {
        function QueryStringParams(querystring) {
            if (querystring === void 0) { querystring = document.location.search.substring(1); }
            if (querystring) {
                var pairs = querystring.split('&');
                for (var i = 0; i < pairs.length; i++) {
                    var pair = pairs[i].split('=');
                    this[pair[0]] = decodeURIComponent(pair[1]);
                }
            }
        }
        return QueryStringParams;
    })();
    //private members
    var pixelsPerInch = 100;
    var iframe;
    var customizeMenu;
    var view;
    var progress;
    var preview;
    var hMargin;
    var vMargin;
    var processed = {
        html: '',
        kit: null,
        model: null,
        paramValues: [],
        paramHtml: ''
    };
    var init = true;
    var errorMarker;
    var exportWorker = null;
    var paramActiveTimeout;
    var longHoldTimeout;
    var viewModelRootSelector = 'svg > g > g > g';
    var zoomOutLockedPath = 0.44;
    function getZoom() {
        var landscape = (Math.abs(window.orientation) == 90) || window.orientation == 'landscape';
        var zoom = (landscape ? window.innerWidth : window.innerHeight) / document.body.clientWidth;
        MakerJsPlayground.windowZoom = Math.max(0.15, Math.min(zoom, 1));
    }
    function isHttp(url) {
        return "http" === url.substr(0, 4);
    }
    function isIJavaScriptErrorDetails(result) {
        var sample = {
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
    function populateParams(metaParameters) {
        if (metaParameters) {
            var paramValues = [];
            var paramHtml = '';
            for (var i = 0; i < metaParameters.length; i++) {
                var attrs = makerjs.cloneObject(metaParameters[i]);
                var id = 'slider_' + i;
                var label = new makerjs.exporter.XmlTag('label', { "for": id, title: attrs.title });
                label.innerText = attrs.title + ': ';
                var input = null;
                var numberBox = null;
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
                if (!input)
                    continue;
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
    function generateCodeFromKit(id, kit) {
        var values = [];
        var comment = [];
        var code = [];
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
            }
            else {
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
    function highlightCodeError(error) {
        if (error.lineno || error.colno) {
            processed.html = error.name + ' at line ' + error.lineno + ' column ' + error.colno + ' : ' + error.message;
            var editorLine = error.lineno - 1;
            var from = {
                line: editorLine, ch: error.colno - 1
            };
            var to = {
                line: editorLine, ch: MakerJsPlayground.codeMirrorEditor.getDoc().getLine(editorLine).length
            };
            errorMarker = MakerJsPlayground.codeMirrorEditor.getDoc().markText(from, to, { title: error.message, clearOnEnter: true, className: 'code-error' });
        }
        else {
            processed.html = error.name + ' : ' + error.message;
        }
    }
    function arraysEqual(a, b) {
        if (!a || !b)
            return false;
        if (a.length != b.length)
            return false;
        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
    function viewClick(ev) {
        if (ev.srcElement && ev.srcElement.tagName && ev.srcElement.tagName == 'text') {
            var text = ev.srcElement;
            var path = text.previousSibling;
            lockToPath(path);
        }
    }
    function lockToPath(path) {
        //trace back to root
        var root = view.querySelector(viewModelRootSelector);
        var route = [];
        var element = path;
        while (element !== root) {
            var id = element.attributes.getNamedItem('id').value;
            route.unshift(id);
            if (element.nodeName == 'g') {
                route.unshift('models');
            }
            else {
                route.unshift('paths');
            }
            element = element.parentNode;
        }
        if (processed.lockedPath && arraysEqual(processed.lockedPath.route, route)) {
            processed.lockedPath = null;
            setNotes(processed.model.notes || processed.kit.notes);
        }
        else {
            var crumb = 'this';
            for (var i = 0; i < route.length; i++) {
                if (i % 2 == 0) {
                    crumb += "." + route[i];
                }
                else {
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
        var root = view.querySelector(viewModelRootSelector);
        var selector = '';
        for (var i = 0; i < processed.lockedPath.route.length - 2; i += 2) {
            selector += " g[id='" + processed.lockedPath.route[i + 1] + "']";
        }
        selector += " [id='" + processed.lockedPath.route[processed.lockedPath.route.length - 1] + "']";
        return root.querySelector(selector);
    }
    function getLockedPathAndOffset() {
        if (!processed.lockedPath)
            return null;
        var ref = processed.model;
        var origin = processed.model.origin || [0, 0];
        var route = processed.lockedPath.route.slice();
        while (route.length) {
            var prop = route.shift();
            ref = ref[prop];
            if (!ref)
                return null;
            if (ref.origin && route.length) {
                origin = makerjs.point.add(origin, ref.origin);
            }
        }
        return {
            path: ref,
            offset: origin
        };
    }
    function updateLockedPathNotes() {
        if (processed.model && processed.lockedPath) {
            var pathAndOffset = getLockedPathAndOffset();
            if (pathAndOffset) {
                setNotes(processed.lockedPath.notes + "``` " + JSON.stringify(pathAndOffset.path) + "```\nOffset|```" + JSON.stringify(pathAndOffset.offset) + "```");
            }
            else {
                setNotes(processed.model.notes || processed.kit.notes);
            }
        }
    }
    function measureLockedPath() {
        var pathAndOffset = getLockedPathAndOffset();
        if (!pathAndOffset)
            return null;
        var measure = makerjs.measure.pathExtents(pathAndOffset.path);
        measure.high = makerjs.point.add(measure.high, pathAndOffset.offset);
        measure.low = makerjs.point.add(measure.low, pathAndOffset.offset);
        return measure;
    }
    function areSameHeightMeasurement(a, b) {
        return a.high[1] == b.high[1] && a.low[1] == b.low[1];
    }
    MakerJsPlayground.codeMirrorOptions = {
        lineNumbers: true,
        theme: 'twilight',
        viewportMargin: Infinity
    };
    MakerJsPlayground.relativePath = '';
    MakerJsPlayground.svgFontSize = 14;
    MakerJsPlayground.svgStrokeWidth = 2;
    MakerJsPlayground.windowZoom = 1;
    function runCodeFromEditor() {
        iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write('<html><head><script src="require-iframe.js"></script></head><body></body></html>');
        iframe.contentWindow.document.close();
    }
    MakerJsPlayground.runCodeFromEditor = runCodeFromEditor;
    function setNotes(markdown) {
        var className = 'no-notes';
        var html = '';
        if (markdown) {
            html = marked(markdown);
            document.body.classList.remove(className);
        }
        else {
            document.body.classList.add(className);
        }
        document.getElementById('notes').innerHTML = html;
    }
    MakerJsPlayground.setNotes = setNotes;
    function processResult(html, result) {
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
            populateParams(result.metaParameters);
            processed.kit = result;
            //construct an IModel from the Node module
            processed.model = makerjs.kit.construct(result, processed.paramValues);
            setNotes(processed.model.notes || processed.kit.notes);
        }
        else if (makerjs.isModel(result)) {
            processed.model = result;
            setNotes(processed.model.notes);
        }
        else if (isIJavaScriptErrorDetails(result)) {
            //render script error
            highlightCodeError(result);
        }
        document.getElementById('params').innerHTML = processed.paramHtml;
        updateLockedPathNotes();
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
            view.addEventListener('click', viewClick);
        }
    }
    MakerJsPlayground.processResult = processResult;
    function setParam(index, value) {
        //sync slider / numberbox
        var div = document.querySelectorAll('#params > div')[index];
        var slider = div.querySelector('input[type=range]');
        var numberBox = div.querySelector('input[type=number]');
        if (slider && numberBox) {
            if (div.classList.contains('toggle-number')) {
                //numberbox is master
                slider.value = numberBox.value;
            }
            else {
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
            updateLockedPathNotes();
        }
        render();
    }
    MakerJsPlayground.setParam = setParam;
    function toggleSliderNumberBox(label, index) {
        var id;
        if (toggleClass('toggle-number', false, label.parentElement)) {
            id = 'slider_' + index;
            //re-render according to slider value since numberbox may be out of limits
            var slider = document.getElementById(id);
            slider.onchange(null);
        }
        else {
            id = 'numberbox_' + index;
        }
        label.htmlFor = id;
    }
    MakerJsPlayground.toggleSliderNumberBox = toggleSliderNumberBox;
    function activateParam(input, onLongHold) {
        if (onLongHold === void 0) { onLongHold = false; }
        function activate() {
            document.body.classList.add('param-active');
            input.parentElement.classList.add('active');
            clearTimeout(paramActiveTimeout);
        }
        if (onLongHold) {
            longHoldTimeout = setTimeout(activate, 200);
        }
        else {
            activate();
        }
    }
    MakerJsPlayground.activateParam = activateParam;
    function deActivateParam(input, delay) {
        clearTimeout(longHoldTimeout);
        clearTimeout(paramActiveTimeout);
        paramActiveTimeout = setTimeout(function () {
            document.body.classList.remove('param-active');
            input.parentElement.classList.remove('active');
        }, delay);
    }
    MakerJsPlayground.deActivateParam = deActivateParam;
    function render() {
        getZoom();
        //remove content so default size can be measured
        view.innerHTML = '';
        var html = processed.html;
        if (processed.model) {
            var annotate = document.getElementById('check-annotate').checked;
            var fitOnScreen = document.getElementById('check-fit-on-screen').checked;
            var measureModel = makerjs.measure.modelExtents(processed.model);
            var measure = measureLockedPath();
            if (!measure || !fitOnScreen || !annotate) {
                measure = measureModel;
            }
            var modelHeightNatural = measure.high[1] - measure.low[1];
            var modelWidthNatural = measure.high[0] - measure.low[0];
            var viewHeight = view.offsetHeight - 2 * vMargin;
            var viewWidth = document.getElementById('view-params').offsetWidth - 2 * hMargin;
            var menuLeft = customizeMenu.offsetLeft - 2 * hMargin;
            var viewScale = 1;
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
            var zoomOut = false;
            if (fitOnScreen) {
                var scaleHeight = viewHeight / modelHeightInPixels;
                var scaleWidth = viewWidth / modelWidthInPixels;
                viewScale *= Math.min(scaleWidth, scaleHeight);
                zoomOut = processed.lockedPath && !areSameHeightMeasurement(measureModel, measure);
                if (zoomOut) {
                    viewScale *= zoomOutLockedPath;
                }
            }
            var centerY = measure.high[1] * viewScale;
            var v2 = viewHeight / 2;
            if (!modelHeightInPixels) {
                centerY += v2;
            }
            else if (zoomOut) {
                centerY += v2 * (1 - zoomOutLockedPath);
            }
            var renderOptions = {
                origin: [viewWidth / 2 - (modelWidthNatural / 2 + measure.low[0]) * viewScale, centerY],
                annotate: annotate,
                svgAttrs: { id: 'view-svg' },
                fontSize: (MakerJsPlayground.windowZoom * MakerJsPlayground.svgFontSize) + 'px',
                strokeWidth: (MakerJsPlayground.windowZoom * MakerJsPlayground.svgStrokeWidth) + 'px',
                scale: viewScale,
                useSvgPathOnly: false
            };
            var renderModel = {
                models: {
                    ROOT: processed.model
                }
            };
            if (document.getElementById('check-show-origin').checked) {
                renderModel.paths = {
                    'crosshairs-vertical': new makerjs.paths.Line([0, measure.low[1]], [0, measure.high[1]]),
                    'crosshairs-horizontal': new makerjs.paths.Line([measure.low[0], 0], [measure.high[0], 0])
                };
            }
            html += makerjs.exporter.toSVG(renderModel, renderOptions);
        }
        view.innerHTML = html;
        if (processed.lockedPath) {
            var path = getLockedPathSvgElement();
            if (path) {
                path.setAttribute('class', 'locked');
                path.style.strokeWidth = (MakerJsPlayground.windowZoom * 2 * MakerJsPlayground.svgStrokeWidth) + 'px';
            }
        }
    }
    MakerJsPlayground.render = render;
    function filenameFromRequireId(id) {
        return MakerJsPlayground.relativePath + id + '.js';
    }
    MakerJsPlayground.filenameFromRequireId = filenameFromRequireId;
    function downloadScript(url, callback) {
        var timeout = setTimeout(function () {
            x.onreadystatechange = null;
            var errorDetails = {
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
    MakerJsPlayground.downloadScript = downloadScript;
    function toggleClass(name, doRender, element) {
        if (doRender === void 0) { doRender = true; }
        if (element === void 0) { element = document.body; }
        var c = element.classList;
        var result;
        if (c.contains(name)) {
            c.remove(name);
            result = true;
        }
        else {
            c.add(name);
            result = false;
        }
        if (doRender) {
            render();
        }
        return result;
    }
    MakerJsPlayground.toggleClass = toggleClass;
    function getExport(ev) {
        var response = ev.data;
        progress.style.width = response.percentComplete + '%';
        if (response.percentComplete == 100 && response.text) {
            //allow progress bar to render
            setTimeout(function () {
                var fe = MakerJsPlaygroundExport.formatMap[response.request.format];
                var encoded = encodeURIComponent(response.text);
                var uriPrefix = 'data:' + fe.mediaType + ',';
                var filename = (MakerJsPlayground.querystringParams['script'] || 'my-drawing') + '.' + fe.fileExtension;
                var dataUri = uriPrefix + encoded;
                //create a download link
                var a = new makerjs.exporter.XmlTag('a', { href: dataUri, download: filename });
                a.innerText = 'download ' + response.request.formatTitle;
                document.getElementById('download-link-container').innerHTML = a.toString();
                preview.value = response.text;
                document.getElementById('download-filename').innerText = filename;
                //put the download ui into ready mode
                toggleClass('download-generating', false);
                toggleClass('download-ready', false);
            }, 300);
        }
    }
    function downloadClick(a, format) {
        var request = {
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
    MakerJsPlayground.downloadClick = downloadClick;
    function copyToClipboard() {
        preview.select();
        document.execCommand('copy');
    }
    MakerJsPlayground.copyToClipboard = copyToClipboard;
    function cancelExport() {
        if (exportWorker) {
            exportWorker.terminate();
            exportWorker = null;
        }
        document.body.classList.remove('download-generating');
    }
    MakerJsPlayground.cancelExport = cancelExport;
    function isSmallDevice() {
        return document.body.clientWidth < 540;
    }
    MakerJsPlayground.isSmallDevice = isSmallDevice;
    //execution
    window.onload = function (ev) {
        if (window.orientation === void 0) {
            window.orientation = 'landscape';
        }
        //hide the customize menu when booting on small screens
        //if (document.body.clientWidth < 540) {
        //    document.body.classList.add('collapse-rendering-options');
        //}
        customizeMenu = document.getElementById('rendering-options-menu');
        view = document.getElementById('view');
        progress = document.getElementById('download-progress');
        preview = document.getElementById('download-preview');
        var viewMeasure = document.getElementById('view-measure');
        hMargin = viewMeasure.offsetLeft;
        vMargin = viewMeasure.offsetTop;
        var pre = document.getElementById('init-javascript-code');
        MakerJsPlayground.codeMirrorOptions.value = pre.innerText;
        MakerJsPlayground.codeMirrorEditor = CodeMirror(function (elt) {
            pre.parentNode.replaceChild(elt, pre);
        }, MakerJsPlayground.codeMirrorOptions);
        MakerJsPlayground.querystringParams = new QueryStringParams();
        var scriptname = MakerJsPlayground.querystringParams['script'];
        if (scriptname && !isHttp(scriptname)) {
            if (scriptname in makerjs.models) {
                var code = generateCodeFromKit(scriptname, makerjs.models[scriptname]);
                MakerJsPlayground.codeMirrorEditor.getDoc().setValue(code);
                runCodeFromEditor();
            }
            else {
                downloadScript(filenameFromRequireId(scriptname), function (download) {
                    MakerJsPlayground.codeMirrorEditor.getDoc().setValue(download);
                    runCodeFromEditor();
                });
            }
        }
        else {
            runCodeFromEditor();
        }
    };
})(MakerJsPlayground || (MakerJsPlayground = {}));
//# sourceMappingURL=playground.js.map