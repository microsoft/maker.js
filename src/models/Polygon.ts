module MakerJs.models {
    export class Polygon implements IModel {
        
        public paths: IPathMap = {};

        constructor(numberOfSides: number, radius: number, firstCornerAngleInDegrees: number = 0) {
            this.paths = new ConnectTheDots(true, Polygon.getPoints(numberOfSides, radius, firstCornerAngleInDegrees)).paths;
        }

        public static getPoints(numberOfSides: number, radius: number, firstCornerAngleInDegrees: number = 0): IPoint[] {
            var points = [];

            var a1 = angle.toRadians(firstCornerAngleInDegrees);
            var a = 2 * Math.PI / numberOfSides;

            for (var i = 0; i < numberOfSides; i++) {
                points.push(point.fromPolar(a * i + a1, radius));
            }

            return points;
        }
    }

    (<IKit>Polygon).metaParameters = [
        { title: "number of sides", type: "range", min: 3, max: 24, value: 6 },
        { title: "radius", type: "range", min: 1, max: 100, value: 50 },
        { title: "offset angle", type: "range", min: 0, max: 180, value: 0 }
    ];
}
