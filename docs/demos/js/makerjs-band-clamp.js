var makerjs = require('makerjs');
var HalfBandClamp = require('makerjs-half-band-clamp');

function BandClamp(radius, band, tabWidth, tabHeight, gap, angle, roundFillet, capFillet) {

    var half = new HalfBandClamp(radius, band, tabWidth, tabHeight, gap);

    function tryFillet(fName, pName1, pName2, value) {
        var fillet = makerjs.path.fillet(half.paths[pName1], half.paths[pName2], value);
        if (fillet) {
            half.paths[fName] = fillet;
        }
    }

    tryFillet('innerFillet', 'bandInner', 'tabInner', roundFillet);
    tryFillet('outerFillet', 'bandOuter', 'tabOuter', roundFillet);

    tryFillet('tabInnerFillet', 'tabInner', 'tabCap', capFillet);
    tryFillet('tabOuterFillet', 'tabOuter', 'tabCap', capFillet);

    makerjs.model.rotate(half, angle / 2);

    this.models = {
        top: half,
        bottom: makerjs.model.mirror(half, false, true)
    };

    makerjs.model.combine(this.models.top, this.models.bottom);
}

BandClamp.metaParameters = [
    { title: "radius", type: "range", min: 2, max: 100, step: 1, value: 12.7 },
    { title: "band", type: "range", min: 1, max: 50, step: 1, value: 3 },
    { title: "tab width", type: "range", min: 1, max: 100, step: 1, value: 14 },
    { title: "tab height", type: "range", min: 1, max: 150, step: 1, value: 8 },
    { title: "gap", type: "range", min: 1, max: 100, step: 1, value: 3 },
    { title: "angle", type: "range", min: 0, max: 45, step: 1, value: 5 },
    { title: "round fillet", type: "range", min: 0, max: 10, step: .1, value: 2 },
    { title: "cap fillet", type: "range", min: 0, max: 10, step: .1, value: .7 },
];

module.exports = BandClamp;
