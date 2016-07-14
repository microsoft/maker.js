namespace MakerJs.models {

    /**
     * @private
     */
    function controlYForCircularCubic(arcSpanInRadians: number): number {

        //from http://pomax.github.io/bezierinfo/#circles_cubic
        return 4 * (Math.tan(arcSpanInRadians / 4) / 3);

    }

    /**
     * @private
     */
    function controlPointsForCircularCubic(arc: IPathArc): IPoint[] {

        var arcSpan = angle.ofArcSpan(arc);

        //compute y for radius of 1
        var y = controlYForCircularCubic(angle.toRadians(arcSpan));

        //multiply by radius
        var c1: IPoint = [arc.radius, arc.radius * y];

        //get second control point by mirroring, then rotating
        var c2 = point.rotate(point.mirror(c1, false, true), arcSpan, [0, 0]);

        //rotate again to start angle, then offset by arc's origin
        return [c1, c2].map(function (p: IPoint) { return point.add(arc.origin, point.rotate(p, arc.startAngle, [0, 0])); });
    }

    /**
     * @private
     */
    function bezierPointsFromArc(arc: IPathArc): IPoint[] {
        var span = angle.ofArcSpan(arc);
        if (span <= 90) {
            var endPoints = point.fromPathEnds(arc);
            var controls = controlPointsForCircularCubic(arc);
            return [endPoints[0], controls[0], controls[1], endPoints[1]];
        }
        return null;
    }

    /**
     * @private
     */
    function scaleDim(bezierPoints: IPoint[], i: number, s: number) {
        bezierPoints.map(function (p) { p[i] *= s; });
    }

    /**
     * @private
     */
    function scaleXY(bezierPoints: IPoint[], x: number, y: number = x) {
        scaleDim(bezierPoints, 0, x);
        scaleDim(bezierPoints, 1, y);
    }

    export class Ellipse implements IModel {

        public models: IModelMap = {};
        public origin: IPoint;

        constructor(radiusX: number, radiusY: number, accuracy?: number);
        constructor(origin: IPoint, radiusX: number, radiusY: number, accuracy?: number);
        constructor(cx: number, cy: number, rx: number, ry: number, accuracy?: number);
        constructor(...args: any[]) {

            var n = 8;
            var accuracy: number;

            var isPointArgs0 = isPoint(args[0]);

            var realArgs = (numArgs: number) => {
                switch (numArgs) {
                    case 2:
                        if (isPointArgs0) {
                            //origin, radius
                            this.origin = <IPoint>args[0];
                        }
                        break;

                    case 3:
                        //origin, rx, ry
                        this.origin = <IPoint>args[0];
                        break;

                    case 4:
                        //cx, cy, rx, ry
                        this.origin = [args[0] as number, args[1] as number];
                        break;
                }

                //construct a bezier approximation for an arc with radius of 1.
                var a = 360 / n;
                var arc = new paths.Arc([0, 0], 1, 0, a);

                //clone and rotate to complete a circle
                for (var i = 0; i < n; i++) {

                    var bezierPoints = bezierPointsFromArc(arc);

                    switch (numArgs) {
                        case 1:
                            //radius
                            scaleXY(bezierPoints, args[0] as number);
                            break;

                        case 2:
                            if (isPointArgs0) {
                                //origin, radius
                                scaleXY(bezierPoints, args[1] as number);

                            } else {
                                //rx, ry
                                scaleXY(bezierPoints, args[0] as number, args[1] as number);
                            }
                            break;

                        case 3:
                            //origin, rx, ry
                            scaleXY(bezierPoints, args[1] as number, args[2] as number);
                            break;

                        case 4:
                            //cx, cy, rx, ry
                            scaleXY(bezierPoints, args[2] as number, args[3] as number);
                            break;
                    }

                    this.models['Curve' + (1 + i)] = new BezierCurve(bezierPoints, accuracy);

                    arc.startAngle += a;
                    arc.endAngle += a;
                }
            };

            switch (args.length) {
                case 2:
                    realArgs(2);
                    break;

                case 3:
                    if (isPointArgs0) {
                        realArgs(3);
                    } else {
                        accuracy = args[2] as number;
                        realArgs(2);
                    }
                    break;

                case 4:
                    if (isPointArgs0) {
                        accuracy = args[3] as number;
                        realArgs(3);
                    } else {
                        realArgs(4);
                    }
                    break;

                case 5:
                    accuracy = args[4] as number;
                    realArgs(4);
                    break;
            }

        }
    }

    (<IKit>Ellipse).metaParameters = [
        { title: "radiusX", type: "range", min: 1, max: 50, value: 50 },
        { title: "radiusY", type: "range", min: 1, max: 50, value: 25 }
    ];
}
