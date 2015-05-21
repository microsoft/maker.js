module Maker.Exports {

    export function DXF(model: IMakerModel, options?: IDXFRenderOptions): string;
    export function DXF(paths: IMakerPath[], options?: IDXFRenderOptions): string;
    export function DXF(path: IMakerPath, options?: IDXFRenderOptions): string;
    export function DXF(itemToExport: any, options?: IDXFRenderOptions): string {

        //DXF format documentation:
        //http://images.autodesk.com/adsk/files/acad_dxf0.pdf

        var opts: IDXFRenderOptions = {
            units: UnitType.Millimeter
        };

        ExtendObject(opts, options);

        var dxf: string[] = [];

        function append(value) {
            dxf.push(value);
        }

        var map: IMakerPathOriginFunctionMap = {};

        map[Maker.PathType.Line] = function (line: IMakerPathLine, origin: IMakerPoint) {
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

        map[Maker.PathType.Circle] = function (circle: IMakerPathCircle, origin: IMakerPoint) {
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

        map[Maker.PathType.Arc] = function (arc: IMakerPathArc, origin: IMakerPoint) {
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
            append("2");
            append("HEADER");

            append("9");
            append("$INSUNITS");
            append("70");
            append(dxfUnit[opts.units]);
        }

        function entities() {
            append("2");
            append("ENTITIES");

            var exporter = new Exporter(map);
            exporter.exportItem(itemToExport, Point.Zero());
        }

        //begin dxf output

        section(header);
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
    dxfUnit[UnitType.Inch] = 1;
    dxfUnit[UnitType.Foot] = 2;
    dxfUnit[UnitType.Millimeter] = 4;
    dxfUnit[UnitType.Centimeter] = 5;
    dxfUnit[UnitType.Meter] = 6;

    export interface IDXFRenderOptions {
        units: string;
    }

}
