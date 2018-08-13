namespace MakerJs.model {

    /**
     * @private
     */
    function getOpposedLink(linkedPaths: IChainLink[], pathContext: IPath): IChainLink {
        if (linkedPaths[0].walkedPath.pathContext === pathContext) {
            return linkedPaths[1];
        }
        return linkedPaths[0];
    }

    /**
     * @private
     */
    function followLinks(pointGraph: PointGraph<IChainLink>, chainFound: { (chain: Partial<IChain>, checkEndless: boolean): void; }, chainNotFound?: { (path: IWalkPath): void; }) {

        function followLink(currLink: IChainLink, chain: Partial<IChain>, firstLink: IChainLink) {

            while (currLink) {

                chain.links.push(currLink);
                chain.pathLength += currLink.pathLength;

                var next = currLink.reversed ? 0 : 1;
                var nextPoint = currLink.endPoints[next];
                let nextEl = pointGraph.getElementAtPoint(nextPoint);
                if (!nextEl || nextEl.valueIds.length === 0) {
                    break;
                }

                let items = nextEl.valueIds.map(valueIndex => pointGraph.values[valueIndex]);
                var nextLink = getOpposedLink(items, currLink.walkedPath.pathContext);

                //remove the first 2 items, which should be currlink and nextlink
                nextEl.valueIds.splice(0, 2);

                if (!nextLink) {
                    break;
                }

                if (nextLink.walkedPath.pathContext === firstLink.walkedPath.pathContext) {
                    if (chain.links.length > 1) {
                        chain.endless = true;
                    }
                    break;
                }

                currLink = nextLink;
            }

        }

        pointGraph.forEachPoint((p: IPoint, values: IChainLink[], pointId?: number, el?: IPointGraphIndexElement) => {

            if (el.valueIds.length > 0) {

                var chain: Partial<IChain> = {
                    links: [],
                    pathLength: 0
                };

                followLink(values[0], chain, values[0]);

                if (chain.endless) {
                    chainFound(chain, false);
                } else {
                    //need to go in reverse
                    chain.links.reverse();

                    var firstLink = chain.links[0];

                    chain.links.map(function (link: IChainLink) { link.reversed = !link.reversed; });

                    //remove the last link, it will be added in the call
                    chain.pathLength -= chain.links[chain.links.length - 1].pathLength;
                    var currLink = chain.links.pop();

                    followLink(currLink, chain, firstLink);

                    if (chain.links.length > 1) {
                        chainFound(chain, true);
                    } else {
                        chainNotFound(chain.links[0].walkedPath);
                    }
                }
            }
        });
    }

    /**
     * Find a single chain within a model, across all layers. Shorthand of findChains; useful when you know there is only one chain to find in your model.
     * 
     * @param modelContext The model to search for a chain.
     * @returns A chain object or null if chains were not found.
     */
    export function findSingleChain(modelContext: IModel) {
        var singleChain: IChain = null;

        findChains(modelContext,
            (chains: IChain[], loose: IWalkPath[], layer: string) => {
                singleChain = chains[0];
            },
            { byLayers: false }
        );

        return singleChain;
    }

    /**
     * @private
     */
    function linkEndpoint(link: IChainLink, beginning: boolean) {
        let index = (beginning === link.reversed) ? 1 : 0;
        return link.endPoints[index];
    }

    /**
     * Find paths that have common endpoints and form chains.
     * 
     * @param modelContext The model to search for chains.
     * @param options Optional options object.
     * @returns An array of chains, or a map (keyed by layer id) of arrays of chains - if options.byLayers is true.
     */
    export function findChains(modelContext: IModel, options?: IFindChainsOptions): IChain[] | IChainsMap;

    /**
     * Find paths that have common endpoints and form chains.
     * 
     * @param modelContext The model to search for chains.
     * @param callback Callback function when chains are found.
     * @param options Optional options object.
     * @returns An array of chains, or a map (keyed by layer id) of arrays of chains - if options.byLayers is true.
     */
    export function findChains(modelContext: IModel, callback: IChainCallback, options?: IFindChainsOptions): IChain[] | IChainsMap;

    export function findChains(modelContext: IModel, ...args: any[]): IChain[] | IChainsMap {

        var options: IFindChainsOptions;
        var callback: IChainCallback;

        switch (args.length) {
            case 1:
                if (typeof args[0] === 'function') {
                    callback = args[0];
                } else {
                    options = args[0];
                }
                break;

            case 2:
                callback = args[0];
                options = args[1];
                break;
        }

        var opts: IFindChainsOptions = {
            pointMatchingDistance: .005
        };
        extendObject(opts, options);

        const pointGraphsByLayer: { [layer: string]: PointGraph<IChainLink>; } = {};
        var chainsByLayer: IChainsMap = {};
        var ignored: { [layer: string]: IWalkPath[]; } = {};

        var walkOptions: IWalkOptions = {
            onPath: function (walkedPath: IWalkPath) {

                var layer = opts.byLayers ? walkedPath.layer : '';
                if (!pointGraphsByLayer[layer]) {
                    pointGraphsByLayer[layer] = new PointGraph<IChainLink>();
                }

                const pointGraph = pointGraphsByLayer[layer];
                var pathLength = measure.pathLength(walkedPath.pathContext);

                //circles are loops by nature
                if (
                    walkedPath.pathContext.type === pathType.Circle ||
                    (walkedPath.pathContext.type === pathType.Arc && round(angle.ofArcSpan(walkedPath.pathContext as IPathArc) - 360) === 0) ||
                    (walkedPath.pathContext.type === pathType.BezierSeed && measure.isPointEqual(walkedPath.pathContext.origin, (walkedPath.pathContext as IPathBezierSeed).end, opts.pointMatchingDistance))
                ) {

                    var chain: IChain = {
                        links: [{
                            walkedPath: walkedPath,
                            reversed: null,
                            endPoints: null,
                            pathLength: pathLength
                        }],
                        endless: true,
                        pathLength: pathLength
                    };

                    //store circles so that layers fire grouped
                    if (!chainsByLayer[layer]) {
                        chainsByLayer[layer] = [];
                    }
                    chainsByLayer[layer].push(chain);

                } else {

                    //don't add lines which are 5x shorter than the tolerance
                    if (pathLength < opts.pointMatchingDistance / 5) {

                        if (!ignored[layer]) {
                            ignored[layer] = [];
                        }
                        ignored[layer].push(walkedPath);

                        return;
                    }

                    //gather both endpoints from all non-circle segments
                    const endPoints = point.fromPathEnds(walkedPath.pathContext, walkedPath.offset);

                    for (var i = 0; i < 2; i++) {
                        var link: IChainLink = {
                            walkedPath: walkedPath,
                            endPoints: endPoints,
                            reversed: i != 0,
                            pathLength: pathLength
                        };
                        let valueId = pointGraph.insertValue(link);
                        pointGraph.insertValueIdAtPoint(valueId, endPoints[i]);
                    }
                }
            }
        };

        if (opts.shallow) {
            walkOptions.beforeChildWalk = function () { return false; };
        }

        var beziers: IWalkModel[];
        if (opts.unifyBeziers) {
            beziers = getBezierModels(modelContext);
            swapBezierPathsWithSeeds(beziers, true);
        }

        walk(modelContext, walkOptions);

        for (let layer in pointGraphsByLayer) {
            let pointGraph = pointGraphsByLayer[layer];

            pointGraph.mergeNearestSinglePoints(opts.pointMatchingDistance);

            var loose: IWalkPath[] = [];

            if (!chainsByLayer[layer]) {
                chainsByLayer[layer] = [];
            }

            //follow paths to find endless chains
            followLinks(
                pointGraph,
                function (chain: IChain, checkEndless: boolean) {
                    if (checkEndless) {
                        chain.endless = measure.isPointEqual(linkEndpoint(chain.links[0], true), linkEndpoint(chain.links[chain.links.length - 1], false), opts.pointMatchingDistance);
                    } else {
                        chain.endless = !!chain.endless;
                    }
                    chainsByLayer[layer].push(chain);
                },
                function (walkedPath: IWalkPath) {
                    loose.push(walkedPath);
                }
            );

            //sort to return largest chains first
            chainsByLayer[layer].sort((a: IChain, b: IChain) => { return b.pathLength - a.pathLength });

            if (opts.contain) {
                var containChainsOptions: IContainChainsOptions = isObject(opts.contain) ? opts.contain as IContainChainsOptions : { alternateDirection: false };
                var containedChains = getContainment(chainsByLayer[layer], containChainsOptions);
                chainsByLayer[layer] = containedChains;
            }

            if (callback) callback(chainsByLayer[layer], loose, layer, ignored[layer]);
        }

        if (beziers) {
            swapBezierPathsWithSeeds(beziers, false);
        }

        if (opts.byLayers) {
            return chainsByLayer;
        } else {
            return chainsByLayer[''];
        }
    }

    /**
     * @private
     */
    function getContainment(allChains: IChain[], opts: IContainChainsOptions) {

        var chainsAsModels = allChains.map(c => chain.toNewModel(c));
        var parents: IChain[] = [];

        //see which are inside of each other
        allChains.forEach(function (chainContext, i1) {
            if (!chainContext.endless) return;

            var wp = chainContext.links[0].walkedPath;
            var firstPath = path.clone(wp.pathContext, wp.offset);

            allChains.forEach(function (otherChain, i2) {

                if (chainContext === otherChain) return;
                if (!otherChain.endless) return;

                if (measure.isPointInsideModel(point.middle(firstPath), chainsAsModels[i2])) {

                    //since chains were sorted by pathLength, the smallest pathLength parent will be the parent if contained in multiple chains.
                    parents[i1] = otherChain;
                }
            });
        });

        //convert parent to children
        var result: IChain[] = [];
        allChains.forEach(function (chainContext, i) {
            var parent = parents[i];

            if (!parent) {
                result.push(chainContext);
            } else {
                if (!parent.contains) {
                    parent.contains = [];
                }
                parent.contains.push(chainContext);
            }
        });

        if (opts.alternateDirection) {

            function alternate(chains: IChain[], shouldBeClockwise: boolean) {
                chains.forEach(function (chainContext, i) {

                    var isClockwise = measure.isChainClockwise(chainContext);

                    if (isClockwise !== null) {
                        if (!isClockwise && shouldBeClockwise || isClockwise && !shouldBeClockwise) {
                            chain.reverse(chainContext);
                        }
                    }

                    if (chainContext.contains) {
                        alternate(chainContext.contains, !shouldBeClockwise);
                    }
                });
            }

            alternate(result, true);
        }

        return result;
    }

    /**
     * @private
     */
    function getBezierModels(modelContext: IModel): IWalkModel[] {

        var beziers: IWalkModel[] = [];

        function checkIsBezier(wm: IWalkModel) {
            if (wm.childModel.type === models.BezierCurve.typeName) {
                beziers.push(wm);
            }
        }

        var options: IWalkOptions = {
            beforeChildWalk: function (walkedModel: IWalkModel): boolean {
                checkIsBezier(walkedModel);
                return true;
            }
        };

        var rootModel: IWalkModel = {
            childId: '',
            childModel: modelContext,
            layer: modelContext.layer,
            offset: modelContext.origin,
            parentModel: null,
            route: [],
            routeKey: ''
        };

        checkIsBezier(rootModel);

        model.walk(modelContext, options);

        return beziers;
    }

    /**
     * @private
     */
    function swapBezierPathsWithSeeds(beziers: IWalkModel[], swap: boolean) {
        const tempKey = 'tempPaths';
        const tempLayerKey = 'tempLayer';

        beziers.forEach(wm => {
            var b = wm.childModel as models.BezierCurve;

            if (swap) {

                //set layer prior to looking for seeds by layer
                if (wm.layer != undefined && wm.layer !== '') {
                    b[tempLayerKey] = (b as IModel).layer;
                    (b as IModel).layer = wm.layer;
                }

                //use seeds as path, hide the arc paths from findChains()
                var bezierPartsByLayer = models.BezierCurve.getBezierSeeds(b, { byLayers: true });

                for (var layer in bezierPartsByLayer) {
                    var bezierSeeds = bezierPartsByLayer[layer];
                    if (bezierSeeds.length > 0) {
                        b[tempKey] = b.paths;

                        var newPaths: IPathMap = {};

                        bezierSeeds.forEach(function (seed, i) {
                            seed.layer = layer;
                            newPaths['seed_' + i] = seed;
                        });

                        b.paths = newPaths;
                    }
                }

            } else {
                //revert the above

                if (tempKey in b) {
                    b.paths = b[tempKey];
                    delete b[tempKey];
                }

                if (tempLayerKey in b) {
                    if (b[tempLayerKey] == undefined) {
                        delete (b as IModel).layer;
                    } else {
                        (b as IModel).layer = b[tempLayerKey];
                    }
                    delete b[tempLayerKey];
                }

            }
        });
    }
}

