module MakerJs.models {

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
}
