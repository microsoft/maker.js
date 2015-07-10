module MakerJs.models {

    export class OvalArc implements IModel {

        public paths: IPathMap = {};

        constructor(startAngle: number, endAngle: number, sweepRadius: number, slotRadius: number) {

            var addCap = (id: string, tiltAngle: number, offsetStartAngle: number, offsetEndAngle: number) => {
                var p = point.fromPolar(angle.toRadians(tiltAngle), sweepRadius);
                this.paths[id] = new paths.Arc(p, slotRadius, tiltAngle + offsetStartAngle, tiltAngle + offsetEndAngle);
            };

            var addSweep = (id: string, offsetRadius: number) => {
                this.paths[id] = new paths.Arc(point.zero(), sweepRadius + offsetRadius, startAngle, endAngle);
            };

            addSweep("Inner", - slotRadius);
            addSweep("Outer", slotRadius);
            addCap("StartCap", startAngle, 180, 0);
            addCap("EndCap", endAngle, 0, 180);
        }

    }
}