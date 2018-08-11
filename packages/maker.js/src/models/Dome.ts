namespace MakerJs.models {

    export class Dome implements IModel {

        public paths: IPathMap = {};

        constructor(width: number, height: number, radius?: number, bottomless?: boolean) {

            var w2 = width / 2;

            if (radius < 0) radius = 0;
            if (radius === void 0) radius = w2;
            radius = Math.min(radius, w2);
            radius = Math.min(radius, height);
            var wt = Math.max(w2 - radius, 0);
            var hr = Math.max(height - radius, 0);

            if (!bottomless) {
                this.paths["Bottom"] = new paths.Line([-w2, 0], [w2, 0]);
            }
        
            if (hr) {
                this.paths["Left"] = new paths.Line([-w2, 0], [-w2, hr]);
                this.paths["Right"] = new paths.Line([w2, 0], [w2, hr]);
            }

            if (radius > 0) {
                this.paths["TopLeft"] = new paths.Arc([-wt, hr], radius, 90, 180);
                this.paths["TopRight"] = new paths.Arc([wt, hr], radius, 0, 90);
            }

            if (wt) {
                this.paths["Top"] = new paths.Line([-wt, height], [wt, height]);
            }

        }
    }

    (<IKit>Dome).metaParameters = [
        { title: "width", type: "range", min: 1, max: 100, value: 50 },
        { title: "height", type: "range", min: 1, max: 100, value: 100 },
        { title: "radius", type: "range", min: 0, max: 50, value: 25 },
        { title: "bottomless", type: "bool", value: false }
    ];
}
