/// <reference path="exporter.ts" />

module Maker.exporter {

    export function toDXF(modelToExport: IModel, options?: IDXFRenderOptions): string;
    export function toDXF(pathsToExport: IPath[], options?: IDXFRenderOptions): string;
    export function toDXF(pathToExport: IPath, options?: IDXFRenderOptions): string;

    /**
     * Renders an item in AutoDesk DFX file format.
     * 
     * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
     * @param options Rendering options object.
     * @param options.units String of the unit system. May be omitted. See makerjs.unitType for possible values.
     * @returns String of DXF content.
     */
    export function toDXF(itemToExport: any, options?: IDXFRenderOptions): string {

        //DXF format documentation:
        //http://images.autodesk.com/adsk/files/acad_dxf0.pdf

        var opts: IDXFRenderOptions = {};

        extendObject(opts, options);

        var dxf: string[] = [];

        function append(value) {
            dxf.push(value);
        }

        var map: IPathOriginFunctionMap = {};

        map[pathType.Line] = function (line: IPathLine, origin: IPoint) {
            append("0");
            append("LINE");
            append("8");
            append(line.id);
            append("10");
            append(line.origin.x + origin.x);
            append("20");
            append(line.origin.y + origin.y);
            append("11");
            append(line.end.x + origin.x);
            append("21");
            append(line.end.y + origin.y);
        };

        map[pathType.Circle] = function (circle: IPathCircle, origin: IPoint) {
            append("0");
            append("CIRCLE");
            append("8");
            append(circle.id);
            append("10");
            append(circle.origin.x + origin.x);
            append("20");
            append(circle.origin.y + origin.y);
            append("40");
            append(circle.radius);
        };

        map[pathType.Arc] = function (arc: IPathArc, origin: IPoint) {
            append("0");
            append("ARC");
            append("8");
            append(arc.id);
            append("10");
            append(arc.origin.x + origin.x);
            append("20");
            append(arc.origin.y + origin.y);
            append("40");
            append(arc.radius);
            append("50");
            append(arc.startAngle);
            append("51");
            append(arc.endAngle);
        };

        function section(sectionFn: () => void) {
            append("0");
            append("SECTION");

            sectionFn();

            append("0");
            append("ENDSEC");
        }

        function header() {
            var units = dxfUnit[opts.units];

            append("2");
            append("HEADER");

            append("9");
            append("$INSUNITS");
            append("70");
            append(units);
        }

        function entities() {
            append("2");
            append("ENTITIES");

            var exporter = new Exporter(map);
            exporter.exportItem(itemToExport, point.zero());
        }

        //fixup options

        if (!opts.units) {
            var units = tryGetModelUnits(itemToExport);
            if (units) {
                opts.units = units;
            }
        }

        //also pass back to options parameter
        extendObject(options, opts);

        //begin dxf output

        if (opts.units) {
            section(header);
        }

        section(entities);

        append("0");
        append("EOF");

        return dxf.join('\n');
    }

    //DXF format documentation:
    //http://images.autodesk.com/adsk/files/acad_dxf0.pdf
    //Default drawing units for AutoCAD DesignCenter blocks:
    //0 = Unitless; 1 = Inches; 2 = Feet; 3 = Miles; 4 = Millimeters; 5 = Centimeters; 6 = Meters; 7 = Kilometers; 8 = Microinches;
    var dxfUnit: { [unitType: string]: number } = {};
    dxfUnit[''] = 0;
    dxfUnit[unitType.Inch] = 1;
    dxfUnit[unitType.Foot] = 2;
    dxfUnit[unitType.Millimeter] = 4;
    dxfUnit[unitType.Centimeter] = 5;
    dxfUnit[unitType.Meter] = 6;

    /**
     * DXF rendering options.
     */
    export interface IDXFRenderOptions extends IExportOptions {
    }

}
