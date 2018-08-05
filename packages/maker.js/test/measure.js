var assert = require('assert');
var makerjs = require('../dist/index.js')

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

    it('should find overlapping arcs', function () {
        var arc1 = new makerjs.paths.Arc([0, 0], 10, 0, 90);
        var arc2 = new makerjs.paths.Arc([0, 0], 10, 270, 45);
        var arc3 = new makerjs.paths.Arc([0, 0], 10, 90, 91);
        assert.ok(makerjs.measure.isArcSpanOverlapping(arc1, arc2, true));
        assert.ok(makerjs.measure.isArcSpanOverlapping(arc1, arc3, false));
        assert.ok(!makerjs.measure.isArcSpanOverlapping(arc1, arc3, true));
    });

    it('should find overlapping lines', function () {
        var line1 = new makerjs.paths.Line([0, 0], [5, 5]);
        var line2 = new makerjs.paths.Line([3, 3], [7, 7]);
        var line3 = new makerjs.paths.Line([8, 8], [9, 9]);
        assert.ok(makerjs.measure.isLineOverlapping(line1, line2));
        assert.ok(!makerjs.measure.isLineOverlapping(line1, line3));
    });

    it('should find equal slopes', function () {
        var line1 = new makerjs.paths.Line([0, 0], [5, 5]);
        var line2 = new makerjs.paths.Line([3, 3], [7, 7]);
        var line3 = new makerjs.paths.Line([8, 8], [8, 0]);
        var slope1 = makerjs.measure.lineSlope(line1);
        var slope2 = makerjs.measure.lineSlope(line2);
        var slope3 = makerjs.measure.lineSlope(line3);
        assert.ok(makerjs.measure.isSlopeEqual(slope1, slope2));
        assert.ok(!makerjs.measure.isSlopeEqual(slope1, slope3));
    });

    it('should find point on a slope', function () {
        var line = new makerjs.paths.Line([0, 0], [5, 5]);
        var slope = makerjs.measure.lineSlope(line);
        assert.ok(makerjs.measure.isPointOnSlope([3.3, 3.3], slope));
        assert.ok(!makerjs.measure.isPointOnSlope([0, 1], slope));
    });

    it('should find point on a circle', function () {
        var circle = new makerjs.paths.Circle([0, 0], 1);
        assert.ok(makerjs.measure.isPointOnCircle([0, 1], circle));
        assert.ok(makerjs.measure.isPointOnCircle([Math.SQRT2 / 2, Math.SQRT2 / 2], circle));
        assert.ok(!makerjs.measure.isPointOnCircle([1, 1], circle));
    });

    it('should find point on a path', function () {
        var circle = new makerjs.paths.Circle([0, 0], 1);
        var arc = new makerjs.paths.Arc([0, 0], 1, 1, 90);
        var line = new makerjs.paths.Line([0, 1], [5, 5]);
        assert.ok(makerjs.measure.isPointOnPath([0, 1], circle));
        assert.ok(makerjs.measure.isPointOnPath([0, 1], arc));
        assert.ok(makerjs.measure.isPointOnPath([0, 1], line));
        assert.ok(!makerjs.measure.isPointOnPath([1, 1], circle));
        assert.ok(!makerjs.measure.isPointOnPath([1, 0], arc));
        assert.ok(!makerjs.measure.isPointOnPath([1, 1], line));
    });

});
