var makerjs = require('../target/js/node.maker.js');

function logo(or, ir, ear, outline, mHeight, serifHeight, speed, drop, columnWidth, spacing, step) {

    var point = makerjs.point;
    var path = makerjs.path;
    var paths = makerjs.paths;
    var tools = makerjs.tools;

    function bend(id, r, bendTop, x, trimTo, outer) {

        outer = outer || 0;

        var hguide = new paths.Line('hguide', [0, bendTop - r], [100, bendTop - r]);
        var vguide = path.rotate(new paths.Line('vguide', [x, 0], [x, 100]), -speed, [x, 0]);
        var intersectionPoint = tools.pathIntersection(hguide, vguide).intersectionPoints[0];
        var center = point.subtract(intersectionPoint, [tools.solveTriangleASA(90, speed, r), 0]);

        var arc = new paths.Arc('arc', center, r + outer, - speed, 90 + drop);

        this.arc = arc;

        this.Horizontal = path.rotate(
                new paths.Line('Horizontal', [-10, arc.origin[1] + r + outer], point.add(arc.origin, [0, r + outer])),
                drop,
                arc.origin
            );
        
        if (!outer) {
            trimLine(this.Horizontal, 'origin', trimTo);
        }

        var arcPoints = point.fromArc(arc);

        this.Vertical = new paths.Line('Vertical', [x + tools.solveTriangleASA(90, speed, outer), 0], arcPoints[0]);

        if (!outer) {
            trimLine(this.Vertical, 'origin', bottomGuide);
        }

        this.id = id;
        this.paths = [arc, this.Horizontal, this.Vertical];
    }

    function leg(id, legTop, xOffset, trimTo) {

        this.b1 = new bend(id + 'b1', ir, outline + legTop - serifHeight, speedOutline + xOffset, trimTo);
        this.b2 = new bend(id + 'b2', or, outline + legTop, speedOutline + columnWidth + xOffset, trimTo);
        this.b3 = new bend(id + 'b3', or, outline + legTop, speedOutline + columnWidth + xOffset, trimTo, outline);

        this.id = id;
        this.models = [
            this.b1, this.b2, this.b3
        ];

        this.paths = [
            new paths.Line('legBottom', point.clone(this.b1.Vertical.origin), point.clone(this.b2.Vertical.origin))
        ];
    }

    var speedOutline = tools.solveTriangleASA(90, speed, outline);

    var bottomGuide = new paths.Line('bottomGuide', [0, outline], [100, outline]);

    var earline = path.rotate(new paths.Line('earline', [-ear, 0], [-ear, 100]), -speed, [-ear, 0]);

    var leg1 = new leg('leg1', mHeight, 0, earline);
    var leg2 = new leg('leg2', mHeight - step, columnWidth + spacing, leg1.b2.Vertical);
    var leg3 = new leg('leg3', mHeight - 2 * step, 2 * (columnWidth + spacing), leg2.b2.Vertical);

    var outBottom = new paths.Line('outBottom', [0, 0], point.clone(leg3.b3.Vertical.origin));

    var earPivot = leg1.b1.Horizontal.origin;
    var earH = path.rotate(new paths.Line('earH', point.subtract(earPivot, [100, outline]), point.subtract(earPivot, [-100, outline])), drop, earPivot);
    var outHome = trimLine(path.rotate(new paths.Line('outHome', [0, 0], [0, 100]), -speed, [0, 0]), 'end', earH);
    var earOutline = trimLine(path.rotate(new paths.Line('earOutline', [-ear - speedOutline, 0], [-ear - speedOutline, 100]), -speed, [-ear - speedOutline, 0]), 'origin', earH);

    trimLines(earOutline, 'end', leg1.b3.Horizontal, 'origin');

    trimBends(leg1.b3, leg2.b3);
    trimBends(leg2.b3, leg3.b3);

    this.paths = [
        new paths.Line('ear', point.clone(leg1.b1.Horizontal.origin), point.clone(leg1.b2.Horizontal.origin)),
        new paths.Line('leg1bottom', point.clone(leg1.b2.Vertical.origin), point.clone(leg2.b1.Horizontal.origin)),
        new paths.Line('leg2bottom', point.clone(leg2.b2.Vertical.origin), point.clone(leg3.b1.Horizontal.origin)),

        outHome,
        earOutline,
        new paths.Line('earOutH', point.clone(earOutline.origin), point.clone(outHome.end)),
        outBottom
    ];

    this.models = [
        leg1, leg2, leg3,
    ];

    leg1.b2.Vertical.origin = point.clone(leg2.b2.Horizontal.origin);
    leg2.b2.Vertical.origin = point.clone(leg3.b2.Horizontal.origin);
}

function trimLine(line, propertyName, trimToPath) {
    var intersection = makerjs.tools.pathIntersection(line, trimToPath);
    if (intersection) {
        line[propertyName] = intersection.intersectionPoints[0];
    }
    return line;
}

function trimLines(line1, propertyName1, line2, propertyName2) {
    var intersection = makerjs.tools.pathIntersection(line1, line2);
    if (intersection) {
        line1[propertyName1] = intersection.intersectionPoints[0];
        line2[propertyName2] = intersection.intersectionPoints[0];
    }
    return intersection;
}

function trimBends(b1, b2) {
    var intersection = trimLines(b1.Vertical, 'origin', b2.Horizontal, 'origin');
    if (intersection) return;

    intersection = makerjs.tools.pathIntersection(b1.arc, b2.Horizontal);
    if (intersection) {
        b1.arc.startAngle = intersection.path1Angles[0];
        b2.Horizontal.origin = intersection.intersectionPoints[0];
        makerjs.removeById(b1.paths, 'Vertical');
        return;
    }

    intersection = makerjs.tools.pathIntersection(b1.arc, b2.arc);
    if (intersection) {
        b1.arc.startAngle = intersection.path1Angles[0];
        b2.arc.endAngle = intersection.path2Angles[0];
        makerjs.removeById(b1.paths, 'Vertical');
        makerjs.removeById(b2.paths, 'Horizontal');
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
