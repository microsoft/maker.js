namespace MakerJs.exporter {

    /**
     * @private
     */
    interface IPathDataMap {
        [layer: string]: string[];
    }

    /**
     * @private
     */
    interface ISvgPathData extends Array<any> { }

    /**
     * @private
     */
    interface IChainLinkToPathDataMap {
        [pathType: string]: (pathContext: IPath, endPoint: IPoint, reversed: boolean, d: ISvgPathData) => void;
    }

    /**
     * @private
     */
    var chainLinkToPathDataMap: IChainLinkToPathDataMap = {};

    chainLinkToPathDataMap[pathType.Arc] = function (arc: IPathArc, endPoint: IPoint, reversed: boolean, d: ISvgPathData) {
        d.push('A');
        svgArcData(
            d,
            arc.radius,
            endPoint,
            angle.ofArcSpan(arc) > 180,
            reversed ? (arc.startAngle > arc.endAngle) : (arc.startAngle < arc.endAngle)
        );
    };

    chainLinkToPathDataMap[pathType.Line] = function (line: IPathLine, endPoint: IPoint, reversed: boolean, d: ISvgPathData) {
        d.push('L', round(endPoint[0]), round(endPoint[1]));
    };

    chainLinkToPathDataMap[pathType.BezierSeed] = function (seed: IPathBezierSeed, endPoint: IPoint, reversed: boolean, d: ISvgPathData) {
        svgBezierData(d, seed, reversed);
    };

    /**
     * @private
     */
    function svgCoords(p: IPoint): IPoint {
        return point.mirror(p, false, true);
    }

    /**
     * Convert a chain to SVG path data.
     */
    export function chainToSVGPathData(chain: IChain, offset: IPoint): string {

        function offsetPoint(p: IPoint) {
            return point.add(p, offset);
        }

        var first = chain.links[0];
        var firstPoint = offsetPoint(svgCoords(first.endPoints[first.reversed ? 1 : 0]));

        var d: ISvgPathData = ['M', round(firstPoint[0]), round(firstPoint[1])];

        for (var i = 0; i < chain.links.length; i++) {
            var link = chain.links[i];
            var pathContext = link.walkedPath.pathContext;

            var fn = chainLinkToPathDataMap[pathContext.type];
            if (fn) {
                var fixedPath: IPath;
                path.moveTemporary([pathContext], [link.walkedPath.offset], function () {
                    fixedPath = path.mirror(pathContext, false, true);
                });
                path.moveRelative(fixedPath, offset);

                fn(fixedPath, offsetPoint(svgCoords(link.endPoints[link.reversed ? 0 : 1])), link.reversed, d);
            }
        }

        if (chain.endless) {
            d.push('Z');
        }

        return d.join(' ');
    }

    /**
     * @private
     */
    function startSvgPathData(start: IPoint, d: ISvgPathData): ISvgPathData {
        return ["M", round(start[0]), round(start[1])].concat(d);
    }

    /**
     * @private
     */
    interface ISvgPathDataMap {
        [pathType: string]: (pathContext: IPath) => ISvgPathData;
    }

    /**
     * @private
     */
    var svgPathDataMap: ISvgPathDataMap = {};

    svgPathDataMap[pathType.Line] = function (line: IPathLine) {
        return startSvgPathData(line.origin, point.rounded(line.end) as Array<number>);
    };

    svgPathDataMap[pathType.Circle] = function (circle: IPathCircle) {
        return startSvgPathData(circle.origin, svgCircleData(circle.radius));
    };

    svgPathDataMap[pathType.Arc] = function (arc: IPathArc) {

        var arcPoints = point.fromArc(arc);

        if (measure.isPointEqual(arcPoints[0], arcPoints[1])) {
            return svgPathDataMap[pathType.Circle](arc);
        } else {

            var r = round(arc.radius);
            var d: ISvgPathData = ['A'];
            svgArcData(
                d,
                r,
                arcPoints[1],
                angle.ofArcSpan(arc) > 180,
                arc.startAngle > arc.endAngle
            );

            return startSvgPathData(arcPoints[0], d);
        }
    };

    svgPathDataMap[pathType.BezierSeed] = function (seed: IPathBezierSeed) {
        var d: ISvgPathData = [];
        svgBezierData(d, seed);
        return startSvgPathData(seed.origin, d);
    };

    /**
     * Convert a path to SVG path data.
     */
    export function pathToSVGPathData(pathToExport: IPath, offset: IPoint, offset2: IPoint): string {
        var fn = svgPathDataMap[pathToExport.type];
        if (fn) {
            var fixedPath: IPath;
            path.moveTemporary([pathToExport], [offset], function () {
                fixedPath = path.mirror(pathToExport, false, true);
            });
            path.moveRelative(fixedPath, offset2);

            var d = fn(fixedPath);
            return d.join(' ');
        }
        return '';
    }

    /**
     * @private
     */
    function getBezierModelsWithPaths(modelToExport: IModel): IWalkModel[] {

        var beziers: IWalkModel[] = [];

        function checkIsBezierWithPaths(walkedModel: IWalkModel) {
            var b = walkedModel.childModel;
            if (b.type && b.type === models.BezierCurve.typeName && b.paths) {
                beziers.push(walkedModel);
            }
        }

        var options: IWalkOptions = {
            beforeChildWalk: function (walkedModel: IWalkModel): boolean {
                checkIsBezierWithPaths(walkedModel);
                return true;
            }
        };

        var rootModel: IWalkModel = {
            childId: '',
            childModel: modelToExport,
            layer: '',
            offset: modelToExport.origin,
            parentModel: null,
            route: [],
            routeKey: ''
        };

        checkIsBezierWithPaths(rootModel);

        model.walk(modelToExport, options);

        return beziers;
    }

    /**
     * @private
     */
    function getPathDataByLayer(modelToExport: IModel, offset: IPoint, options: IFindChainsOptions) {
        var pathDataByLayer: IPathDataMap = {};

        var beziers = getBezierModelsWithPaths(modelToExport);
        var tempKey = 'tempPaths';

        beziers.forEach(function (walkedModel: IWalkModel) {

            var b = walkedModel.childModel as models.BezierCurve;

            //use seeds as path, hide the arc paths from findChains()
            var bezierSeeds = models.BezierCurve.getBezierSeeds(b);
            if (bezierSeeds.length > 0) {
                b[tempKey] = b.paths;

                var newPaths: IPathMap = {};

                bezierSeeds.forEach(function (seed, i) {
                    newPaths['seed_' + i] = seed;
                });

                b.paths = newPaths;
            }

        });

        model.findChains(
            modelToExport,
            function (chains: IChain[], loose: IWalkPath[], layer: string) {

                function single(walkedPath: IWalkPath) {
                    var pathData = pathToSVGPathData(walkedPath.pathContext, walkedPath.offset, offset);
                    pathDataByLayer[layer].push(pathData);
                }

                pathDataByLayer[layer] = [];

                chains.map(function (chain: IChain) {
                    if (chain.links.length > 1) {
                        var pathData = chainToSVGPathData(chain, offset);
                        pathDataByLayer[layer].push(pathData);
                    } else {
                        single(chain.links[0].walkedPath);
                    }
                });

                loose.map(single);

            },
            options
        );

        //revert
        beziers.forEach(function (walkedModel: IWalkModel) {
            var b = walkedModel.childModel as models.BezierCurve;
            if (tempKey in b) {
                b.paths = b[tempKey];
                delete b[tempKey];
            }
        });

        return pathDataByLayer;
    }

    export function toSVG(modelToExport: IModel, options?: ISVGRenderOptions): string;
    export function toSVG(pathsToExport: IPath[], options?: ISVGRenderOptions): string;
    export function toSVG(pathToExport: IPath, options?: ISVGRenderOptions): string;

    /**
     * Renders an item in SVG markup.
     * 
     * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
     * @param options Rendering options object.
     * @param options.annotate Boolean to indicate that the id's of paths should be rendered as SVG text elements.
     * @param options.origin point object for the rendered reference origin.
     * @param options.scale Number to scale the SVG rendering.
     * @param options.stroke String color of the rendered paths.
     * @param options.strokeWidth String numeric width and optional units of the rendered paths.
     * @param options.units String of the unit system. May be omitted. See makerjs.unitType for possible values.
     * @param options.useSvgPathOnly Boolean to use SVG path elements instead of line, circle etc.
     * @returns String of XML / SVG content.
     */
    export function toSVG(itemToExport: any, options?: ISVGRenderOptions): string {

        function append(value: string, layer?: string, forcePush = false) {
            if (!forcePush && typeof layer == "string" && layer.length > 0) {

                if (!(layer in layers)) {
                    layers[layer] = [];
                }

                layers[layer].push(value);

            } else {
                elements.push(value);
            }
        }

        function createElement(tagname: string, attrs: IXmlTagAttrs, layer: string, innerText: string = null, forcePush = false) {

            attrs['vector-effect'] = 'non-scaling-stroke';

            var tag = new XmlTag(tagname, attrs);

            if (innerText) {
                tag.innerText = innerText;
            }

            append(tag.toString(), layer, forcePush);
        }

        function fixPoint(pointToFix: IPoint): IPoint {
            //in DXF Y increases upward. in SVG, Y increases downward
            var pointMirroredY = svgCoords(pointToFix);
            return point.scale(pointMirroredY, opts.scale);
        }

        function fixPath(pathToFix: IPath, origin: IPoint): IPath {
            //mirror creates a copy, so we don't modify the original
            var mirrorY = path.mirror(pathToFix, false, true);
            return path.moveRelative(path.scale(mirrorY, opts.scale), origin);
        }

        //fixup options
        var opts: ISVGRenderOptions = {
            annotate: false,
            origin: null,
            scale: 1,
            stroke: "#000",
            strokeWidth: '0.25mm',   //a somewhat average kerf of a laser cutter
            fill: "none",
            fontSize: '9pt',
            useSvgPathOnly: true,
            viewBox: true
        };

        extendObject(opts, options);

        var modelToExport: IModel;
        var itemToExportIsModel = isModel(itemToExport);
        if (itemToExportIsModel) {
            modelToExport = itemToExport as IModel;

            if (modelToExport.exporterOptions) {
                extendObject(opts, modelToExport.exporterOptions['toSVG']);
            }
        }

        var elements: string[] = [];
        var layers: ILayerElements = {};

        //measure the item to move it into svg area

        if (itemToExportIsModel) {
            modelToExport = <IModel>itemToExport;

        } else if (Array.isArray(itemToExport)) {
            //issue: this won't handle an array of models
            modelToExport = { paths: <IPathMap>itemToExport };

        } else if (isPath(itemToExport)) {
            modelToExport = { paths: { modelToMeasure: <IPath>itemToExport } };
        }

        var size = measure.modelExtents(modelToExport);

        //try to get the unit system from the itemToExport
        if (!opts.units) {
            var unitSystem = tryGetModelUnits(itemToExport);
            if (unitSystem) {
                opts.units = unitSystem;
            }
        }

        //convert unit system (if it exists) into SVG's units. scale if necessary.
        var useSvgUnit = svgUnit[opts.units];
        if (useSvgUnit && opts.viewBox) {
            opts.scale *= useSvgUnit.scaleConversion;
        }

        if (size && !opts.origin) {
            var left = -size.low[0] * opts.scale;
            opts.origin = [left, size.high[1] * opts.scale];
        }

        //also pass back to options parameter
        extendObject(options, opts);

        //begin svg output

        var svgAttrs: IXmlTagAttrs;

        if (size && opts.viewBox) {
            var width = round(size.high[0] - size.low[0]) * opts.scale;
            var height = round(size.high[1] - size.low[1]) * opts.scale;
            var viewBox = [0, 0, width, height];

            var unit = useSvgUnit ? useSvgUnit.svgUnitType : '';

            svgAttrs = {
                width: width + unit,
                height: height + unit,
                viewBox: viewBox.join(' ')
            };
        }

        var svgTag = new XmlTag('svg', <IXmlTagAttrs>extendObject(svgAttrs || {}, opts.svgAttrs));

        append(svgTag.getOpeningTag(false));

        var svgGroup = new XmlTag('g', {
            id: 'svgGroup',
            stroke: opts.stroke,
            "stroke-width": opts.strokeWidth,
            "stroke-linecap": "round",
            "fill": opts.fill,
            "fill-rule": "evenodd",
            "font-size": opts.fontSize
        });
        append(svgGroup.getOpeningTag(false));

        if (opts.useSvgPathOnly) {

            var pathDataByLayer = getPathDataByLayer(modelToExport, opts.origin, { byLayers: true });

            for (var layer in pathDataByLayer) {
                var pathData = pathDataByLayer[layer].join(' ');
                createElement("path", { "d": pathData }, layer, null, true);
            }

        } else {

            function drawText(id: string, textPoint: IPoint) {
                createElement(
                    "text",
                    {
                        "id": id + "_text",
                        "x": textPoint[0],
                        "y": textPoint[1]
                    },
                    null,
                    id);
            }

            function drawPath(id: string, x: number, y: number, d: ISvgPathData, layer: string, textPoint: IPoint) {
                createElement(
                    "path",
                    {
                        "id": id,
                        "d": ["M", round(x), round(y)].concat(d).join(" ")
                    },
                    layer);

                if (opts.annotate) {
                    drawText(id, textPoint);
                }
            }

            function circleInPaths(id: string, center: IPoint, radius: number, layer: string) {
                var d = svgCircleData(radius);

                drawPath(id, center[0], center[1], d, layer, center);
            }

            var map: IPathOriginFunctionMap = {};

            map[pathType.Line] = function (id: string, line: IPathLine, origin: IPoint, layer: string) {

                var start = line.origin;
                var end = line.end;

                createElement(
                    "line",
                    {
                        "id": id,
                        "x1": round(start[0]),
                        "y1": round(start[1]),
                        "x2": round(end[0]),
                        "y2": round(end[1])
                    },
                    layer);

                if (opts.annotate) {
                    drawText(id, point.middle(line));
                }
            };

            map[pathType.Circle] = function (id: string, circle: IPathCircle, origin: IPoint, layer: string) {

                var center = circle.origin;

                createElement(
                    "circle",
                    {
                        "id": id,
                        "r": circle.radius,
                        "cx": round(center[0]),
                        "cy": round(center[1])
                    },
                    layer);

                if (opts.annotate) {
                    drawText(id, center);
                }
            };

            map[pathType.Arc] = function (id: string, arc: IPathArc, origin: IPoint, layer: string) {

                var arcPoints = point.fromArc(arc);

                if (measure.isPointEqual(arcPoints[0], arcPoints[1])) {
                    circleInPaths(id, arc.origin, arc.radius, layer);
                } else {

                    var d = ['A'];
                    svgArcData(
                        d,
                        arc.radius,
                        arcPoints[1],
                        angle.ofArcSpan(arc) > 180,
                        arc.startAngle > arc.endAngle
                    );

                    drawPath(id, arcPoints[0][0], arcPoints[0][1], d, layer, point.middle(arc));
                }
            };

            map[pathType.BezierSeed] = function (id: string, seed: IPathBezierSeed, origin: IPoint, layer: string) {
                var d: ISvgPathData = [];
                svgBezierData(d, seed);
                drawPath(id, seed.origin[0], seed.origin[1], d, layer, point.middle(seed));
            };

            function beginModel(id: string, modelContext: IModel) {
                modelGroup.attrs = { id: id };
                append(modelGroup.getOpeningTag(false), modelContext.layer);
            }

            function endModel(modelContext: IModel) {
                append(modelGroup.getClosingTag(), modelContext.layer);
            }

            var modelGroup = new XmlTag('g');
            var exp = new Exporter(map, fixPoint, fixPath, beginModel, endModel);
            exp.exportItem('0', itemToExport, opts.origin);

            //export layers as groups
            for (var layer in layers) {

                var layerGroup = new XmlTag('g', { id: layer });

                for (var i = 0; i < layers[layer].length; i++) {
                    layerGroup.innerText += layers[layer][i];
                }

                layerGroup.innerTextEscaped = true;
                append(layerGroup.toString());
            }
        }

        append(svgGroup.getClosingTag());
        append(svgTag.getClosingTag());

        return elements.join('');
    }

    /**
     * @private
     */
    function svgCircleData(radius: number): ISvgPathData {
        var r = round(radius);
        var d: ISvgPathData = ['m', -r, 0];

        function halfCircle(sign: number) {
            d.push('a');
            svgArcData(d, r, [2 * r * sign, 0]);
        }

        halfCircle(1);
        halfCircle(-1);

        d.push('z');

        return d;
    }

    /**
     * @private
     */
    function svgBezierData(d: ISvgPathData, seed: IPathBezierSeed, reversed?: boolean) {
        if (seed.controls.length === 1) {
            d.push('Q', round(seed.controls[0][0]), round(seed.controls[0][1]));
        } else {
            var controls = reversed ? [seed.controls[1], seed.controls[0]] : seed.controls;
            d.push('C', round(controls[0][0]), round(controls[0][1]), round(controls[1][0]), round(controls[1][1]));
        }
        var final = reversed ? seed.origin : seed.end;
        d.push(round(final[0]), round(final[1]));
    }

    /**
     * @private
     */
    function svgArcData(d: ISvgPathData, radius: number, endPoint: IPoint, largeArc?: boolean, decreasing?: boolean) {
        var r = round(radius);
        var end: IPoint = endPoint;
        d.push(r, r);
        d.push(0);                   //0 = x-axis rotation
        d.push(largeArc ? 1 : 0);    //large arc=1, small arc=0
        d.push(decreasing ? 0 : 1);  //sweep-flag 0=decreasing, 1=increasing 
        d.push(round(end[0]), round(end[1]));
    }

    /**
     * Map of MakerJs unit system to SVG unit system
     */
    export interface svgUnitConversion {
        [unitType: string]: { svgUnitType: string; scaleConversion: number; };
    }

    /**
     * @private
     */
    interface ILayerElements {
        [id: string]: string[];
    }

    /**
     * Map of MakerJs unit system to SVG unit system
     */
    export var svgUnit: svgUnitConversion = {};

    //SVG Coordinate Systems, Transformations and Units documentation:
    //http://www.w3.org/TR/SVG/coords.html
    //The supported length unit identifiers are: em, ex, px, pt, pc, cm, mm, in, and percentages.

    svgUnit[unitType.Inch] = { svgUnitType: "in", scaleConversion: 1 };
    svgUnit[unitType.Millimeter] = { svgUnitType: "mm", scaleConversion: 1 };
    svgUnit[unitType.Centimeter] = { svgUnitType: "cm", scaleConversion: 1 };

    //Add conversions for all unitTypes
    svgUnit[unitType.Foot] = { svgUnitType: "in", scaleConversion: 12 };
    svgUnit[unitType.Meter] = { svgUnitType: "cm", scaleConversion: 100 };

    /**
     * SVG rendering options.
     */
    export interface ISVGRenderOptions extends IExportOptions {

        /**
         * Optional attributes to add to the root svg tag.
         */
        svgAttrs?: IXmlTagAttrs;

        /**
         * SVG fill color.
         */
        fill?: string;

        /**
         * SVG font size and font size units.
         */
        fontSize?: string;

        /**
         * SVG stroke width of paths. This may have a unit type suffix, if not, the value will be in the same unit system as the units property.
         */
        strokeWidth?: string;

        /**
         * SVG color of the rendered paths.
         */
        stroke?: string;

        /**
         * Scale of the SVG rendering.
         */
        scale?: number;

        /**
         *  Indicate that the id's of paths should be rendered as SVG text elements.
         */
        annotate?: boolean;

        /**
         * Rendered reference origin. 
         */
        origin?: IPoint;

        /**
         * Use SVG < path > elements instead of < line >, < circle > etc.
         */
        useSvgPathOnly?: boolean;

        /**
         * Flag to use SVG viewbox. 
         */
        viewBox?: boolean;
    }

}

