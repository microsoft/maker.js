var makerjs = require('./../target/js/node.maker.js');

function M(height, columnSpace, columnWidth, dropHigh, dropLow, dropConnect, innerSerifWidth, serifWidth, serifHeight) {

    var columnRef = serifWidth + columnWidth;
    var halfColumnSpace = columnSpace / 2;
    var center = columnRef + halfColumnSpace;
    var serifH = Math.min(height / 2, serifHeight);

    var points = [];

    points.push([center, height * dropHigh]);
    points.push([columnRef, height]);
    points.push([0, height]);
    points.push([0, height - serifH]);
    points.push([serifWidth, height - serifH]);
    points.push([serifWidth, serifH]);
    points.push([0, serifH]);
    points.push([0, 0]);
    points.push([columnRef + halfColumnSpace * innerSerifWidth, 0]);
    points.push([columnRef + halfColumnSpace * innerSerifWidth, serifH]);
    points.push([columnRef, serifH]);
    points.push([columnRef, serifH + (height - serifH) * dropConnect]);
    points.push([center, height * dropLow]);

    var halfModel = new makerjs.models.ConnectTheDots(false, points);
    var otherHalf = makerjs.model.move(makerjs.model.mirror(halfModel, true, false), [center * 2, 0])

    this.units = makerjs.unitType.Inch;
    this.models = [halfModel, otherHalf];
}

M.metaParameters = [
    { title: "height", type: "range", min: .2, max: 6, step: .1, value: 1.5 },
    { title: "columnSpace", type: "range", min: .01, max: 4, step: .1, value: .7 },
    { title: "columnWidth", type: "range", min: .01, max: 2, step: .01, value: 0.46 },
    { title: "dropHigh", type: "range", min: 0, max: 1, step: .01, value: 0.65 },
    { title: "dropLow", type: "range", min: 0, max: 1, step: .01, value: 0.3 },
    { title: "dropConnect", type: "range", min: 0, max: 1, step: .01, value: 0.65 },
    { title: "innerSerifWidth", type: "range", min: 0, max: 1, step: .01, value: .5 },
    { title: "serifWidth", type: "range", min: 0, max: 1, step: .01, value: 0.2 },
    { title: "serifHeight", type: "range", min: 0, max: 2, step: .01, value: 0.2 },
];

module.exports = M;
