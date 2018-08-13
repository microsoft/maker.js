namespace MakerJs.path {

    /**
     * Add a path to a model. This is basically equivalent to:
     * ```
     * parentModel.paths[pathId] = childPath;
     * ```
     * with additional checks to make it safe for cascading.
     * 
     * @param childPath The path to add.
     * @param parentModel The model to add to.
     * @param pathId The id of the path.
     * @param overwrite Optional flag to overwrite any path referenced by pathId. Default is false, which will create an id similar to pathId.
     * @returns The original path (for cascading).
     */
    export function addTo(childPath: IPath, parentModel: IModel, pathId: string, overwrite = false): IPath {
        model.addPath(parentModel, childPath, pathId, overwrite);
        return childPath;
    }

    /**
     * @private
     */
    function copyLayer(pathA: IPath, pathB: IPath) {
        if (pathA && pathB && typeof pathA.layer !== 'undefined') {
            pathB.layer = pathA.layer;
        }

        //carry extra props if this is an IPathArcInBezierCurve
        if (pathA && pathB && ('bezierData' in pathA)) {
            (<IPathArcInBezierCurve>pathB).bezierData = (<IPathArcInBezierCurve>pathA).bezierData;
        }
    }

    /**
     * @private
     */
    var copyPropsMap: { [pathType: string]: (src: IPath, dest: IPath, offset?: IPoint) => void } = {};

    copyPropsMap[pathType.Circle] = function (srcCircle: IPathCircle, destCircle: IPathCircle, offset?: IPoint) {
        destCircle.radius = srcCircle.radius;
    };

    copyPropsMap[pathType.Arc] = function (srcArc: IPathArc, destArc: IPathArc, offset?: IPoint) {
        copyPropsMap[pathType.Circle](srcArc, destArc, offset);
        destArc.startAngle = srcArc.startAngle;
        destArc.endAngle = srcArc.endAngle;
    };

    copyPropsMap[pathType.Line] = function (srcLine: IPathLine, destLine: IPathLine, offset?: IPoint) {
        destLine.end = point.add(srcLine.end, offset);
    };

    copyPropsMap[pathType.BezierSeed] = function (srcSeed: IPathBezierSeed, destSeed: IPathBezierSeed, offset?: IPoint) {
        copyPropsMap[pathType.Line](srcSeed, destSeed, offset);
        destSeed.controls = srcSeed.controls.map(p => point.add(p, offset));
    };

    /**
     * Create a clone of a path. This is faster than cloneObject.
     * 
     * @param pathToClone The path to clone.
     * @param offset Optional point to move path a relative distance.
     * @returns Cloned path.
     */
    export function clone(pathToClone: IPath, offset?: IPoint): IPath {
        var result: IPath = { type: pathToClone.type, origin: point.add(pathToClone.origin, offset) };
        var fn = copyPropsMap[pathToClone.type];
        if (fn) {
            fn(pathToClone, result, offset);
        }
        copyLayer(pathToClone, result);
        return result;
    }

    /**
     * Copy the schema properties of one path to another.
     * 
     * @param srcPath The source path to copy property values from.
     * @param destPath The destination path to copy property values to.
     * @returns The source path.
     */
    export function copyProps(srcPath: IPath, destPath: IPath): IPath {
        var fn = copyPropsMap[srcPath.type];
        if (fn) {
            destPath.origin = point.clone(srcPath.origin);
            fn(srcPath, destPath);
        }
        copyLayer(srcPath, destPath);
        return srcPath;
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
     * Set the layer of a path. This is equivalent to:
     * ```
     * pathContext.layer = layer;
     * ```
     * 
     * @param pathContext The path to set the layer.
     * @param layer The layer name.
     * @returns The original path (for cascading).
     */
    export function layer(pathContext: IPath, layer: string): IPath {
        pathContext.layer = layer;
        return pathContext;
    }

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
     * @returns The original path (for cascading).
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
     * @returns The original path (for cascading).
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
     * @returns The original path (for cascading).
     */
    export function rotate(pathToRotate: IPath, angleInDegrees: number, rotationOrigin: IPoint = [0, 0]): IPath {
        if (!pathToRotate || !angleInDegrees) return pathToRotate;

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
     * @returns The original path (for cascading).
     */
    export function scale(pathToScale: IPath, scaleValue: number): IPath {
        if (!pathToScale || scaleValue === 1 || !scaleValue) return pathToScale;

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
        if (!pathToDistort || !scaleX || !scaleY) return null;

        var fn = distortMap[pathToDistort.type];
        if (fn) {
            const distorted = fn(pathToDistort, scaleX, scaleY);

            if (typeof pathToDistort.layer !== 'undefined') {
                distorted.layer = pathToDistort.layer;
            }

            return distorted;
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
     * @returns point of convergence.
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

    /**
     * @private
     */
    var alterMap: { [pathType: string]: (pathValue: IPath, pathLength: number, distance: number, useOrigin: boolean) => void } = {};

    alterMap[pathType.Arc] = function (arc: IPathArc, pathLength: number, distance: number, useOrigin: boolean) {
        var span = angle.ofArcSpan(arc);
        var delta = ((pathLength + distance) * span / pathLength) - span;

        if (useOrigin) {
            arc.startAngle -= delta;
        } else {
            arc.endAngle += delta;
        }
    }

    alterMap[pathType.Circle] = function (circle: IPathCircle, pathLength: number, distance: number, useOrigin: boolean) {
        circle.radius *= (pathLength + distance) / pathLength;
    }

    alterMap[pathType.Line] = function (line: IPathLine, pathLength: number, distance: number, useOrigin: boolean) {
        var delta = point.scale(point.subtract(line.end, line.origin), distance / pathLength);

        if (useOrigin) {
            line.origin = point.subtract(line.origin, delta);
        } else {
            line.end = point.add(line.end, delta);
        }
    }

    /**
     * Alter a path by lengthening or shortening it.
     * 
     * @param pathToAlter Path to alter.
     * @param distance Numeric amount of length to add or remove from the path. Use a positive number to lengthen, negative to shorten. When shortening: this function will not alter the path and will return null if the resulting path length is less than or equal to zero.
     * @param useOrigin Optional flag to alter from the origin instead of the end of the path.
     * @returns The original path (for cascading), or null if the path could not be altered.
     */
    export function alterLength(pathToAlter: IPath, distance: number, useOrigin = false): IPath {
        if (!pathToAlter || !distance) return null;

        var fn = alterMap[pathToAlter.type];
        if (fn) {
            var pathLength = measure.pathLength(pathToAlter);

            if (!pathLength || -distance >= pathLength) return null;

            fn(pathToAlter, pathLength, distance, useOrigin);

            return pathToAlter;
        }

        return null;
    }

    /**
     * Get points along a path.
     * 
     * @param pathContext Path to get points from.
     * @param numberOfPoints Number of points to divide the path.
     * @returns Array of points which are on the path spread at a uniform interval.
     */
    export function toPoints(pathContext: IPath, numberOfPoints: number): IPoint[] {

        //avoid division by zero when there is only one point
        if (numberOfPoints == 1) {
            return [point.middle(pathContext)];
        }

        var points: IPoint[] = [];

        var base = numberOfPoints;

        if (pathContext.type != pathType.Circle) base--;

        for (var i = 0; i < numberOfPoints; i++) {
            points.push(point.middle(pathContext, i / base));
        }

        return points;
    }

    /**
     * @private
     */
    var numberOfKeyPointsMap: { [type: string]: (pathContext: IPath, maxPointDistance?: number) => number } = {};

    numberOfKeyPointsMap[pathType.Line] = function (line: IPathLine) {
        return 2;
    };

    numberOfKeyPointsMap[pathType.Circle] = function (circle: IPathCircle, maxPointDistance?: number) {
        var len = measure.pathLength(circle);
        if (!len) return 0;
        maxPointDistance = maxPointDistance || len;
        return Math.max(8, Math.ceil(len / (maxPointDistance || len)));
    };

    numberOfKeyPointsMap[pathType.Arc] = function (arc: IPathArc, maxPointDistance?: number) {
        var len = measure.pathLength(arc);
        if (!len) return 0;
        var minPoints = Math.ceil(angle.ofArcSpan(arc) / 45) + 1;
        return Math.max(minPoints, Math.ceil(len / (maxPointDistance || len)));
    };

    /**
     * Get key points (a minimal a number of points) along a path.
     * 
     * @param pathContext Path to get points from.
     * @param maxArcFacet Optional maximum length between points on an arc or circle.
     * @returns Array of points which are on the path.
     */
    export function toKeyPoints(pathContext: IPath, maxArcFacet?: number): IPoint[] {
        if (pathContext.type == pathType.BezierSeed) {
            var curve = new models.BezierCurve(pathContext as IPathBezierSeed);
            var curveKeyPoints: IPoint[];
            model.findChains(curve, function (chains: IChain[], loose: IWalkPath[], layer: string) {
                if (chains.length == 1) {
                    var c = chains[0];
                    switch (c.links[0].walkedPath.pathId) {
                        case 'arc_0':
                        case 'line_0':
                            break;
                        default:
                            chain.reverse(c);
                    }
                    curveKeyPoints = chain.toKeyPoints(c);
                } else if (loose.length === 1) {
                    curveKeyPoints = toKeyPoints(loose[0].pathContext);
                }
            });
            return curveKeyPoints;
        } else {
            var fn = numberOfKeyPointsMap[pathContext.type];
            if (fn) {
                var numberOfKeyPoints = fn(pathContext, maxArcFacet);
                if (numberOfKeyPoints) {
                    return toPoints(pathContext, numberOfKeyPoints);
                }
            }
        }
        return [];
    }

    /**
     * Center a path at [0, 0].
     * 
     * @param pathToCenter The path to center.
     * @returns The original path (for cascading).
     */
    export function center(pathToCenter: IPath) {
        var m = measure.pathExtents(pathToCenter);
        var c = point.average(m.high, m.low);
        var o = point.subtract(pathToCenter.origin || [0, 0], c);
        move(pathToCenter, o);
        return pathToCenter;
    }

    /**
     * Move a path so its bounding box begins at [0, 0].
     * 
     * @param pathToZero The path to zero.
     * @returns The original path (for cascading).
     */
    export function zero(pathToZero: IPath) {
        var m = measure.pathExtents(pathToZero);
        var z = point.subtract(pathToZero.origin || [0, 0], m.low);
        move(pathToZero, z);
        return pathToZero;
    }
}
