namespace MakerJs.paths {

    /**
     * @private
     */
    interface IArcSpan {
        origin: IPoint;
        startAngle: number;
        endAngle: number;
        size: number;
    }

    /**
     * Class for arc path.
     */
    export class Arc implements IPathArc {
        public origin: IPoint;
        public radius: number;
        public startAngle: number;
        public endAngle: number;
        public type: string;

        /**
         * Class for arc path, created from origin point, radius, start angle, and end angle.
         * 
         * @param origin The center point of the arc.
         * @param radius The radius of the arc.
         * @param startAngle The start angle of the arc.
         * @param endAngle The end angle of the arc.
         */
        constructor(origin: IPoint, radius: number, startAngle: number, endAngle: number);

        /**
         * Class for arc path, created from 2 points, radius, large Arc flag, and clockwise flag.
         * 
         * @param pointA First end point of the arc.
         * @param pointB Second end point of the arc.
         * @param radius The radius of the arc.
         * @param largeArc Boolean flag to indicate clockwise direction.
         * @param clockwise Boolean flag to indicate clockwise direction.
         */
        constructor(pointA: IPoint, pointB: IPoint, radius: number, largeArc: boolean, clockwise: boolean);

        /**
         * Class for arc path, created from 2 points and optional boolean flag indicating clockwise.
         * 
         * @param pointA First end point of the arc.
         * @param pointB Second end point of the arc.
         * @param clockwise Boolean flag to indicate clockwise direction.
         */
        constructor(pointA: IPoint, pointB: IPoint, clockwise?: boolean);

        /**
         * Class for arc path, created from 3 points.
         * 
         * @param pointA First end point of the arc.
         * @param pointB Middle point on the arc.
         * @param pointC Second end point of the arc.
         */
        constructor(pointA: IPoint, pointB: IPoint, pointC: IPoint);

        constructor(...args: any[]) {

            function getSpan(origin: IPoint): IArcSpan {
                var startAngle = angle.ofPointInDegrees(origin, args[clockwise ? 1 : 0]);
                var endAngle = angle.ofPointInDegrees(origin, args[clockwise ? 0 : 1]);

                if (endAngle < startAngle) {
                    endAngle += 360;
                }

                return {
                    origin: origin,
                    startAngle: startAngle,
                    endAngle: endAngle,
                    size: endAngle - startAngle
                };
            }

            switch (args.length) {

                case 5:
                    //SVG style arc designation

                    var pointA = args[0] as IPoint;
                    var pointB = args[1] as IPoint;
                    this.radius = args[2] as number;
                    var largeArc = args[3] as boolean;
                    var clockwise = args[4] as boolean;
                    var span: IArcSpan;

                    //make sure arc can reach. if not, scale up.
                    var smallestRadius = measure.pointDistance(pointA, pointB) / 2;
                    if (round(this.radius - smallestRadius) <= 0) {
                        this.radius = smallestRadius;

                        span = getSpan(point.average(pointA, pointB));

                    } else {

                        //find the 2 potential origins
                        var origins = path.intersection(
                            new Circle(pointA, this.radius),
                            new Circle(pointB, this.radius)
                        );

                        var spans: IArcSpan[] = [];

                        for (var i = origins.intersectionPoints.length; i--;) {
                            span = getSpan(origins.intersectionPoints[i])

                            //insert sorted by size ascending
                            if (spans.length == 0 || span.size > spans[0].size) {
                                spans.push(span);
                            } else {
                                spans.unshift(span);
                            }
                        }

                        var index = largeArc ? 1 : 0;
                        span = spans[index];
                    }

                    this.origin = span.origin;
                    this.startAngle = span.startAngle;
                    this.endAngle = span.endAngle;

                    break;

                case 4:
                    this.origin = args[0];
                    this.radius = args[1];
                    this.startAngle = args[2];
                    this.endAngle = args[3];
                    break;

                case 3:

                    if (isPoint(args[2])) {
                        //from 3 points

                        Circle.apply(this, args);

                        var angles: number[] = [];
                        for (var i = 0; i < 3; i++) {
                            angles.push(angle.ofPointInDegrees(this.origin, args[i]));
                        }

                        this.startAngle = angles[0];
                        this.endAngle = angles[2];

                        //swap start and end angles if this arc does not contain the midpoint
                        if (!measure.isBetweenArcAngles(angles[1], this, false)) {
                            this.startAngle = angles[2];
                            this.endAngle = angles[0];
                        }

                        //do not fall through if this was 3 points
                        break;
                    }

                //fall through to below if 2 points

                case 2:
                    //from 2 points (and optional clockwise flag)
                    var clockwise = args[2] as boolean;

                    Circle.call(this, args[0], args[1]);

                    this.startAngle = angle.ofPointInDegrees(this.origin, args[clockwise ? 1 : 0]);
                    this.endAngle = angle.ofPointInDegrees(this.origin, args[clockwise ? 0 : 1]);

                    break;
            }

            //do this after Circle.apply / Circle.call to make sure this is an arc
            this.type = pathType.Arc;
        }
    }

    /**
     * Class for circle path.
     */
    export class Circle implements IPathCircle {
        public type: string;
        public origin: IPoint;
        public radius: number;

