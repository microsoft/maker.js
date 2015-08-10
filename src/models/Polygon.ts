/// <reference path="connectthedots.ts" />

module MakerJs.models {
    export class Polygon extends ConnectTheDots {
        constructor(numberOfSides: number, radius: number, firstCornerAngleInDegrees: number = 0) {
            super(true, Polygon.getPoints(numberOfSides, radius, firstCornerAngleInDegrees));
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
}