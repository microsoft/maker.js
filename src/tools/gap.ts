/// <reference path="../core/maker.ts" />

module MakerJs.tools {

    /**
     * A path which has been broken.
     */
    export interface IBrokenPath {

        /**
         * The new path after breaking the source path.
         */
        newPath: IPath;

        /**
         * The point where the break ocurred.
         */
        newPoint: IPoint;
    }

    /**
     * @private
     */
    interface IBreakPathFunctionMap {
        [type: string]: (path: IPath, breakAt: number) => IBrokenPath[];
    }

    /**
     * @private
     */
    function midPoint(a: IPoint, b: IPoint, breakAt: number= .5): IPoint {
        var mp = [];

        for (var i = 0; i < 2; i++) {
            mp.push(a[i] + (b[i] - a[i]) * breakAt);
        }

        return mp;
    }

    /**
     * @private
     */
    var breakPathFunctionMap: IBreakPathFunctionMap = {};

    breakPathFunctionMap[pathType.Line] = function (line: IPathLine, breakAt: number): IBrokenPath[] {

        var breakPoint: IPoint = midPoint(line.origin, line.end, breakAt);

        var ret: IBrokenPath[] = [];

        function addLine(suffix: string, origin: IPoint, end: IPoint) {
            ret.push({
                newPath: new paths.Line(line.id + suffix, point.clone(origin), point.clone(end)),
                newPoint: point.clone(breakPoint)
            });
        }

        addLine("_1", line.origin, breakPoint);
        addLine("_2", breakPoint, line.end);

        return ret;
    };

    breakPathFunctionMap[pathType.Arc] = function (arc: IPathArc, breakAt: number): IBrokenPath[] {

        var breakAngle = measure.arcAngle(arc) * breakAt + arc.startAngle;

        if (breakAngle >= 360) {
            breakAngle -= 360;
        }

        var breakPoint = point.add(arc.origin, point.fromPolar(angle.toRadians(breakAngle), arc.radius));

        var ret: IBrokenPath[] = [];

        function addArc(suffix: string, startAngle: number, endAngle: number) {
            ret.push({
                newPath: new paths.Arc(arc.id + suffix, point.clone(arc.origin), arc.radius, startAngle, endAngle),
                newPoint: point.clone(breakPoint)
            });
        }

        addArc("_1", arc.startAngle, breakAngle);
        addArc("_2", breakAngle, arc.endAngle);

        return ret;
    };

    export function breakPath(path: IPath, breakAt: number= .5): IBrokenPath[] {

        var fn = breakPathFunctionMap[path.type];
        if (fn) {
            return fn(path, breakAt);
        }

        return null;
    }

    /**
     * Break a path and create a gap within it. Useful when connecting models together.
     * 
     * @param modelToGap Model which will have a gap in one of its paths.
     * @param pathId String id of the path in which to create a gap.
     * @param gapLength Number length of the gap.
     * @breakAt Number between 0 and 1 (default .5) where the gap will be centered along the path.
     */
    export function gapPath(modelToGap: IModel, pathId: string, gapLength: number, breakAt: number= .5): IPoint[] {

        var found = findById<IPath>(modelToGap.paths, pathId);

        if (!found) return null;

        modelToGap.paths.splice(found.index, 1); //remove the path from the array

        var foundPath = found.item;

        var halfGap = gapLength / 2;

        var ret: IPoint[] = [];

        function append(brokenPath: IBrokenPath, extraPoint?: IPoint) {
            modelToGap.paths.push(brokenPath.newPath);
            ret.push(brokenPath.newPoint);

            if (extraPoint) {
                ret.push(extraPoint);
            }
        }

        var map: IPathFunctionMap = {};

        map[pathType.Line] = function (line: IPathLine) {

            var firstBreak = breakPath(line, breakAt);

            function chop(line: IPathLine, start: boolean) {

                var len = measure.pathLength(line);

                if (halfGap < len) {

                    var chopDistance = start ? len - halfGap : halfGap;

                    var secondBreak = breakPath(line, chopDistance / len);

                    if (start) {
                        append(secondBreak[0]);
                    } else {
                        append(secondBreak[1]);
                    }
                } else {
                    if (start) {
                        ret.push(line.origin);
                    } else {
                        ret.push(line.end);
                    }                    
                }
            }

            chop(<IPathLine>firstBreak[0].newPath, true);
            chop(<IPathLine>firstBreak[1].newPath, false);
        };

        map[pathType.Circle] = function (circle: IPathCircle) {

            var breakAangle = 360 * breakAt;
            var halfGapAngle = angle.toDegrees(Math.asin(halfGap / circle.radius));

            var startAngle = breakAangle + halfGapAngle;
            var endAngle = breakAangle - halfGapAngle;

            var brokenPath = {
                newPath: new paths.Arc(circle.id + "_1", point.clone(circle.origin), circle.radius, startAngle, endAngle),
                newPoint: point.add(circle.origin, point.fromPolar(angle.toRadians(startAngle), circle.radius))
            };

            append(brokenPath, point.add(circle.origin, point.fromPolar(angle.toRadians(endAngle), circle.radius)));
        };

        map[pathType.Arc] = function (arc: IPathArc) {

            var firstBreak = breakPath(arc, breakAt);
            var halfGapAngle = angle.toDegrees(Math.asin(halfGap / arc.radius));

            function chop(chopArc: IPathArc, start: boolean) {

                var totalAngle = measure.arcAngle(chopArc);

                if (halfGapAngle < totalAngle) {

                    var chopDistance = start ? totalAngle - halfGapAngle : halfGapAngle;

                    var secondBreak = breakPath(chopArc, chopDistance / totalAngle);

                    if (start) {
                        append(secondBreak[0]);
                    } else {
                        append(secondBreak[1]);
                    }
                } else {

                    var arcPoints = point.fromArc(arc);

                    if (start) {
                        ret.push(arcPoints[0]);
                    } else {
                        ret.push(arcPoints[1]);
                    }
                }
            }

            chop(<IPathArc>firstBreak[0].newPath, true);
            chop(<IPathArc>firstBreak[1].newPath, false);
        };

        var fn = map[foundPath.type];
        if (fn) {
            fn(foundPath);
        }

        return ret;
    }

    /**
     * Given 2 pairs of points, will return lines that connect the first pair to the second.
     * 
     * @param gap1 First array of 2 point objects.
     * @param gap2 Second array of 2 point objects.
     * @returns Array containing 2 lines.
     */
    export function bridgeGaps(gap1: IPoint[], gap2: IPoint[]): IPathLine[]{
        var lines: IPathLine[] = [];

        for (var i = 2; i--;) {
            lines.push(new paths.Line('bridge' + i, gap1[i], gap2[i]));
        }

        if (pathIntersection(lines[0], lines[1])) {
            //swap endpoints
            for (var i = 2; i--;) {
                lines[i].end = gap2[i];
            }
        }

        return lines;
    }
}
