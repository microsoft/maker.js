/// <reference path="../core/maker.ts" />

module Maker.Tools {

    interface IMakerBrokenPath {
        path: IMakerPath;
        newPoint: IMakerPoint;
    }

    interface IMakerBreakPathFunctionMap {
        [type: string]: (path: IMakerPath, breakAt: number) => IMakerBrokenPath[];
    }

    function midPoint(a: IMakerPoint, b: IMakerPoint, breakAt: number= .5): IMakerPoint {
        return {
            x: a.x + (b.x - a.x) * breakAt,
            y: a.y + (b.y - a.y) * breakAt,
        };
    }

    var breakPathFunctionMap: IMakerBreakPathFunctionMap = {};

    breakPathFunctionMap[PathType.Line] = function (line: IMakerPathLine, breakAt: number): IMakerBrokenPath[] {

        var breakPoint: IMakerPoint = midPoint(line.origin, line.end, breakAt);

        var ret: IMakerBrokenPath[] = [];

        function addLine(suffix: string, origin: IMakerPoint, end: IMakerPoint) {
            ret.push({
                path: Path.CreateLine(line.id + suffix, Point.Clone(origin), Point.Clone(end)),
                newPoint: Point.Clone(breakPoint)
            });
        }

        addLine("_1", line.origin, breakPoint);
        addLine("_2", breakPoint, line.end);

        return ret;
    };

    breakPathFunctionMap[PathType.Arc] = function (arc: IMakerPathArc, breakAt: number): IMakerBrokenPath[] {

        var breakAngle = Measure.ArcAngle(arc) * breakAt + arc.startAngle;

        if (breakAngle >= 360) {
            breakAngle -= 360;
        }

        var breakPoint = Point.Add(arc.origin, Point.FromPolar(Angle.ToRadians(breakAngle), arc.radius));

        var ret: IMakerBrokenPath[] = [];

        function addArc(suffix: string, startAngle: number, endAngle: number) {
            ret.push({
                path: Path.CreateArc(arc.id + suffix, Point.Clone(arc.origin), arc.radius, startAngle, endAngle),
                newPoint: Point.Clone(breakPoint)
            });
        }

        addArc("_1", arc.startAngle, breakAngle);
        addArc("_2", breakAngle, arc.endAngle);

        return ret;
    };

    function breakPath(path: IMakerPath, breakAt: number= .5): IMakerBrokenPath[] {

        var fn = breakPathFunctionMap[path.type];
        if (fn) {
            return fn(path, breakAt);
        }

        return null;
    }

    export function GapPath(model: IMakerModel, pathId: string, gapLength: number, breakAt: number= .5): IMakerPoint[] {

        var found = FindById<IMakerPath>(model.paths, pathId);

        if (!found) return null;

        model.paths.splice(found.index, 1); //remove the path from the array

        var path = found.item;

        var halfGap = gapLength / 2;

        var ret: IMakerPoint[] = [];

        function append(brokenPath: IMakerBrokenPath, extraPoint?: IMakerPoint) {
            model.paths.push(brokenPath.path);
            ret.push(brokenPath.newPoint);

            if (extraPoint) {
                ret.push(extraPoint);
            }
        }

        var map: IMakerPathFunctionMap = {};

        map[PathType.Line] = function (line: IMakerPathLine) {

            var firstBreak = breakPath(line, breakAt);

            function chop(line: IMakerPathLine, start: boolean) {

                var len = Measure.PathLength(line);

                if (halfGap < len) {

                    var chopDistance = start ? len - halfGap : halfGap;

                    var secondBreak = breakPath(line, chopDistance / len);

                    if (start) {
                        append(secondBreak[0]);
                    } else {
                        append(secondBreak[1]);
                    }
                } //todo add point else
            }

            chop(<IMakerPathLine>firstBreak[0].path, true);
            chop(<IMakerPathLine>firstBreak[1].path, false);
        };

        map[PathType.Circle] = function (circle: IMakerPathCircle) {

            var angle = 360 * breakAt;
            var halfGapAngle = Angle.FromRadians(Math.asin(halfGap / circle.radius));

            var startAngle = angle + halfGapAngle;
            var endAngle = angle - halfGapAngle;

            var brokenPath = {
                path: Path.CreateArc(circle.id + "_1", Point.Clone(circle.origin), circle.radius, startAngle, endAngle),
                newPoint: Point.Add(circle.origin, Point.FromPolar(Angle.ToRadians(startAngle), circle.radius))
            };

            append(brokenPath, Point.Add(circle.origin, Point.FromPolar(Angle.ToRadians(endAngle), circle.radius)));
        };

        map[PathType.Arc] = function (arc: IMakerPathArc) {

            var firstBreak = breakPath(arc, breakAt);
            var halfGapAngle = Angle.FromRadians(Math.asin(halfGap / arc.radius));

            function chop(arc: IMakerPathArc, start: boolean) {

                var totalAngle = Measure.ArcAngle(arc);

                if (halfGapAngle < totalAngle) {

                    var chopDistance = start ? totalAngle - halfGapAngle : halfGapAngle;

                    var secondBreak = breakPath(arc, chopDistance / totalAngle);

                    if (start) {
                        append(secondBreak[0]);
                    } else {
                        append(secondBreak[1]);
                    }
                }  //todo add point else
            }

            chop(<IMakerPathArc>firstBreak[0].path, true);
            chop(<IMakerPathArc>firstBreak[1].path, false);
        };

        var fn = map[path.type];
        if (fn) {
            fn(path);
        }

        return ret;
    }

}
