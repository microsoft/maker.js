var assert = require('assert');
var makerjs = require('../index.js')

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
        assert.equal(int.intersectionPoints[0][0], -24.494897437784694);
        assert.equal(int.intersectionPoints[0][1], 3.0000000051871396);
    })

});
