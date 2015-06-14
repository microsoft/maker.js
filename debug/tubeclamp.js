Viewer.Constructor = function (tubediameter, thickness, distance, open, wing, lid, lidclearance) {

    this.paths = [];
    this.models = [];

    var createLine = makerjs.createLine;
    var createArc = makerjs.createArc;
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

    //this.paths.push(makerjs.Path.CreateCircle('tube', [0, cy], radius));

    var thicknessAngle = 360 - makerjs.angle.toDegrees(Math.acos(t2 / radius));
    var arc1 = createArc('arc', [0, cy], radius, thicknessAngle, 0);
    var arc1Points = point.fromArc(arc1);

    var halfBody = {
        id: 'halfBody',
        models: [
            makerjs.model.move(new makerjs.models.SCurve('scurve', wing - (bottom - radius), cy - drop), [bottom, 0])
        ],
        paths: [
            createLine('bottom', [0, 0], [bottom, 0]),
            //createLine('longslope', [radius, 0], [outer, cy - drop]),
            createLine('crux', [outer, cy - drop], [outer, mtop]),
            createLine('flat', [outer, mtop], [radius, mtop]),
            createLine('wall', [radius, mtop], [radius, cy]),
            arc1,
            createLine('boxside', arc1Points[0], [t2, d2]),
            createLine('boxottom', [0, d2], [t2, d2])
        ]
    };

    var lidAngle = makerjs.angle.toDegrees(Math.acos((radius - lidclearance) / radius));
    var arc2 = createArc('lid', [0, -radius], radius, lidAngle, 90);
    var arc2Points = point.fromArc(arc2);

    var halfLid = new makerjs.models.ConnectTheDots('halflid', false, [arc2Points[0], [arc2Points[0][0], 0], [outer, 0], [outer, lid], [0, lid]]);
    halfLid.paths.push(arc2);

    var lid = {
        id: 'lid',
        //                origin: [ 0, cy + radius - arc2Points[0].y - open ],
        origin: [0, cy + radius],
        models: [halfLid, makerjs.model.mirror(halfLid, true, false)]
    };

    var body = {
        id: 'body',
        models: [halfBody, makerjs.model.mirror(halfBody, true, false)]
    };

    this.models.push(body);
    this.models.push(lid);
    this.id = 'tubeclamp',
    this.origin = [0, -cy];
};

Viewer.Constructor.metaArguments = [
    {title:"tubediameter", type: "range", min: .5, max: 3, step: .0625, value: 0.875 },
    {title:"thickness",  type: "range", min: .125, max: 1, step: .0625, value: .5 },
    {title:"distance",  type: "range", min: .25, max: 2, step: .125, value: 1 },
    {title:"open",  type: "range", min: 0, max: .25, step: .0625, value: .0625 },
    {title:"wing",  type: "range", min: .25, max: 1.5, step: .0625, value: .5 },
    {title:"lid",  type: "range", min: .125, max: .75, step: .0625, value: .25 },
    {title:"lidclearance",  type: "range", min: 0, max: .13, step: .01, value: .01 }
];
