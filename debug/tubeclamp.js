Viewer.Params = {
    tubediameter: { type: "range", min: .5, max: 3, step: .0625, value: 0.875 },
    thickness: { type: "range", min: .125, max: 1, step: .0625, value: .5 },
    distance: { type: "range", min: .25, max: 2, step: .125, value: 1 },
    open: { type: "range", min: 0, max: .25, step: .0625, value: .0625 },
    wing: { type: "range", min: .25, max: 1.5, step: .0625, value: .5 },
    lid: { type: "range", min: .125, max: .75, step: .0625, value: .25 },
    lidclearance: { type: "range", min: 0, max: .13, step: .01, value: .01 }
};

Viewer.Render = function (params) {

    function tubeClamp() {
        this.paths = [];
        this.models = [];

        var createLine = makerjs.createLine;
        var createArc = makerjs.createArc;
        var point = makerjs.point;

        var radius = params.tubediameter / 2;
        var d2 = params.distance / 2;
        var t2 = params.thickness / 2;
        var cy = params.distance + radius;
        var outer = radius + params.wing;
        var mtop = params.distance + params.tubediameter - params.open;
        var drop = 0;//radius / 4;

        var z = Math.max(params.thickness + .125 - radius, 0);
        var bottom = Math.max(radius, params.thickness * 1.2);

        //this.paths.push(makerjs.Path.CreateCircle('tube', [0, cy], radius));

        var thicknessAngle = 360 - makerjs.angle.toDegrees(Math.acos(t2 / radius));
        var arc1 = createArc('arc', [0, cy], radius, thicknessAngle, 0);
        var arc1Points = point.fromArc(arc1);

        var halfBody = {
            models: [
                makerjs.model.move(new makerjs.models.SCurve(params.wing - (bottom - radius), cy - drop), [bottom, 0])
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

        var lidAngle = makerjs.angle.toDegrees(Math.acos((radius - params.lidclearance) / radius));
        var arc2 = createArc('lid', [0, -radius], radius, lidAngle, 90);
        var arc2Points = point.fromArc(arc2);

        var halfLid = new makerjs.models.ConnectTheDots(false, [arc2Points[0], [arc2Points[0].x, 0], [outer, 0], [outer, params.lid], [0, params.lid]]);
        halfLid.paths.push(arc2);

        var lid = {
            //                origin: { x: 0, y: cy + radius - arc2Points[0].y - params.open },
            origin: { x: 0, y: cy + radius },
            models: [halfLid, makerjs.model.mirror(halfLid, true, false)]
        };

        var body = {
            models: [halfBody, makerjs.model.mirror(halfBody, true, false)]
        };

        this.models.push(body);
        this.models.push(lid);

        this.origin = { x: 0, y: -cy };
    }

    return new tubeClamp();
};