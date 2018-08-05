var assert = require('assert');
var makerjs = require('../dist/index.js')

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

  it('should find outlines around a shape', function () {
    var d = "M 305.784 54.45072 L 303.336 41.34672 L 302.328 41.34672 L 300.024 54.45072 Q 299.808 56.17872 287.424 56.17872 A 16.6332426 16.6332426 0 0 1 282.852 55.78272 A 2.5408286 2.5408286 0 0 1 281.304 54.45072 Q 267.912 21.54672 267.912 19.81872 Q 267.912 18.09072 273.132 16.25472 A 30.2264317 30.2264317 0 0 1 283.176 14.41872 Q 289.368 14.41872 289.584 17.73072 L 292.032 37.45872 L 292.896 37.45872 L 293.76 21.54672 A 4.5656598 4.5656598 0 0 1 297.432 18.37872 A 20.3303078 20.3303078 0 0 1 304.704 17.01072 A 13.0119365 13.0119365 0 0 1 310.212 17.91072 A 2.8083651 2.8083651 0 0 1 312.12 20.10672 L 312.912 37.45872 L 313.704 37.45872 L 316.08 18.95472 Q 316.296 17.22672 320.94 15.82272 A 28.736749 28.736749 0 0 1 329.112 14.41872 A 12.5706606 12.5706606 0 0 1 334.656 15.42672 A 4.6079739 4.6079739 0 0 1 337.968 19.17072 A 888.9179346 888.9179346 0 0 1 331.452 36.73872 A 935.5535915 935.5535915 0 0 1 324.72 54.45072 Q 323.784 56.17872 314.964 56.17872 Q 306.144 56.17872 305.784 54.45072 Z";
    var w = makerjs.importer.fromSVGPathData(d);
    var distances = [1, 2, 5, 10];

    distances.forEach(d => {
      var o = makerjs.model.outline(w, d);
      var chains = makerjs.model.findChains(o);
      assert.equal(chains.length, 1);
      assert.ok(chains[0].endless);
      assert.ok(chains[0].links.length > 1);
    })
  });

});
