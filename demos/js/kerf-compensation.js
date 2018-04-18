////////////////////////////////////////////////////////////////////
//
// Kerf Compensation by Kurt Meister | April 9th 2018 | CC BY SA 4.0
//
// Credits: Dan Marshall for his support
//
/////////////////////////////////////////////////////////////////////

//Define some variables:
var width = 80;     // Outer dimensions
var groove = 12;    // Cutout lenght
var fontsize = 4.5; // Small text
var dia = 5;        // Hole dia

kerf.metaParameters = [
  {title: "Font", type: "font", value: '#stencil' },
  {title: "Material thickness", type: "range", min: 2, max: 6, value: 4},
  {title: "Increment", type: "range", min: 0.05, max: 0.2, value: 0.1}
];

var makerjs = require('makerjs');

function straightenRoundRect(roundRect, facetSize) {

    //replace an arc (path) with a series of lines (model)
    function corner(id) {

        //get the arc and remove it from the roundRect
        var arc = roundRect.paths[id];
        delete roundRect.paths[id];

        //get the points along the arc, of the facetSize
        var points = makerjs.path.toKeyPoints(arc, facetSize);

        //connect the points as lines, add this model to roundRect
        var straightened = new makerjs.models.ConnectTheDots(false, points);
        roundRect.models[id] = straightened;
    }

    //create a place to put all the models
    roundRect.models = {};

    ["TopRight", "TopLeft", "BottomRight", "BottomLeft"].forEach(corner);
}

