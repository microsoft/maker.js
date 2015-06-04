module makerjs.models {

    export class BoltCircle implements IMakerModel {

        public paths: IMakerPath[] = [];

        constructor(boltRadius: number, holeRadius: number, boltCount: number, firstBoltAngle: number = 0) {

            var a1 = angle.toRadians(firstBoltAngle);
            var a = 2 * Math.PI / boltCount;

            for (var i = 0; i < boltCount; i++) {
                var o = point.fromPolar(a * i + a1, boltRadius);

                this.paths.push(path.CreateCircle("bolt " + i, o, holeRadius));
            }

        }
    }
}