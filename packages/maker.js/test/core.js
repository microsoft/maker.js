var assert = require('assert');
var makerjs = require('../dist/index.js')

describe('Core', function () {

  it('should round 1.005 to 1.01', function () {
    assert.equal(1.01, makerjs.round(1.005, .01));
  });

  it('should round 1.001 to 1', function () {
    assert.equal(1, makerjs.round(1.001, .01));
  });

  it('should add property with extendObject', function () {
    var o1 = { p1: 0 };
    var o2 = { p2: 0 };
    makerjs.extendObject(o1, o2);
    assert.ok('p2' in o1);
  });

  it('should change property with extendObject', function () {
    var o1 = { p1: 0 };
    var o2 = { p1: 1 };
    makerjs.extendObject(o1, o2);
    assert.equal(o1.p1, 1);
  });

  describe('Type checks', function () {

    it('should validate with isNumber', function () {
      assert.ok(makerjs.isNumber(0));
      assert.ok(makerjs.isNumber(1.00005));
    });

    it('should not validate with isNumber', function () {
      assert.ok(!makerjs.isNumber('a'));
      assert.ok(!makerjs.isNumber([0]));
      assert.ok(!makerjs.isNumber({}));
      assert.ok(!makerjs.isNumber());
    });

    it('should round to a number', function () {
      assert.ok(makerjs.isNumber(makerjs.round(1.005, .00001)));
    });

    it('should validate with isPoint', function () {
      assert.ok(makerjs.isPoint([0, 0]));
    });

    it('should not validate with isPoint', function () {
      assert.ok(!makerjs.isPoint(['a', 0]));
      assert.ok(!makerjs.isPoint([0, 0, 0]));
      assert.ok(!makerjs.isPoint({}));
      assert.ok(!makerjs.isPoint({ x: 0, y: 0 }));
    });

    it('should validate with isPath', function () {
      assert.ok(makerjs.isPath({ type: 'anything', origin: [0, 0] }));
    });

    it('should not validate with isPath', function () {
      assert.ok(!makerjs.isPath({}));
      assert.ok(!makerjs.isPath([]));
      assert.ok(!makerjs.isPath(0));
    });

    it('should validate with isPathLine', function () {
      assert.ok(makerjs.isPathLine({ type: 'line', origin: [0, 0], end: [1, 1] }));
    });

    it('should not validate with isPathLine', function () {
      assert.ok(!makerjs.isPathLine({ type: 'line', origin: [0, 0], end: 1 }));
      assert.ok(!makerjs.isPathLine({ type: 'line' }));
      assert.ok(!makerjs.isPathLine({ type: 'arc', origin: [0, 0], end: [1, 1] }));
    });

    it('should validate with isPathCircle', function () {
      assert.ok(makerjs.isPathCircle({ type: 'circle', origin: [0, 0], radius: 1 }));
    });

    it('should not validate with isPathCircle', function () {
      assert.ok(!makerjs.isPathCircle({ type: 'circle' }));
      assert.ok(!makerjs.isPathCircle({ type: 'circle', origin: [0, 0], radius: 'a' }));
      assert.ok(!makerjs.isPathCircle({ type: 'arc', origin: [0, 0], radius: 1 }));
    });

    it('should validate with isPathArc', function () {
      assert.ok(makerjs.isPathArc({ type: 'arc', origin: [0, 0], radius: 1, startAngle: 0, endAngle: 180 }));
    });

    it('should not validate with isPathArc', function () {
      assert.ok(!makerjs.isPathArc({ type: 'arc' }));
      assert.ok(!makerjs.isPathArc({ type: 'arc', origin: [0, 0], radius: 1, startAngle: 0, endAngle: 'a' }));
      assert.ok(!makerjs.isPathArc({ type: 'circle', origin: [0, 0], radius: 1, startAngle: 0, endAngle: 180 }));
    });

    it('should validate with isModel', function () {
      assert.ok(makerjs.isModel({ paths: {} }));
      assert.ok(makerjs.isModel({ models: {} }));
    });

    it('should not validate with isModel', function () {
      assert.ok(!makerjs.isModel({}));
      assert.ok(!makerjs.isModel([]));
      assert.ok(!makerjs.isModel(0));
    });
  });

});
