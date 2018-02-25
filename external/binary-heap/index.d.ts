declare interface BinaryHeapNode<K, V> {
    key: K;
    value: V;
}

/**
 * Creates a binary heap.
 *
 * @constructor
 * @param {function} customCompare An optional custom node comparison
 * function.
 */
declare class BinaryHeapClass<K, V> {
    list: BinaryHeapNode<K, V>[];
    constructor(customCompare?: (a: BinaryHeapNode<K, V>, b: BinaryHeapNode<K, V>) => number);
    /**
     * Builds a heap with the provided keys and values, this will discard the
     * heap's current data.
     *
     * @param {Array} keys An array of keys.
     * @param {Array} values An array of values. This must be the same size as the
     * key array.
     */
    buildHeap(keys: K[], values: V[]): void;
    /**
     * Clears the heap's data, making it an empty heap.
     */
    clear(): void;
    /**
     * Extracts and returns the minimum node from the heap.
     *
     * @return {Node} node The heap's minimum node or undefined if the heap is
     * empty.
     */
    extractMinimum(): BinaryHeapNode<K, V>;
    /**
     * Returns the minimum node from the heap.
     *
     * @return {Node} node The heap's minimum node or undefined if the heap is
     * empty.
     */
    findMinimum(): BinaryHeapNode<K, V>;
    /**
     * Inserts a new key-value pair into the heap.
     *
     * @param {Object} key The key to insert.
     * @param {Object} value The value to insert.
     * @return {Node} node The inserted node.
     */
    insert(key: K, value: V): BinaryHeapNode<K, V>;
    /**
     * @return {boolean} Whether the heap is empty.
     */
    isEmpty(): boolean;
    /**
     * @return {number} The size of the heap.
     */
    size(): number;
    /**
     * Joins another heap to this one.
     *
     * @param {BinaryHeapClass} otherHeap The other heap.
     */
    union(otherHeap: BinaryHeapClass<K, V>): void;
}
