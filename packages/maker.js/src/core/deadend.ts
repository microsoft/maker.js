namespace MakerJs.model {

    /**
     * @private
     */
    interface IWalkPathWithEndpoints extends IWalkPath {
        endPoints: IPoint[];
    }

    /**
     * @private
     */
    interface IDeadEndFinderOptions {
        pointMatchingDistance?: number;
        keep?: IWalkPathBooleanCallback;
    }

    /**
     * @private
     */
    class DeadEndFinder {
        public pointMap: PointGraph<IWalkPathWithEndpoints>;
        private list: IPointGraphIndexElement[];
        private removed: IWalkPathWithEndpoints[];
        private ordinals: { [pointId: number]: number };

        constructor(public modelContext: IModel, public options: IDeadEndFinderOptions) {
            this.pointMap = new PointGraph<IWalkPathWithEndpoints>();
            this.list = [];
            this.removed = [];
            this.ordinals = {};
            this.load();
        }

        private load() {
            var walkOptions: IWalkOptions = {
                onPath: (walkedPath: IWalkPath) => {
                    var endPoints = point.fromPathEnds(walkedPath.pathContext, walkedPath.offset);

                    if (!endPoints) return;

                    var pathRef = <IWalkPathWithEndpoints>walkedPath;
                    pathRef.endPoints = endPoints;

                    const valueId = this.pointMap.insertValue(pathRef);

                    for (var i = 2; i--;) {
                        this.pointMap.insertValueIdAtPoint(valueId, endPoints[i]);
                    }
                }
            };

            walk(this.modelContext, walkOptions);

            if (this.options.pointMatchingDistance) {
                this.pointMap.mergePoints(this.options.pointMatchingDistance);
            }
        }

        public findDeadEnds() {
            let i = 0;

            this.pointMap.forEachPoint((p: IPoint, values: IWalkPathWithEndpoints[], pointId: number, el: IPointGraphIndexElement) => {
                this.ordinals[pointId] = i++;
                this.list.push(el);
            });

            i = 0;
            while (i < this.list.length) {
                let el = this.list[i];
                if (el.valueIds.length === 1) {
                    this.removePath(el, el.valueIds[0], i);
                } else if (this.options.keep && el.valueIds.length % 2) {
                    el.valueIds.forEach(valueId => {
                        const value = this.pointMap.values[valueId];
                        if (!this.options.keep(value)) {
                            this.removePath(el, valueId, i);
                        }
                    });
                }
                i++;
            }

            return this.removed;
        }

        private removePath(el: IPointGraphIndexElement, valueId: number, current: number) {
            const value = this.pointMap.values[valueId];
            const otherPointId = this.getOtherPointId(value.endPoints, el.pointId);
            const otherElement = this.pointMap.index[otherPointId];

            this.removed.push(value);
            this.removeValue(el, valueId);
            this.removeValue(otherElement, valueId);

            if (otherElement.valueIds.length > 0) {
                this.appendQueue(otherElement, current);
            }
        }

        private removeValue(el: IPointGraphIndexElement, valueId: number) {
            const pos = el.valueIds.indexOf(valueId);
            if (pos >= 0) {
                el.valueIds.splice(pos, 1);
            }
        }

        private appendQueue(el: IPointGraphIndexElement, current: number) {
            let otherOrdinal = this.ordinals[el.pointId];
            if (otherOrdinal < current) {
                this.list[otherOrdinal] = null;
                this.list.push(el);
                this.ordinals[el.pointId] = this.list.length;
            }
        }

        private getOtherPointId(endPoints: IPoint[], pointId: number) {
            for (let i = 0; i < endPoints.length; i++) {
                let id = this.pointMap.getIdOfPoint(endPoints[i]);
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
        const options: IDeadEndFinderOptions = {
            pointMatchingDistance: pointMatchingDistance || .005,
            keep
        };

        var deadEndFinder = new DeadEndFinder(modelContext, options);

        const removed = deadEndFinder.findDeadEnds();

        //do not leave an empty model
        if (removed.length < deadEndFinder.pointMap.values.length) {
            removed.forEach(wp => {
                trackDeleted(wp, 'dead end');
                delete wp.modelContext.paths[wp.pathId];
            });
        }

        return modelContext;
    }
}
