var assert = require('assert');
var makerjs = require('../dist/index.js')

describe('Paths', function () {

  it('should create a Line', function () {
    var line = new makerjs.paths.Line([0, 0], [1, 1]);
    assert.ok(makerjs.isPathLine(line));
  });

  it('should create a Circle', function () {
    var circle = new makerjs.paths.Circle([0, 0], 1);
    assert.ok(makerjs.isPathCircle(circle));
  });

  it('should create an Arc', function () {
    var arc = new makerjs.paths.Arc([0, 0], 1, 0, 90);
    assert.ok(makerjs.isPathArc(arc));
  });

});
