/// <reference path="polygon.ts" />
/// <reference path="connectthedots.ts" />

module MakerJs.models {

    export class Star implements IModel {

        public paths: IPathMap = {};

        constructor(numberOfPoints: number, outerRadius: number, innerRadius?: number, skipPoints: number = 2) {

            if (!innerRadius) {
                innerRadius = outerRadius * Star.InnerRadiusRatio(numberOfPoints, skipPoints);
            }

            var outerPoints = Polygon.getPoints(numberOfPoints, outerRadius);
            var innerPoints = Polygon.getPoints(numberOfPoints, innerRadius, 180 / numberOfPoints);

            var allPoints: IPoint[] = [];

            for (var i = 0; i < numberOfPoints; i++) {
                allPoints.push(outerPoints[i]);
                allPoints.push(innerPoints[i]);
            }

            var model = new ConnectTheDots(true, allPoints);

            this.paths = model.paths;

            delete model.paths;
        }

        public static InnerRadiusRatio(numberOfPoints: number, skipPoints: number): number {
            //formula from http://www.jdawiseman.com/papers/easymath/surds_star_inner_radius.html
            //Cos(Pi()*m/n) / Cos(Pi()*(m-1)/n)

            if (numberOfPoints > 0 && skipPoints > 1 && skipPoints < numberOfPoints / 2) {
                return Math.cos(Math.PI * skipPoints / numberOfPoints) / Math.cos(Math.PI * (skipPoints - 1) / numberOfPoints);
            }

            return 0;
        }

    }
} 