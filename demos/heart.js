require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"heart":[function(require,module,exports){
var makerjs = require('makerjs');

function Heart(r, a2) {

    var a = a2 / 2;

    var a_radians = makerjs.angle.toRadians(a);

    var x = Math.cos(a_radians) * r;
    var y = Math.sin(a_radians) * r;

    var z = makerjs.solvers.solveTriangleASA(90, 2 * r, 90 - a);

    this.paths = {
        arc1: new makerjs.paths.Arc([x , 0], r, -a, 180 - a),
        line1: new makerjs.paths.Line([x * 2, -y], [0, -z + y])
    };

    this.paths.arc2 = makerjs.path.mirror(this.paths.arc1, true, false);
    this.paths.line2 = makerjs.path.mirror(this.paths.line1, true, false);
}

Heart.metaParameters = [
    { title: "radius", type: "range", min: .01, max: 100, step: 1, value: 10 },
    { title: "angle", type: "range", min: 60, max: 120, step: 1, value: 90 }
];

module.exports = Heart;

},{"makerjs":undefined}]},{},[]);
