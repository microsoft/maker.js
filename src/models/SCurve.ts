module MakerJs.models {

    export class SCurve implements IModel {

        public paths: IPath[] = [];

        constructor(public width: number, public height: number) {

            function findRadius(x: number, y: number) {
                return x + (y * y - x * x) / (2 * x);
            }

            var h2 = height / 2;
            var w2 = width / 2;
            var radius: number;
            var startAngle: number;
            var endAngle: number;
            var arcOrigin: IPoint;

            if (width > height) {
                radius = findRadius(h2, w2);
                startAngle = 270;
                endAngle = 360 - angle.toDegrees(Math.acos(w2 / radius));
                arcOrigin = [0, radius];
            } else {
                radius = findRadius(w2, h2);
                startAngle = 180 - angle.toDegrees(Math.asin(h2 / radius));
                endAngle = 180;
                arcOrigin = [radius, 0];
            }

            var curve = createArc('curve_start', arcOrigin, radius, startAngle, endAngle);

            this.paths.push(curve);
            this.paths.push(path.moveRelative(path.mirror(curve, true, true, 'curve_end'), [width, height]));
        }
    }
} 