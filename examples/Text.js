var makerjs = require('makerjs');

function Text(fontPath, text, fontSize, combine) {

    var _this = this;

    //load a font asynchronously
    opentype.load('/maker.js/fonts/' + fontPath, function (err, font) {
        if (!err) {

            var textModel = new makerjs.models.Text(font, text, fontSize, combine);

            _this.models = textModel.models;

            //"playgroundRender" is strictly a Playground function - in your app, call your own callback.
            playgroundRender(_this);
        }
    });

}

Text.metaParameters = [
    {
        title: "font", type: "select", value: [
            'allertastencil/AllertaStencil-Regular.ttf',
            'blackopsone/BlackOpsOne-Regular.ttf',
            'emblemaone/EmblemaOne-Regular.ttf',
            'keaniaone/KeaniaOne-Regular.ttf',
            'montserratsubrayada/MontserratSubrayada-Regular.ttf',
            'plaster/Plaster-Regular.ttf',
            'sirinstencil/SirinStencil-Regular.ttf',
            'stardosstencil/StardosStencil-Bold.ttf',
            'stardosstencil/StardosStencil-Regular.ttf',
            'wallpoet/Wallpoet-Regular.ttf'
        ]
    },
    { title: "text", type: "text", value: 'Hello' },
    { title: "font size", type: "range", min: 10, max: 200, value: 72 },
    { title: "combine", type: "bool", value: false }
];

module.exports = Text;
