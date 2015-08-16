/// <reference path="model.ts" />

module MakerJs.model {

    interface IPathCallback {
        (modelContext: IModel, pathId: string, pathContext: IPath): void;
    }

    function walk(modelContext: IModel, callback: IPathCallback) {

        if (modelContext.paths) {
            for (var pathId in modelContext.paths) {
                callback(modelContext, pathId, modelContext.paths[pathId]);
            }
        }

        if (modelContext.models) {
            for (var id in modelContext.models) {
                walk(modelContext.models[id], callback);
            }
        }

    }

    function deepBreak(pathToBreak: IPath, breakPoints: IPoint[]): IPath[]{
        var result: IPath[] = [];
        for (var i = 0; i < breakPoints.length; i++) {

        }
        return result;
    }

    function containsPath(segments: ICrossedPathSegment[], newPath: IPath): boolean {

        for (var i = 0; i < segments.length; i++) {
            if (path.areEqual(newPath, segments[i].path)) {
                return true;
            }
        }

        return false;
    }

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
            return [segment1, segment2];
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
                    segments.push({ path: subSegments[1], overlapped: false });

                    //re-check this segment for another deep intersection
                    i--;
                }
            }
        }
    }

    function checkInsideForeign(segments: ICrossedPathSegment[], foreignPath: IPath, farPoint: IPoint = [1000000, 1000000]) {

        for (var i = 0; i < segments.length; i++) {
            var origin = point.middle(segments[i].path) || segments[i].path.origin;
            var lineToFarPoint = new paths.Line(origin, farPoint);
            var farInt = path.intersection(lineToFarPoint, foreignPath);

            //if number of intersections is an odd number, flip the flag.
            if (farInt && farInt.intersectionPoints.length % 2 == 1) {
                segments[i].insideForeign = !!!segments[i].insideForeign;
            }
        }

    }


    interface ICrossedPathSegment {
        path: IPath;
        insideForeign?: boolean;
        overlapped: boolean;
        overlappedWith?: IPath;
    }

    interface ICrossedPath {
        modelContext: IModel;
        pathId: string;
        segments: ICrossedPathSegment[];
    }

    function walkPaths(m1: IModel, m2: IModel, includeInside: boolean, includeOutside: boolean, rememberOverlaps: boolean, farPoint: IPoint): ICrossedPath[] {

        var crossedPaths: ICrossedPath[] = [];

        var m1PathCallback: IPathCallback = function (modelContext1: IModel, pathId1: string, path1: IPath) {

            //clone this path and make it the first segment
            var segment: ICrossedPathSegment = {
                path: cloneObject<IPath>(path1),
                overlapped: false
            };

            var segments: ICrossedPathSegment[] = [segment];

            //keep breaking the segments anywhere they intersect with paths of the other model
            walk(m2, function (modelContext2: IModel, pathId2: string, path2: IPath) {
                breakAlongForeignPath(segments, path2, rememberOverlaps);
            });

            //check each segment whether it is inside or outside
            walk(m2, function (modelContext2: IModel, pathId2: string, path2: IPath) {
                checkInsideForeign(segments, path2, farPoint);
            });

            var thisPath: ICrossedPath = {
                modelContext: modelContext1,
                pathId: pathId1,
                segments: segments
            };

            crossedPaths.push(thisPath);
        };

        //get all paths for first model
        walk(m1, m1PathCallback);

        return crossedPaths;
    }

    export function combine(modelA: IModel, modelB: IModel, includeAInsideB: boolean, includeAOutsideB: boolean, includeBInsideA: boolean, includeBOutsideA: boolean, farPoint?: IPoint): IModel {

        var model: IModel = { paths: {} };

        var pathsA = walkPaths(modelA, modelB, includeAInsideB, includeAOutsideB, false, farPoint);
        var pathsB = walkPaths(modelB, modelA, includeBInsideA, includeBOutsideA, true, farPoint);

        function makeId(model: IModel, pathId: string): string {
            var i = 0;
            var newPathId = pathId;
            while (newPathId in model.paths) {
                i++;
                newPathId = pathId + '_' + i;
            }
            return newPathId;
        }

        function addSegment(model: IModel, pathIdBase: string, segment: ICrossedPathSegment, includeInside: boolean, includeOutside: boolean) {
            if (segment.insideForeign && includeInside || !segment.insideForeign && includeOutside) {
                var id = makeId(model, pathIdBase);
                model.paths[id] = segment.path;
            }
        }

        function addOrDeleteSegments(crossedPath: ICrossedPath, includeInside: boolean, includeOutside: boolean) {
            delete crossedPath.modelContext.paths[crossedPath.pathId];
            for (var i = 0; i < crossedPath.segments.length; i++) {
                addSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i], includeInside, includeOutside);
            }
        }

        for (var i = 0; i < pathsA.length; i++) {
            addOrDeleteSegments(pathsA[i], includeAInsideB, includeAOutsideB);
        }

        for (var i = 0; i < pathsB.length; i++) {
            addOrDeleteSegments(pathsB[i], includeBInsideA, includeBOutsideA);
        }

        return model;
    }
}
