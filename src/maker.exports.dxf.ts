module Maker.Exports {

    export function DXF(model: IMakerModel, options?: IDXFRenderOptions): string;
    export function DXF(paths: IMakerPath[], options?: IDXFRenderOptions): string;
    export function DXF(path: IMakerPath, options?: IDXFRenderOptions): string;
    export function DXF(item: any, options?: IDXFRenderOptions): string {

        //DXF format documentation:
        //http://images.autodesk.com/adsk/files/acad_dxf0.pdf

        options = options || {
            units: DXFUnitType.Millimeters
        };

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

        function exportPath(path: IMakerPath, origin: IMakerPoint) {
            var fn = map[path.type];
            if (fn) {
                fn(path, origin);
            }
        }

        function exportPaths(paths: IMakerPath[], origin: IMakerPoint) {
            for (var i = 0; i < paths.length; i++) {
                exportPath(paths[i], origin);
            }
        }

        function exportModel(model: IMakerModel, origin: IMakerPoint) {

            var newOrigin = Point.Add(model.origin, origin);

            if (model.paths) {
                exportPaths(model.paths, newOrigin);
            }

            if (model.models) {
                for (var i = 0; i < model.models.length; i++) {
                    exportModel(model.models[i], newOrigin);
                }
            }
        }

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
            append(options.units);
        }

        function entities() {
            append("2");
            append("ENTITIES");

            var origin = Point.Zero();

            if (IsModel(item)) {
                exportModel(<IMakerModel>item, origin);
            } else if (IsArray(item)) {
                exportPaths(<IMakerPath[]>item, origin);
            } else if (IsPath(item)) {
                exportPath(<IMakerPath>item, origin);
            }
        }

        section(header);
        section(entities);

        append("0");
        append("EOF");

        return dxf.join('\n');
    }

    export interface IDXFRenderOptions {
        units: DXFUnitType;
    }

}
