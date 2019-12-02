var assert = require('assert');
var makerjs = require('../dist/index.js')

describe('Combine', function () {

    it('should union 2 exterior squares', function () {
        var s1 = new makerjs.models.Square(10);
        var s2 = new makerjs.models.Square(5);
        s2.origin = [10, 2.5];

        var result = makerjs.model.combineUnion(s1, s2);

        makerjs.model.findChains(result, function (chains, loose, layer) {
            assert.equal(loose.length, 0);
            assert.equal(chains.length, 1);
            chains.forEach(c => {
                assert.equal(c.endless, true);
            });
        });
    });

    it('should union 2 interior squares', function () {
        var s1 = new makerjs.models.Square(10);
        var s2 = new makerjs.models.Square(5);
        s2.origin = [0, 2.5];

        var result = makerjs.model.combineUnion(s1, s2);

        makerjs.model.findChains(result, function (chains, loose, layer) {
            assert.equal(loose.length, 0);
            assert.equal(chains.length, 1);
            chains.forEach(c => {
                assert.equal(c.endless, true);
            });
        });
    });

    it('should not obliterate a duplicate union', function () {
        var model = { models: { a: {}, b: {}, c: {} } };

        makerjs.$(new makerjs.models.Square(10))
            .prefixPathIds('a1_')
            .addTo(model.models.a, 'a1');

        makerjs.$(new makerjs.models.Square(10))
            .move([11, 0])
            .prefixPathIds('a2_')
            .addTo(model.models.a, 'a2');

        makerjs.$(new makerjs.models.Square(10))
            .prefixPathIds('b1_')
            .addTo(model.models.b, 'b1');

        makerjs.$(new makerjs.models.Square(10))
            .move([11, 0])
            .prefixPathIds('b2_')
            .addTo(model.models.b, 'b2');

        makerjs.$(new makerjs.models.Square(10))
            .move([22, 0])
            .prefixPathIds('c1_')
            .addTo(model.models.c, 'c1');

        var result = makerjs.model.combineUnion(model.models.a, model.models.b);

        makerjs.model.findChains(result, function (chains, loose, layer) {
            assert.equal(loose.length, 0);
            assert.equal(chains.length, 2);
            chains.forEach(c => {
                assert.equal(c.endless, true);
            });
        });
    });

    it('should subtract a square', function () {
        var s1 = new makerjs.models.Square(6);
        var s2 = new makerjs.models.Square(3);

        s2.origin = [4, 4];

        makerjs.model.combineSubtraction(s1, s2);

        model = { models: [s1, s2] };

        makerjs.model.findChains(model, function (chains, loose, layer) {
            assert.equal(loose.length, 0);
            assert.equal(chains.length, 1);
            chains.forEach(c => {
                assert.equal(c.endless, true);
            });
        });
    });

    it('should subtract a square sharing perimeter', function () {
        var s1 = new makerjs.models.Square(6);
        var s2 = new makerjs.models.Square(2);

        s2.origin = [4, 4];

        makerjs.model.combineSubtraction(s1, s2);

        model = { models: [s1, s2] };

        makerjs.model.findChains(model, function (chains, loose, layer) {
            assert.equal(loose.length, 0);
            assert.equal(chains.length, 1);
            chains.forEach(c => {
                assert.equal(c.endless, true);
            });
        });
    });

    it('should subtract 2 concentric squares', function () {
        var s1 = new makerjs.models.Square(6);
        var s2 = new makerjs.models.Square(2);
        var s3 = new makerjs.models.Square(4);

        s2.origin = [4, 4];
        s3.origin = [3, 3];

        var s5 = { models: [s2, s3] };

        makerjs.model.combineSubtraction(s1, s5);

        const model = { models: [s1, s5] };

        makerjs.model.findChains(model, function (chains, loose, layer) {
            assert.equal(loose.length, 0);
            assert.equal(chains.length, 2);
            chains.forEach(c => {
                assert.equal(c.endless, true);
            });
        });
    });

    it('should subtract 3 concentric squares', function () {
        var s1 = new makerjs.models.Square(6);
        var s2 = new makerjs.models.Square(2);
        var s3 = new makerjs.models.Square(4);
        var s4 = new makerjs.models.Square(6);

        s2.origin = [4, 4];
        s3.origin = [3, 3];
        s4.origin = [2, 2];

        var s5 = { models: [s2, s3, s4] };

        makerjs.model.combineSubtraction(s1, s5);

        model = { models: [s1, s5] };

        makerjs.model.findChains(model, function (chains, loose, layer) {
            assert.equal(loose.length, 0);
            assert.equal(chains.length, 2);
            chains.forEach(c => {
                assert.equal(c.endless, true);
            });
        });
    });

    it('should trim dead ends', function () {
        var wedge = require('./wedge');

        makerjs.model.combine(wedge.models.punch, wedge.models.knife, false, true, false, false, { trimDeadEnds: true });

        makerjs.model.findChains(wedge, function (chains, loose, layer) {
            assert.equal(loose.length, 0);
            assert.equal(chains.length, 1);
            chains.forEach(c => {
                assert.equal(c.endless, true);
            });
        });
    });

    it('should combine an array of models', function () {
        var square = makerjs.model.move(new makerjs.models.Square(20), [15, 0]);
        var spinner = makerjs.layout.cloneToRadial(square, 8, 45);

        makerjs.model.combineArray(spinner.models);

        makerjs.model.findChains(spinner, function (chains, loose, layer) {
            assert.equal(loose.length, 0);
            assert.equal(chains.length, 2);
            chains.forEach(c => {
                assert.equal(c.endless, true);
            });
        });
    });

    it('should combine an array of models sharing a contour', function () {
        var model = {};

        makerjs.$(new makerjs.models.Square(20))
            .move([15, 0])
            .prefixPathIds('s1_')
            .addTo(model, 's1');

        makerjs.$(new makerjs.models.Square(20))
            .move([15, 0])
            .rotate(-45)
            .prefixPathIds('s2_')
            .addTo(model, 's2');

        makerjs.$(new makerjs.models.Rectangle(40, 4))
            .prefixPathIds('r1_')
            .addTo(model, 'r1');

        makerjs.model.combineArray(model.models);

        makerjs.model.findChains(model, function (chains, loose, layer) {
            assert.equal(loose.length, 0);
            assert.equal(chains.length, 1);
            chains.forEach(c => {
                assert.equal(c.endless, true);
            });
        });
    });
});
