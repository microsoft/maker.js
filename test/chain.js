var assert = require('assert');
var makerjs = require('../index.js')

describe('Chains', function () {

  var twoStraightLines = new makerjs.models.ConnectTheDots(false, [[0, 0], [0, 1], [0, 2]]);

  it('should find a chain of 2 links', function () {
    var chain = makerjs.model.findSingleChain(twoStraightLines);
    assert.ok(chain);
    assert.equal(chain.links.length, 2);
  });

  it('should find an endless chain in a square', function () {
    var square = new makerjs.models.Square(7);
    var chain = makerjs.model.findSingleChain(square);
    assert.ok(chain);
    assert.equal(chain.links.length, 4);
    assert.ok(chain.endless);
  });

  it('should find a zero joint', function () {
    var chain = makerjs.model.findSingleChain(twoStraightLines);
    var a = makerjs.angle.ofChainLinkJoint(chain.links[0], chain.links[1]);
    assert.equal(a, 0);
  });

  it('should find a 90 joint', function () {
    var rightAngleLines = new makerjs.models.ConnectTheDots(false, [[0, 0], [0, 1], [1, 1]]);
    var chain = makerjs.model.findSingleChain(rightAngleLines);
    var origin = chain.links[0].walkedPath.pathContext.origin;
    var a = makerjs.angle.ofChainLinkJoint(chain.links[0], chain.links[1]);
    assert.equal(Math.abs(a), 90);
  });

  it('should find a 45 joint with a line at start of an arc', function () {
    var model = {
      paths: {
        line: new makerjs.paths.Line([1, 1], [2, 0]),
        arc: new makerjs.paths.Arc([0, 1], 1, 0, 180)
      }
    };
    var chain = makerjs.model.findSingleChain(model);
    var a = makerjs.angle.ofChainLinkJoint(chain.links[0], chain.links[1]);
    assert.equal(Math.abs(a), 45);
  });

  it('should find a 45 joint with a line at end of an arc', function () {
    var model = {
      paths: {
        line: new makerjs.paths.Line([-1, 1], [0, 0]),
        arc: new makerjs.paths.Arc([0, 1], 1, 0, 180)
      }
    };
    var chain = makerjs.model.findSingleChain(model);
    var a = makerjs.angle.ofChainLinkJoint(chain.links[0], chain.links[1]);
    assert.equal(Math.abs(a), 45);
  });

  it('should find a zero joint with a line at end of an arc', function () {
    var model = {
      paths: {
        line: new makerjs.paths.Line([0, 0], [0, 1]),
        arc: new makerjs.paths.Arc([1, 1], 1, 0, 180)
      }
    };
    var chain = makerjs.model.findSingleChain(model);
    var a = makerjs.angle.ofChainLinkJoint(chain.links[0], chain.links[1]);
    assert.equal(a, 0);
  });

  it('should find a zero joint with a line at start of an arc', function () {
    var model = {
      paths: {
        line: new makerjs.paths.Line([0, 0], [0, 1]),
        arc: new makerjs.paths.Arc([-1, 1], 1, 0, 180)
      }
    };
    var chain = makerjs.model.findSingleChain(model);
    var a = makerjs.angle.ofChainLinkJoint(chain.links[0], chain.links[1]);
    assert.equal(a, 0);
  });

  it('should find a 180 joint with two arcs', function () {
    var model = {
      paths: {
        arc1: new makerjs.paths.Arc([-1, 0], 1, 0, 180),
        arc2: new makerjs.paths.Arc([1, 0], 1, 0, 180)
      }
    };
    var chain = makerjs.model.findSingleChain(model);
    var a = makerjs.angle.ofChainLinkJoint(chain.links[0], chain.links[1]);
    assert.equal(a, 180);
  });

  it('longest chain should be endless', function () {
    this.timeout(60000);
    var pathData = require('./data').rainbow;
    var model = makerjs.importer.fromSVGPathData(pathData);
    var expanded = makerjs.model.expandPaths(model, 5);
    var chains = makerjs.model.findChains(expanded);
    assert.ok(chains);
    assert.ok(chains[0]);
    assert.ok(chains[0].endless);
  });

});
