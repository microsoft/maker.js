namespace MakerJs.path {

    /**
     * @private
     */
    var mirrorMap: { [pathType: string]: (pathToMirror: IPath, origin: IPoint, mirrorX: boolean, mirrorY: boolean) => IPath } = {};

    mirrorMap[pathType.Line] = function (line: IPathLine, origin: IPoint, mirrorX: boolean, mirrorY: boolean) {

        return new paths.Line(
            origin,
            point.mirror(line.end, mirrorX, mirrorY)
        );
    };

    mirrorMap[pathType.Circle] = function (circle: IPathCircle, origin: IPoint, mirrorX: boolean, mirrorY: boolean) {

        return new paths.Circle(
            origin,
            circle.radius
        );
    };

    mirrorMap[pathType.Arc] = function (arc: IPathArc, origin: IPoint, mirrorX: boolean, mirrorY: boolean) {

        var startAngle = angle.mirror(arc.startAngle, mirrorX, mirrorY);
        var endAngle = angle.mirror(angle.ofArcEnd(arc), mirrorX, mirrorY);
        var xor = mirrorX != mirrorY;

        return new paths.Arc(
            origin,
            arc.radius,
            xor ? endAngle : startAngle,
            xor ? startAngle : endAngle
        );
    };

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

            var fn = mirrorMap[pathToMirror.type];
            if (fn) {
                newPath = fn(pathToMirror, origin, mirrorX, mirrorY);
            }
        }

        return newPath;
    }

    /**
     * @private
     */
    var moveMap: { [pathType: string]: (pathToMove: IPath, origin: IPoint) => void } = {};

    moveMap[pathType.Line] = function (line: IPathLine, origin: IPoint) {
        var delta = point.subtract(line.end, line.origin);
        line.end = point.add(origin, delta);
    };

    /**
     * Move a path to an absolute point.
     * 
     * @param pathToMove The path to move.
     * @param origin The new origin for the path.
     * @returns The original path (for chaining).
     */
    export function move(pathToMove: IPath, origin: IPoint): IPath {

        if (pathToMove) {
            var fn = moveMap[pathToMove.type];
            if (fn) {
                fn(pathToMove, origin);
            }

            pathToMove.origin = origin;
        }

        return pathToMove;
    }

    /**
     * @private
     */
    var moveRelativeMap: { [pathType: string]: (pathToMove: IPath, delta: IPoint) => void } = {};

    moveRelativeMap[pathType.Line] = function (line: IPathLine, delta: IPoint) {
        line.end = point.add(line.end, delta);
    };

    /**
     * Move a path's origin by a relative amount.
     * 
     * @param pathToMove The path to move.
     * @param delta The x & y adjustments as a point object.
     * @returns The original path (for chaining).
     */
    export function moveRelative(pathToMove: IPath, delta: IPoint): IPath {

        if (pathToMove) {

            pathToMove.origin = point.add(pathToMove.origin, delta);

            var fn = moveRelativeMap[pathToMove.type];
            if (fn) {
                fn(pathToMove, delta);
            }
        }

        return pathToMove;
    }

    /**
     * @private
     */
    var rotateMap: { [pathType: string]: (pathToRotate: IPath, angleInDegrees: number, rotationOrigin: IPoint) => void } = {};

    rotateMap[pathType.Line] = function (line: IPathLine, angleInDegrees: number, rotationOrigin: IPoint) {
        line.end = point.rotate(line.end, angleInDegrees, rotationOrigin);
    }

    rotateMap[pathType.Arc] = function (arc: IPathArc, angleInDegrees: number, rotationOrigin: IPoint) {
        arc.startAngle = angle.noRevolutions(arc.startAngle + angleInDegrees);
        arc.endAngle = angle.noRevolutions(arc.endAngle + angleInDegrees);
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

        pathToRotate.origin = point.rotate(pathToRotate.origin, angleInDegrees, rotationOrigin);

        var fn = rotateMap[pathToRotate.type];
        if (fn) {
            fn(pathToRotate, angleInDegrees, rotationOrigin);
        }

        return pathToRotate;
    }

    /**
     * @private
     */
    var scaleMap: { [pathType: string]: (pathValue: IPath, scaleValue: number) => void } = {};

    scaleMap[pathType.Line] = function (line: IPathLine, scaleValue: number) {
        line.end = point.scale(line.end, scaleValue);
    }

    scaleMap[pathType.Circle] = function (circle: IPathCircle, scaleValue: number) {
        circle.radius *= scaleValue;
    }

    scaleMap[pathType.Arc] = scaleMap[pathType.Circle];

    /**
     * Scale a path.
     * 
     * @param pathToScale The path to scale.
     * @param scaleValue The amount of scaling.
     * @returns The original path (for chaining).
     */
    export function scale(pathToScale: IPath, scaleValue: number): IPath {
        if (!pathToScale || scaleValue == 1) return pathToScale;

        pathToScale.origin = point.scale(pathToScale.origin, scaleValue);

        var fn = scaleMap[pathToScale.type];
        if (fn) {
            fn(pathToScale, scaleValue);
        }

        return pathToScale;
    }

}
