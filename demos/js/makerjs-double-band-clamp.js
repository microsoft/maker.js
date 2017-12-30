var makerjs = require('makerjs');
var HalfBandClamp = require('makerjs-half-band-clamp');

function DoubleBandClamp(radius1, radius2, band, tabWidth, tabHeight, gap, roundFillet, capFillet, betweenFillet) {

    function tryFillet(half, fName, pName1, pName2, value) {
        var fillet = makerjs.path.fillet(half.paths[pName1], half.paths[pName2], value);
        if (fillet) {
            half.paths[fName] = fillet;
        }
    }

    function filletAll(half) {
        if (gap) {
            tryFillet(half, 'innerFillet', 'bandInner', 'tabInner', roundFillet);
        }
        tryFillet(half, 'outerFillet', 'bandOuter', 'tabOuter', roundFillet);

        tryFillet(half, 'tabInnerFillet', 'tabInner', 'tabCap', capFillet);
        tryFillet(half, 'tabOuterFillet', 'tabOuter', 'tabCap', capFillet);
    }

    var right = makerjs.model.zero(new HalfBandClamp(radius1, band, tabWidth, tabHeight, gap));
    filletAll(right);

    var left = makerjs.model.mirror(makerjs.model.zero(new HalfBandClamp(radius2, band, tabWidth, tabHeight, gap)), true, false);
    filletAll(left);

    this.models = {
        right: right,
        left: left
    };

    makerjs.model.originate(this);

    var filletBetween = makerjs.path.fillet(right.paths['bandOuter'], left.paths['bandOuter'], betweenFillet);

    this.paths = {
        filletBetween: filletBetween
    };

}

DoubleBandClamp.metaParameters = [
    { title: "radius1", type: "range", min: 2, max: 100, step: 1, value: 12.7 },
    { title: "radius2", type: "range", min: 2, max: 100, step: 1, value: 25.4 },
    { title: "band", type: "range", min: 1, max: 20, step: 0.5, value: 3 },
    { title: "tab width", type: "range", min: 1, max: 25, value: 14 },
    { title: "tab height", type: "range", min: 1, max: 10, step: 1, value: 6 },
    { title: "gap", type: "range", min: 0, max: 5, step: 0.5, value: 0 },
    { title: "round fillet", type: "range", min: 0, max: 10, step: 0.1, value: 2 },
    { title: "cap fillet", type: "range", min: 0, max: 10, step: 0.1, value: 0.7 },
    { title: "between fillet", type: "range", min: 1, max: 10, step: 0.1, value: 5 }
];

module.exports = DoubleBandClamp;
