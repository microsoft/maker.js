///<reference path="typings/tsd.d.ts"/>
//https://github.com/danmarshall/makerjs-ventgrid
var makerjs = require('makerjs');
var Ventgrid = (function () {
    function Ventgrid(filterRadius, spacing, width, height) {
        var _this = this;
        this.filterRadius = filterRadius;
        this.spacing = spacing;
        this.width = width;
        this.height = height;
        this.units = makerjs.unitType.Millimeter;
        this.paths = {};
        var alternate = false;
        var xDistance = 2 * filterRadius * (1 + spacing / 100);
        var countX = Math.ceil(width / xDistance);
        var yDistance = makerjs.solvers.solveTriangleASA(60, xDistance / 2, 90);
        var countY = Math.ceil(height / yDistance) + 1;
        function checkBoundary(x, y) {
            return y - filterRadius < height && x - filterRadius < width;
        }
        var row = function (iy) {
            var total = countX;
            if (!alternate) {
                total++;
            }
            for (var i = 0; i < total; i++) {
                var x = i * xDistance;
                var y = iy * yDistance;
                if (alternate) {
                    x += xDistance / 2;
                }
                if (checkBoundary(Math.abs(x), Math.abs(y))) {
                    var id = 'filter_' + i + '_' + iy;
                    _this.paths[id] = new makerjs.paths.Circle([x, y], filterRadius);
                    if (alternate || (!alternate && i > 0)) {
                        _this.paths[id + '_alt'] = new makerjs.paths.Circle([-x, y], filterRadius);
                    }
                }
            }
        };
        for (var i = 0; i < countY; i++) {
            row(i);
            if (i > 0) {
                row(-i);
            }
            alternate = !alternate;
        }
    }
    return Ventgrid;
})();
Ventgrid.metaParameters = [
    { title: "filterRadius", type: "range", min: 1, max: 20, value: 2 },
    { title: "spacing", type: "range", min: 10, max: 100, value: 49 },
    { title: "width", type: "range", min: 20, max: 200, value: 37 },
    { title: "height", type: "range", min: 20, max: 200, value: 50 },
];
module.exports = Ventgrid;
