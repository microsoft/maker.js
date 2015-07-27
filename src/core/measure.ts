/// <reference path="model.ts" />

module MakerJs.measure {

    /**
     * Interface to Math.min and Math.max functions.
     * 
     * @private
     */
    interface IMathMinMax {
        (...values: number[]): number;
    }

    /**
     * Total angle of an arc between its start and end angles.
     * 
     * @param arc The arc to measure.
     * @returns Angle of arc.
     */
    export function arcAngle(arc: IPathArc): number {
        var endAngle = angle.ofArcEnd(arc);
        return endAngle - arc.startAngle;
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

        var startAngle = arc.startAngle;
        var endAngle = angle.ofArcEnd(arc);

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
            if (!isBetween(round(pointInQuestion[i]), round(line.origin[i]), round(line.end[i]), exclusive)) return false;
        }
        return true;
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
     * Calculates the smallest rectangle which contains a path.
     * 
     * @param pathToMeasure The path to measure.
     * @returns object with low and high points.
     */
    export function pathExtents(pathToMeasure: IPath): IMeasure {
        var map: IPathFunctionMap = {};
        var measurement: IMeasure = { low: null, high: null };

        map[pathType.Line] = function (line: IPathLine) {
            measurement.low = getExtremePoint(line.origin, line.end, Math.min);
            measurement.high = getExtremePoint(line.origin, line.end, Math.max);
        }

        map[pathType.Circle] = function (circle: IPathCircle) {
            var r = circle.radius;
            measurement.low = point.add(circle.origin, [-r, -r]);
            measurement.high = point.add(circle.origin, [r, r]);
        }

        map[pathType.Arc] = function (arc: IPathArc) {
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

            measurement.low = extremeAngle([180, 270], -r, Math.min);
            measurement.high = extremeAngle([360, 90], r, Math.max);
        }

        if (pathToMeasure) {
            var fn = map[pathToMeasure.type];
            if (fn) {
                fn(pathToMeasure);
            }
        }

        return measurement;
    }

    /**
     * Measures the length of a path.
     * 
     * @param pathToMeasure The path to measure.
     * @returns Length of the path.
     */
    export function pathLength(pathToMeasure: IPath): number {
        var map: IPathFunctionMap = {};
        var value = 0;

        map[pathType.Line] = function (line: IPathLine) {
            value = pointDistance(line.origin, line.end);
        }

        map[pathType.Circle] = function (circle: IPathCircle) {
            value = 2 * Math.PI * circle.radius;
        }

        map[pathType.Arc] = function (arc: IPathArc) {
            map[pathType.Circle](arc); //this sets the value var
            var pct = arcAngle(arc) / 360;
            value *= pct;
        } 

        var fn = map[pathToMeasure.type];
        if (fn) {
            fn(pathToMeasure);
        }

        return value;
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

        function measure(model: IModel, offsetOrigin?: IPoint) {

            var newOrigin = point.add(model.origin, offsetOrigin);

            if (model.paths) {
                for (var id in model.paths) {
                    lowerOrHigher(newOrigin, pathExtents(model.paths[id]));
                }
            }

            if (model.models) {
                for (var id in model.models) {
                    measure(model.models[id], newOrigin);
                }
            }
        }

        measure(modelToMeasure);

        return totalMeasurement;
    }

}