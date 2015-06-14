module MakerJs.models {

    export class BoltRectangle implements IModel {

        public paths: IPath[] = [];

        constructor(public id: string, width: number, height: number, holeRadius: number) {

            var holes: { [id2: string]: IPoint } = {
                "BottomLeft": [0, 0],
                "BottomRight": [width, 0],
                "TopRight": [width, height],
                "TopLeft": [0, height]
            };

            for (var id2 in holes) {
                this.paths.push(createCircle(id2+ "_bolt", holes[id2], holeRadius));
            }
        }
    }
}