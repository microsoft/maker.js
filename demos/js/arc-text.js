var makerjs = require('makerjs');

function ArcText(font, text, fontSize, arcRadius, startAngle, endAngle, onTop, showCircle) {

    var arc = new makerjs.paths.Arc([0, 0], arcRadius, startAngle, endAngle);

    //generate the text using a font
    var textModel = new makerjs.models.Text(font, text, fontSize, false, true);

    //save all of these in the model
    this.models = {
        text: textModel,
    };

    //measure height of the text from the baseline
    var measure = makerjs.measure.modelExtents(textModel);
    var height = measure.high[1];
    var h2 = height / 2;
    var left = measure.low[0];
    var right = measure.high[0];
    var textWidth = right - left;

    if (showCircle) {
        this.paths = { 
            arc: arc,
            circleT: new makerjs.paths.Circle(arcRadius + h2),
            circleB: new makerjs.paths.Circle(arcRadius - h2)
        };
    }

    //move each character to a percentage of the total arc
    var span = makerjs.angle.ofArcSpan(arc);
    for (var i = 0; i < text.length; i++) {
        var char = textModel.models[i];

        //get the x distance of each character as a percentage
        var distFromFirst = char.origin[0] - left;
        var center = distFromFirst / textWidth;

        //set a new origin at the center of the text
        var o = makerjs.point.add(char.origin, [0, h2]);
        makerjs.model.originate(char, o);

        //project the character x position into an angle
        var angle = center * span;
        var angleFromEnd = onTop ? endAngle - angle : startAngle + angle;
        var p = makerjs.point.fromAngleOnCircle(angleFromEnd, arc);
        char.origin = p;

        //rotate the char to 90 from tangent
        makerjs.model.rotate(char, onTop ? angleFromEnd - 90 : angleFromEnd + 90, p);
    }
}

ArcText.metaParameters = [
    { title: "font", type: "font", value: '#stencil' },
    { title: "text", type: "text", value: 'Hello world' },
    { title: "font size", type: "range", min: 10, max: 200, value: 48 },
    { title: "arc radius", type: "range", min: 1, max: 1000, value: 200 },
    { title: "start angle", type: "range", min: -90, max: 270, value: 45 },
    { title: "end angle", type: "range", min: -90, max: 270, value: 135 },
    { title: "top", type: "bool", value: true },
    { title: "show circle", type: "bool", value: true }
];

module.exports = ArcText;
