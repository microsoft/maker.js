namespace MakerJs.model {

    /**
     * @private
     */
    function getNonZeroSegments(pathToSegment: IPath, breakPoint: IPoint): IPath[] {
        var segmentType = pathToSegment.type;
        var segment1 = cloneObject<IPath>(pathToSegment);
        var segment2 = path.breakAtPoint(segment1, breakPoint);

        if (segment2) {
            var segments: IPath[] = [segment1, segment2];
            for (var i = 2; i--;) {
                if (round(measure.pathLength(segments[i]), .0001) == 0) {
                    return null;
                }
            }
            return segments;
        } else if (segmentType == pathType.Circle) {
            return [segment1];
        }
        return null;
    }

    /**
     * @private
     */
    function breakAlongForeignPath(segments: ICrossedPathSegment[], overlappedSegments: ICrossedPathSegment[], foreignPath: IPath) {

        if (measure.isPathEqual(segments[0].path, foreignPath, .0001)) {
            segments[0].overlapped = true;
            segments[0].duplicate = true;

            overlappedSegments.push(segments[0]);
            return;
        }

        var foreignPathEndPoints: IPoint[];

        for (var i = 0; i < segments.length; i++) {

            var pointsToCheck: IPoint[];
            var options: IPathIntersectionOptions = {};
            var foreignIntersection = path.intersection(segments[i].path, foreignPath, options);

            if (foreignIntersection) {
                pointsToCheck = foreignIntersection.intersectionPoints;

            } else if (options.out_AreOverlapped) {
                segments[i].overlapped = true;

                overlappedSegments.push(segments[i]);

                if (!foreignPathEndPoints) {
                    foreignPathEndPoints = point.fromPathEnds(foreignPath);
                }

                pointsToCheck = foreignPathEndPoints;
            }

            if (pointsToCheck) {

                //break the path which intersected, and add the shard to the end of the array so it can also be checked in this loop for further sharding.
                var subSegments: IPath[] = null;
                var p = 0;
                while (!subSegments && p < pointsToCheck.length) {
                    subSegments = getNonZeroSegments(segments[i].path, pointsToCheck[p]);
                    p++;
                }

                if (subSegments) {
                    segments[i].path = subSegments[0];

                    if (subSegments[1]) {
                        var newSegment: ICrossedPathSegment = {
                            path: subSegments[1],
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
    function checkIntersectsForeignPath(segment: IPathInside, foreignPath: IPath, foreignPathId: string, farPoint: IPoint = [7654321, 1234567]) {
        var origin = point.middle(segment.path);
        var lineToFarPoint = new paths.Line(origin, farPoint);
        var farInt = path.intersection(lineToFarPoint, foreignPath);

        if (farInt) {
            var added = addUniquePoints(segment.uniqueForeignIntersectionPoints, farInt.intersectionPoints);

            //if number of intersections is an odd number, flip the flag.
            if (added % 2 == 1) {
                segment.isInside = !!!segment.isInside;
            }
        }
    }

    /**
     * @private
     */
    function checkInsideForeignModel(segment: IPathInside, modelToIntersect: IModel, farPoint?: IPoint) {
        walkPaths(modelToIntersect, function (mx: IModel, pathId2: string, path2: IPath) {
            if (path2) {
                checkIntersectsForeignPath(segment, path2, pathId2, farPoint);
            }
        });
    }

    /**
     * Check to see if a path is inside of a model.
     * 
     * @param pathContext The path to check.
     * @param modelContext The model to check against.
     * @param farPoint Optional point of reference which is outside the bounds of the modelContext.
     * @returns Boolean true if the path is inside of the modelContext.
     */
    export function isPathInsideModel(pathContext: IPath, modelContext: IModel, farPoint?: IPoint): boolean {
        var segment: IPathInside = {
            path: pathContext,
            isInside: false,
            uniqueForeignIntersectionPoints: []
        };

        checkInsideForeignModel(segment, modelContext, farPoint);

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
    }

    /**
     * @private
     */
    interface ICrossedPath extends IRefPathIdInModel {
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
        breakAllPathsAtIntersections(modelToBreak, modelToIntersect || modelToBreak, false);
    }

    /**
     * @private
     */
    function breakAllPathsAtIntersections(modelToBreak: IModel, modelToIntersect: IModel, checkIsInside: boolean, farPoint?: IPoint): ICombinedModel {

        var crossedPaths: ICrossedPath[] = [];
        var overlappedSegments: ICrossedPathSegment[] = [];

        walkPaths(modelToBreak, function (modelContext: IModel, pathId1: string, path1: IPath) {

            if (!path1) return;

            //clone this path and make it the first segment
            var segment: ICrossedPathSegment = {
                path: cloneObject<IPath>(path1),
                pathId: pathId1,
                overlapped: false,
                uniqueForeignIntersectionPoints: []
            };

            var thisPath: ICrossedPath = {
                modelContext: modelContext,
                pathId: pathId1,
                segments: [segment],
            };

            //keep breaking the segments anywhere they intersect with paths of the other model
            walkPaths(modelToIntersect, function (mx: IModel, pathId2: string, path2: IPath) {
                if (path2 && path1 !== path2) {
                    breakAlongForeignPath(thisPath.segments, overlappedSegments, path2);
                }
            });

            if (checkIsInside) {
                //check each segment whether it is inside or outside
                for (var i = 0; i < thisPath.segments.length; i++) {
                    checkInsideForeignModel(thisPath.segments[i], modelToIntersect, farPoint);
                }
            }

            crossedPaths.push(thisPath);
        });

        return { crossedPaths: crossedPaths, overlappedSegments: overlappedSegments };
    }

    /**
     * @private
     */
    function checkForEqualOverlaps(crossedPathsA: ICrossedPathSegment[], crossedPathsB: ICrossedPathSegment[], pointMatchingDistance: number) {

        function compareSegments(segment1: ICrossedPathSegment, segment2: ICrossedPathSegment) {
            if (measure.isPathEqual(segment1.path, segment2.path, pointMatchingDistance)) {
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
    function addOrDeleteSegments(crossedPath: ICrossedPath, includeInside: boolean, includeOutside: boolean, keepDuplicates: boolean) {

        function addSegment(modelContext: IModel, pathIdBase: string, segment: ICrossedPathSegment) {
            var id = getSimilarPathId(modelContext, pathIdBase);
            modelContext.paths[id] = segment.path;
        }

        function checkAddSegment(modelContext: IModel, pathIdBase: string, segment: ICrossedPathSegment) {
            if (segment.isInside && includeInside || !segment.isInside && includeOutside) {
                addSegment(modelContext, pathIdBase, segment);
            }
        }

        //delete the original, its segments will be added
        delete crossedPath.modelContext.paths[crossedPath.pathId];

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
     * Combine 2 models. The models should be originated, and every path within each model should be part of a loop.
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

        var pathsA = breakAllPathsAtIntersections(modelA, modelB, true, opts.farPoint);
        var pathsB = breakAllPathsAtIntersections(modelB, modelA, true, opts.farPoint);

        checkForEqualOverlaps(pathsA.overlappedSegments, pathsB.overlappedSegments, opts.pointMatchingDistance);

        for (var i = 0; i < pathsA.crossedPaths.length; i++) {
            addOrDeleteSegments(pathsA.crossedPaths[i], includeAInsideB, includeAOutsideB, true);
        }

        for (var i = 0; i < pathsB.crossedPaths.length; i++) {
            addOrDeleteSegments(pathsB.crossedPaths[i], includeBInsideA, includeBOutsideA, false);
        }

        if (opts.trimDeadEnds) {
            removeDeadEnds(<IModel>{ models: { modelA: modelA, modelB: modelB } });
        }
    }

}
