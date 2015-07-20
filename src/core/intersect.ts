/// <reference path="solvers.ts" />

module MakerJs.path {

    /**
     * @private
     */
    interface IPathIntersectionMap {
        [type: string]: { [type: string]: (path1: IPath, path2: IPath) => IPathIntersection };
    }

    /**
     * @private
     */
    var map: IPathIntersectionMap = {};

    map[pathType.Arc] = {};
    map[pathType.Circle] = {};
    map[pathType.Line] = {};

    map[pathType.Arc][pathType.Arc] = function (arc1: IPathArc, arc2: IPathArc) {
        var angles = circleToCircle(arc1, arc2);
        if (angles) {
            var arc1Angles = getAnglesWithinArc(angles[0], arc1);
            var arc2Angles = getAnglesWithinArc(angles[1], arc2);
            if (arc1Angles && arc2Angles) {
                return {
                    intersectionPoints: pointsFromAnglesOnCircle(arc1Angles, arc1),
                    path1Angles: arc1Angles,
                    path2Angles: arc2Angles
                };
            }
        }
        return null;
    };

    map[pathType.Arc][pathType.Circle] = function (arc: IPathArc, circle: IPathArc) {
        var angles = circleToCircle(arc, circle);
        if (angles) {
            var arcAngles = getAnglesWithinArc(angles[0], arc);
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

    map[pathType.Arc][pathType.Line] = function (arc: IPathArc, line: IPathLine) {
        var angles = lineToCircle(line, arc);
        if (angles) {
            var arcAngles = getAnglesWithinArc(angles, arc);
            if (arcAngles) {
                return {
                    intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                    path1Angles: arcAngles
                };
            }
        }
        return null;
    };

    map[pathType.Circle][pathType.Arc] = function (circle: IPathCircle, arc: IPathArc) {
        var result = map[pathType.Arc][pathType.Circle](arc, circle);
        if (result) {
            return swap(result);
        }
        return null;
    };

    map[pathType.Circle][pathType.Circle] = function (circle1: IPathCircle, circle2: IPathCircle) {
        var angles = circleToCircle(circle1, circle2);
        if (angles) {
            return {
                intersectionPoints: pointsFromAnglesOnCircle(angles[0], circle1),
                path1Angles: angles[0],
                path2Angles: angles[1]
            };
        }
        return null;
    };

    map[pathType.Circle][pathType.Line] = function (circle: IPathCircle, line: IPathLine) {
        var angles = lineToCircle(line, circle);
        if (angles) {
            return {
                intersectionPoints: pointsFromAnglesOnCircle(angles, circle),
                path1Angles: angles
            };
        }
        return null;
    };

    map[pathType.Line][pathType.Arc] = function (line: IPathLine, arc: IPathArc) {
        var result = map[pathType.Arc][pathType.Line](arc, line);
        if (result) {
            return swap(result);
        }
        return null;
    };

    map[pathType.Line][pathType.Circle] = function (line: IPathLine, circle: IPathCircle) {
        var result = map[pathType.Circle][pathType.Line](circle, line);
        if (result) {
            return swap(result);
        }
        return null;
    };

    map[pathType.Line][pathType.Line] = function (line1: IPathLine, line2: IPathLine) {
        var intersectionPoint = lineToLine(line1, line2);
        if (intersectionPoint) {
            return {
                intersectionPoints: [intersectionPoint]
            };
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
     * @returns IPathIntersection object, with points(s) of intersection (and angles, when a path is an arc or circle); or null if the paths did not intersect.
     */
    export function intersection(path1: IPath, path2: IPath): IPathIntersection {

        if (path1 && path2) {
            var fn = map[path1.type][path2.type];
            if (fn) {
                return fn(path1, path2);
            }
        }
        return null;
    }

    /**
     * @private
     */
    function findCorrespondingAngleIndex(circleAngles: number[][], arcAngle: number[]): number {
        for (var i = 0; i < circleAngles.length; i++) {
            if (circleAngles[i] === arcAngle) return i;
        }
    }

    /**
     * @private
     */
    function pointFromAngleOnCircle(angleInDegrees: number, circle: IPathCircle): IPoint {
        return point.add(circle.origin, point.fromPolar(angle.toRadians(angleInDegrees), circle.radius));
    }

    /**
     * @private
     */
    function pointsFromAnglesOnCircle(anglesInDegrees: number[], circle: IPathCircle): IPoint[] {
        var result = [];
        for (var i = 0; i < anglesInDegrees.length; i++) {
            result.push(pointFromAngleOnCircle(anglesInDegrees[i], circle));
        }
        return result;
    }

    /**
     * @private
     */
    function getAnglesWithinArc(angles: number[], arc: IPathArc): number[] {

        if (!angles) return null;

        var anglesWithinArc: number[] = [];

        //computed angles will not be negative, but the arc may have specified a negative angle
        var startAngle = arc.startAngle;
        var endAngle = angle.ofArcEnd(arc);

        for (var i = 0; i < angles.length; i++) {
            if (isBetween(angles[i], startAngle, endAngle) || isBetween(angles[i], startAngle + 360, endAngle + 360) || isBetween(angles[i], startAngle - 360, endAngle - 360)) {
                anglesWithinArc.push(angles[i]);
            }
        }

        if (anglesWithinArc.length == 0) return null;

        return anglesWithinArc;
    }

    /**
     * @private
     */
    interface ISlope {
        hasSlope: boolean;
        slope?: number;
        line?: IPathLine;
        yIntercept?: number;
    }

    /**
     * @private
     */
    function getSlope(line: IPathLine): ISlope {
        var dx = round(line.end[0] - line.origin[0]);
        if (dx == 0) {
            return {
                hasSlope: false
            };
        }

        var dy = round(line.end[1] - line.origin[1]);

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
    function isBetween(valueInQuestion: number, limit1: number, limit2: number): boolean {
        return Math.min(limit1, limit2) <= valueInQuestion && valueInQuestion <= Math.max(limit1, limit2);
    }

    /**
     * @private
     */
    function isBetweenPoints(pointInQuestion: IPoint, line: IPathLine): boolean {
        for (var i = 2; i--;) {
            if (!isBetween(round(pointInQuestion[i]), round(line.origin[i]), round(line.end[i]))) return false;
        }
        return true;
    }

    /**
     * @private
     */
    function lineToLine(line1: IPathLine, line2: IPathLine): IPoint {

        var slope1 = getSlope(line1);
        var slope2 = getSlope(line2);

        if (!slope1.hasSlope && !slope2.hasSlope) {
            //lines are both vertical
            return null;
        }

        if (slope1.hasSlope && slope2.hasSlope && (slope1.slope == slope2.slope)) {
            //lines are parallel
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

        //we have the point of intersection of endless lines, now check to see if the point is between both segemnts
        if (isBetweenPoints(pointOfIntersection, line1) && isBetweenPoints(pointOfIntersection, line2)) {
            return pointOfIntersection;
        }

        return null;
    }

    /**
     * @private
     */
    function lineToCircle(line: IPathLine, circle: IPathCircle): number[] {

        function getLineAngle(p1: IPoint, p2: IPoint) {
            return angle.noRevolutions(angle.toDegrees(angle.ofPointInRadians(p1, p2)));
        }

        var radius = round(circle.radius);

        //clone the line
        var clonedLine = new paths.Line(point.subtract(line.origin, circle.origin), point.subtract(line.end, circle.origin));

        //get angle of line
        var lineAngleNormal = getLineAngle(line.origin, line.end);

        //use the positive horizontal angle
        var lineAngle = (lineAngleNormal >= 180) ? lineAngleNormal - 360 : lineAngleNormal;

        //rotate the line to horizontal
        rotate(clonedLine, -lineAngle, point.zero());

        //remember how to undo the rotation we just did
        function unRotate(resultAngle: number): number {
            var unrotated = resultAngle + lineAngle;
            return round(angle.noRevolutions(unrotated), .0001);
        }

        //line is horizontal, get the y value from any point
        var lineY = round(clonedLine.origin[1]);

        //if y is greater than radius, there is no intersection
        if (lineY > radius) {
            return null;
        }

        var anglesOfIntersection: number[] = [];

        //if horizontal Y is the same as the radius, we know it's 90 degrees
        if (lineY == radius) {

            anglesOfIntersection.push(unRotate(90));

        } else {

            function intersectionBetweenEndpoints(x: number, angleOfX: number) {
                if (isBetween(x, clonedLine.origin[0], clonedLine.end[0])) {
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

        return anglesOfIntersection;
    }

    /**
     * @private
     */
    function circleToCircle(circle1: IPathCircle, circle2: IPathCircle): number[][] {

        //see if circles are the same
        if (circle1.radius == circle2.radius && point.areEqual(circle1.origin, circle2.origin)) {
            return null;
        }

        //get offset from origin
        var offset = point.subtract(point.zero(), circle1.origin);

        //clone circle1 and move to origin
        var c1 = new paths.Circle(point.zero(), circle1.radius);

        //clone circle2 and move relative to circle1
        var c2 = new paths.Circle(point.subtract(circle2.origin, circle1.origin), circle2.radius);

        //rotate circle2 to horizontal, c2 will be to the right of the origin.
        var c2Angle = angle.toDegrees(angle.ofPointInRadians(point.zero(), c2.origin));
        rotate(c2, -c2Angle, point.zero());

        function unRotate(resultAngle: number): number {
            var unrotated = resultAngle + c2Angle;
            return round(angle.noRevolutions(unrotated), .0001);
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
        if (c2.radius - x == c1.radius) {
            return [[unRotate(180)], [unRotate(180)]];
        }

        //see if circles are tangent exterior
        if (x - c2.radius == c1.radius) {
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
