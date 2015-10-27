/// <reference path="combine.ts" />

module MakerJs.model {

    /**
     * @private
     */
    interface IPathOnPoint {
        id: string;
        path: IPath;
        nextPoint: string;
    }

    /**
     * @private
     */
    interface IPointConnection {
        [serializedPoint: string]: IPathOnPoint[];
    }

    /**
     * @private
     */
    interface ILoopModel extends IModel {
        insideCount: number;
    }

    /**
     * @private
     */
    function getOtherPath(pathsOnPoint: IPathOnPoint[], pathContext: IPath): IPathOnPoint {
        if (pathsOnPoint[0].path === pathContext) {
            return pathsOnPoint[1];
        }
        return pathsOnPoint[0];
    }

    /**
     * @private
     */
    function getFirstPathFromModel(modelContext: IModel) {
        if (!modelContext.paths) return null;

        for (var pathId in modelContext.paths) {
            return modelContext.paths[pathId];
        }

        return null;
    }

    /**
     * @private
     */
    function follow(points: IPointConnection, loops: ILoopModel[]) {
        //for a given point, follow the paths that connect to each other to form loops
        for (var p in points) {
            var pathsOnPoint: IPathOnPoint[] = points[p];

            if (pathsOnPoint) {

                var loopModel: ILoopModel = {
                    paths: {},
                    insideCount: 0
                };

                var firstPath = pathsOnPoint[0];
                var currPath = firstPath;

                while (true) {
                    var id = model.getSimilarPathId(loopModel, currPath.id);
                    loopModel.paths[id] = currPath.path;

                    if (!points[currPath.nextPoint]) break;

                    var nextPath = getOtherPath(points[currPath.nextPoint], currPath.path);
                    points[currPath.nextPoint] = null;

                    if (!nextPath) break;

                    currPath = nextPath;

                    if (currPath.path === firstPath.path) {

                        //loop is closed
                        loops.push(loopModel);
                        break;
                    }
                }
            }
        }
    }

    /**
     * Find paths that have common endpoints and form loops.
     * 
     * @param modelContext The model to search for loops.
     * @param accuracy Optional exemplar of number of decimal places.
     * @returns A new model with child models ranked according to their containment within other found loops.
     */
    export function findLoops(modelContext: IModel, accuracy?: number): IModel {
        var loops: ILoopModel[] = [];
        var points: IPointConnection = {};
        var result: IModel = { models: {} };

        function getArrayOfPathsOnPoint(p: IPoint) {
            var serializedPoint = point.serialize(p, accuracy);

            if (!(serializedPoint in points)) {
                points[serializedPoint] = [];
            }

            return points[serializedPoint];
        }

        function spin(callback: (loop: ILoopModel) => void) {
            for (var i = 0; i < loops.length; i++) {
                callback(loops[i]);
            }
        }

        function getModelByDepth(depth: number): IModel {
            var id = depth.toString();

            if (!(id in result.models)) {
                var newModel: IModel = { models: {} };
                result.models[id] = newModel;
            }

            return result.models[id];
        }

        model.originate(modelContext);

        //find loops by looking at all paths in this model
        model.walkPaths(modelContext, function (modelContext: IModel, pathId: string, pathContext: IPath) {

            //circles are loops by nature
            if (pathContext.type == pathType.Circle) {
                var loopModel: ILoopModel = {
                    paths: {},
                    insideCount: 0
                };
                loopModel.paths[pathId] = pathContext;
                loops.push(loopModel);

            } else {
                //gather both endpoints from all non-circle segments
                var endpoints = point.fromPathEnds(pathContext);

                for (var i = 2; i--;) {
                    var pathOnPoint: IPathOnPoint = {
                        id: pathId,
                        path: pathContext,
                        nextPoint: point.serialize(endpoints[1 - i], accuracy)
                    };
                    getArrayOfPathsOnPoint(endpoints[i]).push(pathOnPoint);
                }
            }
        });

        //follow paths to find loops
        follow(points, loops);

        //now we have all loops, we need to see which are inside of each other
        spin(function (firstLoop: ILoopModel) {

            var firstPath = getFirstPathFromModel(firstLoop);

            if (!firstPath) return;

            spin(function (secondLoop: ILoopModel) {

                if (firstLoop === secondLoop) return;

                if (isPathInsideModel(firstPath, secondLoop)) {
                    firstLoop.insideCount++;
                }

            });
        });

        //now we can group similar loops by their nested level
        spin(function (loop: ILoopModel) {
            var depthModel = getModelByDepth(loop.insideCount);
            var id = countChildModels(depthModel).toString();

            delete loop.insideCount;

            depthModel.models[id] = loop;
        });

        return result;
    }
}
