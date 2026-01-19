/// <reference types="fontkit" />

declare namespace fontkit {
    export type Font = import('fontkit').Font;
}

namespace MakerJs {

    /**
     * Layout options for fontkit font rendering.
     * These options are passed to the fontkit layout engine.
     */
    export interface IFontkitLayoutOptions {
        /** OpenType features to enable/disable (array of feature tags or object mapping feature tags to boolean) */
        features?: string[] | Record<string, boolean>;
        /** Script code (e.g., 'latn', 'arab') */
        script?: string;
        /** Language code (e.g., 'ENG', 'ARA') */
        language?: string;
        /** Text direction ('ltr' or 'rtl') */
        direction?: string;
    }

}

namespace MakerJs.models {

    export class Text implements IModel {
        public models: IModelMap = {};

        /**
         * Renders text in a given font to a model.
         * @param font OpenType.Font object or fontkit font object.
         * @param text String of text to render.
         * @param fontSize Font size.
         * @param combine Flag (default false) to perform a combineUnion upon each character with characters to the left and right.
         * @param centerCharacterOrigin Flag (default false) to move the x origin of each character to the center. Useful for rotating text characters.
         * @param bezierAccuracy Optional accuracy of Bezier curves.
         * @param opentypeOptions Optional opentype.RenderOptions object or fontkit layout options.
         * @returns Model of the text.
         */
        constructor(font: opentype.Font | fontkit.Font, text: string, fontSize: number, combine = false, centerCharacterOrigin = false, bezierAccuracy?: number, opentypeOptions?: opentype.RenderOptions | IFontkitLayoutOptions) {
            var charIndex = 0;
            var prevDeleted: IModel;
            var prevChar: IModel;

            var cb = (glyph: any, x: number, y: number, _fontSize: number, options: any) => {
                var charModel = Text.glyphToModel(glyph, _fontSize, bezierAccuracy, font);
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

            // Detect if font is fontkit (has layout method) or opentype.js (has forEachGlyph)
            if ((font as any).layout && typeof (font as any).layout === 'function') {
                // fontkit font - use layout engine
                const fontkitFont = font as fontkit.Font;
                const layoutOpts = opentypeOptions as IFontkitLayoutOptions | undefined;
                const run = fontkitFont.layout(
                    text,
                    layoutOpts?.features,
                    layoutOpts?.script,
                    layoutOpts?.language,
                    layoutOpts?.direction
                );
                const scale = fontSize / fontkitFont.unitsPerEm;
                let currentX = 0;

                for (let i = 0; i < run.glyphs.length; i++) {
                    const glyph = run.glyphs[i];
                    const position = run.positions[i];

                    const glyphX = currentX + (position.xOffset || 0) * scale;
                    const glyphY = (position.yOffset || 0) * scale;

                    cb(glyph, glyphX, glyphY, fontSize, opentypeOptions);

                    currentX += (position.xAdvance || 0) * scale;
                }
            } else {
                // opentype.js font - use forEachGlyph
                const opentypeFont = font as opentype.Font;
                opentypeFont.forEachGlyph(text, 0, 0, fontSize, opentypeOptions as opentype.RenderOptions, cb);
            }
        }

        /**
         * Convert an opentype glyph or fontkit glyph to a model.
         * @param glyph Opentype.Glyph object or fontkit glyph.
         * @param fontSize Font size.
         * @param bezierAccuracy Optional accuracy of Bezier curves.
         * @param font Optional font object (needed for fontkit to get scale).
         * @returns Model of the glyph.
         */
        static glyphToModel(glyph: any, fontSize: number, bezierAccuracy?: number, font?: any) {
            var charModel: IModel = {};
            var firstPoint: IPoint;
            var currPoint: IPoint;
            var pathCount = 0;

            function addPath(p: IPath, layer?: string) {
                if (!charModel.paths) {
                    charModel.paths = {};
                }
                if (layer) {
                    if (!charModel.layer) charModel.layer = layer;
                }
                charModel.paths['p_' + ++pathCount] = p;
            }

            function addModel(m: IModel, layer?: string) {
                if (!charModel.models) {
                    charModel.models = {};
                }
                if (layer) {
                    if (!charModel.layer) charModel.layer = layer;
                }
                charModel.models['p_' + ++pathCount] = m;
            }

            // Detect if this is a fontkit glyph (has path property) or opentype.js glyph (has getPath method)
            var isFontkitGlyph = glyph.path && !glyph.getPath;
            var p: any;

            if (isFontkitGlyph && font) {
                // fontkit glyph
                const scale = fontSize / font.unitsPerEm;
                p = glyph.path;

                // Check for color layers (COLR table support)
                if (glyph.layers && glyph.layers.length > 0) {
                    // Handle color glyph with layers
                    glyph.layers.forEach((layer: any, layerIndex: number) => {
                        const layerGlyph = font.getGlyph(layer.glyph);
                        const layerPath = layerGlyph.path;

                        if (layerPath && layerPath.commands) {
                            // Get color from palette if available
                            let layerColor: string | undefined;
                            if (font['COLR'] && font['CPAL'] && layer.color !== undefined) {
                                const palette = font['CPAL'].colorPalettes[0]; // Use first palette
                                if (palette && palette[layer.color]) {
                                    const color = palette[layer.color];
                                    // Convert RGBA to hex color for layer name
                                    layerColor = `color_${color.red.toString(16).padStart(2, '0')}${color.green.toString(16).padStart(2, '0')}${color.blue.toString(16).padStart(2, '0')}`;
                                }
                            }

                            // Process layer path commands
                            let layerFirstPoint: IPoint;
                            let layerCurrPoint: IPoint;

                            for (const cmd of layerPath.commands) {
                                var points: IPoint[] = Text.convertFontkitCommand(cmd, scale);

                                switch (cmd.command) {
                                    case 'moveTo':
                                        layerFirstPoint = points[0];
                                        layerCurrPoint = points[0];
                                        break;

                                    case 'closePath':
                                        points[0] = layerFirstPoint;
                                    // fall through to line

                                    case 'lineTo':
                                        if (layerCurrPoint && !measure.isPointEqual(layerCurrPoint, points[0])) {
                                            addPath(new paths.Line(layerCurrPoint, points[0]), layerColor);
                                        }
                                        layerCurrPoint = points[0];
                                        break;

                                    case 'bezierCurveTo':
                                        if (layerCurrPoint) {
                                            addModel(new models.BezierCurve(layerCurrPoint, points[0], points[1], points[2], bezierAccuracy), layerColor);
                                        }
                                        layerCurrPoint = points[2];
                                        break;

                                    case 'quadraticCurveTo':
                                        if (layerCurrPoint) {
                                            addModel(new models.BezierCurve(layerCurrPoint, points[0], points[1], bezierAccuracy), layerColor);
                                        }
                                        layerCurrPoint = points[1];
                                        break;
                                }
                            }
                        }
                    });
                    return charModel;
                }

                // Standard fontkit glyph (no color layers)
                if (!p || !p.commands) {
                    return charModel; // Empty glyph (e.g., space)
                }

                for (const cmd of p.commands) {
                    var points: IPoint[] = Text.convertFontkitCommand(cmd, scale);

                    switch (cmd.command) {
                        case 'moveTo':
                            firstPoint = points[0];
                            currPoint = points[0];
                            break;

                        case 'closePath':
                            points[0] = firstPoint;
                        // fall through to line

                        case 'lineTo':
                            if (!measure.isPointEqual(currPoint, points[0])) {
                                addPath(new paths.Line(currPoint, points[0]));
                            }
                            currPoint = points[0];
                            break;

                        case 'bezierCurveTo':
                            addModel(new models.BezierCurve(currPoint, points[0], points[1], points[2], bezierAccuracy));
                            currPoint = points[2];
                            break;

                        case 'quadraticCurveTo':
                            addModel(new models.BezierCurve(currPoint, points[0], points[1], bezierAccuracy));
                            currPoint = points[1];
                            break;
                    }
                }
            } else {
                // opentype.js glyph
                p = glyph.getPath(0, 0, fontSize);

                p.commands.map((command: any, i: number) => {

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
            }

            return charModel;
        }

        /**
         * Convert fontkit path command to points array
         * @param cmd Fontkit path command
         * @param scale Scale factor
         * @returns Array of points
         */
        private static convertFontkitCommand(cmd: any, scale: number): IPoint[] {
            const points: IPoint[] = [];

            switch (cmd.command) {
                case 'moveTo':
                case 'lineTo':
                    points.push([cmd.args[0] * scale, cmd.args[1] * scale]);
                    break;

                case 'quadraticCurveTo':
                    // Control point, end point
                    points.push([cmd.args[0] * scale, cmd.args[1] * scale]);
                    points.push([cmd.args[2] * scale, cmd.args[3] * scale]);
                    break;

                case 'bezierCurveTo':
                    // Control point 1, control point 2, end point
                    points.push([cmd.args[0] * scale, cmd.args[1] * scale]);
                    points.push([cmd.args[2] * scale, cmd.args[3] * scale]);
                    points.push([cmd.args[4] * scale, cmd.args[5] * scale]);
                    break;
            }

            return points;
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
