namespace MakerJs.model {

    /**
     * Finds dead ends and paths which are unchainable.
     */
    export class DeadEndFinder<T> {
        public pointGraph: PointGraph<IDeadEndGraphValue<T>>;
        private list: IPointGraphIndexElement[];
        private removed: IDeadEndGraphValue<T>[];
        private ordinals: { [pointId: number]: number };

        constructor() {
            this.pointGraph = new PointGraph<IDeadEndGraphValue<T>>();
            this.list = [];
            this.removed = [];
            this.ordinals = {};
        }

        public loadItem(endPoints: IPoint[], item: T) {
            const valueId = this.pointGraph.insertValue({ endPoints, item });

            for (var i = 2; i--;) {
                this.pointGraph.insertValueIdAtPoint(valueId, endPoints[i]);
            }
        }

        public findDeadEnds(pointMatchingDistance: number, keep: (item: T) => boolean) {
            if (pointMatchingDistance) {
                this.pointGraph.mergePoints(pointMatchingDistance);
            }
            return this._findDeadEndsInPointGraph(keep);
        }

        private _findDeadEndsInPointGraph(keep: (item: T) => boolean) {

            let i = 0;

            this.pointGraph.forEachPoint((p: IPoint, values: IDeadEndGraphValue<T>[], pointId: number, el: IPointGraphIndexElement) => {
                this.ordinals[pointId] = i++;
                this.list.push(el);
            });

            i = 0;
            while (i < this.list.length) {
                let el = this.list[i];
                if (el.valueIds.length === 1) {
                    this.removePath(el, el.valueIds[0], i);
                } else if (keep && el.valueIds.length % 2) {
                    el.valueIds.forEach(valueId => {
                        const value = this.pointGraph.values[valueId];
                        if (!keep(value.item)) {
                            this.removePath(el, valueId, i);
                        }
                    });
                }
                i++;
            }

            return this.removed;
        }

        public findValidDeadEnds(pointMatchingDistance: number, isValidValue: (value: T) => boolean, makeValidValue: (valuePairs: { valueId: number, value: T }[]) => { valueId: number, value: T }) {
            if (pointMatchingDistance) {
                this.pointGraph.mergePoints(pointMatchingDistance);
            }

            let i = 0;

            this.pointGraph.forEachPoint((p: IPoint, values: IDeadEndGraphValue<T>[], pointId: number, el: IPointGraphIndexElement) => {
                this.ordinals[pointId] = i++;
                this.list.push(el);
            });

            i = 0;
            while (i < this.list.length) {
                let el = this.list[i];

                //get values 
                let invalidValueIds: number[] = [];
                let validValueIds: number[] = [];
                el.valueIds.forEach(valueId => {
                    if (isValidValue(this.pointGraph.values[valueId].item)) {
                        validValueIds.push(valueId);
                    } else {
                        invalidValueIds.push(valueId);
                    }
                });

                if (validValueIds.length === 1 && invalidValueIds.length) {
                    let valuePairs = invalidValueIds.map(valueId => {
                        return {
                            valueId,
                            value: this.pointGraph.values[valueId].item
                        };
                    });
                    const newValidValue = makeValidValue(valuePairs);
                    if (newValidValue) {
                        this.addPath(el, newValidValue.valueId, i);
                    }
                }
                i++;
            }
        }

        private addPath(el: IPointGraphIndexElement, valueId: number, current: number) {
            const value = this.pointGraph.values[valueId];
            const otherPointId = this.getOtherPointId(value.endPoints, el.pointId);
            const otherElement = this.pointGraph.index[otherPointId];

            if (otherElement.valueIds.length > 0) {
                this.appendToList(otherElement, current);
            }
        }

        private removePath(el: IPointGraphIndexElement, valueId: number, current: number) {
            const value = this.pointGraph.values[valueId];
            const otherPointId = this.getOtherPointId(value.endPoints, el.pointId);
            const otherElement = this.pointGraph.index[otherPointId];

            this.removed.push(value);
            this.removeValue(el, valueId);
            this.removeValue(otherElement, valueId);

            if (otherElement.valueIds.length > 0) {
                this.appendToList(otherElement, current);
            }
        }

        private removeValue(el: IPointGraphIndexElement, valueId: number) {
            const pos = el.valueIds.indexOf(valueId);
            if (pos >= 0) {
                el.valueIds.splice(pos, 1);
            }
        }

        private appendToList(el: IPointGraphIndexElement, current: number) {
            let ordinal = this.ordinals[el.pointId];
            if (ordinal < current) {
                this.list[ordinal] = null;
                this.list.push(el);
                this.ordinals[el.pointId] = this.list.length;
            }
        }

        private getOtherPointId(endPoints: IPoint[], pointId: number) {
            for (let i = 0; i < endPoints.length; i++) {
                let id = this.pointGraph.getIdOfPoint(endPoints[i]);
                if (pointId !== id) {
                    return id;
                }
            }
        }
    }

    /**
     * Remove paths from a model which have endpoints that do not connect to other paths.
     * 
     * @param modelContext The model to search for dead ends.
     * @param pointMatchingDistance Optional max distance to consider two points as the same.
     * @param keep Optional callback function (which should return a boolean) to decide if a dead end path should be kept instead.
     * @param trackDeleted Optional callback function which will log discarded paths and the reason they were discarded.
     * @returns The input model (for cascading).
     */
    export function removeDeadEnds(modelContext: IModel, pointMatchingDistance?: number, keep?: IWalkPathBooleanCallback, trackDeleted?: (wp: IWalkPath, reason: string) => void) {
        var deadEndFinder = new DeadEndFinder<IWalkPath>();
        walk(modelContext, {
            onPath: (walkedPath: IWalkPath) => {
                var endPoints = point.fromPathEnds(walkedPath.pathContext, walkedPath.offset);
                if (!endPoints) return;
                deadEndFinder.loadItem(endPoints, walkedPath);
            }
        });
        const removed = deadEndFinder.findDeadEnds(pointMatchingDistance || .005, keep);

        //do not leave an empty model
        if (removed.length < deadEndFinder.pointGraph.values.length) {
            removed.forEach(x => {
                trackDeleted(x.item, 'dead end');
                delete x.item.modelContext.paths[x.item.pathId];
            });
        }

        return modelContext;
    }
}
