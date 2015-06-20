/// <reference path="../core/maker.ts" />

module MakerJs.tools {

    interface IPathPathFunctionMap {
        [type: string]: (path1: IPath) => IPoint[];
    }

    export function intersection(path1: IPath, path2: IPath): IPoint {

        //var fn = map[path1.type];
        //if (fn) {
        //    return fn(path1);
        //}

        return null;
    }

    interface ISlope {
        hasSlope: boolean;
        slope?: number;
        line?: IPathLine;
        yIntercept?: number;
    }

    function getSlope(line: IPathLine): ISlope {
        var dx = line.end[0] - line.origin[0];
        if (dx == 0) {
            return {
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

    function verticalIntersectionPoint(verticalLine: IPathLine, nonVerticalSlope: ISlope ): IPoint {
        var x = verticalLine.origin[0];
        var y = nonVerticalSlope.slope * x + nonVerticalSlope.yIntercept;
        return [x, y];
    }

    function isBetween(valueInQuestion: number, limit1: number, limit2: number): boolean {
        return Math.min(limit1, limit2) <= valueInQuestion && valueInQuestion <= Math.max(limit1, limit2);
    }

    function isBetweenPoints(pointInQuestion: IPoint, line: IPathLine): boolean {
        for (var i = 2; i--;) {
            if (!isBetween(pointInQuestion[i], line.origin[i], line.end[i])) return false;
        }
        return true;
    }

    export function lineToLine(line1: IPathLine, line2: IPathLine): IPoint {

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

    export function lineToCircle(line: IPathLine, circle: IPathCircle): number[] {

        function getLineAngle(p1: IPoint, p2: IPoint) {
            return angle.noRevolutions(angle.toDegrees(angle.fromPointToRadians(p1, p2)));
        }

        var radius = round(circle.radius);

        //clone the line
        var clonedLine = new paths.Line('red', point.subtract(line.origin, circle.origin), point.subtract(line.end, circle.origin));

        //get angle of line
        var lineAngleNormal = getLineAngle(line.origin, line.end);

        //use the positive horizontal angle
        var lineAngle = (lineAngleNormal >= 180) ? lineAngleNormal - 360 : lineAngleNormal;

        //rotate the line to horizontal
        path.rotate(clonedLine, -lineAngle, point.zero());

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

        //if horizontal Y is the same as the radius, we know it's 90 degrees
        if (lineY == radius) {
            return [unRotate(90)];
        }

        var anglesOfIntersection = [];

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

        return anglesOfIntersection;
    }

    export function lineToArc(line: IPathLine, arc: IPathArc) {
        var angles = lineToCircle(line, arc);

        if (!angles) return null;

        var anglesWithinArc = [];

        for (var i = 0; i < angles.length; i++) {
            if (isBetween(angles[i], arc.startAngle, arc.endAngle)) {
                anglesWithinArc.push(angles[i]);
            }
        }

        if (anglesWithinArc.length == 0) return null;

        return anglesWithinArc;
    }
} 