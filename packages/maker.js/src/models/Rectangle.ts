namespace MakerJs.models {
    export class Rectangle implements IModel {

        public paths: IPathMap = {};
        public origin: IPoint;

        /**
         * Create a rectangle from width and height.
         * 
         * Example:
         * ```
         * //Create a rectangle from width and height
         * var makerjs = require('makerjs');
         * var model = new makerjs.models.Rectangle(50, 100);
         * var svg = makerjs.exporter.toSVG(model);
         * document.write(svg);
         * ```
         * 
         * @param width Width of the rectangle.
         * @param height Height of the rectangle.
         */
        constructor(width: number, height: number);

        /**
         * Create a rectangle which will surround a model.
         * 
         * Example:
         * ```
         * //Create a rectangle which will surround a model
         * var makerjs = require('makerjs');
         * var e = new makerjs.models.Ellipse(17, 10); // draw an ellipse so we have something to surround.
         * var r = new makerjs.models.Rectangle(e, 3); // draws a rectangle surrounding the ellipse by 3 units.
         * var svg = makerjs.exporter.toSVG({ models: { e: e, r: r }});
         * document.write(svg);
         * ```
         * 
         * @param modelToSurround IModel object.
         * @param margin Optional distance from the model.
         */
        constructor(modelToSurround: IModel, margin?: number);

        /**
         * Create a rectangle from a measurement.
         * 
         * Example:
         * ```
         * //Create a rectangle from a measurement.
         * var makerjs = require('makerjs');
         * var e = new makerjs.models.Ellipse(17, 10); // draw an ellipse so we have something to measure.
         * var m = makerjs.measure.modelExtents(e);    // measure the ellipse.
         * var r = new makerjs.models.Rectangle(m);    // draws a rectangle surrounding the ellipse.
         * var svg = makerjs.exporter.toSVG({ models: { e: e, r: r }});
         * document.write(svg);
         * ```
         * 
         * @param measurement IMeasure object. See http://maker.js.org/docs/api/modules/makerjs.measure.html#pathextents and http://maker.js.org/docs/api/modules/makerjs.measure.html#modelextents to get measurements of paths and models.
         */
        constructor(measurement: IMeasure);

        constructor(...args: any[]) {
            var width: number;
            var height: number;

            if (args.length === 2 && !isObject(args[0])) {
                width = args[0] as number;
                height = args[1] as number;
            } else {

                var margin = 0;
                var m: IMeasure;

                if (isModel(args[0])) {
                    m = measure.modelExtents(args[0] as IModel);
                    if (args.length === 2) {
                        margin = args[1] as number;
                    }
                } else {
                    //use measurement
                    m = args[0] as IMeasure;
                }

                this.origin = point.subtract(m.low, [margin, margin]);

                width = m.high[0] - m.low[0] + 2 * margin;
                height = m.high[1] - m.low[1] + 2 * margin;
            }

            this.paths = new ConnectTheDots(true, [[0, 0], [width, 0], [width, height], [0, height]]).paths;
        }
    }

    (<IKit>Rectangle).metaParameters = [
        { title: "width", type: "range", min: 1, max: 100, value: 50 },
        { title: "height", type: "range", min: 1, max: 100, value: 100 }
    ];
}
