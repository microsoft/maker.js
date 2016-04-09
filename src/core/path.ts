namespace MakerJs.path {

    /**
     * Create a clone of a path, mirrored on either or both x and y axes.
     * 
     * @param pathToMirror The path to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @param newId Optional id to assign to the new path.
     * @returns Mirrored path.
     */
    export function mirror(pathToMirror: IPath, mirrorX: boolean, mirrorY: boolean, newId?: string): IPath {
        var newPath: IPath = null;

        if (pathToMirror) {
            var origin = point.mirror(pathToMirror.origin, mirrorX, mirrorY);

            var map: IPathFunctionMap = {};

            map[pathType.Line] = function (line: IPathLine) {

                newPath = new paths.Line(
                    origin,
                    point.mirror(line.end, mirrorX, mirrorY)
                );
            };

            map[pathType.Circle] = function (circle: IPathCircle) {

                newPath = new paths.Circle(
                    origin,
                    circle.radius
                );
            };

            map[pathType.Arc] = function (arc: IPathArc) {

                var startAngle = angle.mirror(arc.startAngle, mirrorX, mirrorY);
                var endAngle = angle.mirror(angle.ofArcEnd(arc), mirrorX, mirrorY);
                var xor = mirrorX != mirrorY;

                newPath = new paths.Arc(
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
        }

        return newPath;
    }

    /**
     * Move a path to an absolute point.
     * 
     * @param pathToMove The path to move.
     * @param origin The new origin for the path.
     * @returns The original path (for chaining).
     */
    export function move(pathToMove: IPath, origin: IPoint): IPath {

        if (pathToMove) {
            var map: IPathFunctionMap = {};

            map[pathType.Line] = function (line: IPathLine) {
                var delta = point.subtract(line.end, line.origin);
                line.end = point.add(origin, delta);
            };

            var fn = map[pathToMove.type];
            if (fn) {
                fn(pathToMove);
            }

            pathToMove.origin = origin;
        }

        return pathToMove;
    }

    /**
     * Move a path's origin by a relative amount.
     * 
     * @param pathToMove The path to move.
     * @param delta The x & y adjustments as a point object.
     * @returns The original path (for chaining).
     */
    export function moveRelative(pathToMove: IPath, delta: IPoint): IPath {

        if (pathToMove) {
            var map: IPathFunctionMap = {};

            map[pathType.Line] = function (line: IPathLine) {
                line.end = point.add(line.end, delta);
            };

            pathToMove.origin = point.add(pathToMove.origin, delta);

            var fn = map[pathToMove.type];
            if (fn) {
                fn(pathToMove);
            }
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
    export function rotate(pathToRotate: IPath, angleInDegrees: number, rotationOrigin: IPoint): IPath {
        if (!pathToRotate || angleInDegrees == 0) return pathToRotate;

        var map: IPathFunctionMap = {};

        map[pathType.Line] = function (line: IPathLine) {
            line.end = point.rotate(line.end, angleInDegrees, rotationOrigin);
        }

        map[pathType.Arc] = function (arc: IPathArc) {
            arc.startAngle = angle.noRevolutions(arc.startAngle + angleInDegrees);
            arc.endAngle = angle.noRevolutions(arc.endAngle + angleInDegrees);
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
    export function scale(pathToScale: IPath, scaleValue: number): IPath {
        if (!pathToScale || scaleValue == 1) return pathToScale;

        var map: IPathFunctionMap = {};

        map[pathType.Line] = function (line: IPathLine) {
            line.end = point.scale(line.end, scaleValue);
        }

        map[pathType.Circle] = function (circle: IPathCircle) {
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
