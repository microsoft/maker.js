# FontKit Support Research - Summary

This directory contains comprehensive research and implementation for adding fontkit support directly into the Text model in Maker.js.

## Implementation Approach

Based on maintainer feedback, fontkit support was integrated directly into the Text model rather than creating a separate adapter class. The Text model now:

1. **Auto-detects font library** using duck typing (checks for `layout` method for fontkit vs `forEachGlyph` for opentype.js)
2. **Supports both opentype.js and fontkit** with the same API
3. **Handles color glyphs** from fontkit COLR tables by organizing them into layers by color

## Contents

### 1. Research Document
**File**: `FONTKIT_RESEARCH.md`

A comprehensive research document covering:
- Current state of opentype.js in Maker.js
- fontkit overview and key features
- Detailed API comparison
- Compatibility analysis
- Implementation approaches comparison
- **Conclusion**: Adding fontkit is feasible using duck typing in the Text model

### 2. Implementation
**File**: `packages/maker.js/src/models/Text.ts` (modified)

Direct integration into Text model:
- ✅ Duck typing to detect font library (no separate adapter needed)
- ✅ Support for both opentype.js and fontkit fonts
- ✅ Color glyph support via COLR tables - creates layers by color
- ✅ Zero breaking changes for existing users
- ✅ No API changes - same Text constructor works with both libraries

Key features:
- Detects fontkit fonts by checking for `layout` method
- Uses fontkit's layout engine for proper text shaping
- Extracts color information from COLR/CPAL tables
- Organizes color glyph layers by hex color value
- Maintains all existing Text model features (combine, centerCharacterOrigin, etc.)

### 3. Examples and Documentation
**File**: `FONTKIT_EXAMPLES.md`

Practical examples covering:
- Node.js usage (both libraries work identically)
- Browser usage
- Variable fonts
- OpenType features
- Color glyph support (NEW!)
- Font subsetting

### 4. Test Suite
**File**: `packages/maker.js/test/fontkit-adapter.js`

Comprehensive test suite including:
- Text model integration tests with both libraries
- Geometric equivalence validation
- Multi-character text tests
- Export compatibility tests (SVG, DXF)
- Options and features tests

Tests automatically skip if fontkit is not installed (optional dependency).

### 5. Package Configuration
**Files**: `package.json`

- Added fontkit as optional dependency (v2.0.4)
- No other changes needed - Text.ts already in build

## Key Findings

### ✅ Feasibility: HIGH
- fontkit integrates cleanly into existing Text model
- Duck typing provides seamless library detection
- No breaking changes or API modifications needed

### 🎨 Color Glyph Support

The implementation now supports COLR (Color Layer) fonts from fontkit:

```typescript
// Color emoji or layered fonts automatically get organized by color
const font = fontkit.openSync('color-emoji.ttf');
const text = new makerjs.models.Text(font, '🎨', 72);

// Each color layer will have a 'layer' property with color hex value
// e.g., 'color_ff0000' for red, 'color_00ff00' for green
```

### 📊 Comparison

| Feature | opentype.js | fontkit |
|---------|------------|---------|
| Bundle Size | ~60KB | ~100KB |
| TTF/OTF Support | ✅ | ✅ |
| WOFF2 Support | ❌ | ✅ |
| Variable Fonts | ❌ | ✅ |
| Color Glyphs | ❌ | ✅ (with layers) |
| Font Subsetting | ❌ | ✅ |
| Advanced Layout | Basic | Full GSUB/GPOS |
| TTC/DFONT | ❌ | ✅ |

## Usage

### Unchanged API - Works with Both Libraries

```typescript
// With opentype.js (existing code - unchanged)
const opentypeFont = opentype.loadSync('font.ttf');
const text1 = new makerjs.models.Text(opentypeFont, 'Hello', 72);

// With fontkit (new capability - same API!)
const fontkitFont = fontkit.openSync('font.ttf');
const text2 = new makerjs.models.Text(fontkitFont, 'Hello', 72);

// Color glyphs with fontkit
const colorFont = fontkit.openSync('color-emoji.ttf');
const emoji = new makerjs.models.Text(colorFont, '🎨', 72);
// Paths/models will be organized by color in layers
```

## Implementation Status

✅ **Complete and Ready**

- [x] Research document
- [x] Implementation integrated into Text model
- [x] Duck typing for library detection
- [x] Color glyph support with layers
- [x] Test suite
- [x] Documentation
- [x] Examples

## Testing

```bash
# fontkit is not included - install it to use fontkit features and run tests
npm install fontkit

# Run tests (fontkit tests will run if fontkit is installed)
npm test

# Without fontkit installed
npm test  # fontkit tests automatically skip
```

## Installation

fontkit is **not included** as a dependency. Users who want to use fontkit features must install it separately:

```bash
npm install fontkit
```

The Text model will automatically detect and use fontkit when a fontkit font object is provided.

## Architectural Decision

The maintainer's approach of integrating directly into the Text model (rather than a separate TextAuto class) provides several benefits:

1. **No API changes** - Users don't need to learn a new class
2. **Transparent support** - Library detection happens automatically
3. **Better feature exposure** - Can leverage fontkit-specific features like color glyphs
4. **Simpler codebase** - No separate adapter layer to maintain
5. **Future extensibility** - Easy to add more fontkit features

## Color Glyph Implementation Details

When a fontkit font with COLR table is used:
1. The glyph's layers are extracted
2. Each layer's color is retrieved from the CPAL (Color Palette) table
3. Colors are converted to hex format (e.g., `color_ff0000`)
4. Paths/models are tagged with the layer name
5. This allows SVG exporters to assign colors appropriately

## Next Steps

1. **Review**: Code review by maintainers
2. **Merge**: Merge to main branch
3. **Document**: Update main README with fontkit information
4. **Release**: Include in next release notes
5. **Examples**: Add color font examples to playground

## License

All code follows the existing Apache-2.0 license of the Maker.js project.

