namespace MakerJs.dimensions {

    export class ArrowHead implements IModel {
        public static readonly typeName = 'dimensions.ArrowHead';

        public layer: string;
        public paths: IPathMap;
        public type: string;

        constructor(
            size: Size,
            angleDirection: number);

        constructor(
            arrowSize: number, arrowSpanAngle: number, accuracy: number, textOffset: number, entensionLength: number, extensionAnchor: number,
            angleDirection: number);

        constructor(...args: any[]) {
            let temp: _ArrowHead;
            switch (args.length) {
                case 2:
                    temp = {} as _ArrowHead;
                    _ArrowHead.apply(temp, args);
                    break;
                default:
                    temp = new _ArrowHead(Size.fromArgs(args), args.shift());
                    break;
            }
            this.type = this.layer = ArrowHead.typeName;
            this.paths = temp.paths;
        }
    }

    /**
     * @private
     */
    class _ArrowHead {
        public paths: IPathMap;
        constructor(size: Size, angleDirection = 0) {
            const end = point.rotate([-size.arrowSize, 0], -size.arrowSpanAngle / 2);
            this.paths = {
                top: new paths.Line(point.zero(), end),
                bottom: new paths.Line(point.zero(), point.mirror(end, false, true))
            };
            if (angleDirection) {
                model.rotate(this, angleDirection);
            }
        }
    }

    (<IKit>ArrowHead).metaParameters = (<IKit>Size).metaParameters.concat([
        { title: "direction angle", type: "range", min: 0, max: 360, value: 0 }
    ]);
}
