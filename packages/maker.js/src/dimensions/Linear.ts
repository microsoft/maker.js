namespace MakerJs.dimensions {

    export class Linear implements IModel {
        public static readonly typeName = 'dimensions.Linear';

        constructor() {
            var d: DxfParser.EntityDIMENSION = {
                type: "DIMENSION",
                anchorPoint: null,
                linearOrAngularPoint1: null,
                linearOrAngularPoint2: null,
            }
            //extension lines
            //line
            //arrows
        }
    }

}
