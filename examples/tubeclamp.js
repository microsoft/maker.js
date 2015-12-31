var makerjs = require('./../target/js/node.maker.js');

function tubeClamp(tubediameter, thickness, distance, open, wing, lid, lidclearance) {

    this.paths = {};
    this.models = {};

    var line = makerjs.paths.Line;
    var arc = makerjs.paths.Arc;
    var point = makerjs.point;

    var radius = tubediameter / 2;
    var d2 = distance / 2;
    var t2 = thickness / 2;
    var cy = distance + radius;
    var outer = radius + wing;
    var mtop = distance + tubediameter - open;
    var drop = 0;//radius / 4;

    var z = Math.max(thickness + .125 - radius, 0);
    var bottom = Math.max(radius, thickness * 1.2);

    //this.paths.push(new makerjs.paths.Circle('tube', [0, cy], radius));

    var thicknessAngle = 360 - makerjs.angle.toDegrees(Math.acos(t2 / radius));
    var arc1 = new arc([0, cy], radius, thicknessAngle, 0);
    var arc1Points = point.fromArc(arc1);

    var halfBody = {
        models: {
            scurve: makerjs.model.move(new makerjs.models.SCurve(wing - (bottom - radius), cy - drop), [bottom, 0])
        },
        paths: {
            bottom: new line([0, 0], [bottom, 0]),
            //new line('longslope', [radius, 0], [outer, cy - drop]),
            crux: new line([outer, cy - drop], [outer, mtop]),
            flat: new line([outer, mtop], [radius, mtop]),
            wall: new line([radius, mtop], [radius, cy]),
            arc: arc1,
            boxside: new line(arc1Points[0], [t2, d2]),
            boxottom: new line([0, d2], [t2, d2])
        }
    };

    halfBody.paths.dogbone = makerjs.path.dogbone(halfBody.paths.boxottom, halfBody.paths.boxside, .03);

    var lidAngle = makerjs.angle.toDegrees(Math.acos((radius - lidclearance) / radius));
    var arc2 = new arc([0, -radius], radius, lidAngle, 90);
    var arc2Points = point.fromArc(arc2);

    var halfLid = new makerjs.models.ConnectTheDots(false, [arc2Points[0], [arc2Points[0][0], 0], [outer, 0], [outer, lid], [0, lid]]);
    halfLid.paths['lid'] = arc2;

    var lid = {
        id: 'lid',
        //                origin: [ 0, cy + radius - arc2Points[0].y - open ],
        origin: [0, cy + radius],
        models: {
            halflid: halfLid, 
            halfLidMirror: makerjs.model.mirror(halfLid, true, false)
        }
    };

    var body = {
        models: {'halfBody': halfBody, 'mirror': makerjs.model.mirror(halfBody, true, false)}
    };

    this.models.body = body;
    this.models.lid = lid;

    this.units = makerjs.unitType.Inch;
    this.origin = [0, -cy];
};

tubeClamp.metaParameters = [
    { title: "tubediameter", type: "range", min: .5, max: 3, step: .0625, value: 0.875 },
    { title: "thickness", type: "range", min: .125, max: 1, step: .0625, value: .5 },
    { title: "distance", type: "range", min: .25, max: 2, step: .125, value: 1 },
    { title: "open", type: "range", min: 0, max: .25, step: .0625, value: .0625 },
    { title: "wing", type: "range", min: .25, max: 1.5, step: .0625, value: .5 },
    { title: "lid", type: "range", min: .125, max: .75, step: .0625, value: .25 },
    { title: "lidclearance", type: "range", min: 0, max: .13, step: .01, value: .01 }
];

module.exports = tubeClamp;
