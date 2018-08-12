namespace MakerJs.point {

    /**
     * Add two points together and return the result as a new point object.
     * 
     * @param a First point.
     * @param b Second point.
     * @param subtract Optional boolean to subtract instead of add.
     * @returns A new point object.
     */
    export function add(a: IPoint, b: IPoint, subtract?: boolean): IPoint {
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
     * Get the average of two points.
     * 
     * @param a First point.
     * @param b Second point.
     * @returns New point object which is the average of a and b.
     */
    export function average(a: IPoint, b: IPoint): IPoint {
        function avg(i): number {
            return (a[i] + b[i]) / 2;
        }
        return [avg(0), avg(1)];
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
     * From an array of points, find the closest point to a given reference point.
     * 
     * @param referencePoint The reference point.
     * @param pointOptions Array of points to choose from.
     * @returns The first closest point from the pointOptions.
     */
    export function closest(referencePoint: IPoint, pointOptions: IPoint[]): IPoint {
        var smallest = {
            index: 0,
            distance: -1
        };
        for (var i = 0; i < pointOptions.length; i++) {
            var distance = measure.pointDistance(referencePoint, pointOptions[i]);
            if (smallest.distance == -1 || distance < smallest.distance) {
                smallest.distance = distance;
                smallest.index = i;
            }
        }
        return pointOptions[smallest.index];
    }

    /**
     * @private
     */
    const zero_cos: { [index: number]: boolean } = {};
    zero_cos[Math.PI / 2] = true;
    zero_cos[3 * Math.PI / 2] = true;

    /**
     * @private
     */
    const zero_sin: { [index: number]: boolean } = {};
    zero_sin[Math.PI] = true;
    zero_sin[2 * Math.PI] = true;

    /**
     * Get a point from its polar coordinates.
     * 
     * @param angleInRadians The angle of the polar coordinate, in radians.
     * @param radius The radius of the polar coordinate.
     * @returns A new point object.
     */
    export function fromPolar(angleInRadians: number, radius: number): IPoint {
        return [
            (angleInRadians in zero_cos) ? 0 : round(radius * Math.cos(angleInRadians)),
            (angleInRadians in zero_sin) ? 0 : round(radius * Math.sin(angleInRadians))
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

    /**
     * @private
     */
    var pathEndsMap: { [type: string]: (pathValue: IPath) => IPoint[] } = {};

    pathEndsMap[pathType.Arc] = function (arc: IPathArc) {
        return point.fromArc(arc);
    };

    pathEndsMap[pathType.Line] = function (line: IPathLine) {
        return [line.origin, line.end];
    }

    pathEndsMap[pathType.BezierSeed] = pathEndsMap[pathType.Line];

    /**
     * Get the two end points of a path.
     * 
     * @param pathContext The path object.
     * @returns Array with 2 elements: [0] is the point object corresponding to the origin, [1] is the point object corresponding to the end.
     */
    export function fromPathEnds(pathContext: IPath, pathOffset?: IPoint): IPoint[] {

        var result: IPoint[] = null;

        var fn = pathEndsMap[pathContext.type];
        if (fn) {
            result = fn(pathContext);

            if (pathOffset) {
                result = result.map(function (p: IPoint) { return add(p, pathOffset); });
            }
        }

        return result;
    }

    /**
     * @private
     */
    function verticalIntersectionPoint(verticalLine: IPathLine, nonVerticalSlope: ISlope): IPoint {
        var x = verticalLine.origin[0];
        var y = nonVerticalSlope.slope * x + nonVerticalSlope.yIntercept;
        return [x, y];
    }

    /**
     * Calculates the intersection of slopes of two lines.
     * 
     * @param lineA First line to use for slope.
     * @param lineB Second line to use for slope.
     * @param options Optional IPathIntersectionOptions.
     * @returns point of intersection of the two slopes, or null if the slopes did not intersect.
     */
    export function fromSlopeIntersection(lineA: IPathLine, lineB: IPathLine, options: IPathIntersectionBaseOptions = {}): IPoint {

        var slopeA = measure.lineSlope(lineA);
        var slopeB = measure.lineSlope(lineB);

        //see if slope are parallel 
        if (measure.isSlopeParallel(slopeA, slopeB)) {

            if (measure.isSlopeEqual(slopeA, slopeB)) {
                //check for overlap
                options.out_AreOverlapped = measure.isLineOverlapping(lineA, lineB, options.excludeTangents);
            }

            return null;
        }

        var pointOfIntersection: IPoint;

        if (!slopeA.hasSlope) {
            pointOfIntersection = verticalIntersectionPoint(lineA, slopeB);
        } else if (!slopeB.hasSlope) {
            pointOfIntersection = verticalIntersectionPoint(lineB, slopeA);
        } else {
            // find intersection by line equation
            var x = (slopeB.yIntercept - slopeA.yIntercept) / (slopeA.slope - slopeB.slope);
            var y = slopeA.slope * x + slopeA.yIntercept;
            pointOfIntersection = [x, y];
        }

        return pointOfIntersection;
    }

    /**
     * @private
     */
    function midCircle(circle: IPathCircle, midAngle: number) {
        return point.add(circle.origin, point.fromPolar(angle.toRadians(midAngle), circle.radius));
    }

    /**
     * @private
     */
    var middleMap: { [type: string]: (pathValue: IPath, ratio: number) => IPoint } = {};

    middleMap[pathType.Arc] = function (arc: IPathArc, ratio: number) {
        var midAngle = angle.ofArcMiddle(arc, ratio);
        return midCircle(arc, midAngle);
    };

    middleMap[pathType.Circle] = function (circle: IPathCircle, ratio: number) {
        return midCircle(circle, 360 * ratio);
    };

    middleMap[pathType.Line] = function (line: IPathLine, ratio: number) {

        function ration(a: number, b: number): number {
            return a + (b - a) * ratio;
        };

        return [
            ration(line.origin[0], line.end[0]),
            ration(line.origin[1], line.end[1])
        ];
    };

    middleMap[pathType.BezierSeed] = function (seed: IPathBezierSeed, ratio: number) {
        return models.BezierCurve.computePoint(seed, ratio);
    }

    /**
     * Get the middle point of a path.
     * 
     * @param pathContext The path object.
     * @param ratio Optional ratio (between 0 and 1) of point along the path. Default is .5 for middle.
     * @returns Point on the path, in the middle of the path.
     */
    export function middle(pathContext: IPath, ratio = .5): IPoint {
        var midPoint: IPoint = null;

        var fn = middleMap[pathContext.type];
        if (fn) {
            midPoint = fn(pathContext, ratio);
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
     * Round the values of a point.
     * 
     * @param pointContext The point to serialize.
     * @param accuracy Optional exemplar number of decimal places.
     * @returns A new point with the values rounded.
     */
    export function rounded(pointContext: IPoint, accuracy?: number): IPoint {
        return [round(pointContext[0], accuracy), round(pointContext[1], accuracy)];
    }

    /**
     * Rotate a point.
     * 
     * @param pointToRotate The point to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns A new point.
     */
    export function rotate(pointToRotate: IPoint, angleInDegrees: number, rotationOrigin: IPoint = [0, 0]): IPoint {
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
     * Distort a point's coordinates.
     * 
     * @param pointToDistort The point to distort.
     * @param scaleX The amount of x scaling.
     * @param scaleY The amount of y scaling.
     * @returns A new point.
     */
    export function distort(pointToDistort: IPoint, scaleX: number, scaleY: number): IPoint {
        return [pointToDistort[0] * scaleX, pointToDistort[1] * scaleY];
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
