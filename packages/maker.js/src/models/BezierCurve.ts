namespace MakerJs.models {

    /**
     * @private
     */
    var hasLib = false;

    /**
     * @private
     */
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
            //invoke the constructor on the same object
            Bezier.apply(scratch, bezierJsPoints);
        }

        return scratch;
    }

    /**
     * @private
     */
    function BezierToSeed(b: BezierJs.Bezier, range?: IBezierRange): IPathBezierSeed {
        var points = b.points.map(getIPoint);
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
    function getExtrema(b: BezierJs.Bezier) {

        var extrema = b.extrema().values

            //round the numbers so we can compare them to each other
            .map(m => round(m))

            //remove duplicates
            .filter((value, index, self) => self.indexOf(value) === index)

            //and put them in order
            .sort();

        if (extrema.length === 0) return [0, 1];

        //ensure leading zero
        if (extrema[0] !== 0) {
            extrema.unshift(0);
        }

        //ensure ending 1
        if (extrema[extrema.length - 1] !== 1) {
            extrema.push(1);
        }

        return extrema;
    }

    /**
     * @private
     */
    function getIPoint(p: BezierJs.Point): IPoint {
        return [p.x, p.y];
    }

    /**
     * @private
     */
    class TPoint {
        public point: IPoint;

        constructor(b: BezierJs.Bezier, public t: number, offset?: IPoint) {
            this.point = point.add(getIPoint(b.get(t)), offset);
        }
    }

    /**
     * @private
     */
    function getError(b: BezierJs.Bezier, startT: number, endT: number, arc: IPathArc, arcReversed: boolean): number {
        var tSpan = endT - startT;

        function m(ratio: number) {
            var t = startT + tSpan * ratio;
            var bp = getIPoint(b.get(t));
            var ap = point.middle(arc, arcReversed ? 1 - ratio : ratio);
            return measure.pointDistance(ap, bp);
        }

        return m(0.25) + m(0.75);
    }

    /**
     * @private
     */
    function getLargestArc(b: BezierJs.Bezier, startT: number, endT: number, accuracy: number): IPathArcInBezierCurve {

        var arc: IPathArc, lastGoodArc: IPathArc;
        var start = new TPoint(b, startT);
        var end = new TPoint(b, endT);
        var upper = end;
        var lower = start;
        var count = 0;
        var test = upper;
        var reversed: boolean;

        while (count < 100) {
            const middle = getIPoint(b.get((start.t + test.t) / 2));

            //if the 3 points are linear, this may throw
            try {
                arc = new paths.Arc(start.point, middle, test.point);
            }
            catch (e) {
                if (lastGoodArc) {
                    return lastGoodArc as IPath as IPathArcInBezierCurve;
                } else {
                    break;
                }
            }

            //only need to test once to see if this arc is polar / clockwise
            if (reversed === undefined) {
                reversed = measure.isPointEqual(start.point, point.fromAngleOnCircle(arc.endAngle, arc));
            }

            //now we have a valid arc, measure the error.
            var error = getError(b, startT, test.t, arc, reversed);

            //if error is within accuracy, this becomes the lower
            if (error <= accuracy) {
                (arc as IPath as IPathArcInBezierCurve).bezierData = {
                    startT: startT,
                    endT: test.t
                };
                lower = test;
                lastGoodArc = arc;
            } else {
                upper = test;
            }

            //exit if lower is the end
            if (lower.t === upper.t || (lastGoodArc && (lastGoodArc !== arc) && (angle.ofArcSpan(arc) - angle.ofArcSpan(lastGoodArc)) < .5)) {
                return lastGoodArc as IPath as IPathArcInBezierCurve;
            }

            count++;
            test = new TPoint(b, (lower.t + upper.t) / 2);
        }

        //arc failed, so return a line
        var line = new paths.Line(start.point, test.point) as IPath as IPathArcInBezierCurve;
        line.bezierData = {
            startT: startT,
            endT: test.t
        };
        return line;
    }

    /**
     * @private
     */
    function getArcs(bc: BezierCurve, b: BezierJs.Bezier, accuracy: number, startT: number, endT: number, base: number): number {
        var added = 0;
        var arc: IPathArcInBezierCurve;

        while (startT < endT) {

            arc = getLargestArc(b, startT, endT, accuracy);
            //add an arc

            startT = arc.bezierData.endT

            var len = measure.pathLength(arc);
            if (len < .0001) {
                continue;
            }

            bc.paths[arc.type + '_' + (base + added)] = arc;

            added++;
        }

        return added;
    }

    /**
     * @private
     */
    function getActualBezierRange(curve: BezierCurve, arc: IPathArcInBezierCurve, endpoints: IPoint[], offset: IPoint): IBezierRange {
        var b = getScratch(curve.seed);
        var tPoints = [arc.bezierData.startT, arc.bezierData.endT].map(t => new TPoint(b, t, offset));
        var ends = endpoints.slice();

        //clipped arcs will still have endpoints closer to the original endpoints
        var endpointDistancetoStart = ends.map(e => measure.pointDistance(e, tPoints[0].point));
        if (endpointDistancetoStart[0] > endpointDistancetoStart[1]) ends.reverse();

        for (var i = 2; i--;) {
            if (!measure.isPointEqual(ends[i], tPoints[i].point)) {
                return null;
            }
        }

        return arc.bezierData;
    }

    /**
     * @private
     */
    interface IAddToLayer {
        (pathToAdd: IPath, layer: string, clone?: boolean): void;
    }

    /**
     * @private
     */
    function getChainBezierRange(curve: BezierCurve, c: IChain, layer: string, addToLayer: IAddToLayer): IBezierRange {

        var endLinks = [c.links[0], c.links[c.links.length - 1]];
        if ((endLinks[0].walkedPath.pathContext as IPathArcInBezierCurve).bezierData.startT > (endLinks[1].walkedPath.pathContext as IPathArcInBezierCurve).bezierData.startT) {
            chain.reverse(c);
            endLinks.reverse();
        }

        var actualBezierRanges = endLinks.map(endLink => getActualBezierRange(curve, endLink.walkedPath.pathContext as IPathArcInBezierCurve, endLink.endPoints, endLink.walkedPath.offset));

        var result: IBezierRange = {
            startT: actualBezierRanges[0] ? actualBezierRanges[0].startT : null,
            endT: actualBezierRanges[1] ? actualBezierRanges[1].endT : null
        };

        if (result.startT !== null && result.endT !== null) {
            return result;

        } else if (c.links.length > 2) {

            if (result.startT === null) {
                //exclude the first from the chain
                addToLayer(c.links[0].walkedPath.pathContext, layer, true);
                result.startT = (c.links[1].walkedPath.pathContext as IPathArcInBezierCurve).bezierData.startT;
            }

            if (result.endT === null) {
                //exclude the last from the chain
                addToLayer(c.links[c.links.length - 1].walkedPath.pathContext, layer, true);
                result.endT = (c.links[c.links.length - 2].walkedPath.pathContext as IPathArcInBezierCurve).bezierData.endT;
            }

            return result;
        }
        return null;
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
        constructor(origin: IPoint, control: IPoint, end: IPoint, accuracy?: number);
        constructor(origin: IPoint, controls: IPoint[], end: IPoint, accuracy?: number);
        constructor(origin: IPoint, control1: IPoint, control2: IPoint, end: IPoint, accuracy?: number);

        constructor(...args: any[]) {

            var isArrayArg0 = Array.isArray(args[0]);

            switch (args.length) {

                case 2:
                    if (isArrayArg0) {
                        this.accuracy = args[1] as number;
                    } else {
                        //seed
                        this.seed = args[0] as IPathBezierSeed;
                        this.accuracy = args[1] as number;
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

                var line = new paths.Line(point.clone(this.seed.origin), point.clone(this.seed.end));
                (line as IPath as IPathArcInBezierCurve).bezierData = {
                    startT: 0,
                    endT: 1
                };

                this.paths = {
                    "0": line
                };
                return;
            }

            var b = seedToBezier(this.seed);
            var extrema = getExtrema(b);

            this.paths = {};

            //use arcs

            if (!this.accuracy) {
                //get a default accuracy relative to the size of the bezier
                var len = b.length();

                //set the default to be a combination of fast rendering and good smoothing.
                this.accuracy = len / 100;
            }

            var count = 0;
            for (var i = 1; i < extrema.length; i++) {
                var extremaSpan = extrema[i] - extrema[i - 1];
                count += getArcs(this, b, this.accuracy * extremaSpan, extrema[i - 1], extrema[i], count);
            }
        }

        public static typeName = 'BezierCurve';

        public static getBezierSeeds(curve: BezierCurve, options: IFindChainsOptions = {}): IPath[] | { [layer: string]: IPath[] } {

            options.shallow = true;
            options.unifyBeziers = false;

            const seedsByLayer: { [layer: string]: IPath[] } = {};

            const addToLayer: IAddToLayer = (pathToAdd: IPath, layer: string, clone = false) => {
                if (!seedsByLayer[layer]) {
                    seedsByLayer[layer] = [];
                }
                seedsByLayer[layer].push(clone ? path.clone(pathToAdd) : pathToAdd);
            }

            model.findChains(curve, function (chains: IChain[], loose: IWalkPath[], layer: string) {

                chains.forEach(c => {
                    var range = getChainBezierRange(curve, c, layer, addToLayer);
                    if (range) {
                        var b = getScratch(curve.seed);
                        var piece = b.split(range.startT, range.endT);
                        addToLayer(BezierToSeed(piece), layer);
                    } else {
                        c.links.forEach(link => addToLayer(link.walkedPath.pathContext, layer, true));
                    }
                });

                loose.forEach(wp => {
                    if (wp.pathContext.type === pathType.Line) {
                        //bezier is linear
                        return addToLayer(wp.pathContext, layer, true);
                    }
                    var range = getActualBezierRange(curve, wp.pathContext as IPathArcInBezierCurve, point.fromPathEnds(wp.pathContext), wp.offset);
                    if (range) {
                        var b = getScratch(curve.seed);
                        var piece = b.split(range.startT, range.endT);
                        addToLayer(BezierToSeed(piece), layer);
                    } else {
                        addToLayer(wp.pathContext, layer, true);
                    }
                });

            }, options);

            if (options.byLayers) {
                return seedsByLayer;
            } else {
                return seedsByLayer[''];
            }
        }

        public static computeLength(seed: IPathBezierSeed): number {
            var b = seedToBezier(seed);
            return b.length();
        }

        public static computePoint(seed: IPathBezierSeed, t: number): IPoint {
            var s = getScratch(seed);

            var computedPoint = s.compute(t);

            return getIPoint(computedPoint);
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
