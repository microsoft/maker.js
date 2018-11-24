namespace MakerJs.dimensions {

    export class Radial implements IModel {
        public static readonly typeName = 'dimensions.Radial';

        public caption: ICaption;
        public models: IModelMap;
        public paths: IPathMap;
        public type: string;
        public origin: IPoint;

        constructor(
            size: Size,
            origin: IPoint, radius: number, angleInDegrees: number);

        constructor(
            arrowSize: number, arrowSpanAngle: number, accuracy: number, textOffset: number, entensionLength: number, extensionAnchor: number,
            origin: IPoint, radius: number, angleInDegrees: number);

        constructor(...args: any[]) {
            let temp: _Radial;
            switch (args.length) {
                case 3:
                    temp = {} as _Radial;
                    _Radial.apply(temp, args);
                    break;
                default:
                    temp = new _Radial(Size.fromArgs(args), args.shift(), args.shift(), args.shift());
                    break;
            }
            this.type =  Radial.typeName;
            this.models = temp.models;
            this.paths = temp.paths;
            this.caption = temp.caption;
            this.origin = temp.origin;
        }
    }
    /**
     * @private
     */
    class _Radial implements IModel {
        public caption: ICaption;
        public models: IModelMap;
        public paths: IPathMap;
        public origin: IPoint;

        constructor(size: Size, origin: IPoint, radius: number, angleInDegrees: number) {
            this.paths = {
                dimensionLine: new paths.Line([0, 0], [radius, 0])
            };
            this.models = {
                arrow: model.move(new ArrowHead(size, 0), [radius, 0])
            };
            const anchor = [[0, size.textOffset], [radius, size.textOffset]];
            if (90 < angleInDegrees && angleInDegrees < 270) {
                anchor.reverse();
            }
            model.addCaption(this, round(radius, size.accuracy).toString(), anchor[0], anchor[1]);
            if (angleInDegrees) {
                model.rotate(this, angleInDegrees);
            }
            this.origin = point.clone(origin);
        }
    }

    (<IKit>Radial).metaParameters = (<IKit>Size).metaParameters.concat([
        {
            title: "origin", type: "select", value: [
                [0, 0], [40, 40], [-60, 0], [100, 100], [-60, -60], [0, 10]
            ]
        },
        { title: "radius", type: "range", min: 1, max: 100, value: 50 },
        { title: "angle", type: "range", min: 0, max: 360, value: 0 }
    ]);
}
