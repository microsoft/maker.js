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
