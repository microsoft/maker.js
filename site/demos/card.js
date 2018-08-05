require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var makerjs = require('makerjs');

var point = makerjs.point;
var path = makerjs.path;
var paths = makerjs.paths;
var Line = paths.Line;
var Parallel = paths.Parallel;
var model = makerjs.model;

function logo(or, ir, ear, outline, mHeight, serifHeight, speed, drop, columnWidth, spacing, step) {

    var point = makerjs.point;
    var path = makerjs.path;
    var paths = makerjs.paths;

    function bend(r, bendTop, x, trimTo, outer) {

        outer = outer || 0;

        var hguide = new paths.Line([0, bendTop - r], [100, bendTop - r]);
        var vguide = path.rotate(new paths.Line([x, 0], [x, 100]), -speed, [x, 0]);
        var intersectionPoint = path.intersection(hguide, vguide).intersectionPoints[0];
        var center = point.subtract(intersectionPoint, [makerjs.solvers.solveTriangleASA(90, r, speed), 0]);

        var arc = new paths.Arc(center, r + outer, - speed, 90 + drop);

        var Horizontal = path.rotate(
                new paths.Line([-10, arc.origin[1] + r + outer], point.add(arc.origin, [0, r + outer])),
                drop,
                arc.origin
            );
        
        if (!outer) {
            trimLine(Horizontal, 'origin', trimTo);
        }

        var arcPoints = point.fromArc(arc);

        var Vertical = new paths.Line([x + makerjs.solvers.solveTriangleASA(90, outer, speed), 0], arcPoints[0]);

        if (!outer) {
            trimLine(Vertical, 'origin', bottomGuide);
        }

        this.paths = {
            arc: arc,
            Horizontal: Horizontal,
            Vertical: Vertical
        };
    }

    function leg(legTop, xOffset, trimTo) {

        this.models = {
            b1: new bend(ir, outline + legTop - serifHeight, speedOutline + xOffset, trimTo),
            b2: new bend(or, outline + legTop, speedOutline + columnWidth + xOffset, trimTo),
            b3: new bend(or, outline + legTop, speedOutline + columnWidth + xOffset, trimTo, outline)
        };

        this.paths = {
            legBottom: new paths.Line(this.models.b1.paths.Vertical.origin, this.models.b2.paths.Vertical.origin)
        };
    }

    var speedOutline = makerjs.solvers.solveTriangleASA(90, outline, speed);

    var bottomGuide = new paths.Line([0, outline], [100, outline]);

    var earline = path.rotate(new paths.Line([-ear, 0], [-ear, 100]), -speed, [-ear, 0]);

    var leg1 = new leg(mHeight, 0, earline);
    var leg2 = new leg(mHeight - step, columnWidth + spacing, leg1.models.b2.paths.Vertical);
    var leg3 = new leg(mHeight - 2 * step, 2 * (columnWidth + spacing), leg2.models.b2.paths.Vertical);

    var outBottom = new paths.Line([0, 0], leg3.models.b3.paths.Vertical.origin);

    var earPivot = leg1.models.b1.paths.Horizontal.origin;
    var earH = path.rotate(new paths.Line(point.subtract(earPivot, [100, outline]), point.subtract(earPivot, [-100, outline])), drop, earPivot);
    var outHome = trimLine(path.rotate(new paths.Line([0, 0], [0, 100]), -speed, [0, 0]), 'end', earH);
    var earOutline = trimLine(path.rotate(new paths.Line([-ear - speedOutline, 0], [-ear - speedOutline, 100]), -speed, [-ear - speedOutline, 0]), 'origin', earH);

    trimLines(earOutline, 'end', leg1.models.b3.paths.Horizontal, 'origin');

    trimBends(leg1.models.b3, leg2.models.b3);
    trimBends(leg2.models.b3, leg3.models.b3);

    this.paths = {
        ear: new paths.Line(leg1.models.b1.paths.Horizontal.origin, leg1.models.b2.paths.Horizontal.origin),
        leg1bottom: new paths.Line(leg1.models.b2.paths.Vertical.origin, leg2.models.b1.paths.Horizontal.origin),
        leg2bottom: new paths.Line(leg2.models.b2.paths.Vertical.origin, leg3.models.b1.paths.Horizontal.origin),
        outHome: outHome,
        earOutline: earOutline,
        earOutH: new paths.Line(earOutline.origin, outHome.end),
        outBottom: outBottom
    };

    this.models = {
        leg1: leg1,
        leg2: leg2,
        leg3: leg3
    };

    leg1.models.b2.paths.Vertical.origin = leg2.models.b2.paths.Horizontal.origin;
    leg2.models.b2.paths.Vertical.origin = leg3.models.b2.paths.Horizontal.origin;
}

function trimLine(line, propertyName, trimToPath) {
    var intersection = makerjs.path.intersection(line, trimToPath);
    if (intersection) {
        line[propertyName] = intersection.intersectionPoints[0];
    }
    return line;
}

function trimLines(line1, propertyName1, line2, propertyName2) {
    var intersection = makerjs.path.intersection(line1, line2);
    if (intersection) {
        line1[propertyName1] = intersection.intersectionPoints[0];
        line2[propertyName2] = intersection.intersectionPoints[0];
    }
    return intersection;
}

function trimBends(b1, b2) {
    var intersection = trimLines(b1.paths.Vertical, 'origin', b2.paths.Horizontal, 'origin');
    if (intersection) return;

    intersection = makerjs.path.intersection(b1.paths.arc, b2.paths.Horizontal);
    if (intersection) {
        b1.paths.arc.startAngle = intersection.path1Angles[0];
        b2.paths.Horizontal.origin = intersection.intersectionPoints[0];
        delete b1.paths.Vertical;
        return;
    }

    intersection = makerjs.path.intersection(b1.paths.arc, b2.paths.arc);
    if (intersection) {
        b1.paths.arc.startAngle = intersection.path1Angles[0];
        b2.paths.arc.endAngle = intersection.path2Angles[0];
        delete b1.paths.Vertical;
        delete b2.paths.Horizontal;
        return;
    }
}

logo.metaParameters = [
    { title: "outer radius", type: "range", min: 0, max: 1.7, step: .1, value: 1.06 },
    { title: "inner radius", type: "range", min: 0, max: .9, step: .1, value: .3 },
    { title: "ear", type: "range", min: .3, max: 2, step: .1, value: .35 },
    { title: "outline", type: "range", min: 0.2, max: 2, step: .1, value: 1.06 },
    { title: "m height", type: "range", min: 7, max: 10, step: .1, value: 8.3 },
    { title: "serif height", type: "range", min: .1, max: 1.9, step: .1, value: .65 },
    { title: "speed", type: "range", min: 0, max: 45, step: 1, value: 19.01 },
    { title: "drop", type: "range", min: 0, max: 12, step: 1, value: 1 },
    { title: "column width", type: "range", min: .4, max: 5, step: .1, value: 2.7 },
    { title: "spacing", type: "range", min: 1.3, max: 5, step: .1, value: 1.32 },
    { title: "step", type: "range", min: 1.5, max: 2.7, step: .1, value: 2.31 },
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
