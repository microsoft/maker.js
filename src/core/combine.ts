namespace MakerJs.model {

    /**
     * @private
     */
    function getNonZeroSegments(pathToSegment: IPath, breakPoint: IPoint): IPath[] {
        var segment1 = path.clone(pathToSegment);

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
    function breakAlongForeignPath(crossedPath: ICrossedPath, overlappedSegments: ICrossedPathSegment[], foreignWalkedPath: IWalkPath) {
        var foreignPath = foreignWalkedPath.pathContext;
        var segments = crossedPath.segments;

        if (measure.isPathEqual(segments[0].path, foreignPath, .0001, crossedPath.offset, foreignWalkedPath.offset)) {
            segments[0].overlapped = true;
            segments[0].duplicate = true;

            overlappedSegments.push(segments[0]);
            return;
        }

        var foreignPathEndPoints: IPoint[];

        for (var i = 0; i < segments.length; i++) {

            var pointsToCheck: IPoint[];
            var options: IPathIntersectionOptions = { path1Offset: crossedPath.offset, path2Offset: foreignWalkedPath.offset };
            var foreignIntersection = path.intersection(segments[i].path, foreignPath, options);

            if (foreignIntersection) {
                pointsToCheck = foreignIntersection.intersectionPoints;

            } else if (options.out_AreOverlapped) {
                segments[i].overlapped = true;

                overlappedSegments.push(segments[i]);

                if (!foreignPathEndPoints) {
                    //make sure endpoints are in absolute coords
                    foreignPathEndPoints = point.fromPathEnds(foreignPath, foreignWalkedPath.offset);
                }

                pointsToCheck = foreignPathEndPoints;
            }

            if (pointsToCheck) {

                //break the path which intersected, and add the shard to the end of the array so it can also be checked in this loop for further sharding.
                var subSegments: IPath[] = null;
                var p = 0;
                while (!subSegments && p < pointsToCheck.length) {
                    //cast absolute points to path relative space
                    subSegments = getNonZeroSegments(segments[i].path, point.subtract(pointsToCheck[p], crossedPath.offset));
                    p++;
                }

                if (subSegments) {
                    crossedPath.broken = true;

                    segments[i].path = subSegments[0];

                    if (subSegments[1]) {
                        var newSegment: ICrossedPathSegment = {
                            path: subSegments[1],
                            pathId: segments[0].pathId,
                            overlapped: segments[i].overlapped,
                            uniqueForeignIntersectionPoints: [],
                            offset: crossedPath.offset
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
     * @private
     */
    function addUniquePoints(pointArray: IPoint[], pointsToAdd: IPoint[]): number {

        var added = 0;

        function addUniquePoint(pointToAdd: IPoint) {
            for (var i = 0; i < pointArray.length; i++) {
                if (measure.isPointEqual(pointArray[i], pointToAdd, .000000001)) {
                    return;
                }
            }
            pointArray.push(pointToAdd);
            added++;
        }

        for (var i = 0; i < pointsToAdd.length; i++) {
            addUniquePoint(pointsToAdd[i]);
        }

        return added;
    }

    /**
     * @private
     */
    function checkInsideForeignModel(segment: IPathInside, segmentOffset: IPoint, modelToIntersect: IModel, modelToIntersectAtlas: measure.Atlas, farPoint: IPoint = [7654321, 1234567]) {
        var origin = point.add(point.middle(segment.path), segmentOffset);
        var lineToFarPoint = new paths.Line(origin, farPoint);
        var measureFarPoint = measure.pathExtents(lineToFarPoint);

        var walkOptions: IWalkOptions = {
            onPath: function (walkedPath: IWalkPath) {

                if (modelToIntersectAtlas && !measure.isMeasurementOverlapping(measureFarPoint, modelToIntersectAtlas.pathMap[walkedPath.routeKey])) {
                    return;
                }

                var options: IPathIntersectionOptions = { path2Offset: walkedPath.offset };

                var farInt = path.intersection(lineToFarPoint, walkedPath.pathContext, options);

                if (farInt) {
                    var added = addUniquePoints(segment.uniqueForeignIntersectionPoints, farInt.intersectionPoints);

                    //if number of intersections is an odd number, flip the flag.
                    if (added % 2 == 1) {
                        segment.isInside = !!!segment.isInside;
                    }
                }
            },
            beforeChildWalk: function (innerWalkedModel: IWalkModel): boolean {

                if (!modelToIntersectAtlas) {
                    return true;
                }

                //see if there is a model measurement. if not, it is because the model does not contain paths.
                var innerModelMeasurement = modelToIntersectAtlas.modelMap[innerWalkedModel.routeKey];
                return innerModelMeasurement && measure.isMeasurementOverlapping(measureFarPoint, innerModelMeasurement);
            }
        };
        walk(modelToIntersect, walkOptions);
    }

    /**
     * Check to see if a path is inside of a model.
     * 
     * @param pathContext The path to check.
     * @param modelContext The model to check against.
     * @param farPoint Optional point of reference which is outside the bounds of the modelContext.
     * @returns Boolean true if the path is inside of the modelContext.
     */
    export function isPathInsideModel(pathContext: IPath, modelContext: IModel, pathOffset?: IPoint, farPoint?: IPoint, measureAtlas?: measure.Atlas): boolean {
        var segment: IPathInside = {
            path: pathContext,
            isInside: false,
            uniqueForeignIntersectionPoints: []
        };

        checkInsideForeignModel(segment, pathOffset, modelContext, measureAtlas, farPoint);

        return !!segment.isInside;
    }

    /**
     * @private
     */
    interface IPathInside {
        path: IPath;
        isInside?: boolean;
        uniqueForeignIntersectionPoints: IPoint[];
    }

    /**
     * @private
     */
    interface ICrossedPathSegment extends IPathInside {
        pathId: string;
        overlapped: boolean;
        duplicate?: boolean;
        offset: IPoint;
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
     * Break a model's paths everywhere they intersect with another path.
     *
     * @param modelToBreak The model containing paths to be broken.
     * @param modelToIntersect Optional model containing paths to look for intersection, or else the modelToBreak will be used.
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
                    path: path.clone(outerWalkedPath.pathContext),
                    pathId: outerWalkedPath.pathId,
                    overlapped: false,
                    uniqueForeignIntersectionPoints: [],
                    offset: outerWalkedPath.offset
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
                        checkInsideForeignModel(thisPath.segments[i], thisPath.offset, modelToIntersect, modelToIntersectAtlas, farPoint);
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
            if (measure.isPathEqual(segment1.path, segment2.path, pointMatchingDistance, segment1.offset, segment2.offset)) {
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
    function addOrDeleteSegments(crossedPath: ICrossedPath, includeInside: boolean, includeOutside: boolean, keepDuplicates: boolean, atlas: measure.Atlas) {

        function addSegment(modelContext: IModel, pathIdBase: string, segment: ICrossedPathSegment) {
            var id = getSimilarPathId(modelContext, pathIdBase);
            var newRouteKey = (id == pathIdBase) ? crossedPath.routeKey : createRouteKey(crossedPath.route.slice(0, -1).concat([id]));

            modelContext.paths[id] = segment.path;

            if (crossedPath.broken) {
                //save the new segment's measurement
                var measurement = measure.pathExtents(segment.path, crossedPath.offset);
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
                }
            } else {
                checkAddSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
            }
        }
    }

    /**
     * Combine 2 models.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @param includeAInsideB Flag to include paths from modelA which are inside of modelB.
     * @param includeAOutsideB Flag to include paths from modelA which are outside of modelB.
     * @param includeBInsideA Flag to include paths from modelB which are inside of modelA.
     * @param includeBOutsideA Flag to include paths from modelB which are outside of modelA.
     * @param keepDuplicates Flag to include paths which are duplicate in both models.
     * @param farPoint Optional point of reference which is outside the bounds of both models.
     */
    export function combine(modelA: IModel, modelB: IModel, includeAInsideB: boolean = false, includeAOutsideB: boolean = true, includeBInsideA: boolean = false, includeBOutsideA: boolean = true, options?: ICombineOptions) {

        var opts: ICombineOptions = {
            trimDeadEnds: true,
            pointMatchingDistance: .005
        };
        extendObject(opts, options);

        opts.measureA = opts.measureA || new measure.Atlas(modelA);
        opts.measureB = opts.measureB || new measure.Atlas(modelB);

        //make sure model measurements capture all paths
        opts.measureA.measureModels();
        opts.measureB.measureModels();

        var pathsA = breakAllPathsAtIntersections(modelA, modelB, true, opts.measureA, opts.measureB, opts.farPoint);
        var pathsB = breakAllPathsAtIntersections(modelB, modelA, true, opts.measureB, opts.measureA, opts.farPoint);

        checkForEqualOverlaps(pathsA.overlappedSegments, pathsB.overlappedSegments, opts.pointMatchingDistance);

        for (var i = 0; i < pathsA.crossedPaths.length; i++) {
            addOrDeleteSegments(pathsA.crossedPaths[i], includeAInsideB, includeAOutsideB, true, opts.measureA);
        }

        for (var i = 0; i < pathsB.crossedPaths.length; i++) {
            addOrDeleteSegments(pathsB.crossedPaths[i], includeBInsideA, includeBOutsideA, false, opts.measureB);
        }

        if (opts.trimDeadEnds) {

            var shouldKeep: IWalkPathBooleanCallback;

            //union
            if (!includeAInsideB && !includeBInsideA) {
                shouldKeep = function (walkedPath: IWalkPath): boolean {

                    //When A and B share an outer contour, the segments marked as duplicate will not pass the "inside" test on either A or B.
                    //Duplicates were discarded from B but kept in A
                    for (var i = 0; i < pathsA.overlappedSegments.length; i++) {
                        if (pathsA.overlappedSegments[i].duplicate && walkedPath.pathContext === pathsA.overlappedSegments[i].path) {
                            return false;
                        }
                    }

                    //default - keep the path
                    return true;
                }
            }

            removeDeadEnds(<IModel>{ models: { modelA: modelA, modelB: modelB } }, null, shouldKeep);
        }

        //pass options back to caller
        extendObject(options, opts);
    }

    /**
     * Combine 2 models, resulting in a intersection.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     */
    export function combineIntersection(modelA: IModel, modelB: IModel) {
        return combine(modelA, modelB, true, false, true, false);
    }

    /**
     * Combine 2 models, resulting in a subtraction of B from A.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     */
    export function combineSubtraction(modelA: IModel, modelB: IModel) {
        return combine(modelA, modelB, false, true, true, false);
    }

    /**
     * Combine 2 models, resulting in a union.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     */
    export function combineUnion(modelA: IModel, modelB: IModel) {
        return combine(modelA, modelB, false, true, false, true);
    }
}
