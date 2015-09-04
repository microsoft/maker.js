require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var makerjs = require('makerjs');

var point = makerjs.point;
var path = makerjs.path;
var paths = makerjs.paths;
var Line = paths.Line;
var Parallel = paths.Parallel;
var model = makerjs.model;

function logo(or, ir, ear, outline, mHeight, serifHeight, speed, drop, columnWidth, spacing, step) {

    if (arguments.length == 0) {
        var v = makerjs.kit.getParameterValues(logo);
        or = v.shift();
        ir = v.shift();
        ear = v.shift();
        outline = v.shift();
        mHeight = v.shift();
        serifHeight = v.shift();
        speed = v.shift();
        drop = v.shift();
        columnWidth = v.shift();
        spacing = v.shift();
        step = v.shift();
    }

    function M() {
        this.models = {
            base: {
                paths: {}
            },
            legs: {
                models: {}
            }
        };
    }

    var m_letter = new M();
    var m_outline = new M();
    
    var legModels = m_letter.models.legs.models;
    var outlineModels = m_outline.models.legs.models;

    var far = 100;

    function addLeg(id, leftRef, leftSpace, topRef, topSpace, topPoint, trimToLeftRef, earDistance) {
        var leg = {
            paths: {}
        };

        leg.paths.top = new Parallel(topRef, topSpace, topPoint);
        leg.paths.left = new Parallel(leftRef, leftSpace, [far, 0]);
        leg.paths.serif = new Parallel(leg.paths.top, serifHeight, [0, 0]);
        leg.paths.right = new Parallel(leg.paths.left, columnWidth, [far, 0]);
        leg.paths.ear = new Parallel(leg.paths.left, earDistance, [0, 0]);

        legModels[id] = leg;

        var outleg = {
            paths: {}
        };

        outleg.paths.top = new Parallel(leg.paths.top, outline, [0, far]);
        outleg.paths.left = new Parallel(leg.paths.left, outline, [-far, 0]);
        outleg.paths.serif = new Parallel(leg.paths.serif, outline, [0, 0]);
        outleg.paths.right = new Parallel(leg.paths.right, outline, [far, 0]);
        outleg.paths.ear = new Parallel(leg.paths.ear, outline, [-far, 0]);

        outlineModels[id] = outleg;
    }

    function trimLeg(id) {

        function trimLegPart(leg, innerRadius, outerRadius) {
            trimLines(leg.paths.top, leg.paths.right);
            trimLines(leg.paths.serif, leg.paths.left);
            leg.paths.innerFillet = path.fillet(leg.paths.left, leg.paths.serif, innerRadius);
            leg.paths.outerFillet = path.fillet(leg.paths.top, leg.paths.right, outerRadius);
            trimLines(leg.paths.top, leg.paths.ear, true);
            trimLines(leg.paths.serif, leg.paths.ear, true, true);
        }

        trimLegPart(legModels[id], ir, or);
        trimLegPart(outlineModels[id], ir - outline, or + outline);
    }

    function combineM(m) {
        var legs = m.models.legs;
        model.combine(legs.models['1'], legs.models['2'], false, true, false, true);
        model.combine(legs.models['2'], legs.models['3'], false, true, false, true);
        model.combine(m.models.base, legs, true, false, false, true);
    }

    m_outline.models.base.paths.bottom = new Line([0, 0], [far, 0]);
    m_letter.models.base.paths.bottom = new Parallel(m_outline.models.base.paths.bottom, outline, [0, far]);

    var rotatedLeft = path.rotate(new Line([0, 0], [0, far]), -speed, [0, 0]);
    var rotatedBottom = path.rotate(new Line([-far, outline], [far, outline]), drop, [0, outline]);

    addLeg('1', rotatedLeft, outline, rotatedBottom, mHeight, [0, far], false, ear + ir);
    addLeg('2', legModels['1'].paths.right, spacing, legModels['1'].paths.top, step, [0, 0], true, spacing + columnWidth / 2);
    addLeg('3', legModels['2'].paths.right, spacing, legModels['2'].paths.top, step, [0, 0], true, spacing + columnWidth / 2);

    trimLeg('1', false);
    trimLeg('2', true);
    trimLeg('3', true);

    combineM(m_letter);
    combineM(m_outline);

    this.models = {
        letter: m_letter,
        outline: m_outline
    };

}

function trimLines(line1, line2, useLine1Origin, useLine2Origin) {
    var int = path.slopeIntersectionPoint(line1, line2);
    if (int) {
        line1[useLine1Origin ? 'origin' : 'end'] = int;
        line2[useLine2Origin ? 'origin' : 'end'] = int;
    }
}

