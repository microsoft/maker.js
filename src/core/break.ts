/// <reference path="path.ts" />

module MakerJs.path {

    /**
     * @private
     */
    interface IBreakPathFunctionMap {
        [type: string]: (path: IPath, pointOfBreak: IPoint) => IPath;
    }

    /**
     * @private
     */
    var breakPathFunctionMap: IBreakPathFunctionMap = {};

    breakPathFunctionMap[pathType.Arc] = function (arc: IPathArc, pointOfBreak: IPoint): IPath {

        var angleAtBreakPoint = angle.ofPointInDegrees(arc.origin, pointOfBreak);

        if (angle.areEqual(angleAtBreakPoint, arc.startAngle) || angle.areEqual(angleAtBreakPoint, arc.endAngle)) {
            return null;
        }

        function getAngleStrictlyBetweenArcAngles() {
            var endAngle = angle.ofArcEnd(arc);
            var tries = [0, 1, -1];
            for (var i = 0; i < tries.length; i++) {
                var add = + 360 * tries[i];
                if (measure.isBetween(angleAtBreakPoint + add, arc.startAngle, endAngle, true)) {
                    return angleAtBreakPoint + add;
                }
            }
            return null;
        }

        var angleAtBreakPointBetween = getAngleStrictlyBetweenArcAngles();
        if (angleAtBreakPointBetween == null) {
            return null;
        }

        var savedEndAngle = arc.endAngle;

        arc.endAngle = angleAtBreakPointBetween;

        return new paths.Arc(arc.origin, arc.radius, angleAtBreakPointBetween, savedEndAngle);
    };

    breakPathFunctionMap[pathType.Circle] = function (circle: IPathCircle, pointOfBreak: IPoint): IPath {
        circle.type = pathType.Arc;

        var arc: IPathArc = <IPathArc>circle;

        var angleAtBreakPoint = angle.ofPointInDegrees(circle.origin, pointOfBreak);

        arc.startAngle = angleAtBreakPoint;
        arc.endAngle = angleAtBreakPoint + 360;

        return null;
    };

    breakPathFunctionMap[pathType.Line] = function (line: IPathLine, pointOfBreak: IPoint): IPath {

        if (point.areEqual(line.origin, pointOfBreak) || point.areEqual(line.end, pointOfBreak)) {
            return null;
        }

        var savedEndPoint = line.end;

        line.end = pointOfBreak;

        return new paths.Line(pointOfBreak, savedEndPoint);
    };

    /**
     * Breaks a path in two. The supplied path will end at the supplied pointOfBreak, 
     * a new path is returned which begins at the pointOfBreak and ends at the supplied path's initial end point.
     * For Circle, the original path will be converted in place to an Arc, and null is returned.
     * 
     * @param pathToBreak The path to break.
     * @param pointOfBreak The point at which to break the path.
     * @returns A new path of the same type, when path type is line or arc. Returns null for circle.
     */
    export function breakAtPoint(pathToBreak: IPath, pointOfBreak: IPoint): IPath {
        if (pathToBreak && pointOfBreak) {
            var fn = breakPathFunctionMap[pathToBreak.type];
            if (fn) {
                return fn(pathToBreak, pointOfBreak);
            }
        }
        return null;
    }

}
