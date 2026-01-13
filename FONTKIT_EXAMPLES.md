# FontKit Support Examples

This document demonstrates how to use fontkit fonts with Maker.js. The Text model now supports both opentype.js and fontkit fonts automatically.

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

// Use directly with Text model - same API as opentype.js!
const text = new makerjs.models.Text(font, 'Hello World', 72);

// Export to SVG
const svg = makerjs.exporter.toSVG(text);
console.log(svg);
```

## TypeScript Example

```typescript
import * as makerjs from 'makerjs';
import * as fontkit from 'fontkit';

// Load font
const font = fontkit.openSync('path/to/font.ttf');

// Create text - works exactly like opentype.js
const text = new makerjs.models.Text(font, 'Hello World', 72);

// Export
const svg = makerjs.exporter.toSVG(text);
```

## Browser Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>FontKit Support Example</title>
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
                
                // Use with Text model - same API!
                const text = new makerjs.models.Text(font, 'Hello World', 72);
                
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

## Color Glyphs (COLR Fonts)

Fontkit supports color fonts with COLR/CPAL tables. Each color layer is automatically organized:

```javascript
const fontkit = require('fontkit');
const makerjs = require('makerjs');

// Load a color font (e.g., emoji font with COLR table)
const font = fontkit.openSync('path/to/color-emoji.ttf');

// Render color text
const text = new makerjs.models.Text(font, '🎨🌈', 72);

// Each color layer will have a 'layer' property with hex color
// e.g., 'color_ff0000' for red, 'color_00ff00' for green
// This allows you to export with proper colors

const svg = makerjs.exporter.toSVG(text);
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
const text = new makerjs.models.Text(instance, 'Variable!', 72);
```

### OpenType Features

```javascript
const fontkit = require('fontkit');
const makerjs = require('makerjs');

const font = fontkit.openSync('path/to/font.otf');

// Enable ligatures and other OpenType features
const text = new makerjs.models.Text(
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

Both work with the same Text API:

```javascript
const makerjs = require('makerjs');
const opentype = require('opentype.js');
const fontkit = require('fontkit');

// Load same font with both libraries
const opentypeFont = opentype.loadSync('font.ttf');
const fontkitFont = fontkit.openSync('font.ttf');

// Create text with both - identical API
const text1 = new makerjs.models.Text(opentypeFont, 'Test', 72);
const text2 = new makerjs.models.Text(fontkitFont, 'Test', 72);

// Compare output
console.log('opentype.js chains:', makerjs.model.findChains(text1).length);
console.log('fontkit chains:', makerjs.model.findChains(text2).length);
```

## Mixed Usage

You can use both libraries in the same project:

```javascript
const makerjs = require('makerjs');
const opentype = require('opentype.js');
const fontkit = require('fontkit');

// Use opentype.js for basic fonts
const basicFont = opentype.loadSync('basic.ttf');
const basicText = new makerjs.models.Text(basicFont, 'Basic', 72);

// Use fontkit for variable fonts
const varFont = fontkit.openSync('variable.ttf');
const varInstance = varFont.getVariation({ wght: 700 });
const varText = new makerjs.models.Text(varInstance, 'Bold', 72);

// Combine in a model
const combined = {
    models: {
        basic: basicText,
        variable: varText
    }
};
```

## Performance Considerations

### Bundle Size

- **opentype.js**: ~60KB minified
- **fontkit**: ~100KB minified  

For web applications, consider:
1. Use only one library if possible
2. Use dynamic imports to load fontkit only when needed
3. Serve from CDN to leverage browser caching

### Runtime Performance

Both libraries have similar performance for basic text rendering. fontkit may be slightly faster for:
- Complex scripts (Arabic, Devanagari, etc.)
- Advanced OpenType feature processing
- Large amounts of text

## Troubleshooting

### Font Not Loading

```javascript
// Wrong - fontkit.create needs a Buffer
const font = fontkit.create('path/to/font.ttf'); // Error!

// Right - use openSync for file paths
const font = fontkit.openSync('path/to/font.ttf'); // OK

// Or create from buffer
const buffer = fs.readFileSync('path/to/font.ttf');
const font = fontkit.create(buffer); // OK
```

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
- ✅ Gradually exploring fontkit features

## Additional Resources

- [fontkit Documentation](https://github.com/foliojs/fontkit)
- [opentype.js Documentation](https://opentype.js.org/)
- [Maker.js Documentation](https://maker.js.org/docs/)
- [OpenType Specification](https://docs.microsoft.com/en-us/typography/opentype/spec/)

