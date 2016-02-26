module MakerJs.paths {
    
    //shortcuts

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
         * Class for arc path, created from 2 points, radius, and sweep flag indicating large or small arc.
         * 
         * @param p1 First end point of the arc.
         * @param p2 Second end point of the arc.
         * @param radius The radius of the arc.
         * @param sweep Boolean flag to indicate clockwise direction.
         */
        constructor(p1: IPoint, p2: IPoint, radius: number, sweep: boolean);

        /**
         * Class for arc path, created from 2 points and optional boolean flag indicating clockwise.
         * 
         * @param p1 First end point of the arc.
         * @param p2 Second end point of the arc.
         * @param clockwise Boolean flag to indicate clockwise direction.
         */
        constructor(p1: IPoint, p2: IPoint, clockwise: boolean);

        /**
         * Class for arc path, created from 3 points.
         * 
         * @param p1 First end point of the arc.
         * @param p2 Middle point on the arc.
         * @param p3 Second end point of the arc.
         */
        constructor(p1: IPoint, p2: IPoint, clockwise: boolean);

        constructor(...args: any[]) {
            this.type = pathType.Arc;

            if (args.length == 4) {

                if (typeof args[1] === 'number') {
                    this.origin = args[0];
                    this.radius = args[1];
                    this.startAngle = args[2];
                    this.endAngle = args[3];

                } else {
                    //SVG style arc

                    //TODO

                }

            } else {

                var circle: Circle;
                if (isPoint(args[2])) {
                    circle = new Circle(args[0], args[1], args[2]);
                } else {
                    circle = new Circle(args[0], args[1]);
                }
                this.origin = circle.origin;
                this.radius = circle.radius;

                if (isPoint(args[2])) {
                    //from 3 points

                    var angles: number[] = [];
                    for (var i = 0; i < 3; i++) {
                        angles.push(angle.ofPointInDegrees(this.origin, args[i]));
                    }

                    this.startAngle = angles[0];
                    this.endAngle = angles[2];

                    if (!measure.isBetweenArcAngles(angles[1], this, false)) {
                        this.startAngle = angles[2];
                        this.endAngle = angles[0];
                    }

                } else {
                    //from 2 points and clockwise flag
                    var clockwise = args[2] as boolean;

                    this.startAngle = angle.ofPointInDegrees(this.origin, args[clockwise ? 1 : 0]);
                    this.endAngle = angle.ofPointInDegrees( this.origin, args[clockwise ? 0 : 1]);
                }

            }
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
         * Class for circle path, created from origin point and radius.
         * 
         * @param origin The center point of the circle.
         * @param radius The radius of the circle.
         */
        constructor(origin: IPoint, radius: number);

        /**
         * Class for circle path, created from 2 points.
         * 
         * @param p1 First point on the circle.
         * @param p2 Second point on the circle.
         */
        constructor(p1: IPoint, p2: IPoint);

        /**
         * Class for circle path, created from 3 points.
         * 
         * @param p1 First point on the circle.
         * @param p2 Second point on the circle.
         * @param p3 Third point on the circle.
         */
        constructor(p1: IPoint, p2: IPoint, p3: IPoint);

        constructor(...args: any[]) {
            this.type = pathType.Circle;

            if (args.length == 2) {

                if (typeof args[1] === 'number') {
                    this.origin = args[0];
                    this.radius = args[1];

                } else {
                    //Circle from 2 points
                    this.origin = point.average(args[0], args[1]);
                    this.radius = measure.pointDistance(this.origin, args[0]);
                }

            } else {
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
                this.origin = path.slopeIntersectionPoint(perpendiculars[0], perpendiculars[1]);

                //radius is distance to any of the 3 points
                this.radius = measure.pointDistance(this.origin, args[0]);
            }

        }
    }

    /**
     * Class for line path.
     * 
     * @param origin The origin point of the line.
     * @param end The end point of the line.
     */
    export class Line implements IPathLine {
        public type: string;

        constructor(public origin: IPoint, public end: IPoint) {
            this.type = pathType.Line;
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
