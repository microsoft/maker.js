module Maker.Angle {

    export function ToRadians(angleInDegrees: number): number {
        if (angleInDegrees == 360) {
            return 0;
        }
        return angleInDegrees * Math.PI / 180.0;
    }

    export function FromRadians (angleInRadians: number): number {
        return angleInRadians * 180.0 / Math.PI;
    }

    export function ArcEndAnglePastZero (arc: IMakerPathArc): number {
        //compensate for values past zero. This allows easy compute of total angle size.
        //for example 0 = 360
        if (arc.endAngle < arc.startAngle) {
            return 360 + arc.endAngle;
        }
        return arc.endAngle;
    }

    export function FromPointToRadians(point: IMakerPoint, origin?: IMakerPoint): number {
        var d = Point.Subtract(point, origin);
        return Math.atan2(d.y, d.x);
    }
}
