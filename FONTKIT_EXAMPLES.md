# FontKit Adapter Example

This example demonstrates how to use the FontKitAdapter to use fontkit fonts with Maker.js.

## Installation

```bash
npm install makerjs fontkit
```

For browser use, you'll need to include fontkit's browser bundle.

## Node.js Example

```javascript
const makerjs = require('makerjs');
const fontkit = require('fontkit');

// Load a font using fontkit
const font = fontkit.openSync('path/to/font.ttf');

// Option 1: Use the adapter explicitly
const adapter = new makerjs.models.FontKitAdapter(font);
const text1 = new makerjs.models.Text(adapter, 'Hello World', 72);

// Option 2: Use TextAuto which auto-detects the font type
const text2 = new makerjs.models.TextAuto(font, 'Hello World', 72);

// Export to SVG
const svg = makerjs.exporter.toSVG(text2);
console.log(svg);
```

## TypeScript Example

```typescript
import * as makerjs from 'makerjs';
import * as fontkit from 'fontkit';

// Load font
const font = fontkit.openSync('path/to/font.ttf');

// Create text with fontkit font
const text = new makerjs.models.TextAuto(font, 'Hello World', 72);

// Export
const svg = makerjs.exporter.toSVG(text);
```

## Browser Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>FontKit Adapter Example</title>
    <script src="https://cdn.jsdelivr.net/npm/makerjs@0/target/js/browser.maker.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bezier-js@2/bezier.js"></script>
    <script src="https://unpkg.com/fontkit@2.0.4/dist/fontkit.browser.js"></script>
</head>
<body>
    <div id="output"></div>
    
    <script>
        // Load font file as ArrayBuffer
        fetch('fonts/MyFont.ttf')
            .then(response => response.arrayBuffer())
            .then(buffer => {
                // Create fontkit font from buffer
                const font = fontkit.create(buffer);
                
                // Create text using TextAuto (auto-detects fontkit)
                const text = new makerjs.models.TextAuto(font, 'Hello World', 72);
                
                // Export to SVG
                const svg = makerjs.exporter.toSVG(text);
                
                // Display
                document.getElementById('output').innerHTML = svg;
            })
            .catch(error => {
                console.error('Error loading font:', error);
            });
    </script>
</body>
</html>
```

## Advanced Features with FontKit

### Variable Fonts

```javascript
const fontkit = require('fontkit');
const makerjs = require('makerjs');

// Load a variable font
const font = fontkit.openSync('path/to/variable-font.ttf');

// Create a variation instance
const instance = font.getVariation({
    wght: 700,  // Weight
    wdth: 125   // Width
});

// Use the variation
const text = new makerjs.models.TextAuto(instance, 'Variable!', 72);
```

### OpenType Features

```javascript
const fontkit = require('fontkit');
const makerjs = require('makerjs');

const font = fontkit.openSync('path/to/font.otf');

// Enable ligatures and other OpenType features
const text = new makerjs.models.TextAuto(
    font, 
    'ffi ffl', 
    72,
    false,  // combine
    false,  // centerCharacterOrigin
    undefined,  // bezierAccuracy
    {
        // OpenType features
        features: {
            liga: true,  // Standard ligatures
            dlig: true,  // Discretionary ligatures
            kern: true   // Kerning
        }
    }
);
```

### Font Subsetting

```javascript
const fontkit = require('fontkit');
const makerjs = require('makerjs');
const fs = require('fs');

const font = fontkit.openSync('path/to/font.ttf');

// Layout text
const run = font.layout('Hello World');

// Get glyph IDs
const glyphIds = run.glyphs.map(g => g.id);

// Create a subset
const subset = font.createSubset();
glyphIds.forEach(id => subset.includeGlyph(id));

// Encode the subset to a new font file
const subsetBuffer = subset.encode();
fs.writeFileSync('subset.ttf', subsetBuffer);
```

## Comparing opentype.js vs fontkit

```javascript
const makerjs = require('makerjs');
const opentype = require('opentype.js');
const fontkit = require('fontkit');

// Load same font with both libraries
const opentypeFont = opentype.loadSync('font.ttf');
const fontkitFont = fontkit.openSync('font.ttf');

// Create text with both
const text1 = new makerjs.models.Text(opentypeFont, 'Test', 72);
const text2 = new makerjs.models.TextAuto(fontkitFont, 'Test', 72);

