/**
 * Test to compare fontkit adapter with opentype.js
 * This test validates that the FontKitAdapter produces geometrically
 * equivalent results to opentype.js for the same fonts.
 * 
 * NOTE: These tests require fontkit to be installed:
 * npm install fontkit --save-optional
 * 
 * Run with: npm test
 */

// Check if fontkit is available (optional dependency)
let fontkit;
try {
    fontkit = require('fontkit');
} catch (e) {
    console.log('fontkit not installed - skipping fontkit adapter tests');
    console.log('Install with: npm install fontkit');
}

const fs = require('fs');
const assert = require('assert');
const makerjs = require('../dist/index.js');
const opentype = require('opentype.js');

describe('FontKit Adapter', function () {
    
    // Skip all tests if fontkit is not available
    if (!fontkit) {
        it.skip('fontkit not installed', function() {});
        return;
    }

    describe('Font Type Detection', function() {
        
        it('should detect opentype.js fonts', function() {
            const font = opentype.loadSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            assert.ok(font);
            assert.strictEqual(makerjs.models.FontKitAdapter.isFontKitFont(font), false);
        });

        it('should detect fontkit fonts', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            assert.ok(font);
            assert.strictEqual(makerjs.models.FontKitAdapter.isFontKitFont(font), true);
        });

        it('should auto-adapt fontkit fonts', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const adapted = makerjs.models.FontKitAdapter.autoAdapt(font);
            assert.ok(adapted instanceof makerjs.models.FontKitAdapter);
        });

        it('should not adapt opentype.js fonts', function() {
            const font = opentype.loadSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const adapted = makerjs.models.FontKitAdapter.autoAdapt(font);
            assert.ok(!(adapted instanceof makerjs.models.FontKitAdapter));
            assert.strictEqual(adapted, font);
        });
    });

    describe('Path Conversion', function() {

        it('should convert fontkit paths to opentype.js format', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const adapter = new makerjs.models.FontKitAdapter(font);
            
            let pathReceived = false;
            adapter.forEachGlyph('A', 0, 0, 100, {}, (glyph, x, y, fontSize) => {
                const path = glyph.getPath(x, y, fontSize);
                assert.ok(path);
                assert.ok(path.commands);
                assert.ok(Array.isArray(path.commands));
                assert.ok(path.commands.length > 0);
                
                // Check command structure
                path.commands.forEach(cmd => {
                    assert.ok(cmd.type);
                    assert.ok(['M', 'L', 'C', 'Q', 'Z'].includes(cmd.type));
                });
                
                pathReceived = true;
            });
            
            assert.ok(pathReceived, 'Should have received at least one glyph');
        });

        it('should handle empty paths (e.g., spaces)', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const adapter = new makerjs.models.FontKitAdapter(font);
            
            let glyphCount = 0;
            adapter.forEachGlyph(' ', 0, 0, 100, {}, (glyph, x, y, fontSize) => {
                const path = glyph.getPath(x, y, fontSize);
                assert.ok(path);
                assert.ok(path.commands);
                assert.ok(Array.isArray(path.commands));
                // Space should have empty commands array
                glyphCount++;
            });
            
            assert.strictEqual(glyphCount, 1);
        });
    });

    describe('Text Model Integration', function() {

        it('should create text model with fontkit font using adapter', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const adapter = new makerjs.models.FontKitAdapter(font);
            const textModel = new makerjs.models.Text(adapter, 'A', 100);
            
            assert.ok(textModel);
            assert.ok(textModel.models);
            assert.ok(Object.keys(textModel.models).length > 0);
        });

        it('should create text model with TextAuto', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.TextAuto(font, 'A', 100);
            
            assert.ok(textModel);
            assert.ok(textModel.models);
            assert.ok(Object.keys(textModel.models).length > 0);
        });

        it('should work with opentype.js fonts in TextAuto', function() {
            const font = opentype.loadSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.TextAuto(font, 'A', 100);
            
            assert.ok(textModel);
            assert.ok(textModel.models);
        });
    });

    describe('Geometric Equivalence', function() {

        it('should produce same chain count as opentype.js for single character', function() {
            const opentypeFont = opentype.loadSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const fontkitFont = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            
            const opentypeModel = new makerjs.models.Text(opentypeFont, 'A', 100);
            const fontkitModel = new makerjs.models.TextAuto(fontkitFont, 'A', 100);
            
            const opentypeChains = makerjs.model.findChains(opentypeModel);
            const fontkitChains = makerjs.model.findChains(fontkitModel);
            
            assert.strictEqual(fontkitChains.length, opentypeChains.length,
                'FontKit should produce same number of chains as opentype.js');
        });

        it('should produce same chain count for NewRocker font', function() {
            const opentypeFont = opentype.loadSync('../../docs/fonts/newrocker/NewRocker-Regular.ttf');
            const fontkitFont = fontkit.openSync('../../docs/fonts/newrocker/NewRocker-Regular.ttf');
            
            const opentypeModel = new makerjs.models.Text(opentypeFont, 'A', 100);
            const fontkitModel = new makerjs.models.TextAuto(fontkitFont, 'A', 100);
            
            const opentypeChains = makerjs.model.findChains(opentypeModel);
            const fontkitChains = makerjs.model.findChains(fontkitModel);
            
            assert.strictEqual(fontkitChains.length, opentypeChains.length);
        });

        it('should produce valid SVG export', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.TextAuto(font, 'Hello', 100);
            
            const svg = makerjs.exporter.toSVG(textModel);
            assert.ok(svg);
            assert.ok(svg.includes('<svg'));
            assert.ok(svg.includes('</svg>'));
            assert.ok(svg.includes('<path'));
        });

        it('should export to SVG without arc commands', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.TextAuto(font, 'Hello World', 100);
            
            const svg = makerjs.exporter.toSVG(textModel);
            assert.ok(svg);
            
            // Extract path data
            const pathMatches = svg.match(/<path[^>]*d=['"]([^'"]*)['"]/g);
            assert.ok(pathMatches && pathMatches.length > 0, 
                'SVG should contain path elements with d attribute');
            
            // Check that there are NO arc commands (A/a)
            pathMatches.forEach(function(pathElement) {
                const pathDataMatch = pathElement.match(/d=['"]([^'"]*)['"]/);
                if (pathDataMatch) {
                    const pathData = pathDataMatch[1];
                    const hasArcCommand = /\b[Aa]\b/.test(pathData);
                    assert.ok(!hasArcCommand, 
                        'SVG path should not contain arc (A/a) commands - Bezier curves should be used');
                }
            });
        });
    });

    describe('Multi-character Text', function() {

        it('should handle multi-character strings', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.TextAuto(font, 'Hello', 100);
            
            assert.ok(textModel);
            assert.ok(textModel.models);
            
            // Should have 5 character models
            const charCount = Object.keys(textModel.models).length;
            assert.strictEqual(charCount, 5);
        });

        it('should position characters with proper spacing', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.TextAuto(font, 'AB', 100);
            
            // Get origins of the two characters
            const models = textModel.models;
            const keys = Object.keys(models);
            assert.strictEqual(keys.length, 2);
            
            const origin0 = models[keys[0]].origin;
            const origin1 = models[keys[1]].origin;
            
            assert.ok(origin0);
            assert.ok(origin1);
            
            // Second character should be positioned to the right of first
            assert.ok(origin1[0] > origin0[0], 
                'Second character should be positioned to the right');
        });
    });

    describe('Error Handling', function() {

        it('should throw error for null font', function() {
            assert.throws(() => {
                new makerjs.models.FontKitAdapter(null);
            }, /requires a valid fontkit font/);
        });

        it('should throw error for non-fontkit object', function() {
            assert.throws(() => {
                new makerjs.models.FontKitAdapter({ notAFont: true });
            }, /does not appear to be a fontkit font/);
        });

        it('should throw error for opentype.js font', function() {
            const font = opentype.loadSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            assert.throws(() => {
                new makerjs.models.FontKitAdapter(font);
            }, /does not appear to be a fontkit font/);
        });
    });

    describe('Options and Features', function() {

        it('should accept layout options', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.TextAuto(
                font, 
                'Test', 
                100,
                false,  // combine
                false,  // centerCharacterOrigin
                undefined,  // bezierAccuracy
                { features: { kern: true } }  // fontkit options
            );
            
            assert.ok(textModel);
            assert.ok(textModel.models);
        });

        it('should support combine option', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.TextAuto(
                font,
                'AB',
                100,
                true  // combine
            );
            
            assert.ok(textModel);
            assert.ok(textModel.models);
        });

        it('should support centerCharacterOrigin option', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.TextAuto(
                font,
                'A',
                100,
                false,  // combine
                true    // centerCharacterOrigin
            );
            
            assert.ok(textModel);
            assert.ok(textModel.models);
        });
    });

    describe('Export Compatibility', function() {

        it('should export to DXF', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.TextAuto(font, 'A', 100);
            
            const dxf = makerjs.exporter.toDXF(textModel);
            assert.ok(dxf);
            assert.ok(typeof dxf === 'string');
            assert.ok(dxf.includes('LINE') || dxf.includes('LWPOLYLINE'));
        });

        it('should work with model operations', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.TextAuto(font, 'A', 100);
            
            // Test measurement
            const extents = makerjs.measure.modelExtents(textModel);
            assert.ok(extents);
            assert.ok(extents.low);
            assert.ok(extents.high);
            
            // Test scaling
            makerjs.model.scale(textModel, 2);
            const extents2 = makerjs.measure.modelExtents(textModel);
            assert.ok(extents2.high[0] > extents.high[0]);
        });
    });
});
