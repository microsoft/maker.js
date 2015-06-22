var makerjs = require('../target/node.maker.js');
var smile = require('./smile.js');
var m = require('./m.js');

function smileAndM(span, teeth, droop, dainty, gaze, heady, height, columnSpace, columnWidth, dropHigh, dropLow, dropConnect, innerSerifWidth, serifWidth, serifHeight) {

    this.id = 'smileAndM';

    var m1 = makerjs.model.flatten(new m(height, columnSpace, columnWidth, dropHigh, dropLow, dropConnect, innerSerifWidth, serifWidth, serifHeight));

    function smallSmile(origin) {
        var smile1 = makerjs.model.scale(new smile(span, teeth, droop, dainty, gaze, heady), .025);

        this.origin = origin;

        //assume the content of smile1
        this.paths = smile1.paths;
        this.models = smile1.models;
    }

    this.paths = [];
    this.models = [];

    var points = [];
    
    function getPointsFwd(model) {

        //don't get the first item, start at 1 instead of zero
        for (var i = 1; i < model.paths.length; i++) {
            points.push(model.paths[i].origin);
        }
        points.push(model.paths[i - 1].end);
    }

    function getPointsRev(model) {
        for (var i = model.paths.length - 1; i >= 0; i--) {
            points.push(model.paths[i].origin);
        }
    }

    getPointsFwd(m1.models[0]);
    getPointsRev(m1.models[1]);

    var paths = this.paths;
    var models = this.models;

    function gapCircle(aSmile, line) {
        var id = 'head';
        var found = makerjs.findById(aSmile.paths, id);
        if (!found) {
            id = 'head_1';
            found = makerjs.findById(aSmile.paths, id);
        }
        if (found) {
            var head = found.item;
            var pct = .5;
            var intersection = makerjs.tools.pathIntersection(head, line);
            if (intersection) {
                
                switch (head.type) {
                    case 'arc':
                        pct = (intersection.path1Angles[0] - head.startAngle) / makerjs.measure.arcAngle(head);
                        break;
                    case 'circle':
                        pct = intersection.path1Angles[0] / 360;
                        break;
                }
            }
            return makerjs.tools.gapPath(aSmile, id, .025, pct);
        }
    }

    function connectSmile(smileA, smileB) {
        var line = new makerjs.paths.Line('guide', smileA.point, smileB.point);
        var gapA = gapCircle(smileA.smile, line);
        var gapB = gapCircle(smileB.smile, line);
        if (gapA && gapB && gapA.length == 2 && gapB.length == 2) {
            var bridgeGaps = makerjs.tools.bridgeGaps(gapA, gapB);
            paths.push(bridgeGaps[0]);
            paths.push(bridgeGaps[1]);
        }
    }

    function addSmile(i) {
        var thiz = { 
            smile: makerjs.model.flatten(new smallSmile(points[i])),
            point: points[i] 
        };

        models.push(thiz.smile);

        if (prev) {
            connectSmile(prev, thiz);
        }

        prev = thiz;
        return thiz;
    }

    var prev;
    var first = addSmile(0);
    var last;

    for (var i = 1; i < points.length; i++) {
        last = addSmile(i);
    }

    connectSmile(last, first);

    this.units = makerjs.unitType.Inch;
}

smileAndM.metaParameters = smile.metaParameters.concat(m.metaParameters);

module.exports = smileAndM;

console.log('smileAndM is running!');

/*to make this run in the browser, use this command line (from the root of your git):
browserify -r ./examples/happyM.js:smileAndM > ./examples/smileAndM.js
*/