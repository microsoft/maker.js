namespace MakerJs.angle {

    /**
     * Ensures an angle is not greater than 360
     * 
     * @param angleInDegrees Angle in degrees.
     * @retiurns Same polar angle but not greater than 360 degrees.
     */
    export function noRevolutions(angleInDegrees: number) {
        var revolutions = Math.floor(angleInDegrees / 360);
        var a = angleInDegrees - (360 * revolutions);
        return a < 0 ? a + 360 : a;
    }

    /**
     * Convert an angle from degrees to radians.
     * 
     * @param angleInDegrees Angle in degrees.
     * @returns Angle in radians.
     */
    export function toRadians(angleInDegrees: number): number {
        return noRevolutions(angleInDegrees) * Math.PI / 180.0;
    }

    /**
     * Convert an angle from radians to degrees.
     * 
     * @param angleInRadians Angle in radians.
     * @returns Angle in degrees.
     */
    export function toDegrees(angleInRadians: number): number {
        return angleInRadians * 180.0 / Math.PI;
    }

    /**
     * Get an arc's end angle, ensured to be greater than its start angle.
     * 
     * @param arc An arc path object.
     * @returns End angle of arc.
     */
    export function ofArcEnd(arc: IPathArc): number {
        //compensate for values past zero. This allows easy compute of total angle size.
        //for example 0 = 360
        if (arc.endAngle < arc.startAngle) {
            return 360 + arc.endAngle;
        }
        return arc.endAngle;
    }

    /**
     * Get the angle in the middle of an arc's start and end angles.
     * 
     * @param arc An arc path object.
     * @param ratio Optional number between 0 and 1 specifying percentage between start and end angles. Default is .5
     * @returns Middle angle of arc.
     */
    export function ofArcMiddle(arc: IPathArc, ratio = .5): number {
        return arc.startAngle + ofArcSpan(arc) * ratio;
    }

    /**
     * Total angle of an arc between its start and end angles.
     * 
     * @param arc The arc to measure.
     * @returns Angle of arc.
     */
    export function ofArcSpan(arc: IPathArc): number {
        var endAngle = angle.ofArcEnd(arc);
        var a = round(endAngle - arc.startAngle);
        if (a > 360) {
            return noRevolutions(a);
        } else {
            return a;
        }
    }

    /**
     * Angle of a line path.
     * 
     * @param line The line path to find the angle of.
     * @returns Angle of the line path, in degrees.
     */
    export function ofLineInDegrees(line: IPathLine) {
        return noRevolutions(toDegrees(ofPointInRadians(line.origin, line.end)));
    }

    /**
     * Angle of a line through a point, in degrees.
     * 
     * @param pointToFindAngle The point to find the angle.
     * @param origin Point of origin of the angle.
     * @returns Angle of the line throught the point, in degrees.
     */
    export function ofPointInDegrees(origin: IPoint, pointToFindAngle: IPoint): number {
        return toDegrees(ofPointInRadians(origin, pointToFindAngle));
    }

    /**
     * Angle of a line through a point, in radians.
     * 
     * @param pointToFindAngle The point to find the angle.
     * @param origin Point of origin of the angle.
     * @returns Angle of the line throught the point, in radians.
     */
    export function ofPointInRadians(origin: IPoint, pointToFindAngle: IPoint): number {
        var d = point.subtract(pointToFindAngle, origin);
        var x = d[0];
        var y = d[1];
        return Math.atan2(-y, -x) + Math.PI;
    }

    /**
     * Mirror an angle on either or both x and y axes.
     * 
     * @param angleInDegrees The angle to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored angle.
     */
    export function mirror(angleInDegrees: number, mirrorX: boolean, mirrorY: boolean): number {

        if (mirrorY) {
            angleInDegrees = 360 - angleInDegrees;
        }

        if (mirrorX) {
            angleInDegrees = (angleInDegrees < 180 ? 180 : 540) - angleInDegrees;
        }

        return angleInDegrees;
    }
}
