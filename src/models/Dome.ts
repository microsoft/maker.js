module MakerJs.models {

    export class Dome implements IModel {

        public paths: IPathMap = {};

        constructor(width: number, height: number, radius: number = Math.min(width / 2, height)) {

            var w2 = width / 2;
            var wt = Math.max(w2 - radius, 0);
            var hr = Math.max(height - radius, 0);

            this.paths["Bottom"] = new paths.Line([-w2, 0], [w2, 0]);

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
}
