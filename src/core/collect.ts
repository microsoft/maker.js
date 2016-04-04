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

}
