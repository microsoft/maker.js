/**
 * Test to compare fontkit with opentype.js in Text model
 * This test validates that the Text model works with both fontkit and
 * opentype.js fonts, producing geometrically equivalent results.
 * 
 * NOTE: These tests require fontkit to be installed separately:
 * npm install fontkit
 * 
 * Run with: npm test
 */

// Check if fontkit is available (not included as a dependency)
let fontkit;
try {
    fontkit = require('fontkit');
} catch (e) {
    console.log('fontkit not installed - skipping fontkit tests');
    console.log('Install with: npm install fontkit');
}

const fs = require('fs');
const assert = require('assert');
const makerjs = require('../dist/index.js');
const opentype = require('opentype.js');

describe('FontKit Support', function () {
    
    // Skip all tests if fontkit is not available
    if (!fontkit) {
        it.skip('fontkit not installed', function() {});
        return;
    }

    describe('Text Model Integration', function() {

        it('should create text model with fontkit font', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.Text(font, 'A', 100);
            
            assert.ok(textModel);
            assert.ok(textModel.models);
            assert.ok(Object.keys(textModel.models).length > 0);
        });

        it('should create text model with opentype.js font', function() {
            const font = opentype.loadSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.Text(font, 'A', 100);
            
            assert.ok(textModel);
            assert.ok(textModel.models);
        });
    });

    describe('Geometric Equivalence', function() {

        it('should produce same chain count as opentype.js for single character', function() {
            const opentypeFont = opentype.loadSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const fontkitFont = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            
            const opentypeModel = new makerjs.models.Text(opentypeFont, 'A', 100);
            const fontkitModel = new makerjs.models.Text(fontkitFont, 'A', 100);
            
            const opentypeChains = makerjs.model.findChains(opentypeModel);
            const fontkitChains = makerjs.model.findChains(fontkitModel);
            
            assert.strictEqual(fontkitChains.length, opentypeChains.length,
                'FontKit should produce same number of chains as opentype.js');
        });

        it('should produce same chain count for NewRocker font', function() {
            const opentypeFont = opentype.loadSync('../../docs/fonts/newrocker/NewRocker-Regular.ttf');
            const fontkitFont = fontkit.openSync('../../docs/fonts/newrocker/NewRocker-Regular.ttf');
            
            const opentypeModel = new makerjs.models.Text(opentypeFont, 'A', 100);
            const fontkitModel = new makerjs.models.Text(fontkitFont, 'A', 100);
            
            const opentypeChains = makerjs.model.findChains(opentypeModel);
            const fontkitChains = makerjs.model.findChains(fontkitModel);
            
            assert.strictEqual(fontkitChains.length, opentypeChains.length);
        });

        it('should produce valid SVG export', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.Text(font, 'Hello', 100);
            
            const svg = makerjs.exporter.toSVG(textModel);
            assert.ok(svg);
            assert.ok(svg.includes('<svg'));
            assert.ok(svg.includes('</svg>'));
            assert.ok(svg.includes('<path'));
        });

        it('should export to SVG without arc commands', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.Text(font, 'Hello World', 100);
            
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
            const textModel = new makerjs.models.Text(font, 'Hello', 100);
            
            assert.ok(textModel);
            assert.ok(textModel.models);
            
            // Should have 5 character models
            const charCount = Object.keys(textModel.models).length;
            assert.strictEqual(charCount, 5);
        });

        it('should position characters with proper spacing', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.Text(font, 'AB', 100);
            
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

    describe('Options and Features', function() {

        it('should accept layout options', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.Text(
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
            const textModel = new makerjs.models.Text(
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
            const textModel = new makerjs.models.Text(
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
            const textModel = new makerjs.models.Text(font, 'A', 100);
            
            const dxf = makerjs.exporter.toDXF(textModel);
            assert.ok(dxf);
            assert.ok(typeof dxf === 'string');
            assert.ok(dxf.includes('LINE') || dxf.includes('LWPOLYLINE'));
        });

        it('should work with model operations', function() {
            const font = fontkit.openSync('../../docs/fonts/arbutusslab/ArbutusSlab-Regular.ttf');
            const textModel = new makerjs.models.Text(font, 'A', 100);
            
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
