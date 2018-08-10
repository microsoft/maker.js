var _this = this;
// dependency libraries
var PDFDocument;
/* module system */
var module = this;
module.require = function (id) {
    if (id in module) {
        return module[id];
    }
    return _this;
};
importScripts('../../../target/js/browser.maker.js?' + new Date().valueOf(), '../../../external/bezier-js/bezier.js', '../iexport.js');
var makerjs = require('makerjs');
var deps = {};
deps[MakerJsPlaygroundExport.ExportFormat.Dxf] = true;
deps[MakerJsPlaygroundExport.ExportFormat.Json] = true;
deps[MakerJsPlaygroundExport.ExportFormat.OpenJsCad] = true;
deps[MakerJsPlaygroundExport.ExportFormat.Svg] = true;
deps[MakerJsPlaygroundExport.ExportFormat.Stl] = false;
deps[MakerJsPlaygroundExport.ExportFormat.Pdf] = false;
function getExporter(format, result) {
    var f = MakerJsPlaygroundExport.ExportFormat;
    switch (format) {
        case f.Json:
            return makerjs.exporter.toJson;
        case f.Dxf:
            function toDXF(model, options) {
                if (!options.units) {
                    options.units = model.units || makerjs.unitType.Millimeter;
                }
                return makerjs.exporter.toDXF(model, options);
            }
            return toDXF;
        case f.Svg:
            return makerjs.exporter.toSVG;
        case f.SvgPathData:
            return makerjs.exporter.toSVGPathData;
        case f.OpenJsCad:
            return makerjs.exporter.toJscadScript;
        case f.Stl:
            function toStl(model, options) {
                if (!deps[MakerJsPlaygroundExport.ExportFormat.Stl]) {
                    importScripts('../../../external/jscad/csg.js', '../../../external/jscad/stl-serializer.js');
                    deps[MakerJsPlaygroundExport.ExportFormat.Stl] = true;
                }
                //make sure size is in mm for STL
                model = makerjs.model.convertUnits(model, makerjs.unitType.Millimeter);
                var CAG = require('@jscad/csg').CAG;
                var stlSerializer = require('@jscad/stl-serializer');
                options.statusCallback = function (status) {
                    result.percentComplete = status.progress;
                    postMessage(result);
                };
                return makerjs.exporter.toJscadSTL(CAG, stlSerializer, model, options);
            }
            return toStl;
        case f.Pdf:
            function toPdf(model, exportOptions) {
                if (!deps[MakerJsPlaygroundExport.ExportFormat.Pdf]) {
                    importScripts('../../../external/text-encoding/encoding-indexes.js', '../../../external/text-encoding/encoding.js', '../../../external/PDFKit/pdfkit.js', 'string-reader.js');
                    deps[MakerJsPlaygroundExport.ExportFormat.Pdf] = true;
                }
                function complete(pdfDataString) {
                    result.text = pdfDataString;
                    result.percentComplete = 100;
                    postMessage(result);
                }
                //TODO: watermark
                //TODO: title, author, grid from options
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
        format: request.format,
        formatTitle: request.formatTitle,
        error: null,
        text: null,
        percentComplete: 0
    };
    var exporter = getExporter(request.format, result);
    if (exporter) {
        //call the exporter function.
        try {
            result.text = exporter(request.model, request.options);
        }
        catch (e) {
            result.error = '' + e;
        }
        result.percentComplete = 100;
        postMessage(result);
    }
};
//# sourceMappingURL=export-worker.js.map