var makerjs = require('makerjs');
var P = require('makerjs-polygon-rimbox');

function polybox3d(sides, radius, holeRadius, rim) {
    this.models = {
        bottom: new P(sides, radius, holeRadius, rim, true),
        side: new P(sides, radius, holeRadius - 1, rim + 1),
        lid: new P(sides, radius, holeRadius, rim, true)
    };

    var d = 2 * (radius + holeRadius + rim + 1);

    this.models.lid.origin = [-d, 0];

    delete this.models.bottom.models.bolts;

    this.zBottom = 1;
    this.zLid = rim;
    this.zSides = 2 * radius;

    this.exporterOptions = {
        toOpenJsCad: {
            modelMap: {
                bottom: { extrusion: 1 },
                side: { extrusion: 2 * radius },
                lid: { extrusion: rim }
            }
        }
    };

}

polybox3d.metaParameters = [
    { title: "sides", type: "range", min: 3, max: 25, value: 6 },
    { title: "radius", type: "range", min: 10, max: 500, value: 50 },
    { title: "hole radius", type: "range", min: 1, max: 20, value: 3 },
    { title: "rim thickness", type: "range", min: 1, max: 20, value: 2 }
];

module.exports = polybox3d;
