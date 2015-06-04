
var Viewer = {
    SvgOrigin: [100, 300],
    ViewModel: null,
    ViewScale: 100,
    Render: function () { },

    getRaw: function (type) {
        switch (type) {
            case "dxf":
                return makerjs.exports.DXF(Viewer.ViewModel);

            case "svg":
                var myOutputScale = 100;
                return makerjs.exports.SVG(Viewer.ViewModel, { scale: myOutputScale });

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
            Viewer.ViewModel = Viewer.Render();
        };

        //show crosshairs
        var size = 50;
        var crossHairs = [makerjs.path.CreateLine('v', [0, size], [0, -size]), makerjs.path.CreateLine('h', [-size, 0], [size, 0]), ];
        view.innerHTML += makerjs.exports.SVG(crossHairs, { origin: Viewer.SvgOrigin, stroke: 'red', strokeWidth: 1 });

        //render model
        Viewer.ViewModel = Viewer.Render();
    }
};

window.onload = Viewer.prepareView;
