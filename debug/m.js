Viewer.Params = {
    height: { type: "range", min: .2, max: 6, step: .1, value: 1.5 },
    columnSpace: { type: "range", min: .01, max: 4, step: .1, value: .7 },
    columnWidth: { type: "range", min: .01, max: 2, step: .01, value: 0.46 },
    dropHigh: { type: "range", min: 0, max: 1, step: .01, value: 0.65 },
    dropLow: { type: "range", min: 0, max: 1, step: .01, value: 0.3 },
    dropConnect: { type: "range", min: 0, max: 1, step: .01, value: 0.65 },
    innerSerifWidth: { type: "range", min: 0, max: 1, step: .01, value: .5 },
    serifWidth: { type: "range", min: 0, max: 1, step: .01, value: 0.2 },
    serifHeight: { type: "range", min: 0, max: 1, step: .01, value: 0.2 },
};

Viewer.Render = function (params) {

    var columnRef = params.serifWidth + params.columnWidth;
    var halfColumnSpace = params.columnSpace / 2;
    var center = columnRef + halfColumnSpace;
    var serifHeight = params.height / 2 * params.serifHeight;

    var points = [];

    points.push([center, params.height * params.dropHigh]);
    points.push([columnRef, params.height]);
    points.push([0, params.height]);
    points.push([0, params.height - serifHeight]);
    points.push([params.serifWidth, params.height - serifHeight]);
    points.push([params.serifWidth, serifHeight]);
    points.push([0, serifHeight]);
    points.push([0, 0]);
    points.push([params.serifWidth, 0]);
    points.push([columnRef + halfColumnSpace * params.innerSerifWidth, 0]);
    points.push([columnRef + halfColumnSpace * params.innerSerifWidth, serifHeight]);
    points.push([columnRef, serifHeight]);
    points.push([columnRef, serifHeight + (params.height - serifHeight) * params.dropConnect]);
    points.push([center, params.height * params.dropLow]);

    var halfModel = new makerjs.models.ConnectTheDots(false, points);
    var otherHalf = makerjs.model.move(makerjs.model.mirror(halfModel, true, false), [center * 2, 0])

    return {
        origin: { x: .1, y: .1 },
        models: [halfModel, otherHalf]
    };
}