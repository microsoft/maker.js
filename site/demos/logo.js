var makerjs = require('./../target/js/node.maker.js');

function logo(or, ir, ear, outline, mHeight, serifHeight, speed, drop, columnWidth, spacing, step) {

    var point = makerjs.point;
    var path = makerjs.path;
    var paths = makerjs.paths;

    function bend(r, bendTop, x, trimTo, outer) {

        outer = outer || 0;

        var hguide = new paths.Line([0, bendTop - r], [100, bendTop - r]);
        var vguide = path.rotate(new paths.Line([x, 0], [x, 100]), -speed, [x, 0]);
        var intersectionPoint = path.intersection(hguide, vguide).intersectionPoints[0];
        var center = point.subtract(intersectionPoint, [makerjs.solvers.solveTriangleASA(90, r, speed), 0]);

        var arc = new paths.Arc(center, r + outer, - speed, 90 + drop);

        var Horizontal = path.rotate(
                new paths.Line([-10, arc.origin[1] + r + outer], point.add(arc.origin, [0, r + outer])),
                drop,
                arc.origin
            );
        
        if (!outer) {
            trimLine(Horizontal, 'origin', trimTo);
        }

        var arcPoints = point.fromArc(arc);

        var Vertical = new paths.Line([x + makerjs.solvers.solveTriangleASA(90, outer, speed), 0], arcPoints[0]);

        if (!outer) {
            trimLine(Vertical, 'origin', bottomGuide);
        }

        this.paths = {
            arc: arc,
            Horizontal: Horizontal,
            Vertical: Vertical
        };
    }

    function leg(legTop, xOffset, trimTo) {

        this.models = {
            b1: new bend(ir, outline + legTop - serifHeight, speedOutline + xOffset, trimTo),
            b2: new bend(or, outline + legTop, speedOutline + columnWidth + xOffset, trimTo),
            b3: new bend(or, outline + legTop, speedOutline + columnWidth + xOffset, trimTo, outline)
        };

        this.paths = {
            legBottom: new paths.Line(this.models.b1.paths.Vertical.origin, this.models.b2.paths.Vertical.origin)
        };
    }

    var speedOutline = makerjs.solvers.solveTriangleASA(90, outline, speed);

    var bottomGuide = new paths.Line([0, outline], [100, outline]);

    var earline = path.rotate(new paths.Line([-ear, 0], [-ear, 100]), -speed, [-ear, 0]);

    var leg1 = new leg(mHeight, 0, earline);
    var leg2 = new leg(mHeight - step, columnWidth + spacing, leg1.models.b2.paths.Vertical);
    var leg3 = new leg(mHeight - 2 * step, 2 * (columnWidth + spacing), leg2.models.b2.paths.Vertical);

    var outBottom = new paths.Line([0, 0], leg3.models.b3.paths.Vertical.origin);

    var earPivot = leg1.models.b1.paths.Horizontal.origin;
    var earH = path.rotate(new paths.Line(point.subtract(earPivot, [100, outline]), point.subtract(earPivot, [-100, outline])), drop, earPivot);
    var outHome = trimLine(path.rotate(new paths.Line([0, 0], [0, 100]), -speed, [0, 0]), 'end', earH);
    var earOutline = trimLine(path.rotate(new paths.Line([-ear - speedOutline, 0], [-ear - speedOutline, 100]), -speed, [-ear - speedOutline, 0]), 'origin', earH);

    trimLines(earOutline, 'end', leg1.models.b3.paths.Horizontal, 'origin');

    trimBends(leg1.models.b3, leg2.models.b3);
    trimBends(leg2.models.b3, leg3.models.b3);

    this.paths = {
        ear: new paths.Line(leg1.models.b1.paths.Horizontal.origin, leg1.models.b2.paths.Horizontal.origin),
        leg1bottom: new paths.Line(leg1.models.b2.paths.Vertical.origin, leg2.models.b1.paths.Horizontal.origin),
        leg2bottom: new paths.Line(leg2.models.b2.paths.Vertical.origin, leg3.models.b1.paths.Horizontal.origin),
        outHome: outHome,
        earOutline: earOutline,
        earOutH: new paths.Line(earOutline.origin, outHome.end),
        outBottom: outBottom
    };

    this.models = {
        leg1: leg1,
        leg2: leg2,
        leg3: leg3
    };

    leg1.models.b2.paths.Vertical.origin = leg2.models.b2.paths.Horizontal.origin;
    leg2.models.b2.paths.Vertical.origin = leg3.models.b2.paths.Horizontal.origin;
}

function trimLine(line, propertyName, trimToPath) {
    var intersection = makerjs.path.intersection(line, trimToPath);
    if (intersection) {
        line[propertyName] = intersection.intersectionPoints[0];
    }
    return line;
}

function trimLines(line1, propertyName1, line2, propertyName2) {
    var intersection = makerjs.path.intersection(line1, line2);
    if (intersection) {
        line1[propertyName1] = intersection.intersectionPoints[0];
        line2[propertyName2] = intersection.intersectionPoints[0];
    }
    return intersection;
}

function trimBends(b1, b2) {
    var intersection = trimLines(b1.paths.Vertical, 'origin', b2.paths.Horizontal, 'origin');
    if (intersection) return;

    intersection = makerjs.path.intersection(b1.paths.arc, b2.paths.Horizontal);
    if (intersection) {
        b1.paths.arc.startAngle = intersection.path1Angles[0];
        b2.paths.Horizontal.origin = intersection.intersectionPoints[0];
        delete b1.paths.Vertical;
        return;
    }

    intersection = makerjs.path.intersection(b1.paths.arc, b2.paths.arc);
    if (intersection) {
        b1.paths.arc.startAngle = intersection.path1Angles[0];
        b2.paths.arc.endAngle = intersection.path2Angles[0];
        delete b1.paths.Vertical;
        delete b2.paths.Horizontal;
        return;
    }
}

logo.metaParameters = [
    { title: "outer radius", type: "range", min: 0, max: 1.7, step: .1, value: 1.06 },
    { title: "inner radius", type: "range", min: 0, max: .9, step: .1, value: .3 },
    { title: "ear", type: "range", min: .3, max: 2, step: .1, value: .35 },
    { title: "outline", type: "range", min: 0.2, max: 2, step: .1, value: 1.06 },
    { title: "m height", type: "range", min: 7, max: 10, step: .1, value: 8.3 },
    { title: "serif height", type: "range", min: .1, max: 1.9, step: .1, value: .65 },
    { title: "speed", type: "range", min: 0, max: 45, step: 1, value: 19.01 },
    { title: "drop", type: "range", min: 0, max: 12, step: 1, value: 1 },
    { title: "column width", type: "range", min: .4, max: 5, step: .1, value: 2.7 },
    { title: "spacing", type: "range", min: 1.3, max: 5, step: .1, value: 1.32 },
    { title: "step", type: "range", min: 1.5, max: 2.7, step: .1, value: 2.31 },
];

module.exports = logo;
