var makerjs = require('makerjs');
var computeLayout = require('opentype-layout');

function wrapText(font, text, fontSize, width, align, lineHeight) {

    //sample from https://github.com/Jam3/opentype-layout
    var scale = 1 / font.unitsPerEm * fontSize;
    var layoutOptions = {
        align,
        lineHeight: lineHeight * font.unitsPerEm,
        width: width / scale
    };

    var layout = computeLayout(font, text, layoutOptions);

    layout.glyphs.forEach((glyph, i) => {
        var character = makerjs.models.Text.glyphToModel(glyph.data, fontSize);
        character.origin = makerjs.point.scale(glyph.position, scale);
        makerjs.model.addModel(this, character, i);
    });

}

wrapText.metaParameters = [
    { title: "font", type: "font", value: "*" },
    { title: "text", type: "text", value: "Hello World! This box should start word-wrapping!" },
    { title: "font size", type: "range", min: 10, max: 200, value: 72 },
    { title: "width", type: "range", min: 100, max: 1000, value: 500 },
    { title: "align", type: "select", value: ["left", "right"] },
    { title: "line height", type: "range", min: .25, max: 4, value: 1.175, step: 0.25 }
];

module.exports = wrapText;
