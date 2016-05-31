namespace MakerJs.model {

    /**
     * @private
     */
    interface IPathDirectionalWithPrimeContext extends IPathDirectional, IRefPathIdInModel {
    }

    /**
     * @private
     */
    interface ILinkedPath {
        path: IPathDirectional;
        nextConnection: IPoint;
        reversed: boolean;
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
    function getOpposedLink(linkedPaths: ILinkedPath[], pathContext: IPath): ILinkedPath {
        if (linkedPaths[0].path === pathContext) {
            return linkedPaths[1];
        }
        return linkedPaths[0];
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
    function collectLoop(loop: ILoopModel, loops: ILoopModel[], detach: boolean) {
        loops.push(loop);

        if (detach) {
            detachLoop(loop);
        }
    }

    /**
     * @private
     */
    function follow(connections: Collector<IPoint, ILinkedPath>, loops: ILoopModel[], detach: boolean) {
        //for a given point, follow the paths that connect to each other to form loops
        for (var i = 0; i < connections.collections.length; i++) {

            var linkedPaths = connections.collections[i].items;

            if (linkedPaths && linkedPaths.length > 0) {

                var loopModel: ILoopModel = {
                    paths: {},
                    insideCount: 0
                };

                var firstLink = linkedPaths[0];
                var currLink = firstLink;

                while (true) {

                    var currPath = <IPathDirectionalWithPrimeContext>currLink.path;
                    currPath.reversed = currLink.reversed;

                    var id = getSimilarPathId(loopModel, currPath.pathId);
                    loopModel.paths[id] = currPath;

                    var items = connections.findCollection(currLink.nextConnection);

                    if (!items || items.length == 0) break;

                    var nextLink = getOpposedLink(items, currLink.path);

                    //remove the first 2 items, which should be currlink and nextlink
                    items.splice(0, 2);

                    if (!nextLink) break;

                    currLink = nextLink;

                    if (currLink.path === firstLink.path) {

                        //loop is closed
                        collectLoop(loopModel, loops, detach);
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
     * @param options Optional options object.
     * @returns A new model with child models ranked according to their containment within other found loops. The paths of models will be IPathDirectionalWithPrimeContext.
     */
    export function findLoops(modelContext: IModel, options?: IFindLoopsOptions): IModel {
        var loops: ILoopModel[] = [];
        var result: IModel = { models: {} };

        var opts: IFindLoopsOptions = {
            pointMatchingDistance: .005
        };
        extendObject(opts, options);

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

        function comparePoint(pointA: IPoint, pointB: IPoint): boolean {
            var distance = measure.pointDistance(pointA, pointB);
            return distance <= opts.pointMatchingDistance;
        }

        var connections = new Collector<IPoint, ILinkedPath>(comparePoint);

        //todo: remove dead ends first
        originate(modelContext);

        //find loops by looking at all paths in this model
        var walkOptions: IWalkOptions = {
            onPath: function (walkedPath: IWalkPath) {

                var safePath = <IPathDirectionalWithPrimeContext>path.clone(walkedPath.pathContext);
                safePath.pathId = walkedPath.pathId;
                safePath.modelContext = modelContext;

                //circles are loops by nature
                if (safePath.type == pathType.Circle || (safePath.type == pathType.Arc && angle.ofArcSpan(walkedPath.pathContext as IPathArc) == 360)) {
                    var loopModel: ILoopModel = {
                        paths: {},
                        insideCount: 0
                    };
                    loopModel.paths[walkedPath.pathId] = safePath;

                    collectLoop(loopModel, loops, opts.removeFromOriginal);

                } else {

                    //gather both endpoints from all non-circle segments
                    safePath.endPoints = point.fromPathEnds(safePath);

                    //don't add lines which are shorter than the tolerance
                    if (safePath.type == pathType.Line) {
                        var distance = measure.pointDistance(safePath.endPoints[0], safePath.endPoints[1]);
                        if (distance < opts.pointMatchingDistance) {
                            return;
                        }
                    }

                    for (var i = 2; i--;) {
                        var linkedPath: ILinkedPath = {
                            path: safePath,
                            nextConnection: safePath.endPoints[1 - i],
                            reversed: i != 0
                        };

                        connections.addItemToCollection(safePath.endPoints[i], linkedPath);
                    }
                }
            }
        };

        walk(modelContext, walkOptions);

        //follow paths to find loops
        follow(connections, loops, opts.removeFromOriginal);

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

    /**
     * Remove all paths in a loop model from the model(s) which contained them.
     * 
     * @param loopToDetach The model to search for loops.
     */
    export function detachLoop(loopToDetach: IModel) {
        for (var id in loopToDetach.paths) {
            var pathDirectionalWithOriginalContext = <IPathDirectionalWithPrimeContext>loopToDetach.paths[id];
            var primeModel = pathDirectionalWithOriginalContext.modelContext;
            if (primeModel && primeModel.paths && pathDirectionalWithOriginalContext.pathId) {
                delete primeModel.paths[pathDirectionalWithOriginalContext.pathId];
            }
        }
    }

    /**
     * @private
     */
    interface IRefPathEndpoints extends IWalkPath {
        endPoints: IPoint[];
    }

    /**
     * @private
     */
    class DeadEndFinder {

        public pointMap: Collector<IPoint, IRefPathEndpoints>;

        constructor(public pointMatchingDistance, public keep?: IWalkPathBooleanCallback) {

            pointMatchingDistance = pointMatchingDistance || .005;

            function comparePoint(pointA: IPoint, pointB: IPoint): boolean {
                var distance = measure.pointDistance(pointA, pointB);
                return distance <= pointMatchingDistance;
            }

            this.pointMap = new Collector<IPoint, IRefPathEndpoints>(comparePoint);
        }

        private removePathRef(pathRef: IRefPathEndpoints) {

            var removePath = (p: IPoint) => {
                var pathRefs = this.pointMap.findCollection(p);

                for (var i = 0; i < pathRefs.length; i++) {
                    if (pathRefs[i] === pathRef) {
                        pathRefs.splice(i, 1);
                        return;
                    }
                }
            }

            for (var i = 2; i--;) {
                removePath(pathRef.endPoints[i]);
            }
        }

        public removeDeadEnd(): boolean {
            var found = false;

            for (var i = 0; i < this.pointMap.collections.length; i++) {

                var pathRefs = this.pointMap.collections[i].items;

                if (pathRefs.length % 2 == 0) continue;

                if (pathRefs.length == 1) {
                    var pathRef = pathRefs[0];

                    this.removePathRef(pathRef);
                    delete pathRef.modelContext.paths[pathRef.pathId];
                    found = true;

                } else if (this.keep) {

                    //allow caller to decide to keep each path
                    pathRefs.map((pathRef: IRefPathEndpoints, i: number) => {
                        if (!this.keep(pathRef)) {

                            this.removePathRef(pathRef);
                            delete pathRef.modelContext.paths[pathRef.pathId];
                            found = true;

                        }
                    });

                }
            }
            return found;
        }
    }

    /**
     * Remove paths from a model which have endpoints that do not connect to other paths.
     * 
     * @param modelContext The model to search for dead ends.
     * @param options Optional options object.
     * @returns The input model (for chaining).
     */
    export function removeDeadEnds(modelContext: IModel, pointMatchingDistance?, keep?: IWalkPathBooleanCallback) {
        var deadEndFinder = new DeadEndFinder(pointMatchingDistance, keep);

        var walkOptions: IWalkOptions = {
            onPath: function (walkedPath: IWalkPath) {
                var endPoints = point.fromPathEnds(walkedPath.pathContext, walkedPath.offset);

                if (!endPoints) return;

                var pathRef = <IRefPathEndpoints>walkedPath;
                pathRef.endPoints = endPoints;

                for (var i = 2; i--;) {
                    deadEndFinder.pointMap.addItemToCollection(endPoints[i], pathRef);
                }
            }
        };

        walk(modelContext, walkOptions);

        while (deadEndFinder.removeDeadEnd());

        return modelContext;
    }
}
