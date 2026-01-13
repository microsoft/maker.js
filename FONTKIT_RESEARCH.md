# Research: Adding fontkit Support in Addition to opentype.js

## Executive Summary

This document presents research findings on adding [fontkit](https://github.com/foliojs/fontkit) as an alternative font processing library alongside the currently used [opentype.js](https://opentype.js.org/) in Maker.js. The research includes a comparative analysis, API compatibility assessment, and implementation recommendations.

## Current State: opentype.js in Maker.js

### Dependencies
- **Package**: `opentype.js` version 1.1.0 (root devDependencies)
- **Latest Available**: 1.3.4

### Current Usage

Maker.js currently uses opentype.js exclusively for font rendering in the `Text` model class. The following APIs are utilized:

1. **Font Loading**
   - `opentype.load(url, callback)` - Browser-based async loading
   - `opentype.loadSync(path)` - Node.js synchronous loading (tests)

2. **Font Object APIs**
   - `font.forEachGlyph(text, x, y, fontSize, options, callback)` - Iterates through glyphs
   
3. **Glyph Object APIs**
   - `glyph.getPath(x, y, fontSize)` - Returns path commands
   
4. **Path Commands**
   The path commands object provides:
   - `commands` array with elements containing:
     - `type`: 'M' (moveto), 'L' (lineto), 'C' (cubic bezier), 'Q' (quadratic bezier), 'Z' (closepath)
     - `x, y`: endpoint coordinates
     - `x1, y1`: first control point (for bezier curves)
     - `x2, y2`: second control point (for cubic bezier curves)

5. **Type Definitions Used**
   - `opentype.Font`
   - `opentype.Glyph`
   - `opentype.RenderOptions`

## fontkit Overview

### Key Features
- **Formats**: TrueType (.ttf), OpenType (.otf), WOFF, WOFF2, TrueType Collection (.ttc), Datafork TrueType (.dfont)
- **Advanced Typography**: Full GSUB/GPOS table support (kerning, ligatures, contextual substitutions)
- **AAT Support**: Apple Advanced Typography features (morx table)
- **Color Glyphs**: SBIX and COLR tables (emoji support)
- **Font Variations**: Variable font support with design axes
- **Font Subsetting**: Can generate subset font files
- **Environments**: Node.js and browser support
- **Version**: 2.0.4 (latest)

### Advantages over opentype.js
1. **More Format Support**: WOFF2, TTC, DFONT formats not supported by opentype.js
2. **Advanced Layout Features**: Better support for OpenType advanced features (GSUB/GPOS)
3. **Modern Font Technologies**: Variable fonts, color fonts
4. **Better Performance**: Optimized for large-scale font processing
5. **Active Development**: Used in production applications like PDFKit

## API Comparison

### Font Loading

**opentype.js:**
```javascript
// Browser
opentype.load(url, (err, font) => { ... });

// Node.js
const font = opentype.loadSync(path);
```

**fontkit:**
```javascript
// Browser
const buffer = await fetch(url).then(r => r.arrayBuffer());
const font = fontkit.create(buffer);

// Node.js
const font = fontkit.openSync(path);
```

### Glyph Iteration

**opentype.js:**
```javascript
font.forEachGlyph(text, x, y, fontSize, options, (glyph, x, y, fontSize, options) => {
    // Process glyph
});
```

**fontkit:**
```javascript
const run = font.layout(text);
let x = 0;
for (const glyph of run.glyphs) {
    // Process glyph
    x += glyph.advanceWidth / font.unitsPerEm * fontSize;
}
```

### Glyph Path Extraction

**opentype.js:**
```javascript
const path = glyph.getPath(x, y, fontSize);
path.commands.forEach(cmd => {
    // cmd.type: 'M', 'L', 'C', 'Q', 'Z'
    // cmd.x, cmd.y, cmd.x1, cmd.y1, cmd.x2, cmd.y2
});
```

**fontkit:**
```javascript
const path = glyph.path;
path.commands.forEach(cmd => {
    // Different command structure
    // 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'closePath'
});
```

## Compatibility Analysis

### Direct API Differences

1. **Path Commands Structure**
   - opentype.js uses single letter types: 'M', 'L', 'C', 'Q', 'Z'
   - fontkit uses full names: 'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'closePath'

2. **Coordinate Handling**
   - Both provide glyph coordinates in font units
   - Both require scaling by fontSize / unitsPerEm

3. **Text Layout**
   - opentype.js: `forEachGlyph()` handles layout and provides callback per glyph
   - fontkit: `layout()` returns run object with glyph array, positioning done manually

### Integration Challenges

1. **Type Definitions**
   - Current code uses TypeScript with opentype.js types
   - Would need fontkit type definitions (@types/fontkit available)

2. **API Abstraction Layer**
   - Direct replacement would break existing code
   - Need adapter/wrapper to provide unified interface

3. **Browser Bundle Size**
   - fontkit: ~100KB minified
   - opentype.js: ~60KB minified
   - Including both increases bundle size significantly

4. **Loading Mechanism**
   - Different loading APIs require abstraction
   - Browser vs Node.js differences

## Recommended Implementation Approach

### Option 1: Adapter Pattern (Recommended)

Create an adapter layer that wraps both libraries and provides a unified interface:

```typescript
interface IFontAdapter {
    forEachGlyph(text: string, x: number, y: number, fontSize: number, 
                 options: any, callback: GlyphCallback): void;
}

class OpenTypeFontAdapter implements IFontAdapter {
    constructor(private font: opentype.Font) {}
    // Implementation using opentype.js
}

class FontKitAdapter implements IFontAdapter {
    constructor(private font: any) {} // fontkit font
    // Implementation using fontkit
}
```

**Advantages:**
- Maintains backward compatibility
- Allows users to choose library
- Isolates library-specific code
- Easy to test and maintain

**Disadvantages:**
- Additional abstraction layer
- Some overhead
- Need to maintain both implementations

### Option 2: Dual Export

Provide separate Text model classes for each library:

```typescript
// For opentype.js (current)
MakerJs.models.Text

// For fontkit
MakerJs.models.TextFontKit
```

**Advantages:**
- No breaking changes
- Clear separation
- Users can mix and match

**Disadvantages:**
- Code duplication
- Larger maintenance burden
- API inconsistency

### Option 3: Plugin System

Create a plugin architecture where font libraries are registered:

```typescript
MakerJs.registerFontProvider('opentype', opentypeAdapter);
MakerJs.registerFontProvider('fontkit', fontkitAdapter);

// Usage
const font = MakerJs.loadFont('path/to/font.ttf', 'fontkit');
new MakerJs.models.Text(font, 'Hello', 72);
```

**Advantages:**
- Most flexible approach
- Extensible to other libraries
- Clean separation of concerns

**Disadvantages:**
- Most complex to implement
- Breaking change for existing code
- May be over-engineered for two libraries

## Proof of Concept: FontKit Adapter

Here's a basic implementation showing how fontkit could be adapted to work with the current Text model:

```typescript
namespace MakerJs.models {
    
    /**
     * Adapter to make fontkit compatible with Text model
     */
    export class FontKitAdapter {
        
        constructor(private fontkitFont: any) {}
        
        /**
         * Emulates opentype.js forEachGlyph API using fontkit
         */
        forEachGlyph(
            text: string, 
            x: number, 
            y: number, 
            fontSize: number, 
            options: any, 
            callback: (glyph: any, x: number, y: number, fontSize: number, options: any) => void
        ): void {
            const run = this.fontkitFont.layout(text, options);
            const scale = fontSize / this.fontkitFont.unitsPerEm;
            let currentX = x;
            
            for (const position of run.positions) {
                const glyph = position.glyph;
                
                // Create adapter glyph that mimics opentype.js Glyph
                const adaptedGlyph = {
                    getPath: (x: number, y: number, fontSize: number) => {
                        return this.adaptPath(glyph.path, x, y, fontSize);
                    }
                };
                
                callback(adaptedGlyph, currentX, y, fontSize, options);
                currentX += position.xAdvance * scale;
            }
        }
        
        /**
         * Converts fontkit path to opentype.js path format
         */
        private adaptPath(fontkitPath: any, x: number, y: number, fontSize: number): any {
            const scale = fontSize / this.fontkitFont.unitsPerEm;
            const commands: any[] = [];
            
            for (const cmd of fontkitPath.commands) {
                let opentypeCmd: any;
                
                switch (cmd.command) {
                    case 'moveTo':
                        opentypeCmd = {
                            type: 'M',
                            x: x + cmd.args[0] * scale,
                            y: y + cmd.args[1] * scale
                        };
                        break;
                        
                    case 'lineTo':
                        opentypeCmd = {
                            type: 'L',
                            x: x + cmd.args[0] * scale,
                            y: y + cmd.args[1] * scale
                        };
                        break;
                        
                    case 'quadraticCurveTo':
                        opentypeCmd = {
                            type: 'Q',
                            x1: x + cmd.args[0] * scale,
                            y1: y + cmd.args[1] * scale,
                            x: x + cmd.args[2] * scale,
                            y: y + cmd.args[3] * scale
                        };
                        break;
                        
                    case 'bezierCurveTo':
                        opentypeCmd = {
                            type: 'C',
                            x1: x + cmd.args[0] * scale,
                            y1: y + cmd.args[1] * scale,
                            x2: x + cmd.args[2] * scale,
                            y2: y + cmd.args[3] * scale,
                            x: x + cmd.args[4] * scale,
                            y: y + cmd.args[5] * scale
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
    }
    
    /**
     * Extended Text model that accepts either opentype.js or fontkit fonts
     */
    export class TextUniversal extends Text {
        constructor(
            font: any, // opentype.Font | fontkit font
            text: string, 
            fontSize: number, 
            combine = false, 
            centerCharacterOrigin = false, 
            bezierAccuracy?: number, 
            options?: any
        ) {
            // Detect font type and adapt if needed
            const adaptedFont = font.constructor.name === 'Font' && font.layout 
                ? new FontKitAdapter(font) 
                : font;
            
            super(adaptedFont, text, fontSize, combine, centerCharacterOrigin, bezierAccuracy, options);
        }
    }
}
```

## Testing Considerations

### Required Tests

1. **Path Conversion Accuracy**
   - Test that adapted fontkit paths produce identical geometry to opentype.js
   - Use existing fonts in test suite

2. **Layout Consistency**
   - Verify glyph positioning matches between libraries
   - Test multi-character strings with kerning

3. **Performance Comparison**
   - Benchmark both libraries on typical use cases
   - Memory usage profiling

4. **Format Support**
   - Test with TTF, OTF files
   - Test fontkit-specific formats (WOFF2, TTC) if supporting those

### Test Implementation

```javascript
describe('FontKit Adapter', function() {
    it('should produce same geometry as opentype.js', function() {
        const opentypeFont = opentype.loadSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
        const fontkitFont = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
        
        const opentypeModel = new makerjs.models.Text(opentypeFont, 'A', 100);
        const fontkitModel = new makerjs.models.TextUniversal(fontkitFont, 'A', 100);
        
        // Compare geometries
        const opentypeChains = makerjs.model.findChains(opentypeModel);
        const fontkitChains = makerjs.model.findChains(fontkitModel);
        
        assert.equal(opentypeChains.length, fontkitChains.length);
        
        // More detailed geometry comparison...
    });
});
```

## Browser Compatibility

### fontkit Browser Support

fontkit requires some adjustments for browser use:

1. **Buffer Polyfill**: Node.js Buffer is used internally
2. **ArrayBuffer Loading**: Use Fetch API or XMLHttpRequest
3. **Bundle Size**: Webpack or Rollup configuration needed

### Browser Integration Example

```html
<!-- Include fontkit browser bundle -->
<script src="https://unpkg.com/fontkit@2.0.4/dist/fontkit.browser.js"></script>

<script>
// Load font in browser
fetch('fonts/MyFont.ttf')
    .then(response => response.arrayBuffer())
    .then(buffer => {
        const font = fontkit.create(buffer);
        const adapter = new MakerJs.models.FontKitAdapter(font);
        const text = new MakerJs.models.Text(adapter, 'Hello', 72);
        // ... render
    });
</script>
```

## Migration Path

For existing users who want to adopt fontkit:

### Phase 1: Add fontkit Support (Non-Breaking)
1. Add fontkit as optional peer dependency
2. Implement adapter layer
3. Add documentation and examples
4. Keep opentype.js as default

### Phase 2: Encourage Migration
1. Document fontkit benefits
2. Provide migration guide
3. Show advanced features examples (variable fonts, color glyphs)

### Phase 3: Future Considerations
1. Could make opentype.js optional (breaking change)
2. Could default to fontkit in next major version
3. Maintain backward compatibility through adapters

## Recommendations

### Short Term (Immediate Implementation)

1. **Add FontKitAdapter class** to packages/maker.js/src/models/
   - Implement as shown in proof of concept
   - Add proper TypeScript types
   - Keep as separate file: `FontKitAdapter.ts`

2. **Create Example**
   - Add demo showing fontkit usage
   - Compare with opentype.js example
   - Document in playground

3. **Add Optional Dependency**
   - Add fontkit to optionalDependencies in package.json
   - Update documentation about when to use which library

4. **Testing**
   - Add tests comparing both libraries
   - Verify geometric equivalence
   - Test performance characteristics

### Medium Term

1. **Enhanced Features**
   - Expose fontkit-specific features (color glyphs, variable fonts)
   - Create specialized models for advanced features
   - Add examples using WOFF2 fonts

2. **Documentation**
   - Create comprehensive guide on choosing between libraries
   - Document trade-offs (bundle size, features, performance)
   - Add migration guide

### Long Term Considerations

1. **Plugin Architecture**
   - Consider implementing plugin system for font providers
   - Allow community to add more font libraries
   - Maintain backward compatibility

2. **Bundle Optimization**
   - Provide separate builds: maker.js, maker.js+opentype, maker.js+fontkit
   - Tree-shaking support for modern bundlers
   - Reduce bundle size for web users

## Conclusion

Adding fontkit support to Maker.js is **feasible and recommended** with the following approach:

✅ **Use Adapter Pattern** to maintain backward compatibility
✅ **Keep opentype.js as default** to avoid breaking changes  
✅ **Add fontkit as optional** for users who need advanced features
✅ **Provide clear documentation** on when to use each library

### Key Benefits

- **More font format support** (WOFF2, TTC, DFONT)
- **Advanced typography features** (better ligatures, kerning, substitutions)
- **Modern font technologies** (variable fonts, color glyphs)
- **Better long-term maintenance** (more active development)
- **No breaking changes** for existing users

### Implementation Effort

- **Adapter Layer**: ~2-3 days development
- **Testing**: ~2 days
- **Documentation**: ~1 day
- **Examples**: ~1 day

**Total: ~1 week** for full implementation with tests and documentation

### Risk Assessment

- **Low Risk**: Non-breaking addition
- **Medium Complexity**: Adapter pattern is straightforward
- **High Value**: Opens door to modern font features
- **Maintainable**: Clear separation of concerns

This research demonstrates that adding fontkit support is not only feasible but would provide significant value to Maker.js users who need advanced font features, while maintaining full backward compatibility with the existing opentype.js implementation.
