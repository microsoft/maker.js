namespace MakerJs.models {

    export class Ring implements IModel {

        public paths: IPathMap = {};

        constructor(outerRadius: number, innerRadius: number) {

            var radii = {
                "Ring_outer": outerRadius,
                "Ring_inner": innerRadius
            };

            for (var id in radii) {
                this.paths[id] = new paths.Circle(point.zero(), radii[id]);
            }
        }
    }

    (<IKit>Ring).metaParameters = [
        { title: "outer radius", type: "range", min: 0, max: 100, step: 1, value: 50 },
        { title: "inner radius", type: "range", min: 0, max: 100, step: 1, value: 20 }
    ];
}
