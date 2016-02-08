/// <reference path="../../typings/lib.webworker.d.ts" />
/// <reference path="../export-format.ts" />

/* module system */

var module = this as NodeModule;

module.require = (id: string): any => {

    if (id in module) {
        return module[id];
    }
    
    return this;
};

importScripts(
    "../../external/OpenJsCad/csg.js", 
    "../../external/OpenJsCad/formats.js", 
    "../../target/js/browser.maker.js", 
    "../export-format.js");

var makerjs: typeof MakerJs = require('makerjs');

var unionCount = 0;
var unionIndex = 0;
var polygonCount = 0;
var polygonIndex = 0;

var incrementUnion: Function;
var incrementPolygon: Function;

CSG.Path2D.prototype['appendArc2'] = CSG.Path2D.prototype.appendArc;
CSG.Path2D.prototype.appendArc = function(endpoint: CSG.Vector2D, options: CSG.IEllpiticalArcOptions): CSG.Path2D {
    unionIndex++;
    incrementUnion();
    return this['appendArc2'](endpoint, options);
};

CSG.Path2D.prototype['appendPoint2'] = CSG.Path2D.prototype.appendPoint;
CSG.Path2D.prototype.appendPoint = function(point: CSG.Vector2D): CSG.Path2D {
    unionIndex++;
    incrementUnion();
    return this['appendPoint2'](point);
};

CAG.prototype['union2'] = CAG.prototype.union;
CAG.prototype.union = function(cag: any): CAG {
    unionIndex++;
    incrementUnion();    
    return this['union2'](cag);
};

CSG.Polygon.prototype['toStlString2'] = CSG.Polygon.prototype.toStlString;
CSG.Polygon.prototype.toStlString = function(): string {
    polygonIndex++;
    incrementPolygon();    
    return this['toStlString2']();
};

CSG.prototype['toStlString2'] = CSG.prototype.toStlString;
CSG.prototype.toStlString = function(): string {
    polygonCount = (<CSG>this).polygons.length;
    polygonIndex = 0;
    return this['toStlString2']();
};

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
            return toStl;
    }
}

/* events */

onmessage = (ev: MessageEvent) => {
    
    var request = ev.data as MakerJsPlaygroundExport.IExportRequest;

    var exporter = getExporter(request.format);
    if (exporter) {

        var result: MakerJsPlaygroundExport.IExportResponse = {
            request: request,
            text: null,
            percentComplete: 0
        };

        incrementUnion = function() {
            result.percentComplete = 50 * unionIndex / unionCount;
            postMessage(result);
        };
        
        incrementPolygon = function() {
            result.percentComplete = 50 + 50 * polygonIndex / polygonCount;
            postMessage(result);
        }

        //call the exporter function.
        result.text = exporter(request.model);
        result.percentComplete = 100;
        postMessage(result);
                
    }
    
}
