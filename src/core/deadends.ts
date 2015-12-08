/// <reference path="model.ts" />

module MakerJs.model {

    /**
     * @private
     */
    interface IRefPathEndpoints extends IRefPathIdInModel {
        endPoints: string[];
    }

    /**
     * @private
     */
    interface IRefPathEndpointsMap {
        [serializedPoint: string]: IRefPathEndpoints;
    }

    /**
     * @private
     */
    interface IRefPathEndpointsArrayMap {
        [serializedPoint: string]: IRefPathEndpoints[];
    }

    /**
     * @private
     */
    class DeadEndFinder {

        private pointMap: IRefPathEndpointsArrayMap = {};

        constructor(public pointMatchingDistance) {
        }

        public addPathRef(serializedPoint: string, pathRef: IRefPathEndpoints) {
            if (!(serializedPoint in this.pointMap)) {
                this.pointMap[serializedPoint] = [];
            }

            this.pointMap[serializedPoint].push(pathRef);
        }

        private removePathRef(pathRef: IRefPathEndpoints) {

            var removePath = (serializedPoint: string) => {
                var endpointArray = this.pointMap[serializedPoint];

                for (var i = 0; i < endpointArray.length; i++) {
                    if (endpointArray[i] === pathRef) {
                        endpointArray.splice(i, 1);
                        return;
                    }
                }
            }

            for (var i = 2; i--;) {
                removePath(pathRef.endPoints[i]);
            }
        }

        public removeDeadEnd(): boolean {

            var singlePoints: IRefPathEndpointsMap = {};

            for (var p in this.pointMap) {
                if (this.pointMap[p].length == 1) {
                    singlePoints[p] = this.pointMap[p][0];
                }
            }

            for (var p1 in singlePoints) {
                var merge = false;

                for (var p2 in singlePoints) {
                    if (p1 == p2) continue;

                    //compare the distance
                    var d = measure.pointDistance(<IPoint>JSON.parse(p1), <IPoint>JSON.parse(p2));
                    if (d > this.pointMatchingDistance) continue;

                    merge = true;
                    break;
                }

                if (merge) {

                    this.removePathRef(singlePoints[p2]);
                    delete this.pointMap[p2];

                    for (var i = 2; i--;) {
                        if (singlePoints[p2].endPoints[i] == p2) {
                            singlePoints[p2].endPoints[i] = p1
                        }
                        this.pointMap[singlePoints[p2].endPoints[i]].push(singlePoints[p2]);
                    }

                } else {
                    var pathRef = singlePoints[p1];

                    this.removePathRef(pathRef);

                    delete pathRef.modelContext.paths[pathRef.pathId];
                }

                //only do the first point
                return true;
            }

            //no single points found
            return false;
        }
    }

    export function removeDeadEnds(modelContext: IModel, pointMatchingDistance = .005) {
        var serializedPointAccuracy = .0001;
        var deadEndFinder = new DeadEndFinder(pointMatchingDistance);

        walkPaths(modelContext, function(modelContext: IModel, pathId: string, pathContext: IPath) {
            var endPoints = point.fromPathEnds(pathContext);

            if(!endPoints) return;

            var pathRef: IRefPathEndpoints = { modelContext: modelContext, pathId: pathId, endPoints: [] };

            for (var i = 2; i--;) {
                var serializedPoint = point.serialize(endPoints[i], serializedPointAccuracy);

                pathRef.endPoints.push(serializedPoint);

                deadEndFinder.addPathRef(serializedPoint, pathRef);
            }
        });

        while(deadEndFinder.removeDeadEnd()); 
    }
}