function kerf(Font, Material, Increment) {

  //generate the text
  var text0 = makerjs.model.move(new makerjs.models.Text(Font, "Kerf 0.0", fontsize),[width/2 + Material, Material * 1.5]);
  var text1 = makerjs.model.rotate(makerjs.model.move(new makerjs.models.Text(Font, "Kerf " + Math.round(Increment * 100)/100, fontsize),[width/2 + Material, -width + Material * 1.5]),90);
  var text2 = makerjs.model.rotate(makerjs.model.move(new makerjs.models.Text(Font, "Kerf " + Math.round(Increment*2 * 100)/100, fontsize),[-width/2 + Material, -width + Material * 1.5]),180);
  var text3 = makerjs.model.rotate(makerjs.model.move(new makerjs.models.Text(Font, "Kerf " + Math.round(Increment*3 * 100)/100, fontsize),[-width/2 + Material, Material * 1.5]),270);

  var text4 = makerjs.model.move(new makerjs.models.Text(Font, "P:", 8),[width/2 - groove, width/2 + groove - Material/2]);
  var text5 = makerjs.model.move(new makerjs.models.Text(Font, "v:", 8),[width/2 - groove, width/2 - Material/2]);
  var text6 = makerjs.model.move(new makerjs.models.Text(Font, "t: " + Material + "mm", 8),[width/2 - groove, width/2 - groove - Material/2]);

  //generate the outline
  var rect = new makerjs.models.RoundRectangle(width, width, 3);
  straightenRoundRect(rect, 0.5);
  

  //generate the cutouts
  var cutout01 = makerjs.model.move(new makerjs.models.Rectangle(groove, Material * 2), [(width - groove) / 2, -Material]);
  var cutout02 = makerjs.model.move(new makerjs.models.Rectangle(groove, Material * 2), [(width - 5 * groove) / 2, -Material]);
  var cutout03 = makerjs.model.move(new makerjs.models.Rectangle(groove, Material * 2), [(width + 3 * groove) / 2, -Material]);
  var cutout04 = makerjs.model.move(new makerjs.models.Rectangle(Material, groove * 2), [(width - Material) / 2, -groove + Material]);

  var off1 = 3 * -Increment;

  var cutout11 = makerjs.model.move(new makerjs.models.Rectangle(Material * 2, groove + off1), [-Material, (width - groove - off1) / 2]);
  var cutout12 = makerjs.model.move(new makerjs.models.Rectangle(Material * 2, groove + off1), [-Material, (width - 5 * groove - off1) / 2]);
  var cutout13 = makerjs.model.move(new makerjs.models.Rectangle(Material * 2, groove + off1), [-Material, (width + 3 * groove - off1) / 2]);
  var cutout14 = makerjs.model.move(new makerjs.models.Rectangle(groove * 2, Material + off1), [-groove + Material, (width - Material - off1) / 2]);

  var off2 = 2 * -Increment;

  var cutout21 = makerjs.model.move(new makerjs.models.Rectangle(groove + off2, Material * 2), [(width - groove - off2) / 2, width - Material]);
  var cutout22 = makerjs.model.move(new makerjs.models.Rectangle(groove + off2, Material * 2), [(width - 5 * groove - off2) / 2, width - Material]);
  var cutout23 = makerjs.model.move(new makerjs.models.Rectangle(groove + off2, Material * 2), [(width + 3 * groove - off2) / 2, width - Material]);
  var cutout24 = makerjs.model.move(new makerjs.models.Rectangle(Material + off2, groove * 2), [(width - Material - off2) / 2, width - groove - Material]);

  var off3 = 1 * -Increment;

  var cutout31 = makerjs.model.move(new makerjs.models.Rectangle(Material * 2, groove + off3), [width - Material, (width - groove - off3) / 2]);
  var cutout32 = makerjs.model.move(new makerjs.models.Rectangle(Material * 2, groove + off3), [width - Material, (width - 5 * groove - off3) / 2]);
  var cutout33 = makerjs.model.move(new makerjs.models.Rectangle(Material * 2, groove + off3), [width - Material, (width + 3 * groove - off3) / 2]);
  var cutout34 = makerjs.model.move(new makerjs.models.Rectangle(groove * 2, Material + off3), [width - groove - Material, (width - Material - off3) / 2]);

  //generate the hole
  var circle = makerjs.model.move(new makerjs.models.Oval(dia, dia), [Material + 2 * dia, Material + 2 * dia]);
	straightenRoundRect(circle, 0.5);
  
  //save all of these in the model
  this.models = {
    rect: rect,

    cutout01: cutout01,
    cutout02: cutout02,
    cutout03: cutout03,
    cutout04: cutout04,

    cutout11: cutout11,
    cutout12: cutout12,
    cutout13: cutout13,
    cutout14: cutout14,

    cutout21: cutout21,
    cutout22: cutout22,
    cutout23: cutout23,
    cutout24: cutout24,

    cutout31: cutout31,
    cutout32: cutout32,
    cutout33: cutout33,
    cutout34: cutout34,

    cicle: circle,
    text0: text0,
    text1: text1,
    text2: text2,
    text3: text3,
    text4: text4,
    text5: text5,
    text6: text6
  };

  var tmp0 = makerjs.model.combineUnion(cutout01, cutout02);
  tmp0 = makerjs.model.combineUnion(tmp0, cutout03);
  tmp0 = makerjs.model.combineUnion(tmp0, cutout04);

  var tmp1 = makerjs.model.combineUnion(cutout11, cutout12);
  tmp1 = makerjs.model.combineUnion(tmp1, cutout13);
  tmp1 = makerjs.model.combineUnion(tmp1, cutout14);

  var tmp2 = makerjs.model.combineUnion(cutout21, cutout22);
  tmp2 = makerjs.model.combineUnion(tmp2, cutout23);
  tmp2 = makerjs.model.combineUnion(tmp2, cutout24);

  var tmp3 = makerjs.model.combineUnion(cutout31, cutout32);
  tmp2 = makerjs.model.combineUnion(tmp2, cutout33);
  tmp2 = makerjs.model.combineUnion(tmp2, cutout34);

  tmp0 = makerjs.model.combineUnion(tmp0, tmp1);
  tmp0 = makerjs.model.combineUnion(tmp0, tmp2);
  tmp0 = makerjs.model.combineUnion(tmp0, tmp3);

  makerjs.model.combineSubtraction(rect, tmp0);

  //move everything to [0, 0]
  makerjs.model.zero(this);

  this.units = makerjs.unitType.Millimeter;
  
  // Add some information about the usage and a external link
  this.notes = '# Kerf Compensation \n If you cut two pieces with the same power and speed, then you are able to define the Kerf Compensation for a press fit joint. For more information visit https://www.thingiverse.com/thing:2854454/';

}

module.exports = kerf;