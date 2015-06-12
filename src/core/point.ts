/// <reference path="maker.ts" />

module MakerJs.point {

    /**
     * Add two points together and return the result as a new point object.
     * 
     * @param a First point, either as a point object, or as an array of numbers.
     * @param b Second point, either as a point object, or as an array of numbers.
     * @param subtract Optional boolean to subtract instead of add.
     * @returns A new point object.
     */
    export function add(a: IPoint, b: IPoint, subtract?: boolean): IPoint{
        var newPoint = clone(a);

        if (!b) return newPoint;

        for (var i = 2; i--;) {
            if (subtract) {
                newPoint[i] -= b[i];
            } else {
                newPoint[i] += b[i];
            }
        }
        return newPoint;
    }

    /**
     * Clone a point into a new point.
     * 
     * @param pointToClone The point to clone.
     * @returns A new point with same values as the original.
     */
    export function clone(pointToClone: IPoint): IPoint {
        if (!pointToClone) return point.zero();
        return [pointToClone[0], pointToClone[1]];
    }

    /**
     * Get a point from its polar coordinates.
     * 
     * @param angleInRadians The angle of the polar coordinate, in radians.
     * @param radius The radius of the polar coordinate.
     * @returns A new point object.
     */
    export function fromPolar(angleInRadians: number, radius: number): IPoint {
        return [
            radius * Math.cos(angleInRadians),
            radius * Math.sin(angleInRadians)
        ];
    }

    /**
     * Get the two end points of an arc path.
     * 
     * @param arc The arc path object.
     * @returns Array with 2 elements: [0] is the point object corresponding to the start angle, [1] is the point object corresponding to the end angle.
     */
    export function fromArc(arc: IPathArc): IPoint[] {

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
    export function mirror(pointToMirror: IPoint, mirrorX: boolean, mirrorY: boolean): IPoint {
        var p = clone(pointToMirror);

        if (mirrorX) {
            p[0] = -p[0];
        }

        if (mirrorY) {
            p[1] = -p[1];
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
    export function rotate(pointToRotate: IPoint, angleInDegrees: number, rotationOrigin: IPoint): IPoint {
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
    export function scale(pointToScale: IPoint, scaleValue: number): IPoint {
        var p = clone(pointToScale);
        for (var i = 2; i--;) {
            p[i] *= scaleValue;
        }
        return p;
    }

    /**
     * Subtract a point from another point, and return the result as a new point. Shortcut to Add(a, b, subtract = true).
     * 
     * @param a First point, either as a point object, or as an array of numbers.
     * @param b Second point, either as a point object, or as an array of numbers.
     * @returns A new point object.
     */
    export function subtract(a: IPoint, b: IPoint): IPoint;
    export function subtract(a: IPoint, b: number[]): IPoint;
    export function subtract(a: number[], b: IPoint): IPoint;
    export function subtract(a: number[], b: number[]): IPoint;
    export function subtract(a: any, b: any): IPoint {
        return add(a, b, true);
    }

    /**
     * A point at 0,0 coordinates.
     * 
     * @returns A new point.
     */
    export function zero(): IPoint {
        return [0, 0];
    }

}
