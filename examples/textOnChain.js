var makerjs = require('makerjs');

function TextOnChain(font, text, fontSize, baseline, reversed, contain, rotate, svgPathData, showPath) {

    var textModel = new makerjs.models.Text(font, text, fontSize);

    var svgPath = makerjs.importer.fromSVGPathData(svgPathData);
    
    var chain = makerjs.model.findSingleChain(svgPath);

    makerjs.layout.childrenOnChain(textModel, chain, baseline, reversed, contain, rotate);

    this.models = {
        text: textModel
    };

    if (showPath) {
        this.models.svgPath = svgPath;
    }
}

TextOnChain.metaParameters = [
    { title: "font", type: "font", value: '*' },
    { title: "text", type: "text", value: 'We go up, then we go down, then up again' },
    { title: "font size", type: "range", min: 1, max: 200, value: 42.5 },
    { title: "baseline", type: "range", min: -1, max: 2, step: 0.1, value: 0.5 },
    { title: "reversed", type: "bool", value: false },
    { title: "contain", type: "bool", value: false },
    { title: "rotate", type: "bool", value: true },
    { title: "svg path data", type: "text", value: 'M 100 200 C 200 100 300 0 400 100 C 500 200 600 300 700 200 C 800 100 900 100 900 100' },
    { title: "show path", type: "bool", value: true },
];

module.exports = TextOnChain;
