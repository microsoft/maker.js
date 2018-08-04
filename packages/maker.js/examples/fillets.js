var makerjs = require('./../target/js/node.maker.js');

function fillets(radius) {
    var Line = makerjs.paths.Line;
    var Arc = makerjs.paths.Arc;
    var fillet = makerjs.path.fillet;

    this.paths = {};

    this.paths.line0 = new Line([0, 0], [-75, 0]);
    this.paths.arc1 = new Arc([-50, 0], 50, 0, 90);

    this.paths.line1 = new Line([0, 0], [50, 0]);
    this.paths.fillet1 = fillet(this.paths.line1, this.paths.arc1, radius);

    this.paths.arc2 = new Arc([0, 0], 50, 0, 90);
    this.paths.fillet2 = fillet(this.paths.line1, this.paths.arc2, radius);

    this.paths.arc3 = new Arc([0, 50], 50, 180, 270);
    this.paths.fillet0 = fillet(this.paths.line0, this.paths.arc3, radius);
    this.paths.fillet3 = fillet(this.paths.arc1, this.paths.arc3, radius);

    this.paths.arc4 = new Arc([0, 100], 50, 270, 90);
    this.paths.fillet4 = fillet(this.paths.arc2, this.paths.arc4, radius);

    this.paths.arc5 = new Arc([-75, 150], 75, 270, 0);
    this.paths.fillet5 = fillet(this.paths.arc4, this.paths.arc5, radius);

    this.paths.line2 = new Line([-75, 0], [-75, 75]);
    this.paths.fillet6 = fillet(this.paths.line0, this.paths.line2, radius);
    this.paths.fillet7 = fillet(this.paths.line2, this.paths.arc5, radius);

    this.paths.line3 = new Line([25, 90], [50, 90]);
    this.paths.line4 = new Line([25, 110], [50, 110]);
    this.paths.line5 = new Line(makerjs.point.clone(this.paths.line3.origin), makerjs.point.clone(this.paths.line4.origin));

    this.paths.dogbone1 = makerjs.path.dogbone(this.paths.line3, this.paths.line5, radius);
    this.paths.dogbone2 = makerjs.path.dogbone(this.paths.line4, this.paths.line5, radius);

    var intersect3 = makerjs.path.intersection(this.paths.line3, this.paths.arc4);
    var intersect4 = makerjs.path.intersection(this.paths.line4, this.paths.arc4);

    this.paths.line3.end = intersect3.intersectionPoints[0];
    this.paths.line4.end = intersect4.intersectionPoints[0];

    this.paths.arc6 = makerjs.cloneObject(this.paths.arc4);
    this.paths.arc6.startAngle = intersect4.path2Angles[0];

    this.paths.arc4.endAngle = intersect3.path2Angles[0];

}

fillets.metaParameters = [
    { title: "fillet radius", type: "range", min: 0, max: 20, step: 0.2, value: 3 }
];

module.exports = fillets;