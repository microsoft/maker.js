/// <reference path="../typings/lib.webworker.d.ts" />
/// <reference path="export-format.ts" />

/* module system */

var module = this as NodeModule;

module.require = (id: string): any => {

    if (id in module) {
        return module[id];
    }
        
    return this;
};

importScripts(
    "../external/OpenJsCad/csg.js", 
    "../external/OpenJsCad/formats.js", 
    "../target/js/node.maker.js", 
    "export-format.js");

var makerjs = module['MakerJs'];

function getExporter(format: MakerJsPlaygroundExport.ExportFormat): Function {

    var f = MakerJsPlaygroundExport.ExportFormat;

    switch(format) {
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

onmessage = (ev: MessageEvent) => {
    
    var request = ev.data as MakerJsPlaygroundExport.IExportRequest;

    var exporter = getExporter(request.format);
    if (exporter) {

        //call the exporter function.
        var text = exporter(request.model);
        
        var result: MakerJsPlaygroundExport.IExportResponse = {
            request: request,
            text: text,
            percentComplete: 100
        };
        
        postMessage(result);
    }
    
    console.log("worker:" + request.format + request.model);
    
}
