var assert = require('assert');
var makerjs = require('../dist/index.js')

describe('Export SVG', function () {

    var model = {};
    makerjs.$(new makerjs.models.Square(100)).layer('outer').center().addTo(model, 's1');
    makerjs.$(new makerjs.models.Square(50)).layer('inner').center().addTo(model, 's2');

    it('should export without a closing tag', function () {
        var svg = makerjs.exporter.toSVG(model);
        assert.ok(svg.indexOf('</path>') < 0);
    });

    it('should export with a closing tag', function () {
        var svg = makerjs.exporter.toSVG(model, { closingTags: true });
        assert.ok(svg.indexOf('</path>') > 0);
    });

    it('should export cssStyle', function () {
        var options = {
            cssStyle: "style1",
            layerOptions: {
                outer: { cssStyle: "style2" },
                inner: { cssStyle: "style3" }
            },
            fill: null,
            fontSize: null,
            stroke: null,
            strokeWidth: null,
            scalingStroke: true,
            strokeLineCap: null
        };
        var svg = makerjs.exporter.toSVG(model, options);
        assert.ok(svg.indexOf('style="style1"') > 0);
        assert.ok(svg.indexOf('style="style2"') > 0);
        assert.ok(svg.indexOf('style="style3"') > 0);
    });

    it('should export with all <g> tags closed', function () {
        var svg = makerjs.exporter.toSVG(model, { useSvgPathOnly: false });
        var result, openTags = [], closeTags = [];
        var regex = /<g/gi;
        while ( (result = regex.exec(svg)) ) {
          openTags.push(result.index);
        }
        regex = /<\/g/gi;
        while ( (result = regex.exec(svg)) ) {
          closeTags.push(result.index);
        }
        assert.ok(openTags.length > 0);
        assert.ok(closeTags.length == openTags.length);
    });

    it('should export with xmlns by default', function () {
        var svg = makerjs.exporter.toSVG(model);
        assert.ok(svg.indexOf('xmlns="http://www.w3.org/2000/svg"') > 0);
    });

});
