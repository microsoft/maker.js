namespace MakerJs.models {

    /**
     * @private
     */
    function getPoints(arg: IPoint[] | number[] | string) {
        var coords: number[];

        if (Array.isArray(arg)) {

            if (isPoint(arg[0])) {
                return arg as IPoint[];
            }

            coords = arg as number[];
        } else {
            coords = importer.parseNumericList(arg as string);
        }

        var points: IPoint[] = [];
        for (var i = 0; i < coords.length; i += 2) {
            points.push([coords[i], coords[i + 1]]);
        }

        return points;
    }

    export class ConnectTheDots implements IModel {

        public paths: IPathMap = {};

        /**
         * Create a model by connecting points designated in a string. The model will be 'closed' - i.e. the last point will connect to the first point.
         * 
         * Example:
         * ```
         * var c = new makerjs.models.ConnectTheDots('-10 0 10 0 0 20'); // 3 coordinates to form a triangle
         * ```
         * 
         * @param numericList String containing a list of numbers which can be delimited by spaces, commas, or anything non-numeric (Note: [exponential notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toExponential) is allowed).
         */
        constructor(numericList: string);

        /**
         * Create a model by connecting points designated in a string. The model may be closed, or left open.
         * 
         * Example:
         * ```
         * var c = new makerjs.models.ConnectTheDots(false, '-10 0 10 0 0 20'); // 3 coordinates to form a polyline
         * ```
         * 
         * @param isClosed Flag to specify if last point should connect to the first point.
         * @param numericList String containing a list of numbers which can be delimited by spaces, commas, or anything non-numeric (Note: [exponential notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toExponential) is allowed).
         */
        constructor(isClosed: boolean, numericList: string);

        /**
         * Create a model by connecting points designated in a numeric array. The model will be 'closed' - i.e. the last point will connect to the first point.
         * 
         * Example:
         * ```
         * var c = new makerjs.models.ConnectTheDots([-10, 0, 10, 0, 0, 20]); // 3 coordinates to form a triangle
         * ```
         * 
         * @param coords Array of coordinates.
         */
        constructor(coords: number[]);

        /**
         * Create a model by connecting points designated in a numeric array. The model may be closed, or left open.
         * 
         * Example:
         * ```
         * var c = new makerjs.models.ConnectTheDots(false, [-10, 0, 10, 0, 0, 20]); // 3 coordinates to form a polyline
         * ```
         * 
         * @param isClosed Flag to specify if last point should connect to the first point.
         * @param coords Array of coordinates.
         */
        constructor(isClosed: boolean, coords: number[]);

        /**
         * Create a model by connecting points designated in an array of points. The model may be closed, or left open.
         * 
         * Example:
         * ```
         * var c = new makerjs.models.ConnectTheDots(false, [[-10, 0], [10, 0], [0, 20]]); // 3 coordinates left open
         * ```
         * 
         * @param isClosed Flag to specify if last point should connect to the first point.
         * @param points Array of IPoints.
         */
        constructor(isClosed: boolean, points: IPoint[]);

        constructor(...args: any[]) {

            var isClosed: boolean;
            var points: IPoint[];

            switch (args.length) {
                case 1:
                    isClosed = true;
                    points = getPoints(args[0]);
                    break;

                case 2:
                    isClosed = args[0] as boolean;
                    points = getPoints(args[1]);
                    break;
            }

            var connect = (a: number, b: number, skipZeroDistance = false) => {
                if (skipZeroDistance && measure.pointDistance(points[a], points[b]) == 0) return;
                this.paths["ShapeLine" + i] = new paths.Line(points[a], points[b]);
            }

            for (var i = 1; i < points.length; i++) {
                connect(i - 1, i);
            }

            if (isClosed && points.length > 2) {
                connect(points.length - 1, 0, true);
            }
        }
    }

    (<IKit>ConnectTheDots).metaParameters = [
        { title: "closed", type: "bool", value: true },
        {
            title: "points", type: "select", value: [
                [[0, 0], [40, 40], [60, 20], [100, 100], [60, 60], [40, 80]],
                [[0, 0], [100, 0], [50, 87]],
                [-10, 0, 10, 0, 0, 20],
                '-10 0 10 0 0 20',
            ]
        }
    ];
}
