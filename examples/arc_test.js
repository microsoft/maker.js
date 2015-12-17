var arc_test = makerjs.models.OvalArc;

arc_test.metaParameters = [
    { title: "start angle", type: "range", min: -360, max: 360, step: 1, value: -180 },
    { title: "end angle", type: "range", min: -360, max: 360, step: 1, value: 170 },
    { title: "sweep", type: "range", min: 0, max: 100, step: 1, value: 50 },
    { title: "radius", type: "range", min: 0, max: 100, step: 1, value: 10 },
    { title: "self intersect", type: "bool", value: false }
];

module.exports = arc_test;
