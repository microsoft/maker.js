var makerjs = require('makerjs');

function RawTooth(a, radius, pitch, roller) {
    var points = [
        [0, radius],
        makerjs.point.fromPolar(makerjs.angle.toRadians(a), radius)
    ];

    var l = new makerjs.paths.Line(points);
    var al = makerjs.angle.ofLineInDegrees(l);
    var toothRadius = pitch - roller / 2;

    var tooth0 = new makerjs.paths.Arc(points[0], toothRadius, 0, al);
    var tooth1 = new makerjs.paths.Arc(points[1], toothRadius, al + 180, a);

    var int = makerjs.path.intersection(tooth0, tooth1);

    tooth0.startAngle = int.path1Angles[0];
    tooth1.endAngle = int.path2Angles[0];

    this.paths = {
        tooth0: tooth0,
        tooth1: tooth1,
        seat: new makerjs.paths.Arc([radius, 0], roller / 2, al, makerjs.angle.mirror(al, false, true))
    };
}

function Sprocket(n, pitch, roller) {
    var a = 360 / n;
    var radius = pitch / (2 * Math.sin(Math.PI / n));
    var tooth = new RawTooth(a, radius, pitch, roller);
    this.models = makerjs.layout.cloneToRadial(tooth, n, a).models;
    var cr = new makerjs.paths.Circle(radius + roller / 2);
    var c = {
        paths: {
            cr: cr
        }
    };

    makerjs.model.combineIntersection(c, this);

    this.models.c = c;
}

Sprocket.metaParameters = [
    { title: 'number of teeth', type: 'range', min: 3, max: 100, value: 11 },
    { title: 'pitch', type: 'range', min: 0.25, max: 1, value: 0.5 },
    { title: 'roller diameter', type: 'range', min: 0.05, max: 1, value: 5 / 16 }
];

module.exports = Sprocket;