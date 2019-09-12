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

describe('Text', function () {

    it('should create text from a font', textFromFont('arbutusslab/ArbutusSlab-Regular', 2));
    it('should create text from a font', textFromFont('newrocker/NewRocker-Regular', 2));

});