namespace MakerJs.importer {

    interface ISVGPathCommand {
        command: string;
        absolute?: boolean;
        data: number[];
        from: IPoint;
        prev: ISVGPathCommand;
    }

    export function fromSVGPathData(pathData: string): IModel {
        var result: IModel = {};

        function addPath(p: IPath) {
            if (!result.paths) {
                result.paths = {};
            }
            result.paths['p_' + ++pathCount] = p;
        }

        function addModel(m: IModel) {
            if (!result.models) {
                result.models = {};
            }
            result.models['p_' + ++pathCount] = m;
        }

        function getPoint(cmd: ISVGPathCommand, offset = 0) {
            var p = point.mirror([cmd.data[0 + offset], cmd.data[1 + offset]], false, true);

            if (cmd.absolute) {
                return p;
            } else {
                return point.add(p, cmd.from);
            }
        }

        function lineTo(cmd: ISVGPathCommand, end: IPoint) {
            if (!measure.isPointEqual(cmd.from, end)) {
                addPath(new paths.Line(cmd.from, end));
            }
            return end;
        }

        var map: { [command: string]: (cmd: ISVGPathCommand) => IPoint } = {};

        map['M'] = function (cmd: ISVGPathCommand) {
            firstPoint = getPoint(cmd);
            return firstPoint;
        };

        map['Z'] = function (cmd: ISVGPathCommand) {
            return lineTo(cmd, firstPoint);
        };

        map['H'] = function (cmd: ISVGPathCommand) {
            var end = point.clone(cmd.from);

            if (cmd.absolute) {
                end[0] = cmd.data[0];
            } else {
                end[0] += cmd.data[0];
            }

            return lineTo(cmd, end);
        };

        map['V'] = function (cmd: ISVGPathCommand) {
            var end = point.clone(cmd.from);

            //subtract to mirror on y axis: SVG coords
            if (cmd.absolute) {
                end[1] = -cmd.data[0];
            } else {
                end[1] -= cmd.data[0];
            }

            return lineTo(cmd, end);
        };

        map['L'] = function (cmd: ISVGPathCommand) {
            var end = getPoint(cmd);
            return lineTo(cmd, end);
        };

        map['A'] = function (cmd: ISVGPathCommand) {
            var rx = cmd.data[0];
            var ry = cmd.data[1];
            var rotation = cmd.data[2];
            var large = cmd.data[3] === 1;
            var decreasing = cmd.data[4] === 1;
            var end = getPoint(cmd, 5);
            var elliptic = rx !== ry;
            
            //first, rotate so we are dealing with a zero angle x-axis
            var xAxis = new paths.Line(cmd.from, point.rotate(end, rotation, cmd.from));

            //next, un-distort any ellipse back into a circle in terms of x axis
            if (elliptic) {
                xAxis = path.distort(xAxis, 1, rx / ry) as IPathLine;
            }

            //now create an arc, making sure we use the large and decreasing flags
            var arc = new paths.Arc(xAxis.origin, xAxis.end, rx, large, decreasing);

            if (elliptic) {

                //scale up if radius was insufficient.
                if (rx < arc.radius) {
                    var scaleUp = arc.radius / rx;
                    rx *= scaleUp;
                    ry *= scaleUp;
                }

                //create an elliptical arc, this will re-distort
                var e = new models.EllipticArc(arc, 1, ry / rx);

                //un-rotate back to where it should be.
                model.rotate(e, -rotation, cmd.from);

                addModel(e);

            } else {
                //just use the arc

                //un-rotate back to where it should be.
                path.rotate(arc, -rotation, cmd.from);

                addPath(arc);
            }

            return end;
        };

        map['C'] = function (cmd: ISVGPathCommand) {
            var control1 = getPoint(cmd, 0);
            var control2 = getPoint(cmd, 2);
            var end = getPoint(cmd, 4);
            addModel(new models.BezierCurve(cmd.from, control1, control2, end));
            return end;
        };

        map['S'] = function (cmd: ISVGPathCommand) {
            var control1: IPoint;
            var prevControl2: IPoint;

            if (cmd.prev.command === 'C') {
                prevControl2 = getPoint(cmd.prev, 2);
                control1 = point.rotate(prevControl2, 180, cmd.from);
            } else if (cmd.prev.command === 'S') {
                prevControl2 = getPoint(cmd.prev, 0);
                control1 = point.rotate(prevControl2, 180, cmd.from);
            } else {
                control1 = cmd.from;
            }

            var control2 = getPoint(cmd, 0);
            var end = getPoint(cmd, 2);
            addModel(new models.BezierCurve(cmd.from, control1, control2, end));
            return end;
        };

        map['Q'] = function (cmd: ISVGPathCommand) {
            var control = getPoint(cmd, 0);
            var end = getPoint(cmd, 2);
            addModel(new models.BezierCurve(cmd.from, control, end));
            return end;
        };

        map['T'] = function (cmd: ISVGPathCommand) {
            var control: IPoint;
            var prevControl: IPoint;

            if (cmd.prev.command === 'Q') {
                prevControl = getPoint(cmd.prev, 0);
                control = point.rotate(prevControl, 180, cmd.from);
            } else if (cmd.prev.command === 'T') {
                prevControl = getPoint(cmd.prev, 2); //see below *
                control = point.rotate(prevControl, 180, cmd.from);
            } else {
                control = cmd.from;
            }

            //* save the control point in the data list, will be accessible from index 2
            var p = point.mirror(control, false, true);
            cmd.data.push.apply(cmd.data, p);

            var end = getPoint(cmd, 0);

            addModel(new models.BezierCurve(cmd.from, control, end));
            return end;
        };

        var firstPoint: IPoint = [0, 0];
        var currPoint: IPoint = [0, 0];
        var pathCount = 0;
        var prevCommand: ISVGPathCommand;
        var regexpCommands = /([achlmqstvz])(.?[^achlmqstvz]*)/ig;
        var commandMatches: RegExpExecArray;

        while ((commandMatches = regexpCommands.exec(pathData)) !== null) {
            if (commandMatches.index === regexpCommands.lastIndex) {
                regexpCommands.lastIndex++;
            }

            var command = commandMatches[1]; //0 = command and data, 1 = command, 2 = data
            var dataString = commandMatches[2];

            var currCmd: ISVGPathCommand = {
                command: command.toUpperCase(),
                data: [],
                from: currPoint,
                prev: prevCommand
            };

            if (command === currCmd.command) {
                currCmd.absolute = true;
            }

            currCmd.data = parseNumericList(dataString);

            var fn = map[currCmd.command];
            if (fn) {
                currPoint = fn(currCmd);
            }

            prevCommand = currCmd;
        }

        return result;
    }

}
