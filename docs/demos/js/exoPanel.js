var makerjs = require('makerjs');

function exoPanel(width, height, holeRadius, rim, fillet) {

  var domeRadius = rim + holeRadius;

  makerjs.$(new makerjs.models.Dome(2 * domeRadius, 2 * domeRadius, domeRadius))
    .moveRelative([0, - domeRadius])
    .rotate(135)
    .addTo(this, 'dome1')
    .clone()
    .rotate(90)
    .addTo(this, 'dome2')
    .moveRelative([width, 0])
    .$reset()
    .clone()
    .rotate(270)
    .addTo(this, 'dome3')
    .moveRelative([0, height])
    .$reset()
    .clone()
    .rotate(180)
    .addTo(this, 'dome4')
    .moveRelative([width, height])
    ;

  var outer = new makerjs.models.Rectangle(width, height);

  makerjs.model.combineUnion(this, outer);

  this.models.outer = outer;

  var c = makerjs.model.findSingleChain(this);
  var fillets = makerjs.chain.fillet(c, fillet);
  this.models.fillets = fillets;

  this.models.bolts = new makerjs.models.BoltRectangle(width, height, holeRadius);
}

exoPanel.metaParameters = [
  { title: "width", type: "range", min: 1, max: 200, value: 50 },
  { title: "height", type: "range", min: 1, max: 100, value: 30 },
  { title: "hole radius", type: "range", min: 0, max: 10, value: 3 },
  { title: "rim", type: "range", min: 1, max: 20, value: 2 },
  { title: "fillet", type: "range", min: 0, max: 10, value: 5 }
];

module.exports = exoPanel;