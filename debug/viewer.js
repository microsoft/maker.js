
var Viewer = {
    ViewModel: null,
    ViewScale: 100,
    Render: function (newParams) { },
    Refresh: function (newParams) {
        Viewer.ViewModel = Viewer.Render(newParams);
    },

    getRaw: function (type) {
        switch (type) {
            case "dxf":
                return makerjs.exporter.toDXF(Viewer.ViewModel);

            case "svg":
                var myOutputScale = 100;
                return makerjs.exporter.toSVG(Viewer.ViewModel, { scale: myOutputScale });

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
        };

        //render model
        Viewer.Refresh();
    }
};

window.onload = Viewer.prepareView;
