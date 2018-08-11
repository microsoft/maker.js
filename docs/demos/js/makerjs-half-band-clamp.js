var makerjs = require('makerjs');

function HalfBandClamp(radius, band, tabWidth, tabHeight, gap) {

    function angleAtY(y, r) {
        var result = {
            radians: Math.asin(y / r)
        };
        result.degrees = makerjs.angle.toDegrees(result.radians); 
        return result;
    }
    
    var outerRadius = radius + band;

    gap = Math.min(gap || 0, radius);
    tabHeight = Math.min(tabHeight || band, outerRadius - gap);

    var innerAngle = angleAtY(gap, radius);
    var outerAngle = angleAtY(gap + tabHeight, outerRadius);
    
    this.paths = {
        bandInner: new makerjs.paths.Arc([0, 0], radius, innerAngle.degrees, 180),
        bandOuter: new makerjs.paths.Arc([0, 0], outerRadius, outerAngle.degrees, 180),
        bandCap: new makerjs.paths.Line([-radius - band, 0], [-radius, 0])
    };

    var tabTopOrigin = [Math.cos(outerAngle.radians) * outerRadius, gap + tabHeight];
    var tabBottomOrigin = [Math.cos(innerAngle.radians) * radius, gap];
    var tabMin = Math.max(tabTopOrigin[0], tabBottomOrigin[0]);
    var tabTopEnd = [tabMin + tabWidth, gap + tabHeight];
    var tabBottomEnd = [tabTopEnd[0], gap];

    this.paths.tabOuter = new makerjs.paths.Line(tabTopOrigin, tabTopEnd);
    this.paths.tabInner = new makerjs.paths.Line(tabBottomOrigin, tabBottomEnd);
    this.paths.tabCap = new makerjs.paths.Line(tabTopEnd, tabBottomEnd);
}

HalfBandClamp.metaParameters = [
    { title: "radius", type: "range", min: 2, max: 100, step: 1, value: 100 },
    { title: "band", type: "range", min: 1, max: 50, step: 1, value: 10 },
    { title: "tab width", type: "range", min: 1, max: 100, step: 1, value: 50 },
    { title: "tab height", type: "range", min: 1, max: 150, step: 1, value: 10 },
    { title: "gap", type: "range", min: 0, max: 100, step: 1, value: 0 }
];

module.exports = HalfBandClamp;
