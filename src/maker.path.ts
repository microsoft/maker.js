module Maker.Path {

    export function CreateArc(id: string, origin: IMakerPoint, radius: number, startAngle: number, endAngle: number): IMakerPathArc;
    export function CreateArc(id: string, origin: number[], radius: number, startAngle: number, endAngle: number): IMakerPathArc;
    export function CreateArc(id: string, origin: any, radius: number, startAngle: number, endAngle: number): IMakerPathArc {

        var arc: IMakerPathArc = {
            type: PathType.Arc,
            id: id,
            origin: Point.Ensure(origin),
            radius: radius,
            startAngle: startAngle,
            endAngle: endAngle
        };

        return arc;
    }

    export function CreateCircle(id: string, origin: IMakerPoint, radius: number): IMakerPathCircle;
    export function CreateCircle(id: string, origin: number[], radius: number): IMakerPathCircle;
    export function CreateCircle(id: string, origin: any, radius: number): IMakerPathCircle {

        var circle: IMakerPathCircle = {
            type: PathType.Circle,
            id: id,
            origin: Point.Ensure(origin),
            radius: radius
        };

        return circle;
    }

    export function CreateLine(id: string, origin: IMakerPoint, end: IMakerPoint): IMakerPathLine;
    export function CreateLine(id: string, origin: number[], end: IMakerPoint): IMakerPathLine;
    export function CreateLine(id: string, origin: IMakerPoint, end: number[]): IMakerPathLine;
    export function CreateLine(id: string, origin: number[], end: number[]): IMakerPathLine;
    export function CreateLine(id: string, origin: any, end: any): IMakerPathLine {

        var line: IMakerPathLine = {
            type: PathType.Line,
            id: id,
            origin: Point.Ensure(origin),
            end: Point.Ensure(end)
        };

        return line;
    }

    export function MoveRelative(path: IMakerPath, adjust: IMakerPoint): IMakerPath {

        var map: IMakerPathFunctionMap = {};

        map[PathType.Line] = function (line: IMakerPathLine) {
            line.end = Point.Add(line.end, adjust);
        };

        path.origin = Point.Add(path.origin, adjust);

        var fn = map[path.type];
        if (fn) {
            fn(path);
        }

        return path;
    }

    export function Rotate(path: IMakerPath, angle: number, rotationOrigin: IMakerPoint): IMakerPath {
        if (angle == 0) return path;

        var map: IMakerPathFunctionMap = {};

        map[PathType.Line] = function (line: IMakerPathLine) {
            line.end = Point.Rotate(line.end, angle, rotationOrigin);
        }

        map[PathType.Arc] = function (arc: IMakerPathArc) {
            arc.startAngle += angle;
            arc.endAngle += angle;
        }

        path.origin = Point.Rotate(path.origin, angle, rotationOrigin);

        var fn = map[path.type];
        if (fn) {
            fn(path);
        }

        return path;
    }

    export function Scale(path: IMakerPath, scale: number): IMakerPath {
        if (scale == 1) return path;

        var map: IMakerPathFunctionMap = {};

        map[PathType.Line] = function (line: IMakerPathLine) {
            line.end = Point.Scale(line.end, scale);
        }

        map[PathType.Circle] = function (circle: IMakerPathCircle) {
            circle.radius *= scale;
        }

        map[PathType.Arc] = map[PathType.Circle];

        path.origin = Point.Scale(path.origin, scale);

        var fn = map[path.type];
        if (fn) {
            fn(path);
        }

        return path;
    }

}
