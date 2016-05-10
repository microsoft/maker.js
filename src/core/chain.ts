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
    function getOpposedLink(linkedPaths: IChainLink[], pathContext: IPath): IChainLink {
        if (linkedPaths[0].walkedPath.pathContext === pathContext) {
            return linkedPaths[1];
        }
        return linkedPaths[0];
    }

    /**
     * @private
     */
    function followLinks(connections: Collector<IPoint, IChainLink>, layer: string, handler: IChainFound, chainNotFound?: IChainNotFound) {

        function followLink(currLink: IChainLink, chain: IChain, firstLink: IChainLink, reverse: boolean) {

            while (currLink) {

                if (reverse) {
                    chain.links.unshift(currLink);
                } else {
                    chain.links.push(currLink);
                }

                var items = connections.findCollection(currLink.nextConnection);

                if (!items || items.length === 0) {

                    items = connections.findCollection(currLink.prevConnection);

                    if (!items || items.length === 0) {
                        break;
                    }
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

                followLink(linkedPaths[0], chain, linkedPaths[0], false);

                if (chain.endless) {
                    if (handler) {
                        handler(chain, layer);
                    }
                } else {
                    //need to go in reverse

                    //use end as the beginning
                    var lastLink = chain.links[chain.links.length - 1];

                    //remove the first link, it will be added in the call
                    followLink(chain.links.shift(), chain, lastLink, true);

                    if (chain.links.length > 1) {
                        if (handler) {
                            handler(chain, layer);
                        }
                    } else {
                        if (chainNotFound) {
                            chainNotFound(chain.links[0].walkedPath, layer);
                        }
                    }
                }
            }
        }
    }

    /**
     * Find paths that have common endpoints and form chains.
     * 
     * @param modelContext The model to search for chains.
     * @param options Optional options object.
     * @returns A list of chains.
     */
    export function findChains(modelContext: IModel, chainFound: IChainFound, chainNotFound?: IChainNotFound, options?: IFindChainsOptions) {

        var opts: IFindChainsOptions = {
            pointMatchingDistance: .005,
            byLayers: false
        };
        extendObject(opts, options);

        function comparePoint(pointA: IPoint, pointB: IPoint): boolean {
            var distance = measure.pointDistance(pointA, pointB);
            return distance <= opts.pointMatchingDistance;
        }

        var connectionMap: IConnectionsMap = {};
        var circles: IChainsMap = {};

        var walkOptions: IWalkOptions = {
            onPath: function (walkedPath: IWalkPath) {

                var layer = opts.byLayers ? walkedPath.layer : '';
                if (!connectionMap[layer]) {
                    connectionMap[layer] = new Collector<IPoint, IChainLink>(comparePoint);
                }

                var connections = connectionMap[layer];

                //circles are loops by nature
                if (walkedPath.pathContext.type == pathType.Circle || (walkedPath.pathContext.type == pathType.Arc && angle.ofArcSpan(walkedPath.pathContext as IPathArc) == 360)) {

                    var chain: IChain = {
                        links: [{ walkedPath: walkedPath, nextConnection: null, prevConnection: null, reversed: null }],
                        endless: true
                    };

                    //store circles so that layers fire grouped
                    if (!circles[layer]) {
                        circles[layer] = [];
                    }
                    circles[layer].push(chain);

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

                    for (var i = 2; i--;) {
                        var link: IChainLink = {
                            walkedPath: walkedPath,
                            nextConnection: endPoints[1 - i],
                            prevConnection: endPoints[i],
                            reversed: i != 0
                        };

                        connections.addItemToCollection(endPoints[i], link);
                    }
                }
            }
        };

        walk(modelContext, walkOptions);

        for (var layer in connectionMap) {

            var connections = connectionMap[layer];

            //follow paths to find loops
            followLinks(connections, layer, chainFound, chainNotFound);

            //fire off circles with the rest of the layer
            if (circles[layer]) {
                circles[layer].map(function (circleChain: IChain) {
                    if (chainFound) {
                        chainFound(circleChain, layer);
                    }
                });
            }

        }

    }

}
