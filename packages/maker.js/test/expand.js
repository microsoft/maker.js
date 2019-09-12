var assert = require('assert');
var makerjs = require('../dist/index.js')

function textFunction(fontName, distance, chainCount) {
    return function () {
        var model = require(`./data/${fontName}.json`);
        var expansion = makerjs.model.expandPaths(model, distance);
        var chains = makerjs.model.findChains(expansion);
        assert.equal(chains.length, chainCount);
    }
}

describe('Expand', function () {

    it('should expand a line', function () {
        var line = new makerjs.paths.Line([10, 10], [50, 50]);
        var lineExpansion = makerjs.path.expand(line, 10);
        var chains = makerjs.model.findChains(lineExpansion);
        assert.equal(chains.length, 1);
    });

    it('should expand an arc', function () {
        var arc = new makerjs.paths.Arc([10, 10], 20, 0, 90);
        var arcExpansion = makerjs.path.expand(arc, 10);
        var chains = makerjs.model.findChains(arcExpansion);
        assert.equal(chains.length, 1);
    });

    it('should expand a circle', function () {
        var circle = new makerjs.paths.Circle([10, 10], 25);
        var circleExpansion = makerjs.path.expand(circle, 10);
        var chains = makerjs.model.findChains(circleExpansion);
        assert.equal(chains.length, 2);
    });

    it('should expand a small circle', function () {
        var circle = new makerjs.paths.Circle([10, 10], 9);
        var circleExpansion = makerjs.path.expand(circle, 10);
        var chains = makerjs.model.findChains(circleExpansion);
        assert.equal(chains.length, 1);
    });

    it('should expand a box - thin', function () {
        var square = new makerjs.models.Square(10);
        var expansion = makerjs.model.expandPaths(square, 1);
        var chains = makerjs.model.findChains(expansion);
        assert.equal(chains.length, 2);
    });

    it('should expand a box - thick', function () {
        var square = new makerjs.models.Square(10);
        var expansion = makerjs.model.expandPaths(square, 10);
        var chains = makerjs.model.findChains(expansion);
        assert.equal(chains.length, 1);
    });

    it('should expand ArbutusSlab - thin', textFunction('arbutusslab-ArbutusSlab-Regular', 1, 4));
    //it('should expand ArbutusSlab - thin', textFunction('arbutusslab-ArbutusSlab-Regular', 3, 3)); //broken
    it('should expand ArbutusSlab - thick', textFunction('arbutusslab-ArbutusSlab-Regular', 7, 2));

    it('should expand NewRocker - thin', textFunction('newrocker-NewRocker-Regular', 1, 4));
    //it('should expand NewRocker - thin', textFunction('newrocker-NewRocker-Regular', 3, 4)); //broken
    it('should expand NewRocker - thick', textFunction('newrocker-NewRocker-Regular', 9, 1));

});
