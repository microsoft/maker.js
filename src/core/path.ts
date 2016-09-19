namespace MakerJs.path {

    /**
     * @private
     */
    function copyLayer(pathA: IPath, pathB: IPath) {
        if (pathA && pathB && ('layer' in pathA)) {
            pathB.layer = pathA.layer;
        }
    }

    /**
     * Create a clone of a path. This is faster than cloneObject.
     * 
     * @param pathToClone The path to clone.
     * @returns Cloned path.
     */
    export function clone(pathToClone: IPath): IPath {
        var result: IPath = null;

        switch (pathToClone.type) {
            case pathType.Arc:
                var arc = <IPathArc>pathToClone;
                result = new paths.Arc(point.clone(arc.origin), arc.radius, arc.startAngle, arc.endAngle);

                //carry extra props if this is an IPathArcInBezierCurve
                if (isPathArcInBezierCurve(arc)) {
                    (<IPathArcInBezierCurve>result).bezierData = (<IPathArcInBezierCurve>arc).bezierData;
                }

                break;

            case pathType.Circle:
                var circle = <IPathCircle>pathToClone;
                result = new paths.Circle(point.clone(circle.origin), circle.radius);
                break;

            case pathType.Line:
                var line = <IPathLine>pathToClone;
                result = new paths.Line(point.clone(line.origin), point.clone(line.end));
                break;
        }

        copyLayer(pathToClone, result);

        return result;
    }

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

    mirrorMap[pathType.BezierSeed] = function (seed: IPathBezierSeed, origin: IPoint, mirrorX: boolean, mirrorY: boolean) {

        var mirrored = mirrorMap[pathType.Line](seed, origin, mirrorX, mirrorY) as IPathBezierSeed;

        mirrored.type = pathType.BezierSeed;

        mirrored.controls = seed.controls.map(function (c) { return point.mirror(c, mirrorX, mirrorY); });

        return mirrored;
    };

    /**
     * Create a clone of a path, mirrored on either or both x and y axes.
     * 
     * @param pathToMirror The path to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored path.
     */
    export function mirror(pathToMirror: IPath, mirrorX: boolean, mirrorY: boolean): IPath {
        var newPath: IPath = null;

        if (pathToMirror) {
            var origin = point.mirror(pathToMirror.origin, mirrorX, mirrorY);

            var fn = mirrorMap[pathToMirror.type];
            if (fn) {
                newPath = fn(pathToMirror, origin, mirrorX, mirrorY);
            }
        }

        copyLayer(pathToMirror, newPath);

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
    var moveRelativeMap: { [pathType: string]: (pathToMove: IPath, delta: IPoint, subtract: boolean) => void } = {};

    moveRelativeMap[pathType.Line] = function (line: IPathLine, delta: IPoint, subtract: boolean) {
        line.end = point.add(line.end, delta, subtract);
    };

    moveRelativeMap[pathType.BezierSeed] = function (seed: IPathBezierSeed, delta: IPoint, subtract: boolean) {
        moveRelativeMap[pathType.Line](seed, delta, subtract);
        seed.controls = seed.controls.map(function (c) { return point.add(c, delta, subtract); });
    };

    /**
     * Move a path's origin by a relative amount.
     * 
     * @param pathToMove The path to move.
     * @param delta The x & y adjustments as a point object.
     * @param subtract Optional boolean to subtract instead of add.
     * @returns The original path (for chaining).
     */
    export function moveRelative(pathToMove: IPath, delta: IPoint, subtract?: boolean): IPath {

        if (pathToMove && delta) {

            pathToMove.origin = point.add(pathToMove.origin, delta, subtract);

            var fn = moveRelativeMap[pathToMove.type];
            if (fn) {
                fn(pathToMove, delta, subtract);
            }
        }

        return pathToMove;
    }

    /**
     * Move some paths relatively during a task execution, then unmove them.
     * 
     * @param pathsToMove The paths to move.
     * @param deltas The x & y adjustments as a point object array.
     * @param task The function to call while the paths are temporarily moved.
     */
    export function moveTemporary(pathsToMove: IPath[], deltas: IPoint[], task: Function) {

        var subtract = false;

        function move(pathToOffset: IPath, i: number) {
            if (deltas[i]) {
                moveRelative(pathToOffset, deltas[i], subtract);
            }
        }

        pathsToMove.map(move);
        task();
        subtract = true;
        pathsToMove.map(move);
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

    rotateMap[pathType.BezierSeed] = function (seed: IPathBezierSeed, angleInDegrees: number, rotationOrigin: IPoint) {
        rotateMap[pathType.Line](seed, angleInDegrees, rotationOrigin);
        seed.controls = seed.controls.map(function (c) { return point.rotate(c, angleInDegrees, rotationOrigin); });
    }

    /**
     * Rotate a path.
     * 
     * @param pathToRotate The path to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns The original path (for chaining).
     */
    export function rotate(pathToRotate: IPath, angleInDegrees: number, rotationOrigin: IPoint = [0, 0]): IPath {
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

    scaleMap[pathType.BezierSeed] = function (seed: IPathBezierSeed, scaleValue: number) {
        scaleMap[pathType.Line](seed, scaleValue);
        seed.controls = seed.controls.map(function (c) { return point.scale(c, scaleValue); });
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

    /**
     * @private
     */
    var distortMap: { [pathType: string]: (pathValue: IPath, scaleX: number, scaleY: number) => IModel | IPath } = {};

    distortMap[pathType.Arc] = function (arc: IPathArc, scaleX: number, scaleY: number) {
        return new models.EllipticArc(arc, scaleX, scaleY);
    };

    distortMap[pathType.Circle] = function (circle: IPathCircle, scaleX: number, scaleY: number) {
        var ellipse = new models.Ellipse(circle.radius * scaleX, circle.radius * scaleY);
        ellipse.origin = point.distort(circle.origin, scaleX, scaleY);
        return ellipse
    };

    distortMap[pathType.Line] = function (line: IPathLine, scaleX: number, scaleY: number) {
        return new paths.Line([line.origin, line.end].map(function (p) { return point.distort(p, scaleX, scaleY); }));
    };

    distortMap[pathType.BezierSeed] = function (seed: IPathBezierSeed, scaleX: number, scaleY: number) {
        var d = point.distort;
        return {
            type: pathType.BezierSeed,
            origin: d(seed.origin, scaleX, scaleY),
            controls: seed.controls.map(function (c) { return d(c, scaleX, scaleY); }),
            end: d(seed.end, scaleX, scaleY)
        } as IPathBezierSeed;
    };

    /**
     * Distort a path - scale x and y individually.
     * 
     * @param pathToDistort The path to distort.
     * @param scaleX The amount of x scaling.
     * @param scaleY The amount of y scaling.
     * @returns A new IModel (for circles and arcs) or IPath (for lines and bezier seeds).
     */
    export function distort(pathToDistort: IPath, scaleX: number, scaleY: number): IModel | IPath {
        if (!pathToDistort || (scaleX === 1 && scaleY === 1)) return null;

        var fn = distortMap[pathToDistort.type];
        if (fn) {
            return fn(pathToDistort, scaleX, scaleY);
        }

        return null;
    }

    /**
     * Connect 2 lines at their slope intersection point.
     * 
     * @param lineA First line to converge.
     * @param lineB Second line to converge.
     * @param useOriginA Optional flag to converge the origin point of lineA instead of the end point.
     * @param useOriginB Optional flag to converge the origin point of lineB instead of the end point.
     */
    export function converge(lineA: IPathLine, lineB: IPathLine, useOriginA?: boolean, useOriginB?: boolean): IPoint {
        var p = point.fromSlopeIntersection(lineA, lineB);

        if (p) {

            var lines = [lineA, lineB];
            var useOrigin = [useOriginA, useOriginB];

            if (arguments.length === 2) {
                //converge to closest

                lines.forEach(function (line, i) {
                    useOrigin[i] = (point.closest(p, [line.origin, line.end]) === line.origin);
                });
            }

            function setPoint(line: IPathLine, useOrigin: boolean) {
                var setP: IPoint;

                if (useOrigin) {
                    setP = line.origin;
                } else {
                    setP = line.end;
                }

                setP[0] = p[0];
                setP[1] = p[1];
            }

            lines.forEach(function (line, i) {
                setPoint(line, useOrigin[i]);
            });
        }

        return p;
    }

}
