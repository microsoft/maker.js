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

    it('should find same center for bounding hexagon and a circle', function () {
        var ring = new makerjs.models.Ring(100);
        var center = makerjs.measure.modelExtents(ring).center;
        var hex = makerjs.measure.boundingHexagon(ring);
        assert.ok(makerjs.measure.isPointEqual(hex.origin, center));
    });

    it('should find same center for bounding hexagon and a square', function () {
        var square = new makerjs.models.Square(100);
        var center = makerjs.measure.modelExtents(square).center;
        var hex = makerjs.measure.boundingHexagon(square);
        assert.ok(makerjs.measure.isPointEqual(hex.origin, center));
    });

    it('should find same center for bounding hexagon and an offset circle', function () {
        var ring = new makerjs.models.Ring(100);
        ring.origin = [7, 77];
        var center = makerjs.measure.modelExtents(ring).center;
        var hex = makerjs.measure.boundingHexagon(ring);
        assert.equal(hex.origin[0], 7);
        assert.equal(hex.origin[1], 77);
    });

    it('should find same center for bounding hexagon and an offset square', function () {
        var square = new makerjs.models.Square(100);
        makerjs.model.center(square);
        var center = makerjs.measure.modelExtents(square).center;
        var hex = makerjs.measure.boundingHexagon(square);
        assert.ok(makerjs.measure.isPointEqual(hex.origin, center));
    });

});
