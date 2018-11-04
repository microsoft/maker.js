namespace MakerJs.dimensions {

    export class ArrowHead implements IModel {
        public static readonly typeName = 'dimensions.ArrowHead';

        public layer: string;
        public paths: IPathMap = {};
        public type: string;

        constructor(sizeOrLength: number | Size, angleDirection = 0, angleSpan: number = 45) {
            const len = isNumber(sizeOrLength) ? sizeOrLength as number : (sizeOrLength as Size).arrowSize;
            this.type = this.layer = Arrow.typeName;
            const end = point.rotate([-len, 0], -angleSpan / 2);
            this.paths.top = new paths.Line(point.zero(), end);
            this.paths.bottom = new paths.Line(point.zero(), point.mirror(end, false, true));
            if (angleDirection) {
                model.rotate(this, angleDirection);
            }
        }
    }

    (<IKit>Arrow).metaParameters = [
        { title: "size", type: "range", min: 1, max: 100, value: 5 },
        { title: "direction angle", type: "range", min: 0, max: 360, value: 0 },
        { title: "span angle", type: "range", min: 5, max: 135, value: 45 }
    ];
}
