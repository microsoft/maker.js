namespace MakerJs.models {

    export class Oval implements IModel {

        public paths: IPathMap = {};

        constructor(width: number, height: number) {
            this.paths = new RoundRectangle(width, height, Math.min(height / 2, width / 2)).paths;
        }

    }

    (<IKit>Oval).metaParameters = [
        { title: "width", type: "range", min: 1, max: 100, value: 50 },
        { title: "height", type: "range", min: 1, max: 100, value: 100 }
    ];
}
