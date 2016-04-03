namespace MakerJs.path {

    /**
     * @private
     */
    interface IPathIntersectionMap {
        [type: string]: { [type: string]: (path1: IPath, path2: IPath, options: IPathIntersectionOptions) => IPathIntersection };
    }

    /**
     * @private
     */
    var map: IPathIntersectionMap = {};

    map[pathType.Arc] = {};
    map[pathType.Circle] = {};
    map[pathType.Line] = {};

    map[pathType.Arc][pathType.Arc] = function (arc1: IPathArc, arc2: IPathArc, options: IPathIntersectionOptions) {
        var angles = circleToCircle(arc1, arc2, options);
        if (angles) {
            var arc1Angles = getAnglesWithinArc(angles[0], arc1, options);
            var arc2Angles = getAnglesWithinArc(angles[1], arc2, options);
            if (arc1Angles && arc2Angles) {
                return {
                    intersectionPoints: pointsFromAnglesOnCircle(arc1Angles, arc1),
                    path1Angles: arc1Angles,
                    path2Angles: arc2Angles
                };
            }
        } else {
            if (options.out_AreOverlapped) {
                //overlapped for circle, reset and see if arcs actually overlap.

                options.out_AreOverlapped = false;
                
                checkAngleOverlap(arc1, arc2, options);
            }
        }
        return null;
    };

    map[pathType.Arc][pathType.Circle] = function (arc: IPathArc, circle: IPathArc, options: IPathIntersectionOptions) {
        var angles = circleToCircle(arc, circle, options);
        if (angles) {
            var arcAngles = getAnglesWithinArc(angles[0], arc, options);
            if (arcAngles) {
                var circleAngles: number[];

                //if both point are on arc, use both on circle
                if (arcAngles.length == 2) {
                    circleAngles = angles[1];
                } else {
                    //use the corresponding point on circle 
                    var index = findCorrespondingAngleIndex(angles, arcAngles);
                    circleAngles = [angles[1][index]];
                }

                return {
                    intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                    path1Angles: arcAngles,
                    path2Angles: circleAngles
                };
            }
        }
        return null;
    };

    map[pathType.Arc][pathType.Line] = function (arc: IPathArc, line: IPathLine, options: IPathIntersectionOptions) {
        var angles = lineToCircle(line, arc, options);
        if (angles) {
            var arcAngles = getAnglesWithinArc(angles, arc, options);
            if (arcAngles) {
                return {
                    intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                    path1Angles: arcAngles
                };
            }
        }
        return null;
    };

    map[pathType.Circle][pathType.Arc] = function (circle: IPathCircle, arc: IPathArc, options: IPathIntersectionOptions) {
        var result = map[pathType.Arc][pathType.Circle](arc, circle, options);
        if (result) {
            return swap(result);
        }
        return null;
    };

    map[pathType.Circle][pathType.Circle] = function (circle1: IPathCircle, circle2: IPathCircle, options: IPathIntersectionOptions) {
        var angles = circleToCircle(circle1, circle2, options);
        if (angles) {
            return {
                intersectionPoints: pointsFromAnglesOnCircle(angles[0], circle1),
                path1Angles: angles[0],
                path2Angles: angles[1]
            };
        }
        return null;
    };

    map[pathType.Circle][pathType.Line] = function (circle: IPathCircle, line: IPathLine, options: IPathIntersectionOptions) {
        var angles = lineToCircle(line, circle, options);
        if (angles) {
            return {
                intersectionPoints: pointsFromAnglesOnCircle(angles, circle),
                path1Angles: angles
            };
        }
        return null;
    };

    map[pathType.Line][pathType.Arc] = function (line: IPathLine, arc: IPathArc, options: IPathIntersectionOptions) {
        var result = map[pathType.Arc][pathType.Line](arc, line, options);
        if (result) {
            return swap(result);
        }
        return null;
    };

    map[pathType.Line][pathType.Circle] = function (line: IPathLine, circle: IPathCircle, options: IPathIntersectionOptions) {
        var result = map[pathType.Circle][pathType.Line](circle, line, options);
        if (result) {
            return swap(result);
        }
        return null;
    };

    map[pathType.Line][pathType.Line] = function (line1: IPathLine, line2: IPathLine, options: IPathIntersectionOptions) {
        var intersectionPoint = slopeIntersectionPoint(line1, line2, options);
        if (intersectionPoint) {

            //we have the point of intersection of endless lines, now check to see if the point is between both segemnts
            if (measure.isBetweenPoints(intersectionPoint, line1, options.excludeTangents) && measure.isBetweenPoints(intersectionPoint, line2, options.excludeTangents)) {
                return {
                    intersectionPoints: [intersectionPoint]
                };
            }

        }
        return null;
    };

    /**
     * @private
     */
    function swap(result: IPathIntersection) {
        var temp = result.path1Angles;
        if (result.path2Angles) {
            result.path1Angles = result.path2Angles;
        } else {
            delete result.path1Angles;
        }
        result.path2Angles = temp;

        return result;
    }

    /**
     * Find the point(s) where 2 paths intersect.
     * 
     * @param path1 First path to find intersection.
     * @param path2 Second path to find intersection.
     * @param options Optional IPathIntersectionOptions.
     * @returns IPathIntersection object, with points(s) of intersection (and angles, when a path is an arc or circle); or null if the paths did not intersect.
     */
    export function intersection(path1: IPath, path2: IPath, options: IPathIntersectionOptions = {}): IPathIntersection {

        if (path1 && path2) {
            var fn = map[path1.type][path2.type];
            if (fn) {
                return fn(path1, path2, options);
            }
        }
        return null;
    }

    /**
     * @private
     */
    function findCorrespondingAngleIndex(circleAngles: number[][], arcAngle: number[]): number {
        for (var i = 0; i < circleAngles.length; i++) {
            if (circleAngles[i][0] == arcAngle[0]) return i;
        }
    }

    /**
     * @private
     */
    function pointsFromAnglesOnCircle(anglesInDegrees: number[], circle: IPathCircle): IPoint[] {
        var result = [];
        for (var i = 0; i < anglesInDegrees.length; i++) {
            result.push(point.fromAngleOnCircle(anglesInDegrees[i], circle));
        }
        return result;
    }

    /**
     * @private
     */
    function getAnglesWithinArc(angles: number[], arc: IPathArc, options: IPathIntersectionOptions): number[] {

        if (!angles) return null;

        var anglesWithinArc: number[] = [];

        for (var i = 0; i < angles.length; i++) {
            if (measure.isBetweenArcAngles(angles[i], arc, options.excludeTangents)) {
                anglesWithinArc.push(angles[i]);
            }
        }

        if (anglesWithinArc.length == 0) return null;

        return anglesWithinArc;
    }

    /**
     * Gets the slope of a line.
     */
    export function getSlope(line: IPathLine): ISlope {
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
     * @private
     */
    function verticalIntersectionPoint(verticalLine: IPathLine, nonVerticalSlope: ISlope): IPoint {
        var x = verticalLine.origin[0];
        var y = nonVerticalSlope.slope * x + nonVerticalSlope.yIntercept;
        return [x, y];
    }

    /**
     * @private
     */
    function checkAngleOverlap(arc1: IPathArc, arc2: IPathArc, options: IPathIntersectionOptions): void {
        var pointsOfIntersection: IPoint[] = [];

        function checkAngles(a: IPathArc, b: IPathArc) {

            function checkAngle(n: number) {
                return measure.isBetweenArcAngles(n, a, options.excludeTangents);
            }

            return checkAngle(b.startAngle) || checkAngle(b.endAngle);
        }

        if (checkAngles(arc1, arc2) || checkAngles(arc2, arc1) || (arc1.startAngle == arc2.startAngle && arc1.endAngle == arc2.endAngle)) {
            options.out_AreOverlapped = true;
        }
    }

    /**
     * @private
     */
    function checkLineOverlap(line1: IPathLine, line2: IPathLine, options: IPathIntersectionOptions): void {
        var pointsOfIntersection: IPoint[] = [];

        function checkPoints(index: number, a: IPathLine, b: IPathLine) {

            function checkPoint(p: IPoint) {
                return measure.isBetweenPoints(p, a, options.excludeTangents);
            }

            return checkPoint(b.origin) || checkPoint(b.end);
        }

        if (checkPoints(0, line1, line2) || checkPoints(1, line2, line1)) {
            options.out_AreOverlapped = true;
        }
    }

    /**
     * Calculates the intersection of slopes of two lines.
     * 
     * @param line1 First line to use for slope.
     * @param line2 Second line to use for slope.
     * @param options Optional IPathIntersectionOptions.
     * @returns point of intersection of the two slopes, or null if the slopes did not intersect.
     */
    export function slopeIntersectionPoint(line1: IPathLine, line2: IPathLine, options: IPathIntersectionOptions = {}): IPoint {

        var slope1 = getSlope(line1);
        var slope2 = getSlope(line2);

        if (!slope1.hasSlope && !slope2.hasSlope) {

            //lines are both vertical, see if x are the same
            if (round(slope1.line.origin[0] - slope2.line.origin[0]) == 0) {

                //check for overlap
                checkLineOverlap(line1, line2, options);
            }

            return null;
        }

        if (slope1.hasSlope && slope2.hasSlope && (round(slope1.slope - slope2.slope, .00001) == 0)) {

            //lines are parallel, but not vertical, see if y-intercept is the same
            if (round(slope1.yIntercept - slope2.yIntercept, .00001) == 0) {

                //check for overlap
                checkLineOverlap(line1, line2, options);
            }

            return null;
        }

        var pointOfIntersection: IPoint;

        if (!slope1.hasSlope) {
            pointOfIntersection = verticalIntersectionPoint(line1, slope2);
        } else if (!slope2.hasSlope) {
            pointOfIntersection = verticalIntersectionPoint(line2, slope1);
        } else {
            // find intersection by line equation
            var x = (slope2.yIntercept - slope1.yIntercept) / (slope1.slope - slope2.slope);
            var y = slope1.slope * x + slope1.yIntercept;
            pointOfIntersection = [x, y];
        }

        return pointOfIntersection;
    }

    /**
     * @private
     */
    function lineToCircle(line: IPathLine, circle: IPathCircle, options: IPathIntersectionOptions): number[] {

        var radius = round(circle.radius);

        //clone the line
        var clonedLine = new paths.Line(point.subtract(line.origin, circle.origin), point.subtract(line.end, circle.origin));

        //get angle of line
        var lineAngleNormal = angle.ofLineInDegrees(line);

        //use the positive horizontal angle
        var lineAngle = (lineAngleNormal >= 180) ? lineAngleNormal - 360 : lineAngleNormal;

        //rotate the line to horizontal
        rotate(clonedLine, -lineAngle, point.zero());

        //remember how to undo the rotation we just did
        function unRotate(resultAngle: number): number {
            var unrotated = resultAngle + lineAngle;
            return angle.noRevolutions(unrotated);
        }

        //line is horizontal, get the y value from any point
        var lineY = round(clonedLine.origin[1]);
        var lineYabs = Math.abs(lineY);

        //if y is greater than radius, there is no intersection
        if (lineYabs > radius) {
            return null;
        }

        var anglesOfIntersection: number[] = [];

        //if horizontal Y is the same as the radius, we know it's 90 degrees
        if (lineYabs == radius) {

            if (options.excludeTangents) {
                return null;
            }

            anglesOfIntersection.push(unRotate(lineY > 0 ? 90 : 270));

        } else {

            function intersectionBetweenEndpoints(x: number, angleOfX: number) {
                if (measure.isBetween(round(x), round(clonedLine.origin[0]), round(clonedLine.end[0]), options.excludeTangents)) {
                    anglesOfIntersection.push(unRotate(angleOfX));
                }
            }

            //find angle where line intersects
            var intersectRadians = Math.asin(lineY / radius);
            var intersectDegrees = angle.toDegrees(intersectRadians);

            //line may intersect in 2 places
            var intersectX = Math.cos(intersectRadians) * radius;
            intersectionBetweenEndpoints(-intersectX, 180 - intersectDegrees);
            intersectionBetweenEndpoints(intersectX, intersectDegrees);
        }

        if (anglesOfIntersection.length > 0) {
            return anglesOfIntersection;
        }

        return null;
    }

    /**
     * @private
     */
    function circleToCircle(circle1: IPathCircle, circle2: IPathCircle, options: IPathIntersectionOptions): number[][] {

        //see if circles are the same
        if (circle1.radius == circle2.radius && point.areEqual(circle1.origin, circle2.origin, .0001)) {
            options.out_AreOverlapped = true;
            return null;
        }

        //get offset from origin
        var offset = point.subtract(point.zero(), circle1.origin);

        //clone circle1 and move to origin
        var c1 = new paths.Circle(point.zero(), circle1.radius);

        //clone circle2 and move relative to circle1
        var c2 = new paths.Circle(point.subtract(circle2.origin, circle1.origin), circle2.radius);

        //rotate circle2 to horizontal, c2 will be to the right of the origin.
        var c2Angle = angle.ofPointInDegrees(point.zero(), c2.origin);
        rotate(c2, -c2Angle, point.zero());

        function unRotate(resultAngle: number): number {
            var unrotated = resultAngle + c2Angle;
            return angle.noRevolutions(unrotated);
        }

        //get X of c2 origin
        var x = c2.origin[0];

        //see if c2 is outside of c1
        if (x - c2.radius > c1.radius) {
            return null;
        }

        //see if c2 is within c1
        if (x + c2.radius < c1.radius) {
            return null;
        }

        //see if c1 is within c2
        if (x - c2.radius < -c1.radius) {
            return null;
        }

        //see if circles are tangent interior
        if (round(c2.radius - x - c1.radius) == 0) {

            if (options.excludeTangents) {
                return null;
            }

            return [[unRotate(180)], [unRotate(180)]];
        }

        //see if circles are tangent exterior
        if (round(x - c2.radius - c1.radius) == 0) {

            if (options.excludeTangents) {
                return null;
            }

            return [[unRotate(0)], [unRotate(180)]];
        }

        function bothAngles(oneAngle: number): number[] {
            return [unRotate(oneAngle), unRotate(angle.mirror(oneAngle, false, true))];
        }

        var c1IntersectionAngle = solvers.solveTriangleSSS(c2.radius, c1.radius, x);
        var c2IntersectionAngle = solvers.solveTriangleSSS(c1.radius, x, c2.radius);

        return [bothAngles(c1IntersectionAngle), bothAngles(180 - c2IntersectionAngle)];
    }
}
