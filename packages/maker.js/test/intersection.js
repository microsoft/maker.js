var assert = require('assert');
var makerjs = require('../dist/index.js')

describe('Path Intersection', function () {

    it('should intersect an arc and a circle', function () {

        const
            c = {
                "type": "circle",
                "origin": [0, 0],
                "radius": 1.0123663832210559
            },
            a = {
                "type": "arc",
                "origin": [0.8873663832210559, 0],
                "radius": 0.375,
                "startAngle": 0,
                "endAngle": 106.36363636363635
            };

        const int = makerjs.path.intersection(a, c);
        assert.ok(int);
        assert.ok(int.path1Angles);
        assert.ok(int.path1Angles[0]);
        assert.ok(int.path2Angles);
        assert.ok(int.path2Angles[0]);
    });

    it('should intersect an arc and a line at one point', function () {

        var line = new makerjs.paths.Line([0, 3], [-75, 3]);
        var arc = new makerjs.paths.Arc([0, 50], 53, 180, 270);

        var int = makerjs.path.intersection(line, arc);

        assert.ok(int);
        assert.ok(int.path2Angles);
        assert.equal(int.path2Angles, 242.4729147);
        assert.ok(int.intersectionPoints);
        assert.equal(int.intersectionPoints.length, 1);
        assert.equal(int.intersectionPoints[0][0], -24.4948974);
        assert.equal(int.intersectionPoints[0][1], 3);
    });

    it('should intersect a line and a circle in 2 points', function () {

        var line = new makerjs.paths.Line([-50, -50], [50, 50]);
        var circle = new makerjs.paths.Circle([0, 0], 50);

        var int = makerjs.path.intersection(line, circle);

        assert.ok(int);
        assert.ok(int.path2Angles);
        assert.equal(int.path2Angles.length, 2);
        assert.equal(int.path2Angles.sort((a, b) => b - a)[1], 45);
        assert.ok(int.intersectionPoints);
        assert.equal(int.intersectionPoints.length, 2);
    });

    it('should intersect overlapping circles', function() {
        var circle1 = new makerjs.paths.Circle([0, 0], 1);
        var circle2 = new makerjs.paths.Circle([0, 1], 1);

        var int = makerjs.path.intersection(circle1, circle2);

        assert.ok(int);
        assert.ok(int.path2Angles);
        assert.equal(int.path2Angles.length, 2);
        assert.equal(int.path2Angles.sort((a, b) => b - a)[0], 330);
        assert.equal(int.path2Angles.sort((a, b) => b - a)[1], 210);
        assert.ok(int.intersectionPoints);
        assert.equal(int.intersectionPoints.length, 2);
    })

    it('should not intersect tangent circles if excludeTangents = true', function() {
        var circle1 = new makerjs.paths.Circle([0, 0], 1);
        var circle2 = new makerjs.paths.Circle([0, 2], 1);

        var int = makerjs.path.intersection(circle1, circle2, {excludeTangents: true});

        assert.equal(int, null);
    })

    it('should intersect tangent circles at one angle, one point', function() {

        var circle1 = new makerjs.paths.Circle([0, 0], 1);
        var circle2 = new makerjs.paths.Circle([0, 2], 1);

        var int = makerjs.path.intersection(circle1, circle2);

        assert.ok(int);
        assert.ok(int.path2Angles);
        assert.equal(int.path2Angles.length, 1);
        assert.equal(int.path2Angles.sort((a, b) => b - a)[0], 270);
        assert.ok(int.intersectionPoints);
        assert.equal(int.intersectionPoints.length, 1);
    })

    it('should not interesect circle inside circle', function () {

        var circle1 = new makerjs.paths.Circle([0, 0], 1);
        var circle2 = new makerjs.paths.Circle([0, 0], 0.5);

        var int = makerjs.path.intersection(circle1, circle2);

        assert.equal(int, null);
    });

    it('should not interesect circle on circle', function () {

        var circle1 = new makerjs.paths.Circle([0, 0], 1);
        var circle2 = new makerjs.paths.Circle([0, 0], 1);

        var int = makerjs.path.intersection(circle1, circle2);

        assert.equal(int, null);
    });

    it('should intersect two crossing lines', function() {
        var line1 = new makerjs.paths.Line([0, 0], [1, 1]);
        var line2 = new makerjs.paths.Line([0, 1], [1, 0]);

        var int = makerjs.path.intersection(line1, line2);

        assert.ok(int);
        assert.equal(int.path2Angles, null);
        assert.ok(int.intersectionPoints);
        assert.equal(int.intersectionPoints.length, 1);
    });

    it('should not intersect two non-intersecting lines', function() {
        var line1 = new makerjs.paths.Line([0, 0], [1, 1]);
        var line2 = new makerjs.paths.Line([0, 1], [2, 2]);

        var int = makerjs.path.intersection(line1, line2);

        assert.equal(int, null);
    });

    it('should intersect two lines that touch at their origins', function() {
        var line1 = new makerjs.paths.Line([0, 0], [1, 2]);
        var line2 = new makerjs.paths.Line([0, 0], [1, 1]);

        var int = makerjs.path.intersection(line1, line2);

        assert.ok(int);
        assert.equal(int.path2Angles, null);
        assert.ok(int.intersectionPoints);
        assert.equal(int.intersectionPoints.length, 1);
    });
});
