namespace MakerJs.models {

    export class RoundRectangle implements IModel {
        public origin: IPoint;
        public paths: IPathMap = {};

        /**
         * Create a round rectangle from width, height, and corner radius.
         * 
         * Example:
         * ```
         * var r = new makerjs.models.RoundRectangle(100, 50, 5);
         * ```
         * 
         * @param width Width of the rectangle.
         * @param height Height of the rectangle.
         * @param radius Corner radius.
         */
        constructor(width: number, height: number, radius: number);

        /**
         * Create a round rectangle which will surround a model.
         * 
         * Example:
         * ```
         * var b = new makerjs.models.BoltRectangle(30, 20, 1); //draw a bolt rectangle so we have something to surround
         * var r = new makerjs.models.RoundRectangle(b, 2.5);   //surround it
         * ```
         * 
         * @param modelToSurround IModel object.
         * @param margin Distance from the model. This will also become the corner radius.
         */
        constructor(modelToSurround: IModel, margin: number);

        constructor(...args: any[]) {
            var width: number;
            var height: number;
            var radius = 0;

            switch (args.length) {

                case 3:
                    width = args[0] as number;
                    height = args[1] as number;
                    radius = args[2] as number;
                    break;

                case 2:
                    radius = args[1] as number;
                    //fall through to 1

                case 1:
                    var m = measure.modelExtents(args[0] as IModel);
                    this.origin = point.subtract(m.low, [radius, radius]);

                    width = m.high[0] - m.low[0] + 2 * radius;
                    height = m.high[1] - m.low[1] + 2 * radius;

                    break;
            }

            var maxRadius = Math.min(height, width) / 2;

            radius = Math.min(radius, maxRadius);

            var wr = width - radius;
            var hr = height - radius;

            if (radius > 0) {
                this.paths["BottomLeft"] = new paths.Arc([radius, radius], radius, 180, 270);
                this.paths["BottomRight"] = new paths.Arc([wr, radius], radius, 270, 0);
                this.paths["TopRight"] = new paths.Arc([wr, hr], radius, 0, 90);
                this.paths["TopLeft"] = new paths.Arc([radius, hr], radius, 90, 180);
            }

            if (wr - radius > 0) {
                this.paths["Bottom"] = new paths.Line([radius, 0], [wr, 0]);
                this.paths["Top"] = new paths.Line([wr, height], [radius, height]);
            }

            if (hr - radius > 0) {
                this.paths["Right"] = new paths.Line([width, radius], [width, hr]);
                this.paths["Left"] = new paths.Line([0, hr], [0, radius]);
            }

        }
    }

    (<IKit>RoundRectangle).metaParameters = [
        { title: "width", type: "range", min: 1, max: 100, value: 50 },
        { title: "height", type: "range", min: 1, max: 100, value: 100 },
        { title: "radius", type: "range", min: 0, max: 50, value: 11 }
    ];
}
