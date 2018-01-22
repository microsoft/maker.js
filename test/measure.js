var assert = require('assert');
var makerjs = require('../index.js')

describe('Measure', function () {

    it('should find number between when not exclusive', function () {
        var a = 7.180755781458288;
        var b = 172.8192442185417, c = 7.180755781458288;

        var isBetween = makerjs.measure.isBetween(a, b, c, false);
        assert.equal(isBetween, true);
    });

    it('should not find number between when exclusive', function () {
        var a = 7.180755781458288;
        var b = 172.8192442185417, c = 7.180755781458288;

        var isBetween = makerjs.measure.isBetween(a, b, c, true);
        assert.equal(isBetween, false);
    });

    it('should find angle between when not exclusive', function () {
        var a = 7.180755781458288;
        var arc = new makerjs.paths.Arc([0, 0], 10, 172.8192442185417, 7.180755781458288);

        var isBetween = makerjs.measure.isBetweenArcAngles(a, arc, false);
        assert.equal(isBetween, true);
    });

    it('should not find angle between when exclusive', function () {
        var a = 7.180755781458288;
        var arc = new makerjs.paths.Arc([0, 0], 10, 172.8192442185417, 7.180755781458288);

        var isBetween = makerjs.measure.isBetweenArcAngles(a, arc, true);
        assert.equal(isBetween, false);
    });

});
