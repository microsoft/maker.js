/// <reference path="exporter.ts" />
/// <reference path="xml.ts" />

module MakerJs.exporter {

    /**
     * The default stroke width in millimeters.
     */
    export var defaultStrokeWidth = 0.2;

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
     * @param options.strokeWidth Number width of the rendered paths, in the same units as the units parameter.
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
            useSvgPathOnly: true,
            viewBox: true
        };

        extendObject(opts, options);

        var elements: string[] = [];

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

        function createElement(tagname: string, attrs: IXmlTagAttrs, innerText: string = null, useStroke = true) {

            var tag = new XmlTag(tagname, attrs);

            if (innerText) {
                tag.innerText = innerText;
            }

            if (useStroke) {
                tag.attrs["fill"] = "none";
                tag.attrs["stroke"] = opts.stroke;
                tag.attrs["stroke-width"] = opts.strokeWidth;
            }

            elements.push(tag.toString());
        }

        function drawText(id: string, x: number, y: number) {
            createElement(
                "text",
                {
                    "id": id + "_text",
                    "x": x,
                    "y": y,
                },
                id,
                false);
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

        map[pathType.Line] = function (line: IPathLine, origin: IPoint) {

            var start = line.origin;
            var end = line.end;

            if (opts.useSvgPathOnly) {
                drawPath(line.id, start[0], start[1], [round(end[0]), round(end[1])]);
            } else {
                createElement(
                    "line",
                    {
                        "id": line.id,
                        "x1": round(start[0]),
                        "y1": round(start[1]),
                        "x2": round(end[0]),
                        "y2": round(end[1])
                    });
            }

            if (opts.annotate) {
                drawText(line.id, (start[0] + end[0]) / 2, (start[1] + end[1]) / 2);
            }
        };

        map[pathType.Circle] = function (circle: IPathCircle, origin: IPoint) {

            var center = circle.origin;

            if (opts.useSvgPathOnly) {

                var r = circle.radius;
                var d = ['m', -r, 0];

                function halfCircle(sign: number) {
                    d.push('a');
                    svgArcData(d, r, [2 * r * sign, 0]);
                }

                halfCircle(1);
                halfCircle(-1);

                drawPath(circle.id, center[0], center[1], d);

            } else {
                createElement(
                    "circle",
                    {
                        "id": circle.id,
                        "r": circle.radius,
                        "cx": round(center[0]),
                        "cy": round(center[1])
                    });
            }

            if (opts.annotate) {
                drawText(circle.id, center[0], center[1]);
            }
        };

        function svgArcData(d: any[], radius: number, endPoint: IPoint, largeArc?: boolean, decreasing?: boolean) {
            var end: IPoint = endPoint;
            d.push(radius, radius);
            d.push(0);                   //0 = x-axis rotation
            d.push(largeArc ? 1 : 0);    //large arc=1, small arc=0
            d.push(decreasing ? 0 : 1);  //sweep-flag 0=decreasing, 1=increasing 
            d.push(round(end[0]), round(end[1]));
        }

        map[pathType.Arc] = function (arc: IPathArc, origin: IPoint) {

            var arcPoints = point.fromArc(arc);

            var d = ['A'];
            svgArcData(
                d,
                arc.radius,
                arcPoints[1],
                Math.abs(arc.endAngle - arc.startAngle) > 180,
                arc.startAngle > arc.endAngle
            );

            drawPath(arc.id, arcPoints[0][0], arcPoints[0][1], d);
        };

        //fixup options

        //measure the item to move it into svg area

        var modelToMeasure: IModel;

        if (isModel(itemToExport)) {
            modelToMeasure = <IModel>itemToExport;

        } else if (Array.isArray(itemToExport)) {
            //issue: this won't handle an array of models
            modelToMeasure = { paths: <IPath[]>itemToExport };

        } else if (isPath(itemToExport)) {
            modelToMeasure = { paths: [(<IPath>itemToExport)] };
        }

        var size = measure.modelExtents(modelToMeasure);

        if (!opts.origin) {
            opts.origin = [-size.low[0] * opts.scale, size.high[1] * opts.scale];
        }

        if (!opts.units) {
            var unitSystem = tryGetModelUnits(itemToExport);
            if (unitSystem) {
                opts.units = unitSystem;
            }
        }

        if (!opts.strokeWidth) {
            if (!opts.units) {
                opts.strokeWidth = defaultStrokeWidth;
            } else {
                opts.strokeWidth = round(units.conversionScale(unitType.Millimeter, opts.units) * defaultStrokeWidth, .001);
            }
        }

        //also pass back to options parameter
        extendObject(options, opts);

        //begin svg output

        var exp = new Exporter(map, fixPoint, fixPath);
        exp.exportItem(itemToExport, opts.origin);

        var svgAttrs;

        if (opts.viewBox) {
            var width = round(size.high[0] - size.low[0]);
            var height = round(size.high[1] - size.low[1]);
            var viewBox = [0, 0, width, height];
            var unit = svgUnit[opts.units] || '';
            svgAttrs = { width: width + unit, height: height + unit, viewBox: viewBox.join(' ') };
        }

        var svgTag = new XmlTag('svg', svgAttrs);
        svgTag.innerText = elements.join('');
        svgTag.innerTextEscaped = true;
        return svgTag.toString();
    }

    //SVG Coordinate Systems, Transformations and Units documentation:
    //http://www.w3.org/TR/SVG/coords.html
    //The supported length unit identifiers are: em, ex, px, pt, pc, cm, mm, in, and percentages.
    var svgUnit: { [unitType: string]: string } = {};
    svgUnit[unitType.Inch] = "in";
    svgUnit[unitType.Millimeter] = "mm";
    svgUnit[unitType.Centimeter] = "cm";

    /**
     * SVG rendering options.
     */
    export interface ISVGRenderOptions extends IExportOptions {

        /**
         * SVG stroke width of paths. This is in the same unit system as the units property.
         */
        strokeWidth?: number;

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
         * Use SVG <path> elements instead of <line>, <circle> etc.
         */
        useSvgPathOnly: boolean;

        /**
         * Flag to use SVG viewbox. 
         */
        viewBox: boolean;
    }

} 
