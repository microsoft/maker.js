var makerjs = require('makerjs');
var WindowArch = require('./window-arch');

function WindowArchGrid(width, height, rows, columns, extra, split, spacing, fillet, outerFrame, outerFrameWidth) {
    var column = (width - (columns - 1) * spacing) / columns;
    var row = (height - (rows) * spacing + spacing / 2) / rows;
    var cell = new makerjs.models.RoundRectangle(column, row, fillet);
    var grid = makerjs.layout.cloneToGrid(cell, columns, rows, spacing);

    makerjs.model.center(grid, true, false);
    grid.origin[1] = -height;

    this.models = {
        arch: new WindowArch(width, columns, extra, split, spacing, fillet),
        grid: grid
    };

    if (outerFrame) {
        var frame = new makerjs.models.Dome(width + 2 * outerFrameWidth, height + width / 2 + 2 * outerFrameWidth);
        frame.origin = [0, -height - outerFrameWidth];
        this.models.frame = frame;
    }
}

WindowArchGrid.metaParameters = [
    { title: "width", type: "range", min: 12, max: 500, value: 200 },
    { title: "grid height", type: "range", min: 12, max: 500, value: 200 },
    { title: "rows", type: "range", min: 1, max: 10, value: 4 },
    { title: "columns", type: "range", min: 1, max: 10, value: 6 },
    { title: "extra wedge", type: "bool", value: false },
    { title: "split central dome on even columns", type: "bool", value: false },
    { title: "spacing", type: "range", min: 0.5, max: 10, value: 2, step: 0.5 },
    { title: "fillet", type: "range", min: 0, max: 10, value: 1, step: 0.5 },
    { title: "outer frame", type: "bool", value: true },
    { title: "outer frame width", type: "range", min: 1, max: 20, value: 6 }
];

module.exports = WindowArchGrid;
