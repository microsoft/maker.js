/// <reference path="maker.ts" />

module Maker.Point {

    export function Add(a: IMakerPoint, b: IMakerPoint, subtract = false): IMakerPoint {
        var p1 = Clone(Ensure(a));
        var p2 = Ensure(b);
        if (subtract) {
            p1.x -= p2.x;
            p1.y -= p2.y;
        } else {
            p1.x += p2.x;
            p1.y += p2.y;
        }
        return p1;
    }

    export function AddArray(...points: IMakerPoint[]): IMakerPoint {
        var point = Clone(Ensure(points[0]));
        for (var i = 1; i < points.length; i++) {
            point = Add(point, points[i]);
        }
        return point;
    }

    export function Clone(point: IMakerPoint): IMakerPoint {
        return { x: point.x, y: point.y };
    }

    export function Ensure(point: IMakerPoint): IMakerPoint;
    export function Ensure(point: number[]): IMakerPoint;
    export function Ensure(): IMakerPoint;
    export function Ensure(item?: any): IMakerPoint {

        if (!item) {
            return Zero();
        }

        if (IsPoint(item)) {
            return item;
        }

        if (Array.isArray(item) && item.length > 1) {
            return { x: item[0], y: item[1] };
        }

        if (arguments.length > 1) {
            return { x: arguments[0], y: arguments[0] };
        }

        return Zero();
    }

    export function FromPolar(angleInRadians: number, radius: number): IMakerPoint {
        return {
            x: radius * Math.cos(angleInRadians),
            y: radius * Math.sin(angleInRadians)
        };
    }

    export function FromArc(arc: IMakerPathArc): IMakerPoint[] {

        function getPointFromAngle(angle: number) {
            return Add(arc.origin, FromPolar(Angle.ToRadians(angle), arc.radius));
        }

        return [getPointFromAngle(arc.startAngle), getPointFromAngle(arc.endAngle)];
    }

    export function Mirror(point: IMakerPoint, mirrorX: boolean, mirrorY: boolean): IMakerPoint {
        var p = Clone(Ensure(point));

        if (mirrorX) {
            p.x = -p.x;
        }

        if (mirrorY) {
            p.y = -p.y;
        }

        return p;
    }

    export function Rotate(point: IMakerPoint, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerPoint {
        var pointAngleInRadians = Angle.FromPointToRadians(point, rotationOrigin);
        var d = Measure.PointDistance(rotationOrigin, point);
        var rotatedPoint = FromPolar(pointAngleInRadians + Angle.ToRadians(angleInDegrees), d);

        return Add(rotationOrigin, rotatedPoint);
    }

    export function Scale(point: IMakerPoint, scale: number): IMakerPoint {
        var p = Clone(Ensure(point));
        p.x *= scale;
        p.y *= scale;
        return p;
    }

    export function Subtract(a: IMakerPoint, b: IMakerPoint): IMakerPoint {
        return Add(a, b, true);
    }

    export function Zero(): IMakerPoint {
        return { x: 0, y: 0 };
    }

}
