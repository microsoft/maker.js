
var Viewer = {
    Params: [],
    ViewModel: null,
    ViewScale: null,
    scaleDelta: 10,
    Constructor: function () {},
    Refresh: function (index, arg) {

        //apply slider parameters
        if (typeof index !== 'undefined') {
            Viewer.Params[index] = makerjs.round(arg, .001);
        }

        var model = makerjs.kit.construct(Viewer.Constructor, Viewer.Params);

        Viewer.ViewModel = model;

        if (Viewer.ViewScale == null) {
            //measure the model to make it fit in the window
            Viewer.Fit();
        }

        //svg output
        var renderOptions = {
            viewBox: false,
            stroke: null,
            strokeWidth: null,
            annotate: document.getElementById('checkAnnotate').checked,
            scale: Viewer.ViewScale,
            useSvgPathOnly: false
        };

        var svg = makerjs.exporter.toSVG(model, renderOptions);
        document.getElementById("svg-render").innerHTML = svg;

        //show crosshairs
        var crosshairOptions = {
            viewBox: false,
            origin: renderOptions.origin,
            stroke: null,
            strokeWidth: null,
            useSvgPathOnly: false
        };

        var size = 250;
        var crossHairs = [new makerjs.paths.Line('v', [0, size], [0, -size]), new makerjs.paths.Line('h', [-size, 0], [size, 0]), ];
        document.getElementById("svg-guides").innerHTML = makerjs.exporter.toSVG(crossHairs, crosshairOptions);
    },

    Fit: function () {
        var deltaFactor = 10;
        var padding = 100;

        //measure the model
        var size = makerjs.measure.modelExtents(Viewer.ViewModel);
        var width = size.high[0] - size.low[0];
        var height = size.high[1] - size.low[1];

        //measure the view
        var svgRender = document.getElementById("svg-render");

        //find the best scale to fit

        Viewer.ViewScale = Math.min((svgRender.clientWidth - padding) / width, (svgRender.clientHeight - padding) / height);
        Viewer.scaleDelta = Viewer.ViewScale/ deltaFactor;
    },

    getRaw: function (type) {
        switch (type) {
            case "dxf":
                return makerjs.exporter.toDXF(Viewer.ViewModel);

            case "svg":
                return makerjs.exporter.toSVG(Viewer.ViewModel);

            case "json":
                return JSON.stringify(Viewer.ViewModel);
        }
    },

    getExport: function (type) {
        var raw = Viewer.getRaw(type);
        var encoded = encodeURIComponent(raw);
        switch (type) {
            case "dxf":
                return "data:application/dxf," + encoded;

            case "svg":
                return "data:image/svg+xml," + encoded;

            case "json":
                return "data:application/json," + encoded;
        }
    },

    hideExport: function () {
        var zone = document.getElementById("export-zone");
        zone.style.display = 'none';
    },

    showExport: function (type) {
        var raw = Viewer.getRaw(type);
        var zone = document.getElementById("export-zone");
        zone.innerText = raw;
        zone.style.display = 'block';
    },

    prepareView: function () {

        //attach mousewheel
        var view = document.getElementById("view");
        view.onwheel = view.onmousewheel = function (ev) {
            if (Viewer.ViewScale) {
                Viewer.ViewScale = Math.max(Viewer.ViewScale + ((ev.wheelDelta || ev.deltaY) > 0 ? 1 : -1) * Viewer.scaleDelta, 1);
                Viewer.Refresh();
            }
            return false;
        };

        var selectModelCode = document.getElementById('selectModelCode');
        Viewer.loadModelCode(selectModelCode.value);
    },

    populateParams: function (filename) {
        Viewer.Params = [];

        var paramsHtml = '';

        if (Viewer.Constructor.metaParameters) {
            for (var i = 0; i < Viewer.Constructor.metaParameters.length; i++) {
                var attrs = Viewer.Constructor.metaParameters[i];

                Viewer.Params.push(attrs.value);

                var id = 'input_' + i;
                var label = new makerjs.exporter.XmlTag('label', { "for": id, title: attrs.title });
                label.innerText = attrs.title + ': ';

                if (attrs.type == 'range') {
                    attrs.title = attrs.value;
                    var input = new makerjs.exporter.XmlTag('input', attrs);
                    input.attrs['onchange'] = 'this.title=this.value;Viewer.Refresh(' + i + ', this.valueAsNumber)';
                    input.attrs['id'] = id;

                    var div = new makerjs.exporter.XmlTag('div');
                    div.innerText = label.toString() + input.toString();
                    div.innerTextEscaped = true;
                    paramsHtml += div.toString();
                }
            }
        }
        document.getElementById("params").innerHTML = paramsHtml;
    },

    loadModelCode: function (filename) {

        if (filename) {
            var script = document.createElement('script');
            script.setAttribute('src', '../examples/' + filename + '.js');
            
            var _makerjs = makerjs;

            function newModelCode() {
                Viewer.ViewScale = null;

                makerjs = _makerjs;

                if (!Viewer.Constructor) {
                    Viewer.Constructor = require(filename);
                }

                Viewer.populateParams(filename);
                Viewer.Refresh();
            }

            script.onload = function () {
                setTimeout(newModelCode, 0);
            };

            
            window.require = function (name) {
                return module.exports;
            };
            Viewer.Constructor = null;

            document.getElementsByTagName('head')[0].appendChild(script);
        }

    }
};

window.onload = Viewer.prepareView;
