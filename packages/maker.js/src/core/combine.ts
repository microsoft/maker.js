namespace MakerJs.model {

    /**
     * @private
     */
    function getNonZeroSegments(pathToSegment: IPath, breakPoint: IPoint): IPath[] {
        var segment1 = cloneObject(pathToSegment);

        if (!segment1) return null;

        var segment2 = path.breakAtPoint(segment1, breakPoint);

        if (segment2) {
            var segments: IPath[] = [segment1, segment2];
            for (var i = 2; i--;) {
                if (round(measure.pathLength(segments[i]), .0001) == 0) {
                    return null;
                }
            }
            return segments;

        } else if (pathToSegment.type == pathType.Circle) {
            return [segment1];
        }

        return null;
    }

    /**
     * @private
     */
    function getPointsOnPath(points: IPoint[], onPath: IPath, popOptions: IIsPointOnPathOptions): IPoint[] {
        const endpointsOnPath: IPoint[] = [];
        points.forEach(p => {
            if (measure.isPointOnPath(p, onPath, .00001, null, popOptions)) {
                endpointsOnPath.push(p);
            }
        });
        return endpointsOnPath;
    }

    /**
     * @private
     */
    function breakAlongForeignPath(crossedPath: ICrossedPath, overlappedSegments: ICrossedPathSegment[], foreignWalkedPath: IWalkPath) {
        var foreignPath = foreignWalkedPath.pathContext;
        var segments = crossedPath.segments;

        if (measure.isPathEqual(segments[0].absolutePath, foreignPath, .0001, null, foreignWalkedPath.offset)) {
            segments[0].overlapped = true;
            segments[0].duplicate = true;

            overlappedSegments.push(segments[0]);
            return;
        }

        //this will cache the slope, to keep from being recalculated for each segment
        var popOptions: IIsPointOnPathOptions = {};

        var options: IPathIntersectionOptions = { path1Offset: crossedPath.offset, path2Offset: foreignWalkedPath.offset };
        var foreignIntersection = path.intersection(crossedPath.pathContext, foreignPath, options);
        var intersectionPoints = foreignIntersection ? foreignIntersection.intersectionPoints : null;
        var foreignPathEndPoints = point.fromPathEnds(foreignPath, foreignWalkedPath.offset) || [];

        for (var i = 0; i < segments.length; i++) {
            var pointsOfInterest = intersectionPoints ? foreignPathEndPoints.concat(intersectionPoints) : foreignPathEndPoints;
            var pointsToCheck = getPointsOnPath(pointsOfInterest, segments[i].absolutePath, popOptions);

            if (options.out_AreOverlapped) {
                segments[i].overlapped = true;
                overlappedSegments.push(segments[i]);
            }

            if (pointsToCheck.length > 0) {

                //break the path which intersected, and add the shard to the end of the array so it can also be checked in this loop for further sharding.
                var subSegments: IPath[] = null;
                var p = 0;
                while (!subSegments && p < pointsToCheck.length) {
                    subSegments = getNonZeroSegments(segments[i].absolutePath, pointsToCheck[p]);
                    p++;
                }

                if (subSegments) {
                    crossedPath.broken = true;

                    segments[i].absolutePath = subSegments[0];

                    if (subSegments[1]) {
                        var newSegment: ICrossedPathSegment = {
                            absolutePath: subSegments[1],
                            pathId: segments[0].pathId,
                            overlapped: segments[i].overlapped,
                            uniqueForeignIntersectionPoints: []
                        };

                        if (segments[i].overlapped) {
                            overlappedSegments.push(newSegment);
                        }

                        segments.push(newSegment);
                    }

                    //re-check this segment for another deep intersection
                    i--;
                }
            }
        }
    }

    /**
     * DEPRECATED - use measure.isPointInsideModel instead.
     * Check to see if a path is inside of a model.
     * 
     * @param pathContext The path to check.
     * @param modelContext The model to check against.
     * @param farPoint Optional point of reference which is outside the bounds of the modelContext.
     * @returns Boolean true if the path is inside of the modelContext.
     */
    export function isPathInsideModel(pathContext: IPath, modelContext: IModel, pathOffset?: IPoint, farPoint?: IPoint, measureAtlas?: measure.Atlas): boolean {

        var options: IMeasurePointInsideOptions = {
            farPoint: farPoint,
            measureAtlas: measureAtlas
        };

        var p = point.add(point.middle(pathContext), pathOffset);
        return measure.isPointInsideModel(p, modelContext, options);
    }

    /**
     * @private
     */
    interface ICrossedPathSegment {
        isInside?: boolean;
        uniqueForeignIntersectionPoints: IPoint[];
        absolutePath: IPath;
        addedPath?: IPath;
        pathId: string;
        overlapped: boolean;
        duplicate?: boolean;
    }

    /**
     * @private
     */
    interface ICrossedPath extends IWalkPath {
        broken: boolean;
        segments: ICrossedPathSegment[];
    }

    /**
     * @private
     */
    interface ICombinedModel {
        crossedPaths: ICrossedPath[];
        overlappedSegments: ICrossedPathSegment[];
    }

    /**
     * DEPRECATED
     * Break a model's paths everywhere they intersect with another path.
     *
     * @param modelToBreak The model containing paths to be broken.
     * @param modelToIntersect Optional model containing paths to look for intersection, or else the modelToBreak will be used.
     * @returns The original model (for cascading).
     */
    export function breakPathsAtIntersections(modelToBreak: IModel, modelToIntersect?: IModel) {

        var modelToBreakAtlas = new measure.Atlas(modelToBreak);
        modelToBreakAtlas.measureModels();

        var modelToIntersectAtlas: measure.Atlas;

        if (!modelToIntersect) {
            modelToIntersect = modelToBreak;
            modelToIntersectAtlas = modelToBreakAtlas;
        } else {
            modelToIntersectAtlas = new measure.Atlas(modelToIntersect);
            modelToIntersectAtlas.measureModels();
        };

        breakAllPathsAtIntersections(modelToBreak, modelToIntersect || modelToBreak, false, modelToBreakAtlas, modelToIntersectAtlas);

        return modelToBreak;
    }

    /**
     * @private
     */
    function breakAllPathsAtIntersections(modelToBreak: IModel, modelToIntersect: IModel, checkIsInside: boolean, modelToBreakAtlas: measure.Atlas, modelToIntersectAtlas: measure.Atlas, farPoint?: IPoint): ICombinedModel {

        var crossedPaths: ICrossedPath[] = [];
        var overlappedSegments: ICrossedPathSegment[] = [];

        var walkModelToBreakOptions: IWalkOptions = {
            onPath: function (outerWalkedPath: IWalkPath) {

                //clone this path and make it the first segment
                var segment: ICrossedPathSegment = {
                    absolutePath: path.clone(outerWalkedPath.pathContext, outerWalkedPath.offset),
                    pathId: outerWalkedPath.pathId,
                    overlapped: false,
                    uniqueForeignIntersectionPoints: []
                };

                var thisPath: ICrossedPath = <ICrossedPath>outerWalkedPath;
                thisPath.broken = false;
                thisPath.segments = [segment];

                var walkModelToIntersectOptions: IWalkOptions = {
                    onPath: function (innerWalkedPath: IWalkPath) {
                        if (outerWalkedPath.pathContext !== innerWalkedPath.pathContext && measure.isMeasurementOverlapping(modelToBreakAtlas.pathMap[outerWalkedPath.routeKey], modelToIntersectAtlas.pathMap[innerWalkedPath.routeKey])) {
                            breakAlongForeignPath(thisPath, overlappedSegments, innerWalkedPath);
                        }
                    },
                    beforeChildWalk: function (innerWalkedModel: IWalkModel): boolean {

                        //see if there is a model measurement. if not, it is because the model does not contain paths.
                        var innerModelMeasurement = modelToIntersectAtlas.modelMap[innerWalkedModel.routeKey];
                        return innerModelMeasurement && measure.isMeasurementOverlapping(modelToBreakAtlas.pathMap[outerWalkedPath.routeKey], innerModelMeasurement);
                    }
                };

                //keep breaking the segments anywhere they intersect with paths of the other model
                walk(modelToIntersect, walkModelToIntersectOptions);

                if (checkIsInside) {
                    //check each segment whether it is inside or outside
                    for (var i = 0; i < thisPath.segments.length; i++) {
                        var p = point.middle(thisPath.segments[i].absolutePath);
                        var pointInsideOptions: IMeasurePointInsideOptions = { measureAtlas: modelToIntersectAtlas, farPoint: farPoint };
                        thisPath.segments[i].isInside = measure.isPointInsideModel(p, modelToIntersect, pointInsideOptions);
                        thisPath.segments[i].uniqueForeignIntersectionPoints = pointInsideOptions.out_intersectionPoints;
                    }
                }

                crossedPaths.push(thisPath);
            }
        };

        walk(modelToBreak, walkModelToBreakOptions);

        return { crossedPaths: crossedPaths, overlappedSegments: overlappedSegments };
    }

    /**
     * @private
     */
    function checkForEqualOverlaps(crossedPathsA: ICrossedPathSegment[], crossedPathsB: ICrossedPathSegment[], pointMatchingDistance: number) {

        function compareSegments(segment1: ICrossedPathSegment, segment2: ICrossedPathSegment) {
            if (measure.isPathEqual(segment1.absolutePath, segment2.absolutePath, pointMatchingDistance)) {
                segment1.duplicate = segment2.duplicate = true;
            }
        }

        function compareAll(segment: ICrossedPathSegment) {
            for (var i = 0; i < crossedPathsB.length; i++) {
                compareSegments(crossedPathsB[i], segment);
            }
        }

        for (var i = 0; i < crossedPathsA.length; i++) {
            compareAll(crossedPathsA[i]);
        }

    }

    /**
     * @private
     */
    interface ITrackDeleted {
        (pathToDelete: IPath, routeKey: string, reason: string): void;
    }

    /**
     * @private
     */
    function addOrDeleteSegments(crossedPath: ICrossedPath, includeInside: boolean, includeOutside: boolean, keepDuplicates: boolean, atlas: measure.Atlas, trackDeleted: ITrackDeleted) {

        function addSegment(modelContext: IModel, pathIdBase: string, segment: ICrossedPathSegment) {
            var id = getSimilarPathId(modelContext, pathIdBase);
            var newRouteKey = (id == pathIdBase) ? crossedPath.routeKey : createRouteKey(crossedPath.route.slice(0, -1).concat([id]));

            segment.addedPath = cloneObject(crossedPath.pathContext);

            //circles may have become arcs
            segment.addedPath.type = segment.absolutePath.type;

            path.copyProps(segment.absolutePath, segment.addedPath);
            path.moveRelative(segment.addedPath, crossedPath.offset, true);

            modelContext.paths[id] = segment.addedPath;

            if (crossedPath.broken) {
                //save the new segment's measurement
                var measurement = measure.pathExtents(segment.absolutePath);
                atlas.pathMap[newRouteKey] = measurement;
                atlas.modelsMeasured = false;
            } else {
                //keep the original measurement
                atlas.pathMap[newRouteKey] = savedMeasurement;
            }
        }

        function checkAddSegment(modelContext: IModel, pathIdBase: string, segment: ICrossedPathSegment) {
            if (segment.isInside && includeInside || !segment.isInside && includeOutside) {
                addSegment(modelContext, pathIdBase, segment);
            } else {
                atlas.modelsMeasured = false;
                trackDeleted(segment.absolutePath, crossedPath.routeKey, 'segment is ' + (segment.isInside ? 'inside' : 'outside') + ' intersectionPoints=' + JSON.stringify(segment.uniqueForeignIntersectionPoints));
            }
        }

        //save the original measurement
        var savedMeasurement = atlas.pathMap[crossedPath.routeKey];

        //delete the original, its segments will be added
        delete crossedPath.modelContext.paths[crossedPath.pathId];
        delete atlas.pathMap[crossedPath.routeKey];

        for (var i = 0; i < crossedPath.segments.length; i++) {
            if (crossedPath.segments[i].duplicate) {
                if (keepDuplicates) {
                    addSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
                } else {
                    trackDeleted(crossedPath.segments[i].absolutePath, crossedPath.routeKey, 'segment is duplicate');
                }
            } else {
                checkAddSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
            }
        }
    }

    /**
     * Combine 2 models. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @param includeAInsideB Flag to include paths from modelA which are inside of modelB.
     * @param includeAOutsideB Flag to include paths from modelA which are outside of modelB.
     * @param includeBInsideA Flag to include paths from modelB which are inside of modelA.
     * @param includeBOutsideA Flag to include paths from modelB which are outside of modelA.
     * @param options Optional ICombineOptions object.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    export function combine(modelA: IModel, modelB: IModel, includeAInsideB: boolean = false, includeAOutsideB: boolean = true, includeBInsideA: boolean = false, includeBOutsideA: boolean = true, options?: ICombineOptions) {

        var opts: ICombineOptions = {
            trimDeadEnds: true,
            pointMatchingDistance: .005,
            out_deleted: [{ paths: {} }, { paths: {} }]
        };
        extendObject(opts, options);

        opts.measureA = opts.measureA || new measure.Atlas(modelA);
        opts.measureB = opts.measureB || new measure.Atlas(modelB);

        //make sure model measurements capture all paths
        opts.measureA.measureModels();
        opts.measureB.measureModels();

        if (!opts.farPoint) {
            var measureBoth = measure.increase(measure.increase({ high: [null, null], low: [null, null] }, opts.measureA.modelMap['']), opts.measureB.modelMap['']);
            opts.farPoint = point.add(measureBoth.high, [1, 1]);
        }

        var pathsA = breakAllPathsAtIntersections(modelA, modelB, true, opts.measureA, opts.measureB, opts.farPoint);
        var pathsB = breakAllPathsAtIntersections(modelB, modelA, true, opts.measureB, opts.measureA, opts.farPoint);

        checkForEqualOverlaps(pathsA.overlappedSegments, pathsB.overlappedSegments, opts.pointMatchingDistance);

        function trackDeleted(which: number, deletedPath: IPath, routeKey: string, reason: string) {
            addPath(opts.out_deleted[which], deletedPath, 'deleted');
            var p = deletedPath as IPathRemoved;
            p.reason = reason;
            p.routeKey = routeKey;
        }

        for (var i = 0; i < pathsA.crossedPaths.length; i++) {
            addOrDeleteSegments(pathsA.crossedPaths[i], includeAInsideB, includeAOutsideB, true, opts.measureA, (p, id, reason) => trackDeleted(0, p, id, reason));
        }

        for (var i = 0; i < pathsB.crossedPaths.length; i++) {
            addOrDeleteSegments(pathsB.crossedPaths[i], includeBInsideA, includeBOutsideA, false, opts.measureB, (p, id, reason) => trackDeleted(1, p, id, reason));
        }

        var result: IModel = { models: { a: modelA, b: modelB } };

        if (opts.trimDeadEnds) {

            var shouldKeep: IWalkPathBooleanCallback;

            //union
            if (!includeAInsideB && !includeBInsideA) {
                shouldKeep = function (walkedPath: IWalkPath): boolean {

                    //When A and B share an outer contour, the segments marked as duplicate will not pass the "inside" test on either A or B.
                    //Duplicates were discarded from B but kept in A
                    for (var i = 0; i < pathsA.overlappedSegments.length; i++) {
                        if (pathsA.overlappedSegments[i].duplicate && walkedPath.pathContext === pathsA.overlappedSegments[i].addedPath) {
                            return false;
                        }
                    }

                    //default - keep the path
                    return true;
                }
            }

            removeDeadEnds(result, null, shouldKeep, (wp, reason) => {
                var which = wp.route[1] === 'a' ? 0 : 1;
                trackDeleted(which, wp.pathContext, wp.routeKey, reason)
            });
        }

        //pass options back to caller
        extendObject(options, opts);

        return result;
    }

    /**
     * Combine 2 models, resulting in a intersection. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    export function combineIntersection(modelA: IModel, modelB: IModel) {
        return combine(modelA, modelB, true, false, true, false);
    }

    /**
     * Combine 2 models, resulting in a subtraction of B from A. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    export function combineSubtraction(modelA: IModel, modelB: IModel) {
        return combine(modelA, modelB, false, true, true, false);
    }

    /**
     * Combine 2 models, resulting in a union. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    export function combineUnion(modelA: IModel, modelB: IModel) {
        return combine(modelA, modelB, false, true, false, true);
    }
}
