/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/core/maker.ts" />
/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/path.ts" />
/// <reference path="../src/core/break.ts" />
/// <reference path="../src/core/intersect.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/core/loops.ts" />
/// <reference path="../src/core/dxf.ts" />
/// <reference path="../src/core/svg.ts" />
/// <reference path="../src/core/openjscad.ts" />
/// <reference path="../src/models/connectthedots.ts" />
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
    var selectFormat;
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
    var marker;
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
                if (!input)
                    continue;
                var div = new makerjs.exporter.XmlTag('div');
                div.innerText = label.toString() + input.toString();
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
    }
    function highlightCodeError(error) {
        processed.html = error.name + ' at line ' + error.lineno + ' column ' + error.colno + ' : ' + error.message;
        var editorLine = error.lineno - 1;
        var from = {
            line: editorLine, ch: error.colno - 1
        };
        var to = {
            line: editorLine, ch: MakerJsPlayground.codeMirrorEditor.getDoc().getLine(editorLine).length
        };
        marker = MakerJsPlayground.codeMirrorEditor.getDoc().markText(from, to, { title: error.message, clearOnEnter: true, className: 'code-error' });
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
        iframe.src = 'require-iframe.html';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }
    MakerJsPlayground.runCodeFromEditor = runCodeFromEditor;
    function processResult(html, result) {
        if (marker) {
            marker.clear();
            marker = null;
        }
        resetDownload();
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
        }
        else if (makerjs.isModel(result)) {
            processed.model = result;
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
                svgAttrs: { id: 'view-svg', "font-size": (MakerJsPlayground.windowZoom * MakerJsPlayground.svgFontSize) + 'px' },
                strokeWidth: (MakerJsPlayground.windowZoom * MakerJsPlayground.svgStrokeWidth) + 'px',
                scale: viewScale
            };
            var renderModel = {
                models: {
                    model: processed.model
                },
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
        var x = new XMLHttpRequest();
        x.open('GET', url, true);
        x.onreadystatechange = function () {
            if (x.readyState == 4 && x.status == 200) {
                callback(x.responseText);
            }
        };
        x.send();
    }
    MakerJsPlayground.downloadScript = downloadScript;
    function toggleClass(name) {
        var c = document.body.classList;
        if (c.contains(name)) {
            c.remove(name);
        }
        else {
            c.add(name);
        }
        MakerJsPlayground.render();
    }
    MakerJsPlayground.toggleClass = toggleClass;
    var formatMap = {
        "json": {
            xf: JSON.stringify,
            mt: 'application/json'
        },
        "dxf": {
            xf: makerjs.exporter.toDXF,
            mt: 'application/dxf'
        },
        "svg": {
            xf: makerjs.exporter.toSVG,
            mt: 'image/svg+xml'
        },
        "openjscad": {
            xf: makerjs.exporter.toOpenJsCad,
            mt: 'text/plain'
        },
        "stl": {
            xf: makerjs.exporter.toSTL,
            mt: 'application/stl'
        }
    };
    function getExport(format) {
        var iexport = formatMap[format];
        if (iexport) {
            //call the exporter function. for STL, this may take a while on the UI thread.
            var text = iexport.xf(processed.model);
            var encoded = encodeURIComponent(text);
            var uriPrefix = 'data:' + iexport.mt + ',';
            return {
                text: text,
                dataUri: uriPrefix + encoded
            };
        }
        return null;
    }
    MakerJsPlayground.getExport = getExport;
    function downloadClick(a, format) {
        //todo - generate out of the click handler in case generation takes a while
        a.href = getExport(format).dataUri;
    }
    MakerJsPlayground.downloadClick = downloadClick;
    //execution
    window.onload = function (ev) {
        if (window.orientation === void 0) {
            window.orientation = 'landscape';
        }
        customizeMenu = document.getElementById('rendering-options-menu');
        view = document.getElementById('view');
        selectFormat = document.getElementById('select-format');
        var viewMeasure = document.getElementById('view-measure');
        hMargin = viewMeasure.offsetLeft;
        vMargin = viewMeasure.offsetTop;
        var pre = document.getElementById('init-javascript-code');
        MakerJsPlayground.codeMirrorOptions.value = pre.innerText;
        MakerJsPlayground.codeMirrorEditor = CodeMirror(function (elt) {
            pre.parentNode.replaceChild(elt, pre);
        }, MakerJsPlayground.codeMirrorOptions);
        var qps = new QueryStringParams();
        var scriptname = qps['script'];
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