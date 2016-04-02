namespace MakerJs.models {

    export class ConnectTheDots implements IModel {

        public paths: IPathMap = {};

        constructor(isClosed: boolean, points: IPoint[]) {

            var connect = (a: number, b: number) => {
                this.paths["ShapeLine" + i] = new paths.Line(points[a], points[b]);
            }

            for (var i = 1; i < points.length; i++) {
                connect(i - 1, i);
            }

            if (isClosed && points.length > 2) {
                connect(points.length - 1, 0);
            }
        }
    }

    (<IKit>ConnectTheDots).metaParameters = [
        { title: "closed", type: "bool", value: true },
        {
            title: "points", type: "select", value: [
                [[0, 0], [40, 40], [60, 20], [100, 100], [60, 60], [40, 80] ],
                [[0, 0], [100, 0], [50, 87]]
            ]
        }
    ];
}
