namespace MakerJs.exporter {

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
    export function toDXF(itemToExport: any, options: IDXFRenderOptions = {}): string {

        //DXF format documentation:
        //http://images.autodesk.com/adsk/files/acad_dxf0.pdf

        var opts: IDXFRenderOptions = {};
        var layerIds: string[] = [];
        var dxf: { [index: string]: (string | number)[] } = { "top": [], "bottom": [] };
        var dxfIndex = "top";
        function append(value: string | number) {
            dxf[dxfIndex].push(value);
        }

        extendObject(opts, options);

        if (isModel(itemToExport)) {
            var modelToExport = itemToExport as IModel;
            if (modelToExport.exporterOptions) {
                extendObject(opts, modelToExport.exporterOptions['toDXF']);
            }
        }

        function colorLayerOptions(layer: string): IDXFLayerOptions {
            if (opts.layerOptions && opts.layerOptions[layer]) return opts.layerOptions[layer];

            if (layer in colors) {
                return {
                    color: colors[layer]
                };
            }
        }

        function defaultLayer(pathContext: IPath, parentLayer: string) {
            var layerId = pathContext.layer || parentLayer || '0';
            if (layerIds.indexOf(layerId) < 0) {
                layerIds.push(layerId);
            }
            return layerId;
        }

        var map: { [type: string]: (id: string, pathValue: IPath, offset: IPoint, layer: string) => void; } = {};

        map[pathType.Line] = function (id: string, line: IPathLine, offset: IPoint, layer: string) {
            append("0");
            append("LINE");
            append("8");
            append(defaultLayer(line, layer));
            append("10");
            append(line.origin[0] + offset[0]);
            append("20");
            append(line.origin[1] + offset[1]);
            append("11");
            append(line.end[0] + offset[0]);
            append("21");
            append(line.end[1] + offset[1]);
        };

        map[pathType.Circle] = function (id: string, circle: IPathCircle, offset: IPoint, layer: string) {
            append("0");
            append("CIRCLE");
            append("8");
            append(defaultLayer(circle, layer));
            append("10");
            append(circle.origin[0] + offset[0]);
            append("20");
            append(circle.origin[1] + offset[1]);
            append("40");
            append(circle.radius);
        };

        map[pathType.Arc] = function (id: string, arc: IPathArc, offset: IPoint, layer: string) {
            append("0");
            append("ARC");
            append("8");
            append(defaultLayer(arc, layer));
            append("10");
            append(arc.origin[0] + offset[0]);
            append("20");
            append(arc.origin[1] + offset[1]);
            append("40");
            append(arc.radius);
            append("50");
            append(arc.startAngle);
            append("51");
            append(arc.endAngle);
        };

        //TODO - handle scenario if any bezier seeds get passed
        //map[pathType.BezierSeed]

        function section(sectionFn: () => void) {
            append("0");
            append("SECTION");

            sectionFn();

            append("0");
            append("ENDSEC");
        }

        function tables(tableFn: () => void) {
            append("2");
            append("TABLES");
            append("0");
            append("TABLE");

            tableFn();

            append("0");
            append("ENDTAB");
        }

        function layerOut(layerId: string, layerColor: number) {
            append("0");
            append("LAYER");
            append("2");
            append(layerId);
            append("70");
            append("0");
            append("62");
            append(layerColor);
            append("6");
            append("CONTINUOUS");
        }

        function layersOut() {
            append("2");
            append("LAYER");

            layerIds.forEach(layerId => {
                var layerOptions = colorLayerOptions(layerId);
                if (layerOptions) {
                    layerOut(layerId, layerOptions.color);
                }
            });
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

            var walkOptions: IWalkOptions = {
                onPath: (walkedPath: IWalkPath) => {
                    var fn = map[walkedPath.pathContext.type];
                    if (fn) {
                        fn(walkedPath.pathId, walkedPath.pathContext, walkedPath.offset, walkedPath.layer);
                    }
                }
            };

            model.walk(modelToExport, walkOptions);
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

        dxfIndex = "bottom";
        section(entities);

        dxfIndex = "top";
        section(() => tables(layersOut));

        dxfIndex = "bottom";
        append("0");
        append("EOF");

        return dxf["top"].concat(dxf["bottom"]).join('\n');
    }

    /**
     * @private
     */
    var dxfUnit: { [unitType: string]: number } = {};

    //DXF format documentation:
    //http://images.autodesk.com/adsk/files/acad_dxf0.pdf
    //Default drawing units for AutoCAD DesignCenter blocks:
    //0 = Unitless; 1 = Inches; 2 = Feet; 3 = Miles; 4 = Millimeters; 5 = Centimeters; 6 = Meters; 7 = Kilometers; 8 = Microinches;

    dxfUnit[''] = 0;
    dxfUnit[unitType.Inch] = 1;
    dxfUnit[unitType.Foot] = 2;
    dxfUnit[unitType.Millimeter] = 4;
    dxfUnit[unitType.Centimeter] = 5;
    dxfUnit[unitType.Meter] = 6;

    /**
     * DXF layer options.
     */
    export interface IDXFLayerOptions {

        /**
         * DXF layer color.
         */
        color: number
    }

    /**
     * DXF rendering options.
     */
    export interface IDXFRenderOptions extends IExportOptions {

        /**
         * DXF options per layer.
         */
        layerOptions?: { [layerId: string]: IDXFLayerOptions };
    }

}
