module Maker.Models {

    export class OvalArc implements IMakerModel {

        public paths: IMakerPath[] = [];

        constructor(public startAngle: number, public endAngle: number, public sweepRadius: number, public slotRadius: number) {

            var addCap = (id: string, angle: number, offsetStartAngle: number, offsetEndAngle: number) => {
                var point = Maker.Point.FromPolar(Maker.Angle.ToRadians(angle), sweepRadius);
                this.paths.push(Path.CreateArc(id, point, slotRadius, angle + offsetStartAngle, angle + offsetEndAngle));
            };

            var addSweep = (id: string, offsetRadius: number) => {
                this.paths.push(Path.CreateArc(id, Point.Zero(), sweepRadius + offsetRadius, startAngle, endAngle));
            };

            addSweep("Inner", - slotRadius);
            addSweep("Outer", slotRadius);
            addCap("StartCap", startAngle, 180, 0);
            addCap("EndCap", endAngle, 0, 180);
        }

    }
}