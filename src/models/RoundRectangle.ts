namespace MakerJs.models {

    export class RoundRectangle implements IModel {

        public paths: IPathMap = {};

        constructor(width: number, height: number, radius: number) {

            var maxRadius = Math.min(height, width) / 2;

            radius = Math.min(radius, maxRadius);

            var wr = width - radius;
            var hr = height - radius;

            if (radius > 0) {
                this.paths["BottomLeft"] = new paths.Arc([radius, radius], radius, 180, 270);
                this.paths["BottomRight"] = new paths.Arc([wr, radius], radius, 270, 0);
                this.paths["TopRight"] = new paths.Arc([wr, hr], radius, 0, 90);
                this.paths["TopLeft"] = new paths.Arc([radius, hr], radius, 90, 180);
            }

            if (wr - radius > 0) {
                this.paths["Bottom"] = new paths.Line([radius, 0], [wr, 0]);
                this.paths["Top"] = new paths.Line([wr, height], [radius, height]);
            }

            if (hr - radius > 0) {
                this.paths["Right"] = new paths.Line([width, radius], [width, hr]);
                this.paths["Left"] = new paths.Line([0, hr], [0, radius]);
            }

        }
    }

    (<IKit>RoundRectangle).metaParameters = [
        { title: "width", type: "range", min: 1, max: 100, value: 50 },
        { title: "height", type: "range", min: 1, max: 100, value: 100 },
        { title: "radius", type: "range", min: 0, max: 50, value: 11 }
    ];
}
