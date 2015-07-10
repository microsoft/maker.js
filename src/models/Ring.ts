module MakerJs.models {

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
} 