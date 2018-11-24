namespace MakerJs.dimensions {

    export class Linear implements IModel {
        public static readonly typeName = 'dimensions.Linear';

        public caption: ICaption;
        public models: IModelMap;
        public paths: IPathMap;
        public type: string;
        public origin: IPoint;

        constructor(
            size: Size,
            p1: IPoint, p2: IPoint, extensions?: boolean);

        constructor(
            arrowSize: number, arrowSpanAngle: number, accuracy: number, textOffset: number, entensionLength: number, extensionAnchor: number,
            p1: IPoint, p2: IPoint, extensions?: boolean);

        constructor(...args: any[]) {
            let temp: _Linear;
            switch (args.length) {
                case 3:
                case 4:
                    temp = {} as _Linear;
                    _Linear.apply(temp, args);
                    break;
                default:
                    temp = new _Linear(Size.fromArgs(args), args.shift(), args.shift(), args.shift());
                    break;
            }
            this.type = Linear.typeName;
            this.models = temp.models;
            this.paths = temp.paths;
            this.caption = temp.caption;
            this.origin = temp.origin;
        }
    }

    /**
     * @private
     */
    class _Linear implements IModel {
        public caption: ICaption;
        public models: IModelMap;
        public paths: IPathMap;
        public origin: IPoint;

        constructor(size: Size, p1: IPoint, p2: IPoint, extensions?: boolean) {
            const a = angle.ofPointInDegrees(p1, p2);
            const d = measure.pointDistance(p1, p2);
            const y = extensions ? size.entensionLength * size.extensionAnchor : 0;
            this.paths = {
                dimensionLine: new paths.Line([0, y], [d, y])
            };
            if (extensions) {
                this.paths.extension1 = new paths.Line([0, 0], [0, size.entensionLength]);
                this.paths.extension2 = new paths.Line([d, 0], [d, size.entensionLength]);
            }
            this.models = {
                arrow1: model.move(new ArrowHead(size, 180), [0, y]),
                arrow2: model.move(new ArrowHead(size, 0), [d, y])
            };
            const anchor = [[0, y + size.textOffset], [d, y + size.textOffset]];
            if (90 < a && a < 270) {
                anchor.reverse();
            }
            model.addCaption(this, round(d, size.accuracy).toString(), anchor[0], anchor[1]);
            if (a) {
                model.rotate(this, a);
            }
            this.origin = point.clone(p1);
        }
    }

    (<IKit>Linear).metaParameters = (<IKit>Size).metaParameters.concat([
        {
            title: "point 1", type: "select", value: [
                [0, 0], [40, 40], [-60, 0], [100, 100], [-60, -60], [0, 10]
            ]
        },
        {
            title: "point 2", type: "select", value: [
                [100, 0], [100, 50], [50, 87], [-100, -10]
            ]
        },
        { title: "extensions", type: "bool", value: true }
    ]);
}
