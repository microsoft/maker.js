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

        var angleAtBreakPoint = angle.toDegrees(angle.ofPointInRadians(arc.origin, pointOfBreak));

        var savedEndAngle = arc.endAngle;

        arc.endAngle = angleAtBreakPoint;

        return new paths.Arc(arc.origin, arc.radius, angleAtBreakPoint, savedEndAngle);
    };

    breakPathFunctionMap[pathType.Circle] = function (circle: IPathCircle, pointOfBreak: IPoint): IPath {
        circle.type = pathType.Arc;

        var arc: IPathArc = <IPathArc>circle;

        var angleAtBreakPoint = angle.toDegrees(angle.ofPointInRadians(circle.origin, pointOfBreak));

        arc.startAngle = angleAtBreakPoint;
        arc.endAngle = angleAtBreakPoint + 360;

        return null;
    };

    breakPathFunctionMap[pathType.Line] = function (line: IPathLine, pointOfBreak: IPoint): IPath {

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

        var fn = breakPathFunctionMap[pathToBreak.type];
        if (fn) {
            return fn(pathToBreak, pointOfBreak);
        }

        return null;
    }

}
