/// <reference path="../core/maker.ts" />

module makerjs.Tools {

    interface IMakerBrokenPath {
        newPath: IMakerPath;
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
                newPath: path.CreateLine(line.id + suffix, point.Clone(origin), point.Clone(end)),
                newPoint: point.Clone(breakPoint)
            });
        }

        addLine("_1", line.origin, breakPoint);
        addLine("_2", breakPoint, line.end);

        return ret;
    };

    breakPathFunctionMap[PathType.Arc] = function (arc: IMakerPathArc, breakAt: number): IMakerBrokenPath[] {

        var breakAngle = measure.ArcAngle(arc) * breakAt + arc.startAngle;

        if (breakAngle >= 360) {
            breakAngle -= 360;
        }

        var breakPoint = point.Add(arc.origin, point.FromPolar(angle.ToRadians(breakAngle), arc.radius));

        var ret: IMakerBrokenPath[] = [];

        function addArc(suffix: string, startAngle: number, endAngle: number) {
            ret.push({
                newPath: path.CreateArc(arc.id + suffix, point.Clone(arc.origin), arc.radius, startAngle, endAngle),
                newPoint: point.Clone(breakPoint)
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

    export function GapPath(modelToGap: IMakerModel, pathId: string, gapLength: number, breakAt: number= .5): IMakerPoint[] {

        var found = FindById<IMakerPath>(modelToGap.paths, pathId);

        if (!found) return null;

        modelToGap.paths.splice(found.index, 1); //remove the path from the array

        var foundPath = found.item;

        var halfGap = gapLength / 2;

        var ret: IMakerPoint[] = [];

        function append(brokenPath: IMakerBrokenPath, extraPoint?: IMakerPoint) {
            modelToGap.paths.push(brokenPath.newPath);
            ret.push(brokenPath.newPoint);

            if (extraPoint) {
                ret.push(extraPoint);
            }
        }

        var map: IMakerPathFunctionMap = {};

        map[PathType.Line] = function (line: IMakerPathLine) {

            var firstBreak = breakPath(line, breakAt);

            function chop(line: IMakerPathLine, start: boolean) {

                var len = measure.PathLength(line);

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

            chop(<IMakerPathLine>firstBreak[0].newPath, true);
            chop(<IMakerPathLine>firstBreak[1].newPath, false);
        };

        map[PathType.Circle] = function (circle: IMakerPathCircle) {

            var breakAangle = 360 * breakAt;
            var halfGapAngle = angle.FromRadians(Math.asin(halfGap / circle.radius));

            var startAngle = breakAangle + halfGapAngle;
            var endAngle = breakAangle - halfGapAngle;

            var brokenPath = {
                newPath: path.CreateArc(circle.id + "_1", point.Clone(circle.origin), circle.radius, startAngle, endAngle),
                newPoint: point.Add(circle.origin, point.FromPolar(angle.ToRadians(startAngle), circle.radius))
            };

            append(brokenPath, point.Add(circle.origin, point.FromPolar(angle.ToRadians(endAngle), circle.radius)));
        };

        map[PathType.Arc] = function (arc: IMakerPathArc) {

            var firstBreak = breakPath(arc, breakAt);
            var halfGapAngle = angle.FromRadians(Math.asin(halfGap / arc.radius));

            function chop(arc: IMakerPathArc, start: boolean) {

                var totalAngle = measure.ArcAngle(arc);

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

            chop(<IMakerPathArc>firstBreak[0].newPath, true);
            chop(<IMakerPathArc>firstBreak[1].newPath, false);
        };

        var fn = map[foundPath.type];
        if (fn) {
            fn(foundPath);
        }

        return ret;
    }

}
