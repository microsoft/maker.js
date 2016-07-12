namespace MakerJs.models {

    //todo: note adapted from Pomax
    function compute(bez: BezierArcs, t: number): IPoint {
        // shortcuts
        if (t === 0) { return bez.origin; }
        if (t === 1) { return bez.end; }

        var mt = 1 - t;
        var p: IPoint[]

        // linear?
        if (!bez.control && !bez.controls) {

            p = [bez.origin, bez.end];

            return [
                mt * p[0][0] + t * p[1][0],
                mt * p[0][1] + t * p[1][1]
            ];
        }

        // quadratic/cubic curve?
        var mt2 = mt * mt,
            t2 = t * t,
            a, b, c, d = 0;

        if (bez.control) {
            //quadratic

            p = [bez.origin, bez.control, bez.end, [0, 0]];
            a = mt2;
            b = mt * t * 2;
            c = t2;

        } else if (bez.controls) {
            //cubic

            p = [bez.origin, bez.controls[0], bez.controls[1], bez.end];
            a = mt2 * mt;
            b = mt2 * t * 3;
            c = mt * t2 * 3;
            d = t * t2;
        }

        return [
            a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0],
            a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]
        ];

    }

    //todo: note adapted from Pomax
    function _error(bez: BezierArcs, pc: IPoint, np1: IPoint, s: number, e: number) {
        var q = (e - s) / 4,
            c1 = compute(bez, s + q),
            c2 = compute(bez, e - q),
            ref = measure.pointDistance(pc, np1),
            d1 = measure.pointDistance(pc, c1),
            d2 = measure.pointDistance(pc, c2);
        return Math.abs(d1 - ref) + Math.abs(d2 - ref);
    }

    //todo: note adapted from Pomax
    function iterate(bez: BezierArcs, errorThreshold: number) {

        var s = 0, e = 1, safety: number, i = 1;

        // we do a binary search to find the "good `t` closest to no-longer-good"
        do {
            safety = 0;

            // step 1: start with the maximum possible arc
            e = 1;

            // points:
            var np1 = compute(bez, s), np2: IPoint, np3: IPoint, arc: IPathArc, prev_arc: IPathArc;

            // booleans:
            var curr_good = false, prev_good = false, done: boolean;

            // numbers:
            var m = e, prev_e = 1, step = 0;

            // step 2: find the best possible arc
            do {
                prev_good = curr_good;
                prev_arc = arc;
                m = (s + e) / 2;
                step++;

                np2 = compute(bez, m);
                np3 = compute(bez, e);

                arc = new paths.Arc(np1, np2, np3);
                var error = _error(bez, arc.origin, np1, s, e);
                curr_good = (error <= errorThreshold);

                done = prev_good && !curr_good;
                if (!done) prev_e = e;

                // this arc is fine: we can move 'e' up to see if we can find a wider arc
                if (curr_good) {
                    // if e is already at max, then we're done for this arc.
                    if (e >= 1) {
                        prev_e = 1;
                        prev_arc = arc;
                        break;
                    }
                    // if not, move it up by half the iteration distance
                    e = e + (e - s) / 2;
                }

                // this is a bad arc: we need to move 'e' down to find a good arc
                else {
                    e = m;
                }
            }
            while (!done && safety++ < 100);

            //if (safety >= 100) {
            //    console.error("arc abstraction somehow failed...");
            //    break;
            //}

            // console.log("[F] arc found", s, prev_e, prev_arc[0], prev_arc[1], prev_arc.s, prev_arc.e);

            prev_arc = (prev_arc ? prev_arc : arc);

            bez.paths['arc_' + i++] = prev_arc;

            s = prev_e;
        }
        while (e < 1);
    }

    export class BezierArcs implements IModel {

        protected intactString: string;

        public paths: IPathMap = {};
        public origin: IPoint;
        public control: IPoint;
        public controls: IPoint[];
        public end: IPoint;

        constructor(points: IPoint[], accuracy?: number);
        constructor(origin: IPoint, control: IPoint, end: IPoint, accuracy?: number);
        constructor(origin: IPoint, controls: IPoint[], end: IPoint, accuracy?: number);
        constructor(origin: IPoint, control1: IPoint, control2: IPoint, end: IPoint, accuracy?: number);

        constructor(...args: any[]) {

            var accuracy = .001;

            var realArgs = (numArgs: number) => {

                this.origin = args[0] as IPoint;

                switch (numArgs) {

                    case 3: //quadratic or cubic
                        if (Array.isArray(args[1])) {
                            this.controls = args[1] as IPoint[];
                        } else {
                            this.control = args[1] as IPoint;
                        }

                        this.end = args[2] as IPoint;
                        break;

                    case 4: //cubic params
                        this.controls = [args[1] as IPoint, args[2] as IPoint];
                        this.end = args[3] as IPoint;
                        break;
                }
            };

            switch (args.length) {

                case 2: //point array + accuracy
                    accuracy = args[1] as number;
                //fall through

                case 1: //point array
                    var points = args[0] as IPoint[];

                    this.origin = points[0];

                    if (points.length === 3) {
                        this.control = points[1];
                        this.end = points[2];

                    } else if (points.length === 4) {
                        this.controls = [points[1], points[2]];
                        this.end = points[3];

                    } else {
                        this.end = points[1];
                    }

                    break;

                default:
                    switch (args.length) {
                        case 4:
                            accuracy = args[3] as number;
                        //fall through

                        case 3:
                            realArgs(3);
                            break;

                        case 5:
                            accuracy = args[4] as number;
                            realArgs(4);
                            break;
                    }
                    break;
            }

            iterate(this, accuracy);

            //store for comparison
            this.intactString = JSON.stringify(this.paths);
        }

        public static isIntact(bez: BezierArcs): boolean {

            //quick check
            if (JSON.stringify(bez.paths) === bez.intactString) return true;

            //more thorough check
            var copy = JSON.parse(bez.intactString) as IPathMap;

            for (var id in bez.paths) {
                if (!(id in copy)) return false;
                if (!measure.isPathEqual(bez.paths[id], copy[id])) return false;
            }

            return true
        }

    }

    (<IKit>BezierArcs).metaParameters = [
        {
            title: "points", type: "select", value: [
                [[0, 0], [100, 0], [100, 100]],
                [[0, 0], [20, 0], [80, 100], [100, 100]]
            ]
        }
    ];
}
