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
    export function ArcAngle(arc: IMakerPathArc): number {
        var endAngle = angle.ArcEndAnglePastZero(arc);
        return endAngle - arc.startAngle;
    }

    /**
     * Calculates the distance between two points.
     * 
     * @param a First point.
     * @param b Second point.
     * @returns Distance between points.
     */
    export function PointDistance(a: IMakerPoint, b: IMakerPoint): number {
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
    export function PathExtents(pathToMeasure: IMakerPath): IMakerMeasure {
        var map: IMakerPathFunctionMap = {};
        var measurement: IMakerMeasure = { low: null, high: null };

        map[PathType.Line] = function (line: IMakerPathLine) {
            measurement.low = getExtremePoint(line.origin, line.end, Math.min);
            measurement.high = getExtremePoint(line.origin, line.end, Math.max);
        }

        map[PathType.Circle] = function (circle: IMakerPathCircle) {
            var r = circle.radius;
            measurement.low = Point.Add(circle.origin, { x: -r, y: -r });
            measurement.high = Point.Add(circle.origin, { x: r, y: r });
        }

        map[PathType.Arc] = function (arc: IMakerPathArc) {
            var r = arc.radius;
            var startPoint = Point.FromPolar(angle.ToRadians(arc.startAngle), r);
            var endPoint = Point.FromPolar(angle.ToRadians(arc.endAngle), r);

            var startAngle = arc.startAngle;
            var endAngle = angle.ArcEndAnglePastZero(arc);

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

                return Point.Add(arc.origin, extremePoint);
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
    export function PathLength(pathToMeasure: IMakerPath): number {
        var map: IMakerPathFunctionMap = {};
        var value = 0;

        map[PathType.Line] = function (line: IMakerPathLine) {
            value = PointDistance(line.origin, line.end);
        }

        map[PathType.Circle] = function (circle: IMakerPathCircle) {
            value = 2 * Math.PI * circle.radius;
        }

        map[PathType.Arc] = function (arc: IMakerPathArc) {
            map[PathType.Circle](arc); //this sets the value var
            var pct = ArcAngle(arc) / 360;
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
    export function ModelExtents(modelToMeasure: IMakerModel): IMakerMeasure {
        var totalMeasurement: IMakerMeasure = { low: { x: null, y: null }, high: { x: null, y: null } };

        function lowerOrHigher(offsetOrigin: IMakerPoint, pathMeasurement: IMakerMeasure) {

            function getExtreme(a: IMakerPoint, b: IMakerPoint, fn: IMathMinMax) {
                var c = Point.Add(b, offsetOrigin);
                a.x = (a.x == null ? c.x : fn(a.x, c.x));
                a.y = (a.y == null ? c.y : fn(a.y, c.y));
            }

            getExtreme(totalMeasurement.low, pathMeasurement.low, Math.min);
            getExtreme(totalMeasurement.high, pathMeasurement.high, Math.max);
        }

        function measure(model: IMakerModel, offsetOrigin?: IMakerPoint) {

            var newOrigin = Point.Add(model.origin, offsetOrigin);

            if (model.paths) {
                for (var i = 0; i < model.paths.length; i++) {
                    lowerOrHigher(newOrigin, PathExtents(model.paths[i]));
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