        /**
         * Class for circle path, created from radius. Origin will be [0, 0].
         * 
         * Example:
         * ```
         * var c = new makerjs.paths.Circle(7);
         * ```
         *
         * @param radius The radius of the circle.
         */
        constructor(radius: number);

        /**
         * Class for circle path, created from origin point and radius.
         *
         * Example:
         * ```
         * var c = new makerjs.paths.Circle([10, 10], 7);
         * ```
         *
         * @param origin The center point of the circle.
         * @param radius The radius of the circle.
         */
        constructor(origin: IPoint, radius: number);

        /**
         * Class for circle path, created from 2 points.
         *
         * Example:
         * ```
         * var c = new makerjs.paths.Circle([5, 15], [25, 15]);
         * ```
         *
         * @param pointA First point on the circle.
         * @param pointB Second point on the circle.
         */
        constructor(pointA: IPoint, pointB: IPoint);

        /**
         * Class for circle path, created from 3 points.
         *
         * Example:
         * ```
         * var c = new makerjs.paths.Circle([0, 0], [0, 10], [20, 0]);
         * ```
         *
         * @param pointA First point on the circle.
         * @param pointB Second point on the circle.
         * @param pointC Third point on the circle.
         */
        constructor(pointA: IPoint, pointB: IPoint, pointC: IPoint);

        constructor(...args: any[]) {
            this.type = pathType.Circle;

            switch (args.length) {

                case 1:
                    this.origin = [0, 0];
                    this.radius = args[0] as number;
                    break;

                case 2:
                    if (isNumber(args[1])) {
                        this.origin = args[0];
                        this.radius = args[1];

                    } else {
                        //Circle from 2 points
                        this.origin = point.average(args[0], args[1]);
                        this.radius = measure.pointDistance(this.origin, args[0]);
                    }
                    break;

                default:
                    //Circle from 3 points

                    //create 2 lines with 2nd point in common
                    var lines: IPathLine[] = [
                        new Line(args[0], args[1]),
                        new Line(args[1], args[2])
                    ];

                    //create perpendicular lines
                    var perpendiculars: IPathLine[] = [];
                    for (var i = 2; i--;) {
                        var midpoint = point.middle(lines[i]);
                        perpendiculars.push(<IPathLine>path.rotate(lines[i], 90, midpoint));
                    }

                    //find intersection of slopes of perpendiculars
                    var origin = point.fromSlopeIntersection(perpendiculars[0], perpendiculars[1]);

                    if (origin) {
                        this.origin = origin;

                        //radius is distance to any of the 3 points
                        this.radius = measure.pointDistance(this.origin, args[0]);

                    } else {
                        throw 'invalid parameters - attempted to construct a circle from 3 points on a line: ' + JSON.stringify(args);
                    }

                    break;
            }
        }
    }

    /**
     * Class for line path.
     */
    export class Line implements IPathLine {
        public type: string;
        public origin: IPoint;
        public end: IPoint;

        /**
         * Class for line path, constructed from array of 2 points.
         * 
         * @param points Array of 2 points.
         */
        constructor(points: IPoint[]);

        /**
         * Class for line path, constructed from 2 points.
         * 
         * @param origin The origin point of the line.
         * @param end The end point of the line.
         */
        constructor(origin: IPoint, end: IPoint);

        constructor(...args: any[]) {
            this.type = pathType.Line;

            switch (args.length) {

                case 1:
                    var points = args[0] as IPoint[];
                    this.origin = points[0];
                    this.end = points[1];
                    break;

                case 2:
                    this.origin = args[0] as IPoint;
                    this.end = args[1] as IPoint;
                    break;
            }
        }
    }

    /**
     * Class for chord, which is simply a line path that connects the endpoints of an arc.
     * 
     * @param arc Arc to use as the basic for the chord.
     */
    export class Chord implements IPathLine {
        public type: string;
        public origin: IPoint;
        public end: IPoint;

        constructor(arc: IPathArc) {
            var arcPoints = point.fromArc(arc);

            this.type = pathType.Line;
            this.origin = arcPoints[0];
            this.end = arcPoints[1];
        }
    }

    /**
     * Class for a parallel line path.
     * 
     * @param toLine A line to be parallel to.
     * @param distance Distance between parallel and original line.
     * @param nearPoint Any point to determine which side of the line to place the parallel.
     */
    export class Parallel implements IPathLine {
        public type: string;
        public origin: IPoint;
        public end: IPoint;

        constructor(toLine: IPathLine, distance: number, nearPoint: IPoint) {
            this.type = pathType.Line;
            this.origin = point.clone(toLine.origin);
            this.end = point.clone(toLine.end);

            var angleOfLine = angle.ofLineInDegrees(this);

            function getNewOrigin(offsetAngle: number) {
                var origin = point.add(toLine.origin, point.fromPolar(angle.toRadians(angleOfLine + offsetAngle), distance));
                return {
                    origin: origin,
                    nearness: measure.pointDistance(origin, nearPoint)
                };
            }

            var newOrigins = [getNewOrigin(-90), getNewOrigin(90)];
            var newOrigin = (newOrigins[0].nearness < newOrigins[1].nearness) ? newOrigins[0].origin : newOrigins[1].origin;

            path.move(this, newOrigin);
        }
    }

}
