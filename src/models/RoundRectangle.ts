module MakerJs.models {

    export class RoundRectangle implements IModel {

        public paths: IPath[] = [];

        constructor(public id: string, width: number, height: number, radius: number) {

            var maxRadius = Math.min(height, width) / 2;

            radius = Math.min(radius, maxRadius);

            var wr = width - radius;
            var hr = height - radius;

            if (radius > 0) {
                this.paths.push(new paths.Arc("BottomLeft", [radius, radius], radius, 180, 270));
                this.paths.push(new paths.Arc("BottomRight", [wr, radius], radius, 270, 0));
                this.paths.push(new paths.Arc("TopRight", [wr, hr], radius, 0, 90));
                this.paths.push(new paths.Arc("TopLeft", [radius, hr], radius, 90, 180));
            }

            if (wr - radius > 0) {
                this.paths.push(new paths.Line("Bottom", [radius, 0], [wr, 0]));
                this.paths.push(new paths.Line("Top", [wr, height], [radius, height]));
            }

            if (hr - radius > 0) {
                this.paths.push(new paths.Line("Right", [width, radius], [width, hr]));
                this.paths.push(new paths.Line("Left", [0, hr], [0, radius]));
            }

        }
    }
}