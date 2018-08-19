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
            var layerId = (pathContext && pathContext.layer) || parentLayer || '0';
            if (layerIds.indexOf(layerId) < 0) {
                layerIds.push(layerId);
            }
            return layerId;
        }

        var map: { [type: string]: (pathValue: IPath, offset: IPoint, layer: string) => void; } = {};

        map[pathType.Line] = function (line: IPathLine, offset: IPoint, layer: string) {
            append("0");
            append("LINE");
            append("8");
            append(defaultLayer(line, layer));
            append("10");
            append(round(line.origin[0] + offset[0], opts.accuracy));
            append("20");
            append(round(line.origin[1] + offset[1], opts.accuracy));
            append("11");
            append(round(line.end[0] + offset[0], opts.accuracy));
            append("21");
            append(round(line.end[1] + offset[1], opts.accuracy));
        };

        map[pathType.Circle] = function (circle: IPathCircle, offset: IPoint, layer: string) {
            append("0");
            append("CIRCLE");
            append("8");
            append(defaultLayer(circle, layer));
            append("10");
            append(round(circle.origin[0] + offset[0], opts.accuracy));
            append("20");
            append(round(circle.origin[1] + offset[1], opts.accuracy));
            append("40");
            append(round(circle.radius, opts.accuracy));
        };

        map[pathType.Arc] = function (arc: IPathArc, offset: IPoint, layer: string) {
            append("0");
            append("ARC");
            append("8");
            append(defaultLayer(arc, layer));
            append("10");
            append(round(arc.origin[0] + offset[0], opts.accuracy));
            append("20");
            append(round(arc.origin[1] + offset[1], opts.accuracy));
            append("40");
            append(round(arc.radius, opts.accuracy));
            append("50");
            append(round(arc.startAngle, opts.accuracy));
            append("51");
            append(round(arc.endAngle, opts.accuracy));
        };

        //TODO - handle scenario if any bezier seeds get passed
        //map[pathType.BezierSeed]

        function appendVertex(v: IPoint, layer: string, bulge?: number) {
            append("0");
            append("VERTEX");
            append("8");
            append(defaultLayer(null, layer));
            append("10");
            append(round(v[0], opts.accuracy));
            append("20");
            append(round(v[1], opts.accuracy));
            append("30");
            append(0);

            if (bulge !== undefined) {
                append("42");
                append(bulge);
            }
        }

        function polyline(c: IChainOnLayer) {
            append("0");
            append("POLYLINE");
            append("8");
            append(defaultLayer(null, c.layer));
            append("10");
            append(0);
            append("20");
            append(0);
            append("30");
            append(0);
            append("70");
            append(c.chain.endless ? 1 : 0);

            c.chain.links.forEach((link, i) => {
                let bulge: number;
                if (link.walkedPath.pathContext.type === pathType.Arc) {
                    const arc = link.walkedPath.pathContext as IPathArc;
                    bulge = round(Math.tan(angle.toRadians(angle.ofArcSpan(arc)) / 4), opts.accuracy);
                    if (link.reversed) {
                        bulge *= -1;
                    }
                }
                const vertex = link.endPoints[link.reversed ? 1 : 0];
                appendVertex(vertex, c.layer, bulge);
            });

            if (!c.chain.endless) {
                const lastLink = c.chain.links[c.chain.links.length - 1];
                const endPoint = lastLink.endPoints[lastLink.reversed ? 0 : 1];
                appendVertex(endPoint, c.layer);
            }

            append("0");
            append("SEQEND");
        }

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
            append("2");
            append("HEADER");

            if (opts.units) {
                var units = dxfUnit[opts.units];
                append("9");
                append("$INSUNITS");
                append("70");
                append(units);
            }
        }

        function entities(walkedPaths: IWalkPath[], chains: IChainOnLayer[]) {
            append("2");
            append("ENTITIES");

            chains.forEach(c => polyline(c))
            walkedPaths.forEach((walkedPath: IWalkPath) => {
                var fn = map[walkedPath.pathContext.type];
                if (fn) {
                    fn(walkedPath.pathContext, walkedPath.offset, walkedPath.layer);
                }
            });
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

        dxfIndex = "bottom";
        section(() => {
            const chainsOnLayers: IChainOnLayer[] = [];
            const walkedPaths: IWalkPath[] = [];
            if (opts.usePOLYLINE) {
                const cb: IChainCallback = function (chains: IChain[], loose: IWalkPath[], layer: string) {
                    chains.forEach(c => {
                        if (c.endless && c.links.length === 1 && c.links[0].walkedPath.pathContext.type === pathType.Circle) {
                            //don't treat circles as lwpolylines
                            walkedPaths.push(c.links[0].walkedPath);
                            return;
                        }
                        const chainOnLayer: IChainOnLayer = { chain: c, layer };
                        chainsOnLayers.push(chainOnLayer);
                    });
                    walkedPaths.push.apply(walkedPaths, loose);
                }
                model.findChains(modelToExport, cb, { byLayers: true, pointMatchingDistance: opts.pointMatchingDistance });
            } else {
                var walkOptions: IWalkOptions = {
                    onPath: (walkedPath: IWalkPath) => {
                        walkedPaths.push(walkedPath);
                    }
                };
                model.walk(modelToExport, walkOptions);
            }
            entities(walkedPaths, chainsOnLayers);
        });

        dxfIndex = "top";
        section(header);
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
    export interface IDXFRenderOptions extends IExportOptions, IPointMatchOptions {

        /**
         * DXF options per layer.
         */
        layerOptions?: { [layerId: string]: IDXFLayerOptions };

        /**
         * Flag to use POLYLINE
         */
        usePOLYLINE?: boolean;
    }

    /**
     * @private
     */
    interface IChainOnLayer {
        chain: IChain;
        layer: string;
    }
}
