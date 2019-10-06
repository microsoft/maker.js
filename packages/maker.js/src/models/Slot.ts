namespace MakerJs.models {

    export class Slot implements IModel {

        public paths: IPathMap = {};
        public origin: IPoint;
        public models: IModelMap;

        constructor(origin: IPoint, endPoint: IPoint, radius: number, isolateCaps = false) {

            var capRoot: IModel;

            if (isolateCaps) {
                capRoot = { models: {} };
                this.models = { 'Caps': capRoot };
            }

            var addCap = (id: string, capPath: IPath) => {
                var capModel: IModel;

                if (isolateCaps) {
                    capModel = { paths: {} };
                    capRoot.models[id] = capModel;
                } else {
                    capModel = this;
                }

                capModel.paths[id] = capPath;
                return capPath;
            }

            var a = angle.ofPointInDegrees(origin, endPoint);

            const startCap = addCap('StartCap', new paths.Arc([0, 0], radius, a + 90, a + 270));
            const endCap = addCap('EndCap', new paths.Arc(point.subtract(endPoint, origin), radius, a + 270, a + 90));

            const startCapEndpoints = point.fromPathEnds(startCap);
            const endCapEndpoints = point.fromPathEnds(endCap);

            this.paths['Top'] = new paths.Line(endCapEndpoints[1], startCapEndpoints[0]);
            this.paths['Bottom'] = new paths.Line(startCapEndpoints[1], endCapEndpoints[0]);

            this.origin = origin;
        }
    }

    (<IKit>Slot).metaParameters = [
        {
            title: "origin", type: "select", value: [
                [0, 0],
                [10, 0],
                [10, 10]
            ]
        },
        {
            title: "end", type: "select", value: [
                [80, 0],
                [0, 30],
                [10, 30]
            ]
        },
        { title: "radius", type: "range", min: 1, max: 50, value: 10 }
    ];
}
