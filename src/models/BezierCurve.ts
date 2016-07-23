namespace MakerJs.models {

    var hasLib = false;

    function ensureBezierLib() {

        if (hasLib) return;

        try {
            var lib = Bezier.prototype;
            hasLib = true;
        }
        catch (e) {
            throw "Bezier library not found. If you are using Node, try running 'npm install' or if you are in the browser, download http://pomax.github.io/bezierjs/bezier.js to your website and add a script tag.";
        }
    }

    /**
     * @private
     */
    var scratch: BezierJs.Bezier;

    /**
     * @private
     */
    function getScratch(seed: IPathBezierSeed) {

        var points: IPoint[] = [seed.origin];
        points.push.apply(points, seed.controls);
        points.push(seed.end);

        var bezierJsPoints = points.map(function (p: IPoint) {
            var bp: BezierJs.Point = {
                x: p[0], y: p[1]
            };
            return bp;
        });

        if (!scratch) {

            ensureBezierLib();
            scratch = new Bezier(bezierJsPoints);
        } else {
            scratch.points = bezierJsPoints;
            scratch.update();
        }

        return scratch;
    }

    /**
     * @private
     */
    function BezierToSeed(b: BezierJs.Bezier, range?: IBezierRange): IPathBezierSeed {
        var points = b.points.map(function (p) { return [p.x, p.y] as IPoint; });
        var seed = new BezierSeed(points) as IPathBezierSeed;
        if (range) {
            seed.parentRange = range;
        }
        return seed;
    }

    /**
     * @private
     */
    function seedToBezier(seed: IPathBezierSeed): BezierJs.Bezier {
        var coords: number[] = [];

        coords.push.apply(coords, seed.origin);
        coords.push.apply(coords, seed.controls[0]);
        if (seed.controls.length > 1) {
            coords.push.apply(coords, seed.controls[1]);
        }
        coords.push.apply(coords, seed.end);

        ensureBezierLib();
        return new Bezier(coords);
    }

    /**
     * @private
     */
    function getArcs(b: BezierJs.Bezier, accuracy: number): IPathArcInBezierCurve[] {

        var arcs = b.arcs(accuracy);

        return arcs.map(function (a) {
            var arc = new paths.Arc([a.x, a.y], a.r, angle.toDegrees(a.s), angle.toDegrees(a.e)) as IPathArcInBezierCurve;
            arc.bezierData = { startT: a.interval.start, endT: a.interval.end };
            return arc;
        });
    }

    /**
     * @private
     * Class for bezier seed.
     */
    class BezierSeed implements IPathBezierSeed {
        public type: string;
        public origin: IPoint;
        public end: IPoint
        public controls: IPoint[];

        /**
         * Class for bezier seed, created from point array.
         * 
         * @param points Array of points, with the first being the origin, and the last being the end, and points between used as control points.
         */
        constructor(points: IPoint[]);

        /**
         * Class for quadratic bezier seed.
         * 
         * @param origin The origin point of the curve.
         * @param control The control point of the curve.
         * @param end The end point of the curve.
         */
        constructor(origin: IPoint, control: IPoint, end: IPoint);

        /**
         * Class for cubic bezier seed.
         * 
         * @param origin The origin point of the curve.
         * @param controls The control points of the curve.
         * @param end The end point of the curve.
         */
        constructor(origin: IPoint, controls: IPoint[], end: IPoint);

        /**
         * Class for cubic bezier seed.
         * 
         * @param origin The origin point of the curve.
         * @param control1 The control point of the curve origin.
         * @param control1 The control point of the curve end.
         * @param end The end point of the curve.
         */
        constructor(origin: IPoint, control1: IPoint, control2: IPoint, end: IPoint);

        constructor(...args: any[]) {
            this.type = pathType.BezierSeed;

            switch (args.length) {

                case 1: //point array
                    var points = args[0] as IPoint[];

                    this.origin = points[0];

                    if (points.length === 3) {
                        this.controls = [points[1]];
                        this.end = points[2];

                    } else if (points.length === 4) {
                        this.controls = [points[1], points[2]];
                        this.end = points[3];

                    } else {
                        this.end = points[1];
                    }

                    break;

                case 3: //quadratic or cubic
                    if (Array.isArray(args[1])) {
                        this.controls = args[1] as IPoint[];
                    } else {
                        this.controls = [args[1] as IPoint];
                    }

                    this.end = args[2] as IPoint;
                    break;

                case 4: //cubic params
                    this.controls = [args[1] as IPoint, args[2] as IPoint];
                    this.end = args[3] as IPoint;
                    break;
            }

        }
    }

    export class BezierCurve implements IModel {

        public models: IModelMap;
        public paths: IPathMap;
        public origin: IPoint;
        public type = BezierCurve.typeName;
        public seed: IPathBezierSeed;
        public accuracy: number;

        constructor(points: IPoint[], accuracy?: number);
        constructor(seed: IPathBezierSeed, accuracy?: number);
        constructor(seed: IPathBezierSeed, isChild: boolean, accuracy?: number);
        constructor(origin: IPoint, control: IPoint, end: IPoint, accuracy?: number);
        constructor(origin: IPoint, controls: IPoint[], end: IPoint, accuracy?: number);
        constructor(origin: IPoint, control1: IPoint, control2: IPoint, end: IPoint, accuracy?: number);

        constructor(...args: any[]) {

            var isLeaf = false;

            var isArrayArg0 = Array.isArray(args[0]);

            switch (args.length) {

                case 2:
                    if (isArrayArg0) {
                        this.accuracy = args[1] as number;
                    } else {
                        //seed
                        this.seed = args[0] as IPathBezierSeed;

                        if (typeof args[1] === "boolean") {
                            isLeaf = args[1] as boolean;
                        } else {
                            this.accuracy = args[1] as number;
                        }

                        break;
                    }
                //fall through to point array

                case 1: //point array or seed
                    if (isArrayArg0) {

                        var points = args[0] as IPoint[];

                        this.seed = new BezierSeed(points);
                    } else {
                        this.seed = args[0] as IPathBezierSeed;
                    }
                    break;

                default:
                    switch (args.length) {
                        case 4:
                            if (isPoint(args[3])) {
                                this.seed = new BezierSeed(args as IPoint[]);
                                break;
                            } else {
                                this.accuracy = args[3] as number;
                                //fall through
                            }
                        case 3:
                            if (isArrayArg0) {
                                this.seed = new BezierSeed(args.slice(0, 3) as IPoint[]);
                            } else {
                                this.seed = args[0] as IPathBezierSeed;
                                isLeaf = args[1] as boolean;
                                this.accuracy = args[2] as number;
                            }
                            break;

                        case 5:
                            this.accuracy = args[4] as number;
                            this.seed = new BezierSeed(args.slice(0, 4) as IPoint[]);
                            break;
                    }
                    break;
            }

            this.paths = {};

            if (measure.isBezierSeedLinear(this.seed)) {
                //use a line and exit
                this.paths = {
                    'Line': new paths.Line(point.clone(this.seed.origin), point.clone(this.seed.end))
                };
                return;
            }

            var b = seedToBezier(this.seed);

            if (!isLeaf) {

                //breaking the bezier into its extrema will make the models better correspond to rectangular measurements.
                //however, the potential drawback is that these broken curves will not get reconciled to this overall curve.
                var extrema = b.extrema().values;

                //remove leading zero
                if (extrema.length > 0 && extrema[0] === 0) {
                    extrema.shift();
                }

                //remove ending 1
                if (extrema.length > 0 && extrema[extrema.length - 1] === 1) {
                    extrema.pop();
                }

                if (extrema.length === 0) {
                    isLeaf = true;
                } else {
                    //need to create children

                    //this will not contain paths, but will contain other curves
                    this.models = {}

                    var childSeeds: IPathBezierSeed[] = [];

                    if (extrema.length === 1) {
                        var split = b.split(extrema[0]);
                        childSeeds.push(
                            BezierToSeed(split.left, { startT: 0, endT: extrema[0] }),
                            BezierToSeed(split.right, { startT: extrema[0], endT: 1 })
                        );
                    } else {

                        //add 0 and 1 endings
                        extrema.unshift(0);
                        extrema.push(1);

                        for (var i = 1; i < extrema.length; i++) {
                            //get the bezier between 
                            childSeeds.push(BezierToSeed(b.split(extrema[i - 1], extrema[i]), { startT: extrema[i - 1], endT: extrema[i] }));
                        }
                    }

                    childSeeds.forEach((seed, i) => {
                        this.models['Curve_' + (1 + i)] = new BezierCurve(seed, true, this.accuracy);
                    });
                }
            }

            if (isLeaf) {

                this.paths = {};

                //use arcs

                if (!this.accuracy) {
                    //get a default accuracy relative to the size of the bezier
                    var len = b.length();

                    //set the default to be a combination of fast rendering and good smoothing.
                    this.accuracy = len / 1000;
                }

                var arcs = getArcs(b, this.accuracy);

                var i = 0;
                arcs.forEach((arc) => {

                    var span = angle.ofArcSpan(arc);
                    if (span === 0 || span === 360) return;

                    this.paths['Arc_' + (1 + i)] = arc;
                    i++;
                });
            }
        }

        public static typeName = 'BezierCurve';

        public static getBezierSeeds(curve: BezierCurve, options: IFindChainsOptions = {}): IPathBezierSeed[] {

            options.shallow = true;

            var b = seedToBezier(curve.seed);

            var seeds: IPathBezierSeed[] = [];

            model.findChains(curve, function (chains: IChain[], loose: IWalkPath[], layer: string) {

                if (chains.length === 0) {

                    //if this is a linear curve then look if line ends are the same as bezier ends.
                    if (loose.length === 1 && loose[0].pathContext.type === pathType.Line) {
                        var line = loose[0].pathContext as IPathLine;
                        if (measure.isPointEqual(line.origin, curve.seed.origin) && measure.isPointEqual(line.end, curve.seed.end)) {
                            seeds.push(curve.seed)
                        }
                    }

                } else if (chains.length === 1) {
                    //check if endpoints are 0 and 1

                    var chain = chains[0];
                    var chainEnds = [chain.links[0], chain.links[chain.links.length - 1]];
                    var chainReversed = false;

                    //put them in bezier t order
                    if ((chainEnds[0].walkedPath.pathContext as IPathArcInBezierCurve).bezierData.startT > (chainEnds[1].walkedPath.pathContext as IPathArcInBezierCurve).bezierData.startT) {
                        chainEnds.reverse();
                        chainReversed = true;
                    }

                    var intact = true;

                    for (var i = 2; i--;) {
                        var chainEnd = chainEnds[i];
                        var arc = chainEnd.walkedPath.pathContext as IPathArcInBezierCurve;
                        var reversed = (chainReversed !== chainEnd.reversed);
                        var chainEndPoint = chainEnd.endPoints[reversed ? 1 - i : i];
                        var trueEndpoint = b.compute(i === 0 ? arc.bezierData.startT : arc.bezierData.endT);
                        if (!measure.isPointEqual(chainEndPoint, [trueEndpoint.x, trueEndpoint.y], .00001)) {
                            intact = false;
                            break;
                        }
                    }

                    if (intact) {
                        seeds.push(curve.seed)
                    }

                } else {
                    //TODO: find bezier seeds from a split chain
                }

            }, options);

            return seeds;
        }

        public static computePoint(seed: IPathBezierSeed, t: number): IPoint {
            var s = getScratch(seed);

            var computedPoint = s.compute(t);

            return [computedPoint.x, computedPoint.y];
        }

    }

    (<IKit>BezierCurve).metaParameters = [
        {
            title: "points", type: "select", value: [
                [[100, 0], [-80, -60], [100, 220], [100, 60]],
                [[0, 0], [100, 0], [100, 100]],
                [[0, 0], [20, 0], [80, 100], [100, 100]]
            ]
        }
    ];
}

declare var Bezier: typeof BezierJs.Bezier;
