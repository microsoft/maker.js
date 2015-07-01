module MakerJs.models {

    export class BoltCircle implements IModel {

        public paths: IPath[] = [];

        constructor(public id:string, boltRadius: number, holeRadius: number, boltCount: number, firstBoltAngleInDegrees: number = 0) {

            var points = Polygon.getPoints(boltCount, boltRadius, firstBoltAngleInDegrees);

            for (var i = 0; i < boltCount; i++) {
                this.paths.push(new paths.Circle("bolt " + i, points[i], holeRadius));
            }

        }
    }
}