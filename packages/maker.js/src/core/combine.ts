namespace MakerJs.model {

    /**
     * @private
     */
    function getNonZeroSegments(pathToSegment: IPath, breakPoint: IPoint): IPath[] {
        var segment1 = cloneObject(pathToSegment);

        if (!segment1) return null;

        var segment2 = path.breakAtPoint(segment1, breakPoint);

        if (segment2) {
            var segments: IPath[] = [segment1, segment2];
            for (var i = 2; i--;) {
                if (round(measure.pathLength(segments[i]), .0001) == 0) {
                    return null;
                }
            }
            return segments;

        } else if (pathToSegment.type == pathType.Circle) {
            return [segment1];
        }

        return null;
    }

    /**
     * @private
     */
    function getPointsOnPath(points: IPoint[], onPath: IPath, popOptions: IIsPointOnPathOptions): IPoint[] {
        const endpointsOnPath: IPoint[] = [];
        points.forEach(p => {
            if (measure.isPointOnPath(p, onPath, .00001, null, popOptions)) {
                endpointsOnPath.push(p);
            }
        });
        return endpointsOnPath;
    }

    /**
     * @private
     */
    function breakAlongForeignPath(crossedPath: ICrossedPath, overlappedSegments: ICrossedPathSegment[], foreignWalkedPath: IWalkPath) {
        var foreignPath = foreignWalkedPath.pathContext;
        var segments = crossedPath.segments;

        if (measure.isPathEqual(segments[0].absolutePath, foreignPath, .0001, null, foreignWalkedPath.offset)) {
            segments[0].overlapped = true;
            segments[0].duplicate = true;

            overlappedSegments.push(segments[0]);
            return;
        }

        //this will cache the slope, to keep from being recalculated for each segment
        var popOptions: IIsPointOnPathOptions = {};

        var options: IPathIntersectionOptions = { path1Offset: crossedPath.offset, path2Offset: foreignWalkedPath.offset };
        var foreignIntersection = path.intersection(crossedPath.pathContext, foreignPath, options);
        var intersectionPoints = foreignIntersection ? foreignIntersection.intersectionPoints : null;
        var foreignPathEndPoints = point.fromPathEnds(foreignPath, foreignWalkedPath.offset) || [];

        for (var i = 0; i < segments.length; i++) {
            var pointsOfInterest = intersectionPoints ? foreignPathEndPoints.concat(intersectionPoints) : foreignPathEndPoints;
            var pointsToCheck = getPointsOnPath(pointsOfInterest, segments[i].absolutePath, popOptions);

            if (options.out_AreOverlapped) {
                segments[i].overlapped = true;
                overlappedSegments.push(segments[i]);
            }

            if (pointsToCheck.length > 0) {

                //break the path which intersected, and add the shard to the end of the array so it can also be checked in this loop for further sharding.
                var subSegments: IPath[] = null;
                var p = 0;
                while (!subSegments && p < pointsToCheck.length) {
                    subSegments = getNonZeroSegments(segments[i].absolutePath, pointsToCheck[p]);
                    p++;
                }

                if (subSegments) {
                    crossedPath.broken = true;

                    segments[i].absolutePath = subSegments[0];

                    if (subSegments[1]) {
                        var newSegment: ICrossedPathSegment = {
                            absolutePath: subSegments[1],
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
    interface ICrossedPathSegment {
        isInside?: boolean;
        uniqueForeignIntersectionPoints: IPoint[];
        absolutePath: IPath;
        addedPath?: IPath;
        pathId: string;
        overlapped: boolean;
        duplicate?: boolean;
        deleted?: boolean;
        reason?: string;
        shouldAdd?: boolean;
    }

    /**
     * @private
     */
    interface ICrossedPath extends IWalkPath {
        absolutePath: IPath;
        sourceIndex: number;
        broken: boolean;
        segments: ICrossedPathSegment[];
        inEndlessChain: boolean;
    }

    /**
     * @private
     */
    function addOrDeleteSegments(crossedPath: ICrossedPath, deleted: (segment: ICrossedPathSegment) => void) {

        function addSegment(modelContext: IModel, pathIdBase: string, segment: ICrossedPathSegment) {
            var id = getSimilarPathId(modelContext, pathIdBase);

            segment.addedPath = cloneObject(crossedPath.pathContext);

            //circles may have become arcs
            segment.addedPath.type = segment.absolutePath.type;

            path.copyProps(segment.absolutePath, segment.addedPath);
            path.moveRelative(segment.addedPath, crossedPath.offset, true);

            modelContext.paths[id] = segment.addedPath;
        }

        function checkAddSegment(modelContext: IModel, pathIdBase: string, segment: ICrossedPathSegment) {
            if (segment.shouldAdd) {
                addSegment(modelContext, pathIdBase, segment);
            } else {
                deleted(segment);
            }
        }

        //delete the original, its segments will be added
        delete crossedPath.modelContext.paths[crossedPath.pathId];

        for (var i = 0; i < crossedPath.segments.length; i++) {
            checkAddSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
        }
    }

    /**
     * Combine 2 models. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @param includeAInsideB Flag to include paths from modelA which are inside of modelB.
     * @param includeAOutsideB Flag to include paths from modelA which are outside of modelB.
     * @param includeBInsideA Flag to include paths from modelB which are inside of modelA.
     * @param includeBOutsideA Flag to include paths from modelB which are outside of modelA.
     * @param options Optional ICombineOptions object.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    export function combine(modelA: IModel, modelB: IModel, includeAInsideB: boolean = false, includeAOutsideB: boolean = true, includeBInsideA: boolean = false, includeBOutsideA: boolean = true, options?: ICombineOptions) {

        var opts: ICombineOptions = {
            trimDeadEnds: false,
            pointMatchingDistance: .005,
            out_deleted: [{ paths: {} }, { paths: {} }]
        };
        extendObject(opts, options);

        const { crossedPaths, insideChecks } = sweep([modelA, modelB], {
            flags: sourceIndex => {
                if (sourceIndex === 0) {
                    return {
                        inside: includeAInsideB,
                        outside: includeAOutsideB
                    }
                } else {
                    return {
                        inside: includeBInsideA,
                        outside: includeBOutsideA
                    }
                }
            },
            pointMatchingDistance: opts.pointMatchingDistance
        });

        var result: IModel = { models: { a: modelA, b: modelB } };

        opts.out_deleted.push(insideChecks);

        crossedPaths.forEach(cp => addOrDeleteSegments(
            cp,
            deletedSegment => {
                addPath(opts.out_deleted[cp.sourceIndex], deletedSegment.absolutePath, deletedSegment.pathId);
                const d = deletedSegment.absolutePath as IPathRemoved;
                d.reason = deletedSegment.reason;
                d.routeKey = cp.routeKey
            })
        );

        if (opts.trimDeadEnds) {
            removeDeadEnds(result, opts.pointMatchingDistance);
        }

        //pass options back to caller
        extendObject(options, opts);

        return result;
    }

    /**
     * Combine 2 models, resulting in a intersection. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    export function combineIntersection(modelA: IModel, modelB: IModel) {
        return combine(modelA, modelB, true, false, true, false);
    }

    /**
     * Combine 2 models, resulting in a subtraction of B from A. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    export function combineSubtraction(modelA: IModel, modelB: IModel) {
        return combine(modelA, modelB, false, true, true, false);
    }

    /**
     * Combine 2 models, resulting in a union. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    export function combineUnion(modelA: IModel, modelB: IModel) {
        return combine(modelA, modelB, false, true, false, true);
    }

    /**
     * Combine an array of models or chains, resulting in a union. Each model will be modified accordingly.
     *
     * @param source Array of IModel or IChain, or IModelMap.
     * @param options Optional ICombineOptions object.
     */
    export function combineArray(source: (IChain | IModel)[] | IModelMap, options?: ICombineArrayOptions) {

        const sourceArray = Array.isArray(source) ? source : [];

        if (!Array.isArray(source)) {
            for (let modelId in source) {
                sourceArray.push(source[modelId]);
            }
        }

        const opts: ICombineArrayOptions = {
            pointMatchingDistance: .005,
            out_deleted: sourceArray.map(s => { return { paths: {} }; })
        };
        extendObject(opts, options);

        const { crossedPaths, insideChecks } = sweep(sourceArray, {
            flags: sourceIndex => {
                return {
                    inside: false,
                    outside: true
                };
            },
            pointMatchingDistance: opts.pointMatchingDistance
        });

        opts.out_deleted.push(insideChecks);

        crossedPaths.forEach(cp => addOrDeleteSegments(
            cp,
            deletedSegment => {
                addPath(opts.out_deleted[cp.sourceIndex], deletedSegment.absolutePath, deletedSegment.pathId);
                const d = deletedSegment.absolutePath as IPathRemoved;
                d.reason = deletedSegment.reason;
                d.routeKey = cp.routeKey
            })
        );

        //pass options back to caller
        extendObject(options, opts);
    }

    /**
     * @private
     */
    interface IDip extends IPathLine {
        for?: string;
        crosses?: string[];
    }

    /**
     * @private
     */
    interface IFlags {
        inside: boolean;
        outside: boolean;
    }

    /**
     * @private
     */
    type IGetFlags = IFlags | ((sourceIndex: number) => IFlags);

    /**
     * @private
     */
    interface IBusOptions extends IPointMatchOptions {
        flags: IGetFlags;
    }

    /**
     * @private
     */
    enum PassengerAction {
        enter, midPoint, exit
    }

    /**
     * @private
     */
    interface IPassengerEvent {
        x: number;
        y?: number;
        event: PassengerAction;
        passengerId: number;
    }

    /**
     * @private
     */
    interface IPassenger<T> {
        passengerId: number;
        pathExtents: IMeasure;
        ticketId: number;
        item: T;
    }

    /**
     * @private
     */
    interface ISource {
        sourceIndex: number;
        chain: IChain;
    }

    /**
     * @private
     */
    interface IFineSegment {
        parent: ICrossedPath;
        segment: ICrossedPathSegment;
        segmentIndex: number;
        duplicateGroup?: number;
    }

    /**
     * @private
     */
    function sweep(sourceArray: (IChain | IModel)[], options: IBusOptions) {
        const crossedPaths = gatherPathsFromSource(sourceArray);
        const deadEndFinder = new DeadEndFinder<IFineSegment>();

        const coarseBus = new CoarseBus(options);
        const fineBus = new FineBus(options);

        crossedPaths.forEach(cp => coarseBus.itinerary.listPassenger(cp.absolutePath, cp));

        coarseBus.handleDropOff = (dropOff: IPassenger<ICrossedPath>) => {
            const { itinerary } = fineBus;
            //insert segments into new itinerary
            const crossedPath = dropOff.item;
            crossedPath.segments.forEach((segment, segmentIndex) => {
                const midPoint = point.middle(segment.absolutePath);
                const passengerId = itinerary.listPassenger(segment.absolutePath, { parent: dropOff.item, segment, segmentIndex });
                itinerary.events.push({
                    event: PassengerAction.midPoint,
                    x: midPoint[0],
                    y: midPoint[1],
                    passengerId
                });
            });
        };

        coarseBus.load();
        fineBus.load();

        fineBus.duplicateGroups.forEach(group => {
            const item = group[0];
            if (item.parent.inEndlessChain) {
                const endPoints = point.fromPathEnds(item.segment.absolutePath);
                item.segment.reason = 'duplicate candidate';
                item.segment.shouldAdd = false;
                deadEndFinder.loadItem(endPoints, item);
            }
            group.slice(1).forEach(d => {
                d.segment.deleted = true;
                d.segment.reason = 'duplicate';
            });
        });

        let flags: IFlags;
        if (typeof options.flags === 'object') {
            flags = options.flags;
        }

        fineBus.itinerary.passengers.forEach(p => {
            const { segment } = p.item;
            if (segment.deleted) return;

            if (typeof options.flags === 'function') {
                flags = options.flags(p.item.parent.sourceIndex);
            }
            //determine delete based on inside/outside
            if (!(segment.isInside && flags.inside || !segment.isInside && flags.outside)) {
                segment.deleted = true;
                segment.reason = 'segment is ' + (segment.isInside ? 'inside' : 'outside');
            }
            if (!segment.deleted && p.item.parent.inEndlessChain && p.item.duplicateGroup === undefined) {
                //insert into deadEndFinder
                const endPoints = point.fromPathEnds(p.item.segment.absolutePath);
                p.item.segment.shouldAdd = true;
                deadEndFinder.loadItem(endPoints, p.item);
            }
        });

        deadEndFinder.findValidDeadEnds(options.pointMatchingDistance,
            item => item.segment.shouldAdd,
            valuePairs => {
                const duplicate = valuePairs.filter(vp => vp.value.segment.duplicate && !vp.value.segment.shouldAdd)[0];
                if (duplicate) {
                    duplicate.value.segment.shouldAdd = true;
                    return duplicate;
                }
                return null;
            }
        );

        return { crossedPaths, insideChecks: fineBus.model };
    }

    /**
     * @private
     */
    class Itinerary<T> {
        passengers: IPassenger<T>[];
        events: IPassengerEvent[];

        constructor() {
            this.passengers = [];
            this.events = [];
        }

        listPassenger(pz: IPath, item: T) {
            const { events, passengers } = this;
            const p: IPassenger<T> = {
                item,
                passengerId: passengers.length,
                pathExtents: measure.pathExtents(pz),
                ticketId: null
            };
            const enterEvent: IPassengerEvent = { event: PassengerAction.enter, passengerId: p.passengerId, x: round(p.pathExtents.low[0]) };
            events.push(enterEvent);
            const exitEvent: IPassengerEvent = { event: PassengerAction.exit, passengerId: p.passengerId, x: round(p.pathExtents.high[0]) };
            events.push(exitEvent);
            passengers.push(p);
            return p.passengerId;
        }

        close() {
            this.events.sort((a, b) => a.x - b.x);
        }
    }

    /**
     * @private
     */
    class Bus<T> {
        public riders: IPassenger<T>[];
        public lastX: number;
        public dropOffs: IPassenger<T>[];
        public itinerary: Itinerary<T>;
        public handleDropOff: (dropOff: IPassenger<T>) => void;

        constructor(public options: IBusOptions) {
            this.riders = [];
            this.lastX = null;
            this.dropOffs = [];
            this.itinerary = new Itinerary<T>();
        }

        public onBoard(passenger: IPassenger<T>) {
            const { riders } = this;
            passenger.ticketId = riders.length;
            riders.push(passenger);
        }

        public passengerEvent(ev: IPassengerEvent) {
            //subclass may override
        }

        public shuttle() {
            //subclass may override
        }

        public load() {
            const { dropOffs, itinerary } = this;
            itinerary.close();
            let i = 0;
            while (i < itinerary.events.length) {
                let ev = itinerary.events[i];
                if (ev.x !== this.lastX && i) {
                    this.shuttle();
                }
                if (ev.event === PassengerAction.enter) {
                    this.onBoard(itinerary.passengers[ev.passengerId]);
                } else if (ev.event === PassengerAction.exit) {
                    dropOffs.push(itinerary.passengers[ev.passengerId]);
                } else {
                    this.passengerEvent(ev);
                }
                this.lastX = itinerary.events[i].x;
                i++;
            }
            this.shuttle();
        }

        public unload() {
            this.dropOffs.forEach(passenger => {
                if (this.handleDropOff) this.handleDropOff(passenger);
                delete this.riders[passenger.ticketId];
            });
            this.dropOffs.length = 0;
        }
    }

    /**
     * @private
     */
    class CoarseBus extends Bus<ICrossedPath> {
        public overlappedSegments: ICrossedPathSegment[];

        constructor(options: IBusOptions) {
            super(options);
            this.overlappedSegments = [];
        }

        public onBoard(passenger: IPassenger<ICrossedPath>) {
            super.onBoard(passenger);
            this.riders.forEach(op => {
                if (!op) return;
                if (op === passenger) return;
                //see if passenger overlaps
                if (measure.isBetween(passenger.pathExtents.high[1], op.pathExtents.high[1], op.pathExtents.low[1], false) ||
                    measure.isBetween(op.pathExtents.high[1], passenger.pathExtents.high[1], passenger.pathExtents.low[1], false)
                ) {
                    breakAlongForeignPath(passenger.item, this.overlappedSegments, op.item);
                    breakAlongForeignPath(op.item, this.overlappedSegments, passenger.item);
                }
            });
        }

        public shuttle() {
            this.unload();
        }
    }

    /**
     * @private
     */
    class FineBus extends Bus<IFineSegment> {
        public midpointChecks: { ev: IPassengerEvent, passenger: IPassenger<IFineSegment> }[];
        public model: IModel;
        public midPointCount: number;
        public duplicateGroups: IFineSegment[][];

        constructor(options: IBusOptions) {
            super(options);
            this.midpointChecks = [];
            this.model = { paths: {} };
            this.midPointCount = 0;
            this.duplicateGroups = [];
        }

        public passengerEvent(ev: IPassengerEvent) {
            if (ev.event === PassengerAction.midPoint) {
                this.midpointChecks.push({ ev, passenger: this.itinerary.passengers[ev.passengerId] });
            }
        }

        public onBoard(passenger: IPassenger<IFineSegment>) {
            super.onBoard(passenger);
            for (let i = 0; i < this.riders.length; i++) {
                let op = this.riders[i];
                if (!op) continue;
                if (op === passenger) continue;
                //see if passenger is a duplicate
                if (measure.isPathEqual(passenger.item.segment.absolutePath, op.item.segment.absolutePath, this.options.pointMatchingDistance)) {
                    this.markDuplicates(passenger.item, op.item);
                    break;
                }
            }
        }

        public shuttle() {
            this.midpointChecks.forEach(mp => {
                const { ev, passenger } = mp;
                const { item } = passenger;

                if (item.duplicateGroup !== undefined && this.duplicateGroups[item.duplicateGroup][0] !== item) {
                    //don't need to check for duplicates
                    return;
                }

                const { segment } = item;
                const midPoint = [ev.x, ev.y];
                let dip: IDip

                //const s = [];
                const ridersBySource = this.getRidersBySource(item.parent.sourceIndex, ev.y);
                for (let sourceIndex in ridersBySource) {
                    let ridersAboveBelow = ridersBySource[sourceIndex];
                    let intersectionPoints: IPoint[] = [];
                    const above = ridersAboveBelow.above < ridersAboveBelow.below;
                    const riders = above ? ridersAboveBelow.above : ridersAboveBelow.below;
                    riders.forEach(rider => {

                        //dont check duplicates
                        if (item.duplicateGroup !== undefined && rider.item.duplicateGroup === item.duplicateGroup) return;

                        //only check within closed geometries
                        if (!rider.item.parent.inEndlessChain) return;

                        //lazy create a line
                        if (!dip) {
                            dip = new paths.Line(midPoint, [ev.x, ev.y]);
                            dip.crosses = [];
                            dip.for = segment.pathId + '_' + item.segmentIndex;
                        }

                        //ensure end y position below this rider
                        if (above) {
                            dip.end[1] = Math.max(dip.end[1], rider.pathExtents.high[1] + 1);
                        } else {
                            dip.end[1] = Math.min(dip.end[1], rider.pathExtents.low[1] - 1);
                        }

                        //see if passenger intersects with line, count the intersections
                        const options: IPathIntersectionOptions = {};
                        const int = path.intersection(dip, rider.item.segment.absolutePath, options);
                        if (int && options.out_AreCrossing) {
                            intersectionPoints.push.apply(intersectionPoints, int.intersectionPoints);
                            dip.crosses.push(rider.item.segment.pathId + ' ' + JSON.stringify(intersectionPoints));
                        }
                    });

                    const unique: IPoint[] = [];
                    intersectionPoints.forEach(p => {
                        const distinct = measure.isPointDistinct(p, unique, this.options.pointMatchingDistance);
                        if (distinct) unique.push(p);
                    });

                    //if number of intersections is an odd number, it's inside this source.
                    if (unique.length % 2 == 1) {
                        segment.isInside = true;

                        //only needs to be inside of one source, exit for all sources.
                        break;
                    }
                }
                if (dip) {
                    this.model.paths[this.midPointCount] = dip;
                    this.midPointCount++;
                }
            });
            this.midpointChecks.length = 0;
            this.unload();
        }

        private markDuplicates(a: IFineSegment, b: IFineSegment) {
            if (b.duplicateGroup !== undefined) {
                a.duplicateGroup = b.duplicateGroup;
                this.duplicateGroups[b.duplicateGroup].push(a);
            } else {
                const duplicateGroup: IFineSegment[] = [b, a];
                a.duplicateGroup = b.duplicateGroup = this.duplicateGroups.length;
                this.duplicateGroups.push(duplicateGroup);
            }
            a.segment.duplicate = b.segment.duplicate = true;
        }

        public getRidersBySource(currentSourceIndex: number, y: number) {
            const ridersBySource: { [sourceIndex: number]: { above: IPassenger<IFineSegment>[], below: IPassenger<IFineSegment>[] } } = {};
            this.riders.forEach(rider => {
                if (!rider) return;
                const { sourceIndex } = rider.item.parent;
                //do not check within same source
                if (sourceIndex === currentSourceIndex) return;

                if (!ridersBySource[sourceIndex]) {
                    ridersBySource[sourceIndex] = { above: [], below: [] };
                }

                //see if passenger's bottom extent is at or below y
                if (rider.pathExtents.low[1] <= y) {
                    ridersBySource[sourceIndex].below.push(rider);
                }
                if (rider.pathExtents.high[1] >= y) {
                    ridersBySource[sourceIndex].above.push(rider);
                }
            });
            return ridersBySource;
        }
    }

    /**
     * @private
     */
    function gatherPathsFromSource(sourceArray: (IChain | IModel)[]) {
        const crossedPaths: ICrossedPath[] = [];

        const add = (wp: IWalkPath, sourceIndex: number, inEndlessChain: boolean) => {
            const absolutePath = path.clone(wp.pathContext, wp.offset);
            //clone this path and make it the first segment
            const segment: ICrossedPathSegment = {
                absolutePath,
                pathId: wp.pathId,
                overlapped: false,
                uniqueForeignIntersectionPoints: []
            };
            const crossedPath: ICrossedPath = {
                ...wp,
                absolutePath,
                sourceIndex,
                broken: false,
                segments: [segment],
                inEndlessChain
            };
            crossedPaths.push(crossedPath);
        };

        //collect chains
        const sourceChains: ISource[] = [];
        sourceArray.forEach((source, sourceIndex) => {
            if (isChain(source)) {
                const c = source as IChain;
                sourceChains.push({ sourceIndex, chain: c });
            } else {
                //find chains
                const m = source as IModel;
                let chains: IChain[];
                const cb: IChainCallback = (cs, loose, layer) => {
                    chains = cs;
                    loose.forEach(wp => {
                        add(wp, sourceIndex, false);
                    });
                };
                model.findChains(m, cb) as IChain[];
                if (chains) {
                    const scs = chains.map(c => {
                        const source: ISource = {
                            chain: c,
                            sourceIndex
                        };
                        return source;
                    });
                    sourceChains.push.apply(sourceChains, scs);
                }
            }
        });

        //collect all links from all chains
        const getCrossedPathsFromChains = (c: IChain, sourceIndex: number) => {
            c.links.forEach(link => {
                const wp = link.walkedPath;
                add(wp, sourceIndex, c.endless);
            });
        }
        sourceChains.forEach(sc => {
            getCrossedPathsFromChains(sc.chain, sc.sourceIndex);
        });
        return crossedPaths;
    }

}
