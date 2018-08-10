var makerjs = require('makerjs');

function Spiral(loops, startRadius, spacing) {

    if (spacing == 0) loops = 1;

    function revolution(r) {

        this.paths = {
            arc1: new makerjs.paths.Arc([0, 0], r, 0, 90),
            arc2: new makerjs.paths.Arc([0, -spacing], r + spacing, 90, 180),
            arc3: new makerjs.paths.Arc([2 * spacing, -spacing], r + 3 * spacing, 180, 270),
            arc4: new makerjs.paths.Arc([2 * spacing, 0], r + 4 * spacing, 270, 360)
        };

    }

    this.models = {};

    for (var i = 0; i < loops; i++) {
        this.models['loop' + i] = new revolution(startRadius + i * spacing * 6);
    }
}


Spiral.metaParameters = [
    { title: "loops", type: "range", min: 1, max: 60, step: 1, value: 9 },
    { title: "start radius", type: "range", min: 0, max: 50, step: .01, value: 0.33 },
    { title: "spacing", type: "range", min: 0, max: 5, step: .01, value: 1 }
];

module.exports = Spiral;
