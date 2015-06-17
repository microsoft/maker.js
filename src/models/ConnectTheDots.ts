module MakerJs.models {

    export class ConnectTheDots implements IModel {

        public paths: IPath[] = [];

        constructor(public id: string, isClosed: boolean, points: IPoint[]) {

            var connect = (a: number, b: number) => {
                this.paths.push(new paths.Line("ShapeLine" + i, points[a], points[b]));
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
