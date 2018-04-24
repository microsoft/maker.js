namespace MakerJs.model {

    /**
     * @private
     */
    const BinaryHeap = require('@tyriar/binary-heap') as typeof BinaryHeapClass;

    /**
     * @private
     */
    function getNonZeroSegments(pathToSegment: IPath, breakPoint: IPoint): IPath[] {
        const segment1 = cloneObject(pathToSegment);

        if (!segment1) return null;

        const segment2 = path.breakAtPoint(segment1, breakPoint);

        if (segment2) {
            const segments: IPath[] = [segment1, segment2];
            for (let i = 2; i--;) {
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
    function breakAlongForeignPath(qpath: IQueuedSweepPath, foreignWalkedPath: IWalkPath, overlappedSegments: IQueuedSweepPathSegment[]) {
        const foreignPath = foreignWalkedPath.pathContext;
        const segments = qpath.segments;

        function trackOverlap(segment: IQueuedSweepPathSegment) {
            if (!segment.overlapTracked) {
                overlappedSegments.push(segment);
                segment.overlapTracked = true;
            }
        }

        if (measure.isPathEqual(segments[0].path, foreignPath, .0001, qpath.offset, foreignWalkedPath.offset)) {
            trackOverlap(segments[0]);
            return;
        }

        let foreignPathEndPoints: IPoint[];

        for (let i = 0; i < segments.length; i++) {
            let pointsToCheck: IPoint[];
            let options: IPathIntersectionOptions = { path1Offset: qpath.offset, path2Offset: foreignWalkedPath.offset };
            let foreignIntersection = path.intersection(segments[i].path, foreignPath, options);

            if (foreignIntersection) {
                pointsToCheck = foreignIntersection.intersectionPoints;

            } else if (options.out_AreOverlapped) {
                trackOverlap(segments[i]);

                if (!foreignPathEndPoints) {
                    //make sure endpoints are in absolute coords
                    foreignPathEndPoints = point.fromPathEnds(foreignPath, foreignWalkedPath.offset);
                }

                pointsToCheck = foreignPathEndPoints;
            }

            if (pointsToCheck) {

                //break the path which intersected, and add the shard to the end of the array so it can also be checked in this loop for further sharding.
                let subSegments: IPath[] = null;
                let p = 0;
                while (!subSegments && p < pointsToCheck.length) {
                    //cast absolute points to path relative space
                    subSegments = getNonZeroSegments(segments[i].path, point.subtract(pointsToCheck[p], qpath.offset));
                    p++;
                }

                if (subSegments) {
                    segments[i].path = subSegments[0];

                    if (subSegments[1]) {
                        const extents = measure.pathExtents(subSegments[1]);
                        let newSegment: IQueuedSweepPathSegment = {
                            path: subSegments[1],
                            uniqueForeignIntersectionPoints: [],
                            extents,
                            qpath,
                            offset: qpath.offset
                        };

                        if (segments[i].overlapTracked) {
                            trackOverlap(newSegment);
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
    enum SweepMotion {
        enter, exit, checkInside
    }

    /**
     * @private
     */
    enum SegmentDeletedReason {
        NotDeleted = 0,
        Duplicate,
        DeadEnd,
        Inside,
        Outside,
        Tiny
    }

    /**
     * @private
     */
    interface IQueuedSweepItem {
        modelIndex: number;
        leftX: number;
        rightX: number;
    }

    /**
     * @private
     */
    interface IQueuedSweepEvent<T extends IQueuedSweepItem> {
        motion: SweepMotion
        item: T;
    }

    /**
     * @private
     */
    interface IQueuedSweepPathSegment {
        segmentIndex?: number;
        isInside?: boolean;
        isInsideNotes?: string;
        uniqueForeignIntersectionPoints: IPoint[];
        path: IPath;
        overlapTracked?: boolean;
        duplicate?: boolean;
        duplicateGroup?: number;
        deleted?: boolean;
        reasonDeleted?: SegmentDeletedReason;
        extents: IMeasure;
        offset: IPoint;
        midpoint?: IPoint;
        pathLength?: number;
        qpath: IQueuedSweepPath;
        newId?: string;
        pointIndexes?: number[];
    }

    /**
     * @private
     */
    interface IQueuedSweepPath extends IQueuedSweepItem, IWalkPath {
        pathIndex: number;
        segments: IQueuedSweepPathSegment[];
        //overlaps: IQueuedSweepPathMap;
        topY: number;
        bottomY: number;
    }

    /**
     * @private
     */
    interface IQueuedSweepPathMap {
        [pathIndex: number]: IQueuedSweepPath;
    }

    /**
     * @private
     */
    interface IOneToManyMap {
        [pathIndex: number]: number[];
    }

    /**
     * @private
     */
    interface ISweepPaths {
        [pathIndex: number]: IQueuedSweepEvent<IQueuedSweepPath>;
    }

    /**
     * @private
     */
    interface IQueuedSweepCheckInside extends IQueuedSweepItem {
        segment: IQueuedSweepPathSegment;
    }

    /**
     * @private
     */
    interface IPathDuplicate extends IPath {
        duplicate: true;
    }

    /**
     * @private
     */
    interface IDuplicateGroups {
        [duplicateGroup: number]: {
            [modelIndex: number]: boolean;
            segments: IQueuedSweepPathSegment[];
        }
    }

    /**
     * @private
     */
    function checkForEqualOverlaps(overlappedSegments: IQueuedSweepPathSegment[], pointMatchingDistance: number, duplicateGroups: IDuplicateGroups) {
        let duplicateGroup = 0;
        //collect midPoints of overlapped segments to find duplicates
        const midPointCollector = new PointGraph<IQueuedSweepPathSegment>();

        overlappedSegments.forEach(overlappedSegment => {
            if (!overlappedSegment.midpoint) {
                overlappedSegment.midpoint = point.add(point.middle(overlappedSegment.path), overlappedSegment.qpath.offset);
            }
            midPointCollector.insertValue(overlappedSegment.midpoint, overlappedSegment);
        });

        midPointCollector.mergePoints(pointMatchingDistance);
        midPointCollector.forEachPoint((midpoint, segments) => {
            if (segments.length < 2) return;

            duplicateGroup++;
            duplicateGroups[duplicateGroup] = { segments: [] };

            segments.forEach((segment, i) => {
                duplicateGroups[duplicateGroup][segment.qpath.modelIndex] = true;
                duplicateGroups[duplicateGroup].segments.push(segment);

                segment.duplicate = true;
                segment.duplicateGroup = duplicateGroup;

                if (i === 0) {
                    //mark the duplicate for the dead end finder
                    (segment.path as IPathDuplicate).duplicate = true;
                } else {
                    //mark segment as deleted
                    segment.deleted = true;
                }
            });
        });
    }

    /**
     * @private
     */
    interface ITrackDeleted {
        //        (pathToDelete: IPath, routeKey: string, offset: IPoint, reason: string): void;
        (modelIndex: number, deletedSegment: IPath, routeKey: string, offset: IPoint, reason: string): void;
    }

    /**
     * @private
     */
    function addOrDeleteSegments(qpath: IQueuedSweepPath, includeInside: boolean, includeOutside: boolean, trackDeleted: ITrackDeleted, deadEndPointGraph: PointGraph<IQueuedSweepPathSegment>) {

        function checkAddSegment(segment: IQueuedSweepPathSegment) {
            if (segment.isInside && includeInside || !segment.isInside && includeOutside) {
                segment.newId = getSimilarPathId(qpath.modelContext, qpath.pathId);
                qpath.modelContext.paths[segment.newId] = segment.path;

                //compute now for pointgraph
                if (deadEndPointGraph) {

                    const endpoints = point.fromPathEnds(segment.path, segment.offset);
                    segment.pointIndexes = [];

                    endpoints.forEach(p => {
                        const pr = point.rounded(p);
                        const result = deadEndPointGraph.insertValue(pr, segment);
                        segment.pointIndexes.push(result.pointIndex);
                    });
                }
            } else {
                const reason = `segment ${segment.segmentIndex} of qpath ${qpath.pathIndex} is ${segment.isInside ? 'inside' : 'outside'} intersectionPoints=${JSON.stringify(segment.uniqueForeignIntersectionPoints)} ${segment.isInsideNotes}`;
                trackDeleted(segment.qpath.modelIndex, segment.path, qpath.routeKey, segment.offset, reason);
            }
        }

        //delete the original, its segments will be added
        delete qpath.modelContext.paths[qpath.pathId];

        qpath.segments.forEach(segment => {
            if (segment.deleted) {
                trackDeleted(segment.qpath.modelIndex, segment.path, qpath.routeKey, segment.offset, `segment is a duplicate ${segment.duplicateGroup}`);
            } else {
                checkAddSegment(segment);
            }
        });
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
        const modelArray = [modelA, modelB];

        const flags = [
            [includeAInsideB, includeAOutsideB],
            [includeBInsideA, includeBOutsideA]
        ];

        combineArray(modelArray, flags, options);

        const result: IModel = { models: { a: modelArray[0], b: modelArray[1] } };
        return result;
    }

    /**
     * @private
     */
    function combineArray(modelArray: IModel[], flags: boolean[][], options: ICombineOptions) {
        const result: IModel = { models: {} };
        modelArray.forEach((m, i) => result.models[i] = m);

        const opts: ICombineOptions = {
            trimDeadEnds: true,
            pointMatchingDistance: .002,
            out_deleted: [],
        };
        extendObject(opts, options);

        const trackDeleted: ITrackDeleted = (modelIndex: number, deletedSegment: IPath, routeKey: string, offset: IPoint, reason: string) => {
            if (!opts.out_deleted[modelIndex]) opts.out_deleted[modelIndex] = {};
            addPath(opts.out_deleted[modelIndex], deletedSegment, 'deleted');
            path.moveRelative(deletedSegment, offset);
            const p = deletedSegment as IPathRemoved;
            p.reason = reason;
            p.routeKey = routeKey;
        }

        now = new Date();
        elapse('start');

        //gather all paths from the array of models into a heap queue
        const { extents, queue, qpaths } = gather(modelArray);

        elapse('gathered');

        //make a copy of the queue for a 2nd pass
        const insideQueue = new BinaryHeap<number, IQueuedSweepEvent<IQueuedSweepItem>>();
        insideQueue.list = queue.list.slice(0);

        elapse('heaped');

        //sweep and break paths
        const overlappedSegments: IQueuedSweepPathSegment[] = [];
        const boxes = getOverlappingBoxes(queue);

        elapse('swept boxes');

        breakOverlaps(qpaths, boxes, overlappedSegments);

        elapse('broke overlaps');

        const broken = cleanBroken(qpaths, insideQueue, opts.pointMatchingDistance);

        elapse('cleaned broken');

        //mark the duplicates
        const duplicateGroups: IDuplicateGroups = {};

        checkForEqualOverlaps(overlappedSegments, .0001, duplicateGroups);

        elapse('checked for overlaps');

        //check if segments are inside
        sweepInsideLines(insideQueue, extents, duplicateGroups, opts.pointMatchingDistance);

        elapse('swept inside');

        let deadEndPointGraph: PointGraph<IQueuedSweepPathSegment>;
        if (opts.trimDeadEnds) {
            deadEndPointGraph = new PointGraph<IQueuedSweepPathSegment>();
        }

        //now modify the models with the new segments
        broken.forEach(qpath => {
            const includes = flags[qpath.modelIndex] || flags[0];
            addOrDeleteSegments(qpath, includes[0], includes[1], trackDeleted, deadEndPointGraph);
        });

        elapse('added or deleted');

        if (opts.trimDeadEnds) {

            let shouldKeep: IWalkPathBooleanCallback;

            //union
            if (!flags[0][0] && !flags[1][0]) {             //if (!includeAInsideB && !includeBInsideA) {
                shouldKeep = function (walkedPath: IWalkPath): boolean {

                    var pl = round(measure.pathLength(walkedPath.pathContext), opts.pointMatchingDistance);
                    if (pl <= opts.pointMatchingDistance) {
                        return false;
                    }

                    //When A and B share an outer contour, the segments marked as duplicate will not pass the "inside" test on either A or B.
                    //Duplicates were discarded from B but kept in A
                    if ((walkedPath.pathContext as IPathDuplicate).duplicate) {
                        return false;
                    }

                    //default - keep the path
                    return true;
                }
            }

            removeDeadEnds2(deadEndPointGraph, .001, .001);

            elapse('removed dead ends');

            // removeDeadEnds(result, opts.pointMatchingDistance, shouldKeep, (wp, reason) => {
            //     const modelIndex = +wp.route[1];
            //     trackDeleted(modelIndex, wp.pathContext, wp.routeKey, wp.offset, reason)
            // });
        }

        //pass options back to caller
        extendObject(options, opts);

        //clean the temp flags from each path
        // duplicates.forEach(d => {
        //     delete d.duplicate;
        // });

        elapse('done');

        return result;
    }

    /**
     * @private
     */
    function combineOverload(includeAinsideB: boolean, includeBinsideA: boolean, args: any[]) {
        let modelArray: IModel[];
        let options: ICombineOptions;
        let ab = false;

        if (Array.isArray(args[0])) {
            modelArray = args[0];
            options = args[1];
        } else {
            ab = true;
            modelArray = [args[0], args[1]];
            options = args[2];
        }

        let result = combineArray(modelArray, [[includeAinsideB, includeBinsideA], [includeAinsideB, includeBinsideA]], options);

        if (ab) {
            result = { models: { a: modelArray[0], b: modelArray[1] } };
        }
        return result;
    }

    /**
     * Combine an array of models, resulting in a intersection. Each model will be modified accordingly.
     *
     * @param modelArray Array of models to combine.
     * @param options Optional ICombineOptions object.
     * @returns A new model containing all of the input models.
     */
    export function combineIntersection(modelA: IModel, modelB: IModel, options?: ICombineOptions);

    /**
     * Combine 2 models, resulting in a intersection. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @param options Optional ICombineOptions object.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    export function combineIntersection(modelA: IModel, modelB: IModel, options?: ICombineOptions);

    export function combineIntersection(...args: any[]) {
        return combineOverload(true, false, args);
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
     * Combine an array of models, resulting in a union. Each model will be modified accordingly.
     *
     * @param modelArray Array of models to combine.
     * @param options Optional ICombineOptions object.
     * @returns A new model containing both of the input models.
     */
    export function combineUnion(modelArray: IModel[], options?: ICombineOptions): IModel;

    /**
     * Combine 2 models, resulting in a union. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @param options Optional ICombineOptions object.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    export function combineUnion(modelA: IModel, modelB: IModel, options?: ICombineOptions): IModel;

    export function combineUnion(...args: any[]) {
        return combineOverload(false, true, args);
    }

    export function combineBreak(modelArray: IModel[]) {
        return combineArray(modelArray, [[true, true], [true, true]], { trimDeadEnds: false });
    }

    const widenActivation = .0000001;

    /**
     * @private
     */
    function gather(modelsToGather: IModel[]) {
        const queue = new BinaryHeap<number, IQueuedSweepEvent<IQueuedSweepPath>>();
        const qpaths: IQueuedSweepPathMap = {}
        const _extents: IMeasure = { high: [null, null], low: [null, null] };
        let modelIndex: number;
        let pathIndex = 0;
        const walkOptions: IWalkOptions = {
            onPath: (walkedPath: IWalkPath) => {
                const pathExtents = measure.pathExtents(walkedPath.pathContext, walkedPath.offset);
                measure.increase(_extents, pathExtents);

                const qpath = walkedPath as IQueuedSweepPath;
                qpath.modelIndex = modelIndex;
                qpath.pathIndex = pathIndex;
                qpath.leftX = pathExtents.low[0];
                qpath.rightX = pathExtents.high[0];
                qpath.topY = pathExtents.high[1];
                qpath.bottomY = pathExtents.low[1];
                //qpath.overlaps = {};

                qpaths[pathIndex] = qpath;

                //clone this path and make it the first segment
                const segment: IQueuedSweepPathSegment = {
                    path: cloneObject(walkedPath.pathContext),
                    uniqueForeignIntersectionPoints: [],
                    extents: pathExtents,
                    qpath,
                    offset: walkedPath.offset
                };

                qpath.segments = [segment];

                const enter: IQueuedSweepEvent<IQueuedSweepPath> = {
                    motion: SweepMotion.enter,
                    item: qpath
                }
                queue.insert(qpath.leftX - widenActivation, enter);

                const exit: IQueuedSweepEvent<IQueuedSweepPath> = {
                    motion: SweepMotion.exit,
                    item: qpath
                }
                queue.insert(qpath.rightX + widenActivation, exit);
                pathIndex++;
            }
        };

        modelsToGather.forEach((m, i) => {
            modelIndex = i;
            model.walk(m, walkOptions)
        });

        const extents = measure.augment(_extents);

        return { queue, extents, qpaths };
    }

    let now: Date;

    function elapse(place: string) {
        const last = now;
        now = new Date();
        if (last) {
            console.log(`elapsed at ${place}: ${now.valueOf() - last.valueOf()}`);
        } else {
            console.log(`started at ${place}`);
        }
    }

    /**
     * @private
     */
    function insertIntoSweepLine(active: ISweepPaths, boxOverlaps: IOneToManyMap, curr: IQueuedSweepEvent<IQueuedSweepPath>) {

        const qpath = curr.item;

        for (let pathIndex in active) {
            let otherPath = active[pathIndex].item;

            //establish y overlaps
            //check for overlapping y range
            if (measure.isBetween(qpath.topY, otherPath.topY, otherPath.bottomY, false) ||
                measure.isBetween(otherPath.topY, qpath.topY, qpath.bottomY, false)) {

                //mark as overlap
                if (!boxOverlaps[qpath.pathIndex]) {
                    boxOverlaps[qpath.pathIndex] = [];
                }
                boxOverlaps[qpath.pathIndex].push(otherPath.pathIndex);
            }
        }

        active[qpath.pathIndex] = curr;
    }

    /**
     * @private
     */
    function getOverlappingBoxes(q: BinaryHeapClass<number, IQueuedSweepEvent<IQueuedSweepPath>>) {

        //establish a sweep line
        const active: ISweepPaths = {};

        const boxOverlaps: IOneToManyMap = {};

        while (!q.isEmpty()) {
            let curr = q.extractMinimum();
            let qpath = curr.value.item;
            if (curr.value.motion === SweepMotion.exit) {
                delete active[qpath.pathIndex];
            } else if (curr.value.motion === SweepMotion.enter) {
                insertIntoSweepLine(active, boxOverlaps, curr.value);
            }
        }

        return boxOverlaps;
    }

    function breakOverlaps(qpaths: IQueuedSweepPathMap, boxOverlaps: IOneToManyMap, overlappedSegments: IQueuedSweepPathSegment[]) {
        const broken: number[] = [];
        for (let _outerIndex in boxOverlaps) {
            let outerIndex = +_outerIndex;
            let outer = qpaths[outerIndex];
            broken.push(outerIndex);

            //check against overlaps
            const innerIndexes = boxOverlaps[outerIndex];
            innerIndexes.forEach(innerIndex => {
                const inner = qpaths[innerIndex];
                breakAlongForeignPath(outer, inner, overlappedSegments);
                breakAlongForeignPath(inner, outer, overlappedSegments);

                broken.push(innerIndex);
            });
        }
        return broken;
    }

    function cleanBroken(qpaths: IQueuedSweepPathMap, q2: BinaryHeapClass<number, IQueuedSweepEvent<IQueuedSweepItem>>, pointMatchingDistance: number) {
        const broken: IQueuedSweepPath[] = [];
        for (let pathIndex in qpaths) {
            let qpath = qpaths[pathIndex];

            if (qpath.segments.length > 0) {
                broken.push(qpath);

                qpath.segments.forEach((segment, i) => {
                    segment.segmentIndex = i;

                    segment.pathLength = measure.pathLength(segment.path);

                    if (segment.pathLength <= pointMatchingDistance) {
                        segment.reasonDeleted = SegmentDeletedReason.Tiny;
                        segment.deleted = true;
                        //TODO - reason:too short
                    } else {

                        //collect segments by common midpoint
                        const midpoint = point.add(point.middle(segment.path), qpath.offset);
                        segment.midpoint = midpoint;

                        //insert check into 2nd queue
                        const x = midpoint[0];
                        const item: IQueuedSweepCheckInside = {
                            leftX: x,
                            rightX: x,
                            modelIndex: qpath.modelIndex,
                            segment: segment
                        };

                        const check: IQueuedSweepEvent<IQueuedSweepCheckInside> = {
                            motion: SweepMotion.checkInside,
                            item
                        }
                        q2.insert(x, check);
                    }
                });
            }
        }
        return broken;
    }

    /**
     * @private
     */
    function sweepInsideLines(q: BinaryHeapClass<number, IQueuedSweepEvent<IQueuedSweepItem>>, extents: IMeasureWithCenter, /*out_insideIntersections: IModel,*/ duplicateGroups: IDuplicateGroups, pointMatchingDistance: number) {

        //establish a sweep line
        const active: { [modelIndex: number]: ISweepPaths } = {};

        const pointCollector = new PointGraph<IQueuedSweepPath[]>();
        const tangentCollector = new PointGraph<IQueuedSweepPath>();

        //sweep through the heap
        let x = q.findMinimum().key;

        while (!q.isEmpty()) {
            let curr = q.extractMinimum();
            if (curr.value.motion === SweepMotion.checkInside) {
                const check = (curr.value as IQueuedSweepEvent<IQueuedSweepCheckInside>).item;

                //don't bother for segments that are already marked as deleted
                if (!check.segment.deleted) {
                    //process the sweep line
                    checkInsideSweepLine(active, check, extents, duplicateGroups, pointMatchingDistance, pointCollector, tangentCollector);
                }

            } else {
                const queuedItemPath = curr.value as IQueuedSweepEvent<IQueuedSweepPath>;
                if (queuedItemPath.motion === SweepMotion.exit) {
                    delete active[queuedItemPath.item.modelIndex][queuedItemPath.item.pathIndex];
                    if (Object.keys(active[queuedItemPath.item.modelIndex]).length === 0) {
                        delete active[queuedItemPath.item.modelIndex];
                    }
                } else {
                    if (!active[queuedItemPath.item.modelIndex]) {
                        active[queuedItemPath.item.modelIndex] = {};
                    }
                    active[queuedItemPath.item.modelIndex][queuedItemPath.item.pathIndex] = queuedItemPath;
                }
            }

            x = curr.key;
        }
    }

    /**
     * @private
     */
    function checkInsideSweepLine(active: { [modelIndex: number]: ISweepPaths }, check: IQueuedSweepCheckInside, extents: IMeasureWithCenter, duplicateGroups: IDuplicateGroups, pointMatchingDistance: number, pointCollector: PointGraph<IQueuedSweepPath[]>, tangentCollector: PointGraph<IQueuedSweepPath>) {

        const segment = check.segment;

        //for each check, draw a line to nearest boundary
        const midY = segment.midpoint[1];
        const x = segment.midpoint[0];

        const highLine = new paths.Line(segment.midpoint, [x, extents.high[1] + 1]);
        const lowLine = new paths.Line(segment.midpoint, [x, extents.low[1] - 1]);

        const notes: string[] = [];

        for (let modelIndex in active) {
            if (+modelIndex === segment.qpath.modelIndex) continue;

            //don't check against models which are marked duplicate with this segment
            if (segment.duplicateGroup && modelIndex in duplicateGroups[segment.duplicateGroup]) {
                //duplicates will be managed by the deadend finder
                notes.push(`shares contour with ${modelIndex}`);
                continue;
            }

            let qpaths: IQueuedSweepPath[] = [];
            for (let pathIndex in active[modelIndex]) {
                qpaths.push(active[modelIndex][pathIndex].item);
            }

            let intersectionPoints = getModelIntersectionPoints(segment, qpaths, extents, lowLine, highLine, notes, midY, pointCollector, tangentCollector);

            //if number of intersections is an odd number, segment is inside the model
            if (intersectionPoints) {

                if (intersectionPoints.length % 2 === 1) {
                    segment.isInside = true;
                    segment.isInsideNotes = `modelIndex: ${modelIndex} midpoint:${JSON.stringify(segment.midpoint)}`;
                    segment.uniqueForeignIntersectionPoints = intersectionPoints;
                    return;
                }
            }
        }
    }

    /**
     * @private
     */
    function tangentOnXCircle(circle: IPathCircle, offset: IPoint, x: number) {
        const rightX = circle.origin[0] + circle.radius + offset[0];
        const leftX = circle.origin[0] - circle.radius + offset[0];
        return {
            left: round(leftX - x) === 0,
            right: round(rightX - x) === 0
        };
    }

    /**
     * @private
     */
    const tangentOnXMap: { [pathType: string]: (pathContext: IPath, offset: IPoint, x: number) => boolean } = {};

    tangentOnXMap[pathType.Circle] = function (circle: IPathCircle, offset: IPoint, x: number) {
        const t = tangentOnXCircle(circle, offset, x);
        return t.left || t.right;
    };

    tangentOnXMap[pathType.Arc] = function (arc: IPathArc, offset: IPoint, x: number) {
        const t = tangentOnXCircle(arc, offset, x);
        if (t.left) {
            t.left = measure.isBetweenArcAngles(180, arc, true);
        }
        if (t.right) {
            t.right = measure.isBetweenArcAngles(0, arc, true);
        }
        return t.left || t.right;
    };

    tangentOnXMap[pathType.Line] = function (line: IPathLine, offset: IPoint, x: number) {
        return round(line.origin[0] + offset[0] - x) === 0 || round(line.end[0] + offset[0] - x) === 0;
    };

    /**
     * @private
     */
    function isTangentOnX(p: IPath, offset: IPoint, x: number) {
        const fn = tangentOnXMap[p.type];
        if (fn) {
            return fn(p, offset, x);
        }
        return false;
    }

    /**
     * @private
     */
    function isPointBetween(p: IPoint, qpaths: IQueuedSweepPath[]) {
        var m: IMeasure = { high: [null, null], low: [null, null] };
        qpaths.forEach(qpath => measure.increase(m, measure.pathExtents(qpath.pathContext, qpath.offset)));
        //return round(m.low[0] - p[0]) === 0 || round(m.high[0] - p[0]) === 0;
        return measure.isBetween(p[0], m.low[0], m.high[0], true);
    }

    /**
     * @private
     */
    const intersectionDelta = .00001;

    /**
     * @private
     */
    function getModelIntersectionPoints(segment: IQueuedSweepPathSegment, modelsPaths: IQueuedSweepPath[], extents: IMeasureWithCenter, lowLine: IPathLine, highLine: IPathLine, notes: string[], midY: number, pointCollector: PointGraph<IQueuedSweepPath[]>, tangentCollector: PointGraph<IQueuedSweepPath>) {

        let aboveCount = 0;
        let belowCount = 0;
        for (let i = 0; i < modelsPaths.length; i++) {
            if (modelsPaths[i].topY >= midY) aboveCount++;
            if (midY >= modelsPaths[i].bottomY) belowCount++;
        }

        if (aboveCount === 0 || belowCount === 0) {
            //notes.push(`escaped`);
            return null;
        }

        const line = (aboveCount < belowCount ? highLine : lowLine);

        pointCollector.reset();
        tangentCollector.reset();

        for (let qpath of modelsPaths) {

            //vertical line must be within bounding box if it intersects
            if (!measure.isBetween(line.origin[0], qpath.leftX, qpath.rightX, false)) continue;

            let intersectOptions: IPathIntersectionOptions = { path2Offset: qpath.offset };
            let farInt = path.intersection(line, qpath.pathContext, intersectOptions);
            if (farInt) {
                farInt.intersectionPoints.forEach(p => {

                    //check for tangent, insert into either tangentcollector or pointcollector
                    if (isTangentOnX(qpath.pathContext, qpath.offset, line.origin[0])) {
                        tangentCollector.insertValue(p, qpath);
                    } else {
                        pointCollector.insertValue(p, [qpath]);
                    }
                });
                notes.push(`intersects with ${qpath.modelIndex} ${qpath.routeKey}: ${JSON.stringify(farInt)} line: ${JSON.stringify(new paths.Line(line.origin, line.end))} model: ${JSON.stringify(qpath.modelContext)}`);
            }
        }

        //merge similar tangent points
        if (tangentCollector.insertedCount > 1) {
            tangentCollector.mergePoints(0.0005);
        }

        //any matching tangent points become an intersection point
        for (let i in tangentCollector.merged) {
            let pointIndex = tangentCollector.merged[i];
            let card = tangentCollector.index[pointIndex];
            let qpaths = card.valueIndexes.map(valueIndex => tangentCollector.values[valueIndex]);
            if (!isPointBetween(card.point, qpaths)) {
                pointCollector.insertValue(card.point, qpaths);
            }
        }

        //flatten to single array of points
        const intersectionPoints: IPoint[] = [];

        if (pointCollector.insertedCount > 1) {
            pointCollector.mergePoints(0.0005);
        }

        pointCollector.forEachPoint((p, values) => intersectionPoints.push(p));

        return intersectionPoints;
    }

    function removeDeadEnds2(pg: PointGraph<IQueuedSweepPathSegment>, withinDistance: number, incrementDistance: number) {
        console.log(pg);

        // for (let pointIndex in pg.index) {
        //     pg.calculatePointDistance(+pointIndex);
        // }

        pg.mergePoints(withinDistance);
        for (let i = 0; i < 50; i++) {
            let byLength = pg.byValueIndexesLength();
            if (!byLength[1]) {
                console.log(`no singles at ${i} iterations`);
                break;
            } else {
                if (byLength[1].length === 2) {
                    console.log(`only 2 and length between is ${measure.pointDistance(byLength[1][0].point, byLength[1][1].point)}`);
                }
                console.log(byLength);
            }
            let singles = byLength[1];
            let d = withinDistance + i * incrementDistance;
            pg.mergePoints(d);
            //console.log(`iteration ${i} d:${d} merged: ${anyMerged}`);
        }
        console.log(pg.byValueIndexesLength());
    }

}
