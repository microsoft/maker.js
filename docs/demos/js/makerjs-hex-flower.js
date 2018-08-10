var m = require("makerjs");

function Flower(hexWidth, margin) {

    this.models = {
        center: new m.models.Polygon(6, hexWidth / 2, 30, true)
    };

    for (var i = 0; i < 6; i++) {
        var leaf = m.cloneObject(this.models.center);
        m.model.moveRelative(leaf, [hexWidth + margin, 0]);
        m.model.rotate(leaf, i * 60);
        this.models['leaf' + i] = leaf;
    }
}

Flower.metaParameters = [
    { title: 'hexWidth', type: 'range', min: 1, max: 100, value: 20 },
    { title: 'margin', type: 'range', min: 0, max: 100, value: 1 }
];

module.exports = Flower;
