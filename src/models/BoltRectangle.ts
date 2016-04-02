namespace MakerJs.models {

    export class BoltRectangle implements IModel {

        public paths: IPathMap = {};

        constructor(width: number, height: number, holeRadius: number) {

            var holes: { [id2: string]: IPoint } = {
                "BottomLeft": [0, 0],
                "BottomRight": [width, 0],
                "TopRight": [width, height],
                "TopLeft": [0, height]
            };

            for (var id2 in holes) {
                this.paths[id2 + "_bolt"] = new paths.Circle(holes[id2], holeRadius);
            }
        }
    }

    (<IKit>BoltRectangle).metaParameters = [
        { title: "width", type: "range", min: 1, max: 100, value: 100 },
        { title: "height", type: "range", min: 1, max: 100, value: 50 },
        { title: "hole radius", type: "range", min: 1, max: 50, value: 5 }
    ];
}
