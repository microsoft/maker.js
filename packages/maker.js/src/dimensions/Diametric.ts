namespace MakerJs.dimensions {

    export class Diametric implements IModel {
        public static readonly typeName = 'dimensions.Diametric';

        public caption: ICaption;
        public models: IModelMap;
        public paths: IPathMap;
        public type: string;
        public origin: IPoint;

        constructor(
            size: Size,
            origin: IPoint, diameter: number, angleInDegrees: number);

        constructor(
            arrowSize: number, arrowSpanAngle: number, accuracy: number, textOffset: number, entensionLength: number, extensionAnchor: number,
            origin: IPoint, diameter: number, angleInDegrees: number);

        constructor(...args: any[]) {
            let temp: _Diametric;
            switch (args.length) {
                case 3:
                    temp = {} as _Diametric;
                    _Diametric.apply(temp, args);
                    break;
                default:
                    temp = new _Diametric(Size.fromArgs(args), args.shift(), args.shift(), args.shift());
                    break;
            }
            this.type = Diametric.typeName;
            this.models = temp.models;
            this.paths = temp.paths;
            this.caption = temp.caption;
            this.origin = temp.origin;
        }
    }
    /**
     * @private
     */
    class _Diametric implements IModel {
        public caption: ICaption;
        public models: IModelMap;
        public paths: IPathMap;
        public origin: IPoint;

        constructor(size: Size, origin: IPoint, diameter: number, angleInDegrees: number) {
            const radius = diameter / 2;
            this.paths = {
                dimensionLine: new paths.Line([-radius, 0], [radius, 0])
            };
            this.models = {
                arrow1: model.move(new ArrowHead(size, 0), [radius, 0]),
                arrow2: model.move(new ArrowHead(size, 180), [-radius, 0])
            };
            const anchor = [[-radius, size.textOffset], [radius, size.textOffset]];
            if (90 < angleInDegrees && angleInDegrees < 270) {
                anchor.reverse();
            }
            model.addCaption(this, round(diameter, size.accuracy).toString(), anchor[0], anchor[1]);
            if (angleInDegrees) {
                model.rotate(this, angleInDegrees);
            }
            this.origin = point.clone(origin);
        }
    }

    (<IKit>Diametric).metaParameters = (<IKit>Size).metaParameters.concat([
        {
            title: "origin", type: "select", value: [
                [0, 0], [40, 40], [-60, 0], [100, 100], [-60, -60], [0, 10]
            ]
        },
        { title: "diameter", type: "range", min: 1, max: 100, value: 50 },
        { title: "angle", type: "range", min: 0, max: 360, value: 0 }
    ]);
}
