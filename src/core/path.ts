/// <reference path="point.ts" />

module makerjs.path {

    /**
     * Shortcut to create a new arc path.
     * 
     * @param id The id of the new path.
     * @param origin The origin of the new path, either as a point object, or as an array of numbers.
     * @param radius The radius of the arc.
     * @param startAngle The start angle of the arc.
     * @param endAngle The end angle of the arc.
     * @returns A new POJO representing an arc path.
     */
    export function CreateArc(id: string, origin: IMakerPoint, radius: number, startAngle: number, endAngle: number): IMakerPathArc;
    export function CreateArc(id: string, origin: number[], radius: number, startAngle: number, endAngle: number): IMakerPathArc;
    export function CreateArc(id: string, origin: any, radius: number, startAngle: number, endAngle: number): IMakerPathArc {

        var arc: IMakerPathArc = {
            type: pathType.Arc,
            id: id,
            origin: point.ensure(origin),
            radius: radius,
            startAngle: startAngle,
            endAngle: endAngle
        };

        return arc;
    }

    /**
     * Shortcut to create a new circle path.
     * 
     * @param id The id of the new path.
     * @param origin The origin of the new path, either as a point object, or as an array of numbers.
     * @param radius The radius of the circle.
     * @returns A new POJO representing an circle path.
     */
    export function CreateCircle(id: string, origin: IMakerPoint, radius: number): IMakerPathCircle;
    export function CreateCircle(id: string, origin: number[], radius: number): IMakerPathCircle;
    export function CreateCircle(id: string, origin: any, radius: number): IMakerPathCircle {

        var circle: IMakerPathCircle = {
            type: pathType.Circle,
            id: id,
            origin: point.ensure(origin),
            radius: radius
        };

        return circle;
    }

    /**
     * Shortcut to create a new line path.
     * 
     * @param id The id of the new path.
     * @param origin The origin of the new path, either as a point object, or as an array of numbers.
     * @param end The end point of the line.
     * @returns A new POJO representing an line path.
     */
    export function CreateLine(id: string, origin: IMakerPoint, end: IMakerPoint): IMakerPathLine;
    export function CreateLine(id: string, origin: number[], end: IMakerPoint): IMakerPathLine;
    export function CreateLine(id: string, origin: IMakerPoint, end: number[]): IMakerPathLine;
    export function CreateLine(id: string, origin: number[], end: number[]): IMakerPathLine;
    export function CreateLine(id: string, origin: any, end: any): IMakerPathLine {

        var line: IMakerPathLine = {
            type: pathType.Line,
            id: id,
            origin: point.ensure(origin),
            end: point.ensure(end)
        };

        return line;
    }

    /**
     * Create a clone of a path, mirrored on either or both x and y axes.
     * 
     * @param pathToMirror The path to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @param newId Optional id to assign to the new path.
     * @returns Mirrored path.
     */
    export function mirror(pathToMirror: IMakerPath, mirrorX: boolean, mirrorY: boolean, newId?: string): IMakerPath {

        var newPath: IMakerPath = null;
        var origin = point.mirror(pathToMirror.origin, mirrorX, mirrorY);

        var map: IMakerPathFunctionMap = {};

        map[pathType.Line] = function (line: IMakerPathLine) {

            newPath = path.CreateLine(
                newId || line.id,
                origin,
                point.mirror(line.end, mirrorX, mirrorY)
                );
        };

        map[pathType.Circle] = function (circle: IMakerPathCircle) {

            newPath = path.CreateCircle(
                newId || circle.id,
                origin,
                circle.radius
                );
        };

        map[pathType.Arc] = function (arc: IMakerPathArc) {

            var startAngle = angle.mirror(arc.startAngle, mirrorX, mirrorY);
            var endAngle = angle.mirror(angle.arcEndAnglePastZero(arc), mirrorX, mirrorY);
            var xor = mirrorX != mirrorY;

            newPath = path.CreateArc(
                newId || arc.id,
                origin,
                arc.radius,
                xor ? endAngle : startAngle,
                xor ? startAngle : endAngle
                );
        };

        var fn = map[pathToMirror.type];
        if (fn) {
            fn(pathToMirror);
        }

        return newPath;
    }

    /**
     * Move a path's origin by a relative amount. Note: to move absolute, just set the origin property directly.
     * 
     * @param pathToMove The path to move.
     * @param adjust The x & y adjustments, either as a point object, or as an array of numbers.
     * @returns The original path (for chaining).
     */
    export function moveRelative(pathToMove: IMakerPath, adjust: IMakerPoint): IMakerPath;
    export function moveRelative(pathToMove: IMakerPath, adjust: number[]): IMakerPath;
    export function moveRelative(pathToMove: IMakerPath, adjust: any): IMakerPath {

        var map: IMakerPathFunctionMap = {};

        map[pathType.Line] = function (line: IMakerPathLine) {
            line.end = point.add(line.end, adjust);
        };

        pathToMove.origin = point.add(pathToMove.origin, adjust);

        var fn = map[pathToMove.type];
        if (fn) {
            fn(pathToMove);
        }

        return pathToMove;
    }

    /**
     * Rotate a path.
     * 
     * @param pathToRotate The path to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns The original path (for chaining).
     */
    export function rotate(pathToRotate: IMakerPath, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerPath {
        if (angleInDegrees == 0) return pathToRotate;

        var map: IMakerPathFunctionMap = {};

        map[pathType.Line] = function (line: IMakerPathLine) {
            line.end = point.rotate(line.end, angleInDegrees, rotationOrigin);
        }

        map[pathType.Arc] = function (arc: IMakerPathArc) {
            arc.startAngle += angleInDegrees;
            arc.endAngle += angleInDegrees;
        }

        pathToRotate.origin = point.rotate(pathToRotate.origin, angleInDegrees, rotationOrigin);

        var fn = map[pathToRotate.type];
        if (fn) {
            fn(pathToRotate);
        }

        return pathToRotate;
    }

    /**
     * Scale a path.
     * 
     * @param pathToScale The path to scale.
     * @param scaleValue The amount of scaling.
     * @returns The original path (for chaining).
     */
    export function scale(pathToScale: IMakerPath, scaleValue: number): IMakerPath {
        if (scaleValue == 1) return pathToScale;

        var map: IMakerPathFunctionMap = {};

        map[pathType.Line] = function (line: IMakerPathLine) {
            line.end = point.scale(line.end, scaleValue);
        }

        map[pathType.Circle] = function (circle: IMakerPathCircle) {
            circle.radius *= scaleValue;
        }

        map[pathType.Arc] = map[pathType.Circle];

        pathToScale.origin = point.scale(pathToScale.origin, scaleValue);

        var fn = map[pathToScale.type];
        if (fn) {
            fn(pathToScale);
        }

        return pathToScale;
    }

}
