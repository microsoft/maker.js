module MakerJs.models {

    export class BoltCircle implements IModel {

        public paths: IPath[] = [];

        constructor(public id:string, boltRadius: number, holeRadius: number, boltCount: number, firstBoltAngle: number = 0) {

            var a1 = angle.toRadians(firstBoltAngle);
            var a = 2 * Math.PI / boltCount;

            for (var i = 0; i < boltCount; i++) {
                var o = point.fromPolar(a * i + a1, boltRadius);

                this.paths.push(createCircle("bolt " + i, o, holeRadius));
            }

        }
    }
}