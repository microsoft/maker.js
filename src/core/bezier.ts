namespace MakerJs.bezier {

    //The following code is an adapted excerpt from Bezier.js by Pomax
    //https://github.com/Pomax/bezierjs

    /**
      A javascript Bezier curve library by Pomax.

      Based on http://pomax.github.io/bezierinfo

      This code is MIT licensed.
    **/

    /**
     * @private
     */
    export function compute(bez: IPathBezierSeed, t: number): IPoint {
        // shortcuts
        if (t === 0) { return bez.origin; }
        if (t === 1) { return bez.end; }

        var mt = 1 - t;
        var p: IPoint[]

        // linear?
        if (!bez.controls) {

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

        if (bez.controls.length === 1) {
            //quadratic

            p = [bez.origin, bez.controls[0], bez.end, [0, 0]];
            a = mt2;
            b = mt * t * 2;
            c = t2;

        } else if (bez.controls.length === 2) {
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

    /**
     * @private
     */
    function _error(bez: IPathBezierSeed, pc: IPoint, np1: IPoint, s: number, e: number) {
        var q = (e - s) / 4,
            c1 = compute(bez, s + q),
            c2 = compute(bez, e - q),
            ref = measure.pointDistance(pc, np1),
            d1 = measure.pointDistance(pc, c1),
            d2 = measure.pointDistance(pc, c2);
        return Math.abs(d1 - ref) + Math.abs(d2 - ref);
    }

    /**
     * @private
     */
    export function iterate(bez: IPathBezierSeed, errorThreshold: number, arcs: IPathArcInBezierCurve[]) {

        var s = 0, e = 1, safety: number, i = 1;

        // we do a binary search to find the "good `t` closest to no-longer-good"
        do {
            safety = 0;

            // step 1: start with the maximum possible arc
            e = 1;

            // points:
            var np1 = compute(bez, s), np2: IPoint, np3: IPoint, arc: IPathArcInBezierCurve, prev_arc: IPathArcInBezierCurve;

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

                arc = new paths.Arc(np1, np2, np3) as IPathArcInBezierCurve;
                arc.startT = s;
                arc.midT = m;
                arc.endT = e;

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
            arcs.push(prev_arc);

            s = prev_e;
        }
        while (e < 1);
    }

    //The above code is an adapted excerpt from Bezier.js by Pomax
    //https://github.com/Pomax/bezierjs

}
