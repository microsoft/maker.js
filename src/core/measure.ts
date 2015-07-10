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
            var startPoint = point.fromPolar(angle.toRadians(arc.startAngle), r);
            var endPoint = point.fromPolar(angle.toRadians(arc.endAngle), r);

            var startAngle = arc.startAngle;
            var endAngle = angle.ofArcEnd(arc);

            if (startAngle < 0) {
                startAngle += 360;
                endAngle += 360;
            }

            function extremeAngle(xyAngle: number[], value: number, fn: IMathMinMax): IPoint {
                var extremePoint = getExtremePoint(startPoint, endPoint, fn);

                for (var i = 2; i--;) {
                    if (startAngle < xyAngle[i] && xyAngle[i] < endAngle) {
                        extremePoint[i] = value;
                    }
                }

                return point.add(arc.origin, extremePoint);
            }

            measurement.low = extremeAngle([180, 270], -r, Math.min);
            measurement.high = extremeAngle([360, 90], r, Math.max);
        }

        var fn = map[pathToMeasure.type];
        if (fn) {
            fn(pathToMeasure);
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