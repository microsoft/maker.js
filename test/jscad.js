var assert = require('assert');
var makerjs = require('../index.js')

describe('jscad', function () {

    it('can convert to jscad CAG', function () {

        var { CAG } = require('@jscad/csg');
        var model = new makerjs.models.Ellipse(70, 40);
        var cag = makerjs.exporter.toJscadCAG(CAG, model, 1);

        assert.ok(cag);
    });

});
