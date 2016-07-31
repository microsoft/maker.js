var makerjs = require('makerjs');

function Text(fontPath, text, fontSize, combine) {

    var _this = this;

    opentype.load('../fonts/' + fontPath, function (err, font) {
        if (!err) {

            var textModel = new makerjs.models.Text(font, text, fontSize, combine);

            _this.models = textModel.models;

            playgroundRender(_this);
        }
    });

}

Text.metaParameters = [
    {
        title: "font", type: "select", value: [
            'stardosstencil/StardosStencil-Bold.ttf',
            'montserratsubrayada/MontserratSubrayada-Regular.ttf'
        ]
    },
    { title: "text", type: "text", value: 'Hello' },
    { title: "font size", type: "range", min: 10, max: 200, value: 72 },
    { title: "combine", type: "bool", value: false }
];

module.exports = Text;
