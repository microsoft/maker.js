module Maker.Models {

    export class BoltRectangle implements IMakerModel {

        public paths: IMakerPath[] = [];

        constructor(width: number, height: number, holeRadius: number) {

            var holes = {
                "BottomLeft": [0, 0],
                "BottomRight": [width, 0],
                "TopRight": [width, height],
                "TopLeft": [0, height]
            };

            for (var id in holes) {
                this.paths.push(Path.CreateCircle(id + "_bolt", holes[id], holeRadius));
            }
        }
    }
}