module MakerJs.models {

    export class BoltRectangle implements IModel {

        public paths: IPath[] = [];

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