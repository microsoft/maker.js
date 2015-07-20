/// <reference path="exporter.ts" />
/// <reference path="xml.ts" />

module MakerJs.exporter {

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

        var opts: ISVGRenderOptions = {
            annotate: false,
            origin: null,
            scale: 1,
            stroke: "#000",
            strokeWidth: '0.25mm',   //a somewhat average kerf of a laser cutter
            useSvgPathOnly: true,
            viewBox: true
        };

        extendObject(opts, options);

        var elements: string[] = [];

        function append(value) {
            elements.push(value);
        }

        function fixPoint(pointToFix: IPoint): IPoint {
            //in DXF Y increases upward. in SVG, Y increases downward
            var pointMirroredY = point.mirror(pointToFix, false, true);
            return point.scale(pointMirroredY, opts.scale);
        }

        function fixPath(pathToFix: IPath, origin: IPoint): IPath {
            //mirror creates a copy, so we don't modify the original
            var mirrorY = path.mirror(pathToFix, false, true);
            return path.moveRelative(path.scale(mirrorY, opts.scale), origin);
        }

        function createElement(tagname: string, attrs: IXmlTagAttrs, innerText: string = null) {

            attrs['vector-effect'] = 'non-scaling-stroke';

            var tag = new XmlTag(tagname, attrs);

            if (innerText) {
                tag.innerText = innerText;
            }

            append(tag.toString());
        }

        function drawText(id: string, x: number, y: number) {
            createElement(
                "text",
                {
                    "id": id + "_text",
                    "x": x,
                    "y": y,
                },
                id);
        }

        function drawPath(id: string, x: number, y: number, d: any[]) {
            createElement(
                "path",
                {
                    "id": id,
                    "d": ["M", round(x), round(y)].concat(d).join(" ")
                });

            if (opts.annotate) {
                drawText(id, x, y);
            }
        }

        var map: IPathOriginFunctionMap = {};

        map[pathType.Line] = function (id: string, line: IPathLine, origin: IPoint) {

            var start = line.origin;
            var end = line.end;

            if (opts.useSvgPathOnly) {
                drawPath(id, start[0], start[1], [round(end[0]), round(end[1])]);
            } else {
                createElement(
                    "line",
                    {
                        "id": id,
                        "x1": round(start[0]),
                        "y1": round(start[1]),
                        "x2": round(end[0]),
                        "y2": round(end[1])
                    });

                if (opts.annotate) {
                    drawText(id,(start[0] + end[0]) / 2,(start[1] + end[1]) / 2);
                }
            }
        };

        map[pathType.Circle] = function (id: string, circle: IPathCircle, origin: IPoint) {

            var center = circle.origin;

            if (opts.useSvgPathOnly) {

                circleInPaths(id, center, circle.radius);

            } else {
                createElement(
                    "circle",
                    {
                        "id": id,
                        "r": circle.radius,
                        "cx": round(center[0]),
                        "cy": round(center[1])
                    });
            }

            if (opts.annotate) {
                drawText(id, center[0], center[1]);
            }
        };

        function circleInPaths(id: string, center: IPoint, radius: number) {
            var d = ['m', -radius, 0];

            function halfCircle(sign: number) {
                d.push('a');
                svgArcData(d, radius, [2 * radius * sign, 0]);
            }

            halfCircle(1);
            halfCircle(-1);

            drawPath(id, center[0], center[1], d);
        }

        function svgArcData(d: any[], radius: number, endPoint: IPoint, largeArc?: boolean, decreasing?: boolean) {
            var end: IPoint = endPoint;
            d.push(radius, radius);
            d.push(0);                   //0 = x-axis rotation
            d.push(largeArc ? 1 : 0);    //large arc=1, small arc=0
            d.push(decreasing ? 0 : 1);  //sweep-flag 0=decreasing, 1=increasing 
            d.push(round(end[0]), round(end[1]));
        }

        map[pathType.Arc] = function (id: string, arc: IPathArc, origin: IPoint) {

            var arcPoints = point.fromArc(arc);

            if (point.areEqual(arcPoints[0], arcPoints[1])) {
                circleInPaths(id, arc.origin, arc.radius);
            } else {

                var d = ['A'];
                svgArcData(
                    d,
                    arc.radius,
                    arcPoints[1],
                    Math.abs(arc.endAngle - arc.startAngle) > 180,
                    arc.startAngle > arc.endAngle
                    );

                drawPath(id, arcPoints[0][0], arcPoints[0][1], d);
            }
        };

        //fixup options

        //measure the item to move it into svg area

        var modelToMeasure: IModel;

        if (isModel(itemToExport)) {
            modelToMeasure = <IModel>itemToExport;

        } else if (Array.isArray(itemToExport)) {
            //issue: this won't handle an array of models
            modelToMeasure = { paths: <{ [id: string]: IPath }>itemToExport };

        } else if (isPath(itemToExport)) {
            modelToMeasure = { paths: {modelToMeasure: <IPath>itemToExport } };
        }

        var size = measure.modelExtents(modelToMeasure);

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

        if (!opts.origin) {
            var left = 0;
            if (size.low[0] < 0) {
                left = -size.low[0] * opts.scale;
            }
            opts.origin = [left, size.high[1] * opts.scale];
        }

        //also pass back to options parameter
        extendObject(options, opts);

        //begin svg output

        var modelGroup = new XmlTag('g');

        function beginModel(id: string, modelContext: IModel) {
            modelGroup.attrs = { id: id };
            append(modelGroup.getOpeningTag(false));
        }

        function endModel(modelContext: IModel) {
            append(modelGroup.getClosingTag());
        }

        var svgAttrs: IXmlTagAttrs;

        if (opts.viewBox) {
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

        var svgTag = new XmlTag('svg', <IXmlTagAttrs>extendObject(svgAttrs, opts.svgAttrs));

        append(svgTag.getOpeningTag(false));

        var svgGroup = new XmlTag('g', {
            id: 'svgGroup',
            stroke: opts.stroke,
            "stroke-width": opts.strokeWidth,
            "stroke-linecap": "round",
            "fill": "none"
        });
        append(svgGroup.getOpeningTag(false));

        var exp = new Exporter(map, fixPoint, fixPath, beginModel, endModel);
        exp.exportItem('itemToExport', itemToExport, opts.origin);

        append(svgGroup.getClosingTag());
        append(svgTag.getClosingTag());

        return elements.join('');
    }

    /**
     * @private
     */
    interface svgUnitConversion {
        [unitType: string]: { svgUnitType: string; scaleConversion: number; };
    }

    /**
     * @private
     */
    var svgUnit: svgUnitConversion = {};

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
         * SVG stroke width of paths. This may have a unit type suffix, if not, the value will be in the same unit system as the units property.
         */
        strokeWidth?: string;

        /**
         * SVG color of the rendered paths.
         */
        stroke: string;

        /**
         * Scale of the SVG rendering.
         */
        scale: number;

        /**
         *  Indicate that the id's of paths should be rendered as SVG text elements.
         */
        annotate: boolean;

        /**
         * Rendered reference origin. 
         */
        origin: IPoint;

        /**
         * Use SVG < path > elements instead of < line >, < circle > etc.
         */
        useSvgPathOnly: boolean;

        /**
         * Flag to use SVG viewbox. 
         */
        viewBox: boolean;
    }

}
