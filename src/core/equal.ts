namespace MakerJs.measure {

    /**
     * Find out if two angles are equal.
     * 
     * @param a First angle.
     * @param b Second angle.
     * @returns true if angles are the same, false if they are not
     */
    export function isAngleEqual(angle1: number, angle2: number, accuracy: number = .0001) {
        var a1 = angle.noRevolutions(angle1);
        var a2 = angle.noRevolutions(angle2);
        var d = angle.noRevolutions(round(a2 - a1, accuracy));
        return d == 0;
    }

    /**
     * @private
     */
    interface IPathAreEqualMap {
        [type: string]: (path1: IPath, path2: IPath, withinPointDistance?: number) => boolean;
    }

    /**
     * @private
     */
    var pathAreEqualMap: IPathAreEqualMap = {};

    pathAreEqualMap[pathType.Line] = function (line1: IPathLine, line2: IPathLine, withinPointDistance?: number): boolean {
        return (isPointEqual(line1.origin, line2.origin, withinPointDistance) && isPointEqual(line1.end, line2.end, withinPointDistance))
            || (isPointEqual(line1.origin, line2.end, withinPointDistance) && isPointEqual(line1.end, line2.origin, withinPointDistance));
    };

    pathAreEqualMap[pathType.Circle] = function (circle1: IPathCircle, circle2: IPathCircle, withinPointDistance): boolean {
        return isPointEqual(circle1.origin, circle2.origin, withinPointDistance) && circle1.radius == circle2.radius;
    };

    pathAreEqualMap[pathType.Arc] = function (arc1: IPathArc, arc2: IPathArc, withinPointDistance): boolean {
        return pathAreEqualMap[pathType.Circle](arc1, arc2, withinPointDistance) && isAngleEqual(arc1.startAngle, arc2.startAngle) && isAngleEqual(arc1.endAngle, arc2.endAngle);
    };

    /**
     * Find out if two paths are equal.
     * 
     * @param a First path.
     * @param b Second path.
     * @returns true if paths are the same, false if they are not
     */
    export function isPathEqual(path1: IPath, path2: IPath, withinPointDistance?: number): boolean {

        var result = false;

        if (path1.type == path2.type) {
            var fn = pathAreEqualMap[path1.type];
            if (fn) {
                result = fn(path1, path2, withinPointDistance);
            }
        }

        return result;
    }

    /**
     * Find out if two points are equal.
     * 
     * @param a First point.
     * @param b Second point.
     * @returns true if points are the same, false if they are not
     */
    export function isPointEqual(a: IPoint, b: IPoint, withinDistance?: number): boolean {
        if (!withinDistance) {
            return a[0] == b[0] && a[1] == b[1];
        } else {
            var distance = measure.pointDistance(a, b);
            return distance <= withinDistance;
        }
    }

    /**
     * Check for slope equality.
     * 
     * @param slope1 The ISlope to test.
     * @param slope2 The ISlope to check for equality.
     * @returns Boolean true if slopes are equal.
     */
    export function isSlopeEqual(slope1: ISlope, slope2: ISlope): boolean {

        if (!slope1.hasSlope && !slope2.hasSlope) {

            //lines are both vertical, see if x are the same
            return round(slope1.line.origin[0] - slope2.line.origin[0]) == 0;
        }

        if (slope1.hasSlope && slope2.hasSlope && (round(slope1.slope - slope2.slope, .00001) == 0)) {

            //lines are parallel, but not vertical, see if y-intercept is the same
            return round(slope1.yIntercept - slope2.yIntercept, .00001) == 0;
        }

        return false;
    }

}