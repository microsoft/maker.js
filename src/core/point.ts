/// <reference path="maker.ts" />

module MakerJs.point {

    /**
     * Add two points together and return the result as a new point object.
     * 
     * @param a First point.
     * @param b Second point.
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
     * Find out if two points are equal.
     * 
     * @param a First point.
     * @param b Second point.
     * @returns true if points are the same, false if they are not
     */
    export function areEqual(a: IPoint, b: IPoint): boolean {
        return a[0] == b[0] && a[1] == b[1];
    }

    /**
     * Find out if two points are equal after rounding.
     * 
     * @param a First point.
     * @param b Second point.
     * @returns true if points are the same, false if they are not
     */
    export function areEqualRounded(a: IPoint, b: IPoint): boolean {
        return round(a[0]) == round(b[0]) && round(a[1]) == round(b[1]);
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

    export function closest(referencePoint: IPoint, pointChoices: IPoint[]): IPoint {
        var smallest = {
            index: 0,
            distance: -1
        };
        for (var i = 0; i < pointChoices.length; i++) {
            var distance = measure.pointDistance(referencePoint, pointChoices[i]);
            if (smallest.distance == -1 || distance < smallest.distance) {
                smallest.distance = distance;
                smallest.index = i;
            }
        }
        return pointChoices[smallest.index];
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
     * Get a point on a circle or arc path, at a given angle.
     * @param angleInDegrees The angle at which you want to find the point, in degrees.
     * @param circle A circle or arc.
     * @returns A new point object.
     */
    export function fromAngleOnCircle(angleInDegrees: number, circle: IPathCircle): IPoint {
        return add(circle.origin, fromPolar(angle.toRadians(angleInDegrees), circle.radius));
    }

    /**
     * Get the two end points of an arc path.
     * 
     * @param arc The arc path object.
     * @returns Array with 2 elements: [0] is the point object corresponding to the start angle, [1] is the point object corresponding to the end angle.
     */
    export function fromArc(arc: IPathArc): IPoint[] {
        return [fromAngleOnCircle(arc.startAngle, arc), fromAngleOnCircle(arc.endAngle, arc)];
    }

    export function middle(path: IPath): IPoint {
        var midPoint: IPoint = null;

        var map: IPathFunctionMap = {};

        map[pathType.Arc] = function (arc: IPathArc) {
            var halfAngle = arc.startAngle + measure.arcAngle(arc) / 2;
            midPoint = point.add(arc.origin, point.fromPolar(angle.toRadians(halfAngle), arc.radius));
        };

        map[pathType.Line] = function (line: IPathLine) {

            function avg(a: number, b: number): number {
                return (a + b) / 2;
            };

            midPoint = [
                avg(line.origin[0], line.end[0]),
                avg(line.origin[1], line.end[1])
            ];
        };

        var fn = map[path.type];
        if (fn) {
            fn(path);
        }

        return midPoint;
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
        var pointAngleInRadians = angle.ofPointInRadians(rotationOrigin, pointToRotate);
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
     * @param a First point.
     * @param b Second point.
     * @returns A new point object.
     */
    export function subtract(a: IPoint, b: IPoint): IPoint {
        return add(a, b, true);
    }

    /**
     * A point at 0,0 coordinates.
     * NOTE: It is important to call this as a method, with the empty parentheses.
     * 
     * @returns A new point.
     */
    export function zero(): IPoint {
        return [0, 0];
    }

}
