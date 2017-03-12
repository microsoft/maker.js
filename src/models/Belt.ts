namespace MakerJs.models {

    export class Belt implements IModel {

        public paths: IPathMap = {};

        constructor(leftRadius: number, distance: number, rightRadius: number) {
            var left = new paths.Arc([0, 0], leftRadius, 0, 360);
            var right = new paths.Arc([distance, 0], rightRadius, 0, 360);
            var angles = solvers.circleTangentAngles(left, right);

            if (!angles) {
                this.paths["Belt"] = new paths.Circle(Math.max(leftRadius, rightRadius));
            } else {

                angles = angles.sort((a, b) => a - b);

                left.startAngle = angles[0];
                left.endAngle = angles[1];

                right.startAngle = angles[1];
                right.endAngle = angles[0];

                this.paths["Left"] = left;
                this.paths["Right"] = right;
                this.paths["Top"] = new paths.Line(point.fromAngleOnCircle(angles[0], left), point.fromAngleOnCircle(angles[0], right));
                this.paths["Bottom"] = new paths.Line(point.fromAngleOnCircle(angles[1], left), point.fromAngleOnCircle(angles[1], right));
            }
        }
    }

    (<IKit>Belt).metaParameters = [
        { title: "left radius", type: "range", min: 0, max: 100, value: 30 },
        { title: "distance between centers", type: "range", min: 0, max: 100, value: 50 },
        { title: "right radius", type: "range", min: 0, max: 100, value: 15 }
    ];
}
