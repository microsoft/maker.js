var assert = require('assert');
var makerjs = require('../dist/index.js')

describe('Outline', function () {

    it('should inset twice', function () {
        var ellipse = new makerjs.models.Ellipse(100, 100);
        var insettedEllipse = makerjs.model.outline(ellipse, 5, 1, true);
        var insettedEllipse2 = makerjs.model.outline(insettedEllipse, 5, 1, true);

        var model = { models: { ellipse, insettedEllipse, insettedEllipse2 } };
        var chains = makerjs.model.findChains(model);

        assert.equal(chains.length, 3);
    });

    it('should bevel', function () {
        var star = makerjs.model.rotate(new makerjs.models.Star(5, 100), 18);
        var rounded = makerjs.model.expandPaths(star, 10, 0);
        var pointed = makerjs.model.expandPaths(star, 10, 1);
        var beveled = makerjs.model.expandPaths(star, 10, 2);

        var model = {
            models: {
                star: star,
                rounded: makerjs.model.move(rounded, [240, 0]),
                pointed: makerjs.model.move(pointed, [480, 0]),
                beveled: makerjs.model.move(beveled, [720, 0])

            }
        };

        var chains = makerjs.model.findChains(model);
        assert.equal(chains.length, 7);
    })
});
