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

    export interface IPointGraphIndexCard {
        pointIndex: number;
        point: IPoint;
        merged?: number[];
        distances: { [pointIndex: number]: number };
        shortest?: number[];
        valueIndexes: number[];
    }

    export class PointGraph<T> {
        private pointCount: number;
        public graph: { [x: number]: { [y: number]: number } };
        public index: { [pointIndex: number]: IPointGraphIndexCard };
        public merged: { [pointIndex: number]: number };
        public values: T[];

        constructor() {
            this.pointCount = 0;
            this.graph = {};
            this.index = {};
            this.merged = {};
            this.values = [];
        }

        public insertValue(p: IPoint, value: T, mergeWithinDistance?: number) {
            const x = p[0], y = p[1];
            if (!this.graph[x]) this.graph[x] = {};
            const pgx = this.graph[x];
            if (!(y in pgx)) pgx[y] = this.pointCount++;
            let pointIndex = pgx[y];

            if (pointIndex in this.merged) {
                pointIndex = this.merged[pointIndex];
            }

            //get existing point or create a new one
            let card: IPointGraphIndexCard;
            const cardExisted = (pointIndex in this.index);
            if (cardExisted) {
                card = this.index[pointIndex];
                card.valueIndexes.push(this.values.length);
            } else {
                card = {
                    pointIndex,
                    point: p,
                    distances: {},
                    valueIndexes: [this.values.length]
                };
                this.index[pointIndex] = card;
            }

            this.values.push(value);

            if (!cardExisted && mergeWithinDistance) {
                return this.tryMergePoint(pointIndex, mergeWithinDistance, card);
            }

            return pointIndex;
        }

        public calculatePointDistance(pointIndex: number, card?: IPointGraphIndexCard) {
//            const shortHeap = new BinaryHeap<number, number>();
            card = card || this.index[pointIndex];
            for (let _otherPointIndex in this.index) {
                let otherPointIndex = +_otherPointIndex;
                if (otherPointIndex === pointIndex) continue;
                let otherCard = this.index[otherPointIndex];
                let d: number;
                if (otherPointIndex in card.distances) {
                    d = card.distances[otherPointIndex];
                } else {
                    d = measure.pointDistance(card.point, otherCard.point);
                    card.distances[otherPointIndex] = d;
                    otherCard.distances[pointIndex] = d;
                }
  //              shortHeap.insert(d, otherPointIndex);
            }
            // const shortest: number[] = [];
            // while (!shortHeap.isEmpty()) {
            //     shortest.push(shortHeap.extractMinimum().value);
            // }
            // card.shortest = shortest;
        }

        public forEachPoint(cb: (p: IPoint, values: T[], pointIndex?: number, card?: IPointGraphIndexCard) => void) {
            for (let pointIndex = 0; pointIndex < this.pointCount; pointIndex++) {
                let card = this.index[pointIndex];
                if (!card) continue;
                let length = card.valueIndexes.length;
                if (length > 0) {
                    cb(card.point, card.valueIndexes.map(i => this.values[i]), pointIndex, card);
                }
            }
        }

        private tryMergePoint(pointIndex: number, withinDistance: number, card?: IPointGraphIndexCard) {
            card = card || this.index[pointIndex];
            //this.calculatePointDistance(pointIndex, card);
            for (let _otherPointIndex in this.index) {
                if (_otherPointIndex in this.merged) continue;
                let otherPointIndex = +_otherPointIndex;
                if (otherPointIndex === pointIndex) continue;
                //let d = card.distances[otherPointIndex];
                let otherCard = this.index[otherPointIndex];
                let d = measure.pointDistance(card.point, otherCard.point);
                if (d <= withinDistance) {
                    this.mergeCard(otherCard, card);
                    return otherPointIndex;
                } else {
                    card.distances[otherPointIndex] = d;
                    otherCard.distances[pointIndex] = d;
                }
            }
            return pointIndex;
        }

        public mergeCard(keepCard: IPointGraphIndexCard, deleteCard: IPointGraphIndexCard) {
            keepCard.merged = keepCard.merged || [];
            keepCard.merged.push(deleteCard.pointIndex);
            this.merged[deleteCard.pointIndex] = keepCard.pointIndex;
            keepCard.valueIndexes.push.apply(keepCard.valueIndexes, deleteCard.valueIndexes);
            delete this.index[deleteCard.pointIndex];
            return keepCard.pointIndex;
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

        // public mergePoints(withinDistance: number) {
        //     this.forEachPoint((p, values, pointIndex, card) => {
        //         this.tryMergePoint(pointIndex, withinDistance, card);
        //     });
        // }

        //call with .002
        // public findSinglesAndTriples(withinDistance: number) {
        //     const singlePointIndexes: number[] = [];
        //     const triplePointIndexes: number[] = [];

        //     this.forEachPoint((p, values, pointIndex, card) => {
        //         if (card.merged) return;
        //         let length = card.valueIndexes.length;
        //         if (length === 1) {
        //             let itemIndex = card.valueIndexes[0];
        //             if (!card.shortest) this.calculatePointDistance(pointIndex);
        //             if (card.shortest.distance <= withinDistance) {
        //                 let otherPointIndex = card.shortest.pointIndex;
        //                 let otherCard = this.index[otherPointIndex];
        //                 if (otherCard.valueIndexes.length === 1) {
        //                     let otherItemIndex = otherCard.valueIndexes[0];
        //                     if (itemIndex !== otherItemIndex) {
        //                         if (!otherCard.shortest) this.calculatePointDistance(otherPointIndex);
        //                         if (otherCard.shortest.pointIndex === pointIndex) {
        //                             card.merged = otherPointIndex;
        //                             card.valueIndexes.push(otherCard.valueIndexes[0]);
        //                             delete this.index[otherPointIndex];
        //                         }
        //                     }
        //                 }
        //             }
        //             if (!card.merged) {
        //                 singlePointIndexes.push(pointIndex);
        //             }
        //         } else if (length === 3) {
        //             triplePointIndexes.push(pointIndex);
        //         }
        //     });
        //     console.log(singlePointIndexes);
        // }

        // singlePointIndexes.forEach(pointIndex => {
        //     const shortest: IShortest = {
        //         distance: null,
        //         pointIndex: null
        //     };
        //     const single = pg.index[pointIndex];
        //     singlePointIndexes.forEach(otherPointIndex => {
        //         if (otherPointIndex === pointIndex) return;
        //         const d = single.distances[otherPointIndex];
        //         if (shortest.distance === null || d < shortest.distance) {
        //             shortest.distance = d;
        //             shortest.pointIndex = otherPointIndex;
        //         }
        //     });
        //     console.log(`shortest from ${single.pointIndex} is ${shortest.pointIndex} (${shortest.distance})`);
        // });

    }
    
}
