var fs = require('fs');
var assert = require('assert');
var makerjs = require('../dist/index.js')
var opentype = require('opentype.js');

function textFromFont(fontName, text, chainCount, combine) {
    return function () {
        var font = opentype.loadSync(`../../docs/fonts/${fontName}.ttf`);
        assert.ok(font);
        var textModel = new makerjs.models.Text(font, text, 100, combine);
        assert.ok(textModel);
        fs.writeFileSync(`./test/data/${fontName.replace('/', '-')}.json`, JSON.stringify(textModel, null, 2));
        var chains = makerjs.model.findChains(textModel);
        assert.equal(chains.length, chainCount);
    };
}

describe('Text', function () {

    it('should create text from ArbutusSlab-Regular font', textFromFont('arbutusslab/ArbutusSlab-Regular', 'A', 2, false));
    it('should create text from NewRocker-Regular font', textFromFont('newrocker/NewRocker-Regular', 'A', 2, false));
    it('should create combined text from MontserratSubrayada-Regular font', textFromFont('montserratsubrayada/MontserratSubrayada-Regular.ttf', 'ABCD', 5, true));

});
