/// <reference path="exports.ts" />

module Maker.Exports {

    export function SVG(model: IMakerModel, options?: ISVGRenderOptions): string;
    export function SVG(pathsToExport: IMakerPath[], options?: ISVGRenderOptions): string;
    export function SVG(pathToExport: IMakerPath, options?: ISVGRenderOptions): string;

    /**
     * Renders an item in SVG markup.
     * 
     * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
     * @param options Rendering options object.
     * @param options.annotate Boolean to indicate that the id's of paths should be rendered as SVG text elements.
     * @param options.scale Number to scale the SVG rendering.
     * @param options.stroke String color of the rendered paths.
     * @param options.strokeWidth Number width of the rendered paths.
     * @param options.origin Point object for the rendered reference origin.
     * @param options.useSvgPathOnly Boolean to use SVG path elements instead of line, circle etc.
     * @returns String of XML / SVG content.
     */
    export function SVG(itemToExport: any, options?: ISVGRenderOptions): string {

        var opts: ISVGRenderOptions = {
            annotate: false,
            scale: 1,
            stroke: "blue",
            strokeWidth: 2,
            origin: Point.Zero(),
            useSvgPathOnly: false
        };

        ExtendObject(opts, options);

        var elements: string[] = [];

        function fixPoint(pointToFix: IMakerPoint): IMakerPoint {
            //in DXF Y increases upward. in SVG, Y increases downward
            var mirrorY = Point.Mirror(pointToFix, false, true);
            return Point.Scale(mirrorY, opts.scale);
        }

        function fixPath(pathToFix: IMakerPath, origin: IMakerPoint): IMakerPath {
            //mirror creates a copy, so we don't modify the original
            var mirrorY = Path.Mirror(pathToFix, false, true);
            return Path.MoveRelative(Path.Scale(mirrorY, opts.scale), origin);
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

            elements.push(tag.ToString());
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
                    "d": ["M", x, y].concat(d).join(" ")
                });

            if (opts.annotate) {
                drawText(id, x, y);
            }
        }

        var map: IMakerPathOriginFunctionMap = {};

        map[PathType.Line] = function (line: IMakerPathLine, origin: IMakerPoint) {

            var start = line.origin;
            var end = line.end;

            if (opts.useSvgPathOnly) {
                drawPath(line.id, start.x, start.y, [end.x, end.y]);
            } else {
                createElement(
                    "line",
                    {
                        "id": line.id,
                        "x1": start.x,
                        "y1": start.y,
                        "x2": end.x,
                        "y2": end.y
                    });
            }

            if (opts.annotate) {
                drawText(line.id, (start.x + end.x) / 2, (start.y + end.y) / 2);
            }
        };

        map[PathType.Circle] = function (circle: IMakerPathCircle, origin: IMakerPoint) {

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

                drawPath(circle.id, center.x, center.y, d);

            } else {
                createElement(
                    "circle",
                    {
                        "id": circle.id,
                        "r": circle.radius,
                        "cx": center.x,
                        "cy": center.y
                    });
            }

            if (opts.annotate) {
                drawText(circle.id, center.x, center.y);
            }
        };

        function svgArcData(d: any[], radius: number, endPoint: any, largeArc?: boolean, decreasing?: boolean) {
            var end: IMakerPoint = Point.Ensure(endPoint);
            d.push(radius, radius);
            d.push(0);                   //0 = x-axis rotation
            d.push(largeArc ? 1 : 0);    //large arc=1, small arc=0
            d.push(decreasing ? 0 : 1);  //sweep-flag 0=decreasing, 1=increasing 
            d.push(end.x, end.y);
        }

        map[PathType.Arc] = function (arc: IMakerPathArc, origin: IMakerPoint) {

            var arcPoints = Point.FromArc(arc);

            var d = ['A'];
            svgArcData(
                d,
                arc.radius,
                arcPoints[1],
                Math.abs(arc.endAngle - arc.startAngle) > 180,
                arc.startAngle > arc.endAngle
            );

            drawPath(arc.id, arcPoints[0].x, arcPoints[0].y, d);
        };

        var exporter = new Exporter(map, fixPoint, fixPath);
        exporter.exportItem(itemToExport, opts.origin);

        var svgTag = new XmlTag('svg');
        svgTag.innerText = elements.join('');
        svgTag.innerTextEscaped = true;
        return svgTag.ToString();
    }

    /**
     * SVG rendering options.
     */
    export interface ISVGRenderOptions {

        /**
         * SVG stroke width of paths.
         */
        strokeWidth: number;

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
        origin: IMakerPoint;

        /**
         * Use SVG <path> elements instead of <line>, <circle> etc.
         */
        useSvgPathOnly: boolean;
    }

} 
