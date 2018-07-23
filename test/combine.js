var assert = require('assert');
var makerjs = require('../index.js')

describe('Combine', function () {

    it('should union 2 squares', function () {
        var s1 = new makerjs.models.Square(10);
        var s2 = new makerjs.models.Square(5);
        s2.origin = [10, 2.5];

        var result = makerjs.model.combineUnion(s1, s2);

        var chain = makerjs.model.findChains(result, function (chains, loose, layer) {
            assert.equal(loose.length, 0);
            assert.equal(chains.length, 1);
        });
    });

});
