namespace MakerJs.models {

    export class OpentypeText implements IModel {

        public models: IModelMap = {};
        public paths: IPathMap = {};

        constructor(text: string, font: opentypejs.Font) {

            var p = font.getPath(text, 0, 0, 72);

            var firstPoint: IPoint;
            var currPoint: IPoint;
            var pathCount = 0;

            p.commands.map((command, i) => {

                var points: IPoint[] = [[command.x, command.y], [command.x1, command.y1], [command.x2, command.y2]].map(
                    function (p) {
                        if (p[0] !== void 0) {
                            return point.mirror(p, false, true);
                        }
                    }
                );

                switch (command.type) {

                    case 'M':
                        firstPoint = points[0];
                        break;

                    case 'Z':
                        if (measure.isPointEqual(firstPoint, currPoint)) {
                            break;
                        }
                        //fall through to line
                        points[0] = firstPoint;

                    case 'L':
                        this.paths['p_' + ++pathCount] = new paths.Line(currPoint, points[0]);
                        break;

                    case 'C':
                        this.models['p_' + ++pathCount] = new models.BezierCurve(currPoint, points[1], points[2], points[0]);
                        break;

                    case 'Q':
                        this.models['p_' + ++pathCount] = new models.BezierCurve(currPoint, points[1], points[0]);
                        break;

                }

                currPoint = points[0];

            });

        }

    }

}
