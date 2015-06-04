/// <reference path="model.ts" />

module makerjs.measure {

    /**
     * Interface to Math.min and Math.max functions.
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
    export function arcAngle(arc: IMakerPathArc): number {
        var endAngle = angle.arcEndAnglePastZero(arc);
        return endAngle - arc.startAngle;
    }

    /**
     * Calculates the distance between two points.
     * 
     * @param a First point.
     * @param b Second point.
     * @returns Distance between points.
     */
    export function pointDistance(a: IMakerPoint, b: IMakerPoint): number {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getExtremePoint(a: IMakerPoint, b: IMakerPoint, fn: IMathMinMax): IMakerPoint {
        return {
            x: fn(a.x, b.x),
            y: fn(a.y, b.y)
        };
    }

    /**
     * Calculates the smallest rectangle which contains a path.
     * 
     * @param pathToMeasure The path to measure.
     * @returns object with low and high points.
     */
    export function pathExtents(pathToMeasure: IMakerPath): IMakerMeasure {
        var map: IMakerPathFunctionMap = {};
        var measurement: IMakerMeasure = { low: null, high: null };

        map[pathType.Line] = function (line: IMakerPathLine) {
            measurement.low = getExtremePoint(line.origin, line.end, Math.min);
            measurement.high = getExtremePoint(line.origin, line.end, Math.max);
        }

        map[pathType.Circle] = function (circle: IMakerPathCircle) {
            var r = circle.radius;
            measurement.low = point.add(circle.origin, { x: -r, y: -r });
            measurement.high = point.add(circle.origin, { x: r, y: r });
        }

        map[pathType.Arc] = function (arc: IMakerPathArc) {
            var r = arc.radius;
            var startPoint = point.fromPolar(angle.toRadians(arc.startAngle), r);
            var endPoint = point.fromPolar(angle.toRadians(arc.endAngle), r);

            var startAngle = arc.startAngle;
            var endAngle = angle.arcEndAnglePastZero(arc);

            if (startAngle < 0) {
                startAngle += 360;
                endAngle += 360;
            }

            function extremeAngle(xAngle: number, yAngle: number, value: number, fn: IMathMinMax): IMakerPoint {
                var extremePoint = getExtremePoint(startPoint, endPoint, fn);

                if (startAngle < xAngle && xAngle < endAngle) {
                    extremePoint.x = value;
                }

                if (startAngle < yAngle && yAngle < endAngle) {
                    extremePoint.y = value;
                }

                return point.add(arc.origin, extremePoint);
            }

            measurement.low = extremeAngle(180, 270, -r, Math.min);
            measurement.high = extremeAngle(360, 90, r, Math.max);
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
    export function pathLength(pathToMeasure: IMakerPath): number {
        var map: IMakerPathFunctionMap = {};
        var value = 0;

        map[pathType.Line] = function (line: IMakerPathLine) {
            value = pointDistance(line.origin, line.end);
        }

        map[pathType.Circle] = function (circle: IMakerPathCircle) {
            value = 2 * Math.PI * circle.radius;
        }

        map[pathType.Arc] = function (arc: IMakerPathArc) {
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
    export function modelExtents(modelToMeasure: IMakerModel): IMakerMeasure {
        var totalMeasurement: IMakerMeasure = { low: { x: null, y: null }, high: { x: null, y: null } };

        function lowerOrHigher(offsetOrigin: IMakerPoint, pathMeasurement: IMakerMeasure) {

            function getExtreme(a: IMakerPoint, b: IMakerPoint, fn: IMathMinMax) {
                var c = point.add(b, offsetOrigin);
                a.x = (a.x == null ? c.x : fn(a.x, c.x));
                a.y = (a.y == null ? c.y : fn(a.y, c.y));
            }

            getExtreme(totalMeasurement.low, pathMeasurement.low, Math.min);
            getExtreme(totalMeasurement.high, pathMeasurement.high, Math.max);
        }

        function measure(model: IMakerModel, offsetOrigin?: IMakerPoint) {

            var newOrigin = point.add(model.origin, offsetOrigin);

            if (model.paths) {
                for (var i = 0; i < model.paths.length; i++) {
                    lowerOrHigher(newOrigin, pathExtents(model.paths[i]));
                }
            }

            if (model.models) {
                for (var i = 0; i < model.models.length; i++) {
                    measure(model.models[i], newOrigin);
                }
            }
        }

        measure(modelToMeasure);

        return totalMeasurement;
    }

}