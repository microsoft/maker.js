var assert = require('assert');
var makerjs = require('../dist/index.js');

describe('Importer', function () {
    it("should parse a numeric list", () => {
        var numlist = makerjs.importer.parseNumericList('5, 10, 15.20  25-30-35 4e1 .5,.4.2-3.7-.1');
        var expected = [5, 10, 15.2, 25, -30, -35, 40, 0.5, 0.4, 0.2, -3.7, -0.1];
        assert.equal(numlist.length, expected.length);
        for (let a = 0; a < numlist.length; a++){
            assert.equal(numlist[a], expected[a]);
        }
    });

    it("should import SVG lines", () => {
        var pathData = [
            "m50-60 10 30L150-90l-85 45ZM40-20h60v-60h-60Z",
            "M50-60 60-30L150-90 65-45ZM40-20H100V-80H40Z",
            "M50-60L60-30 150-90l-85 45Zm-10 40h60v-60h-60Z",
            "M50-60l10 30 90-60L65-45Zm-10 40H100V-80H40Z"
        ];
   
        var expected = JSON.stringify({
            paths: {
                p_1: new makerjs.paths.Line([50, 60], [60, 30]),
                p_2: new makerjs.paths.Line([60, 30], [150, 90]),
                p_3: new makerjs.paths.Line([150, 90], [65, 45]),
                p_4: new makerjs.paths.Line([65, 45], [50, 60]),
                p_5: new makerjs.paths.Line([40, 20], [100, 20]),
                p_6: new makerjs.paths.Line([100, 20], [100, 80]),
                p_7: new makerjs.paths.Line([100, 80], [40, 80]),
                p_8: new makerjs.paths.Line([40, 80], [40, 20])
            }
        });
        var line;
        for (let a = 0; a < pathData.length; a++) {
            line = makerjs.importer.fromSVGPathData(pathData[a]);
            assert.equal(JSON.stringify(line), expected);
        }
    });

    it("should import SVG arcs", () => { 
        var pathData = [
            "M100-50A50 50 0 0 0 50-100A20 20 0 0 1 30-120Z",
            "M100-50A50 50 0 0 0 50-100 20 20 0 0 1 30-120Z",
            "M100-50a50 50 0 0 0 -50-50a20 20 0 0 1 -20-20Z",
            "M100-50a50 50 0 0 0 -50-50 20 20 0 0 1 -20-20Z"
        ];
        var expected = JSON.stringify({
            paths: {
                p_1: new makerjs.paths.Arc([100, 50], [50, 100], 50, false, false),
                p_2: new makerjs.paths.Arc([30, 120], [50, 100], 20, false, false),
                p_3: new makerjs.paths.Line([30, 120], [100, 50])
            }
        });
        var arc;
        for (let a = 0; a < pathData.length; a++) {
            arc = makerjs.importer.fromSVGPathData(pathData[a]);
            assert.ok(makerjs.isPathArc(arc.paths.p_1));
            assert.ok(makerjs.isPathArc(arc.paths.p_2));
            assert.equal(JSON.stringify(arc), expected);
        }
    });

    it("should import degenerate SVG arcs", () => {
        let pathData = "M60 -60 A 10 10 0 0 0 60 -60 Z"
        let expected = JSON.stringify({
            paths: {
                p_1: new makerjs.paths.Arc([60, 60], [60, 60], 10, false, false),
            }
        })
        let arc = makerjs.importer.fromSVGPathData(pathData);
        assert.ok(makerjs.isPathArc(arc.paths.p_1));
        assert.equal(JSON.stringify(arc), expected)
    })

    it("should import SVG elliptic arcs", () => {
        var pathData = [
            "M100-50A50 30 0 0 0 50-80A20 40 0 0 1 30-120Z",
            "M100-50A50 30 0 0 0 50-80 20 40 0 0 1 30-120Z",
            "M100-50a50 30 0 0 0 -50-30a20 40 0 0 1 -20-40Z",
            "M100-50a50 30 0 0 0 -50-30 20 40 0 0 1 -20-40Z"
        ];
        var curve = [];
        for (let a = 0; a < pathData.length; a++) {
            curve[a] = makerjs.importer.fromSVGPathData(pathData[a]);
            assert.ok(makerjs.isModel(curve[a].models.p_1));
            assert.ok(makerjs.isModel(curve[a].models.p_2));            
        }
        assert.equal(JSON.stringify(curve[0]), JSON.stringify(curve[1]));
        assert.equal(JSON.stringify(curve[0]), JSON.stringify(curve[2]));
        assert.equal(JSON.stringify(curve[0]), JSON.stringify(curve[3]));
    });

    it("should import SVG cubic bezier curves", () => {
        var pathData = [
            "M50 0C-20-30 0-115 50-75C100-115 120-30 50 0Z",
            "M50 0C-20-30 0-115 50-75 100-115 120-30 50 0Z",
            "M50 0c-70-30-50-115 0-75c50-40 70 45 0 75Z",
            "M50 0c-70-30-50-115 0-75 50-40 70 45 0 75Z"
        ];
        var curve = [];
        for (let a = 0; a < pathData.length; a++) {
            curve[a] = makerjs.importer.fromSVGPathData(pathData[a]);
            assert.ok(makerjs.isModel(curve[a].models.p_1));
            assert.ok(makerjs.isModel(curve[a].models.p_2));
        }
        assert.equal(JSON.stringify(curve[0]), JSON.stringify(curve[1]));
        assert.equal(JSON.stringify(curve[0]), JSON.stringify(curve[2]));
        assert.equal(JSON.stringify(curve[0]), JSON.stringify(curve[3]));
    });

    it("should import SVG quadratic bezier curves", () => {
        var pathData = [
            "M10-80Q52.5-150, 95-80Q137.5-10 180-80T265-80T350-80Z",
            "M10-80Q52.5-150, 95-80 137.5-10 180-80T265-80 350-80Z",
            "M10-80q42.5-70, 85 0q42.5 70 85 0t85 0t85 0Z",
            "M10-80q42.5-70, 85 0 42.5 70 85 0t85 0 85 0Z"
        ];
        var curve = [];
        for (let a = 0; a < pathData.length; a++) {
            curve[a] = makerjs.importer.fromSVGPathData(pathData[a]);
            assert.ok(makerjs.isModel(curve[a].models.p_1));
            assert.ok(makerjs.isModel(curve[a].models.p_2));
            assert.ok(makerjs.isModel(curve[a].models.p_3));
            assert.ok(makerjs.isModel(curve[a].models.p_4));
        }
        assert.equal(JSON.stringify(curve[0]), JSON.stringify(curve[1]));
        assert.equal(JSON.stringify(curve[0]), JSON.stringify(curve[2]));
        assert.equal(JSON.stringify(curve[0]), JSON.stringify(curve[3]));
    });
});