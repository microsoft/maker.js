namespace MakerJs.models {
    export class Rectangle implements IModel {

        public paths: IPathMap = {};
        public origin: IPoint;
        
        constructor(width: number, height: number);
        constructor(measurement: IMeasure);
        constructor(...args: any[]) {
            var width: number;
            var height: number;

            if (args.length == 2) {
                width = args[0];
                height = args[1];
            } else {
                //use measurement
                var m = args[0] as IMeasure;
                this.origin = m.low;

                width = m.high[0] - m.low[0];
                height = m.high[1] - m.low[1];
            }

            this.paths = new ConnectTheDots(true, [[0, 0], [width, 0], [width, height], [0, height]]).paths;
        }
    }

    (<IKit>Rectangle).metaParameters = [
        { title: "width", type: "range", min: 1, max: 100, value: 50 },
        { title: "height", type: "range", min: 1, max: 100, value: 100 }
    ];
}
