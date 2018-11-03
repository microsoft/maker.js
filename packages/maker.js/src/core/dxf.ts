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

        var opts: IDXFRenderOptions = {
            fontSize: 9
        };
        var layerIds: string[] = [];

        const doc: DxfParser.DXFDocument = {
            entities: [],
            header: {},
            tables: {}
        };

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

        var map: { [type: string]: (pathValue: IPath, offset: IPoint, layer: string) => DxfParser.Entity; } = {};

        map[pathType.Line] = function (line: IPathLine, offset: IPoint, layer: string) {
            const lineEntity: DxfParser.EntityLINE = {
                type: "LINE",
                layer: defaultLayer(line, layer),
                vertices: [
                    {
                        x: round(line.origin[0] + offset[0], opts.accuracy),
                        y: round(line.origin[1] + offset[1], opts.accuracy)
                    },
                    {
                        x: round(line.end[0] + offset[0], opts.accuracy),
                        y: round(line.end[1] + offset[1], opts.accuracy)
                    }
                ]
            };
            return lineEntity;
        };

        map[pathType.Circle] = function (circle: IPathCircle, offset: IPoint, layer: string) {
            const circleEntity: DxfParser.EntityCIRCLE = {
                type: "CIRCLE",
                layer: defaultLayer(circle, layer),
                center: {
                    x: round(circle.origin[0] + offset[0], opts.accuracy),
                    y: round(circle.origin[1] + offset[1], opts.accuracy),
                },
                radius: round(circle.radius, opts.accuracy)
            };
            return circleEntity;
        };

        map[pathType.Arc] = function (arc: IPathArc, offset: IPoint, layer: string) {
            const arcEntity: DxfParser.EntityARC = {
                type: "ARC",
                layer: defaultLayer(arc, layer),
                center: {
                    x: round(arc.origin[0] + offset[0], opts.accuracy),
                    y: round(arc.origin[1] + offset[1], opts.accuracy)
                },
                radius: round(arc.radius, opts.accuracy),
                startAngle: round(arc.startAngle, opts.accuracy),
                endAngle: round(arc.endAngle, opts.accuracy)
            };
            return arcEntity;
        };

        //TODO - handle scenario if any bezier seeds get passed
        //map[pathType.BezierSeed]

        function appendVertex(v: IPoint, layer: string, bulge?: number) {
            const vertex: DxfParser.EntityVERTEX = {
                type: "VERTEX",
                layer: defaultLayer(null, layer),
                x: round(v[0], opts.accuracy),
                y: round(v[1], opts.accuracy),
                bulge
            };
            return vertex;
        }

        function polyline(c: IChainOnLayer) {
            const polylineEntity: DxfParser.EntityPOLYLINE = {
                type: "POLYLINE",
                layer: defaultLayer(null, c.layer),
                shape: c.chain.endless,
                vertices: []
            };

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
                polylineEntity.vertices.push(appendVertex(vertex, c.layer, bulge));
            });

            if (!c.chain.endless) {
                const lastLink = c.chain.links[c.chain.links.length - 1];
                const endPoint = lastLink.endPoints[lastLink.reversed ? 0 : 1];
                polylineEntity.vertices.push(appendVertex(endPoint, c.layer));
            }

            return polylineEntity;
        }

        function mtext(caption: ICaption) {
            const center = point.middle(caption.anchor);
            const mtextEntity: DxfParser.EntityMTEXT = {
                type: "MTEXT",
                position: {
                    x: round(center[0], opts.accuracy),
                    y: round(center[1], opts.accuracy)
                },
                height: opts.fontSize,
                text: caption.text,
                attachmentPoint: 5, //5 = Middle center
                drawingDirection: 1, //1 = Left to right
                rotation: angle.ofPointInRadians(caption.anchor.origin, caption.anchor.end)
            };
            return mtextEntity;
        }

        function layerOut(layerId: string, layerColor: number) {
            const layerEntity: DxfParser.Layer = {
                name: layerId,
                color: layerColor
            };
            return layerEntity;
        }

        function layersOut() {
            const layerTable: DxfParser.TableLAYER = {
                layers: {}
            }
            layerIds.forEach(layerId => {
                var layerOptions = colorLayerOptions(layerId);
                if (layerOptions) {
                    layerTable.layers[layerId] = layerOut(layerId, layerOptions.color);
                }
            });
            const tableName: DxfParser.TableNames = 'layer';
            doc.tables[tableName] = layerTable;
        }

        function header() {
            if (opts.units) {
                var units = dxfUnit[opts.units];
                doc.header["$INSUNITS"] = units;
            }
        }

        function entities(walkedPaths: IWalkPath[], chains: IChainOnLayer[], captions: ICaption[]) {
            const entityArray = doc.entities;

            entityArray.push.apply(entityArray, chains.map(polyline));
            walkedPaths.forEach((walkedPath: IWalkPath) => {
                var fn = map[walkedPath.pathContext.type];
                if (fn) {
                    const entity = fn(walkedPath.pathContext, walkedPath.offset, walkedPath.layer);
                    entityArray.push.apply(entityArray, entity);
                }
            });
            entityArray.push.apply(entityArray, captions.map(mtext));
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
        entities(walkedPaths, chainsOnLayers, model.getAllCaptionsOffset(modelToExport));

        header();

        layersOut();

        return outputDocument(doc);
    }

    /**
     * @private
     */
    function outputDocument(doc: DxfParser.DXFDocument) {

        const dxf: (string | number)[] = [];
        function append(value: string | number) {
            dxf.push(value);
        }

        var map: { [entityType: string]: (entity: DxfParser.Entity) => void; } = {};

        map["LINE"] = function (line: DxfParser.EntityLINE) {
            append("0");
            append("LINE");
            append("8");
            append(line.layer);
            append("10");
            append(line.vertices[0].x);
            append("20");
            append(line.vertices[0].y);
            append("11");
            append(line.vertices[1].x);
            append("21");
            append(line.vertices[1].y);
        };

        map["CIRCLE"] = function (circle: DxfParser.EntityCIRCLE) {
            append("0");
            append("CIRCLE");
            append("8");
            append(circle.layer);
            append("10");
            append(circle.center.x);
            append("20");
            append(circle.center.y);
            append("40");
            append(circle.radius);
        };

        map["ARC"] = function (arc: DxfParser.EntityARC) {
            append("0");
            append("ARC");
            append("8");
            append(arc.layer);
            append("10");
            append(arc.center.x);
            append("20");
            append(arc.center.y);
            append("40");
            append(arc.radius);
            append("50");
            append(arc.startAngle);
            append("51");
            append(arc.endAngle);
        };

        //TODO - handle scenario if any bezier seeds get passed
        //map[pathType.BezierSeed]

        map["VERTEX"] = function (vertex: DxfParser.EntityVERTEX) {
            append("0");
            append("VERTEX");
            append("8");
            append(vertex.layer);
            append("10");
            append(vertex.x);
            append("20");
            append(vertex.y);
            append("30");
            append(0);

            if (vertex.bulge !== undefined) {
                append("42");
                append(vertex.bulge);
            }
        }

        map["POLYLINE"] = function (polyline: DxfParser.EntityPOLYLINE) {
            append("0");
            append("POLYLINE");
            append("8");
            append(polyline.layer);
            append("10");
            append(0);
            append("20");
            append(0);
            append("30");
            append(0);
            append("70");
            append(polyline.shape ? 1 : 0);

            polyline.vertices.forEach(vertex => map["VERTEX"](vertex));

            append("0");
            append("SEQEND");
        }

        map["MTEXT"] = function (mtext: DxfParser.EntityMTEXT) {
            append("0");
            append("MTEXT");
            append("10");
            append(mtext.position.x);
            append("20");
            append(mtext.position.y);
            append("40");
            append(mtext.height);
            append("71");
            append(mtext.attachmentPoint);
            append("72");
            append(mtext.drawingDirection);
            append("1");
            append(mtext.text);  //TODO: break into 250 char chunks
            append("50");
            append(mtext.rotation);
        }

        function section(sectionFn: () => void) {
            append("0");
            append("SECTION");

            sectionFn();

            append("0");
            append("ENDSEC");
        }

        function tables() {
            append("2");
            append("TABLES");
            append("0");
            append("TABLE");

            layersOut();

            append("0");
            append("ENDTAB");
        }

        function layerOut(layer: DxfParser.Layer) {
            append("0");
            append("LAYER");
            append("2");
            append(layer.name);
            append("70");
            append("0");
            append("62");
            append(layer.color);
            append("6");
            append("CONTINUOUS");
        }

        function layersOut() {
            const layerTableName: DxfParser.TableNames = 'layer';
            const layerTable = doc.tables[layerTableName] as DxfParser.TableLAYER;

            append("2");
            append("LAYER");

            for (let layerId in layerTable.layers) {
                let layer = layerTable.layers[layerId];
                layerOut(layer);
            }
        }

        function header() {
            append("2");
            append("HEADER");

            for (let key in doc.header) {
                let value = doc.header[key];
                append("9");
                append(key);
                append("70");
                append(value);
            }
        }

        function entities(entityArray: DxfParser.Entity[]) {
            append("2");
            append("ENTITIES");

            entityArray.forEach(entity => {
                const fn = map[entity.type];
                if (fn) {
                    fn(entity);
                }
            });
        }

        //begin dxf output

        section(header);
        section(() => tables());
        section(() => entities(doc.entities));

        append("0");
        append("EOF");

        return dxf.join('\n');
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
         * Text size for MTEXT entities.
         */
        fontSize?: number;

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
