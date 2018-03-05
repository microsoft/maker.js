var assert = require('assert');
var makerjs = require('../index.js')

function combineTest(angle, add) {
    var oval1 = new makerjs.models.Oval(50, 100);
    var oval2 = new makerjs.models.Oval(50, 100);
    oval1.origin = [-25, -25];
    oval2.origin = [-25, -25];
    makerjs.model.rotate(oval2, angle);
    this.models = { oval1, oval2 };
    makerjs.model.combine(oval1, oval2, false, true, !add, add);
}

describe('Combine', function () {

    it('should find one chain when combining two ovals for 360 iterations', function () {
        for (var a = -180; a <= 180; a++) {
            var shape = new combineTest(a);
            makerjs.model.findChains(function (chains, loose) {
                if (loose.length) {
                    assert.fail(loose.length, 0, `should not be any loose paths at angle ${a}`);
                } else {
                    if (chains.length === 1) {
                        assert(chains[0].endless);
                    } else {
                        assert.fail(chains.length, 1, `should only be one chain at angle ${a}`);
                    }
                }
            });
        }
    });

    it('should find one chain when subtracting two ovals for 360 iterations', function () {
        for (var a = -180; a <= 180; a++) {
            var shape = new combineTest(a, true);
            makerjs.model.findChains(function (chains, loose) {
                if (loose.length) {
                    assert.fail(loose.length, 0, `should not be any loose paths at angle ${a}`);
                } else {
                    if (chains.length === 1) {
                        assert(chains[0].endless);
                    } else {
                        assert.fail(chains.length, 1, `should only be one chain at angle ${a}`);
                    }
                }
            });
        }
    });   

});
