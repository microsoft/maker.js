
//this is here for compilation in a web worker
interface CanvasRenderingContext2D {
}

// dependency libraries
let PDFDocument: PDFKit.PDFDocument;

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

var deps: { [format: number]: boolean } = {};

deps[MakerJsPlaygroundExport.ExportFormat.Dxf] = true;
deps[MakerJsPlaygroundExport.ExportFormat.Json] = true;
deps[MakerJsPlaygroundExport.ExportFormat.OpenJsCad] = true;
deps[MakerJsPlaygroundExport.ExportFormat.Svg] = true;
deps[MakerJsPlaygroundExport.ExportFormat.Stl] = false;
deps[MakerJsPlaygroundExport.ExportFormat.Pdf] = false;

interface IExporter {
    (modelToExport: MakerJs.IModel | any, options?: MakerJs.exporter.IExportOptions | any): any;
}

function getExporter(format: MakerJsPlaygroundExport.ExportFormat, result: MakerJsPlaygroundExport.IExportResponse): IExporter {

    var f = MakerJsPlaygroundExport.ExportFormat;

    switch (format) {
        case f.Json:
            function toJson(model: MakerJs.IModel, options: MakerJs.exporter.IJsonExportOptions) {
                function replacer(key: string, value: any) {
                    if (makerjs.isNumber(value)) {
                        const newValue = makerjs.round(value, options.accuracy);
                        return newValue
                    }
                    if (makerjs.isPoint(value)) {
                        const newPoint = makerjs.point.rounded(value, options.accuracy);
                        return newPoint;
                    }
                    return value;
                }
                return JSON.stringify(model, options.accuracy && replacer, options.indentation);
            }
            return toJson;

        case f.Dxf:
            function toDXF(model: MakerJs.IModel, options: MakerJs.exporter.IDXFRenderOptions) {
                if (!options.units) {
                    options.units = model.units || makerjs.unitType.Millimeter;
                }
                return makerjs.exporter.toDXF(model, options);
            }
            return toDXF;

        case f.Svg:
            return makerjs.exporter.toSVG;

        case f.OpenJsCad:
            return makerjs.exporter.toOpenJsCad;

        case f.Stl:
            function toStl(model: MakerJs.IModel, inputOptions: MakerJs.exporter.IOpenJsCadOptions) {

                if (!deps[MakerJsPlaygroundExport.ExportFormat.Stl]) {
                    importScripts(
                        '../../external/jscad/csg.js',
                        '../../external/jscad/stl-serializer.js'
                    );
                    deps[MakerJsPlaygroundExport.ExportFormat.Stl] = true;
                }

                //make sure size is in mm for STL
                model = makerjs.model.convertUnits(model, makerjs.unitType.Millimeter);

                const defaultOptions: MakerJs.exporter.IOpenJsCadOptions = {
                    extrusion: 1
                    //TODO guesstimate a facet size
                };
                const options: MakerJs.exporter.IOpenJsCadOptions = makerjs.extendObject(defaultOptions, inputOptions);

                const { CAG, CSG }: { CAG: typeof jscad.CAG, CSG: typeof jscad.CSG } = require('@jscad/csg');
                const stlSerializer: jscad.StlSerializer = require('@jscad/stl-serializer');

                function makePhasedCallback(phaseStart: number, phaseSpan: number) {
                    return function statusCallback(status) {
                        result.percentComplete = phaseStart + status.progress * phaseSpan / 100;
                        postMessage(result);
                    }
                }

                const cag = makerjs.exporter.toJscadCAG(CAG, model, options.facetSize, { statusCallback: makePhasedCallback(0, 33) });

                //next phase: extrude to csg
                const csg = cag.extrude({ offset: [0, 0, options.extrusion] })

                result.percentComplete = 66;   //3 phases of this export
                postMessage(result);

                //next phase: serialize
                return stlSerializer.serialize(csg, { binary: false, statusCallback: makePhasedCallback(67, 33) });
            }
            return toStl;

        case f.Pdf:
            function toPdf(model: MakerJs.IModel, options: MakerJs.exporter.IExportOptions) {

                if (!deps[MakerJsPlaygroundExport.ExportFormat.Pdf]) {
                    importScripts(
                        '../../external/text-encoding/encoding-indexes.js',
                        '../../external/text-encoding/encoding.js',
                        '../../external/PDFKit/pdfkit.js',
                        'string-reader.js'
                    );
                    deps[MakerJsPlaygroundExport.ExportFormat.Pdf] = true;
                }

                function complete(pdfDataString: string) {
                    result.text = pdfDataString;
                    result.percentComplete = 100;
                    postMessage(result);
                }

                //TODO: watermark
                //TODO: title, author, grid from options
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
        error: null,
        text: null,
        percentComplete: 0
    };

    var exporter = getExporter(request.format, result);
    if (exporter) {

        //call the exporter function.
        try {
            result.text = exporter(request.model, request.options);
        } catch (e) {
            result.error = '' + e;
        }
        result.percentComplete = 100;
        postMessage(result);

    }

}
