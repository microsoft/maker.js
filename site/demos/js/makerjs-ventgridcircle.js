///<reference path="typings/tsd.d.ts"/>
//https://github.com/danmarshall/makerjs-ventgridcircle
var makerjs = require('makerjs');
var ventgrid = require('makerjs-ventgrid');
var VentgridCircle = (function () {
    function VentgridCircle(filterRadius, spacing, radius) {
        this.filterRadius = filterRadius;
        this.spacing = spacing;
        this.radius = radius;
        this.id = 'ventgridcircleInstance';
        this.units = makerjs.unitType.Millimeter;
        this.paths = {};
        this.rim = new makerjs.paths.Circle([0, 0], radius);
        var ventgridInstance = new ventgrid(filterRadius, spacing, radius, radius);
        for (var id in ventgridInstance.paths) {
            var circle = ventgridInstance.paths[id];
            this.checkCircle(id, circle);
        }
    }
    VentgridCircle.prototype.checkCircle = function (id, circle) {
        var distanceToCenter = makerjs.measure.pointDistance([0, 0], circle.origin);
        if (makerjs.round(distanceToCenter + circle.radius) <= this.radius) {
            //inside
            this.paths[id] = circle;
        }
        else if (makerjs.round(distanceToCenter - circle.radius) > this.radius) {
        }
        else {
            //border
            var arcIntersection = makerjs.path.intersection(circle, this.rim);
            if (arcIntersection && arcIntersection.path1Angles.length == 2) {
                var filterArc = new makerjs.paths.Arc(circle.origin, circle.radius, arcIntersection.path1Angles[1], arcIntersection.path1Angles[0]);
                this.paths[id] = filterArc;
                var rimArc = new makerjs.paths.Arc([0, 0], this.radius, arcIntersection.path2Angles[0], arcIntersection.path2Angles[1]);
                this.paths[id + '_rim'] = rimArc;
            }
        }
    };
    return VentgridCircle;
})();
VentgridCircle.metaParameters = [
    { title: "filterRadius", type: "range", min: 1, max: 20, value: 6 },
    { title: "spacing", type: "range", min: 10, max: 100, value: 30 },
    { title: "radius", type: "range", min: 20, max: 200, value: 100 }
];
module.exports = VentgridCircle;
