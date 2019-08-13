namespace MakerJs.exporter {

    /**
     * Map of SVG Path Data by layer name.
     */
    export interface IPathDataByLayerMap {
        [layer: string]: string;
    }

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
        [pathType: string]: (pathContext: IPath, endPoint: IPoint, reversed: boolean, d: ISvgPathData, accuracy: number) => void;
    }

    /**
     * @private
     */
    var chainLinkToPathDataMap: IChainLinkToPathDataMap = {};

    chainLinkToPathDataMap[pathType.Arc] = function (arc: IPathArc, endPoint: IPoint, reversed: boolean, d: ISvgPathData, accuracy: number) {
        d.push('A');
        svgArcData(
            d,
            arc.radius,
            endPoint,
            accuracy,
            angle.ofArcSpan(arc) > 180,
            reversed ? (arc.startAngle > arc.endAngle) : (arc.startAngle < arc.endAngle)
        );
    };

    chainLinkToPathDataMap[pathType.Line] = function (line: IPathLine, endPoint: IPoint, reversed: boolean, d: ISvgPathData, accuracy: number) {
        d.push('L', round(endPoint[0], accuracy), round(endPoint[1], accuracy));
    };

    chainLinkToPathDataMap[pathType.BezierSeed] = function (seed: IPathBezierSeed, endPoint: IPoint, reversed: boolean, d: ISvgPathData, accuracy: number) {
        svgBezierData(d, seed, accuracy, reversed);
    };

    /**
     * @private
     */
    function svgCoords(p: IPoint): IPoint {
        return point.mirror(p, false, true);
    }

    /**
     * @private
     */
    function correctArc(arc: IPathArc) {
        const arcSpan = angle.ofArcSpan(arc);
        arc.startAngle = angle.noRevolutions(arc.startAngle);
        arc.endAngle = arc.startAngle + arcSpan;
    }

    /**
     * Convert a chain to SVG path data.
     *
     * @param chain Chain to convert.
     * @param offset IPoint relative offset point.
     * @param accuracy Optional accuracy of SVG path data.
     * @returns String of SVG path data.
     */
    export function chainToSVGPathData(chain: IChain, offset: IPoint, accuracy?: number): string {

        function offsetPoint(p: IPoint) {
            return point.add(p, offset);
        }

        var first = chain.links[0];
        var firstPoint = offsetPoint(svgCoords(first.endPoints[first.reversed ? 1 : 0]));

        var d: ISvgPathData = ['M', round(firstPoint[0], accuracy), round(firstPoint[1], accuracy)];

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

                fn(fixedPath, offsetPoint(svgCoords(link.endPoints[link.reversed ? 0 : 1])), link.reversed, d, accuracy);
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
    function startSvgPathData(start: IPoint, d: ISvgPathData, accuracy: number): ISvgPathData {
        return ["M", round(start[0], accuracy), round(start[1], accuracy)].concat(d);
    }

    /**
     * @private
     */
    interface ISvgPathDataMap {
        [pathType: string]: (pathContext: IPath, accuracy: number, clockwiseCircle?: boolean) => ISvgPathData;
    }

    /**
     * @private
     */
    var svgPathDataMap: ISvgPathDataMap = {};

    svgPathDataMap[pathType.Line] = function (line: IPathLine, accuracy: number) {
        return startSvgPathData(line.origin, point.rounded(line.end, accuracy) as Array<number>, accuracy);
    };

    svgPathDataMap[pathType.Circle] = function (circle: IPathCircle, accuracy: number, clockwiseCircle: boolean) {
        return startSvgPathData(circle.origin, svgCircleData(circle.radius, accuracy, clockwiseCircle), accuracy);
    };

    svgPathDataMap[pathType.Arc] = function (arc: IPathArc, accuracy: number) {
        correctArc(arc);
        var arcPoints = point.fromArc(arc);

        if (measure.isPointEqual(arcPoints[0], arcPoints[1])) {
            return svgPathDataMap[pathType.Circle](arc, accuracy);
        } else {

            var d: ISvgPathData = ['A'];
            svgArcData(
                d,
                arc.radius,
                arcPoints[1],
                accuracy,
                angle.ofArcSpan(arc) > 180,
                arc.startAngle > arc.endAngle
            );

            return startSvgPathData(arcPoints[0], d, accuracy);
        }
    };

    svgPathDataMap[pathType.BezierSeed] = function (seed: IPathBezierSeed, accuracy: number) {
        var d: ISvgPathData = [];
        svgBezierData(d, seed, accuracy);
        return startSvgPathData(seed.origin, d, accuracy);
    };

    /**
     * Export a path to SVG path data.
     *
     * @param pathToExport IPath to export.
     * @param pathOffset IPoint relative offset of the path object.
     * @param exportOffset IPoint relative offset point of the export.
     * @param accuracy Optional accuracy of SVG path data.
     * @param clockwiseCircle Optional flag to use clockwise winding for circles.
     * @returns String of SVG path data.
     */
    export function pathToSVGPathData(pathToExport: IPath, pathOffset: IPoint, exportOffset: IPoint, accuracy?: number, clockwiseCircle?: boolean): string {
        var fn = svgPathDataMap[pathToExport.type];
        if (fn) {
            var fixedPath: IPath;
            path.moveTemporary([pathToExport], [pathOffset], function () {
                fixedPath = path.mirror(pathToExport, false, true);
            });
            path.moveRelative(fixedPath, exportOffset);

            var d = fn(fixedPath, accuracy, clockwiseCircle);
            return d.join(' ');
        }
        return '';
    }

    /**
     * @private
     */
    function getPathDataByLayer(modelToExport: IModel, offset: IPoint, options: IFindChainsOptions, accuracy: number) {
        var pathDataByLayer: IPathDataMap = {};

        options.unifyBeziers = true;

        model.findChains(
            modelToExport,
            function (chains: IChain[], loose: IWalkPath[], layer: string) {

                function single(walkedPath: IWalkPath, clockwise?: boolean) {
                    var pathData = pathToSVGPathData(walkedPath.pathContext, walkedPath.offset, offset, accuracy, clockwise);
                    pathDataByLayer[layer].push(pathData);
                }

                pathDataByLayer[layer] = [];

                function doChains(cs: IChain[], clockwise: boolean) {
                    cs.forEach(function (chain: IChain) {
                        if (chain.links.length > 1) {
                            var pathData = chainToSVGPathData(chain, offset, accuracy);
                            pathDataByLayer[layer].push(pathData);
                        } else {
                            single(chain.links[0].walkedPath, clockwise);
                        }
                        if (chain.contains) {
                            doChains(chain.contains, !clockwise);
                        }
                    });
                }

                doChains(chains, true);

                loose.forEach(wp => single(wp));

            },
            options
        );

        return pathDataByLayer;
    }

    /**
     * Convert a model to SVG path data.
     *
     * @param modelToExport Model to export.
     * @param options Optional ISVGPathDataRenderOptions object.
     * @param options.accuracy Optional accuracy of SVG decimals.
     * @param options.byLayers Optional boolean flag (default false) to return a map of path data by layer.
     * @param options.fillRule Optional SVG fill rule: 'evenodd' (default) or 'nonzero'.
     * @param options.origin Optional origin. Default x = 0, y = topmost y point in the model. Use [0, 0] to use the same origin as Maker.js, which will translate to negative Y values in SVG.
     * @returns String of SVG path data (if options.byLayers is false) or an object map of path data by layer .
     */
    export function toSVGPathData(modelToExport: IModel, options?: ISVGPathDataRenderOptions): IPathDataByLayerMap | string;

    /**
     * Convert a model to SVG path data.
     *
     * @param modelToExport Model to export.
     * @param byLayers Optional boolean flag to return a map of path data by layer.
     * @param origin Optional origin. Default x = 0, y = topmost y point in the model. Use [0, 0] to use the same origin as Maker.js, which will translate to negative Y values in SVG.
     * @param accuracy Optional accuracy of SVG decimals.
     * @returns String of SVG path data (if byLayers is false) or an object map of path data by layer .
     */
    export function toSVGPathData(modelToExport: IModel, byLayers?: boolean, origin?: IPoint, accuracy?: number): IPathDataByLayerMap | string;

    export function toSVGPathData(modelToExport: IModel, ...args: any[]): IPathDataByLayerMap | string {

        var options: ISVGPathDataRenderOptions = {
            fillRule: 'evenodd'
        };

        if (typeof args[0] === 'boolean') {
            options.byLayers = args[0];
            options.origin = args[1];
            options.accuracy = args[2];
        } else if (isObject(args[0])) {
            extendObject(options, args[0]);
        }

        var findChainsOptions: IFindChainsOptions = {
            byLayers: options.byLayers,
            contain: false
        };

        if (options.fillRule === 'nonzero') {
            findChainsOptions.contain = <IContainChainsOptions>{
                alternateDirection: true
            };
        }

        var size = measure.modelExtents(modelToExport);
        if (!options.origin) {
            options.origin = [-size.low[0], size.high[1]];
        }

        var pathDataArrayByLayer = getPathDataByLayer(modelToExport, options.origin, findChainsOptions, options.accuracy);
        var pathDataStringByLayer: IPathDataByLayerMap = {};

        for (var layer in pathDataArrayByLayer) {
            pathDataStringByLayer[layer] = pathDataArrayByLayer[layer].join(' ');
        }

        return findChainsOptions.byLayers ? pathDataStringByLayer : pathDataStringByLayer[''];
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

        function cssStyle(elOpts: ISVGElementRenderOptions) {
            var a: string[] = [];

            function push(name: string, val: string) {
                if (val === undefined) return;
                a.push(name + ':' + val);
            }

            push('stroke', elOpts.stroke);
            push('stroke-width', elOpts.strokeWidth);
            push('fill', elOpts.fill);

            return a.join(';');
        }

        function addSvgAttrs(attrs: IXmlTagAttrs, elOpts: ISVGElementRenderOptions) {
            if (!elOpts) return;

            extendObject(attrs, {
                "stroke": elOpts.stroke,
                "stroke-width": elOpts.strokeWidth,
                "fill": elOpts.fill,
                "style": elOpts.cssStyle || cssStyle(elOpts)
            });
        }

        function colorLayerOptions(layer: string): ISVGElementRenderOptions {
            if (opts.layerOptions && opts.layerOptions[layer]) return opts.layerOptions[layer];

            if (layer in colors) {
                return {
                    stroke: layer
                };
            }
        }

        function createElement(tagname: string, attrs: IXmlTagAttrs, layer: string, innerText: string = null, forcePush = false) {

            if (tagname !== 'text') {
                addSvgAttrs(attrs, colorLayerOptions(layer));
            }

            if (!opts.scalingStroke) {
                attrs['vector-effect'] = 'non-scaling-stroke';
            }

            var tag = new XmlTag(tagname, attrs);
            tag.closingTags = opts.closingTags;

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
            accuracy: .001,
            annotate: false,
            origin: null,
            scale: 1,
            stroke: "#000",
            strokeLineCap: "round",
            strokeWidth: '0.25mm',   //a somewhat average kerf of a laser cutter
            fill: "none",
            fillRule: "evenodd",
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
        var layers: { [id: string]: string[]; } = {};

        //measure the item to move it into svg area

        if (itemToExportIsModel) {
            modelToExport = <IModel>itemToExport;

        } else if (Array.isArray(itemToExport)) {
            //issue: this won't handle an array of models
            var pathMap: IPathMap = {};
            (itemToExport as IPath[]).forEach((p, i) => { pathMap[i] = p });
            modelToExport = { paths: pathMap };

        } else if (isPath(itemToExport)) {
            modelToExport = { paths: { modelToMeasure: <IPath>itemToExport } };
        }

        const size = measure.modelExtents(modelToExport);

        //increase size to fit caption text
        const captions = model.getAllCaptionsOffset(modelToExport);
        captions.forEach(caption => {
            measure.increase(size, measure.pathExtents(caption.anchor), true);
        });

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

        var svgAttrs: IXmlTagAttrs = {};

        if (size && opts.viewBox) {
            var width = round(size.width * opts.scale, opts.accuracy);
            var height = round(size.height * opts.scale, opts.accuracy);
            var viewBox = [0, 0, width, height];

            var unit = useSvgUnit ? useSvgUnit.svgUnitType : '';

            svgAttrs = {
                width: width + unit,
                height: height + unit,
                viewBox: viewBox.join(' ')
            };
        }

        svgAttrs["xmlns"] = "http://www.w3.org/2000/svg";
        var svgTag = new XmlTag('svg', <IXmlTagAttrs>extendObject(svgAttrs, opts.svgAttrs));

        append(svgTag.getOpeningTag(false));

        var groupAttrs: IXmlTagAttrs = {
            id: 'svgGroup',
            "stroke-linecap": opts.strokeLineCap,
            "fill-rule": opts.fillRule,
            "font-size": opts.fontSize
        };
        addSvgAttrs(groupAttrs, opts);

        var svgGroup = new XmlTag('g', groupAttrs);
        append(svgGroup.getOpeningTag(false));

        if (opts.useSvgPathOnly) {

            var findChainsOptions: IFindChainsOptions = {
                byLayers: true
            };

            if (opts.fillRule === 'nonzero') {
                findChainsOptions.contain = <IContainChainsOptions>{
                    alternateDirection: true
                }
            }

            var pathDataByLayer = getPathDataByLayer(modelToExport, opts.origin, findChainsOptions, opts.accuracy);

            for (var layerId1 in pathDataByLayer) {
                var pathData = pathDataByLayer[layerId1].join(' ');
                var attrs = { "d": pathData };
                if (layerId1.length > 0) {
                    attrs["id"] = layerId1;
                }
                createElement("path", attrs, layerId1, null, true);
            }

        } else {

            function drawText(id: string, textPoint: IPoint, layer: string) {
                createElement(
                    "text",
                    {
                        "id": id + "_text",
                        "x": round(textPoint[0], opts.accuracy),
                        "y": round(textPoint[1], opts.accuracy)
                    },
                    layer,
                    id);
            }

            function drawPath(id: string, x: number, y: number, d: ISvgPathData, layer: string, route: string[], textPoint: IPoint, annotate: boolean, flow: IFlowAnnotation) {
                createElement(
                    "path",
                    {
                        "id": id,
                        "data-route": route,
                        "d": ["M", round(x, opts.accuracy), round(y, opts.accuracy)].concat(d).join(" ")
                    },
                    layer);

                if (annotate) {
                    drawText(id, textPoint, layer);
                }
            }

            function circleInPaths(id: string, center: IPoint, radius: number, layer: string, route: string[], annotate: boolean, flow: IFlowAnnotation) {
                var d = svgCircleData(radius, opts.accuracy);

                drawPath(id, center[0], center[1], d, layer, route, center, annotate, flow);
            }

            var map: { [type: string]: (id: string, pathValue: IPath, layer: string, className: string, route: string[], annotate: boolean, flow: IFlowAnnotation) => void; } = {};

            map[pathType.Line] = function (id: string, line: IPathLine, layer: string, className: string, route: string[], annotate: boolean, flow: IFlowAnnotation) {
                var start = line.origin;
                var end = line.end;

                createElement(
                    "line",
                    {
                        "id": id,
                        "class": className,
                        "data-route": route,
                        "x1": round(start[0], opts.accuracy),
                        "y1": round(start[1], opts.accuracy),
                        "x2": round(end[0], opts.accuracy),
                        "y2": round(end[1], opts.accuracy)
                    },
                    layer);

                if (annotate) {
                    drawText(id, point.middle(line), layer);
                }

                if (flow) {
                    addFlowMarks(flow, layer, line.origin, line.end, angle.ofLineInDegrees(line));
                }
            };

            map[pathType.Circle] = function (id: string, circle: IPathCircle, layer: string, className: string, route: string[], annotate: boolean, flow: IFlowAnnotation) {
                var center = circle.origin;

                createElement(
                    "circle",
                    {
                        "id": id,
                        "class": className,
                        "data-route": route,
                        "r": circle.radius,
                        "cx": round(center[0], opts.accuracy),
                        "cy": round(center[1], opts.accuracy)
                    },
                    layer);

                if (annotate) {
                    drawText(id, center, layer);
                }
            };

            map[pathType.Arc] = function (id: string, arc: IPathArc, layer: string, className: string, route: string[], annotate: boolean, flow: IFlowAnnotation) {
                correctArc(arc);
                var arcPoints = point.fromArc(arc);

                if (measure.isPointEqual(arcPoints[0], arcPoints[1])) {
                    circleInPaths(id, arc.origin, arc.radius, layer, route, annotate, flow);
                } else {

                    var d = ['A'];
                    svgArcData(
                        d,
                        arc.radius,
                        arcPoints[1],
                        opts.accuracy,
                        angle.ofArcSpan(arc) > 180,
                        arc.startAngle > arc.endAngle
                    );

                    drawPath(id, arcPoints[0][0], arcPoints[0][1], d, layer, route, point.middle(arc), annotate, flow);

                    if (flow) {
                        addFlowMarks(flow, layer, arcPoints[1], arcPoints[0], angle.noRevolutions(arc.startAngle - 90));
                    }
                }
            };

            map[pathType.BezierSeed] = function (id: string, seed: IPathBezierSeed, layer: string, className: string, route: string[], annotate: boolean, flow: IFlowAnnotation) {
                var d: ISvgPathData = [];
                svgBezierData(d, seed, opts.accuracy);
                drawPath(id, seed.origin[0], seed.origin[1], d, layer, route, point.middle(seed), annotate, flow);
            };

            function addFlowMarks(flow: IFlowAnnotation, layer: string, origin: IPoint, end: IPoint, endAngle: number) {
                const className = 'flow';

                //origin: add a circle
                map[pathType.Circle]('', new paths.Circle(origin, flow.size / 2), layer, className, null, false, null);

                //end: add an arrow
                const arrowEnd: IPoint = [-1 * flow.size, flow.size / 2];
                const arrowLines = [arrowEnd, point.mirror(arrowEnd, false, true)].map(p => new paths.Line(point.add(point.rotate(p, endAngle), end), end));
                arrowLines.forEach(a => map[pathType.Line]('', a, layer, className, null, false, null));
            }

            function beginModel(id: string, modelContext: IModel) {
                modelGroup.attrs = { id: id };
                append(modelGroup.getOpeningTag(false), modelContext.layer);
            }

            function endModel(modelContext: IModel) {
                append(modelGroup.getClosingTag(), modelContext.layer);
            }

            var modelGroup = new XmlTag('g');

            var walkOptions: IWalkOptions = {

                beforeChildWalk: (walkedModel: IWalkModel): boolean => {
                    beginModel(walkedModel.childId, walkedModel.childModel);
                    return true;
                },

                onPath: (walkedPath: IWalkPath) => {
                    var fn = map[walkedPath.pathContext.type];
                    if (fn) {
                        var offset = point.add(fixPoint(walkedPath.offset), opts.origin);
                        fn(walkedPath.pathId, fixPath(walkedPath.pathContext, offset), walkedPath.layer, null, walkedPath.route, opts.annotate, opts.flow);
                    }
                },

                afterChildWalk: (walkedModel: IWalkModel) => {
                    endModel(walkedModel.childModel);
                }
            };

            beginModel('0', modelToExport);

            model.walk(modelToExport, walkOptions);

            //export layers as groups
            for (var layerId2 in layers) {

                var layerGroup = new XmlTag('g', { id: layerId2 });

                addSvgAttrs(layerGroup.attrs, colorLayerOptions(layerId2));

                for (var i = 0; i < layers[layerId2].length; i++) {
                    layerGroup.innerText += layers[layerId2][i];
                }

                layerGroup.innerTextEscaped = true;
                append(layerGroup.toString());
            }

            endModel(modelToExport);
        }

        const captionTags = captions.map(caption => {
            const anchor = fixPath(caption.anchor, opts.origin) as IPathLine;
            const center = point.rounded(point.middle(anchor), opts.accuracy);
            const tag = new XmlTag('text', {
                "alignment-baseline": "middle",
                "text-anchor": "middle",
                "transform": `rotate(${angle.ofLineInDegrees(anchor)},${center[0]},${center[1]})`,
                "x": center[0],
                "y": center[1]
            });
            addSvgAttrs(tag.attrs, colorLayerOptions(caption.layer));
            tag.innerText = caption.text;
            return tag.toString();
        });

        if (captionTags.length) {
            const captionGroup = new XmlTag('g', { "id": "captions" });
            addSvgAttrs(captionGroup.attrs, colorLayerOptions(captionGroup.attrs.id));
            captionGroup.innerText = captionTags.join('');
            captionGroup.innerTextEscaped = true;
            append(captionGroup.toString());
        }

        append(svgGroup.getClosingTag());
        append(svgTag.getClosingTag());

        return elements.join('');
    }

    /**
     * @private
     */
    function svgCircleData(radius: number, accuracy: number, clockwiseCircle?: boolean): ISvgPathData {
        var r = round(radius, accuracy);
        var d: ISvgPathData = ['m', -r, 0];

        function halfCircle(sign: number) {
            d.push('a');
            svgArcData(d, r, [2 * r * sign, 0], accuracy, false, !clockwiseCircle);
        }

        halfCircle(1);
        halfCircle(-1);

        d.push('z');

        return d;
    }

    /**
     * @private
     */
    function svgBezierData(d: ISvgPathData, seed: IPathBezierSeed, accuracy: number, reversed?: boolean) {
        if (seed.controls.length === 1) {
            d.push('Q', round(seed.controls[0][0], accuracy), round(seed.controls[0][1], accuracy));
        } else {
            var controls = reversed ? [seed.controls[1], seed.controls[0]] : seed.controls;
            d.push('C', round(controls[0][0], accuracy), round(controls[0][1], accuracy), round(controls[1][0], accuracy), round(controls[1][1], accuracy));
        }
        var final = reversed ? seed.origin : seed.end;
        d.push(round(final[0], accuracy), round(final[1], accuracy));
    }

    /**
     * @private
     */
    function svgArcData(d: ISvgPathData, radius: number, endPoint: IPoint, accuracy: number, largeArc?: boolean, increasing?: boolean) {
        var r = round(radius, accuracy);
        var end: IPoint = endPoint;
        d.push(r, r);
        d.push(0);                   //0 = x-axis rotation
        d.push(largeArc ? 1 : 0);    //large arc=1, small arc=0
        d.push(increasing ? 0 : 1);  //sweep-flag 0=increasing, 1=decreasing
        d.push(round(end[0], accuracy), round(end[1], accuracy));
    }

    /**
     * Map of MakerJs unit system to SVG unit system
     */
    export interface svgUnitConversion {
        [unitType: string]: { svgUnitType: string; scaleConversion: number; };
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
    export interface ISVGElementRenderOptions {

        /**
         * SVG fill color.
         */
        fill?: string;

        /**
         * SVG color of the rendered paths.
         */
        stroke?: string;

        /**
         * SVG stroke width of paths. This may have a unit type suffix, if not, the value will be in the same unit system as the units property.
         */
        strokeWidth?: string;

        /**
         * CSS style to apply to elements.
         */
        cssStyle?: string;
    }

    /**
     *  Annotate paths with directional flow marks.
     */
    export interface IFlowAnnotation {

        /**
         * Size of flow marks (arrows and circle).
         */
        size: number;
    }

    /**
     * SVG rendering options.
     */
    export interface ISVGRenderOptions extends IExportOptions, ISVGElementRenderOptions {

        /**
         * Optional attributes to add to the root svg tag.
         */
        svgAttrs?: IXmlTagAttrs;

        /**
         * SVG font size and font size units.
         */
        fontSize?: string;

        /**
         * Scale of the SVG rendering.
         */
        scale?: number;

        /**
         *  Indicate that the id's of paths should be rendered as SVG text elements.
         */
        annotate?: boolean;

        /**
         *  Options to show direction of path flow.
         */
        flow?: IFlowAnnotation;

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

        /**
         * SVG fill rule.
         */
        fillRule?: 'nonzero' | 'evenodd';

        /**
         * SVG stroke linecap.
         */
        strokeLineCap?: string;

        /**
         * SVG options per layer.
         */
        layerOptions?: { [layerId: string]: ISVGElementRenderOptions };

        /**
         * Flag to remove the "vector-effect: non-scaling-stroke" attribute.
         */
        scalingStroke?: boolean;

        /**
         * Flag to explicitly close XML tags.
         */
        closingTags?: boolean;
    }

    /**
     * SVG Path Data rendering options.
     */
    export interface ISVGPathDataRenderOptions extends IExportOptions {

        /**
         * Optional boolean flag to return a map of path data by layer.
         */
        byLayers?: boolean;

        /**
         * SVG fill-rule.
         */
        fillRule?: 'nonzero' | 'evenodd';

        /**
         * Optional origin. Default x = 0, y = topmost y point in the model. Use [0, 0] to use the same origin as Maker.js, which will translate to negative Y values in SVG.
         */
        origin?: IPoint;
    }
}

namespace MakerJs.importer {

    /**
     * @private
     */
    interface ISVGPathCommand {
        command: string;
        absolute?: boolean;
        data: number[];
        from: IPoint;
        prev: ISVGPathCommand;
    }

    /**
     * SVG importing options.
     */
    export interface ISVGImportOptions {

        /**
         * Optional accuracy of Bezier curves and elliptic paths.
         */
        bezierAccuracy?: number;
    }

    /**
     * Create a model from SVG path data.
     *
     * @param pathData SVG path data.
     * @param options ISVGImportOptions object.
     * @param options.bezierAccuracy Optional accuracy of Bezier curves.
     * @returns An IModel object.
     */
    export function fromSVGPathData(pathData: string, options: ISVGImportOptions = {}): IModel {
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
                var e = new models.EllipticArc(arc, 1, ry / rx, options.bezierAccuracy);

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
            addModel(new models.BezierCurve(cmd.from, control1, control2, end, options.bezierAccuracy));
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
            addModel(new models.BezierCurve(cmd.from, control1, control2, end, options.bezierAccuracy));
            return end;
        };

        map['Q'] = function (cmd: ISVGPathCommand) {
            var control = getPoint(cmd, 0);
            var end = getPoint(cmd, 2);
            addModel(new models.BezierCurve(cmd.from, control, end, options.bezierAccuracy));
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

            addModel(new models.BezierCurve(cmd.from, control, end, options.bezierAccuracy));
            return end;
        };

        var firstPoint: IPoint = [0, 0];
        var currPoint: IPoint = [0, 0];
        var pathCount = 0;
        var prevCommand: ISVGPathCommand;
        var regexpCommands = /([achlmqstvz])([0-9e\.,\+-\s]*)/ig;
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
