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
                var textbox = null;
                switch (attrs.type) {
                    case 'range':
                        attrs.title = attrs.value;
                        input = new makerjs.exporter.XmlTag('input', attrs);
                        input.attrs['id'] = id;
                        input.attrs['onchange'] = 'this.title=this.value;MakerJsPlayground.setParam(' + i + ', makerjs.round(this.valueAsNumber, .001))';
                        input.attrs['ontouchstart'] = 'MakerJsPlayground.activateParam(this)';
                        input.attrs['ontouchend'] = 'MakerJsPlayground.deActivateParam(this, 1500)';
                        var textboxAttrs = {
                            "id": 'textbox_' + i,
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
                        label.attrs['onclick'] = 'MakerJsPlayground.toggleSliderTextbox(this, ' + i + ')';
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
    MakerJsPlayground.processResult = processResult;
    function setParam(index, value) {
        //sync slider / textbox
        var div = document.querySelectorAll('#params > div')[index];
        var slider = div.querySelector('input[type=range]');
        var textbox = div.querySelector('input[type=text]');
        if (slider && textbox) {
            if (div.classList.contains('toggle-text')) {
                //textbox is master
                slider.value = textbox.value;
            }
            else {
                //slider is master
                textbox.value = slider.value;
            }
        }
        resetDownload();
        processed.paramValues[index] = value;
        //see if output is either a Node module, or a MakerJs.IModel
        if (processed.kit) {
            //construct an IModel from the kit
            processed.model = makerjs.kit.construct(processed.kit, processed.paramValues);
        }
        render();
    }
    MakerJsPlayground.setParam = setParam;
    function toggleSliderTextbox(label, index) {
        var id;
        if (toggleClass('toggle-text', false, label.parentElement)) {
            id = 'slider_' + index;
            //re-render according to slider value since textbox may be out of limits
            var slider = document.getElementById(id);
            slider.onchange(null);
        }
        else {
            id = 'textbox_' + index;
        }
        label.htmlFor = id;
    }
    MakerJsPlayground.toggleSliderTextbox = toggleSliderTextbox;
    function activateParam(input) {
        document.body.classList.add('param-active');
        input.parentElement.classList.add('active');
        clearTimeout(paramActiveTimeout);
    }
    MakerJsPlayground.activateParam = activateParam;
    function deActivateParam(input, delay) {
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
            if (document.getElementById('check-fit-on-screen').checked) {
                var scaleHeight = height / modelHeightInPixels;
                var scaleWidth = width / modelWidthInPixels;
                viewScale *= Math.min(scaleWidth, scaleHeight);
            }
            var renderOptions = {
                origin: [width / 2 - (modelWidthNatural / 2 + measure.low[0]) * viewScale, measure.high[1] * viewScale],
                annotate: document.getElementById('check-annotate').checked,
                svgAttrs: { id: 'view-svg' },
                fontSize: (MakerJsPlayground.windowZoom * MakerJsPlayground.svgFontSize) + 'px',
                strokeWidth: (MakerJsPlayground.windowZoom * MakerJsPlayground.svgStrokeWidth) + 'px',
                scale: viewScale,
                useSvgPathOnly: false
            };
            var renderModel = {
                models: {
                    model: processed.model
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
    function toggleClass(name, render, element) {
        if (render === void 0) { render = true; }
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
        if (render) {
            MakerJsPlayground.render();
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