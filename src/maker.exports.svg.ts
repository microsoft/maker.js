module Maker.Exports {

    export function SVG(model: IMakerModel, options?: ISVGRenderOptions): string;
    export function SVG(paths: IMakerPath[], options?: ISVGRenderOptions): string;
    export function SVG(path: IMakerPath, options?: ISVGRenderOptions): string;
    export function SVG(item: any, options?: ISVGRenderOptions): string {

        options = options || {
            annotate: false,
            scale: 100,
            stroke: "blue",
            strokeWidth: 2,
            origin: { x: 50, y: 300 },
            useSvgPathOnly: false
        };

        var elements: string[] = [];

        function fixPoint(p: IMakerPoint): IMakerPoint {
            return {
                x: p.x * options.scale,
                y: -p.y * options.scale  //in DXF Y increases upward. in SVG, Y increases downward

            };
        }

        function convertArcYAxis(arc: IMakerPathArc): IMakerPathArc {

            function invertAngleOnYAxis(angle: number) {
                return 360 - angle;
            }

            var newArc = Path.CreateArc(
                arc.id,
                fixPoint(arc.origin),
                arc.radius * options.scale,
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
                tag.attrs["stroke"] = options.stroke;
                tag.attrs["stroke-width"] = options.strokeWidth;
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

            if (options.annotate) {
                drawText(id, x, y);
            }
        }

        var map: IMakerPathOriginFunctionMap = {};

        map[Maker.PathType.Line] = function (line: IMakerPathLine, origin: IMakerPoint) {
            var start = Maker.Point.Add(fixPoint(line.origin), origin);
            var end = Maker.Point.Add(fixPoint(line.end), origin);

            if (options.useSvgPathOnly) {
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

            if (options.annotate) {
                drawText(line.id, (start.x + end.x) / 2, (start.y + end.y) / 2);
            }
        };

        map[Maker.PathType.Circle] = function (circle: IMakerPathCircle, origin: IMakerPoint) {
            var center = Maker.Point.Add(fixPoint(circle.origin), origin);

            if (options.useSvgPathOnly) {

                var r = circle.radius * options.scale;
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
                        "r": circle.radius * options.scale,
                        "cx": center.x,
                        "cy": center.y
                    });
            }

            if (options.annotate) {
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

        function exportPath(path: IMakerPath, origin: IMakerPoint): void {
            var fn = map[path.type];
            if (fn) {
                fn(path, origin);
            }
        }

        function exportPaths(paths: IMakerPath[], origin: IMakerPoint): void {
            for (var i = 0; i < paths.length; i++) {
                exportPath(paths[i], origin);
            }
        }

        function exportModel(model: IMakerModel, origin: IMakerPoint) {

            var newOrigin = Maker.Point.Add(fixPoint(Maker.Point.Ensure(model.origin)), origin);

            if (model.paths) {
                exportPaths(model.paths, newOrigin);
            }

            if (model.models) {
                for (var i = 0; i < model.models.length; i++) {
                    exportModel(model.models[i], newOrigin);
                }
            }
        }

        if (IsModel(item)) {
            exportModel(<IMakerModel>item, options.origin);
        } else if (IsArray(item)) {
            exportPaths(<IMakerPath[]>item, options.origin);
        } else if (IsPath(item)) {
            exportPath(<IMakerPath>item, options.origin);
        }

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
