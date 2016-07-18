var _this = this;
/* module system */
var module = this;
module.require = function (id) {
    if (id in module) {
        return module[id];
    }
    return _this;
};
importScripts('../../target/js/browser.maker.js?' + new Date().valueOf(), '../../external/bezier-js/bezier.js', '../iexport.js');
var makerjs = require('makerjs');
var unionCount = 0;
var unionIndex = 0;
var polygonCount = 0;
var polygonIndex = 0;
var incrementUnion;
var incrementPolygon;
var deps = {};
deps[MakerJsPlaygroundExport.ExportFormat.Dxf] = { loaded: true };
deps[MakerJsPlaygroundExport.ExportFormat.Json] = { loaded: true };
deps[MakerJsPlaygroundExport.ExportFormat.OpenJsCad] = { loaded: true };
deps[MakerJsPlaygroundExport.ExportFormat.Svg] = { loaded: true };
deps[MakerJsPlaygroundExport.ExportFormat.Stl] = {
    loaded: false,
    load: function () {
        importScripts('../../external/OpenJsCad/csg.js', '../../external/OpenJsCad/formats.js');
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
    }
};
deps[MakerJsPlaygroundExport.ExportFormat.Pdf] = {
    loaded: false,
    load: function () {
        importScripts('../../external/text-encoding/encoding-indexes.js', '../../external/text-encoding/encoding.js', '../../external/PDFKit/pdfkit.js', 'string-reader.js');
    }
};
function getExporter(format, result) {
    var f = MakerJsPlaygroundExport.ExportFormat;
    if (!deps[format].loaded) {
        deps[format].load();
        deps[format].loaded = true;
    }
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
            return toStl;
        case f.Pdf:
            function toPdf(model) {
                function complete(pdfDataString) {
                    result.text = pdfDataString;
                    result.percentComplete = 100;
                    postMessage(result);
                }
                //TODO: title, author from options
                var pdfOptions = {
                    compress: false,
                    info: {
                        Producer: 'MakerJs',
                        Author: 'MakerJs'
                    }
                };
                var doc = new PDFDocument(pdfOptions);
                var reader = new StringReader(complete);
                var stream = doc.pipe(reader);
                //TODO: break up model across pages
                //one inch margin
                var exportOptions = {
                    origin: [72, 72]
                };
                makerjs.exporter.toPDF(doc, model, exportOptions);
                doc.end();
            }
            return toPdf;
    }
}
/* events */
onmessage = function (ev) {
    var request = ev.data;
    var result = {
        request: request,
        text: null,
        percentComplete: 0
    };
    var exporter = getExporter(request.format, result);
    if (exporter) {
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