namespace MakerJs.chain {

    /**
     * Shift the links of an endless chain.
     * 
     * @param chainContext Chain to cycle through. Must be endless.
     * @param amount Optional number of links to shift. May be negative to cycle backwards.
     * @returns The chainContext for cascading.
     */
    export function cycle(chainContext: IChain, amount = 1) {
        if (!chainContext.endless) return;
        var n = Math.abs(amount);
        for (var i = 0; i < n; i++) {
            if (amount < 0) {
                //remove from beginning, add to end
                chainContext.links.push(chainContext.links.shift());
            } else {
                //remove from end, add to beginning
                chainContext.links.unshift(chainContext.links.pop());
            }
        }

        return chainContext;
    }

    /**
     * Reverse the links of a chain.
     * 
     * @param chainContext Chain to reverse.
     * @returns The chainContext for cascading.
     */
    export function reverse(chainContext: IChain) {
        chainContext.links.reverse();
        chainContext.links.forEach(link => link.reversed = !link.reversed);
        return chainContext;
    }

    /**
     * Set the beginning of an endless chain to a known routeKey of a path.
     * 
     * @param chainContext Chain to cycle through. Must be endless.
     * @param routeKey RouteKey of the desired path to start the chain with.
     * @returns The chainContext for cascading.
     */
    export function startAt(chainContext: IChain, routeKey: string) {
        if (!chainContext.endless) return;
        var index = -1;
        for (var i = 0; i < chainContext.links.length; i++) {
            if (chainContext.links[i].walkedPath.routeKey == routeKey) {
                index = i;
                break;
            }
        }
        if (index > 0) {
            cycle(chainContext, index);
        }

        return chainContext;
    }

