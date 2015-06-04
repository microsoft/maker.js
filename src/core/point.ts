/// <reference path="maker.ts" />

module Maker.Point {

    /**
     * Add two points together and return the result as a new point object.
     * 
     * @param a First point, either as a point object, or as an array of numbers.
     * @param b Second point, either as a point object, or as an array of numbers.
     * @param subtract Optional boolean to subtract instead of add.
     * @returns A new point object.
     */
    export function Add(a: IMakerPoint, b: IMakerPoint, subtract?: boolean): IMakerPoint;
    export function Add(a: IMakerPoint, b: number[], subtract?: boolean): IMakerPoint;
    export function Add(a: number[], b: IMakerPoint, subtract?: boolean): IMakerPoint;
    export function Add(a: number[], b: number[], subtract?: boolean): IMakerPoint;
    export function Add(a: any, b: any, subtract = false): IMakerPoint {
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

    /**
     * Clone a point into a new point.
     * 
     * @param pointToClone The point to clone.
     * @returns A new point with same values as the original.
     */
    export function Clone(pointToClone: IMakerPoint): IMakerPoint {
        return { x: pointToClone.x, y: pointToClone.y };
    }

    /**
     * Ensures that an item has the properties of a point object.
     * 
     * @param pointToEnsure The object to ensure; may be a point object, or an array of numbers, or something else which will attempt to coerce into a point.
     * @returns A new point object either with the x, y values corresponding to the input, or 0,0 coordinates.
     */
    export function Ensure(pointToEnsure: IMakerPoint): IMakerPoint;
    export function Ensure(pointToEnsure: number[]): IMakerPoint;
    export function Ensure(): IMakerPoint;
    export function Ensure(pointToEnsure?: any): IMakerPoint {

        if (!pointToEnsure) {
            return Zero();
        }

        if (IsPoint(pointToEnsure)) {
            return pointToEnsure;
        }

        if (Array.isArray(pointToEnsure) && pointToEnsure.length > 1) {
            return { x: pointToEnsure[0], y: pointToEnsure[1] };
        }

        if (arguments.length > 1) {
            return { x: arguments[0], y: arguments[0] };
        }

        return Zero();
    }

    /**
     * Get a point from its polar coordinates.
     * 
     * @param angleInRadians The angle of the polar coordinate, in radians.
     * @param radius The radius of the polar coordinate.
     * @returns A new point object.
     */
    export function FromPolar(angleInRadians: number, radius: number): IMakerPoint {
        return {
            x: radius * Math.cos(angleInRadians),
            y: radius * Math.sin(angleInRadians)
        };
    }

    /**
     * Get the two end points of an arc path.
     * 
     * @param arc The arc path object.
     * @returns Array with 2 elements: [0] is the point object corresponding to the start angle, [1] is the point object corresponding to the end angle.
     */
    export function FromArc(arc: IMakerPathArc): IMakerPoint[] {

        function getPointFromAngle(a: number) {
            return Add(arc.origin, FromPolar(Angle.ToRadians(a), arc.radius));
        }

        return [getPointFromAngle(arc.startAngle), getPointFromAngle(arc.endAngle)];
    }

    /**
     * Create a clone of a point, mirrored on either or both x and y axes.
     * 
     * @param pointToMirror The point to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored point.
     */
    export function Mirror(pointToMirror: IMakerPoint, mirrorX: boolean, mirrorY: boolean): IMakerPoint {
        var p = Clone(Ensure(pointToMirror));

        if (mirrorX) {
            p.x = -p.x;
        }

        if (mirrorY) {
            p.y = -p.y;
        }

        return p;
    }

    /**
     * Rotate a point.
     * 
     * @param pointToRotate The point to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns A new point.
     */
    export function Rotate(pointToRotate: IMakerPoint, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerPoint {
        var pointAngleInRadians = Angle.FromPointToRadians(pointToRotate, rotationOrigin);
        var d = Measure.PointDistance(rotationOrigin, pointToRotate);
        var rotatedPoint = FromPolar(pointAngleInRadians + Angle.ToRadians(angleInDegrees), d);

        return Add(rotationOrigin, rotatedPoint);
    }

    /**
     * Scale a point's coordinates.
     * 
     * @param pointToScale The point to scale.
     * @param scale The amount of scaling.
     * @returns A new point.
     */
    export function Scale(pointToScale: IMakerPoint, scale: number): IMakerPoint {
        var p = Clone(Ensure(pointToScale));
        p.x *= scale;
        p.y *= scale;
        return p;
    }

    /**
     * Subtract a point from another point, and return the result as a new point. Shortcut to Add(a, b, subtract = true).
     * 
     * @param a First point, either as a point object, or as an array of numbers.
     * @param b Second point, either as a point object, or as an array of numbers.
     * @returns A new point object.
     */
    export function Subtract(a: IMakerPoint, b: IMakerPoint): IMakerPoint;
    export function Subtract(a: IMakerPoint, b: number[]): IMakerPoint;
    export function Subtract(a: number[], b: IMakerPoint): IMakerPoint;
    export function Subtract(a: number[], b: number[]): IMakerPoint;
    export function Subtract(a: any, b: any): IMakerPoint {
        return Add(a, b, true);
    }

    /**
     * A point at 0,0 coordinates.
     * 
     * @returns A new point.
     */
    export function Zero(): IMakerPoint {
        return { x: 0, y: 0 };
    }

}
