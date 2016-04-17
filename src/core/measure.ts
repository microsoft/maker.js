namespace MakerJs.measure {

    /**
     * Interface to Math.min and Math.max functions.
     * 
     * @private
     */
    interface IMathMinMax {
        (...values: number[]): number;
    }

    /**
     * Check for arc being concave or convex towards a given point.
     * 
     * @param arc The arc to test.
     * @param towardsPoint The point to test.
     * @returns Boolean true if arc is concave towards point.
     */
    export function isArcConcaveTowardsPoint(arc: IPathArc, towardsPoint: IPoint): boolean {

        if (pointDistance(arc.origin, towardsPoint) <= arc.radius) {
            return true;
        }

        var midPointToNearPoint = new paths.Line(point.middle(arc), towardsPoint);
        var options: IPathIntersectionOptions = {};
        var intersectionPoint = path.intersection(midPointToNearPoint, new paths.Chord(arc), options);

        if (intersectionPoint || options.out_AreOverlapped) {
            return true;
        }

        return false;
    }

    /**
     * Check for arc overlapping another arc.
     * 
     * @param arc1 The arc to test.
     * @param arc2 The arc to check for overlap.
     * @param excludeTangents Boolean to exclude exact endpoints and only look for deep overlaps.
     * @returns Boolean true if arc1 is overlapped with arc2.
     */
    export function isArcOverlapping(arc1: IPathArc, arc2: IPathArc, excludeTangents: boolean): boolean {
        var pointsOfIntersection: IPoint[] = [];

        function checkAngles(a: IPathArc, b: IPathArc) {

            function checkAngle(n: number) {
                return measure.isBetweenArcAngles(n, a, excludeTangents);
            }

            return checkAngle(b.startAngle) || checkAngle(b.endAngle);
        }

        return checkAngles(arc1, arc2) || checkAngles(arc2, arc1) || (arc1.startAngle == arc2.startAngle && arc1.endAngle == arc2.endAngle);
    }


    /**
     * Check if a given number is between two given limits.
     * 
     * @param valueInQuestion The number to test.
     * @param limit1 First limit.
     * @param limit2 Second limit.
     * @param exclusive Flag to exclude equaling the limits.
     * @returns Boolean true if value is between (or equal to) the limits.
     */
    export function isBetween(valueInQuestion: number, limit1: number, limit2: number, exclusive: boolean): boolean {
        if (exclusive) {
            return Math.min(limit1, limit2) < valueInQuestion && valueInQuestion < Math.max(limit1, limit2);
        } else {
            return Math.min(limit1, limit2) <= valueInQuestion && valueInQuestion <= Math.max(limit1, limit2);
        }
    }

    /**
     * Check if a given angle is between an arc's start and end angles.
     * 
     * @param angleInQuestion The angle to test.
     * @param arc Arc to test against.
     * @param exclusive Flag to exclude equaling the start or end angles.
     * @returns Boolean true if angle is between (or equal to) the arc's start and end angles.
     */
    export function isBetweenArcAngles(angleInQuestion: number, arc: IPathArc, exclusive: boolean): boolean {

        var startAngle = angle.noRevolutions(arc.startAngle);
        var span = angle.ofArcSpan(arc);
        var endAngle = startAngle + span;

        angleInQuestion = angle.noRevolutions(angleInQuestion);

        //computed angles will not be negative, but the arc may have specified a negative angle, so check against one revolution forward and backward
        return (isBetween(angleInQuestion, startAngle, endAngle, exclusive) || isBetween(angleInQuestion, startAngle + 360, endAngle + 360, exclusive) || isBetween(angleInQuestion, startAngle - 360, endAngle - 360, exclusive))
    }

    /**
     * Check if a given point is between a line's end points.
     * 
     * @param pointInQuestion The point to test.
     * @param line Line to test against.
     * @param exclusive Flag to exclude equaling the origin or end points.
     * @returns Boolean true if point is between (or equal to) the line's origin and end points.
     */
    export function isBetweenPoints(pointInQuestion: IPoint, line: IPathLine, exclusive: boolean): boolean {
        for (var i = 2; i--;) {
            if (round(line.origin[i] - line.end[i], .000001) == 0) {
                continue;
            }
            var origin_value = round(line.origin[i]);
            var end_value = round(line.end[i]);
            if (!isBetween(round(pointInQuestion[i]), origin_value, end_value, exclusive)) return false;
        }
        return true;
    }

    /**
     * Check for line overlapping another line.
     * 
     * @param line1 The line to test.
     * @param line2 The line to check for overlap.
     * @param excludeTangents Boolean to exclude exact endpoints and only look for deep overlaps.
     * @returns Boolean true if line1 is overlapped with line2.
     */
    export function isLineOverlapping(line1: IPathLine, line2: IPathLine, excludeTangents: boolean): boolean {
        var pointsOfIntersection: IPoint[] = [];

        function checkPoints(index: number, a: IPathLine, b: IPathLine) {

            function checkPoint(p: IPoint) {
                return measure.isBetweenPoints(p, a, excludeTangents);
            }

            return checkPoint(b.origin) || checkPoint(b.end);
        }

        return checkPoints(0, line1, line2) || checkPoints(1, line2, line1);
    }

    /**
     * Gets the slope of a line.
     */
    export function lineSlope(line: IPathLine): ISlope {
        var dx = line.end[0] - line.origin[0];
        if (round(dx) == 0) {
            return {
                line: line,
                hasSlope: false
            };
        }

        var dy = line.end[1] - line.origin[1];

        var slope = dy / dx;
        var yIntercept = line.origin[1] - slope * line.origin[0];

        return {
            line: line,
            hasSlope: true,
            slope: slope,
            yIntercept: yIntercept
        };
    }

    /**
     * Calculates the distance between two points.
     * 
     * @param a First point.
     * @param b Second point.
     * @returns Distance between points.
     */
    export function pointDistance(a: IPoint, b: IPoint): number {
        var dx = b[0] - a[0];
        var dy = b[1] - a[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * @private
     */
    function getExtremePoint(a: IPoint, b: IPoint, fn: IMathMinMax): IPoint {
        return [
            fn(a[0], b[0]),
            fn(a[1], b[1])
        ];
    }

    /**
     * @private
     */
    var pathExtentsMap: { [pathType: string]: (pathToMeasure: IPath) => IMeasure } = {};

    pathExtentsMap[pathType.Line] = function (line: IPathLine) {
        return {
            low: getExtremePoint(line.origin, line.end, Math.min),
            high: getExtremePoint(line.origin, line.end, Math.max)
        }
    }

    pathExtentsMap[pathType.Circle] = function (circle: IPathCircle) {
        var r = circle.radius;
        return {
            low: point.add(circle.origin, [-r, -r]),
            high: point.add(circle.origin, [r, r])
        }
    }

    pathExtentsMap[pathType.Arc] = function (arc: IPathArc) {
        var r = arc.radius;
        var arcPoints = point.fromArc(arc);

        function extremeAngle(xyAngle: number[], value: number, fn: IMathMinMax): IPoint {
            var extremePoint = getExtremePoint(arcPoints[0], arcPoints[1], fn);

            for (var i = 2; i--;) {
                if (isBetweenArcAngles(xyAngle[i], arc, false)) {
                    extremePoint[i] = value + arc.origin[i];
                }
            }

            return extremePoint;
        }

        return {
            low: extremeAngle([180, 270], -r, Math.min),
            high: extremeAngle([360, 90], r, Math.max)
        }
    }

    /**
     * Calculates the smallest rectangle which contains a path.
     * 
     * @param pathToMeasure The path to measure.
     * @returns object with low and high points.
     */
    export function pathExtents(pathToMeasure: IPath): IMeasure {

        if (pathToMeasure) {
            var fn = pathExtentsMap[pathToMeasure.type];
            if (fn) {
                return fn(pathToMeasure);
            }
        }

        return { low: null, high: null };
    }

    /**
     * @private
     */
    var pathLengthMap: { [pathType: string]: (pathToMeasure: IPath) => number } = {};

    pathLengthMap[pathType.Line] = function (line: IPathLine) {
        return pointDistance(line.origin, line.end);
    }

    pathLengthMap[pathType.Circle] = function (circle: IPathCircle) {
        return 2 * Math.PI * circle.radius;
    }

    pathLengthMap[pathType.Arc] = function (arc: IPathArc) {
        var value = pathLengthMap[pathType.Circle](arc);
        var pct = angle.ofArcSpan(arc) / 360;
        value *= pct;
        return value;
    }

    /**
     * Measures the length of a path.
     * 
     * @param pathToMeasure The path to measure.
     * @returns Length of the path.
     */
    export function pathLength(pathToMeasure: IPath): number {

        if (pathToMeasure) {
            var fn = pathLengthMap[pathToMeasure.type];
            if (fn) {
                return fn(pathToMeasure);
            }
        }

        return 0;
    }

    /**
     * Measures the smallest rectangle which contains a model.
     * 
     * @param modelToMeasure The model to measure.
     * @returns object with low and high points.
     */
    export function modelExtents(modelToMeasure: IModel): IMeasure {
        var totalMeasurement: IMeasure = { low: [null, null], high: [null, null] };

        function lowerOrHigher(offsetOrigin: IPoint, pathMeasurement: IMeasure) {

            function getExtreme(a: IPoint, b: IPoint, fn: IMathMinMax) {
                var c = point.add(b, offsetOrigin);
                for (var i = 2; i--;) {
                    a[i] = (a[i] == null ? c[i] : fn(a[i], c[i]));
                }
            }

            getExtreme(totalMeasurement.low, pathMeasurement.low, Math.min);
            getExtreme(totalMeasurement.high, pathMeasurement.high, Math.max);
        }

        function measure(modelToMeasure: IModel, offsetOrigin?: IPoint) {
            if (!modelToMeasure) return;

            var newOrigin = point.add(modelToMeasure.origin, offsetOrigin);

            if (modelToMeasure.paths) {
                for (var id in modelToMeasure.paths) {
                    lowerOrHigher(newOrigin, pathExtents(modelToMeasure.paths[id]));
                }
            }

            if (modelToMeasure.models) {
                for (var id in modelToMeasure.models) {
                    measure(modelToMeasure.models[id], newOrigin);
                }
            }
        }

        measure(modelToMeasure);

        return totalMeasurement;
    }

}