    /**
     * Convert a chain to a new model, independent of any model from where the chain was found.
     * 
     * @param chainContext Chain to convert to a model.
     * @param detachFromOldModel Flag to remove the chain's paths from their current parent model. If false, each path will be cloned. If true, the original path will be re-parented into the resulting new model. Default is false.
     * @returns A new model containing paths from the chain.
     */
    export function toNewModel(chainContext: IChain, detachFromOldModel = false): IModel {
        var result: IModel = { paths: {} };

        for (var i = 0; i < chainContext.links.length; i++) {
            var wp = chainContext.links[i].walkedPath;

            if (wp.pathContext.type === pathType.BezierSeed) {

                if (detachFromOldModel) {
                    delete wp.modelContext.paths[wp.pathId];
                }

                if (!result.models) {
                    result.models = {};
                }

                var modelId = model.getSimilarModelId(result, wp.pathId);
                result.models[modelId] = model.moveRelative(new models.BezierCurve(wp.pathContext as IPathBezierSeed), wp.offset);

            } else {
                var newPath: IPath;
                if (detachFromOldModel) {
                    newPath = wp.pathContext;
                    delete wp.modelContext.paths[wp.pathId];
                } else {
                    newPath = path.clone(wp.pathContext);
                }

                var pathId = model.getSimilarPathId(result, wp.pathId);
                result.paths[pathId] = path.moveRelative(newPath, wp.offset);
            }
        }

        return result;
    }

