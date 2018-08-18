require=(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
module.exports = function () {
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] !== undefined) return arguments[i];
    }
};

},{}],2:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],3:[function(require,module,exports){
var newline = /\n/
var newlineChar = '\n'
var whitespace = /\s/

module.exports = function(text, opt) {
    var lines = module.exports.lines(text, opt)
    return lines.map(function(line) {
        return text.substring(line.start, line.end)
    }).join('\n')
}

module.exports.lines = function wordwrap(text, opt) {
    opt = opt||{}

    //zero width results in nothing visible
    if (opt.width === 0 && opt.mode !== 'nowrap') 
        return []

    text = text||''
    var width = typeof opt.width === 'number' ? opt.width : Number.MAX_VALUE
    var start = Math.max(0, opt.start||0)
    var end = typeof opt.end === 'number' ? opt.end : text.length
    var mode = opt.mode

    var measure = opt.measure || monospace
    if (mode === 'pre')
        return pre(measure, text, start, end, width)
    else
        return greedy(measure, text, start, end, width, mode)
}

function idxOf(text, chr, start, end) {
    var idx = text.indexOf(chr, start)
    if (idx === -1 || idx > end)
        return end
    return idx
}

function isWhitespace(chr) {
    return whitespace.test(chr)
}

function pre(measure, text, start, end, width) {
    var lines = []
    var lineStart = start
    for (var i=start; i<end && i<text.length; i++) {
        var chr = text.charAt(i)
        var isNewline = newline.test(chr)

        //If we've reached a newline, then step down a line
        //Or if we've reached the EOF
        if (isNewline || i===end-1) {
            var lineEnd = isNewline ? i : i+1
            var measured = measure(text, lineStart, lineEnd, width)
            lines.push(measured)
            
            lineStart = i+1
        }
    }
    return lines
}

function greedy(measure, text, start, end, width, mode) {
    //A greedy word wrapper based on LibGDX algorithm
    //https://github.com/libgdx/libgdx/blob/master/gdx/src/com/badlogic/gdx/graphics/g2d/BitmapFontCache.java
    var lines = []

    var testWidth = width
    //if 'nowrap' is specified, we only wrap on newline chars
    if (mode === 'nowrap')
        testWidth = Number.MAX_VALUE

    while (start < end && start < text.length) {
        //get next newline position
        var newLine = idxOf(text, newlineChar, start, end)

        //eat whitespace at start of line
        while (start < newLine) {
            if (!isWhitespace( text.charAt(start) ))
                break
            start++
        }

        //determine visible # of glyphs for the available width
        var measured = measure(text, start, newLine, testWidth)

        var lineEnd = start + (measured.end-measured.start)
        var nextStart = lineEnd + newlineChar.length

        //if we had to cut the line before the next newline...
        if (lineEnd < newLine) {
            //find char to break on
            while (lineEnd > start) {
                if (isWhitespace(text.charAt(lineEnd)))
                    break
                lineEnd--
            }
            if (lineEnd === start) {
                if (nextStart > start + newlineChar.length) nextStart--
                lineEnd = nextStart // If no characters to break, show all.
            } else {
                nextStart = lineEnd
                //eat whitespace at end of line
                while (lineEnd > start) {
                    if (!isWhitespace(text.charAt(lineEnd - newlineChar.length)))
                        break
                    lineEnd--
                }
            }
        }
        if (lineEnd >= start) {
            var result = measure(text, start, lineEnd, testWidth)
            lines.push(result)
        }
        start = nextStart
    }
    return lines
}

//determines the visible number of glyphs within a given width
function monospace(text, start, end, width) {
    var glyphs = Math.min(width, end-start)
    return {
        start: start,
        end: start+glyphs
    }
}
},{}],"opentype-layout":[function(require,module,exports){
var defined = require('defined');
var wordWrapper = require('word-wrapper');
var assign = require('object-assign');

// A default 'line-height' according to Chrome/FF/Safari (Jun 2016)
var DEFAULT_LINE_HEIGHT = 1.175;

module.exports = function (font, text, opt) {
  if (!font) throw new TypeError('Must specify a font from Opentype.js');
  opt = opt || {};
  text = text || '';
  var align = defined(opt.align, 'left');
  var letterSpacing = defined(opt.letterSpacing, 0);
  var width = defined(opt.width, Infinity);

  // apply word wrapping to text
  var wrapOpts = assign({}, opt, {
    measure: measure
  });
  var lines = wordWrapper.lines(text, wrapOpts);

  // get max line width from all lines
  var maxLineWidth = lines.reduce(function (prev, line) {
    return Math.max(prev, line.width);
  }, 0);

  // As per CSS spec https://www.w3.org/TR/CSS2/visudet.html#line-height
  var AD = Math.abs(font.ascender - font.descender);
  var lineHeight = defined(opt.lineHeight, font.unitsPerEm * DEFAULT_LINE_HEIGHT); // in em units
  var L = lineHeight - AD;

  // Y position is based on CSS line height calculation
  var x = 0;
  var y = -font.ascender - L / 2;
  var totalHeight = (AD + L) * lines.length;
  var preferredWidth = isFinite(width) ? width : maxLineWidth;
  var glyphs = [];
  var lastGlyph = null;

  // Layout by line
  for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    var line = lines[lineIndex];
    var start = line.start;
    var end = line.end;
    var lineWidth = line.width;

    // Layout by glyph
    for (var j = start, c = 0; j < end; j++, c++) {
      var char = text.charAt(j);
      var glyph = getGlyph(font, char);

      // TODO:
      // Align center & right are off by a couple pixels, need to revisit.
      if (j === start && align === 'right') {
        x -= glyph.leftSideBearing;
      }

      // Apply kerning
      if (lastGlyph) {
        x += font.getKerningValue(glyph, lastGlyph) || 0;
      }

      // Align text
      var tx = 0;
      if (align === 'center') {
        tx = (preferredWidth - lineWidth) / 2;
      } else if (align === 'right') {
        tx = preferredWidth - lineWidth;
      }

      // Store glyph data
      glyphs.push({
        position: [ x + tx, y ],
        data: glyph,
        index: j,
        column: c,
        row: lineIndex
      });

      // Advance forward
      x += letterSpacing + getAdvance(glyph, char);
      lastGlyph = glyph;
    }

    // Advance down
    y -= lineHeight;
    x = 0;
  }

  // Compute left & right values
  var left = 0;
  if (align === 'center') left = (preferredWidth - maxLineWidth) / 2;
  else if (align === 'right') left = preferredWidth - maxLineWidth;
  var right = Math.max(0, preferredWidth - maxLineWidth - left);

  return {
    glyphs: glyphs,
    baseline: L / 2 + Math.abs(font.descender),
    leading: L,
    lines: lines,
    lineHeight: lineHeight,
    left: left,
    right: right,
    maxLineWidth: maxLineWidth,
    width: preferredWidth,
    height: totalHeight
  };

  function measure (text, start, end, width) {
    return computeMetrics(font, text, start, end, width, letterSpacing);
  }
};

function getRightSideBearing (glyph) {
  var glyphWidth = (glyph.xMax || 0) - (glyph.xMin || 0);
  var rsb = glyph.advanceWidth - glyph.leftSideBearing - glyphWidth;
  return rsb;
}

function computeMetrics (font, text, start, end, width, letterSpacing) {
  start = Math.max(0, defined(start, 0));
  end = Math.min(defined(end, text.length), text.length);
  width = defined(width, Infinity);
  letterSpacing = defined(letterSpacing, 0);

  var pen = 0;
  var count = 0;
  var curWidth = 0;

  for (var i = start; i < end; i++) {
    var char = text.charAt(i);

    // Tab is treated as multiple space characters
    var glyph = getGlyph(font, char);
    ensureMetrics(glyph);

    // determine kern value to next glyph
    var kerning = 0;
    if (i < end - 1) {
      var nextGlyph = getGlyph(font, text.charAt(i + 1));
      kerning += font.getKerningValue(glyph, nextGlyph);
    }

    // determine if the new pen or width is above our limit
    var xMax = glyph.xMax || 0;
    var xMin = glyph.xMin || 0;
    var glyphWidth = xMax - xMin;
    var rsb = getRightSideBearing(glyph);
    var newWidth = pen + glyph.leftSideBearing + glyphWidth + rsb;
    if (newWidth > width) {
      break;
    }

    pen += letterSpacing + getAdvance(glyph, char) + kerning;
    curWidth = newWidth;
    count++;
  }

  return {
    start: start,
    end: start + count,
    width: curWidth
  };
}

function getGlyph (font, char) {
  var isTab = char === '\t';
  return font.charToGlyph(isTab ? ' ' : char);
}

function getAdvance (glyph, char) {
  // TODO: handle tab gracefully
  return glyph.advanceWidth;
}

function ensureMetrics (glyph) {
  // Opentype.js only builds its paths when the getter is accessed
  // so we force it here.
  return glyph.path;
}

},{"defined":1,"object-assign":2,"word-wrapper":3}]},{},[]);
