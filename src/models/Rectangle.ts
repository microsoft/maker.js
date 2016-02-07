module MakerJs.models {
    export class Rectangle implements IModel {

        public paths: IPathMap = {};
        
        constructor(width: number, height: number) {
            this.paths = new ConnectTheDots(true, [[0, 0], [width, 0], [width, height], [0, height]]).paths;
        }
    }

    (<IKit>Rectangle).metaParameters = [
        { title: "width", type: "range", min: 1, max: 100, value: 50 },
        { title: "height", type: "range", min: 1, max: 100, value: 100 }
    ];
}
