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
     * @param augmentBaseMeasure Optional flag to call measure.augment on the measurement.
     * @returns The increased original measurement (for cascading).
     */
    export function increase(baseMeasure: IMeasure, addMeasure: IMeasure, augmentBaseMeasure?: boolean): IMeasure {

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

        if (augmentBaseMeasure) {
            augment(baseMeasure);
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
     * DEPRECATED - use isArcSpanOverlapping() instead.
     */
    export function isArcOverlapping(arcA: IPathArc, arcB: IPathArc, excludeTangents: boolean): boolean {
        return isArcSpanOverlapping(arcA, arcB, excludeTangents);
    }

    /**
     * Check for arc overlapping another arc.
     * 
     * @param arcA The arc to test.
     * @param arcB The arc to check for overlap.
     * @param excludeTangents Boolean to exclude exact endpoints and only look for deep overlaps.
     * @returns Boolean true if arcA is overlapped with arcB.
     */
    export function isArcSpanOverlapping(arcA: IPathArc, arcB: IPathArc, excludeTangents: boolean): boolean {
        var pointsOfIntersection: IPoint[] = [];

        function checkAngles(a: IPathArc, b: IPathArc) {

            function checkAngle(n: number) {
                return isBetweenArcAngles(n, a, excludeTangents);
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
        var oneDimension = false;
        for (var i = 2; i--;) {
            if (round(line.origin[i] - line.end[i], .000001) == 0) {
                if (oneDimension) return false;
                oneDimension = true;
                continue;
            }
            var origin_value = round(line.origin[i]);
            var end_value = round(line.end[i]);
            if (!isBetween(round(pointInQuestion[i]), origin_value, end_value, exclusive)) return false;
        }
        return true;
    }

    /**
     * Check if a given bezier seed has all points on the same slope.
     * 
     * @param seed The bezier seed to test.
     * @param exclusive Optional boolean to test only within the boundary of the endpoints.
     * @returns Boolean true if bezier seed has control points on the line slope and between the line endpoints.
     */
    export function isBezierSeedLinear(seed: IPathBezierSeed, exclusive?: boolean): boolean {

        //create a slope from the endpoints
        var slope = lineSlope(seed);

        for (var i = 0; i < seed.controls.length; i++) {
            if (!(isPointOnSlope(seed.controls[i], slope))) {
                if (!exclusive) return false;
                if (isBetweenPoints(seed.controls[i], seed, false)) return false;
            }
        }

        return true;
    }

    /**
     * @private
     */
    const graham_scan = require('graham_scan') as typeof ConvexHullGrahamScan;

    /**
     * @private
     */
    function serializePoint(p: number[]) {
        return p.join(',');
    }

    /**
     * Check for flow of paths in a chain being clockwise or not.
     * 
     * @param chainContext The chain to test.
     * @param out_result Optional output object, if provided, will be populated with convex hull results.
     * @returns Boolean true if paths in the chain flow clockwise.
     */
    export function isChainClockwise(chainContext: IChain, out_result?: { hullPoints?: IPoint[], keyPoints?: IPoint[] }): boolean {

        //cannot do non-endless or circle
        if (!chainContext.endless || chainContext.links.length === 1) {
            return null;
        }

        var keyPoints = chain.toKeyPoints(chainContext);

        return isPointArrayClockwise(keyPoints, out_result);
    }

    /**
     * Check for array of points being clockwise or not.
     * 
     * @param points The array of points to test.
     * @param out_result Optional output object, if provided, will be populated with convex hull results.
     * @returns Boolean true if points flow clockwise.
     */
    export function isPointArrayClockwise(points: IPoint[], out_result?: { hullPoints?: IPoint[], keyPoints?: IPoint[] }) {
        var convexHull = new graham_scan();
        var pointsInOrder: string[] = [];

        function add(endPoint: IPoint) {
            convexHull.addPoint(endPoint[0], endPoint[1]);
            pointsInOrder.push(serializePoint(endPoint as number[]));
        }

        points.forEach(add);

        //we only need to deal with 3 points
        var hull = convexHull.getHull();
        var hullPoints = hull.slice(0, 3).map((p): string => serializePoint([p.x, p.y]));
        var ordered: string[] = [];
        pointsInOrder.forEach(p => {
            if (~hullPoints.indexOf(p)) ordered.push(p);
        });

        //now make sure endpoints of hull are endpoints of ordered. do this by managing the middle point
        switch (ordered.indexOf(hullPoints[1])) {
            case 0:
                //shift down
                ordered.unshift(ordered.pop());
                break;
            case 2:
                //shift up
                ordered.push(ordered.shift());
                break;
        }

        if (out_result) {
            out_result.hullPoints = hull.map(p => [p.x, p.y]);
            out_result.keyPoints = points;
        }

        //the hull is counterclockwise, so the result is clockwise if the first elements do not match
        return hullPoints[0] != ordered[0];
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
                return isBetweenPoints(p, a, excludeTangents);
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
        if (round(dx, .000001) == 0) {
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

    pathLengthMap[pathType.BezierSeed] = function (seed: IPathBezierSeed) {
        return models.BezierCurve.computeLength(seed);
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
     * Measures the length of all paths in a model.
     * 
     * @param modelToMeasure The model containing paths to measure.
     * @returns Length of all paths in the model.
     */
    export function modelPathLength(modelToMeasure: IModel): number {
        var total = 0;

        model.walk(modelToMeasure, {
            onPath: function (walkedPath: IWalkPath) {
                total += pathLength(walkedPath.pathContext);
            }
        });

        return total;
    }

    /**
     * @private
     */
    function cloneMeasure(measureToclone: IMeasure): IMeasure {
        return {
            high: point.clone(measureToclone.high),
            low: point.clone(measureToclone.low)
        };
    }

    /**
     * Measures the smallest rectangle which contains a model.
     * 
     * @param modelToMeasure The model to measure.
     * @param atlas Optional atlas to save measurements.
     * @returns object with low and high points.
     */
    export function modelExtents(modelToMeasure: IModel, atlas?: Atlas): IMeasureWithCenter {

        function increaseParentModel(childRoute: string[], childMeasurement: IMeasure) {

            if (!childMeasurement) return;

            //to get the parent route, just traverse backwards 2 to remove id and 'paths' / 'models'
            var parentRoute = childRoute.slice(0, -2);
            var parentRouteKey = createRouteKey(parentRoute);

            if (!(parentRouteKey in atlas.modelMap)) {
                //just start with the known size
                atlas.modelMap[parentRouteKey] = cloneMeasure(childMeasurement);
            } else {
                increase(atlas.modelMap[parentRouteKey], childMeasurement);
            }
        }

        if (!atlas) atlas = new Atlas(modelToMeasure);

        var walkOptions: IWalkOptions = {
            onPath: function (walkedPath: IWalkPath) {

                //trust that the path measurement is good
                if (!(walkedPath.routeKey in atlas.pathMap)) {
                    atlas.pathMap[walkedPath.routeKey] = pathExtents(walkedPath.pathContext, walkedPath.offset);
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

        var m = atlas.modelMap[''] as IMeasureWithCenter;

        if (m) {
            return augment(m);
        }

        return m;
    }


    /**
     * Augment a measurement - add more properties such as center point, height and width.
     * 
     * @param measureToAugment The measurement to augment.
     * @returns Measurement object with augmented properties.
     */
    export function augment(measureToAugment: IMeasure): IMeasureWithCenter {

        var m = measureToAugment as IMeasureWithCenter;

        m.center = point.average(m.high, m.low);
        m.width = m.high[0] - m.low[0];
        m.height = m.high[1] - m.low[1];

        return m;
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

    /**
     * @private
     */
    function loopIndex(base: number, i: number) {
        if (i >= base) return i - base;
        if (i < 0) return i + base;
        return i;
    }

    /**
     * @private
     */
    function yAtX(slope: ISlope, x: number) {
        return slope.slope * x + slope.yIntercept;
    }

    /**
     * @private
     */
    function pointOnSlopeAtX(line: IPathLine, x: number): IPoint {
        var slope = lineSlope(line);
        return [x, yAtX(slope, x)];
    }

    /**
     * @private
     */
    interface IAngledBoundary {
        index: number;
        rotation: number;
        center: IPoint;
        width: number;
        height: number;
        top: IPathLine;
        middle: IPathLine;
        bottom: IPathLine;
    }

    /**
     * @private
     */
    function isCircular(bounds: IAngledBoundary[]) {
        for (var i = 1; i < 3; i++) {
            if (!isPointEqual(bounds[0].center, bounds[i].center, .000001) || !(round(bounds[0].width - bounds[i].width) === 0)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @private
     */
    function getAngledBounds(index: number, modelToMeasure: IModel, rotateModel: number, rotatePaths: number) {
        model.rotate(modelToMeasure, rotateModel);
        var m = modelExtents(modelToMeasure);
        var result: IAngledBoundary = {
            index: index,
            rotation: rotatePaths,
            center: point.rotate(m.center, rotatePaths),

            //model is sideways, so width is based on Y, height is based on X
            width: m.height,
            height: m.width,

            bottom: new paths.Line(m.low, [m.high[0], m.low[1]]),
            middle: new paths.Line([m.low[0], m.center[1]], [m.high[0], m.center[1]]),
            top: new paths.Line(m.high, [m.low[0], m.high[1]]),
        };
        [result.top, result.middle, result.bottom].forEach(line => path.rotate(line, rotatePaths));
        return result;
    }

    /**
     * @private
     */
    interface IHexSolution {
        radius: number,
        origin: IPoint,
        type: string,
        index?: number,
    }

    /**
     * @private
     */
    function hexSolution(lines: IPathLine[], bounds: IAngledBoundary[]): IHexSolution {
        var tip = lines[1].origin;
        var tipX = tip[0];
        var left = lines[3].origin[0];
        var right = lines[0].origin[0];

        //see if left edge is in bounds if right edge is on the hex boundary
        var altRight = tipX - right;
        if ((right - left) > 2 * altRight) return null;

        //see if right edge is in bounds if left edge is on the hex boundary
        var altLeft = (tipX - left) / 3;
        if (altRight < altLeft) return null;

        var altitudeViaSide = Math.min(altLeft, altRight);
        var radiusViaSide = solvers.equilateralSide(altitudeViaSide);

        //find peaks, then find highest peak
        var peakPoints = [point.fromSlopeIntersection(lines[1], lines[2]), point.fromSlopeIntersection(lines[4], lines[5])];
        var peakRadii = peakPoints.map(p => Math.abs(p[1] - tip[1]));
        var peakNum = (peakRadii[0] > peakRadii[1]) ? 0 : 1;    //top = 0, bottom = 1
        var radiusViaPeak = peakRadii[peakNum];

        if (radiusViaPeak > radiusViaSide) {
            var altitudeViaPeak = solvers.equilateralAltitude(radiusViaPeak);
            var peakX = tipX - 2 * altitudeViaPeak;

            //see if it will contain right side
            if (right > peakX + altitudeViaPeak) return null;

            //see if it will contain left side
            if (left < peakX - altitudeViaPeak) return null;

            //at this point, [tipX - 2 * altitudeViaPeak, tip[1]] is a solution for origin.
            //but we want to best center the result by sliding along the boundary middle, balancing the smallest gap
            var leftGap = left - peakX + altitudeViaPeak;
            var peakGap = 2 * altitudeViaPeak - bounds[peakNum + 1].width;
            var minHalfGap = Math.min(leftGap, peakGap) / 2;

            return {
                origin: pointOnSlopeAtX(bounds[2 - peakNum].middle, peakX + minHalfGap),
                radius: radiusViaPeak,
                type: 'peak ' + peakNum
            };

        } else {

            return {
                origin: [tipX - 2 * altitudeViaSide, tip[1]],
                radius: radiusViaSide,
                type: 'side'
            };
        }

    }

    /**
     * Measures the minimum bounding hexagon surrounding a model. The hexagon is oriented such that the right and left sides are vertical, and the top and bottom are pointed.
     * 
     * @param modelToMeasure The model to measure.
     * @returns IBoundingHex object which is a hexagon model, with an additional radius property.
     */
    export function boundingHexagon(modelToMeasure: IModel): IBoundingHex {
        var clone = cloneObject(modelToMeasure) as IModel;
        model.originate(clone);
        var originalMeasure = modelExtents(clone);
        var bounds: IAngledBoundary[] = [];
        var scratch: IModel = { paths: {} };

        model.center(clone);

        function result(radius: number, origin: IPoint, notes: string): IBoundingHex {
            return {
                radius: radius,
                paths: new models.Polygon(6, radius, 30).paths,
                origin: point.add(origin, originalMeasure.center),
                //models: { scratch: scratch },
                notes: notes
            };
        }

        var boundRotations = [[90, -90], [-60, -30], [-60, 30]];

        while (boundRotations.length) {
            var rotation = boundRotations.shift();
            var bound = getAngledBounds(bounds.length, clone, rotation[0], rotation[1]);

            var side = solvers.equilateralSide(bound.width / 2);
            if (side >= bound.height) {
                return result(side, bound.center, 'solved by bound ' + bounds.length);
            }

            bounds.push(bound);
        }

        //model.rotate(clone, 30);
        //scratch.models = { clone: clone };

        //check for a circular solution
        if (isCircular(bounds)) {
            return result(solvers.equilateralSide(bounds[0].width / 2), bounds[0].center, 'solved as circular');
        }

        var perimeters = bounds.map(b => b.top).concat(bounds.map(b => b.bottom));

        perimeters.forEach((p, i) => {
            scratch.paths[i] = p;

            //converge alternate lines to form two triangles
            path.converge(perimeters[loopIndex(6, i + 2)], p, true);
        });

        bounds.forEach((b, i) => {
            scratch.paths['m' + i] = b.middle;
        });

        var boundCopy = bounds.slice();
        var solution: IHexSolution;

        //solve a hexagon for every tip, keeping the smallest one
        for (var i = 0; i < 6; i++) {

            //rotate the scratch area so that we always reference the tip at polar 0
            if (i > 0) {
                perimeters.push(perimeters.shift());
                boundCopy.push(boundCopy.shift());
                model.rotate(scratch, -60);
            }

            var s = hexSolution(perimeters, boundCopy);
            if (s) {
                if (!solution || s.radius < solution.radius) {
                    solution = s;
                    solution.index = i;
                }
            }
        }

        var p = point.rotate(solution.origin, solution.index * 60);

        return result(solution.radius, p, 'solved by ' + solution.index + ' as ' + solution.type);
    }

    /**
     * @private
     */
    function addUniquePoints(pointArray: IPoint[], pointsToAdd: IPoint[]): number {

        var added = 0;

        pointsToAdd.forEach(p => {
            if (!isPointDistinct(p, pointArray, .00000001)) return;
            pointArray.push(p);
            added++;
        });

        return added;
    }

    /**
     * @private
     */
    function getFarPoint(modelContext: IModel, farPoint?: IPoint, measureAtlas?: Atlas) {
        if (farPoint) return farPoint;

        var high = modelExtents(modelContext).high;
        if (high) {
            return point.add(high, [1, 1]);
        }

        return [7654321, 1234567];
    }

    /**
     * Check to see if a point is inside of a model.
     * 
     * @param pointToCheck The point to check.
     * @param modelContext The model to check against.
     * @param options Optional IMeasurePointInsideOptions object.
     * @returns Boolean true if the path is inside of the modelContext.
     */
    export function isPointInsideModel(pointToCheck: IPoint, modelContext: IModel, options: IMeasurePointInsideOptions = {}): boolean {
        if (!options.farPoint) {
            options.farPoint = getFarPoint(modelContext, options.farPoint, options.measureAtlas);
        }

        options.out_intersectionPoints = [];

        var isInside: boolean;
        var lineToFarPoint = new paths.Line(pointToCheck, options.farPoint);
        var measureFarPoint = pathExtents(lineToFarPoint);

        var walkOptions: IWalkOptions = {
            onPath: function (walkedPath: IWalkPath) {

                if (options.measureAtlas && !isMeasurementOverlapping(measureFarPoint, options.measureAtlas.pathMap[walkedPath.routeKey])) {
                    return;
                }

                var intersectOptions: IPathIntersectionOptions = { path2Offset: walkedPath.offset };

                var farInt = path.intersection(lineToFarPoint, walkedPath.pathContext, intersectOptions);

                if (farInt) {
                    var added = addUniquePoints(options.out_intersectionPoints, farInt.intersectionPoints);

                    //if number of intersections is an odd number, flip the flag.
                    if (added % 2 == 1) {
                        isInside = !!!isInside;
                    }
                }
            },
            beforeChildWalk: function (innerWalkedModel: IWalkModel): boolean {

                if (!options.measureAtlas) {
                    return true;
                }

                //see if there is a model measurement. if not, it is because the model does not contain paths.
                var innerModelMeasurement = options.measureAtlas.modelMap[innerWalkedModel.routeKey];
                return innerModelMeasurement && isMeasurementOverlapping(measureFarPoint, innerModelMeasurement);
            }
        };
        model.walk(modelContext, walkOptions);

        return !!isInside;
    }
}
