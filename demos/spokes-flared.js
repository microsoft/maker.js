require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts" />
var makerjs = require('makerjs');
var SpokeWedge = (function () {
    function SpokeWedge(spoke, outerRadius, innerRadius, count) {
        var _this = this;
        this.paths = {};
        var ring = new makerjs.models.Ring(outerRadius, innerRadius);
        //punch the spoke out from the ring
        makerjs.model.combine(ring, spoke, false, true, true, false);
        var punch1 = {
            models: {
                ring: ring,
                spoke: spoke
            }
        };
        //clone the punch and rotate it for one spoke's rotation
        var origin = [0, 0];
        var punch2 = makerjs.model.rotate(makerjs.cloneObject(punch1), 360 / count, origin);
        //combine both punches
        makerjs.model.combine(punch1, punch2, true, false, true, false);
        //we now have a wedge separated from the ring.
        var wedgeAndRing = {
            models: {
                punch1: punch1,
                punch2: punch2
            }
        };
        //to eliminate the ring, we can "discontiguate" it by removing a shape from it, leaving dead ends.
        var corner = [outerRadius, -outerRadius];
        var oneDegree = makerjs.point.rotate(corner, 1, origin);
        var knife = new makerjs.models.ConnectTheDots(true, [origin, corner, oneDegree]);
        //when combined, the dead-ended lines will be removed, leaving only the wedge.
        makerjs.model.combine(wedgeAndRing, knife, false, true, false, false);
        //the wedge is a deep tree of models with many pruned nodes, so flatten it and keep only the needed paths.
        makerjs.model.walkPaths(wedgeAndRing, function (modelContext, pathId, path) {
            var id = makerjs.model.getSimilarPathId(_this, pathId);
            _this.paths[id] = path;
        });
    }
    return SpokeWedge;
})();
module.exports = SpokeWedge;

},{"makerjs":undefined}],"spokes-flared":[function(require,module,exports){
var makerjs = require('makerjs');
var SpokeWedge = require('makerjs-spoke-wedge');

function FlaredSpokes(outerRadius, innerRadius, count, spokeWidth, flareWidth, innerFillet, outerFillet, addRing) {

    var a = 360 / count;
    var halfSpokeWidth = spokeWidth / 2;
    var halfFlareWidth = flareWidth / 2;
    var flareLine = new makerjs.paths.Line([halfFlareWidth, 0], [halfFlareWidth, outerRadius]);
    var outerCircle = new makerjs.paths.Circle([0, 0], outerRadius);
    var int = makerjs.path.intersection(flareLine, outerCircle);
    var flareY = int.intersectionPoints[0][1];
    var points = [
            [halfSpokeWidth, 0], 
            [halfFlareWidth, flareY], 
            [halfFlareWidth, outerRadius + 1], 
            [-halfFlareWidth, outerRadius + 1],
            [-halfFlareWidth, flareY], 
            [-halfSpokeWidth, 0]
        ];
    var spoke = new makerjs.models.ConnectTheDots(true, points);

    var wedge = new SpokeWedge(spoke, outerRadius, innerRadius, count);

    if (innerFillet) {
        var innerFilletArc = makerjs.path.fillet(wedge.paths.ShapeLine1, wedge.paths.ShapeLine5, innerFillet);
        if (innerFilletArc) {
            wedge.paths.innerFillet = innerFilletArc;
        } else {
            wedge.paths.innerFillet1 = makerjs.path.fillet(wedge.paths.ShapeLine1, wedge.paths.Ring_inner, innerFillet);
            wedge.paths.innerFillet2 = makerjs.path.fillet(wedge.paths.ShapeLine5, wedge.paths.Ring_inner, innerFillet);
        }
    }

    if (outerFillet) {
        wedge.paths.outerFillet1 = makerjs.path.fillet(wedge.paths.ShapeLine1, wedge.paths.Ring_outer, outerFillet);
        wedge.paths.outerFillet2 = makerjs.path.fillet(wedge.paths.ShapeLine5, wedge.paths.Ring_outer, outerFillet);
    }

    this.models = {};
    
    for (var i = 0; i < count; i++) {
        var iwedge = makerjs.cloneObject(wedge);
        this.models['wedge' + i] = makerjs.model.rotate(iwedge, i * a, [0, 0]);
    }

    if (addRing) {
        var ringWidth = (spokeWidth + flareWidth) / 2;
        this.models.ring2 = new makerjs.models.Ring(outerRadius + ringWidth, innerRadius - ringWidth);
    }
}

FlaredSpokes.metaParameters = [
    { title: "outer radius", type: "range", min: 2, max: 100, step: 1, value: 100 },
    { title: "inner radius", type: "range", min: 1, max: 90, step: 1, value: 40 },
    { title: "spoke count", type: "range", min: 1, max: 40, step: 1, value: 5 },
    { title: "spoke width", type: "range", min: 1, max: 50, step: 1, value: 9 },
    { title: "flare width", type: "range", min: 1, max: 50, step: 1, value: 40 },
    { title: "inner fillet", type: "range", min: 0, max: 20, step: .1, value: 10 },
    { title: "outer fillet", type: "range", min: 0, max: 20, step: .1, value: 10 },
    { title: "add ring", type: "bool", value: true }
];

module.exports = FlaredSpokes;

},{"makerjs":undefined,"makerjs-spoke-wedge":1}]},{},[]);
