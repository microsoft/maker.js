var makerjs = require('../target/node.maker.js');

function smile(span, teeth, droop, dainty, gaze, heady) {

    this.id = "smile";

    this.origin = [3, 3];

    this.paths = [
        new makerjs.paths.Circle('head', [0, 0], 2.7),
        new makerjs.paths.Circle('rightEye', [1, heady], gaze),
        new makerjs.paths.Circle('leftEye', [-1, heady], gaze)
    ];

    var mouth = new makerjs.models.OvalArc('mouth', 270 - span, 270 + span, dainty, teeth);
    
    mouth.origin = [0, droop];

    this.models = [
        mouth
    ];
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

//from the root:
//browserify -r ./examples/smile.js:smile > ./debug/browser.smile.js