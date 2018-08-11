var assert = require('assert');
var makerjs = require('../dist/index.js')

describe('jscad', function () {

    it('can convert to jscad CAG', function () {

        var { CAG } = require('@jscad/csg');
        var model = new makerjs.models.Ellipse(70, 40);
        var cag = makerjs.exporter.toJscadCAG(CAG, model, 1);

        assert.ok(cag);
    });

    it('can reach 100% progress for jscad CAG subtractions', function () {

        var { CAG } = require('@jscad/csg');

        var model = {};
        for (let i = 1; i < 10; i++) {
            makerjs.$(new makerjs.models.Square(i * 10))
            .center()
            .addTo(model);
        }

        var progress = 0;

        function statusCallback(status) {
            progress = status.progress;
        }
        var cag = makerjs.exporter.toJscadCAG(CAG, model, { statusCallback });

        assert.equal(100, progress);
    });

});
