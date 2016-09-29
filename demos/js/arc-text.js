var makerjs = require('makerjs');

function ArcText(font, text, fontSize, fontScale, arcRadius, startAngle, endAngle, onTop, showCircle) {

    var arc = new makerjs.paths.Arc([0, 0], arcRadius, startAngle, endAngle);

    if (showCircle) {
    	this.paths = { circle: new makerjs.paths.Circle(arcRadius) };
    }

    //generate the text using a font
    var textModel = new makerjs.models.Text(font, text, fontSize, false, true);

    //save all of these in the model
    this.models = {
        text: textModel,
    };

  	//measure height of the text
  	var measure = makerjs.measure.modelExtents(textModel);
  	var height = measure.high[1] - measure.low[1];
  
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
      
        //set a new origin at the center of the text
        var o = makerjs.point.add(char.origin, [0, height / 2]);
        makerjs.model.originate(char, o);
        makerjs.model.scale(char, fontScale);
      
        var angle = centers[i] * span;
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
    { title: "font size", type: "range", min: 10, max: 200, value: 72 },
    { title: "font scale", type: "range", min: .1, max: 2, step: .1, value: .7 },
    { title: "arc radius", type: "range", min: 1, max: 1000, value: 200 },
    { title: "start angle", type: "range", min: -90, max: 270, value: 45 },
    { title: "end angle", type: "range", min: -90, max: 270, value: 135 },
    { title: "top", type: "bool", value: true },
    { title: "show circle", type: "bool", value: true }
];

module.exports = ArcText;
