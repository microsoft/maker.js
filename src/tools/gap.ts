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

    breakPathFunctionMap[pathType.Line] = function (line: IMakerPathLine, breakAt: number): IMakerBrokenPath[] {

        var breakPoint: IMakerPoint = midPoint(line.origin, line.end, breakAt);

        var ret: IMakerBrokenPath[] = [];

        function addLine(suffix: string, origin: IMakerPoint, end: IMakerPoint) {
            ret.push({
                newPath: createLine(line.id + suffix, point.clone(origin), point.clone(end)),
                newPoint: point.clone(breakPoint)
            });
        }

        addLine("_1", line.origin, breakPoint);
        addLine("_2", breakPoint, line.end);

        return ret;
    };

    breakPathFunctionMap[pathType.Arc] = function (arc: IMakerPathArc, breakAt: number): IMakerBrokenPath[] {

        var breakAngle = measure.arcAngle(arc) * breakAt + arc.startAngle;

        if (breakAngle >= 360) {
            breakAngle -= 360;
        }

        var breakPoint = point.add(arc.origin, point.fromPolar(angle.toRadians(breakAngle), arc.radius));

        var ret: IMakerBrokenPath[] = [];

        function addArc(suffix: string, startAngle: number, endAngle: number) {
            ret.push({
                newPath: createArc(arc.id + suffix, point.clone(arc.origin), arc.radius, startAngle, endAngle),
                newPoint: point.clone(breakPoint)
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

        var found = findById<IMakerPath>(modelToGap.paths, pathId);

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

        map[pathType.Line] = function (line: IMakerPathLine) {

            var firstBreak = breakPath(line, breakAt);

            function chop(line: IMakerPathLine, start: boolean) {

                var len = measure.pathLength(line);

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

        map[pathType.Circle] = function (circle: IMakerPathCircle) {

            var breakAangle = 360 * breakAt;
            var halfGapAngle = angle.toDegrees(Math.asin(halfGap / circle.radius));

            var startAngle = breakAangle + halfGapAngle;
            var endAngle = breakAangle - halfGapAngle;

            var brokenPath = {
                newPath: createArc(circle.id + "_1", point.clone(circle.origin), circle.radius, startAngle, endAngle),
                newPoint: point.add(circle.origin, point.fromPolar(angle.toRadians(startAngle), circle.radius))
            };

            append(brokenPath, point.add(circle.origin, point.fromPolar(angle.toRadians(endAngle), circle.radius)));
        };

        map[pathType.Arc] = function (arc: IMakerPathArc) {

            var firstBreak = breakPath(arc, breakAt);
            var halfGapAngle = angle.toDegrees(Math.asin(halfGap / arc.radius));

            function chop(arc: IMakerPathArc, start: boolean) {

                var totalAngle = measure.arcAngle(arc);

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
