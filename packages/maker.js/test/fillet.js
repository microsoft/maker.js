var assert = require('assert');
var makerjs = require('../dist/index.js');

// Check geometry with unrounded trigonometry. Use Maker.js's angle normalization
// convention, but bypass the point helpers' rounding to 1e-7 drawing units.
function polar(degrees, radius) {
  var a = makerjs.angle.toRadians(degrees);
  return [Math.cos(a) * radius, Math.sin(a) * radius];
}

function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function subtract(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function length(v) { return Math.hypot(v[0], v[1]); }
function distance(a, b) { return length(subtract(a, b)); }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
function clone(value) { return makerjs.cloneObject(value); }
function ends(p) {
  return p.type === 'line' ? [p.origin, p.end] :
    [p.startAngle, p.endAngle].map(a => add(p.origin, polar(a, p.radius)));
}
function span(arc) {
  var result = (arc.endAngle - arc.startAngle) % 360;
  return result < 0 ? result + 360 : result;
}
function pathLength(p) {
  return p.type === 'line' ? distance(p.origin, p.end) : span(p) * Math.PI / 180 * p.radius;
}
function tangentAway(p, endpoint) {
  if (p.type === 'line') return subtract(ends(p)[1 - endpoint], ends(p)[endpoint]);
  var radial = polar(endpoint === 0 ? p.startAngle : p.endAngle, 1);
  return endpoint === 0 ? [-radial[1], radial[0]] : [radial[1], -radial[0]];
}

function assertFillet(before, after, fillet, radius, tolerance) {
  assert.ok(fillet, 'expected a fillet');
  assert.strictEqual(fillet.radius, radius);
  assert.ok(span(fillet) > 0 && span(fillet) < 180, 'fillet must have a nonzero span below 180 degrees');
  ends(fillet).forEach(p => p.forEach(n => assert.ok(Number.isFinite(n), 'finite endpoint')));
  var used = [];
  after.forEach((p, i) => {
    var best = { distance: Infinity };
    ends(p).forEach((a, j) => ends(fillet).forEach((b, k) => {
      var d = distance(a, b);
      if (d < best.distance) best = { distance: d, pathEnd: j, filletEnd: k };
    }));
    assert.ok(best.distance <= tolerance, 'disconnected fillet: gap=' + best.distance);
    used.push(best.filletEnd);
    assert.deepStrictEqual(ends(p)[1 - best.pathEnd], ends(before[i])[1 - best.pathEnd], 'opposite endpoint changed');
    assert.ok(pathLength(p) > 0 && pathLength(p) < pathLength(before[i]), 'path must be shortened');
    if (p.type === 'line') {
      var original = subtract(before[i].end, before[i].origin);
      var t = dot(subtract(ends(p)[best.pathEnd], before[i].origin), original) / dot(original, original);
      assert.ok(t > 0 && t < 1, 'tangent point must stay inside the line segment');
    } else {
      assert.strictEqual(p.radius, before[i].radius);
      assert.deepStrictEqual(p.origin, before[i].origin);
      // Preserve the original angular interval, including its revolution count.
      var removed = best.pathEnd === 0 ? p.startAngle - before[i].startAngle : before[i].endAngle - p.endAngle;
      assert.ok(removed > 0 && removed < span(before[i]), 'arc trimmed past its opposite endpoint');
    }
    var away = tangentAway(p, best.pathEnd);
    var into = tangentAway(fillet, best.filletEnd);
    var alignment = dot(away, into) / length(away) / length(into);
    assert.ok(alignment < -1 + 1e-8, 'tangent discontinuity or cusp: dot=' + alignment);
  });
  assert.notStrictEqual(used[0], used[1], 'both paths connected to the same fillet endpoint');
}

function assertRejected(a, b, radius, options) {
  var before = clone([a, b]);
  assert.strictEqual(makerjs.path.fillet(a, b, radius, options), null);
  assert.deepStrictEqual([a, b], before, 'failed fillet modified its inputs');
}

function randomSource(seed) {
  return function () {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// The join is an exact endpoint, with a specified tangent pointing away from it.
function makePath(kind, join, degrees, atStart, size, arcSpan, revolutions) {
  if (kind === 'line') {
    var far = add(join, polar(degrees, size));
    return new makerjs.paths.Line(atStart ? join.slice() : far, atStart ? far : join.slice());
  }
  var center = add(join, polar(degrees + (atStart ? 90 : -90), size));
  var a = degrees + (atStart ? -90 : 90) + revolutions * 360;
  return new makerjs.paths.Arc(center, size, atStart ? a : a - arcSpan, atStart ? a + arcSpan : a);
}

describe('Fillets', function () {
  it('trims all four line endpoint combinations to an analytic right-angle fillet', function () {
    [false, true].forEach(aStart => [false, true].forEach(bStart => {
      var a = makePath('line', [0, 0], 0, aStart, 10);
      var b = makePath('line', [0, 0], 90, bStart, 10);
      var before = clone([a, b]);
      var f = makerjs.path.fillet(a, b, 2);
      assertFillet(before, [a, b], f, 2, 1e-12);
      assert.ok(distance(f.origin, [2, 2]) < 1e-12);
    }));
  });

  it('supports a radius larger than a short line when the tangent point still fits', function () {
    var a = makePath('line', [0, 0], 0, true, 1);
    var b = makePath('line', [0, 0], 170, false, 1);
    var before = clone([a, b]);
    assertFillet(before, [a, b], makerjs.path.fillet(a, b, 2), 2, 1e-12);
  });

  it('handles nearly parallel lines at both ends of the angular range', function () {
    [.001, .1, 179.9, 179.999].forEach(degrees => {
      var radius = degrees < 90 ? .00001 : 1000;
      var a = makePath('line', [0, 0], 0, false, 10);
      var b = makePath('line', [0, 0], degrees, true, 10);
      var before = clone([a, b]);
      var f = makerjs.path.fillet(a, b, radius);
      assertFillet(before, [a, b], f, radius, 1e-9);
      var trim = radius / Math.tan(degrees * Math.PI / 360);
      assert.ok(distance(f.origin, [trim, radius]) < 1e-8);
    });
  });

  it('rejects a fillet which consumes an arc or has a collapsed inner guide', function () {
    [5, 6, 10, 11].forEach(radius => {
      assertRejected(new makerjs.paths.Arc([0, 0], 10, 0, 90), new makerjs.paths.Line([10, 0], [0, 0]), radius);
    });
  });

  it('preserves path metadata and gives the same fillet when arguments are swapped', function () {
    var a = makePath('arc', [17, -23], 25, false, 40, 270, -2);
    var b = makePath('line', [17, -23], 130, true, 100);
    a.layer = 'cut';
    a.userData = { id: 42 };
    b.layer = 'engrave';
    var before = clone([a, b]), reversed = clone([b, a]);
    var f = makerjs.path.fillet(a, b, 1);
    var g = makerjs.path.fillet(reversed[0], reversed[1], 1);
    assertFillet(before, [a, b], f, 1, 1e-11);
    assertFillet(before.slice().reverse(), reversed, g, 1, 1e-11);
    assert.ok(distance(f.origin, g.origin) < 1e-11);
    assert.ok(distance(ends(f)[0], ends(g)[0]) < 1e-11);
    assert.strictEqual(a.layer, 'cut');
    assert.deepStrictEqual(a.userData, { id: 42 });
    assert.strictEqual(b.layer, 'engrave');
  });

  it('uses pointMatchingDistance, including the default and an exact zero', function () {
    function pair() { return [new makerjs.paths.Line([0, 0], [10, 0]), new makerjs.paths.Line([0, .001], [0, 10])]; }
    [undefined, { pointMatchingDistance: .002 }].forEach(options => {
      var paths = pair(), before = clone(paths);
      assertFillet(before, paths, makerjs.path.fillet(paths[0], paths[1], 1, options), 1, 1e-12);
    });
    [0, .0005].forEach(t => assertRejected(...pair(), 1, { pointMatchingDistance: t }));
    var paths = [new makerjs.paths.Line([0, 0], [10, 0]), new makerjs.paths.Line([0, 0], [0, 10])];
    assert.ok(makerjs.path.fillet(...paths, 1, { pointMatchingDistance: 0 }));
  });

  it('selects the closest join when all endpoints fall inside the matching tolerance', function () {
    var a = new makerjs.paths.Line([.0001, 0], [0, 0]);
    var b = new makerjs.paths.Line([0, 0], [0, .0001]);
    var before = clone([a, b]);
    assertFillet(before, [a, b], makerjs.path.fillet(a, b, .00001), .00001, 1e-15);
  });

  it('rejects a fillet which consumes or passes a line endpoint', function () {
    [1, 1.01, 2, 100].forEach(radius => {
      assertRejected(new makerjs.paths.Line([0, 0], [1, 0]), new makerjs.paths.Line([0, 0], [0, 10]), radius);
    });
  });

  it('rejects disconnected, collinear and tangent paths without mutation', function () {
    var a = new makerjs.paths.Line([0, 0], [10, 0]);
    [new makerjs.paths.Line([20, 0], [20, 10]),
      new makerjs.paths.Line([0, 0], [-10, 0]),
      new makerjs.paths.Line([0, 0], [5, 0]),
      new makerjs.paths.Arc([0, -10], 10, 90, 180)].forEach(b => assertRejected(clone(a), b, 1));
  });

  it('preserves the documented cusp fillets between arcs and between an arc and a line', function () {
    [false, true].forEach(line => [false, true].forEach(swap => {
      var a = new makerjs.paths.Arc([0, 50], 50, 270, 0);
      var b = line ? new makerjs.paths.Line([50, 50], [50, 0]) : new makerjs.paths.Arc([100, 50], 50, 180, 270);
      var paths = swap ? [b, a] : [a, b], before = clone(paths);
      var f = makerjs.path.fillet(paths[0], paths[1], 2);
      assertFillet(before, paths, f, 2, 1e-11);
      assert.ok(distance(f.origin, line ? [48, 30] : [50, 50 - Math.sqrt(204)]) < 1e-11);
    }));
  });

  it('rejects invalid radii and matching tolerances without mutation', function () {
    var a = new makerjs.paths.Line([0, 0], [10, 0]), b = new makerjs.paths.Line([0, 0], [0, 10]);
    [undefined, null, 0, -1, NaN, Infinity, -Infinity, '1'].forEach(r => assertRejected(clone(a), clone(b), r));
    [-1, NaN, Infinity].forEach(t => assertRejected(clone(a), clone(b), 1, { pointMatchingDistance: t }));
    assertRejected(a, a, 1);
  });

  it('rejects unsupported, nonfinite and degenerate paths without throwing', function () {
    var invalid = [null, undefined, {}, new makerjs.paths.Circle([0, 0], 10),
      { type: 'bezier-seed', origin: [0, 0], end: [10, 0], controls: [[5, 1]] },
      new makerjs.paths.Line([0, 0], [0, 0]), new makerjs.paths.Line([0, 0], [Infinity, 0]),
      new makerjs.paths.Line([NaN, 0], [10, 0]), new makerjs.paths.Arc([0, 0], 0, 0, 90),
      new makerjs.paths.Arc([0, 0], -1, 0, 90), new makerjs.paths.Arc([0, 0], Infinity, 0, 90),
      new makerjs.paths.Arc([0, 0], 10, NaN, 90), new makerjs.paths.Arc([0, 0], 10, 0, Infinity),
      new makerjs.paths.Arc([0, 0], 10, 0, 0), new makerjs.paths.Arc([0, 0], 10, 0, 360)];
    invalid.forEach(a => {
      var b = new makerjs.paths.Line([0, 0], [10, 0]);
      assertRejected(a, b, 1);
      assertRejected(b, a, 1);
    });
  });

  it('avoids the folding fillet found on a major arc by the seeded stress test', function () {
    var a = new makerjs.paths.Line([-140.12877756709292, -655.370787645818], [-164.41924936857933, -720.2658384062112]);
    var b = new makerjs.paths.Arc([-169.07033634642136, -660.6537840270322], 29.419787139631808, -322.4799134233036, 10.344883210491265);
    var before = clone([a, b]);
    var f = makerjs.path.fillet(a, b, 25.10584803055972);
    if (f) assertFillet(before, [a, b], f, f.radius, 1e-10);
    else assert.deepStrictEqual([a, b], before);
  });

  it('leaves ill-conditioned arcs unchanged when tangent accuracy cannot be maintained', function () {
    var a = new makerjs.paths.Arc([-5535980.026299062, -5291100.871746648], 7657860.228979131, 763.7043460272253, 822.9875443855208);
    var b = new makerjs.paths.Arc([-10979958361.778435, 36479559877.26404], 38096164826.203705, -791.2097676715003, -433.2487657603603);
    assertRejected(a, b, 1);
  });

  // Reproduce any failure with the seed, case index and complete original inputs
  // printed by the assertion. Increase this environment variable for a longer run.
  var cases = Number(process.env.MAKERJS_FILLET_STRESS_CASES || 3000);
  assert.ok(Number.isInteger(cases) && cases > 0, 'MAKERJS_FILLET_STRESS_CASES must be a positive integer');
  [['line', 'line'], ['line', 'arc'], ['arc', 'arc']].forEach(kinds => {
    [0x51f17e, 0xc0ffee].forEach(seed => {
      [false, true].forEach(large => {
        it('stress tests ' + kinds.join('/') + ', seed=' + seed + ', ' + (large ? 'boundary radii' : 'known fitting radii'), function () {
          var random = randomSource(seed), accepted = 0, rejected = 0;
          for (var i = 0; i < cases; i++) {
            var scale = [1e-6, .001, 1, 1000, 1e6][i % 5];
            var join = polar(random() * 360, random() * 1000 * scale);
            var direction = random() * 360;
            var turn = (15 + random() * 150) * (random() < .5 ? 1 : -1);
            var paths = kinds.map((kind, j) => makePath(kind, join, direction + j * turn,
              random() < .5, (20 + random() * 100) * scale, 20 + random() * 330, Math.floor(random() * 7) - 3));
            var radius = (large ? .1 + random() * 100 : .01 + random() * .04) * scale;
            if (i % 2) paths.reverse();
            var before = clone(paths);
            try {
              var f = makerjs.path.fillet(paths[0], paths[1], radius);
              if (f) {
                assertFillet(before, paths, f, radius, scale * 1e-8);
                accepted++;
              } else {
                assert.ok(large, 'a sufficiently small fillet must fit');
                assert.deepStrictEqual(paths, before, 'failed fillet modified its inputs');
                rejected++;
              }
            } catch (e) {
              e.message += '\n' + JSON.stringify({ seed, caseIndex: i, paths: before, radius });
              throw e;
            }
          }
          assert.ok(accepted > 0);
          if (large) assert.ok(rejected > 0, 'must exercise both successful and rejected fillets');
        });
      });
    });
  });

  [['line', 'arc'], ['arc', 'arc']].forEach(kinds => {
    it('stress tests equal outward tangents for ' + kinds.join('/'), function () {
      var seed = 0xc05f17, random = randomSource(seed);
      for (var i = 0; i < cases; i++) {
        var scale = [1e-6, .001, 1, 1000, 1e6][i % 5];
        var join = polar(random() * 360, random() * 100 * scale);
        var direction = random() * 360;
        var paths = kinds.map((kind, j) => makePath(kind, join, direction, random() < .5,
          (j ? 80 + random() * 40 : 20 + random() * 20) * scale, 90 + random() * 180, Math.floor(random() * 7) - 3));
        if (i % 2) paths.reverse();
        var radius = (.01 + random() * .04) * scale;
        var before = clone(paths);
        try {
          assertFillet(before, paths, makerjs.path.fillet(paths[0], paths[1], radius), radius, scale * 1e-8);
        } catch (e) {
          e.message += '\n' + JSON.stringify({ seed, caseIndex: i, paths: before, radius });
          throw e;
        }
      }
    });

    it('stress tests extreme size ratios for ' + kinds.join('/'), function () {
      var seed = 0xabad1dea, random = randomSource(seed), accepted = 0, rejected = 0;
      for (var i = 0; i < cases; i++) {
        var direction = random() * 360;
        var paths = kinds.map((kind, j) => makePath(kind, [0, 0], direction + j * (.001 + random() * 179.998),
          random() < .5, Math.pow(10, -3 + random() * 15), .01 + random() * 359.98, Math.floor(random() * 7) - 3));
        var before = clone(paths);
        try {
          var f = makerjs.path.fillet(paths[0], paths[1], 1);
          if (f) {
            assertFillet(before, paths, f, 1, 1e-6);
            accepted++;
          } else {
            assert.deepStrictEqual(paths, before);
            rejected++;
          }
        } catch (e) {
          e.message += '\n' + JSON.stringify({ seed, caseIndex: i, paths: before, radius: 1 });
          throw e;
        }
      }
      assert.ok(accepted > 0 && rejected > 0);
    });
  });

  function mixedLoop() {
    return { paths: {
      a: new makerjs.paths.Arc([0, 0], 10, 0, 90),
      b: new makerjs.paths.Line([0, 10], [0, 30]),
      c: new makerjs.paths.Arc([0, 40], 10, 270, 360),
      d: new makerjs.paths.Line([10, 40], [30, 40]),
      e: new makerjs.paths.Arc([40, 40], 10, 180, 270),
      f: new makerjs.paths.Line([40, 30], [40, 10]),
      g: new makerjs.paths.Arc([40, 0], 10, 90, 180),
      h: new makerjs.paths.Line([30, 0], [10, 0])
    } };
  }

  it('fillets a closed mixed Arc/Line chain across nested model origins', function () {
    var loop = mixedLoop();
    Object.keys(loop.paths).forEach((key, i) => {
      var offset = [i * 17, i * -31];
      var p = makerjs.path.clone(loop.paths[key], offset.map(n => -n));
      loop.models = loop.models || {};
      loop.models[key] = { origin: offset, paths: { p } };
    });
    delete loop.paths;
    loop.origin = [1000, -2000];
    var chain = makerjs.model.findSingleChain(loop);
    assert.ok(chain.endless);
    var fillets = makerjs.chain.fillet(chain, 1);
    assert.strictEqual(Object.keys(fillets.paths).length, 8);
    var result = { models: { loop, fillets } };
    var chains = makerjs.model.findChains(result, { pointMatchingDistance: 1e-6 });
    assert.strictEqual(chains.length, 1);
    assert.ok(chains[0].endless);
    assert.strictEqual(chains[0].links.length, 16);
    var svg = makerjs.exporter.toSVG(result), dxf = makerjs.exporter.toDXF(result);
    assert.ok(!/NaN|Infinity/.test(svg + dxf));
    assert.ok(svg.includes('<svg') && dxf.includes('ARC'));
  });

  it('supports directional radii on a mixed chain', function () {
    var loop = mixedLoop();
    loop.paths.b.end = [10, 20];
    loop.paths.b2 = new makerjs.paths.Line([10, 20], [0, 30]);
    var chain = makerjs.model.findSingleChain(loop);
    var fillets = makerjs.chain.fillet(chain, { left: .5, right: 1 });
    var radii = Object.keys(fillets.paths).map(k => fillets.paths[k].radius);
    assert.ok(radii.includes(.5) && radii.includes(1));
    var chains = makerjs.model.findChains({ models: { loop, fillets } });
    assert.strictEqual(chains.length, 1);
    assert.ok(chains[0].endless);
  });

  it('keeps a long open chain connected after sequential Arc/Line fillets', function () {
    var model = { paths: {} }, join = [0, 0], count = 2000;
    for (var i = 0; i < count; i++) {
      var p = makePath(i % 2 ? 'arc' : 'line', join, i % 2 ? 30 : -30, true, 50, 60, 0);
      model.paths['p' + i] = p;
      join = ends(p)[1];
    }
    var chain = makerjs.model.findSingleChain(model);
    assert.strictEqual(chain.links.length, count);
    var fillets = makerjs.chain.fillet(chain, .1);
    assert.strictEqual(Object.keys(fillets.paths).length, count - 1);
    var chains = makerjs.model.findChains({ models: { model, fillets } }, { pointMatchingDistance: 1e-6 });
    assert.strictEqual(chains.length, 1);
    assert.ok(!chains[0].endless);
    assert.strictEqual(chains[0].links.length, count * 2 - 1);
  });

  it('preserves dogbone behavior after changing shared endpoint matching', function () {
    var a = new makerjs.paths.Line([0, 0], [10, 0]), b = new makerjs.paths.Line([0, 0], [0, 10]);
    var f = makerjs.path.dogbone(a, b, 1);
    assert.ok(f && span(f) >= 180);
    assert.ok(distance(f.origin, [Math.SQRT1_2, Math.SQRT1_2]) < 1e-7);
    ends(f).forEach(p => assert.ok(Math.min(distance(p, a.origin), distance(p, b.origin)) < 2e-7));
  });
});
