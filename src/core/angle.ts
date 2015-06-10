/// <reference path="maker.ts" />

module Maker.angle {

    /**
     * Convert an angle from degrees to radians.
     * 
     * @param angleInDegrees Angle in degrees.
     * @returns Angle in radians.
     */
    export function toRadians(angleInDegrees: number): number {
        if (angleInDegrees == 360) {
            return 0;
        }
        return angleInDegrees * Math.PI / 180.0;
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
     * Gets an arc's end angle, ensured to be greater than its start angle.
     * 
     * @param arc An arc path object.
     * @returns End angle of arc.
     */
    export function arcEndAnglePastZero(arc: IPathArc): number {
        //compensate for values past zero. This allows easy compute of total angle size.
        //for example 0 = 360
        if (arc.endAngle < arc.startAngle) {
            return 360 + arc.endAngle;
        }
        return arc.endAngle;
    }

    /**
     * Angle of a line through a point.
     * 
     * @param pointToFindAngle The point to find the angle.
     * @param origin (Optional 0,0 implied) point of origin of the angle.
     * @returns Angle of the line throught the point.
     */
    export function fromPointToRadians(pointToFindAngle: IPoint, origin?: IPoint): number {
        var d = point.subtract(pointToFindAngle, origin);
        return Math.atan2(d.y, d.x);
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
