namespace MakerJs.model {

    /**
     * @private
     */
    interface IConnectionsMap {
        [layer: string]: Collector<IPoint, IChainLink>;
    }

    /**
     * @private
     */
    interface IChainsMap {
        [layer: string]: IChain[];
    }

    /**
     * @private
     */
    interface IChainFound {
        (chain: IChain): void;
    }

    /**
     * @private
     */
    interface IChainNotFound {
        (path: IWalkPath): void;
    }

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
    function followLinks(connections: Collector<IPoint, IChainLink>, chainFound: IChainFound, chainNotFound?: IChainNotFound) {

        function followLink(currLink: IChainLink, chain: IChain, firstLink: IChainLink) {

            while (currLink) {

                chain.links.push(currLink);
                chain.pathLength += currLink.pathLength;

                var next = currLink.reversed ? 0 : 1;
                var nextPoint = currLink.endPoints[next];

                var items = connections.findCollection(nextPoint);
                if (!items || items.length === 0) {
                    break;
                }

                var nextLink = getOpposedLink(items, currLink.walkedPath.pathContext);

                //remove the first 2 items, which should be currlink and nextlink
                items.splice(0, 2);

                if (!nextLink) {
                    break;
                }

                if (nextLink.walkedPath.pathContext === firstLink.walkedPath.pathContext) {
                    chain.endless = true;
                    break;
                }

                currLink = nextLink;
            }

        }

        for (var i = 0; i < connections.collections.length; i++) {

            var linkedPaths = connections.collections[i].items;

            if (linkedPaths && linkedPaths.length > 0) {

                var chain: IChain = {
                    links: [],
                    pathLength: 0
                };

                followLink(linkedPaths[0], chain, linkedPaths[0]);

                if (chain.endless) {
                    chainFound(chain);
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
                        chainFound(chain);
                    } else {
                        chainNotFound(chain.links[0].walkedPath);
                    }
                }

                //if there were more than 2 paths on this point, follow those too.
                if (linkedPaths.length > 0) {
                    i--;
                }
            }
        }
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
     * Find paths that have common endpoints and form chains.
     * 
     * @param modelContext The model to search for chains.
     * @param options Optional options object.
     */
    export function findChains(modelContext: IModel, callback: IChainCallback, options?: IFindChainsOptions) {

        var opts: IFindChainsOptions = {
            pointMatchingDistance: .005
        };
        extendObject(opts, options);

        function comparePoint(pointA: IPoint, pointB: IPoint): boolean {
            var distance = measure.pointDistance(pointA, pointB);
            return distance <= opts.pointMatchingDistance;
        }

        var connectionMap: IConnectionsMap = {};
        var chainsByLayer: IChainsMap = {};

        var walkOptions: IWalkOptions = {
            onPath: function (walkedPath: IWalkPath) {

                var layer = opts.byLayers ? walkedPath.layer : '';
                if (!connectionMap[layer]) {
                    connectionMap[layer] = new Collector<IPoint, IChainLink>(comparePoint);
                }

                var connections = connectionMap[layer];
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

                    //gather both endpoints from all non-circle segments
                    var endPoints = point.fromPathEnds(walkedPath.pathContext, walkedPath.offset);

                    //don't add lines which are shorter than the tolerance
                    if (pathLength < opts.pointMatchingDistance) {
                        return;
                    }

                    for (var i = 0; i < 2; i++) {
                        var link: IChainLink = {
                            walkedPath: walkedPath,
                            endPoints: endPoints,
                            reversed: i != 0,
                            pathLength: pathLength
                        };

                        connections.addItemToCollection(endPoints[i], link);
                    }
                }
            }
        };

        if (opts.shallow) {
            walkOptions.beforeChildWalk = function () { return false; };
        }

        walk(modelContext, walkOptions);

        for (var layer in connectionMap) {
            var connections = connectionMap[layer];
            var loose: IWalkPath[] = [];

            if (!chainsByLayer[layer]) {
                chainsByLayer[layer] = [];
            }

            //follow paths to find loops
            followLinks(
                connections,
                function (chain: IChain) {
                    chainsByLayer[layer].push(chain);
                },
                function (walkedPath: IWalkPath) {
                    loose.push(walkedPath);
                }
            );

            //sort to return largest chains first
            chainsByLayer[layer].sort((a: IChain, b: IChain) => { return b.pathLength - a.pathLength });

            callback(chainsByLayer[layer], loose, layer);
        }

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
     * @param distance Distance along the chain between points.
     * @param maxPoints Maximum number of points to retrieve.
     * @returns Array of points which are on the chain spread at a uniform interval.
     */
    export function toPoints(chainContext: IChain, distance: number, maxPoints?: number): IPoint[] {
        var result: IPoint[] = [];

        var t = 0;

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
