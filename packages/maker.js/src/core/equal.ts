namespace MakerJs.measure {

    /**
     * Find out if two angles are equal.
     * 
     * @param angleA First angle.
     * @param angleB Second angle.
     * @returns true if angles are the same, false if they are not
     */
    export function isAngleEqual(angleA: number, angleB: number, accuracy: number = .0001) {
        var a = angle.noRevolutions(angleA);
        var b = angle.noRevolutions(angleB);
        var d = angle.noRevolutions(round(b - a, accuracy));
        return d == 0;
    }

    /**
     * @private
     */
    interface IPathAreEqualMap {
        [type: string]: (pathA: IPath, pathB: IPath, withinPointDistance?: number) => boolean;
    }

    /**
     * @private
     */
    var pathAreEqualMap: IPathAreEqualMap = {};

    pathAreEqualMap[pathType.Line] = function (lineA: IPathLine, lineB: IPathLine, withinPointDistance?: number): boolean {
        return (isPointEqual(lineA.origin, lineB.origin, withinPointDistance) && isPointEqual(lineA.end, lineB.end, withinPointDistance))
            || (isPointEqual(lineA.origin, lineB.end, withinPointDistance) && isPointEqual(lineA.end, lineB.origin, withinPointDistance));
    };

    pathAreEqualMap[pathType.Circle] = function (circleA: IPathCircle, circleB: IPathCircle, withinPointDistance): boolean {
        return isPointEqual(circleA.origin, circleB.origin, withinPointDistance) && circleA.radius == circleB.radius;
    };

    pathAreEqualMap[pathType.Arc] = function (arcA: IPathArc, arcB: IPathArc, withinPointDistance): boolean {
        return pathAreEqualMap[pathType.Circle](arcA, arcB, withinPointDistance) && isAngleEqual(arcA.startAngle, arcB.startAngle) && isAngleEqual(arcA.endAngle, arcB.endAngle);
    };

    /**
     * Find out if two paths are equal.
     * 
     * @param pathA First path.
     * @param pathB Second path.
     * @returns true if paths are the same, false if they are not
     */
    export function isPathEqual(pathA: IPath, pathB: IPath, withinPointDistance?: number, pathAOffset?: IPoint, pathBOffset?: IPoint): boolean {

        var result = false;

        if (pathA.type == pathB.type) {
            var fn = pathAreEqualMap[pathA.type];
            if (fn) {

                function getResult() {
                    result = fn(pathA, pathB, withinPointDistance);
                }

                if (pathAOffset || pathBOffset) {
                    path.moveTemporary([pathA, pathB], [pathAOffset, pathBOffset], getResult);
                } else {
                    getResult();
                }
            }
        }

        return result;
    }

    /**
     * Find out if two points are equal.
     * 
     * @param a First point.
     * @param b Second point.
     * @param withinDistance Optional distance to consider points equal.
     * @returns true if points are the same, false if they are not
     */
    export function isPointEqual(a: IPoint, b: IPoint, withinDistance?: number): boolean {
        if (!withinDistance) {
            return round(a[0] - b[0]) == 0 && round(a[1] - b[1]) == 0;
        } else {
            if (!a || !b) return false;
            var distance = pointDistance(a, b);
            return distance <= withinDistance;
        }
    }

    /**
     * Find out if a point is distinct among an array of points.
     * 
     * @param pointToCheck point to check.
     * @param pointArray array of points.
     * @param withinDistance Optional distance to consider points equal.
     * @returns false if point is equal to any point in the array.
     */
    export function isPointDistinct(pointToCheck: IPoint, pointArray: IPoint[], withinDistance?: number) {
        for (var i = 0; i < pointArray.length; i++) {
            if (isPointEqual(pointArray[i], pointToCheck, withinDistance)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Find out if point is on a slope.
     * 
     * @param p Point to check.
     * @param b Slope.
     * @param withinDistance Optional distance of tolerance.
     * @returns true if point is on the slope
     */
    export function isPointOnSlope(p: IPoint, slope: ISlope, withinDistance = 0): boolean {
        if (slope.hasSlope) {
            // y = mx * b
            return Math.abs(p[1] - (slope.slope * p[0] + slope.yIntercept)) <= withinDistance;
        } else {
            //vertical slope
            return Math.abs(p[0] - slope.line.origin[0]) <= withinDistance;
        }
    }

    /**
     * Find out if point is on a circle.
     * 
     * @param p Point to check.
     * @param circle Circle.
     * @param withinDistance Optional distance of tolerance.
     * @returns true if point is on the circle
     */
    export function isPointOnCircle(p: IPoint, circle: IPathCircle, withinDistance = 0): boolean {
        const d = Math.abs(pointDistance(p, circle.origin) - circle.radius);
        return d <= withinDistance;
    }

    /**
     * @private
     */
    const onPathMap: { [pathType: string]: (point: IPoint, path: IPath, withinDistance: number, options?: IIsPointOnPathOptions) => boolean } = {};

    onPathMap[pathType.Circle] = function (p: IPoint, circle: IPathCircle, withinDistance: number) {
        return isPointOnCircle(p, circle, withinDistance);
    };

    onPathMap[pathType.Arc] = function (p: IPoint, arc: IPathArc, withinDistance: number) {
        if (onPathMap[pathType.Circle](p, arc, withinDistance)) {
            var a = angle.ofPointInDegrees(arc.origin, p);
            return isBetweenArcAngles(a, arc, false);
        }
        return false;
    }

    onPathMap[pathType.Line] = function (p: IPoint, line: IPathLine, withinDistance: number, options: IIsPointOnPathOptions) {
        const slope = (options && options.cachedLineSlope) || lineSlope(line);
        if (options && !options.cachedLineSlope) {
            options.cachedLineSlope = slope;
        }
        return isPointOnSlope(p, slope, withinDistance) && isBetweenPoints(p, line, false);
    }

    /**
     * Find out if a point lies on a path.
     * @param pointToCheck point to check.
     * @param onPath path to check against.
     * @param withinDistance Optional distance to consider point on the path.
     * @param pathOffset Optional offset of path from [0, 0].
     * @param options Optional IIsPointOnPathOptions to cache computation.
     */
    export function isPointOnPath(pointToCheck: IPoint, onPath: IPath, withinDistance = 0, pathOffset?: IPoint, options?: IIsPointOnPathOptions) {
        const fn = onPathMap[onPath.type];
        if (fn) {
            const offsetPath = pathOffset ? path.clone(onPath, pathOffset) : onPath;
            return fn(pointToCheck, offsetPath, withinDistance, options);
        }
        return false;
    }

    /**
     * Check for slope equality.
     * 
     * @param slopeA The ISlope to test.
     * @param slopeB The ISlope to check for equality.
     * @returns Boolean true if slopes are equal.
     */
    export function isSlopeEqual(slopeA: ISlope, slopeB: ISlope): boolean {

        if (!isSlopeParallel(slopeA, slopeB)) return false;

        if (!slopeA.hasSlope && !slopeB.hasSlope) {

            //lines are both vertical, see if x are the same
            return round(slopeA.line.origin[0] - slopeB.line.origin[0]) == 0;
        }

        //lines are parallel, but not vertical, see if y-intercept is the same
        return round(slopeA.yIntercept - slopeB.yIntercept, .00001) == 0;
    }

    /**
     * Check for parallel slopes.
     * 
     * @param slopeA The ISlope to test.
     * @param slopeB The ISlope to check for parallel.
     * @returns Boolean true if slopes are parallel.
     */
    export function isSlopeParallel(slopeA: ISlope, slopeB: ISlope): boolean {

        if (!slopeA.hasSlope && !slopeB.hasSlope) {

            return true;
        }

        if (slopeA.hasSlope && slopeB.hasSlope && (round(slopeA.slope - slopeB.slope, .00001) == 0)) {

            //lines are parallel
            return true;
        }

        return false;
    }
}
