module MakerJs.models {

    export class ConnectTheDots implements IModel {

        public paths: IPath[] = [];

        constructor(isClosed: boolean, points: IPoint[]);
        constructor(isClosed: boolean, points: number[][]);
        constructor(public isClosed: boolean, public points: any[]) {

            var connect = (a: number, b: number) => {
                this.paths.push(createLine("ShapeLine" + i, points[a], points[b]));
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
