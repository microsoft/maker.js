var m = require("makerjs");

function FishScales(radius, sweep, xcount, ycount, expand, expansion) {

  var s2 = sweep / 2;
  var arc = new m.paths.Arc([0, 0], radius, 90 - s2, 90 + s2);

  this.models = {
    scales: m.layout.cloneToBrick(arc, xcount, ycount)
  };

  if (expand) {
    this.models.scales = m.model.expandPaths(this, expansion);
  }

}

FishScales.metaParameters = [
  { title: 'arc radius', type: 'range', min: 1, max: 100, value: 50 },
  { title: 'arc sweep', type: 'range', min: 40, max: 200, value: 180 },
  { title: 'x count', type: 'range', min: 1, max: 20, value: 4 },
  { title: 'y count', type: 'range', min: 1, max: 20, value: 10 },
  { title: 'expand', type: 'bool', value: true },
  { title: 'expansion', type: 'range', min: 1, max: 10, value: 5 }
];

module.exports = FishScales;
