module makerjs.models {

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
                this.paths.push(createCircle(id + "_bolt", holes[id], holeRadius));
            }
        }
    }
}