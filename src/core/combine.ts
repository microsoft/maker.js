/// <reference path="model.ts" />

module MakerJs.model {

    function getNonZeroSegments(pathToSegment: IPath, breakPoint: IPoint): IPath[] {
        var segment1 = cloneObject<IPath>(pathToSegment);
        var segment2 = path.breakAtPoint(segment1, breakPoint);

        if (segment2) {
            var segments: IPath[] = [segment1, segment2];
            for (var i = 2; i--;) {
                if (round(measure.pathLength(segments[i]), .000001) == 0) {
                    return null;
                }
            }
            return segments;
        }
        return null;
    }

    function breakAlongForeignPath(segments: ICrossedPathSegment[], foreignPath: IPath, rememberOverlaps: boolean) {

        for (var i = 0; i < segments.length; i++) {

            //see if any of the paths intsersect with the foreign path
            var options: IPathIntersectionOptions = {};
            var foreignIntersection = path.intersection(segments[i].path, foreignPath, options);

            if (rememberOverlaps && options.out_AreOverlapped) {
                segments[i].overlapped = true;
                segments[i].overlappedWith = foreignPath;
            }

            if (foreignIntersection) {
                
                //break the path which intersected, and add the shard to the end of the array so it can also be checked in this loop for further sharding.
                var subSegments: IPath[] = null;
                var p = 0;
                while (!subSegments && p < foreignIntersection.intersectionPoints.length) {
                    subSegments = getNonZeroSegments(segments[i].path, foreignIntersection.intersectionPoints[p]);
                    p++;
                }

                if (subSegments) {
                    segments[i].path = subSegments[0];
                    segments.push({ path: subSegments[1], overlapped: false, uniqueForeignIntersectionPoints: [] });

                    //re-check this segment for another deep intersection
                    i--;
                }
            }
        }
    }

    function addUniquePoint(pointArray: IPoint[], pointToAdd: IPoint): boolean {
        for (var i = 0; i < pointArray.length; i++) {
            if (point.areEqualRounded(pointArray[i], pointToAdd)) {
                return false;
            }
        }
        pointArray.push(pointToAdd);
        return true;
    }

    function addUniquePoints(pointArray: IPoint[], pointsToAdd: IPoint[]): number {
        var added = 0;
        for (var i = 0; i < pointsToAdd.length; i++) {
            if (addUniquePoint(pointArray, pointsToAdd[i])) {
                added++;
            }
        }
        return added;
    }

    function checkInsideForeign(segments: ICrossedPathSegment[], foreignPath: IPath, farPoint: IPoint = [1000000, 1000000]) {
        for (var i = 0; i < segments.length; i++) {
            var origin = point.middle(segments[i].path) || segments[i].path.origin;
            var lineToFarPoint = new paths.Line(origin, farPoint);
            var farInt = path.intersection(lineToFarPoint, foreignPath);

            if (farInt) {
                var added = addUniquePoints(segments[i].uniqueForeignIntersectionPoints, farInt.intersectionPoints);

                //if number of intersections is an odd number, flip the flag.
                if (added % 2 == 1) {
                    segments[i].insideForeign = !!!segments[i].insideForeign;
                }
            }
        }
    }

    interface ICrossedPathSegment {
        path: IPath;
        insideForeign?: boolean;
        uniqueForeignIntersectionPoints: IPoint[];
        overlapped: boolean;
        overlappedWith?: IPath;
    }

    interface ICrossedPath {
        modelContext: IModel;
        pathId: string;
        segments: ICrossedPathSegment[];
    }

    function breakAllPathsAtIntersections(modelToBreak: IModel, modelToIntersect: IModel, rememberOverlaps: boolean, farPoint: IPoint): ICrossedPath[] {

        var crossedPaths: ICrossedPath[] = [];

        walkPaths(modelToBreak, function (modelContext: IModel, pathId1: string, path1: IPath) {

            //clone this path and make it the first segment
            var segment: ICrossedPathSegment = {
                path: cloneObject<IPath>(path1),
                overlapped: false,
                uniqueForeignIntersectionPoints: []
            };

            var segments: ICrossedPathSegment[] = [segment];

            //keep breaking the segments anywhere they intersect with paths of the other model
            walkPaths(modelToIntersect, function (mx: IModel, pathId2: string, path2: IPath) {
                breakAlongForeignPath(segments, path2, rememberOverlaps);
            });

            //check each segment whether it is inside or outside
            walkPaths(modelToIntersect, function (mx: IModel, pathId2: string, path2: IPath) {
                checkInsideForeign(segments, path2, farPoint);
            });

            var thisPath: ICrossedPath = {
                modelContext: modelContext,
                pathId: pathId1,
                segments: segments
            };

            crossedPaths.push(thisPath);
        });

        return crossedPaths;
    }

    function addOrDeleteSegments(crossedPath: ICrossedPath, includeInside: boolean, includeOutside: boolean) {

        function addSegment(model: IModel, pathIdBase: string, segment: ICrossedPathSegment) {
            if (segment.insideForeign && includeInside || !segment.insideForeign && includeOutside) {
                var id = getSimilarPathId(model, pathIdBase);
                model.paths[id] = segment.path;
            }
        }

        //delete the original, its segments will be added
        delete crossedPath.modelContext.paths[crossedPath.pathId];

        for (var i = 0; i < crossedPath.segments.length; i++) {
            addSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
        }
    }

    export function combine(modelA: IModel, modelB: IModel, includeAInsideB: boolean, includeAOutsideB: boolean, includeBInsideA: boolean, includeBOutsideA: boolean, farPoint?: IPoint) {

        var pathsA = breakAllPathsAtIntersections(modelA, modelB, false, farPoint);
        var pathsB = breakAllPathsAtIntersections(modelB, modelA, true, farPoint);

        for (var i = 0; i < pathsA.length; i++) {
            addOrDeleteSegments(pathsA[i], includeAInsideB, includeAOutsideB);
        }

        for (var i = 0; i < pathsB.length; i++) {
            addOrDeleteSegments(pathsB[i], includeBInsideA, includeBOutsideA);
        }

    }
}
