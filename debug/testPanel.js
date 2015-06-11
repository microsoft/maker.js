Viewer.Params = {
    count: { type: "range", min: 1, max: 10, step: 1, value: 1 },
    height: { type: "range", min: 1, max: 7, step: .1, value: 3 },
    width: { type: "range", min: 1, max: 7, step: .1, value: 4 },
    radius: { type: "range", min: 0, max: 2, step: .1, value: .25 },
    angle: { type: "range", min: -90, max: 90, step: 2.5, value: 0 }
};

Viewer.Render = function (params) {

    function myModelFactory() {

        this.paths = [];
        this.models = [];

        var circle = makerjs.createCircle('c1', [0, 0], Math.min(params.height, params.width) / 2 - .5);

        if (params.radius < 0.5) {
            this.models.push(makerjs.model.move(new makerjs.models.BoltRectangle(params.width - .4, params.height - .4, .07), [.2, .2]));
        }

        this.paths.push(makerjs.path.moveRelative(circle, [params.width / 2, params.height / 2]));

        this.models.push(new makerjs.models.RoundRectangle(params.width, params.height, params.radius));

        this.models.push(makerjs.model.move(new makerjs.models.BoltCircle(circle.radius + 0.25, .05, 6), [params.width / 2, params.height / 2]));

        makerjs.model.rotate(this, params.angle, makerjs.point.zero());
    }

    //modeling
    var myModel = {
        units: makerjs.unitType.Inch,
        models: [new myModelFactory()]
    };

    var m = makerjs.measure.modelExtents(myModel.models[0]);
    var x = m.high[0] - m.low[0] + .025;

    for (var i = 1; i < params.count; i++) {
        myModel.models.push(makerjs.model.move(new myModelFactory(), [x * i, 0]));
    }

    return myModel;
}