/// <reference path="polygon.ts" />

module MakerJs.models {

    export class BoltCircle implements IModel {

        public paths: IPathMap = {};

        constructor(boltRadius: number, holeRadius: number, boltCount: number, firstBoltAngleInDegrees: number = 0) {

            var points = Polygon.getPoints(boltCount, boltRadius, firstBoltAngleInDegrees);

            for (var i = 0; i < boltCount; i++) {
                this.paths["bolt " + i] = new paths.Circle(points[i], holeRadius);
            }

        }
    }
}