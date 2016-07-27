namespace MakerJs.models {

    export class Text implements IModel {

        public models: IModelMap = {};

        constructor(text: string, font: opentypejs.Font, fontSize: number, combine = false) {

            var charIndex = 0;
            var combineOptions: ICombineOptions = {};

            var cb = (glyph: opentypejs.Glyph, x: number, y: number, fontSize: number, options: opentypejs.RenderOptions) => {
                var m = glyph.getMetrics();
                var charModel: IModel = {};
                var firstPoint: IPoint;
                var currPoint: IPoint;
                var pathCount = 0;

                function addPath(p: IPath) {
                    if (!charModel.paths) {
                        charModel.paths = {};
                    }
                    charModel.paths['p_' + ++pathCount] = p;
                }

                function addModel(m: IModel) {
                    if (!charModel.models) {
                        charModel.models = {};
                    }
                    charModel.models['p_' + ++pathCount] = m;
                }

                var p = glyph.getPath(0, 0, fontSize);
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
                            points[0] = firstPoint;
                        //fall through to line

                        case 'L':
                            if (!measure.isPointEqual(currPoint, points[0])) {
                                addPath(new paths.Line(currPoint, points[0]));
                            }
                            break;

                        case 'C':
                            addModel(new models.BezierCurve(currPoint, points[1], points[2], points[0]));
                            break;

                        case 'Q':
                            addModel(new models.BezierCurve(currPoint, points[1], points[0]));
                            break;

                    }

                    currPoint = points[0];

                });

                //TODO - add centering
                charModel.origin = [x, 0];

                if (combine && charIndex > 0) {
                    model.combine(this, charModel, false, true, false, true, combineOptions);
                    delete combineOptions.measureB;

                    //TODO - optimize for left to right 
                    combineOptions.measureA.modelsMeasured = false;
                }

                this.models[charIndex] = charModel;
                charIndex++;
            };

            font.forEachGlyph(text, 0, 0, fontSize, null, cb);

        }

    }

}
