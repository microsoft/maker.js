var makerjs = require('makerjs');
var SpokeWedge = require('makerjs-spoke-wedge');

function FlaredSpokes(outerRadius, innerRadius, count, spokeWidth, flareWidth, innerFillet, outerFillet, addRing) {

    var a = 360 / count;
    var halfSpokeWidth = spokeWidth / 2;
    var halfFlareWidth = flareWidth / 2;
    var flareLine = new makerjs.paths.Line([halfFlareWidth, 0], [halfFlareWidth, outerRadius]);
    var outerCircle = new makerjs.paths.Circle([0, 0], outerRadius);
    var int = makerjs.path.intersection(flareLine, outerCircle);
    var flareY = int.intersectionPoints[0][1];
    var points = [
            [halfSpokeWidth, 0], 
            [halfFlareWidth, flareY], 
            [halfFlareWidth, outerRadius + 1], 
            [-halfFlareWidth, outerRadius + 1],
            [-halfFlareWidth, flareY], 
            [-halfSpokeWidth, 0]
        ];
    var spoke = new makerjs.models.ConnectTheDots(true, points);

    var wedge = new SpokeWedge(spoke, outerRadius, innerRadius, count);

    if (innerFillet) {
        var innerFilletArc = makerjs.path.fillet(wedge.paths.ShapeLine1, wedge.paths.ShapeLine5, innerFillet);
        if (innerFilletArc) {
            wedge.paths.innerFillet = innerFilletArc;
        } else {
            wedge.paths.innerFillet1 = makerjs.path.fillet(wedge.paths.ShapeLine1, wedge.paths.Ring_inner, innerFillet);
            wedge.paths.innerFillet2 = makerjs.path.fillet(wedge.paths.ShapeLine5, wedge.paths.Ring_inner, innerFillet);
        }
    }

    if (outerFillet) {
        wedge.paths.outerFillet1 = makerjs.path.fillet(wedge.paths.ShapeLine1, wedge.paths.Ring_outer, outerFillet);
        wedge.paths.outerFillet2 = makerjs.path.fillet(wedge.paths.ShapeLine5, wedge.paths.Ring_outer, outerFillet);
    }

    this.models = {};
    
    for (var i = 0; i < count; i++) {
        var iwedge = makerjs.cloneObject(wedge);
        this.models['wedge' + i] = makerjs.model.rotate(iwedge, i * a, [0, 0]);
    }

    if (addRing) {
        var ringWidth = (spokeWidth + flareWidth) / 2;
        this.models.ring2 = new makerjs.models.Ring(outerRadius + ringWidth, innerRadius - ringWidth);
    }
}

FlaredSpokes.metaParameters = [
    { title: "outer radius", type: "range", min: 2, max: 100, step: 1, value: 100 },
    { title: "inner radius", type: "range", min: 1, max: 90, step: 1, value: 40 },
    { title: "spoke count", type: "range", min: 1, max: 40, step: 1, value: 5 },
    { title: "spoke width", type: "range", min: 1, max: 50, step: 1, value: 9 },
    { title: "flare width", type: "range", min: 1, max: 50, step: 1, value: 40 },
    { title: "inner fillet", type: "range", min: 0, max: 20, step: .1, value: 10 },
    { title: "outer fillet", type: "range", min: 0, max: 20, step: .1, value: 10 },
    { title: "add ring", type: "bool", value: true }
];

module.exports = FlaredSpokes;
