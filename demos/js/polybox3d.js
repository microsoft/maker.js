var makerjs = require('makerjs');
var P = require('makerjs-polygon-rimbox');

function polybox3d(sides, radius, holeRadius, rim, z) {
    this.models = {
        bottom: new P(sides, radius, holeRadius, rim, true),
        side: new P(sides, radius, holeRadius - 1, rim + 1),
        lid: new P(sides, radius, holeRadius, rim, true)
    };

    var d = 2 * (radius + holeRadius + rim + 1);

    this.models.lid.origin = [-d, 0];

    delete this.models.bottom.models.bolts;

    this.models.bottom.layer = "bottom";
    this.models.side.layer = "side";
    this.models.lid.layer = "lid";

    this.exporterOptions = {
        toJscadCSG: {
            layerOptions: {
                bottom: { extrude: 1 },
                side: { extrude: z },
                lid: { extrude: rim }
            }
        }
    };

}

polybox3d.metaParameters = [
    { title: "sides", type: "range", min: 3, max: 25, value: 6 },
    { title: "radius", type: "range", min: 10, max: 500, value: 50 },
    { title: "hole radius", type: "range", min: 1, max: 20, value: 3 },
    { title: "rim thickness", type: "range", min: 1, max: 20, value: 2 },
    { title: "z depth", type: "range", min: 2, max: 200, value: 50 }
];

polybox3d.notes = '# This model is 3D enabled!\nDownload the **STL** file to see the generated 3D model. You will need an STL viewer app on your machine. Or, you can generate the **OpenJsCad** code, and paste it into the page at [OpenJsCad.org](http://openjscad.org)';

module.exports = polybox3d;
