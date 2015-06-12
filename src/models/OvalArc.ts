module MakerJs.models {

    export class OvalArc implements IModel {

        public paths: IPath[] = [];

        constructor(public startAngle: number, public endAngle: number, public sweepRadius: number, public slotRadius: number) {

            var addCap = (id: string, tiltAngle: number, offsetStartAngle: number, offsetEndAngle: number) => {
                var p = point.fromPolar(angle.toRadians(tiltAngle), sweepRadius);
                this.paths.push(createArc(id, p, slotRadius, tiltAngle + offsetStartAngle, tiltAngle + offsetEndAngle));
            };

            var addSweep = (id: string, offsetRadius: number) => {
                this.paths.push(createArc(id, point.zero(), sweepRadius + offsetRadius, startAngle, endAngle));
            };

            addSweep("Inner", - slotRadius);
            addSweep("Outer", slotRadius);
            addCap("StartCap", startAngle, 180, 0);
            addCap("EndCap", endAngle, 0, 180);
        }

    }
}