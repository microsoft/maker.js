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
                    links: []
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
                            endPoints: null
                        }],
                        endless: true
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
                    if (walkedPath.pathContext.type == pathType.Line) {
                        var distance = measure.pointDistance(endPoints[0], endPoints[1]);
                        if (distance < opts.pointMatchingDistance) {
                            return;
                        }
                    }

                    for (var i = 0; i < 2; i++) {
                        var link: IChainLink = {
                            walkedPath: walkedPath,
                            endPoints: endPoints,
                            reversed: i != 0
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

            callback(chainsByLayer[layer], loose, layer);
        }

    }

}
