var m = require("makerjs");

function TongueAndGroove(count, tongueWidth, grooveWidth, grooveDepth, radius, style) {

  //Tongue and grooves for a box joint
  var groove = new m.models.Dogbone(grooveWidth, grooveDepth, radius, style, true);

  groove.paths.leftTongue = new m.paths.Line([-tongueWidth / 2, 0], [0, 0]);
  groove.paths.rightTongue = new m.paths.Line([grooveWidth, 0], [grooveWidth + tongueWidth / 2, 0]);

  this.models = {
    tng: m.layout.cloneToRow(groove, count)
  };

  this.origin = [tongueWidth / 2, 0];
}

TongueAndGroove.metaParameters = [
  { title: 'count', type: 'range', min: 1, max: 100, value: 3 },
  { title: 'tongueWidth', type: 'range', min: 1, max: 100, value: 60 },
  { title: 'grooveWidth', type: 'range', min: 10, max: 100, value: 50 },
  { title: 'grooveDepth', type: 'range', min: 1, max: 100, value: 30 },
  { title: 'radius', type: 'range', min: 0, max: 20, value: 5 },
  { title: 'corner style', type: 'select', value: [0, -1, 1] }
];

module.exports = TongueAndGroove;
