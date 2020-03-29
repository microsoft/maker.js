namespace MakerJs.models {

    export class MildBezierExpansion implements IModel {

        public paths: IPathMap = {};
        public models: IModelMap;

        constructor(seed: IPathBezierSeed, expansion: number, isolateCaps = false) {
            //TODO
        }
    }

    (<IKit>MildBezierExpansion).metaParameters = [
        {
            title: "seed", type: "select", value: [
                <IPathBezierSeed>{ type: pathType.BezierSeed, origin: [0, 0], end: [100, 0], controls: [[50, 20]] }
            ]
        },
        { title: "expansion", type: "range", min: 0, max: 100, step: 1, value: 10 }
    ];
}
