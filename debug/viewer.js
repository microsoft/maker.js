
var Viewer = {
    Params: {},
    ViewModel: null,
    ViewScale: 100, //100 pixels per mm
    Render: function () {
        return {};
    },
    Refresh: function (newParams) {

        //apply slider parameters
        for (var paramName in newParams) {
            Viewer.Params[paramName].value = newParams[paramName];
        }

        var values = {};
        for (var paramName in Viewer.Params) {
            values[paramName] = Viewer.Params[paramName].value;
        }
        var model = Viewer.Render(values);

        Viewer.ViewModel = model;

        //svg output
        var renderOptions = {
            viewBox: false,
            stroke: 'blue',
            strokeWidth: 2,
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
            stroke: 'red',
            strokeWidth: 1,
            useSvgPathOnly: false
        };

        var size = 250;
        var crossHairs = [makerjs.createLine('v', [0, size], [0, -size]), makerjs.createLine('h', [-size, 0], [size, 0]), ];
        document.getElementById("svg-guides").innerHTML = makerjs.exporter.toSVG(crossHairs, crosshairOptions);
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
            var scaleDelta = 10;
            Viewer.ViewScale = Math.max(Viewer.ViewScale + ((ev.wheelDelta || ev.deltaY) > 0 ? 1 : -1) * scaleDelta, 1);
            Viewer.Refresh();
            return false;
        };

        //populate params
        var paramsHtml = '';
        for (var paramName in Viewer.Params) {
            var attrs = Viewer.Params[paramName];

            if (attrs.type == 'range') {
                var input = new makerjs.exporter.XmlTag('input', attrs);
                input.attrs['onchange'] = 'Viewer.Refresh({ "' + paramName + '": this.valueAsNumber })';
                paramsHtml += '<div>' + paramName + ': ' + input.toString() + '</div>';
            }
        }
        document.getElementById("params").innerHTML = paramsHtml;

        //render model
        Viewer.Refresh();
    }
};

window.onload = Viewer.prepareView;
