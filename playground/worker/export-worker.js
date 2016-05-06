/* module system */
var _this = this;
var module = this;
module.require = function (id) {
    if (id in module) {
        return module[id];
    }
    return _this;
};
importScripts('../../external/OpenJsCad/csg.js', '../../external/OpenJsCad/formats.js', '../../target/js/browser.maker.js', '../iexport.js');
var makerjs = require('makerjs');
var unionCount = 0;
var unionIndex = 0;
var polygonCount = 0;
var polygonIndex = 0;
var incrementUnion;
var incrementPolygon;
CSG.Path2D.prototype['appendArc2'] = CSG.Path2D.prototype.appendArc;
CSG.Path2D.prototype.appendArc = function (endpoint, options) {
    unionIndex++;
    incrementUnion();
    return this['appendArc2'](endpoint, options);
};
CSG.Path2D.prototype['appendPoint2'] = CSG.Path2D.prototype.appendPoint;
CSG.Path2D.prototype.appendPoint = function (point) {
    unionIndex++;
    incrementUnion();
    return this['appendPoint2'](point);
};
CAG.prototype['union2'] = CAG.prototype.union;
CAG.prototype.union = function (cag) {
    unionIndex++;
    incrementUnion();
    return this['union2'](cag);
};
CSG.Polygon.prototype['toStlString2'] = CSG.Polygon.prototype.toStlString;
CSG.Polygon.prototype.toStlString = function () {
    polygonIndex++;
    incrementPolygon();
    return this['toStlString2']();
};
CSG.prototype['toStlString2'] = CSG.prototype.toStlString;
CSG.prototype.toStlString = function () {
    polygonCount = this.polygons.length;
    polygonIndex = 0;
    return this['toStlString2']();
};
function toStl(model) {
    var options = {};
    var script = makerjs.exporter.toOpenJsCad(model, options);
    script += 'return ' + options.functionName + '();';
    unionCount = (script.match(/union/g) || []).length
        + (script.match(/appendArc/g) || []).length
        + (script.match(/appendPoint/g) || []).length;
    unionIndex = 0;
    var f = new Function(script);
    var csg = f();
    return csg.toStlString();
}
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
            return toStl;
    }
}
/* events */
onmessage = function (ev) {
    var request = ev.data;
    var exporter = getExporter(request.format);
    if (exporter) {
        var result = {
            request: request,
            text: null,
            percentComplete: 0
        };
        incrementUnion = function () {
            result.percentComplete = 50 * unionIndex / unionCount;
            postMessage(result);
        };
        incrementPolygon = function () {
            result.percentComplete = 50 + 50 * polygonIndex / polygonCount;
            postMessage(result);
        };
        //call the exporter function.
        result.text = exporter(request.model);
        result.percentComplete = 100;
        postMessage(result);
    }
};
//# sourceMappingURL=export-worker.js.map