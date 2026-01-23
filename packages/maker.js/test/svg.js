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

    it('should export with layerOptions on captions group', function () {
        const exportOptions = {
            layerOptions: {
                captions: {
                    fill: "#999",
                    cssStyle: "fill-opacity: 0.2",
                },
            },
        };
        var model = {};
        makerjs
            .$(new makerjs.models.Square(50))
            .addCaption('fold here', [0, 0], [50, 50])
            .addTo(model, 'square');
        const svg = makerjs.exporter.toSVG(model, exportOptions);
        assert.ok(svg.indexOf('<g id="captions" fill="#999" style="fill-opacity: 0.2">') > 0);
    });

    it('should export with layerOptions on caption text element', function () {
        const exportOptions = {
            fill: "green",
            fontSize: '8pt',
            stroke: "#333",
            strokeWidth: "0.5mm",
            layerOptions: {
                square: {
                    className: 'square',
                    fill: "#999",
                    cssStyle: "fill-opacity: 0.2",
                },
                square_caption: {
                    stroke: "red",
                },
            },
            className: 'test'
        };
        var model = {};
        makerjs
            .$(new makerjs.models.Square(50))
            .layer('square')
            .addCaption('fold here', [0, 0], [50, 50])
            .addTo(model, 'square');
        model.models.square.caption.anchor.layer = "square_caption";
        const svg = makerjs.exporter.toSVG(model, exportOptions);
        
        // Check for important parts rather than exact match
        assert.ok(svg.indexOf('id="square"') > 0, 'should have square id');
        assert.ok(svg.indexOf('fill="#999"') > 0, 'should have square fill color');
        assert.ok(svg.indexOf('fill-opacity: 0.2') > 0, 'should have square opacity');
        assert.ok(svg.indexOf('class="square"') > 0, 'should have square class');
        assert.ok(svg.indexOf('stroke="red"') > 0, 'should have caption stroke color');
        assert.ok(svg.indexOf('id="captions"') > 0, 'should have captions group');
        assert.ok(svg.indexOf('fold here') > 0, 'should have caption text');
    });
});
