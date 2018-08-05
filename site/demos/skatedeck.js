var makerjs = require('./../target/js/node.maker.js');

function truckBolts() {
    var tx = 1 + 5 / 8;
    var ty = 1 + 1 / 8;
    var bolts = new makerjs.models.BoltRectangle(tx, ty, 7 / 32 / 2);
    bolts.origin = [tx / -2, ty / -2];

    this.units = makerjs.unitType.Inch;
    this.models = {
        bolts: bolts
    };
}

function skatedeck(width, length, truckOffset) {
    
    this.units = makerjs.unitType.Centimeter;

    var board = new makerjs.models.Oval(length, width);
    board.origin = [0, width / -2];

    var truck1 = makerjs.model.convertUnits(new truckBolts(), this.units);
    truck1.origin = [truckOffset, 0];

    var truck2 = makerjs.model.convertUnits(new truckBolts(), this.units);
    truck2.origin = [length - truckOffset, 0];

    this.models = {
        board:board, truck1: truck1, truck2: truck2
    };
}

skatedeck.metaParameters = [
    { title: "width", type: "range", min: 12, max: 25, value: 20 },
    { title: "length", type: "range", min: 40, max: 120, value: 80 },
    { title: "truck offset", type: "range", min: 4, max: 20, value: 18 },
];

module.exports = skatedeck;
