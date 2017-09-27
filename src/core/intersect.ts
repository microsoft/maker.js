namespace MakerJs.path {

    /**
     * @private
     */
    interface IPathIntersectionMap {
        [type: string]: { [type: string]: (path1: IPath, path2: IPath, options: IPathIntersectionOptions, swapOffsets?: boolean) => IPathIntersection };
    }

    /**
     * @private
     */
    var map: IPathIntersectionMap = {};

    map[pathType.Arc] = {};
    map[pathType.Circle] = {};
    map[pathType.Line] = {};

    map[pathType.Arc][pathType.Arc] = function (arc1: IPathArc, arc2: IPathArc, options: IPathIntersectionOptions, swapOffsets: boolean) {
        var result: IPathIntersection = null;

        moveTemp([arc1, arc2], options, swapOffsets, function () {

            var angles = circleToCircle(arc1, arc2, options);
            if (angles) {
                var arc1Angles = getAnglesWithinArc(angles[0], arc1, options);
                var arc2Angles = getAnglesWithinArc(angles[1], arc2, options);
                if (arc1Angles && arc2Angles) {

                    //must correspond to the same angle indexes
                    if (arc1Angles.length === 1 || arc2Angles.length === 1) {

                        for (var i1 = 0; i1 < arc1Angles.length; i1++) {
                            for (var i2 = 0; i2 < arc2Angles.length; i2++) {

                                var p1 = point.fromAngleOnCircle(arc1Angles[i1], arc1);
                                var p2 = point.fromAngleOnCircle(arc2Angles[i2], arc2);

                                //if they do not correspond then they don't intersect
                                if (measure.isPointEqual(p1, p2, .0001)) {

                                    result = {
                                        intersectionPoints: [p1],
                                        path1Angles: [arc1Angles[i1]],
                                        path2Angles: [arc2Angles[i2]]
                                    };

                                    return;
                                }
                            }
                        }

                    } else {

                        result = {
                            intersectionPoints: pointsFromAnglesOnCircle(arc1Angles, arc1),
                            path1Angles: arc1Angles,
                            path2Angles: arc2Angles
                        };
                    }
                }
            } else {
                if (options.out_AreOverlapped) {
                    //overlapped for circle, reset and see if arcs actually overlap.

                    options.out_AreOverlapped = measure.isArcOverlapping(arc1, arc2, options.excludeTangents);
                }
            }
        });

        return result;
    };

    map[pathType.Arc][pathType.Circle] = function (arc: IPathArc, circle: IPathArc, options: IPathIntersectionOptions, swapOffsets: boolean) {
        var result: IPathIntersection = null;

        moveTemp([arc, circle], options, swapOffsets, function () {

            var angles = circleToCircle(arc, circle, options);
            if (angles) {
                var arcAngles = getAnglesWithinArc(angles[0], arc, options);
                if (arcAngles) {
                    var circleAngles: number[];

                    //if both points are on arc, use both on circle
                    if (arcAngles.length == 2) {
                        circleAngles = angles[1];
                    } else {
                        //use the corresponding point on circle 
                        var index = findCorrespondingAngleIndex(angles[0], arcAngles[0]);
                        circleAngles = [angles[1][index]];
                    }

                    result = {
                        intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                        path1Angles: arcAngles,
                        path2Angles: circleAngles
                    };
                }
            }
        });

        return result;
    };

    map[pathType.Arc][pathType.Line] = function (arc: IPathArc, line: IPathLine, options: IPathIntersectionOptions, swapOffsets: boolean) {
        var result: IPathIntersection = null;

        moveTemp([arc, line], options, swapOffsets, function () {

            var angles = lineToCircle(line, arc, options);
            if (angles) {
                var arcAngles = getAnglesWithinArc(angles, arc, options);
                if (arcAngles) {
                    result = {
                        intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                        path1Angles: arcAngles
                    };
                }
            }
        });

        return result;
    };

    map[pathType.Circle][pathType.Arc] = function (circle: IPathCircle, arc: IPathArc, options: IPathIntersectionOptions) {
        var result = map[pathType.Arc][pathType.Circle](arc, circle, options, true);
        if (result) {
            return swapAngles(result);
        }
        return null;
    };

    map[pathType.Circle][pathType.Circle] = function (circle1: IPathCircle, circle2: IPathCircle, options: IPathIntersectionOptions, swapOffsets: boolean) {
        var result: IPathIntersection = null;

        moveTemp([circle1, circle2], options, swapOffsets, function () {

            var angles = circleToCircle(circle1, circle2, options);
            if (angles) {
                result = {
                    intersectionPoints: pointsFromAnglesOnCircle(angles[0], circle1),
                    path1Angles: angles[0],
                    path2Angles: angles[1]
                };
            }
        });

        return result;
    };

    map[pathType.Circle][pathType.Line] = function (circle: IPathCircle, line: IPathLine, options: IPathIntersectionOptions, swapOffsets: boolean) {
        var result: IPathIntersection = null;

        moveTemp([circle, line], options, swapOffsets, function () {

            var angles = lineToCircle(line, circle, options);
            if (angles) {
                result = {
                    intersectionPoints: pointsFromAnglesOnCircle(angles, circle),
                    path1Angles: angles
                };
            }
        });

        return result;
    };

    map[pathType.Line][pathType.Arc] = function (line: IPathLine, arc: IPathArc, options: IPathIntersectionOptions) {
        var result = map[pathType.Arc][pathType.Line](arc, line, options, true);
        if (result) {
            return swapAngles(result);
        }
        return null;
    };

    map[pathType.Line][pathType.Circle] = function (line: IPathLine, circle: IPathCircle, options: IPathIntersectionOptions) {
        var result = map[pathType.Circle][pathType.Line](circle, line, options, true);
        if (result) {
            return swapAngles(result);
        }
        return null;
    };

    map[pathType.Line][pathType.Line] = function (line1: IPathLine, line2: IPathLine, options: IPathIntersectionOptions, swapOffsets: boolean) {
        var result: IPathIntersection = null;

        moveTemp([line1, line2], options, swapOffsets, function () {

            var intersectionPoint = point.fromSlopeIntersection(line1, line2, options);
            if (intersectionPoint) {

                //we have the point of intersection of endless lines, now check to see if the point is between both segemnts
                if (measure.isBetweenPoints(intersectionPoint, line1, options.excludeTangents) && measure.isBetweenPoints(intersectionPoint, line2, options.excludeTangents)) {
                    result = {
                        intersectionPoints: [intersectionPoint]
                    };
                }
            }
        });

        return result;
    };

    /**
     * @private
     */
    function moveTemp(pathsToOffset: IPath[], options: IPathIntersectionOptions, swapOffsets: boolean, task: Function) {
        var offsets = swapOffsets ? [options.path2Offset, options.path1Offset] : [options.path1Offset, options.path2Offset];
        moveTemporary(pathsToOffset, offsets, task);
    };

    /**
     * @private
     */
    function swapAngles(result: IPathIntersection) {
        var temp = result.path1Angles;

        if (result.path2Angles) {
            result.path1Angles = result.path2Angles;
        } else {
            delete result.path1Angles;
        }

        if (temp) {
            result.path2Angles = temp;
        }

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
    function findCorrespondingAngleIndex(circleAngles: number[], arcAngle: number): number {
        for (var i = 2; i--;) {
            if (circleAngles[i] === arcAngle) return i;
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
     * @private
     */
    function lineToCircle(line: IPathLine, circle: IPathCircle, options: IPathIntersectionOptions): number[] {

        var radius = round(circle.radius);

        //no-op for degenerate circle
        if (circle.radius <= 0) {
            return null;
        }

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
            return round(angle.noRevolutions(unrotated));
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
        
        //no-op if either circle is degenerate
        if (circle1.radius <= 0 || circle2.radius <= 0) {
            return null;
        }

        //see if circles are the same
        if (circle1.radius == circle2.radius && measure.isPointEqual(circle1.origin, circle2.origin, .0001)) {
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

        //see if circles are tangent interior on left side
        if (round(c2.radius - x - c1.radius) == 0) {

            if (options.excludeTangents) {
                return null;
            }

            return [[unRotate(180)], [unRotate(180)]];
        }

        //see if circles are tangent interior on right side
        if (round(c2.radius + x - c1.radius) == 0) {

            if (options.excludeTangents) {
                return null;
            }

            return [[unRotate(0)], [unRotate(0)]];
        }

        //see if circles are tangent exterior
        if (round(x - c2.radius - c1.radius) == 0) {

            if (options.excludeTangents) {
                return null;
            }

            return [[unRotate(0)], [unRotate(180)]];
        }

        //see if c2 is outside of c1
        if (round(x - c2.radius) > c1.radius) {
            return null;
        }

        //see if c2 is within c1
        if (round(x + c2.radius) < c1.radius) {
            return null;
        }

        //see if c1 is within c2
        if (round(x - c2.radius) < -c1.radius) {
            return null;
        }

        function bothAngles(oneAngle: number): number[] {
            return [unRotate(oneAngle), unRotate(angle.mirror(oneAngle, false, true))];
        }

        var c1IntersectionAngle = solvers.solveTriangleSSS(c2.radius, c1.radius, x);
        var c2IntersectionAngle = solvers.solveTriangleSSS(c1.radius, x, c2.radius);

        return [bothAngles(c1IntersectionAngle), bothAngles(180 - c2IntersectionAngle)];
    }
}