// Compare output
console.log('opentype.js chains:', makerjs.model.findChains(text1).length);
console.log('fontkit chains:', makerjs.model.findChains(text2).length);
```

## Error Handling

```javascript
const makerjs = require('makerjs');
const fontkit = require('fontkit');

try {
    const font = fontkit.openSync('path/to/font.ttf');
    
    // FontKitAdapter validates the font
    const adapter = new makerjs.models.FontKitAdapter(font);
    const text = new makerjs.models.Text(adapter, 'Hello', 72);
    
} catch (error) {
    if (error.message.includes('fontkit font')) {
        console.error('Invalid font object provided');
    } else {
        console.error('Error:', error.message);
    }
}
```

## Testing Font Type Detection

```javascript
const makerjs = require('makerjs');
const opentype = require('opentype.js');
const fontkit = require('fontkit');

const opentypeFont = opentype.loadSync('font.ttf');
const fontkitFont = fontkit.openSync('font.ttf');

console.log('Is opentype.js font?', 
    !makerjs.models.FontKitAdapter.isFontKitFont(opentypeFont)); // true

console.log('Is fontkit font?', 
    makerjs.models.FontKitAdapter.isFontKitFont(fontkitFont)); // true

// Auto-adapt returns correct type
const adapted1 = makerjs.models.FontKitAdapter.autoAdapt(opentypeFont);
console.log('opentype.js needs adapter?', adapted1 instanceof makerjs.models.FontKitAdapter); // false

const adapted2 = makerjs.models.FontKitAdapter.autoAdapt(fontkitFont);
console.log('fontkit needs adapter?', adapted2 instanceof makerjs.models.FontKitAdapter); // true
```

## Performance Considerations

### Bundle Size

- **opentype.js**: ~60KB minified
- **fontkit**: ~100KB minified  
- **Including both**: ~160KB minified

For web applications, consider:
1. Use only one library if possible
2. Use dynamic imports to load fontkit only when needed
3. Serve from CDN to leverage browser caching

### Runtime Performance

Both libraries have similar performance for basic text rendering. fontkit may be slightly faster for:
- Complex scripts (Arabic, Devanagari, etc.)
- Advanced OpenType feature processing
- Large amounts of text

Benchmark your specific use case to determine if performance differences matter.

## Troubleshooting

### "Missing layout method" Error

This means you're trying to use FontKitAdapter with a non-fontkit font:

```javascript
// Wrong - opentype.js font
const font = opentype.loadSync('font.ttf');
new makerjs.models.FontKitAdapter(font); // Error!

// Right - fontkit font
const font = fontkit.openSync('font.ttf');
new makerjs.models.FontKitAdapter(font); // OK
```

### Geometric Differences

If you notice slight differences between opentype.js and fontkit output:

1. **Coordinate System**: Both use the same coordinate system but may handle edge cases differently
2. **Rounding**: Floating point rounding may differ slightly
3. **Bezier Conversion**: Check bezierAccuracy parameter

### Browser Issues

If fontkit doesn't work in the browser:

1. Make sure you're using the browser bundle: `fontkit.browser.js`
2. Check that ArrayBuffer API is available
3. Verify CORS headers if loading fonts from different origin
4. Check console for specific errors

## When to Use fontkit vs opentype.js

### Use fontkit when you need:
- ✅ Variable fonts
- ✅ Color fonts (emoji)
- ✅ WOFF2 format
- ✅ Advanced OpenType features (complex scripts)
- ✅ Font subsetting
- ✅ TrueType collections (.ttc files)

### Use opentype.js when:
- ✅ You need smaller bundle size
- ✅ Basic TTF/OTF support is sufficient
- ✅ You want to modify/create fonts
- ✅ You're already using opentype.js

### Use both when:
- ✅ Supporting variable fonts alongside basic fonts
- ✅ Allowing users to choose font library
- ✅ Gradually migrating from opentype.js to fontkit

## Additional Resources

- [fontkit Documentation](https://github.com/foliojs/fontkit)
- [opentype.js Documentation](https://opentype.js.org/)
- [Maker.js Documentation](https://maker.js.org/docs/)
- [OpenType Specification](https://docs.microsoft.com/en-us/typography/opentype/spec/)
