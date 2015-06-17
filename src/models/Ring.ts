module MakerJs.models {

    export class Ring implements IModel {

        public paths: IPath[] = [];

        constructor(public id: string, outerRadius: number, innerRadius: number) {

            var radii = {
                "Ring_outer": outerRadius,
                "Ring_inner": innerRadius
            };

            for (var key in radii) {
                this.paths.push(new paths.Circle(key, point.zero(), radii[key]));
            }
        }
    }
} 