    /**
     * @private
     */
    function removeDuplicateEnds(endless: boolean, points: IPoint[]) {
        if (!endless || points.length < 2) return;
        if (measure.isPointEqual(points[0], points[points.length - 1], .00001)) {
            points.pop();
        }
    }

    /**
     * Get points along a chain of paths.
     * 
     * @param chainContext Chain of paths to get points from.
     * @param distance Numeric distance along the chain between points, or numeric array of distances along the chain between each point.
     * @param maxPoints Maximum number of points to retrieve.
     * @returns Array of points which are on the chain spread at a uniform interval.
     */
    export function toPoints(chainContext: IChain, distanceOrDistances: number | number[], maxPoints?: number): IPoint[] {
        var result: IPoint[] = [];
        var di = 0;
        var t = 0;
        var distanceArray: number[];

        if (Array.isArray(distanceOrDistances)) {
            distanceArray = distanceOrDistances as number[];
        }

        for (var i = 0; i < chainContext.links.length; i++) {
            var link = chainContext.links[i];
            var wp = link.walkedPath;
            var len = link.pathLength;

            while (round(len - t) > 0) {
                var r = t / len;
                if (link.reversed) {
                    r = 1 - r;
                }

                result.push(point.add(point.middle(wp.pathContext, r), wp.offset));

                if (maxPoints && result.length >= maxPoints) return result;

                var distance: number;
                if (distanceArray) {
                    distance = distanceArray[di];
                    di++;

                    if (di > distanceArray.length) {
                        return result;
                    }

                } else {
                    distance = distanceOrDistances as number;
                }

                t += distance;
            }

            t -= len;
        }

        removeDuplicateEnds(chainContext.endless, result);
        return result;
    }

    /**
     * Get key points (a minimal a number of points) along a chain of paths.
     * 
     * @param chainContext Chain of paths to get points from.
     * @param maxArcFacet The maximum length between points on an arc or circle.
     * @returns Array of points which are on the chain.
     */
    export function toKeyPoints(chainContext: IChain, maxArcFacet?: number): IPoint[] {
        var result: IPoint[] = [];

        for (var i = 0; i < chainContext.links.length; i++) {
            var link = chainContext.links[i];
            var wp = link.walkedPath;
            var keyPoints = path.toKeyPoints(wp.pathContext, maxArcFacet);
            if (keyPoints.length > 0) {
                if (link.reversed) {
                    keyPoints.reverse();
                }
                if (i > 0) {
                    keyPoints.shift();
                }

                var offsetPathPoints = keyPoints.map(p => point.add(p, wp.offset));
                result.push.apply(result, offsetPathPoints);
            }
        }

        removeDuplicateEnds(chainContext.endless, result);
        return result;
    }

}
