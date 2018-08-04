namespace MakerJs.models {

    export class Text implements IModel {
        public models: IModelMap = {};

        /**
         * Renders text in a given font to a model.
         * @param font OpenType.Font object.
         * @param text String of text to render.
         * @param fontSize Font size.
         * @param combine Flag (default false) to perform a combineUnion upon each character with characters to the left and right.
         * @param centerCharacterOrigin Flag (default false) to move the x origin of each character to the center. Useful for rotating text characters.
         * @param bezierAccuracy Optional accuracy of Bezier curves.
         * @param opentypeOptions Optional opentype.RenderOptions object.
         * @returns Model of the text.
         */
        constructor(font: opentype.Font, text: string, fontSize: number, combine = false, centerCharacterOrigin = false, bezierAccuracy?: number, opentypeOptions?: opentype.RenderOptions) {
            var charIndex = 0;
            var prevDeleted: IModel;
            var prevChar: IModel;

            var cb = (glyph: opentype.Glyph, x: number, y: number, _fontSize: number, options: opentype.RenderOptions) => {
                var charModel = Text.glyphToModel(glyph, _fontSize, bezierAccuracy);
                charModel.origin = [x, 0];

                if (centerCharacterOrigin && (charModel.paths || charModel.models)) {
                    var m = measure.modelExtents(charModel);
                    if (m) {
                        var w = m.high[0] - m.low[0];
                        model.originate(charModel, [m.low[0] + w / 2, 0]);
                    }
                }

                if (combine && charIndex > 0) {
                    var combineOptions: ICombineOptions = {};
                    var prev: IModel;

                    if (prevDeleted) {

                        //form a temporary complete geometry of the previous character using the previously deleted segments
                        prev = {
                            models: {
                                deleted: prevDeleted,
                                char: prevChar
                            }
                        }
                    } else {
                        prev = prevChar;
                    }

                    model.combine(prev, charModel, false, true, false, true, combineOptions);

                    //save the deleted segments from this character for the next iteration
                    prevDeleted = combineOptions.out_deleted[1];
                }

                this.models[charIndex] = charModel;
                charIndex++;
                prevChar = charModel;
            };

            font.forEachGlyph(text, 0, 0, fontSize, opentypeOptions, cb);
        }

        /**
         * Convert an opentype glyph to a model.
         * @param glyph Opentype.Glyph object.
         * @param fontSize Font size.
         * @param bezierAccuracy Optional accuracy of Bezier curves.
         * @returns Model of the glyph.
         */
        static glyphToModel(glyph: opentype.Glyph, fontSize: number, bezierAccuracy?: number) {
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
                    p => {
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
                        addModel(new models.BezierCurve(currPoint, points[1], points[2], points[0], bezierAccuracy));
                        break;

                    case 'Q':
                        addModel(new models.BezierCurve(currPoint, points[1], points[0], bezierAccuracy));
                        break;
                }

                currPoint = points[0];
            });

            return charModel;
        }
    }

    (<IKit>Text).metaParameters = [
        { title: "font", type: "font", value: '*' },
        { title: "text", type: "text", value: 'Hello' },
        { title: "font size", type: "range", min: 10, max: 200, value: 72 },
        { title: "combine", type: "bool", value: false },
        { title: "center character origin", type: "bool", value: false }
    ];
}
