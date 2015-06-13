
var Viewer = {
    Params: [],
    ViewModel: null,
    ViewScale: 100, //100 pixels per mm
    construct: function(constructor, args) {
        function F() {
            return constructor.apply(this, args);
        }
        F.prototype = constructor.prototype;
        return new F();
    },
    Constructor: function () {},
    Refresh: function (index, arg) {

        //apply slider parameters
        if (typeof index !== 'undefined') {
            Viewer.Params[index] = makerjs.round(arg, .001);
        }

        var model = Viewer.construct(Viewer.Constructor, Viewer.Params);

        Viewer.ViewModel = model;

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
        Viewer.defaultViewScale = Viewer.ViewScale;

        //attach mousewheel
        var view = document.getElementById("view");
        view.onwheel = view.onmousewheel = function (ev) {
            var scaleDelta = 10;
            Viewer.ViewScale = Math.max(Viewer.ViewScale + ((ev.wheelDelta || ev.deltaY) > 0 ? 1 : -1) * scaleDelta, 1);
            Viewer.Refresh();
            return false;
        };

        var selectModelCode = document.getElementById('selectModelCode');
        Viewer.loadModelCode(selectModelCode.value);
    },

    populateParams: function () {
        Viewer.Params = [];
        var paramsHtml = '';
        for (var i = 0; i < Viewer.Constructor.metaArguments.length; i++) {
            var attrs = Viewer.Constructor.metaArguments[i];

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

        document.getElementById("params").innerHTML = paramsHtml;
    },

    newModelCode: function () {
        Viewer.ViewScale = Viewer.defaultViewScale;
        Viewer.populateParams();
        Viewer.Refresh();
    },

    loadModelCode: function (filename) {

        if (filename) {
            var script = document.createElement('script');
            script.setAttribute('src', filename);
            
            script.onload = function () {
                setTimeout(Viewer.newModelCode, 0);
            };

            document.getElementsByTagName('head')[0].appendChild(script);
        }

    }
};

window.onload = Viewer.prepareView;
