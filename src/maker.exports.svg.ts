module Maker.Exports {

    export function SVG(model: IMakerModel, options?: ISVGRenderOptions): string;
    export function SVG(paths: IMakerPath[], options?: ISVGRenderOptions): string;
    export function SVG(path: IMakerPath, options?: ISVGRenderOptions): string;
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

        function fixPoint(point: IMakerPoint): IMakerPoint {
            var p = Maker.Point.Ensure(point);
            return {
                x: p.x * opts.scale,
                y: -p.y * opts.scale  //in DXF Y increases upward. in SVG, Y increases downward

            };
        }

        function convertArcYAxis(arc: IMakerPathArc): IMakerPathArc {

            function invertAngleOnYAxis(angle: number) {
                return 360 - angle;
            }

            var newArc = Path.CreateArc(
                arc.id,
                fixPoint(arc.origin),
                arc.radius * opts.scale,
                invertAngleOnYAxis(arc.startAngle),
                invertAngleOnYAxis(Maker.Angle.ArcEndAnglePastZero(arc))
            );

            return newArc;
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

        map[Maker.PathType.Line] = function (line: IMakerPathLine, origin: IMakerPoint) {
            var start = Maker.Point.Add(fixPoint(line.origin), origin);
            var end = Maker.Point.Add(fixPoint(line.end), origin);

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

        map[Maker.PathType.Circle] = function (circle: IMakerPathCircle, origin: IMakerPoint) {
            var center = Maker.Point.Add(fixPoint(circle.origin), origin);

            if (opts.useSvgPathOnly) {

                var r = circle.radius * opts.scale;
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
                        "r": circle.radius * opts.scale,
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

        map[Maker.PathType.Arc] = function (rawArc: IMakerPathArc, origin: IMakerPoint) {

            function getPointFromAngle(angle: number) {
                return Point.AddArray(
                    arc.origin,
                    Point.FromPolar(Angle.ToRadians(angle), arc.radius),
                    origin
                );
            }

            var arc = convertArcYAxis(rawArc);

            var startPoint = getPointFromAngle(arc.startAngle);
            var endPoint = getPointFromAngle(arc.endAngle);
            var d = ['A'];
            svgArcData(
                d,
                arc.radius,
                endPoint,
                Math.abs(arc.endAngle - arc.startAngle) > 180,
                arc.startAngle > arc.endAngle
            );

            drawPath(arc.id, startPoint.x, startPoint.y, d);
        };

        var exporter = new Exporter(map, fixPoint);
        exporter.exportItem(itemToExport, opts.origin);

        var svgTag = new XmlTag('svg');
        svgTag.innerText = elements.join('');
        svgTag.innerTextEscaped = true;
        return svgTag.ToString();
    }

    export interface ISVGRenderOptions {
        strokeWidth: number;
        stroke: string;
        scale: number;
        annotate: boolean;
        origin: IMakerPoint;
        useSvgPathOnly: boolean;
    }

} 
