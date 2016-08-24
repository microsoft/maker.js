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
            }

            var a = angle.ofPointInDegrees(origin, endPoint);
            var len = measure.pointDistance(origin, endPoint);

            this.paths['Top'] = new paths.Line([0, radius], [len, radius]);
            this.paths['Bottom'] = new paths.Line([0, -radius], [len, -radius]);

            addCap('StartCap', new paths.Arc([0, 0], radius, 90, 270));
            addCap('EndCap', new paths.Arc([len, 0], radius, 270, 90));

            model.rotate(this, a, [0, 0]);

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
