var makerjs = require('makerjs');
var SpokeWedge = require('makerjs-spoke-wedge');

function StraightSpokes(outerRadius, innerRadius, count, spokeWidth, offsetPct, innerFillet, outerFillet, addRing) {

    var a = 360 / count;
    var halfSpokeWidth = spokeWidth / 2;
    var offset = (offsetPct / 100) * (innerRadius - halfSpokeWidth);

    var spoke = new makerjs.models.Rectangle(spokeWidth, outerRadius + 1);
    spoke.origin = [-halfSpokeWidth + offset, 0];
    makerjs.model.originate(spoke);

    var wedge = new SpokeWedge(spoke, outerRadius, innerRadius, count);

    if (innerFillet) {
        var innerFilletArc = makerjs.path.fillet(wedge.paths.ShapeLine2, wedge.paths.ShapeLine4, innerFillet);
        if (innerFilletArc) {
            wedge.paths.innerFillet = innerFilletArc;
        } else {
            wedge.paths.innerFillet1 = makerjs.path.fillet(wedge.paths.ShapeLine2, wedge.paths.Ring_inner, innerFillet);
            wedge.paths.innerFillet2 = makerjs.path.fillet(wedge.paths.ShapeLine4, wedge.paths.Ring_inner, innerFillet);
        }
    }

    if (outerFillet) {
        wedge.paths.outerFillet1 = makerjs.path.fillet(wedge.paths.ShapeLine2, wedge.paths.Ring_outer, outerFillet);
        wedge.paths.outerFillet2 = makerjs.path.fillet(wedge.paths.ShapeLine4, wedge.paths.Ring_outer, outerFillet);
    }

    this.models = {};
    
    for (var i = 0; i < count; i++) {
        var iwedge = makerjs.cloneObject(wedge);
        this.models['wedge' + i] = makerjs.model.rotate(iwedge, i * a, [0, 0]);
    }

    if (addRing) {
        this.models.ring2 = new makerjs.models.Ring(outerRadius + spokeWidth, innerRadius - spokeWidth);
    }
}


StraightSpokes.metaParameters = [
    { title: "outer radius", type: "range", min: 2, max: 100, step: 1, value: 100 },
    { title: "inner radius", type: "range", min: 1, max: 90, step: 1, value: 30 },
    { title: "spoke count", type: "range", min: 1, max: 40, step: 1, value: 10 },
    { title: "spoke width", type: "range", min: 1, max: 10, step: 1, value: 5 },
    { title: "spoke offset percent", type: "range", min: 0, max: 100, step: 1, value: 67 },
    { title: "inner fillet", type: "range", min: 0, max: 20, step: .1, value: 0 },
    { title: "outer fillet", type: "range", min: 0, max: 20, step: .1, value: 0 },
    { title: "add ring", type: "bool", value: true }
];

module.exports = StraightSpokes;
