var assert = require('assert');
var makerjs = require('../dist/index.js')

describe('Angle', function () {

  it('should normalize an angle', function () {
    assert.equal(makerjs.angle.noRevolutions(360), 0);
    assert.equal(makerjs.angle.noRevolutions(370), 10);
    assert.equal(makerjs.angle.noRevolutions(362), 2);
    assert.equal(makerjs.angle.noRevolutions(722), 2);
    assert.equal(makerjs.angle.noRevolutions(370.1), 10.1);
    assert.equal(makerjs.angle.noRevolutions(372.2), 12.2);
  });

  it('should normalize a negative revolution', function () {
    assert.equal(makerjs.angle.noRevolutions(-358), 2);
    assert.equal(makerjs.angle.noRevolutions(-718), 2);
    assert.equal(makerjs.angle.noRevolutions(-360), 0);
    assert.equal(makerjs.angle.noRevolutions(-720), 0);
    assert.equal(makerjs.angle.noRevolutions(-362), 358);
    assert.equal(makerjs.angle.noRevolutions(-722), 358);
  });

  it('should find end of arc past start', function() {
    var arc1 = new makerjs.paths.Arc([0, 1], 1, 315, 135);
    assert.equal(makerjs.angle.ofArcEnd(arc1), 495);
    var arc2 = new makerjs.paths.Arc([0, 1], 1, 450, 0);
    assert.equal(makerjs.angle.ofArcEnd(arc2), 720);
  });

  it('should find end of arc past start - all negative', function() {
    var arc = new makerjs.paths.Arc([0, 1], 1, -90, -45);
    assert.equal(makerjs.angle.ofArcEnd(arc), -45);
  });

  it('should find end of arc past start - end negative', function() {
    var arc = new makerjs.paths.Arc([0, 1], 1, 270, -45);
    assert.equal(makerjs.angle.ofArcEnd(arc), 315);
  });

  it('should find arc span', function() {
    var arc = new makerjs.paths.Arc([0, 1], 1, 315, 135);
    assert.equal(makerjs.angle.ofArcSpan(arc), 180);
  });

  it('should find arcSpan when end is less than start', function() {
    var arc = new makerjs.paths.Arc([0, 1], 1, 405, 180);
    assert.equal(makerjs.angle.ofArcSpan(arc), 135);
  });
  
  it('should find arcSpan when angles are mixed', function() {
    var arc = new makerjs.paths.Arc([0, 1], 1, 45, -45);
    assert.equal(makerjs.angle.ofArcSpan(arc), 270);
  });

  it('should find arcSpan when angles are mixed2', function() {
    var arc = new makerjs.paths.Arc([0, 1], 1, -45, 135);
    assert.equal(makerjs.angle.ofArcSpan(arc), 180);
  });

  it('should find arcSpan when angles are negative', function() {
    var arc = new makerjs.paths.Arc([0, 1], 1, -90, -45);
    assert.equal(makerjs.angle.ofArcSpan(arc), 45);
  });

  it('should find arcSpan when angles are negative revolution', function() {
    var arc = new makerjs.paths.Arc([0, 1], 1, -450, -45);
    assert.equal(makerjs.angle.ofArcSpan(arc), 45);
  });

});
