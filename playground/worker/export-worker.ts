
//this is here for compilation in a web worker
interface CanvasRenderingContext2D {
}

declare var PDFDocument: PDFKit.PDFDocument;

/* module system */

var module = this as NodeModule;

module.require = (id: string): any => {

    if (id in module) {
        return module[id];
    }

    return this;
};

importScripts(
    '../../target/js/browser.maker.js?' + new Date().valueOf(),
    '../../external/bezier-js/bezier.js',
    '../iexport.js');

var makerjs: typeof MakerJs = require('makerjs');

var unionCount = 0;
var unionIndex = 0;
var polygonCount = 0;
var polygonIndex = 0;

var incrementUnion: Function;
var incrementPolygon: Function;

var deps: { [format: number]: { loaded: boolean; load?: Function } } = {};

deps[MakerJsPlaygroundExport.ExportFormat.Dxf] = { loaded: true };
deps[MakerJsPlaygroundExport.ExportFormat.Json] = { loaded: true };
deps[MakerJsPlaygroundExport.ExportFormat.OpenJsCad] = { loaded: true };
deps[MakerJsPlaygroundExport.ExportFormat.Svg] = { loaded: true };

deps[MakerJsPlaygroundExport.ExportFormat.Stl] = {
    loaded: false,
    load: function () {

        importScripts(
            '../../external/OpenJsCad/csg.js',
            '../../external/OpenJsCad/formats.js'
        );

        CSG.Path2D.prototype['appendArc2'] = CSG.Path2D.prototype.appendArc;
        CSG.Path2D.prototype.appendArc = function (endpoint: CSG.Vector2D, options: CSG.IEllpiticalArcOptions): CSG.Path2D {
            unionIndex++;
            incrementUnion();
            return this['appendArc2'](endpoint, options);
        };

        CSG.Path2D.prototype['appendPoint2'] = CSG.Path2D.prototype.appendPoint;
        CSG.Path2D.prototype.appendPoint = function (point: CSG.Vector2D): CSG.Path2D {
            unionIndex++;
            incrementUnion();
            return this['appendPoint2'](point);
        };

        CAG.prototype['union2'] = CAG.prototype.union;
        CAG.prototype.union = function (cag: any): CAG {
            unionIndex++;
            incrementUnion();
            return this['union2'](cag);
        };

        CSG.Polygon.prototype['toStlString2'] = CSG.Polygon.prototype.toStlString;
        CSG.Polygon.prototype.toStlString = function (): string {
            polygonIndex++;
            incrementPolygon();
            return this['toStlString2']();
        };

        CSG.prototype['toStlString2'] = CSG.prototype.toStlString;
        CSG.prototype.toStlString = function (): string {
            polygonCount = (<CSG>this).polygons.length;
            polygonIndex = 0;
            return this['toStlString2']();
        };
    }
};

deps[MakerJsPlaygroundExport.ExportFormat.Pdf] = {
    loaded: false,
    load: function () {
        importScripts(
            '../../external/text-encoding/encoding-indexes.js',
            '../../external/text-encoding/encoding.js',
            '../../external/PDFKit/pdfkit.js',
            'string-reader.js'
        );
    }

    //TODO: instrument stringreader for PDF percentage ouput
};

interface IExporter {
    (modelToExport: MakerJs.IModel, ...params: any[]);
}

function getExporter(format: MakerJsPlaygroundExport.ExportFormat, result: MakerJsPlaygroundExport.IExportResponse): Function {

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
            function toStl(model: MakerJs.IModel) {

                var options: MakerJs.exporter.IOpenJsCadOptions = {};
                var script = makerjs.exporter.toOpenJsCad(model, options);
                script += 'return ' + options.functionName + '();';

                unionCount = (script.match(/union/g) || []).length
                    + (script.match(/appendArc/g) || []).length
                    + (script.match(/appendPoint/g) || []).length;
                unionIndex = 0;

                var f = new Function(script);
                var csg = <CSG>f();

                return csg.toStlString();
            }
            return toStl;

        case f.Pdf:
            function toPdf(model: MakerJs.IModel) {

                function complete(pdfDataString: string) {
                    result.text = pdfDataString;
                    result.percentComplete = 100;
                    postMessage(result);
                }

                //TODO: title, author from options
                var pdfOptions: PDFKit.PDFDocumentOptions = {
                    compress: false,
                    info: {
                        Producer: 'MakerJs',
                        Author: 'MakerJs'
                    }
                };
                var doc: PDFKit.PDFDocument = new PDFDocument(pdfOptions);
                var reader = new StringReader(complete);
                var stream = doc.pipe(reader);

                //TODO: break up model across pages

                //one inch margin
                var exportOptions: MakerJs.exporter.IPDFRenderOptions = {
                    origin: [72, 72]
                };

                makerjs.exporter.toPDF(doc, model, exportOptions);

                doc.end();
            }
            return toPdf;
    }
}

/* events */

onmessage = (ev: MessageEvent) => {

    var request = ev.data as MakerJsPlaygroundExport.IExportRequest;

    var result: MakerJsPlaygroundExport.IExportResponse = {
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
        }

        //call the exporter function.
        result.text = exporter(request.model);
        result.percentComplete = 100;
        postMessage(result);

    }

}
