var makerjs = require('makerjs');

function Bows(columns, column) {
    this.paths = {};
    var offset = (columns % 2) / 2;	//this will be 0 for even, 0.5 for odd
    for (var i = 1; i < columns / 2; i++) {
        var arc = new makerjs.paths.Arc([0, 0], (i - offset) * column, 0, 180);
        this.paths["bow" + i] = arc;
    }
}

function Spines(spines, innerRadius, outerRadius) {
    this.paths = {};
    if (innerRadius === outerRadius) innerRadius = 0;
    for (var i = 1; i < spines; i++) {
        var a = (180 / spines) * i;
        var line = new makerjs.paths.Line([innerRadius, 0], [outerRadius, 0]);
        makerjs.path.rotate(line, a);
        this.paths["spine" + i] = line;
    }
}

function Wireframe(columns, column, extra, radius, split) {
    this.paths = {
        bottom: new makerjs.paths.Line([-radius, 0], [radius, 0])
    };
    this.models = {
        bows: new Bows(columns, column),
        spines: new Spines(columns + (+extra), columns % 2 ? column / 2 : column, radius)
    };
    if (split && columns > 3 && columns % 2 === 0) {
        this.paths.split = new makerjs.paths.Line([0, 0], [0, column]);
    }
}

function WindowArch(width, columns, extra, split, spacing, fillet) {
    var radius = width / 2;
    var column = (width + spacing) / columns;
    var dome = new makerjs.models.Dome(width, radius);
    var wireframe = new Wireframe(columns, column, extra, radius, split);
    var frame = makerjs.model.expandPaths(wireframe, spacing / 2);
    this.models = {
        dome: dome,
        frame: frame
    };
    makerjs.model.combineSubtraction(dome, frame);
    //need to simplify to get the maximum fillets
    makerjs.model.simplify(this);
    var chains = makerjs.model.findChains(this);
    chains.forEach(function (chain, i) {
        var fillets = makerjs.chain.fillet(chain, fillet);
        if (!fillets) return;
        frame.models["fillets" + i] = fillets;
    });
}

WindowArch.metaParameters = [
    { title: "width", type: "range", min: 12, max: 500, value: 200 },
    { title: "columns", type: "range", min: 1, max: 10, value: 6 },
    { title: "extra wedge", type: "bool", value: false },
    { title: "split central dome on even columns", type: "bool", value: false },
    { title: "spacing", type: "range", min: 0.5, max: 10, value: 2, step: 0.5 },
    { title: "fillet", type: "range", min: 0, max: 10, value: 1, step: 0.5 }
];

module.exports = WindowArch;
