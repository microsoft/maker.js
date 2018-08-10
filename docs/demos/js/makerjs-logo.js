var makerjs = require('makerjs');

var point = makerjs.point;
var path = makerjs.path;
var paths = makerjs.paths;
var Line = paths.Line;
var Parallel = paths.Parallel;
var model = makerjs.model;

function logo(outerRadius, innerRadius, serifLength, outline, mHeight, serifHeight, vAngle, hAngle, columnWidth, spacing, step, joints) {

    if (arguments.length == 0) {
        var v = makerjs.kit.getParameterValues(logo);
        outerRadius = v.shift();
        innerRadius = v.shift();
        serifLength = v.shift();
        outline = v.shift();
        mHeight = v.shift();
        serifHeight = v.shift();
        vAngle = v.shift();
        hAngle = v.shift();
        columnWidth = v.shift();
        spacing = v.shift();
        step = v.shift();
        joints = v.shift();
    }
    
	function vGuides(centerX, rightOffset, leftOffset, angle) {
		this.paths = {
            left: new Line([centerX - leftOffset, 0], [centerX - leftOffset, 1]),
			center: new Line([centerX, 0], [centerX, 1]),
			right: new Line([centerX + rightOffset, 0], [centerX + rightOffset, 1])
		}
		makerjs.model.rotate(this, angle, [0, 0]);
	}

	function hGuides(lowerOffset, height, angle) {
      	height = Math.max(height, lowerOffset);
		this.paths = {  
			top: new Line([0, height], [1, height]),
 			lower: new Line([0, height - lowerOffset], [1, height - lowerOffset])
 		}
		makerjs.model.rotate(this, hAngle, [0, 0]);
        this.paths.base = new Line([0, 0], [1, 0]);
 	}
  
  	function connectLines(line1, prop1, line2, prop2) {
      	line1[prop1] = line2[prop2] = makerjs.point.fromSlopeIntersection(line1, line2);
    }

 	function column(centerX, height, leftX) {
        
 		var v = new vGuides(centerX, columnWidth, leftX, -vAngle);
 		var h = new hGuides(serifHeight, height - serifHeight);
    
      	if (leftX) {
      		connectLines(v.paths.left, 'origin', h.paths.lower, 'origin');
      		connectLines(v.paths.left, 'end', h.paths.top, 'origin');
	      	connectLines(v.paths.center, 'end', h.paths.lower, 'end');
        } else {
          connectLines(v.paths.center, 'end', h.paths.top, 'origin');
          delete h.paths.lower;
        }
      	connectLines(v.paths.right, 'end', h.paths.top, 'end');
      	connectLines(v.paths.center, 'origin', h.paths.base, 'origin');
      	connectLines(v.paths.right, 'origin', h.paths.base, 'end');
        
      	this.paths = { 
          outerFillet: makerjs.path.fillet(v.paths.right, h.paths.top, outerRadius)
        };
      	
      	if (leftX) {
          this.paths.innerFillet = makerjs.path.fillet(v.paths.center, h.paths.lower, innerRadius);
        }
      
      	makerjs.extendObject(this.paths, h.paths);
      	makerjs.extendObject(this.paths, v.paths);
 	}
  	
    this.models = {
		column1:  new column(0, mHeight, serifLength)
    };

	var column2 = new column(spacing + columnWidth, mHeight - step, columnWidth + spacing - .00001);
  	makerjs.model.combine(this, column2);
    this.models.column2 = column2;
      
	var column3 = new column((spacing + columnWidth) * 2, mHeight - step * 2, columnWidth + spacing - .00001);
  	makerjs.model.combine(this, column3);
    this.models.column3 = column3;

    //make a clone of the M and remove the spaces between its columns
  	var clone = makerjs.cloneObject(this);
  	var m = clone.models;
  
  	delete m.column1.paths.right;

  	delete m.column2.paths.base;
  	delete m.column2.paths.right;

  	delete m.column2.paths.center;
  	delete m.column2.paths.lower;
  	delete m.column2.paths.innerFillet;
  	
  	delete m.column3.paths.center;
  	delete m.column3.paths.lower;
  	delete m.column3.paths.innerFillet;
  
  	m.column3.paths.base.origin = m.column1.paths.base.end;
  
  	this.models.outline = makerjs.model.outline(clone, outline, joints);
  	makerjs.model.simplify(this.models.outline);
}

logo.metaParameters = [
    { title: "outer radius", type: "range", min: 0, max: 1.7, step: .1, value: 1.1 },
    { title: "inner radius", type: "range", min: 0, max: .9, step: .1, value: .4 },
    { title: "serif length", type: "range", min: 0, max: 2, step: .1, value: 1.3 },
    { title: "outline", type: "range", min: 0.2, max: 2, step: .1, value: .9 },
    { title: "m height", type: "range", min: 7, max: 20, step: .1, value: 8.2 },
    { title: "serif height", type: "range", min: .1, max: 1.9, step: .1, value: .65 },
    { title: "vertical angle", type: "range", min: -45, max: 45, step: 1, value: 19 },
    { title: "horizontal angle", type: "range", min: -15, max: 45, step: 1, value: 2 },
    { title: "column width", type: "range", min: .4, max: 5, step: .1, value: 2.2 },
    { title: "spacing", type: "range", min: .1, max: 5, step: .1, value: 1.3 },
    { title: "step", type: "range", min: 0, max: 4, step: .1, value: 2.2 },
    { title: "outline joints", type: "range", min: 0, max: 2, step: 1, value: 1 },
];

logo.notes = 'This logo model has been re-written to use the new **model.outline** feature in Maker.js version 0.7.2';

module.exports = logo;