logo.metaParameters = [
    { title: "outer radius", type: "range", min: 0, max: 1.7, step: .1, value: 1.06 },
    { title: "inner radius", type: "range", min: 0, max: .9, step: .1, value: .3 },
    { title: "ear", type: "range", min: 0, max: 2, step: .1, value: 1.1 },
    { title: "outline", type: "range", min: 0.2, max: 2, step: .1, value: 1.06 },
    { title: "m height", type: "range", min: 7, max: 20, step: .1, value: 8.3 },
    { title: "serif height", type: "range", min: .1, max: 1.9, step: .1, value: .65 },
    { title: "speed", type: "range", min: 0, max: 45, step: 1, value: 19.01 },
    { title: "drop", type: "range", min: 0, max: 30, step: 1, value: 1 },
    { title: "column width", type: "range", min: .4, max: 5, step: .1, value: 2.59 },
    { title: "spacing", type: "range", min: 1.3, max: 5, step: .1, value: 1.25 },
    { title: "step", type: "range", min: 0, max: 4, step: .1, value: 2.385 },
];

module.exports = logo;

},{"makerjs":undefined}],2:[function(require,module,exports){
var makerjs = require('makerjs');

function monotext() {
	var mv = makerjs.model.move;
	var arc = makerjs.paths.Arc;
	var line = makerjs.paths.Line;
	
	var u = 50;
	var u2 = u * 2;
	var u3 = u * 3;
	var u4 = u * 4;
	var up = u / 3;
	var c1 = [u, u];
	var c2 = [u, u3];
	var pne = [u2, u4];
	var pnw = [0, u4];
	var k = u2 + u * .75;
	var gap = 15;
	var gc = [gap, u2];
	var gc2 = [u2 - gap, u2];
	var sa = 10;
	
	function sp(letterFn, index) {
	    var letter = new letterFn();
	    letter.origin = [index * k, 0];
	    return letter;
	}
	
	function left() {
	    return new line([0, 0], pnw);
	}
	
	function crossbar() {
	    return new line(gc, gc2);
	}
	
	function lowangle() {
	    return new line(gc, [u2, 0])
	}
	
	function lowarc() {
	    return new arc(c1, u, 180, 90)
	}
	
	function toparc1() {
        return new arc(c2, u, 0, 90 - sa);		
	}
	
	function toparc2() {
        return new arc(c2, u, 90 + sa, 180);		
	}
	
	function botarc1() {
        return new arc(c1, u, 180, 270 - sa);		
	}
	
	function botarc2() {
        return new arc(c1, u, 270 + sa, 0);		
	}
	
	var alpha = {
	    a: function() {
	        this.paths = {
	            toparc1: toparc1(),
				toparc2: toparc2(),
	            left: new line([0, 0], [0, u3]),
	            right: new line([u2, 0], [u2, u3]),
	            crossbar: crossbar()
			};
	    },
	    e: function() {
	        this.paths = {
	            left: left(),
	            top: new line(pnw, pne),
	            bottom: new line([0, 0], [u2, 0]),
	            crossbar: crossbar()
			};
	    },
	    g: function() {
	        this.paths = {
	            toparc1: toparc1(),
				toparc2: toparc2(),
	            botarc1: botarc1(),
				botarc2: botarc2(),
	            left:  new line([0, u], [0, u3]),
	            right: new line([u2, u], [u2, u2]),
	            cross: new line([u, u2], [u2, u2])
			};
	    },
	    j: function() {
	        this.paths = {
	            botarc1: botarc1(),
				botarc2: botarc2(),
	            right: new line([u2, u], pne)
			};
	    },
	    k: function() {
	        this.paths = {
	            left: left(),
	            topcross: new line(pne, gc),
	            lowangle: lowangle()
			};
	    },
	    m: function() {
	        this.paths = {
	            left: left(),
	            right: new line([u2, 0], pne),
	            leftcross: new line([0, u4], [u, u2]),
	            rightcross: new line([u, u2], [u2, u4])
			};
	    },
	    o: function() {
	        this.paths = {
	            toparc1: toparc1(),
				toparc2: toparc2(),
	            botarc1: botarc1(),
				botarc2: botarc2(),
	            left: new line([0, u], [0, u3]),
	            right: new line([u2, u], [u2, u3])
			};
	    },
	    r: function() {
	        this.paths = {
	            left: left(),
	            top: new line(pnw, [u - gap, u4]),
	            upper: new arc(c2, u, 270, 90),
	            cross: new line([gap, u2], [u - gap, u2]),
	            lowangle: lowangle()
			};
	    },
	    s: function() {
	        this.paths = {
	            toparc1: toparc1(),
	            botarc1: botarc1(),
	            upper: new arc(c2, u, 90 + sa, 270 - sa),
	            lowarc: new arc(c1, u, 270 + sa, 90 - sa )
			};
	    },
	    ".": function() {
	        var angle = 30;
	        this.paths = {
	            dot: new arc([u, up], up, 270 + angle, 270 - angle)
			};
	    }
	};

    var models = this.models = {};

	function addWord(word) {
		for (var i=0; i < word.length; i++) {
			var letter = word[i];
			models['c' + i] = sp(alpha[letter], i);
		}
	}

	addWord('makerjs.org');
}

module.exports = monotext;

},{"makerjs":undefined}],"card":[function(require,module,exports){
var makerjs = require('makerjs');
var makerjs_logo = require('makerjs-logo');
var makerjs_monotext = require('makerjs-monotext');

function card(w, h, outerRadius, rim, boltRadius, conn, logoOutline, logoScale, logoY, logoAngle, textScale, textY, tabMargin, tabHeight, tabR ) {

	if (arguments.length == 0) {    
		var defaultValues = makerjs.kit.getParameterValues(card);
		function v() { 
			return defaultValues.shift();
		}
		w = v();
		h = v();
		outerRadius = v();
		rim = v();
		boltRadius = v();
		conn = v();
		logoOutline = v();
		logoScale = v();
		logoY = v();
		logoAngle = v();
		textScale = v();
		textY = v();
		tabMargin = v();
		tabHeight = v();
		tabR = v();
	}
	
	function hCenter(model, y) {

	    var measure = makerjs.measure.modelExtents(model);
	    var mw = measure.high[0];
	    model.origin = [(w - mw) / 2, y];

	    return mw;
	}

	function flipArcs(roundRect) {

	    function findAndFlip(arcId, origin) {
	        var arc = roundRect.paths[arcId];
	        arc.startAngle = makerjs.angle.mirror(arc.startAngle, true, true);
	        arc.endAngle = makerjs.angle.mirror(arc.endAngle, true, true);
	        arc.origin = origin;
        }

	    findAndFlip('BottomLeft', [0, 0]);
	    findAndFlip('BottomRight', [innerW, 0]);
	    findAndFlip('TopLeft', [0, innerH]);
	    findAndFlip('TopRight', [innerW, innerH]);
	}
	
	var outer = new makerjs.models.RoundRectangle(w, h, outerRadius);

	var bolts = new makerjs.models.BoltRectangle(w - 2 * rim, h - 2 * rim, boltRadius);
	bolts.origin = [rim, rim];

	var logo = makerjs.model.scale(new makerjs_logo(1.06, .3, .35, logoOutline, 8.3, .65, logoAngle, 1, 2.7, 1.32, 2.31), logoScale);
	hCenter(logo, logoY);

	var text = makerjs.model.scale(new makerjs_monotext('MAKERJS.ORG'), textScale);
	var textW = hCenter(text, textY);

	var tabW = textW + tabMargin;
	var tab = new makerjs.models.RoundRectangle(tabW, tabHeight, tabR);
	hCenter(tab, rim - tabR);

	var innerW = w - 2 * rim;
	var innerH = h - 2 * rim;

	var inner = new makerjs.models.RoundRectangle(innerW, innerH, rim);
	inner.origin = [rim, rim];
	flipArcs(inner);

	this.units = makerjs.unitType.Millimeter;
	this.paths = {};
	
	var plus = {
		origin: [w / 2, h / 2],
		models: {
			v: makerjs.model.move(new makerjs.models.Rectangle(conn, h * 2), [conn / -2, -h]),
			h: makerjs.model.move(new makerjs.models.Rectangle(w * 2, conn), [-w, conn / -2])
		}
	}
	
	makerjs.model.rotate(plus, -logoAngle, plus.origin);

	this.models = {
		text: text, 
		outer: outer, 
		bolts: bolts,
		innerTab: {
			models: {
				inner: inner, 
				tab: tab
			}
		},
		logoPlus: {
			models: { 
				plus: plus,
				logo: logo
			}
		} 
	};

	makerjs.model.originate(this);

	makerjs.model.combine(plus.models.h, plus.models.v, false, true, false, true);
	makerjs.model.combine(plus, logo.models.outline, false, true, false, true);
	makerjs.model.combine(tab, inner, true, false, false, true);
	makerjs.model.combine(this.models.logoPlus, this.models.innerTab, true, false, false, true);
}

card.metaParameters = [
    { title: "width", type: "range", min: 30, max: 200, value: 75 },
    { title: "height", type: "range", min: 30, max: 200, value: 60 },
    { title: "outer radius", type: "range", min: 0, max: 10, step: .5, value: 4 },
    { title: "rim", type: "range", min: 1, max: 10, step: .5, value: 4 },
    { title: "bolt radius", type: "range", min: 0, max: 5, step: .1, value: 1.5 },
    { title: "connector width", type: "range", min: .5, max: 5, step: .1, value: 2.75 },
    { title: "logo outline", type: "range", min: .3, max: 3, step: .1, value: 1.3 },
    { title: "logo scale", type: "range", min: 1, max: 6, step: .1, value: 3.33 },
    { title: "logo y-offset", type: "range", min: 0, max: 30, step: 1, value: 17 },
    { title: "logo angle", type: "range", min: 0, max: 45, step: 1, value: 19 },
    { title: "text scale", type: "range", min: .005, max: .05, step: .001, value: .03 },
    { title: "text y-offset", type: "range", min: 0, max: 10, step: .1, value: 3.5 },
    { title: "text margin", type: "range", min: 1, max: 10, step: .1, value: 7 },
    { title: "tab height", type: "range", min: 2, max: 15, step: .5, value: 9.5 },
    { title: "tab radius", type: "range", min: 0, max: 2, step: .1, value: 1.5 },
];

module.exports = card;

},{"makerjs":undefined,"makerjs-logo":1,"makerjs-monotext":2}]},{},[]);
