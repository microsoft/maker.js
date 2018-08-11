var makerjs = require('./../target/js/node.maker.js');

function combine(angle, add) {

    var star1 = new makerjs.models.Oval(50, 100);

    makerjs.model.walkPaths(star1, function (modelContext, pathId, path) {
        delete modelContext.paths[pathId];
        modelContext.paths['star1' + pathId] = path;
    });

    //delete star1.paths.ShapeLine2;
    //delete star1.paths.ShapeLine3;
    //delete star1.paths.ShapeLine4;
    //delete star1.paths.ShapeLine5;
    //delete star1.paths.ShapeLine6;
    //delete star1.paths.ShapeLine7;
    //delete star1.paths.ShapeLine8;
    //delete star1.paths.ShapeLine9;

    //star1.paths.c = new makerjs.paths.Line(star1.paths.ShapeLine10.origin, star1.paths.ShapeLine1.end);

    var star2 = new makerjs.models.Oval(50, 100);

    star1.origin = [-25, -25];
    star2.origin = [-25, -25];

    makerjs.model.rotate(star2, angle);

    this.models = {
        star1: star1,
        star2: star2
    };

    makerjs.model.combine(star1, star2, false, true, !add, add, add);
}

combine.metaParameters = [
    { title: "angle", type: "range", min: -180, max: 180, step: 1, value: 40 },
    { title: "add", type: "bool", value: true }
];


module.exports = combine;