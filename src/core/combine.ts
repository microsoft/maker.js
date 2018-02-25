namespace MakerJs.model {

    /**
     * @private
     */
    var BinaryHeap = require('@tyriar/binary-heap') as typeof BinaryHeapClass;

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
    function breakAlongForeignPath(qpath: IQueuedSweepPath, foreignWalkedPath: IWalkPath) {
        var foreignPath = foreignWalkedPath.pathContext;
        var segments = qpath.segments;

        if (measure.isPathEqual(segments[0].path, foreignPath, .0001, qpath.offset, foreignWalkedPath.offset)) {
            return;
        }

        var foreignPathEndPoints: IPoint[];

        for (var i = 0; i < segments.length; i++) {

            var pointsToCheck: IPoint[];
            var options: IPathIntersectionOptions = { path1Offset: qpath.offset, path2Offset: foreignWalkedPath.offset };
            var foreignIntersection = path.intersection(segments[i].path, foreignPath, options);

            if (foreignIntersection) {
                pointsToCheck = foreignIntersection.intersectionPoints;

            } else if (options.out_AreOverlapped) {

                if (!foreignPathEndPoints) {
                    //make sure endpoints are in absolute coords
                    foreignPathEndPoints = point.fromPathEnds(foreignPath, foreignWalkedPath.offset);
                }

                pointsToCheck = foreignPathEndPoints;
            }

            if (pointsToCheck) {

                //break the path which intersected, and add the shard to the end of the array so it can also be checked in this loop for further sharding.
                var subSegments: IPath[] = null;
                var p = 0;
                while (!subSegments && p < pointsToCheck.length) {
                    //cast absolute points to path relative space
                    subSegments = getNonZeroSegments(segments[i].path, point.subtract(pointsToCheck[p], qpath.offset));
                    p++;
                }

                if (subSegments) {
                    segments[i].path = subSegments[0];

                    if (subSegments[1]) {
                        const extents = measure.pathExtents(subSegments[1]);
                        var newSegment: IQueuedSweepPathSegment = {
                            path: subSegments[1],
                            uniqueForeignIntersectionPoints: [],
                            extents,
                            qpath,
                            offset: qpath.offset
                        };

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
        uniqueForeignIntersectionPoints: IPoint[];
        path: IPath;
        duplicate?: boolean;
        deleted?: boolean;
        extents: IMeasure;
        offset: IPoint;
        midpoint?: IPoint;
        qpath: IQueuedSweepPath;
    }

    /**
     * @private
     */
    interface IQueuedSweepPath extends IQueuedSweepItem, IWalkPath {
        verticalTangents?: { [x: number]: boolean };
        pathIndex: number;
        segments: IQueuedSweepPathSegment[];
        overlaps: { [pathIndex: number]: IQueuedSweepPath };
        topY: number;
        bottomY: number;
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
    interface ITrackDeleted {
        //        (pathToDelete: IPath, routeKey: string, offset: IPoint, reason: string): void;
        (modelIndex: number, deletedSegment: IPath, routeKey: string, offset: IPoint, reason: string): void;
    }

    /**
     * @private
     */
    function addOrDeleteSegments(qpath: IQueuedSweepPath, includeInside: boolean, includeOutside: boolean, trackDeleted: ITrackDeleted) {

        function addSegment(modelContext: IModel, pathIdBase: string, segment: IQueuedSweepPathSegment) {
            var id = getSimilarPathId(modelContext, pathIdBase);
            var newRouteKey = (id == pathIdBase) ? qpath.routeKey : createRouteKey(qpath.route.slice(0, -1).concat([id]));

            modelContext.paths[id] = segment.path;
        }

        function checkAddSegment(modelContext: IModel, pathIdBase: string, segment: IQueuedSweepPathSegment) {
            if (segment.isInside && includeInside || !segment.isInside && includeOutside) {
                addSegment(modelContext, pathIdBase, segment);
            } else {
                const reason = 'segment is ' + (segment.isInside ? 'inside' : 'outside') + ' intersectionPoints=' + JSON.stringify(segment.uniqueForeignIntersectionPoints);
                trackDeleted(segment.qpath.modelIndex, segment.path, qpath.routeKey, segment.offset, reason);
            }
        }

        //delete the original, its segments will be added
        delete qpath.modelContext.paths[qpath.pathId];

        qpath.segments.forEach(segment => {
            if (segment.duplicate) {
                if (segment.deleted) {
                    trackDeleted(segment.qpath.modelIndex, segment.path, qpath.routeKey, segment.offset, `segment is a duplicate`);
                } else {
                    addSegment(qpath.modelContext, qpath.pathId, segment);
                }
            } else {
                checkAddSegment(qpath.modelContext, qpath.pathId, segment);
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

        var result: IModel = { models: { a: modelArray[0], b: modelArray[1] } };
        return result;
    }

    /**
     * @private
     */
    function combineArray(modelArray: IModel[], flags: boolean[][], options: ICombineOptions) {

        const out_deleted = [{ paths: {} }, { paths: {} }];
        const out_insideIntersections: IModel = { paths: {} };

        const result: IModel = { models: {} };
        modelArray.forEach((m, i) => result.models[i] = m);

        var opts: ICombineOptions = {
            trimDeadEnds: true,
            pointMatchingDistance: .005,
            out_deleted,
            out_insideIntersections
        };
        extendObject(opts, options);

        const trackDeleted: ITrackDeleted = (modelIndex: number, deletedSegment: IPath, routeKey: string, offset: IPoint, reason: string) => {
            addPath(opts.out_deleted[modelIndex], deletedSegment, 'deleted');
            path.moveRelative(deletedSegment, offset);
            var p = deletedSegment as IPathRemoved;
            p.reason = reason;
            p.routeKey = routeKey;
        }

        function comparePoint(pointA: IPoint, pointB: IPoint) {
            var distance = measure.pointDistance(pointA, pointB);
            return distance <= opts.pointMatchingDistance;
        }

        //collect midPoints of broken segments to find duplicates
        const midPointCollector = new Collector<IPoint, IQueuedSweepPathSegment>(comparePoint);

        //gather all paths from the array of models into a heap queue
        const { extents, queue } = gather(modelArray);

        //make a copy of the queue for a 2nd pass
        const insideQueue = new BinaryHeap<number, IQueuedSweepEvent<IQueuedSweepItem>>();
        insideQueue.list = queue.list.slice(0);

        //sweep and break paths
        var broken = sweepAndBreak(queue, insideQueue, midPointCollector, extents);

        //mark the duplicates
        midPointCollector.getCollectionsOfMultiple((midpoint, segments) => {
            segments.forEach((segment, i) => {
                segment.duplicate = true;

                if (i === 0) {
                    //mark the duplicate for the dead end finder
                    (segment.path as IPathDuplicate).duplicate = true;
                } else {
                    //mark segment as deleted
                    segment.deleted = true;
                }
            });
        });

        //check if segments are inside
        sweepInsideLines(insideQueue, extents, out_insideIntersections);

        //now modify the models with the new segments
        broken.forEach(qpath => {
            const includes = flags[qpath.modelIndex] || flags[0];
            addOrDeleteSegments(qpath, includes[0], includes[1], trackDeleted);
        });

        if (opts.trimDeadEnds) {

            var shouldKeep: IWalkPathBooleanCallback;

            //union
            if (!flags[0][0] && !flags[1][0]) {             //if (!includeAInsideB && !includeBInsideA) {
                shouldKeep = function (walkedPath: IWalkPath): boolean {

                    //When A and B share an outer contour, the segments marked as duplicate will not pass the "inside" test on either A or B.
                    //Duplicates were discarded from B but kept in A
                    if ((walkedPath.pathContext as IPathDuplicate).duplicate) {
                        return false;
                    }

                    //default - keep the path
                    return true;
                }
            }

            removeDeadEnds(result, null, shouldKeep, (wp, reason) => {
                const modelIndex = +wp.route[1];
                trackDeleted(modelIndex, wp.pathContext, wp.routeKey, wp.offset, reason)
            });
        }

        //pass options back to caller
        extendObject(options, opts);

        //clean the temp flags from each path
        // duplicates.forEach(d => {
        //     delete d.duplicate;
        // });

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

        //TODO: add signature for array, call combineArray

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
    export function combineUnion(modelA: IModel, modelB: IModel, options?: ICombineOptions) {

        //TODO: add signature for array, call combineArray

        return combine(modelA, modelB, false, true, false, true);
    }

    /**
     * @private
     */
    function gather(modelsToGather: IModel[]) {
        const queue = new BinaryHeap<number, IQueuedSweepEvent<IQueuedSweepPath>>();
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
                qpath.overlaps = {};

                //clone this path and make it the first segment
                var segment: IQueuedSweepPathSegment = {
                    path: cloneObject(walkedPath.pathContext),
                    uniqueForeignIntersectionPoints: [],
                    extents: pathExtents,
                    qpath,
                    offset: walkedPath.offset
                };

                qpath.segments = [segment];

                //when enter and exit are on the same vertical line X, no need to enter.
                if (qpath.leftX < qpath.rightX) {
                    const enter: IQueuedSweepEvent<IQueuedSweepPath> = {
                        motion: SweepMotion.enter,
                        item: qpath
                    }
                    queue.insert(qpath.leftX, enter);
                }

                const exit: IQueuedSweepEvent<IQueuedSweepPath> = {
                    motion: SweepMotion.exit,
                    item: qpath
                }
                queue.insert(qpath.rightX, exit);
                pathIndex++;
            }
        };

        modelsToGather.forEach((m, i) => {
            modelIndex = i;
            model.walk(m, walkOptions)
        });

        const extents = measure.augment(_extents);

        return { queue, extents };
    }

    /**
     * @private
     */
    function insertIntoSweepLine(active: ISweepPaths, curr: IQueuedSweepEvent<IQueuedSweepPath>) {

        const qpath = curr.item;

        for (let pathIndex in active) {
            let otherPath = active[pathIndex].item;

            //establish y overlaps
            //check for overlapping y range
            if (measure.isBetween(qpath.topY, otherPath.topY, otherPath.bottomY, false) ||
                measure.isBetween(otherPath.topY, qpath.topY, qpath.bottomY, false)) {

                //set both to be overlaps of each other
                qpath.overlaps[otherPath.pathIndex] = otherPath;
                otherPath.overlaps[qpath.pathIndex] = qpath;
            }
        }

        active[curr.item.pathIndex] = curr;
    }

    /**
     * @private
     */
    function sweepAndBreak(
        q: BinaryHeapClass<number, IQueuedSweepEvent<IQueuedSweepPath>>,
        q2: BinaryHeapClass<number, IQueuedSweepEvent<IQueuedSweepItem>>,
        midPointCollector: Collector<IPoint, IQueuedSweepPathSegment>,
        extents: IMeasureWithCenter) {

        const broken: IQueuedSweepPath[] = [];

        //establish a sweep line
        const active: ISweepPaths = {};

        //sweep through the heap
        let x = q.findMinimum().key;

        while (!q.isEmpty()) {
            let curr = q.extractMinimum();
            if (curr.key > x) {

                //process the sweep line
                breakSweepLine(active, broken, midPointCollector, q2, extents, false);
            }

            //add to the sweep line, at Y. 
            insertIntoSweepLine(active, curr.value);

            x = curr.key;
        }

        //process the final sweep line
        breakSweepLine(active, broken, midPointCollector, q2, extents, true);

        return broken;
    }

    /**
     * @private
     */
    function breakSweepLine(
        active: ISweepPaths,
        broken: IQueuedSweepPath[],
        midPointCollector: Collector<IPoint, IQueuedSweepPathSegment>,
        q2: BinaryHeapClass<number, IQueuedSweepEvent<IQueuedSweepItem>>,
        extents: IMeasureWithCenter,
        exiting: boolean) {

        //look at everything in the sweep line
        for (let outerPathIndex in active) {
            let outer = active[outerPathIndex].item;

            //check against overlaps
            const innerIndexes = Object.keys(outer.overlaps);
            innerIndexes.forEach(_innerIndex => {
                const innerIndex = +_innerIndex;
                const inner = outer.overlaps[innerIndex];

                breakAlongForeignPath(outer, inner);

                //mark as completed, by removing from overlaps
                delete outer.overlaps[innerIndex];
            });
        }

        //remove each exiting item in the active sweep
        const pathIndexes = Object.keys(active);
        pathIndexes.forEach(_pathIndex => {
            const pathIndex = +_pathIndex;
            if (exiting || active[pathIndex].motion === SweepMotion.exit) {
                let qpath = active[pathIndex].item;

                qpath.segments.forEach((segment, i) => {
                    segment.segmentIndex = i;

                    //collect segments by common midpoint
                    const midpoint = point.add(point.middle(segment.path), qpath.offset);
                    segment.midpoint = midpoint;
                    midPointCollector.addItemToCollection(midpoint, segment);

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
                });

                broken.push(qpath);
                delete active[pathIndex];
            }
        });
    }

    /**
     * @private
     */
    function insertIntoInsideSweepLine(active: ISweepPaths, checks: IQueuedSweepCheckInside[], curr: IQueuedSweepEvent<IQueuedSweepItem>) {
        if (curr.motion === SweepMotion.checkInside) {
            const check = (curr as IQueuedSweepEvent<IQueuedSweepCheckInside>).item;

            //don't bother for segments that are already marked as deleted
            if (!check.segment.deleted) checks.push(check);

        } else {
            const queuedItemPath = curr as IQueuedSweepEvent<IQueuedSweepPath>;
            active[queuedItemPath.item.pathIndex] = queuedItemPath;
        }
    }

    /**
     * @private
     */
    function sweepInsideLines(q: BinaryHeapClass<number, IQueuedSweepEvent<IQueuedSweepItem>>, extents: IMeasureWithCenter, out_insideIntersections: IModel) {

        //establish a sweep line
        const active: ISweepPaths = {};
        const checks: IQueuedSweepCheckInside[] = [];

        //sweep through the heap
        let x = q.findMinimum().key;

        //create a reusable collector for intersection points
        const pointCollector = new Collector<IPoint, IQueuedSweepPath>(compareIntersectionPoint);
        
        while (!q.isEmpty()) {
            let curr = q.extractMinimum();
            if (curr.key > x) {

                //process the sweep line
                checkInsideSweepLine(active, checks, extents, out_insideIntersections, pointCollector);
            }

            //add to the sweep line, at Y. 
            insertIntoInsideSweepLine(active, checks, curr.value);

            x = curr.key;
        }

        //process the final sweep line
        checkInsideSweepLine(active, checks, extents, out_insideIntersections, pointCollector);
    }

    /**
     * @private
     */
    function organizeByModel(active: ISweepPaths) {
        const byModel: { [modelIndex: number]: IQueuedSweepPath[] } = {};
        for (let pathIndex in active) {
            let qpath = active[pathIndex].item;
            if (!byModel[qpath.modelIndex]) byModel[qpath.modelIndex] = [];
            byModel[qpath.modelIndex].push(qpath);
        }
        return byModel;
    }

    /**
     * @private
     */
    function checkInsideSweepLine(active: ISweepPaths, checks: IQueuedSweepCheckInside[], extents: IMeasureWithCenter, out_insideIntersections: IModel, pointCollector: Collector<IPoint, IQueuedSweepPath>) {

        if (checks.length > 0) {
            let byModel: { [modelIndex: number]: IQueuedSweepPath[] };

            checks.forEach(check => {
                let segment = check.segment;
                //if (segment.duplicate) return;

                if (!byModel) byModel = organizeByModel(active);

                for (let modelIndex in byModel) {
                    if (+modelIndex === segment.qpath.modelIndex) continue;

                    let intersectionPoints = getModelIntersectionPoints(segment, byModel[modelIndex], extents, out_insideIntersections, pointCollector);

                    //if number of intersections is an odd number, segment is inside the model
                    if (intersectionPoints && intersectionPoints.length % 2 === 1) {
                        segment.isInside = true;
                        segment.uniqueForeignIntersectionPoints = intersectionPoints;
                        break;
                    }
                }
            });
        }

        //remove each exiting item in the active sweep
        const pathIndexes = Object.keys(active);
        pathIndexes.forEach(_pathIndex => {
            const pathIndex = +_pathIndex;
            if (active[pathIndex].motion === SweepMotion.exit) {
                delete active[pathIndex];
            }
        });

        checks.length = 0;
    }

    /**
     * @private
     */
    function getVerticalTangents(qpath: IQueuedSweepPath): { [x: number]: boolean } {
        const map: { [x: number]: boolean } = {};

        switch (qpath.pathContext.type) {
            case pathType.Circle:
                map[qpath.leftX] = true;
                map[qpath.rightX] = true;
                break;

            case pathType.Arc:
                const arc = qpath.pathContext as IPathArc;
                map[qpath.leftX] = measure.isBetweenArcAngles(180, arc, true);
                map[qpath.rightX] = measure.isBetweenArcAngles(0, arc, true);
                break;

            case pathType.Line:
                const line = qpath.pathContext as IPathLine;
                map[qpath.leftX] = map[qpath.rightX] = line.origin[0] === line.end[0];
                break;
        }

        return map;
    }

    /**
     * @private
     */
    function anyAbove(overlaps: IQueuedSweepPath[], midY: number) {
        for (let i = 0; i < overlaps.length; i++) {
            if (overlaps[i].topY >= midY) return true;
        }
        return false;
    }

    /**
     * @private
     */
    function anyBelow(overlaps: IQueuedSweepPath[], midY: number) {
        for (let i = 0; i < overlaps.length; i++) {
            if (midY >= overlaps[i].bottomY) return true;
        }
        return false;
    }

    /**
     * @private
     */
    const intersectionDelta = .00001;

    /**
     * @private
     */
    function compareIntersectionPoint(pointA: IPoint, pointB: IPoint) {
        var distance = measure.pointDistance(pointA, pointB);
        return distance <= intersectionDelta;
    }

    /**
     * @private
     */
    function getModelIntersectionPoints(segment: IQueuedSweepPathSegment, overlaps: IQueuedSweepPath[], extents: IMeasureWithCenter, out_insideIntersections: IModel, pointCollector: Collector<IPoint, IQueuedSweepPath>) {
        const midY = segment.midpoint[1];

        if (!anyAbove(overlaps, midY) || !anyBelow(overlaps, midY)) {
            return null;
        }

        //for each check, draw a line to nearest boundary
        const x = segment.midpoint[0];
        let outY: number;
        if (midY > extents.center[1]) {
            outY = extents.high[1] + 1;
        } else {
            outY = extents.low[1] - 1;
        }

        const line = new paths.Line(segment.midpoint, [segment.midpoint[0], outY]);
        let lineAddedToOut_insideIntersections = false;

        for (let qpath of overlaps) {

            //lazy compute to see if segment is vertically tangent on enter/exit
            if (!qpath.verticalTangents) {
                qpath.verticalTangents = getVerticalTangents(qpath);
            }

            //skip if the path is vertically tangent at this x
            if (qpath.verticalTangents[x]) continue;

            if (!lineAddedToOut_insideIntersections) {
                model.addPath(out_insideIntersections, line, `check_${segment.qpath.pathId}_${segment.segmentIndex}`);
                lineAddedToOut_insideIntersections = true;

                //reset the point collector
                pointCollector.collections.length = 0;
            }

            let intersectOptions: IPathIntersectionOptions = { path2Offset: qpath.offset };

            let farInt = path.intersection(line, qpath.pathContext, intersectOptions);

            if (farInt) {
                farInt.intersectionPoints.forEach(p => {
                    pointCollector.addItemToCollection(p, qpath);
                });
            }
        }

        //flatten to single array of points
        const intersectionPoints: IPoint[] = [];

        pointCollector.collections.forEach(collection => {

            //for multiple points, reconcile if this was a tangent
            if (collection.items.length > 1) {

                //see if joint is extreme at this point
                const leftX = collection.items.reduce((a, b) => a.leftX < b.leftX ? a : b).leftX;
                const rightX = collection.items.reduce((a, b) => a.rightX > b.rightX ? a : b).rightX;
                const x = collection.key[0];
                const isExtreme = Math.abs(x - leftX) < intersectionDelta || Math.abs(x - rightX) < intersectionDelta;

                if (isExtreme) return;
            }
            intersectionPoints.push(collection.key);
        });

        return intersectionPoints;
    }
}
