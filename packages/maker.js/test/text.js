var fs = require('fs');
var assert = require('assert');
var makerjs = require('../dist/index.js')
var opentype = require('opentype.js');

function textFromFont(fontName, chainCount) {
    return function () {
        var font = opentype.loadSync(`../../docs/fonts/${fontName}.ttf`);
        assert.ok(font);
        var textModel = new makerjs.models.Text(font, 'A', 100);
        assert.ok(textModel);
        fs.writeFileSync(`./test/data/${fontName.replace('/', '-')}.json`, JSON.stringify(textModel, null, 2));
        var chains = makerjs.model.findChains(textModel);
        assert.equal(chains.length, chainCount);
    };
}

function textFromFontNoArcsInSVG(fontName) {
    return function () {
        var font = opentype.loadSync(`../../docs/fonts/${fontName}.ttf`);
        assert.ok(font);
        var textModel = new makerjs.models.Text(font, 'A', 100);
        assert.ok(textModel);
        
        // Export to SVG and check for arc commands
        var svg = makerjs.exporter.toSVG(textModel);
        assert.ok(svg);
        
        // Extract path data from SVG
        var pathMatch = svg.match(/<path[^>]*d=['"]([^'"]*)['"]/);
        assert.ok(pathMatch, 'SVG should contain path element with d attribute');
        
        var pathData = pathMatch[1];
        
        // Check that there are NO arc commands (A/a) in the path data
        // Arc commands follow pattern: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        // Use word boundary and case-insensitive flag to match the command regardless of spacing or case
        var hasArcCommand = /\b[Aa]\b/.test(pathData);
        assert.ok(!hasArcCommand, 'SVG path should not contain arc (A/a) commands - BezierSeeds should be used instead');
    };
}

describe('Text', function () {

    it('should create text from a font', textFromFont('arbutusslab/ArbutusSlab-Regular', 2));
    it('should create text from a font', textFromFont('newrocker/NewRocker-Regular', 2));
    
    it('should export font to SVG without arc commands', textFromFontNoArcsInSVG('arbutusslab/ArbutusSlab-Regular'));
    it('should export font to SVG without arc commands', textFromFontNoArcsInSVG('newrocker/NewRocker-Regular'));

});
