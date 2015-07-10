<<<<<<< HEAD:demos/smile.js
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"smile":[function(require,module,exports){
//https://github.com/danmarshall/makerjs-smile

var makerjs = require('makerjs');

function smile(span, teeth, droop, dainty, gaze, heady) {

    this.id = "smile";

    this.paths = [
        new makerjs.paths.Circle('head', [0, 0], 2.7),
        new makerjs.paths.Circle('rightEye', [1, heady], gaze),
        new makerjs.paths.Circle('leftEye', [-1, heady], gaze)
    ];
=======
var makerjs = require('../target/js/node.maker.js');

function smile(span, teeth, droop, dainty, gaze, heady) {

    this.origin = [3, 3];

    this.paths = {
        head: new makerjs.paths.Circle([0, 0], 2.7),
        rightEye: new makerjs.paths.Circle([1, heady], gaze),
        leftEye: new makerjs.paths.Circle([-1, heady], gaze)
    };
>>>>>>> origin/master:examples/smile.js

    var mouth = new makerjs.models.OvalArc(270 - span, 270 + span, dainty, teeth);
    
    mouth.origin = [0, droop];

    this.models = {
        mouth: mouth
    };
}

smile.metaParameters = [
    { title: "smile span", type: "range", min: 0, max: 90, value: 45 },
    { title: "toothiness", type: "range", min: 0, max: 1, step: 0.05, value: .3 },
    { title: "droopiness", type: "range", min: -1, max: 2, step: 0.1, value: .8 },
    { title: "daintyness", type: "range", min: 0.2, max: 3, step: .1, value: 2 },
    { title: "gazyness", type: "range", min: 0.05, max: 1, step: .05, value: .4 },
    { title: "headyness", type: "range", min: 0.05, max: 2, step: .05, value: .8 }
];

module.exports = smile;

},{"makerjs":undefined}]},{},[]);
