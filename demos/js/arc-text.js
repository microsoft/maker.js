var makerjs = require('makerjs');

function ArcText(font, text, fontSize, arcRadius, startAngle, endAngle) {

    var arc = new makerjs.paths.Arc([0, 0], arcRadius, startAngle, endAngle);

    //uncomment to see the arc
    //this.paths = { arc: arc };

    //generate the text using a font
    var textModel = new makerjs.models.Text(font, text, fontSize, false, true);

    //save all of these in the model
    this.models = {
        text: textModel,
    };

    //get the x distance of each character as a percentage
    var first = textModel.models[0].origin[0];
    var last = textModel.models[text.length - 1].origin[0];
    var textWidth = last - first;
    var centers = [0];
    for (var i = 1; i < text.length - 1; i++) {
        var char = textModel.models[i];
        var distFromFirst = char.origin[0] - first;
        centers.push(distFromFirst / textWidth);
    }
    centers.push(1);

    //move each character to a percentage of the total arc
    var span = makerjs.angle.ofArcSpan(arc);
    for (var i = 0; i < text.length; i++) {
        var char = textModel.models[i];
        var angle = centers[i] * span;
        var angleFromEnd = endAngle - angle;
        var p = makerjs.point.fromAngleOnCircle(angleFromEnd, arc);
        char.origin = p;

        //rotate the char to 90 from tangent
        makerjs.model.rotate(char, angleFromEnd - 90, p);
    }
}

ArcText.metaParameters = [
    { title: "font", type: "font", value: '#stencil' },
    { title: "text", type: "text", value: 'Hello world' },
    { title: "font size", type: "range", min: 10, max: 200, value: 72 },
    { title: "arc radius", type: "range", min: 1, max: 1000, value: 200 },
    { title: "start angle", type: "range", min: -90, max: 270, value: 45 },
    { title: "end angle", type: "range", min: -90, max: 270, value: 135 }
];

module.exports = ArcText;
