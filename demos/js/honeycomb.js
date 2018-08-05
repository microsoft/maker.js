var m = require("makerjs");

function Honeycomb(hexWidth, margin, xcount, ycount) {

  var hex = new m.models.Polygon(6, hexWidth / 2, 30, true);

  this.models = {
    honeycomb: m.layout.cloneToHoneycomb(hex, xcount, ycount, margin)
  };

}

Honeycomb.metaParameters = [
  { title: 'hexWidth', type: 'range', min: 1, max: 100, value: 20 },
  { title: 'margin', type: 'range', min: 0, max: 100, value: 3 },
  { title: 'x count', type: 'range', min: 1, max: 50, value: 7 },
  { title: 'y count', type: 'range', min: 1, max: 50, value: 7 }
];

module.exports = Honeycomb;
