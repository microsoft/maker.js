var makerjs = require('makerjs');

function Nameplate(font, text, fontSize, fontMargin, boltMargin, boltRadius, rounded) {

    //generate the text using a font
    var textModel = new makerjs.models.Text(font, text, fontSize);
    
    //move text to [0, 0]
    makerjs.model.zero(textModel);

    //measure the text
    var measure = makerjs.measure.modelExtents(textModel);

    //create a bolt rectangle larger than the text
    var bolts = new makerjs.models.BoltRectangle(measure.high[0] + fontMargin, measure.high[1] + fontMargin, boltRadius);

    //center the text and the bolts
    makerjs.model.center(textModel);
    makerjs.model.center(bolts);

    //make a rectangle around the bolts
    var Rect = rounded ? makerjs.models.RoundRectangle : makerjs.models.Rectangle;
    var rect = new Rect(bolts, boltMargin);

    //save all of these in the model
    this.models = {
        text: textModel,
        rect: rect,
        bolts: bolts
    };

    //move everything to [0, 0]
    makerjs.model.zero(this);
}

module.exports = Nameplate;
