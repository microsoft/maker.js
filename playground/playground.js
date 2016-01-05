/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/core/exporter.ts" />
/// <reference path="../src/core/kit.ts" />
/// <reference path="../src/core/svg.ts" />
/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/intersect.ts" />
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
    var renderingOptionsMenu;
    var view;
    var hMargin;
    var vMargin;
    var processed = {
        html: '',
        kit: null,
        model: null,
        paramValues: [],
        paramHtml: ''
    };
    function isHttp(url) {
        return "http" === url.substr(0, 4);
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
        document.getElementById('params').innerHTML = processed.paramHtml;
        render();
        //now safe to render, so register a resize listener
        if (!window.onresize) {
            window.onresize = function() {
                render();
            }
            window.ontouchend = function () {
                setTimeout(function(){
                    processed.html += 'tv ' + window.innerWidth + ' ' + screen.width + '<br/>';
                
                    MakerJsPlayground.windowZoom = window.innerWidth / screen.width;
                    render();
                }, 0);
            };
        }
    }
    MakerJsPlayground.processResult = processResult;
    function setParam(index, value) {
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
        //remove content so default size can be measured
        view.innerHTML = '';
        if (processed.model) {
            var measure = makerjs.measure.modelExtents(processed.model);
            var modelHeightNatural = measure.high[1] - measure.low[1];
            var modelWidthNatural = measure.high[0] - measure.low[0];
            var height = view.offsetHeight - 2 * vMargin;
            var width = document.getElementById('view-params').offsetWidth - 2 * hMargin;
            var menuLeft = renderingOptionsMenu.offsetLeft - 2 * hMargin;
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
            var html = processed.html;
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
    function getRaw(type) {
        switch (type) {
            case "dxf":
                return makerjs.exporter.toDXF(processed.model);
            case "svg":
                return makerjs.exporter.toSVG(processed.model);
            case "json":
                return JSON.stringify(processed.model);
            case "openjscad":
                return makerjs.exporter.toOpenJsCad(processed.model);
            case "stl":
                return makerjs.exporter.toSTL(processed.model);
        }
    }
    MakerJsPlayground.getRaw = getRaw;
    function getExport(type) {
        var raw = getRaw(type);
        var encoded = encodeURIComponent(raw);
        switch (type) {
            case "dxf":
                return "data:application/dxf," + encoded;
            case "svg":
                return "data:image/svg+xml," + encoded;
            case "json":
                return "data:application/json," + encoded;
            case "openjscad":
                return "data:text/javascript," + encoded;
            case "stl":
                return "data:application/stl," + encoded;
        }
    }
    MakerJsPlayground.getExport = getExport;
    //execution
    window.onload = function (ev) {
        renderingOptionsMenu = document.getElementById('rendering-options-menu');
        view = document.getElementById('view');
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
            downloadScript(filenameFromRequireId(scriptname), function (download) {
                MakerJsPlayground.codeMirrorEditor.getDoc().setValue(download);
                runCodeFromEditor();
            });
        }
        else {
            runCodeFromEditor();
        }
    };
})(MakerJsPlayground || (MakerJsPlayground = {}));
//# sourceMappingURL=playground.js.map
