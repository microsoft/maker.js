namespace MakerJs.models {

    export class BoltRectangle implements IModel {

        public paths: IPathMap = {};

        constructor(width: number, height: number, holeRadius: number) {

            var points = [[0, 0], [width, 0], [width, height], [0, height]];
            var ids = ["BottomLeft_bolt", "BottomRight_bolt", "TopRight_bolt", "TopLeft_bolt"];

            this.paths = new Holes(holeRadius, points, ids).paths;
        }
    }

    (<IKit>BoltRectangle).metaParameters = [
        { title: "width", type: "range", min: 1, max: 100, value: 100 },
        { title: "height", type: "range", min: 1, max: 100, value: 50 },
        { title: "hole radius", type: "range", min: 1, max: 50, value: 5 }
    ];
}
