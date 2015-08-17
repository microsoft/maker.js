/// <reference path="model.ts" />

module MakerJs.model {

    function getNonZeroSegments(pathToSegment: IPath, breakPoint: IPoint): IPath[] {
        var segment1 = cloneObject<IPath>(pathToSegment);
        var segment2 = path.breakAtPoint(segment1, breakPoint);

        if (segment2) {
            var segments: IPath[] = [segment1, segment2];
            for (var i = 2; i--;) {
                if (round(measure.pathLength(segments[i]), .00001) == 0) {
                    return null;
                }
            }
            return segments;
        }
        return null;
    }

    function breakAlongForeignPath(crossedPath: ICrossedPath, overlappedSegments: ICrossedPathSegment[], foreignPath: IPath) {

        var segments = crossedPath.segments;

        if (path.areEqual(segments[0].path, foreignPath)) {
            segments[0].overlapped = true;
            segments[0].overlappedEqual = true;

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

                    var newSegment = { path: subSegments[1], overlapped: segments[i].overlapped, uniqueForeignIntersectionPoints: [] };

                    if (segments[i].overlapped) {
                        overlappedSegments.push(newSegment);
                    }

                    segments.push(newSegment);

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

    function checkInsideForeign(segments: ICrossedPathSegment[], foreignPath: IPath, farPoint: IPoint = [7654321, 1234567]) {
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
        overlappedEqual?: boolean;
    }

    interface ICrossedPath {
        modelContext: IModel;
        pathId: string;
        segments: ICrossedPathSegment[];
    }

    interface ICombinedModel {
        crossedPaths: ICrossedPath[];
        overlappedSegments: ICrossedPathSegment[];
    }

    function breakAllPathsAtIntersections(modelToBreak: IModel, modelToIntersect: IModel, farPoint: IPoint): ICombinedModel {

        var crossedPaths: ICrossedPath[] = [];
        var overlappedSegments: ICrossedPathSegment[] = [];

        walkPaths(modelToBreak, function (modelContext: IModel, pathId1: string, path1: IPath) {

            if (!path1) return;

            //clone this path and make it the first segment
            var segment: ICrossedPathSegment = {
                path: cloneObject<IPath>(path1),
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
                if (path2) {
                    breakAlongForeignPath(thisPath, overlappedSegments, path2);
                }
            });

            //check each segment whether it is inside or outside
            walkPaths(modelToIntersect, function (mx: IModel, pathId2: string, path2: IPath) {
                if (path2) {
                    checkInsideForeign(thisPath.segments, path2, farPoint);
                }
            });

            crossedPaths.push(thisPath);
        });

        return { crossedPaths: crossedPaths, overlappedSegments: overlappedSegments };
    }


    function checkForEqualOverlaps(crossedPathsA: ICrossedPathSegment[], crossedPathsB: ICrossedPathSegment[]) {

        function compareSegments(seg1: ICrossedPathSegment, seg2: ICrossedPathSegment) {
            if (path.areEqual(seg1.path, seg2.path)) {
                seg1.overlappedEqual = seg2.overlappedEqual = true;
            }
        }

        function checkForEqualOverlapsA(seg: ICrossedPathSegment) {

            for (var i = 0; i < crossedPathsB.length; i++) {
                compareSegments(crossedPathsB[i], seg);
            }

        }

        for (var i = 0; i < crossedPathsA.length; i++) {
            checkForEqualOverlapsA(crossedPathsA[i]);
        }

    }

    function addOrDeleteSegments(crossedPath: ICrossedPath, includeInside: boolean, includeOutside: boolean, firstPass?: boolean) {

        function addSegment(model: IModel, pathIdBase: string, segment: ICrossedPathSegment) {
            var id = getSimilarPathId(model, pathIdBase);
            model.paths[id] = segment.path;
        }

        function checkAddSegment(model: IModel, pathIdBase: string, segment: ICrossedPathSegment) {
            if (segment.insideForeign && includeInside || !segment.insideForeign && includeOutside) {
                addSegment(model, pathIdBase, segment);
            }
        }

        //delete the original, its segments will be added
        delete crossedPath.modelContext.paths[crossedPath.pathId];

        for (var i = 0; i < crossedPath.segments.length; i++) {
            if (crossedPath.segments[i].overlappedEqual) {
                if (firstPass) {
                    addSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
                }
            } else {
                checkAddSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
            }
        }
    }

    export function combine(modelA: IModel, modelB: IModel, includeAInsideB: boolean, includeAOutsideB: boolean, includeBInsideA: boolean, includeBOutsideA: boolean, farPoint?: IPoint) {

        var pathsA = breakAllPathsAtIntersections(modelA, modelB, farPoint);
        var pathsB = breakAllPathsAtIntersections(modelB, modelA, farPoint);

        checkForEqualOverlaps(pathsA.overlappedSegments, pathsB.overlappedSegments);

        for (var i = 0; i < pathsA.crossedPaths.length; i++) {
            addOrDeleteSegments(pathsA.crossedPaths[i], includeAInsideB, includeAOutsideB, true);
        }

        for (var i = 0; i < pathsB.crossedPaths.length; i++) {
            addOrDeleteSegments(pathsB.crossedPaths[i], includeBInsideA, includeBOutsideA);
        }

    }
}
