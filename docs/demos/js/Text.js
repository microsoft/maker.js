var makerjs = require('makerjs');

function TextDemo(font, text, fontSize, combine, center) {
    this.models = {
        text: new makerjs.models.Text(font, text, fontSize, combine, center)
    };
}

TextDemo.metaParameters = [
    { title: "font", type: "font", value: '*' },
    { title: "text", type: "text", value: 'Hello' },
    { title: "font size", type: "range", min: 10, max: 200, value: 72 },
    { title: "combine", type: "bool", value: false },
    { title: "center character origin", type: "bool", value: false }
];

module.exports = TextDemo;