/// <reference path="../typings/lib.webworker.d.ts" />
/// <reference path="export-format.ts" />
var _this = this;
/* module system */
var module = this;
module.require = function (id) {
    if (id in module) {
        return module[id];
    }
    return _this;
};
importScripts("../external/OpenJsCad/csg.js", "../external/OpenJsCad/formats.js", "../target/js/node.maker.js", "export-format.js");
var makerjs = module['MakerJs'];
function getExporter(format) {
    var f = MakerJsPlaygroundExport.ExportFormat;
    switch (format) {
        case f.Json:
            return JSON.stringify;
        case f.Dxf:
            return makerjs.exporter.toDXF;
        case f.Svg:
            return makerjs.exporter.toSVG;
        case f.OpenJsCad:
            return makerjs.exporter.toOpenJsCad;
        case f.Stl:
            return makerjs.exporter.toSTL;
    }
}
/* events */
onmessage = function (ev) {
    var request = ev.data;
    var exporter = getExporter(request.format);
    if (exporter) {
        //call the exporter function.
        var text = exporter(request.model);
        var result = {
            request: request,
            text: text,
            percentComplete: 100
        };
        postMessage(result);
    }
    console.log("worker:" + request.format + request.model);
};
