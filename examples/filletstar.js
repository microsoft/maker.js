var makerjs = require('./../target/js/node.maker.js');

function filletstar(numberOfPoints, filletOutsideRadius, filletInsideRadius, innerRadiusPct, skip) {
    var radius = 100;

    var star = new makerjs.models.Star(numberOfPoints, radius, radius * innerRadiusPct / 100, skip);

    this.models = { star: star };

    var paths = this.paths = {};

    function doFillet(id1, id2, isAlternate) {
        var fillet;
        if (isAlternate) {
            //fillet = makerjs.path.dogbone(star.paths[id1], star.paths[id2], filletInsideRadius);
            fillet = makerjs.path.fillet(star.paths[id1], star.paths[id2], filletInsideRadius);
        } else {
            fillet = makerjs.path.fillet(star.paths[id1], star.paths[id2], filletOutsideRadius);
        }
        paths[id1] = fillet;
    }

    var isAlternate = false;

    var firstId = null;
    var prevId = null;
    for (var id in star.paths) {
        if (!firstId) {
            firstId = id;
        }
        if (prevId) {
            doFillet(prevId, id, isAlternate);
        }
        prevId = id;
        isAlternate = !isAlternate;
    }
    doFillet(id, firstId, isAlternate);

}

filletstar.metaParameters = [
    { title: "number of points", type: "range", min: 3, max: 50, value: 32 },
    { title: "fillet outside radius", type: "range", min: 0, max: 20, step: 0.1, value: 2.7 },
    { title: "fillet inside radius", type: "range", min: 0, max: 20, step: 0.1, value: 2.7 },
    { title: "inner radius", type: "range", min: 0, max: 100, value: 52 },
    { title: "skip", type: "range", min: 2, max: 12, value: 2 },
];

module.exports = filletstar;
