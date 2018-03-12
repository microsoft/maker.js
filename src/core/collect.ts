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

    interface kdbush {
        (points: IPoint[]): KDBush;
    }

    declare class KDBush {
        range(minX: number, minY: number, maxX: number, maxY: number): number[];
        within(x: number, y: number, r: number): number[];
    }

    /**
     * @private
     */
    const kdbush = require('kdbush') as kdbush;

    export interface IPointGraphIndexCard {
        pointIndex: number;
        point: IPoint;
        merged?: number[];
        valueIndexes: number[];
        kdIndex?: number;
    }

    export class PointGraph<T> {
        public insertedCount: number;
        public graph: { [x: number]: { [y: number]: number } };
        public index: { [pointIndex: number]: IPointGraphIndexCard };
        public merged: { [pointIndex: number]: number };
        public values: T[];

        constructor() {
            this.reset();
        }

        public reset() {
            this.insertedCount = 0;
            this.graph = {};
            this.index = {};
            this.merged = {};
            this.values = [];
        }

        public insertValue(p: IPoint, value: T) {
            const x = p[0], y = p[1];
            if (!this.graph[x]) {
                this.graph[x] = {};
            }
            const pgx = this.graph[x];
            const existed = (y in pgx);
            let card: IPointGraphIndexCard;
            let pointIndex: number;
            if (!existed) {
                pgx[y] = pointIndex = this.insertedCount++;
                card = {
                    pointIndex,
                    point: p,
                    valueIndexes: [this.values.length]
                };
                this.index[pointIndex] = card;
            } else {
                pointIndex = pgx[y];
                if (pointIndex in this.merged) {
                    pointIndex = this.merged[pointIndex];
                }
                card = this.index[pointIndex];
                card.valueIndexes.push(this.values.length);
            }
            this.values.push(value);
            return { existed, pointIndex};
        }

        public mergePoints(withinDistance: number) {
            const points: IPoint[] = [];
            const kCards: IPointGraphIndexCard[] = [];
            for(let pointIndex in this.index) {
                let card = this.index[pointIndex];
                let p = card.point;
                card.kdIndex = points.length;
                points.push(p);
                kCards.push(card);
            }
            const k = kdbush(points);
            for (let pointIndex in this.index) {
                if (pointIndex in this.merged) continue;
                let card = this.index[pointIndex];
                let mergeIds = k.within(card.point[0], card.point[1], withinDistance);
                mergeIds.forEach(kdIndex => {
                    if (kdIndex === card.kdIndex) return;
                    this.mergeCard(card, kCards[kdIndex]);
                });
            }
        }

        public mergeCard(keepCard: IPointGraphIndexCard, deleteCard: IPointGraphIndexCard) {
            keepCard.merged = keepCard.merged || [];
            keepCard.merged.push(deleteCard.pointIndex);
            this.merged[deleteCard.pointIndex] = keepCard.pointIndex;
            keepCard.valueIndexes.push.apply(keepCard.valueIndexes, deleteCard.valueIndexes);
            delete this.index[deleteCard.pointIndex];
            return keepCard.pointIndex;
        }

        public forEachPoint(cb: (p: IPoint, values: T[], pointIndex?: number, card?: IPointGraphIndexCard) => void) {
            for (let pointIndex = 0; pointIndex < this.insertedCount; pointIndex++) {
                let card = this.index[pointIndex];
                if (!card) continue;
                let length = card.valueIndexes.length;
                if (length > 0) {
                    cb(card.point, card.valueIndexes.map(i => this.values[i]), pointIndex, card);
                }
            }
        }

        public byValueIndexesLength() {
            const cardsByLength: { [length: number]: IPointGraphIndexCard[] } = {};
            this.forEachPoint((p, values, pointIndex, card) => {
                let length = card.valueIndexes.length;
                if (!(length in cardsByLength)) cardsByLength[length] = [];
                cardsByLength[length].push(card);
            });
            return cardsByLength;
        }
    }
}
