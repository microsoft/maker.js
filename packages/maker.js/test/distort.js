var assert = require('assert');
var makerjs = require('../dist/index.js')
var model = require(`./data/problem1-curve.json`);

describe('Distort', function () {
    var scales = [
        [0.1, 0.5],
        [1, 1],
        [1.5, 0.5],
        [10, 10]
    ];

    var accuracy = 0.00001;
    var chainOptions = {
        pointMatchingDistance: 0.01,
        shallow: false,
        unifyBeziers: false
    };

    var originalMeasurements = makerjs.measure.modelExtents(model);
    var chains = makerjs.model.findChains(model, chainOptions);
    var originalChainCount = chains && chains.length;
    var originalChainLinkCount = chains && chains.length > 0 ? chains[0].links.length : 0;
    var isOriginalEndless = chains && chains.length > 0 && chains[0].endless;

    scales.forEach(function (scale) {
        describe("by " + scale[0] + " x " + scale[1], function () {

            var scaled = makerjs.model.distort(model, scale[0], scale[1], 0.05);

            var scaledMeasurements = makerjs.measure.modelExtents(scaled);
            it('should have the correctly scaled width', function () {
                assert.ok(Math.abs(scaledMeasurements.width - scale[0] * originalMeasurements.width) < accuracy);
            });

            it('should have the correctly scaled height', function () {
                assert.ok(Math.abs(scaledMeasurements.height - scale[1] * originalMeasurements.height) < accuracy);
            });

            var scaledChains = makerjs.model.findChains(scaled, chainOptions);
            it('should have one linked chain, same as the original', function () {
                var chainCount = scaledChains && scaledChains.length;
                assert.equal(chainCount, originalChainCount);
            });

            it('should have the same chain link count', function () {
                var chainLinkCount = scaledChains && scaledChains.length > 0 ? scaledChains[1].links.length : 0;
                assert.equal(chainLinkCount, originalChainLinkCount);
            });

            it('should be endless if the original chain was endless', function () {
                var isScaledEndless = chains && chains.length > 0 && chains[0].endless;
                assert.equal(isOriginalEndless, isScaledEndless);
            });
        });
    });
});
