namespace MakerJs.models {
    export class Holes implements IModel {

        public paths: IPathMap = {};

        /**
         * Create an array of circles of the same radius from an array of center points.
         * 
         * Example:
         * ```
         * //Create some holes from an array of points
         * var makerjs = require('makerjs');
         * var model = new makerjs.models.Holes(10, [[0, 0],[50, 0],[25, 40]]);
         * var svg = makerjs.exporter.toSVG(model);
         * document.write(svg);
         * ```
         * 
         * @param holeRadius Hole radius.
         * @param points Array of points for origin of each hole.
         * @param ids Optional array of corresponding path ids for the holes.
         */
        constructor(holeRadius: number, points: IPoint[], ids?: string[]) {

            for (var i = 0; i < points.length; i++) {
                var id = ids ? ids[i] : i.toString();
                this.paths[id] = new paths.Circle(points[i], holeRadius);
            }

        }
    }

    (<IKit>Holes).metaParameters = [
        { title: "holeRadius", type: "range", min: .1, max: 10, step: .1, value: 1 },
        {
            title: "points", type: "select", value: [
                [[0, 0], [10, 10], [20, 20], [30, 30], [40, 40], [50, 50], [60, 60], [70, 70], [80, 80]],
                [[0, 0], [0, 25], [0, 50], [0, 75], [0, 100], [25, 50], [50, 50], [75, 50], [100, 100], [100, 75], [100, 50], [100, 25], [100, 0]]]
        }
    ];
}
