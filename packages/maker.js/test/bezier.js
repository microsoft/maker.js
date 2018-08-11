var assert = require('assert');
var makerjs = require('../dist/index.js')

describe('Beziers', function () {

  it('should export SVG of a bezier curve with offset origin', function () {
    var points = [[0, 100], [0, 0], [100, 0]];
    var curve1 = new makerjs.models.BezierCurve(points);
    var curve2 = new makerjs.models.BezierCurve(points, .1);

    curve1.origin = [20, 20];

    var model = {
      models: {
        c1: curve1,
        c2: curve2
      }
    };
    var svg = makerjs.exporter.toSVG(model);

    assert.ok(svg);
  });

});
