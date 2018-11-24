namespace MakerJs.dimensions {

    export class Angular implements IModel {
        public static readonly typeName = 'dimensions.Angular';

        public caption: ICaption;
        public models: IModelMap;
        public paths: IPathMap;
        public type: string;
        public origin: IPoint;

        constructor(
            size: Size,
            origin: IPoint, baseRadius: number, startAngle: number, endAngle: number, extensions?: boolean);

        constructor(
            arrowSize: number, arrowSpanAngle: number, accuracy: number, textOffset: number, entensionLength: number, extensionAnchor: number,
            origin: IPoint, radius: number, startAngle: number, endAngle: number, extensions?: boolean);

        constructor(...args: any[]) {
            let temp: _Angular;
            switch (args.length) {
                case 5:
                case 6:
                    temp = {} as _Angular;
                    _Angular.apply(temp, args);
                    break;
                default:
                    temp = new _Angular(Size.fromArgs(args), args.shift(), args.shift(), args.shift(), args.shift(), args.shift());
                    break;
            }
            this.type = Angular.typeName;
            this.models = temp.models;
            this.paths = temp.paths;
            this.caption = temp.caption;
            this.origin = temp.origin;
        }
    }
    /**
     * @private
     */
    class _Angular implements IModel {
        public caption: ICaption;
        public models: IModelMap;
        public paths: IPathMap;
        public origin: IPoint;

        constructor(size: Size, origin: IPoint, baseRadius: number, startAngle: number, endAngle: number, extensions?: boolean) {
            const dr = extensions ? baseRadius + size.entensionLength * size.extensionAnchor : baseRadius;
            const dimensionLine = new paths.Arc([0, 0], dr, startAngle, endAngle);
            this.paths = {
                dimensionLine
            };
            const ends = point.fromPathEnds(dimensionLine);
            this.models = {
                arrow1: model.move(new ArrowHead(size, startAngle - 90), ends[0]),
                arrow2: model.move(new ArrowHead(size, endAngle + 90), ends[1])
            };
            if (extensions) {
                const extEnds = [
                    new paths.Arc([0, 0], baseRadius, startAngle, endAngle),
                    new paths.Arc([0, 0], baseRadius + size.entensionLength, startAngle, endAngle)
                ].map(arc => point.fromPathEnds(arc));
                this.paths.extension1 = new paths.Line(extEnds[0][0], extEnds[1][0]);
                this.paths.extension2 = new paths.Line(extEnds[0][1], extEnds[1][1]);
            }
            const arcSpan = angle.ofArcSpan(dimensionLine);
            const half = startAngle + arcSpan / 2;
            const anchor = [[dr + size.textOffset, 1], [dr + size.textOffset, -1]]
                .map((p: IPoint) => point.rotate(p, half));
            if (angle.noRevolutions(half) > 180) {
                anchor.reverse();
            }
            model.addCaption(this, round(arcSpan, size.accuracy).toString(), anchor[0], anchor[1]);
            this.origin = point.clone(origin);
        }
    }

    (<IKit>Angular).metaParameters = (<IKit>Size).metaParameters.concat([
        {
            title: "origin", type: "select", value: [
                [0, 0], [40, 40], [-60, 0], [100, 100], [-60, -60], [0, 10]
            ]
        },
        { title: "base radius", type: "range", min: 1, max: 100, value: 50 },
        { title: "start angle", type: "range", min: 0, max: 360, value: 0 },
        { title: "end angle", type: "range", min: 0, max: 360, value: 45 },
        { title: "extensions", type: "bool", value: true }
    ]);
}
