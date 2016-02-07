module MakerJs.paths {
    
    //shortcuts

    /**
     * Class for arc path.
     * 
     * @param origin The center point of the arc.
     * @param radius The radius of the arc.
     * @param startAngle The start angle of the arc.
     * @param endAngle The end angle of the arc.
     */
    export class Arc implements IPathArc {
        public type: string;

        constructor(public origin: IPoint, public radius: number, public startAngle: number, public endAngle: number) {
            this.type = pathType.Arc;
        }
    }

    /**
     * Class for circle path.
     * 
     * @param origin The center point of the circle.
     * @param radius The radius of the circle.
     */
    export class Circle implements IPathCircle {
        public type: string;

        constructor(public origin: IPoint, public radius: number) {
            this.type = pathType.Circle;
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
