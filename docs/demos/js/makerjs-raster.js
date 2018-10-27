///<reference path="node_modules/makerjs/dist/index.d.ts" />
var makerjs = require('makerjs');
var Raster = /** @class */ (function () {
    function Raster(modelToRasterize, margin, offset) {
        if (offset === void 0) { offset = 0; }
        var measurement = makerjs.measure.modelExtents(modelToRasterize);
        var line = new makerjs.paths.Line([-1, 0], [measurement.width + 1, 0]);
        var count = measurement.height / margin + 1;
        var lines = makerjs.layout.cloneToColumn(line, count, margin);
        this.paths = lines.paths;
        this.origin = measurement.low;
        if (offset) {
            makerjs.model.moveRelative(this, [0, offset]);
        }
        var clone = makerjs.cloneObject(modelToRasterize);
        makerjs.model.combine(clone, this, true, true, true, false);
    }
    return Raster;
}());
module.exports = Raster;
