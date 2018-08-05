var makerjs = require('makerjs');
var _nameplate = require('makerjs-nameplate');

function Nameplate(fontPath, text, fontSize, fontMargin, boltMargin, boltRadius, rounded) {

    var _this = this;

    if (makerjs.environment == makerjs.environmentTypes.NodeJs) {

        (function () {
            var opentype = require('opentype.js');
            var font = opentype.loadSync('./fonts/' + fontPath);

            //use the models from makerjs-nameplate
            _this.models = new _nameplate(font, text, fontSize, fontMargin, boltMargin, boltRadius, rounded).models;
        })();

    } else {

        //load a font asynchronously
        opentype.load('/fonts/' + fontPath, function (err, font) {
            if (!err) {

                //use the models from makerjs-nameplate
                _this.models = new _nameplate(font, text, fontSize, fontMargin, boltMargin, boltRadius, rounded).models;

                //"playgroundRender" is strictly a Playground function - in your app, call your own callback.
                playgroundRender(_this);
            }
        });
    }
}

Nameplate.metaParameters = [
    {
        title: "font", type: "select", value: [
            'allertastencil/AllertaStencil-Regular.ttf',
            'blackopsone/BlackOpsOne-Regular.ttf',
            'emblemaone/EmblemaOne-Regular.ttf',
            'keaniaone/KeaniaOne-Regular.ttf',
            'plaster/Plaster-Regular.ttf',
            'sirinstencil/SirinStencil-Regular.ttf',
            'stardosstencil/StardosStencil-Bold.ttf',
            'stardosstencil/StardosStencil-Regular.ttf',
            'wallpoet/Wallpoet-Regular.ttf'
        ]
    },
    { title: "text", type: "text", value: 'Hello' },
    { title: "font size", type: "range", min: 10, max: 200, value: 72 },
    { title: "font margin", type: "range", min: 1, max: 50, value: 10 },
    { title: "bolt margin", type: "range", min: 1, max: 50, value: 10 },
    { title: "bolt radius", type: "range", min: .1, max: 10, value: 3, step: .1 },
    { title: "rounded", type: "bool", value: true }
];

module.exports = Nameplate;
