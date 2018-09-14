namespace MakerJs {

    /**
     * Compare keys to see if they are equal.
     */
    export interface ICollectionKeyComparer<K> {
        (a: K, b: K): boolean;
    }

    /**
     * A collection for items that share a common key.
     */
    export interface ICollection<K, T> {
        key: K;
        items: T[];
    }

    /**
     * Collects items that share a common key.
     */
    export class Collector<K, T> {
        public collections: ICollection<K, T>[] = [];

        constructor(private comparer?: ICollectionKeyComparer<K>) {
        }

        public addItemToCollection(key: K, item: T) {
            var found = this.findCollection(key);
            if (found) {
                found.push(item);
            } else {
                var collection: ICollection<K, T> = { key: key, items: [item] };
                this.collections.push(collection);
            }
        }

        public findCollection(key: K, action?: (index: number) => void): T[] {
            for (var i = 0; i < this.collections.length; i++) {
                var collection = this.collections[i];
                if (this.comparer(key, collection.key)) {

                    if (action) {
                        action(i);
                    }

                    return collection.items;
                }
            }
            return null;
        }

        public removeCollection(key: K): boolean {

            if (this.findCollection(key, (index: number) => { this.collections.splice(index, 1); })) {
                return true;
            }

            return false;
        }

        public removeItemFromCollection(key: K, item: T): boolean {

            var collection = this.findCollection(key);

            if (!collection) return;

            for (var i = 0; i < collection.length; i++) {
                if (collection[i] === item) {
                    collection.splice(i, 1);
                    return true;
                }
            }
            return false;
        }

        public getCollectionsOfMultiple(cb: (key: K, items: T[]) => void) {
            for (var i = 0; i < this.collections.length; i++) {
                var collection = this.collections[i];
                if (collection.items.length > 1) {
                    cb(collection.key, collection.items);
                }
            }
        }
    }

    /**
     * @private
     */
    declare class KDBush {
        range(minX: number, minY: number, maxX: number, maxY: number): number[];
        within(x: number, y: number, r: number): number[];
    }

    /**
     * @private
     */
    interface kdbushLib {
        (points: IPoint[]): KDBush;
    }

    /**
     * @private
     */
    const _kdbush = require('kdbush');

    /**
     * @private
     */
    const kdbush = (_kdbush.default || _kdbush) as kdbushLib;

    /**
     * The element type stored in the index of a PointGraph.
     */
    export interface IPointGraphIndexElement {

        /**
         * The point.
         */
        point: IPoint;

        /**
         * The id of this point.
         */
        pointId: number;

        /**
         * Array of other pointId's merged with this one.
         */
        merged?: number[];

        /**
         * Array of valueId's for this point.
         */
        valueIds: number[];

        /**
         * This point's ordinal position in the kd-tree.
         */
        kdId?: number;
    }

    /**
     * A graph of items which may be located on the same points.
     */
    export class PointGraph<T> {

        /**
         * Number of points inserted
         */
        public insertedCount: number;

        /**
         * Map of unique points by x, then y, to a point id. This will remain intact even after merging.
         */
        public graph: { [x: number]: { [y: number]: number } };

        /**
         * Index of points by id.
         */
        public index: { [pointId: number]: IPointGraphIndexElement };

        /**
         * Map of point ids which once existed but have been merged into another id due to close proximity.
         */
        public merged: { [pointId: number]: number };

        /**
         * List of values inserted at points.
         */
        public values: T[];

        /**
         * KD tree object.
         */
        private kdbush: KDBush;

        constructor() {
            this.reset();
        }

        /**
         * Reset the stored points, graphs, lists, to initial state.
         */
        public reset() {
            this.insertedCount = 0;
            this.graph = {};
            this.index = {};
            this.merged = {};
            this.values = [];
        }

        /**
         * Insert a value.
         * @param value Value associated with this point.
         * @returns valueId of the inserted value.
         */
        public insertValue(value: T) {
            this.values.push(value);
            return this.values.length - 1;
        }

        /**
         * Insert a value at a point.
         * @param p Point.
         * @param value Value associated with this point.
         */
        public insertValueIdAtPoint(valueId: number, p: IPoint) {
            const x = p[0], y = p[1];
            if (!this.graph[x]) {
                this.graph[x] = {};
            }
            const pgx = this.graph[x];
            const existed = (y in pgx);
            let el: IPointGraphIndexElement;
            let pointId: number;
            if (!existed) {
                pgx[y] = pointId = this.insertedCount++;
                el = {
                    pointId,
                    point: p,
                    valueIds: [valueId]
                };
                this.index[pointId] = el;
            } else {
                pointId = pgx[y];
                if (pointId in this.merged) {
                    pointId = this.merged[pointId];
                }
                el = this.index[pointId];
                el.valueIds.push(valueId);
            }
            return { existed, pointId };
        }

        /**
         * Merge points within a given distance from each other. Call this after inserting values.
         * @param withinDistance Distance to consider points equal.
         */
        public mergePoints(withinDistance: number) {
            const points: IPoint[] = [];
            const kEls: IPointGraphIndexElement[] = [];
            for (let pointId in this.index) {
                let el = this.index[pointId];
                let p = el.point;
                el.kdId = points.length;
                points.push(p);
                kEls.push(el);
            }
            this.kdbush = kdbush(points);
            for (let pointId in this.index) {
                if (pointId in this.merged) continue;
                let el = this.index[pointId];
                let mergeIds = this.kdbush.within(el.point[0], el.point[1], withinDistance);
                mergeIds.forEach(kdId => {
                    if (kdId === el.kdId) return;
                    this.mergeIndexElements(el, kEls[kdId]);
                });
            }
        }

        /**
         * Finds all points which have only one value associated. Then, merge to the nearest other point within this set.
         * Call this after inserting values.
         * @param withinDistance Distance to consider points equal.
         */
        public mergeNearestSinglePoints(withinDistance: number) {
            const singles: IPointGraphIndexElement[] = [];
            for (let pointId in this.index) {
                let el = this.index[pointId];
                if (el.valueIds.length === 1) {
                    singles.push(el);
                }
            }
            this.kdbush = kdbush(singles.map(el => el.point));
            singles.forEach(el => {
                if (el.pointId in this.merged) return;
                let mergeIds = this.kdbush.within(el.point[0], el.point[1], withinDistance);
                let byDistance: { el: IPointGraphIndexElement, distance: number }[] = [];
                mergeIds.forEach(i => {
                    const other = singles[i];
                    if (other.pointId === el.pointId) return;
                    byDistance.push({ el: other, distance: measure.pointDistance(other.point, el.point) });
                });
                byDistance.sort((a, b) => a.distance - b.distance);
                for (let i = 0; i < byDistance.length; i++) {
                    let other = byDistance[i].el;
                    if (other.pointId in this.merged) continue;
                    if (other.merged && other.merged.length > 0) {
                        this.mergeIndexElements(other, el);
                    } else {
                        this.mergeIndexElements(el, other);
                    }
                    return;
                }
            });
        }

        private mergeIndexElements(keep: IPointGraphIndexElement, remove: IPointGraphIndexElement) {
            keep.merged = keep.merged || [];
            keep.merged.push(remove.pointId);
            this.merged[remove.pointId] = keep.pointId;
            keep.valueIds.push.apply(keep.valueIds, remove.valueIds);
            delete this.index[remove.pointId];
            return keep.pointId;
        }

        /**
         * Iterate over points in the index.
         * @param cb Callback for each point in the index.
         */
        public forEachPoint(cb: (p: IPoint, values: T[], pointId?: number, el?: IPointGraphIndexElement) => void) {
            for (let pointId = 0; pointId < this.insertedCount; pointId++) {
                let el = this.index[pointId];
                if (!el) continue;
                let length = el.valueIds.length;
                if (length > 0) {
                    cb(el.point, el.valueIds.map(i => this.values[i]), pointId, el);
                }
            }
        }

        /**
         * Gets the id of a point, after merging.
         * @param p Point to look up id.
         */
        public getIdOfPoint(p: IPoint) {
            const px = this.graph[p[0]];
            if (px) {
                const pointId = px[p[1]];
                if (pointId >= 0) {
                    if (pointId in this.merged) {
                        return this.merged[pointId];
                    } else {
                        return pointId;
                    }
                }
            }
        }

        /**
         * Get the index element of a point, after merging.
         * @param p Point to look up index element.
         */
        public getElementAtPoint(p: IPoint) {
            const pointId = this.getIdOfPoint(p);
            if (pointId >= 0) {
                return this.index[pointId];
            }
        }
    }
}
