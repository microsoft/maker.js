var makerjs = require('makerjs');
var Smile = require('makerjs-smile');
var Raster = require('makerjs-raster');

function RasterSmile(margin) {

    var smile = new Smile();
    var raster = new Raster(smile, margin, 0.25);

    this.models = {
        //smile,    //uncomment to see smile outline
        raster
    };
}

RasterSmile.metaParameters = [
    { title: "raster", type: "range", min: 0.5, max: 10, step: .5, value: 1 },
];

module.exports = RasterSmile;
