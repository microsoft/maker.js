module makerjs.models {

    export class RoundRectangle implements IMakerModel {

        public paths: IMakerPath[] = [];

        constructor(public width: number, public height: number, public radius: number) {

            var maxRadius = Math.min(height, width) / 2;

            radius = Math.min(radius, maxRadius);

            var wr = width - radius;
            var hr = height - radius;

            if (radius > 0) {
                this.paths.push(path.CreateArc("BottomLeft", [radius, radius], radius, 180, 270));
                this.paths.push(path.CreateArc("BottomRight", [wr, radius], radius, 270, 0));
                this.paths.push(path.CreateArc("TopRight", [wr, hr], radius, 0, 90));
                this.paths.push(path.CreateArc("TopLeft", [radius, hr], radius, 90, 180));
            }

            if (wr - radius > 0) {
                this.paths.push(path.CreateLine("Bottom", [radius, 0], [wr, 0]));
                this.paths.push(path.CreateLine("Top", [wr, height], [radius, height]));
            }

            if (hr - radius > 0) {
                this.paths.push(path.CreateLine("Right", [width, radius], [width, hr]));
                this.paths.push(path.CreateLine("Left", [0, hr], [0, radius]));
            }

        }
    }
}