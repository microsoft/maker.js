namespace MakerJs.models {
    export class Square implements IModel {

        public paths: IPathMap = {};

        constructor(side: number) {
            this.paths =  new Rectangle(side, side).paths;
        }
    }

    (<IKit>Square).metaParameters = [
        { title: "side", type: "range", min: 1, max: 100, value: 100 }
    ];
}
