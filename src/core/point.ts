/// <reference path="maker.ts" />

module makerjs.point {

    /**
     * Add two points together and return the result as a new point object.
     * 
     * @param a First point, either as a point object, or as an array of numbers.
     * @param b Second point, either as a point object, or as an array of numbers.
     * @param subtract Optional boolean to subtract instead of add.
     * @returns A new point object.
     */
    export function add(a: IMakerPoint, b: IMakerPoint, subtract?: boolean): IMakerPoint{
        var newPoint = clone(a);

        if (!b) return newPoint;

        if (subtract) {
            newPoint.x -= b.x;
            newPoint.y -= b.y;
        } else {
            newPoint.x += b.x;
            newPoint.y += b.y;
        }
        return newPoint;
    }

    /**
     * Clone a point into a new point.
     * 
     * @param pointToClone The point to clone.
     * @returns A new point with same values as the original.
     */
    export function clone(pointToClone: IMakerPoint): IMakerPoint {
        if (!pointToClone) return point.zero();
        return { x: pointToClone.x, y: pointToClone.y };
    }

    /**
     * Ensures that an item has the properties of a point object.
     * 
     * @param pointToEnsure The object to ensure; may be a point object, or an array of numbers, or something else which will attempt to coerce into a point.
     * @returns A new point object either with the x, y values corresponding to the input, or 0,0 coordinates.
     */
    export function ensure(pointToEnsure: IMakerPoint): IMakerPoint;
    export function ensure(pointToEnsure: number[]): IMakerPoint;
    export function ensure(): IMakerPoint;
    export function ensure(pointToEnsure?: any): IMakerPoint {

        if (!pointToEnsure) {
            return zero();
        }

        if (isPoint(pointToEnsure)) {
            return pointToEnsure;
        }

        if (Array.isArray(pointToEnsure) && pointToEnsure.length > 1) {
            return { x: pointToEnsure[0], y: pointToEnsure[1] };
        }

        if (arguments.length > 1) {
            return { x: arguments[0], y: arguments[0] };
        }

        return zero();
    }

    /**
     * Get a point from its polar coordinates.
     * 
     * @param angleInRadians The angle of the polar coordinate, in radians.
     * @param radius The radius of the polar coordinate.
     * @returns A new point object.
     */
    export function fromPolar(angleInRadians: number, radius: number): IMakerPoint {
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
    export function fromArc(arc: IMakerPathArc): IMakerPoint[] {

        function getPointFromAngle(a: number) {
            return add(arc.origin, fromPolar(angle.toRadians(a), arc.radius));
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
    export function mirror(pointToMirror: IMakerPoint, mirrorX: boolean, mirrorY: boolean): IMakerPoint {
        var p = clone(pointToMirror);

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
    export function rotate(pointToRotate: IMakerPoint, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerPoint {
        var pointAngleInRadians = angle.fromPointToRadians(pointToRotate, rotationOrigin);
        var d = measure.pointDistance(rotationOrigin, pointToRotate);
        var rotatedPoint = fromPolar(pointAngleInRadians + angle.toRadians(angleInDegrees), d);

        return add(rotationOrigin, rotatedPoint);
    }

    /**
     * Scale a point's coordinates.
     * 
     * @param pointToScale The point to scale.
     * @param scaleValue The amount of scaling.
     * @returns A new point.
     */
    export function scale(pointToScale: IMakerPoint, scaleValue: number): IMakerPoint {
        var p = clone(pointToScale);
        p.x *= scaleValue;
        p.y *= scaleValue;
        return p;
    }

    /**
     * Subtract a point from another point, and return the result as a new point. Shortcut to Add(a, b, subtract = true).
     * 
     * @param a First point, either as a point object, or as an array of numbers.
     * @param b Second point, either as a point object, or as an array of numbers.
     * @returns A new point object.
     */
    export function subtract(a: IMakerPoint, b: IMakerPoint): IMakerPoint;
    export function subtract(a: IMakerPoint, b: number[]): IMakerPoint;
    export function subtract(a: number[], b: IMakerPoint): IMakerPoint;
    export function subtract(a: number[], b: number[]): IMakerPoint;
    export function subtract(a: any, b: any): IMakerPoint {
        return add(a, b, true);
    }

    /**
     * A point at 0,0 coordinates.
     * 
     * @returns A new point.
     */
    export function zero(): IMakerPoint {
        return { x: 0, y: 0 };
    }

}
