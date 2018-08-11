var m = require('makerjs');

function ArchBridge(width, height, count, side, topRim, bottomRim, drop, baluster) {

  var span = width - 2 * side;
  var balusters = count - 1;
  var open = span - balusters * baluster;
  var archWidth = open / count;

  this.paths = {
    bottom: new m.paths.Arc([width - side, 0], [width / 2, (height - bottomRim) * drop], [side, 0])
  };

  this.models = {
    rect: new m.models.ConnectTheDots(false, [[side, 0], [0, 0], [0, height], [width, height], [width, 0], [width - side, 0]]),
    rimBottom: {
      paths: {
        bottom: new m.paths.Circle(this.paths.bottom.origin, this.paths.bottom.radius + bottomRim)
      }
    },
    arches: {
      models: {}
    }
  };

  for (var i = 0; i < count; i++) {
    var p = [side + archWidth / 2 + i * (archWidth + baluster), 0];
    this.models.arches.models['arch' + i] = m.model.move(new m.models.Dome(archWidth, height - topRim, archWidth / 2), p);
  }

  m.model.combineSubtraction(this.models.arches, this.models.rimBottom);

  this.origin = [-width / 2, 0];
}

ArchBridge.metaParameters = [
  { title: "width", type: "range", min: 10, max: 500, value: 300 },
  { title: "height", type: "range", min: 10, max: 500, value: 125 },
  { title: "count", type: "range", min: 2, max: 40, value: 15 },
  { title: "side", type: "range", min: 0, max: 20, value: 13 },
  { title: "top rim", type: "range", min: 0.1, max: 20, value: 12 },
  { title: "bottom rim", type: "range", min: 0.1, max: 20, value: 7 },
  { title: "drop", type: "range", min: 0.1, max: 1, value: 0.8, step: 0.1 },
  { title: "baluster", type: "range", min: 0.1, max: 20, value: 4, step: 0.1 }
];

module.exports = ArchBridge;
