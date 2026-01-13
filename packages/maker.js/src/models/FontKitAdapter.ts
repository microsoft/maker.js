namespace MakerJs.models {

    /**
     * Adapter interface to support multiple font libraries
     */
    export interface IFontAdapter {
        /**
         * Iterate through glyphs in text with positioning
         * @param text String of text to render
         * @param x Starting x position
         * @param y Starting y position  
         * @param fontSize Font size in points
         * @param options Additional options (library-specific)
         * @param callback Function called for each glyph with position
         */
        forEachGlyph(
            text: string,
            x: number,
            y: number,
            fontSize: number,
            options: any,
            callback: (glyph: IAdaptedGlyph, x: number, y: number, fontSize: number, options: any) => void
        ): void;
    }

    /**
     * Glyph interface compatible with opentype.js structure
     */
    export interface IAdaptedGlyph {
        /**
         * Get path data for the glyph
         * @param x X coordinate
         * @param y Y coordinate
         * @param fontSize Font size
         * @returns Path object with commands array
         */
        getPath(x: number, y: number, fontSize: number): IAdaptedPath;
    }

    /**
     * Path interface compatible with opentype.js structure
     */
    export interface IAdaptedPath {
        /**
         * Array of path commands
         */
        commands: IPathCommand[];
    }

    /**
     * Path command compatible with opentype.js structure
     * Types: 'M' (moveTo), 'L' (lineTo), 'C' (cubic bezier), 'Q' (quadratic bezier), 'Z' (closePath)
     */
    export interface IPathCommand {
        type: 'M' | 'L' | 'C' | 'Q' | 'Z';
        x?: number;
        y?: number;
        x1?: number;
        y1?: number;
        x2?: number;
        y2?: number;
    }

    /**
     * Adapter to make fontkit fonts compatible with Maker.js Text model.
     * This adapter wraps a fontkit font object and provides an API compatible
     * with opentype.js, allowing fontkit fonts to be used with the Text model.
     * 
     * @example
     * ```typescript
     * // Node.js
     * const fontkit = require('fontkit');
     * const font = fontkit.openSync('path/to/font.ttf');
     * const adapter = new MakerJs.models.FontKitAdapter(font);
     * const text = new MakerJs.models.Text(adapter, 'Hello', 72);
     * 
     * // Browser
     * fetch('path/to/font.ttf')
     *   .then(res => res.arrayBuffer())
     *   .then(buffer => {
     *     const font = fontkit.create(buffer);
     *     const adapter = new MakerJs.models.FontKitAdapter(font);
     *     const text = new MakerJs.models.Text(adapter, 'Hello', 72);
     *   });
     * ```
     */
    export class FontKitAdapter implements IFontAdapter {

        /**
         * Create a new FontKit adapter
         * @param font A fontkit font object
         */
        constructor(private font: any) {
            if (!font) {
                throw new Error('FontKitAdapter requires a valid fontkit font object');
            }
            if (!font.layout) {
                throw new Error('Provided font object does not appear to be a fontkit font (missing layout method)');
            }
        }

        /**
         * Iterate through glyphs in text, compatible with opentype.js forEachGlyph API
         * @param text String of text to render
         * @param x Starting x position  
         * @param y Starting y position
         * @param fontSize Font size in points
         * @param options Options for layout (fontkit features, script, language)
         * @param callback Function called for each glyph
         */
        forEachGlyph(
            text: string,
            x: number,
            y: number,
            fontSize: number,
            options: any,
            callback: (glyph: IAdaptedGlyph, x: number, y: number, fontSize: number, options: any) => void
        ): void {
            // Use fontkit's layout engine to shape the text
            const run = this.font.layout(text, options);
            const scale = fontSize / this.font.unitsPerEm;
            
            let currentX = x;
            
            // Iterate through positioned glyphs
            for (let i = 0; i < run.glyphs.length; i++) {
                const glyph = run.glyphs[i];
                const position = run.positions[i];
                
                // Create adapted glyph that mimics opentype.js Glyph interface
                const adaptedGlyph: IAdaptedGlyph = {
                    getPath: (px: number, py: number, pFontSize: number) => {
                        return this.adaptPath(glyph, px, py, pFontSize);
                    }
                };
                
                // Calculate position (fontkit provides advances in font units)
                const glyphX = currentX + (position.xOffset || 0) * scale;
                const glyphY = y + (position.yOffset || 0) * scale;
                
                // Call the callback with the adapted glyph
                callback(adaptedGlyph, glyphX, glyphY, fontSize, options);
                
                // Advance position for next glyph
                currentX += (position.xAdvance || 0) * scale;
            }
        }

        /**
         * Convert a fontkit glyph path to opentype.js compatible path structure
         * @param glyph Fontkit glyph object
         * @param x X offset
         * @param y Y offset  
         * @param fontSize Font size
         * @returns Path object with commands array
         */
        private adaptPath(glyph: any, x: number, y: number, fontSize: number): IAdaptedPath {
            const scale = fontSize / this.font.unitsPerEm;
            const commands: IPathCommand[] = [];
            
            // Get the path from the glyph
            const path = glyph.path;
            
            if (!path || !path.commands) {
                // Return empty path for glyphs without paths (e.g., spaces)
                return { commands: [] };
            }
            
            // Convert each fontkit command to opentype.js format
            for (const cmd of path.commands) {
                let opentypeCmd: IPathCommand | null = null;
                
                switch (cmd.command) {
                    case 'moveTo':
                        opentypeCmd = {
                            type: 'M',
                            x: x + cmd.args[0] * scale,
                            y: y - cmd.args[1] * scale  // Flip Y coordinate
                        };
                        break;
                        
                    case 'lineTo':
                        opentypeCmd = {
                            type: 'L',
                            x: x + cmd.args[0] * scale,
                            y: y - cmd.args[1] * scale  // Flip Y coordinate
                        };
                        break;
                        
                    case 'quadraticCurveTo':
                        // fontkit: quadraticCurveTo(cpx, cpy, x, y)
                        // opentype.js Q: control point (x1, y1), end point (x, y)
                        opentypeCmd = {
                            type: 'Q',
                            x1: x + cmd.args[0] * scale,
                            y1: y - cmd.args[1] * scale,  // Flip Y coordinate
                            x: x + cmd.args[2] * scale,
                            y: y - cmd.args[3] * scale    // Flip Y coordinate
                        };
                        break;
                        
                    case 'bezierCurveTo':
                        // fontkit: bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
                        // opentype.js C: control point 1 (x1, y1), control point 2 (x2, y2), end point (x, y)
                        opentypeCmd = {
                            type: 'C',
                            x1: x + cmd.args[0] * scale,
                            y1: y - cmd.args[1] * scale,  // Flip Y coordinate
                            x2: x + cmd.args[2] * scale,
                            y2: y - cmd.args[3] * scale,  // Flip Y coordinate
                            x: x + cmd.args[4] * scale,
                            y: y - cmd.args[5] * scale    // Flip Y coordinate
                        };
                        break;
                        
                    case 'closePath':
                        opentypeCmd = {
                            type: 'Z'
                        };
                        break;
                }
                
                if (opentypeCmd) {
                    commands.push(opentypeCmd);
                }
            }
            
            return { commands };
        }

        /**
         * Static helper to detect if an object is a fontkit font
         * @param font Font object to check
         * @returns True if the object appears to be a fontkit font
         */
        static isFontKitFont(font: any): boolean {
            return font && 
                   typeof font === 'object' && 
                   typeof font.layout === 'function' &&
                   typeof font.unitsPerEm === 'number' &&
                   !font.forEachGlyph; // opentype.js has forEachGlyph, fontkit doesn't
        }

        /**
         * Static helper to auto-detect and adapt a font if needed
         * @param font Either an opentype.js font or a fontkit font
         * @returns Original font if opentype.js, or FontKitAdapter if fontkit
         */
        static autoAdapt(font: any): any {
            if (FontKitAdapter.isFontKitFont(font)) {
                return new FontKitAdapter(font);
            }
            return font;
        }
    }

    /**
     * Extended Text model that automatically detects and adapts fontkit fonts.
     * This allows using either opentype.js or fontkit fonts seamlessly.
     * 
     * @example
     * ```typescript
     * // Works with opentype.js fonts
     * const opentypeFont = opentype.load('font.ttf');
     * const text1 = new MakerJs.models.TextAuto(opentypeFont, 'Hello', 72);
     * 
     * // Also works with fontkit fonts
     * const fontkitFont = fontkit.openSync('font.ttf');
     * const text2 = new MakerJs.models.TextAuto(fontkitFont, 'World', 72);
     * ```
     */
    export class TextAuto extends Text {
        /**
         * Create text from either an opentype.js or fontkit font
         * @param font opentype.Font or fontkit font object
         * @param text String of text to render
         * @param fontSize Font size
         * @param combine Flag to perform combineUnion on characters
         * @param centerCharacterOrigin Flag to center character origins
         * @param bezierAccuracy Optional accuracy of Bezier curves
         * @param options Optional font-specific options
         */
        constructor(
            font: any,
            text: string,
            fontSize: number,
            combine = false,
            centerCharacterOrigin = false,
            bezierAccuracy?: number,
            options?: any
        ) {
            // Auto-detect and adapt fontkit fonts
            const adaptedFont = FontKitAdapter.autoAdapt(font);
            
            // Call parent constructor with adapted font
            super(adaptedFont, text, fontSize, combine, centerCharacterOrigin, bezierAccuracy, options);
        }
    }
}
