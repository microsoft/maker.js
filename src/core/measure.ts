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
     * Increase a measurement by an additional measurement.
     * 
     * @param baseMeasure The measurement to increase.
     * @param addMeasure The additional measurement.
     * @param addOffset Optional offset point of the additional measurement.
     * @returns The increased original measurement (for chaining).
     */
    export function increase(baseMeasure: IMeasure, addMeasure: IMeasure): IMeasure {

        function getExtreme(basePoint: IPoint, newPoint: IPoint, fn: IMathMinMax) {

            if (!newPoint) return;

            for (var i = 2; i--;) {
                if (newPoint[i] == null) continue;

                if (basePoint[i] == null) {
                    basePoint[i] = newPoint[i];
                } else {
                    basePoint[i] = fn(basePoint[i], newPoint[i]);
                }
            }

        }

        if (addMeasure) {
            getExtreme(baseMeasure.low, addMeasure.low, Math.min);
            getExtreme(baseMeasure.high, addMeasure.high, Math.max);
        }

        return baseMeasure;
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
     * @param arcA The arc to test.
     * @param arcB The arc to check for overlap.
     * @param excludeTangents Boolean to exclude exact endpoints and only look for deep overlaps.
     * @returns Boolean true if arcA is overlapped with arcB.
     */
    export function isArcOverlapping(arcA: IPathArc, arcB: IPathArc, excludeTangents: boolean): boolean {
        var pointsOfIntersection: IPoint[] = [];

        function checkAngles(a: IPathArc, b: IPathArc) {

            function checkAngle(n: number) {
                return measure.isBetweenArcAngles(n, a, excludeTangents);
            }

            return checkAngle(b.startAngle) || checkAngle(b.endAngle);
        }

        return checkAngles(arcA, arcB) || checkAngles(arcB, arcA) || (arcA.startAngle == arcB.startAngle && arcA.endAngle == arcB.endAngle);
    }

    /**
     * Check if a given number is between two given limits.
     * 
     * @param valueInQuestion The number to test.
     * @param limitA First limit.
     * @param limitB Second limit.
     * @param exclusive Flag to exclude equaling the limits.
     * @returns Boolean true if value is between (or equal to) the limits.
     */
    export function isBetween(valueInQuestion: number, limitA: number, limitB: number, exclusive: boolean): boolean {
        if (exclusive) {
            return Math.min(limitA, limitB) < valueInQuestion && valueInQuestion < Math.max(limitA, limitB);
        } else {
            return Math.min(limitA, limitB) <= valueInQuestion && valueInQuestion <= Math.max(limitA, limitB);
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
     * Check if a given bezier seed is simply a line.
     * 
     * @param seed The bezier seed to test.
     * @returns Boolean true if bezier seed has control points on the line slope and between the line endpoints.
     */
    export function isBezierSeedLinear(seed: IPathBezierSeed): boolean {

        //create a slope from the endpoints
        var slope = lineSlope(seed);

        for (var i = 0; i < seed.controls.length; i++) {
            if (!(isPointOnSlope(seed.controls[i], slope) && isBetweenPoints(seed.controls[i], seed, false))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check for line overlapping another line.
     * 
     * @param lineA The line to test.
     * @param lineB The line to check for overlap.
     * @param excludeTangents Boolean to exclude exact endpoints and only look for deep overlaps.
     * @returns Boolean true if lineA is overlapped with lineB.
     */
    export function isLineOverlapping(lineA: IPathLine, lineB: IPathLine, excludeTangents: boolean): boolean {
        var pointsOfIntersection: IPoint[] = [];

        function checkPoints(index: number, a: IPathLine, b: IPathLine) {

            function checkPoint(p: IPoint) {
                return measure.isBetweenPoints(p, a, excludeTangents);
            }

            return checkPoint(b.origin) || checkPoint(b.end);
        }

        return checkPoints(0, lineA, lineB) || checkPoints(1, lineB, lineA);
    }

    /**
     * Check for measurement overlapping another measurement.
     * 
     * @param measureA The measurement to test.
     * @param measureB The measurement to check for overlap.
     * @returns Boolean true if measureA is overlapped with measureB.
     */
    export function isMeasurementOverlapping(measureA: IMeasure, measureB: IMeasure): boolean {
        for (var i = 2; i--;) {
            if (!(round(measureA.low[i] - measureB.high[i]) <= 0 && round(measureA.high[i] - measureB.low[i]) >= 0)) return false;
        }

        return true;
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

    pathExtentsMap[pathType.Line] = function (line: IPathLine): IMeasure {
        return {
            low: getExtremePoint(line.origin, line.end, Math.min),
            high: getExtremePoint(line.origin, line.end, Math.max)
        }
    }

    pathExtentsMap[pathType.Circle] = function (circle: IPathCircle): IMeasure {
        var r = circle.radius;
        return {
            low: point.add(circle.origin, [-r, -r]),
            high: point.add(circle.origin, [r, r])
        }
    }

    pathExtentsMap[pathType.Arc] = function (arc: IPathArc): IMeasure {
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
    export function pathExtents(pathToMeasure: IPath, addOffset?: IPoint): IMeasure {

        if (pathToMeasure) {
            var fn = pathExtentsMap[pathToMeasure.type];
            if (fn) {
                var m = fn(pathToMeasure);

                if (addOffset) {
                    m.high = point.add(m.high, addOffset);
                    m.low = point.add(m.low, addOffset);
                }

                return m;
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
     * @private
     */
    function cloneMeasure(measureToclone: IMeasure): IMeasure {
        return { high: [measureToclone.high[0], measureToclone.high[1]], low: [measureToclone.low[0], measureToclone.low[1]] };
    }

    /**
     * Measures the smallest rectangle which contains a model.
     * 
     * @param modelToMeasure The model to measure.
     * @param atlas Optional atlas to save measurements.
     * @returns object with low and high points.
     */
    export function modelExtents(modelToMeasure: IModel, atlas?: measure.Atlas): IMeasure {

        function increaseParentModel(childRoute: string[], childMeasurement: IMeasure) {

            if (!childMeasurement) return;

            //to get the parent route, just traverse backwards 2 to remove id and 'paths' / 'models'
            var parentRoute = childRoute.slice(0, -2);
            var parentRouteKey = createRouteKey(parentRoute);

            if (!(parentRouteKey in atlas.modelMap)) {
                //just start with the known size
                atlas.modelMap[parentRouteKey] = cloneMeasure(childMeasurement);
            } else {
                measure.increase(atlas.modelMap[parentRouteKey], childMeasurement);
            }
        }

        if (!atlas) atlas = new measure.Atlas(modelToMeasure);

        var walkOptions: IWalkOptions = {
            onPath: function (walkedPath: IWalkPath) {

                //trust that the path measurement is good
                if (!(walkedPath.routeKey in atlas.pathMap)) {
                    atlas.pathMap[walkedPath.routeKey] = measure.pathExtents(walkedPath.pathContext, walkedPath.offset);
                }

                increaseParentModel(walkedPath.route, atlas.pathMap[walkedPath.routeKey]);
            },
            afterChildWalk: function (walkedModel: IWalkModel) {
                //model has been updated by all its children, update parent
                increaseParentModel(walkedModel.route, atlas.modelMap[walkedModel.routeKey]);
            }
        };

        model.walk(modelToMeasure, walkOptions);

        atlas.modelsMeasured = true;

        return atlas.modelMap[''];
    }

    /**
     * A list of maps of measurements.
     * 
     * @param modelToMeasure The model to measure.
     * @param atlas Optional atlas to save measurements.
     * @returns object with low and high points.
     */
    export class Atlas {

        /**
         * Flag that models have been measured.
         */
        public modelsMeasured = false;

        /**
         * Map of model measurements, mapped by routeKey.
         */
        public modelMap: IMeasureMap = {};

        /**
         * Map of path measurements, mapped by routeKey.
         */
        public pathMap: IMeasureMap = {};

        /**
         * Constructor.
         * @param modelContext The model to measure.
         */
        constructor(public modelContext: IModel) {
        }

        public measureModels() {
            if (!this.modelsMeasured) {
                modelExtents(this.modelContext, this);
            }
        }
    }
}
