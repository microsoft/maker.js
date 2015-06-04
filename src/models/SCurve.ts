module makerjs.Models {

    export class SCurve implements IMakerModel {

        public paths: IMakerPath[] = [];

        constructor(public width: number, public height: number) {

            function findRadius(x: number, y: number) {
                return x + (y * y - x * x) / (2 * x);
            }

            var h2 = height / 2;
            var w2 = width / 2;
            var radius: number;
            var startAngle: number;
            var endAngle: number;
            var arcOrigin: IMakerPoint;

            if (width > height) {
                radius = findRadius(h2, w2);
                startAngle = 270;
                endAngle = 360 - Angle.FromRadians(Math.acos(w2 / radius));
                arcOrigin = { x: 0, y: radius };
            } else {
                radius = findRadius(w2, h2);
                startAngle = 180 - Angle.FromRadians(Math.asin(h2 / radius));
                endAngle = 180;
                arcOrigin = { x: radius, y: 0 };
            }

            var curve = Path.CreateArc('curve_start', arcOrigin, radius, startAngle, endAngle);

            this.paths.push(curve);
            this.paths.push(Path.MoveRelative(Path.Mirror(curve, true, true, 'curve_end'), [width, height]));
        }
    }
} 