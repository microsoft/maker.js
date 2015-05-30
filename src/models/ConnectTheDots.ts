module Maker.Models {

    export class ConnectTheDots implements IMakerModel {

        public paths: IMakerPath[] = [];

        constructor(public isClosed: boolean, public points: IMakerPoint[]) {

            var connect = (a: number, b: number) => {
                this.paths.push(Path.CreateLine("ShapeLine" + i, points[a], points[b]));
            }

            for (var i = 1; i < points.length; i++) {
                connect(i - 1, i);
            }

            if (isClosed && points.length > 2) {
                connect(points.length - 1, 0);
            }
        }
    }
}
