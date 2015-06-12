module MakerJs.models {

    export class RoundRectangle implements IModel {

        public paths: IPath[] = [];

        constructor(public width: number, public height: number, public radius: number) {

            var maxRadius = Math.min(height, width) / 2;

            radius = Math.min(radius, maxRadius);

            var wr = width - radius;
            var hr = height - radius;

            if (radius > 0) {
                this.paths.push(createArc("BottomLeft", [radius, radius], radius, 180, 270));
                this.paths.push(createArc("BottomRight", [wr, radius], radius, 270, 0));
                this.paths.push(createArc("TopRight", [wr, hr], radius, 0, 90));
                this.paths.push(createArc("TopLeft", [radius, hr], radius, 90, 180));
            }

            if (wr - radius > 0) {
                this.paths.push(createLine("Bottom", [radius, 0], [wr, 0]));
                this.paths.push(createLine("Top", [wr, height], [radius, height]));
            }

            if (hr - radius > 0) {
                this.paths.push(createLine("Right", [width, radius], [width, hr]));
                this.paths.push(createLine("Left", [0, hr], [0, radius]));
            }

        }
    }
}