namespace MakerJs.models {

    function ensureBezierLib() {

        try {
            var lib = Bezier;
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
    function getScratch() {
        if (!scratch) {

            ensureBezierLib();
            scratch = new Bezier(0, 0, 0, 0, 0, 0);
        }
        return scratch;
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

    export class BezierCurve implements IModel {

        public models: IModelMap;
        public paths: IPathMap;
        public origin: IPoint;
        public type = BezierCurve.typeName;
        public seed: IPathBezierSeed;

        constructor(seed: IPathBezierSeed, accuracy?: number);
        constructor(points: IPoint[], accuracy?: number);
        constructor(origin: IPoint, control: IPoint, end: IPoint, accuracy?: number);
        constructor(origin: IPoint, controls: IPoint[], end: IPoint, accuracy?: number);
        constructor(origin: IPoint, control1: IPoint, control2: IPoint, end: IPoint, accuracy?: number);

        constructor(...args: any[]) {

            var accuracy: number;

            switch (args.length) {

                case 2:
                    accuracy = args[1] as number;

                    if (!Array.isArray(args[0])) {
                        //seed
                        this.seed = args[0] as IPathBezierSeed;
                        break;
                    }
                //fall through to point array

                case 1: //point array
                    var points = args[0] as IPoint[];

                    this.seed = new paths.BezierSeed(points);
                    break;

                default:
                    switch (args.length) {
                        case 4:
                            accuracy = args[3] as number;
                        //fall through

                        case 3:
                            this.seed = new paths.BezierSeed(args.slice(0, 3) as IPoint[]);
                            break;

                        case 5:
                            accuracy = args[4] as number;
                            this.seed = new paths.BezierSeed(args.slice(0, 4) as IPoint[]);
                            break;
                    }
                    break;
            }

            //set the default to be a combination of fast rendering and good smoothing. Accuracy can be specified if necessary.
            accuracy = accuracy || .1;

            //TODO: use extrema() and create child models

            var b = seedToBezier(this.seed);

            var arcs = getArcs(b, accuracy);

            this.paths = {};
            arcs.forEach((arc, i) => { this.paths['arc_' + i] = arc; });
        }

        public static typeName = 'BezierCurve';

        public static getBezierSeeds(curve: BezierCurve, options: IFindChainsOptions = {}): IPathBezierSeed[] {

            options.shallow = true;

            var b = seedToBezier(curve.seed);

            var seeds: IPathBezierSeed[] = [];

            model.findChains(curve, function (chains: IChain[], loose: IWalkPath[], layer: string) {

                if (chains.length === 1) {
                    //check if endpoints are 0 and 1

                    var chain = chains[0];
                    var chainEnds = [chain.links[0].walkedPath.pathContext, chain.links[chain.links.length - 1].walkedPath.pathContext] as IPathArcInBezierCurve[];
                    if (chain.links[0].reversed) {
                        chainEnds = [chainEnds[1], chainEnds[0]];
                    }

                    var intact = true;

                    for (var i = 2; i--;) {
                        var chainEnd = chainEnds[i];
                        var endPoints = point.fromPathEnds(chainEnd);
                        var chainEndPoint = endPoints[i];
                        var trueEndpoint = b.compute(i == 0 ? chainEnd.bezierData.startT : chainEnd.bezierData.endT);
                        if (!measure.isPointEqual(chainEndPoint, [trueEndpoint.x, trueEndpoint.y], .00001)) {
                            intact = false;
                            break;
                        }
                    }

                    if (intact) {
                        seeds.push(curve.seed)
                    }
                }

                //TODO: find bezier seeds from a split chain

            }, options);

            return seeds;
        }

        public static computePoint(seed: IPathBezierSeed, t: number): IPoint {

            var points: IPoint[] = [seed.origin];
            points.push.apply(points, seed.controls);
            points.push(seed.end);

            var bezierJsPoints = points.map(function (p: IPoint) {
                var bp: BezierJs.Point = {
                    x: p[0], y: p[1]
                };
                return bp;
            });

            var s = getScratch();
            s.points = bezierJsPoints;

            var computedPoint = s.compute(t);

            return [computedPoint.x, computedPoint.y];
        }


    }

    (<IKit>BezierCurve).metaParameters = [
        {
            title: "points", type: "select", value: [
                [[0, 0], [100, 0], [100, 100]],
                [[0, 0], [20, 0], [80, 100], [100, 100]]
            ]
        }
    ];
}

declare var Bezier: typeof BezierJs.Bezier;
