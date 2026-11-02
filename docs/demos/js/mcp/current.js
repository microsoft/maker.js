var makerjs = require('makerjs');

function Wardrobe(totalW, totalH, baseH, topH, thk, depth, spacing) {
    this.models = {};

    var mainH = totalH - baseH - topH;
    var halfW = totalW / 2;

    function makeRect(w, h, layer) {
        var m = new makerjs.models.Rectangle(w, h);
        if (layer) m.layer = layer;
        return m;
    }

    function makePanel(x, y, w, h, layer) {
        var p = makeRect(w, h, layer);
        return makerjs.model.move(p, [x, y]);
    }

    var front = { models: {}, paths: {} };

    front.models.base = makePanel(0, 0, totalW, baseH);
    front.models.body = makePanel(0, baseH, totalW, mainH);
    front.models.top = makePanel(0, baseH + mainH, totalW, topH);

    front.paths.splitLine = new makerjs.paths.Line([halfW, 0], [halfW, totalH]);

    var handleH = 100;
    var handleW = 6;
    var handleOff = 12;

    front.models.hLeft = makePanel(halfW - handleOff - handleW, baseH, handleW, handleH);
    front.models.hRight = makePanel(halfW + handleOff, baseH, handleW, handleH);
    front.models.rightTrim = makePanel(halfW + handleOff, baseH + handleH - 15, halfW - handleOff, 15);
    front.models.rightPanel = makePanel(halfW + handleOff, baseH + handleH - 30, halfW - handleOff, 15);

    this.models.frontElevation = front;

    var internal = { models: {}, paths: {} };
    var ix = totalW + spacing;

    internal.models.base = makePanel(ix, 0, totalW, baseH);

    internal.models.topOuter = makePanel(ix, baseH + mainH, totalW, topH);
    internal.models.topDiv = makePanel(ix + halfW - thk / 2, baseH + mainH, thk, topH);

    internal.models.mainOuter = makePanel(ix, baseH, totalW, mainH);
    internal.models.mainDiv = makePanel(ix + halfW - thk / 2, baseH, thk, mainH);

    var rightInnerW = halfW - thk * 1.5;
    var subBayW = rightInnerW / 2;
    var drawerH = 18;
    var drawerAreaH = drawerH * 3 + thk * 3;

    internal.models.subDiv = makePanel(ix + halfW + subBayW, baseH, thk, drawerAreaH);

    for (var i = 0; i < 3; i++) {
        var dy = baseH + (i + 1) * (drawerH + thk);
        internal.models['drawerShelf_' + i] = makePanel(ix + halfW + subBayW, dy, subBayW + thk / 2, thk);
    }

    var rodMargin = 3;
    var topRodY = baseH + mainH - 12;
    var midRodY = baseH + drawerAreaH + 5;

    function addRod(name, x, y, len) {
        var rod = {
            layer: 'rod',
            paths: {
                top: new makerjs.paths.Line([x, y + 1.5], [x + len, y + 1.5]),
                bot: new makerjs.paths.Line([x, y - 1.5], [x + len, y - 1.5]),
                left: new makerjs.paths.Line([x, y - 1.5], [x, y + 1.5]),
                right: new makerjs.paths.Line([x + len, y - 1.5], [x + len, y + 1.5])
            }
        };
        internal.models[name] = rod;
    }

    addRod('rodL_top', ix + thk + rodMargin, topRodY, halfW - thk * 1.5 - rodMargin * 2);
    addRod('rodL_mid', ix + thk + rodMargin, midRodY, halfW - thk * 1.5 - rodMargin * 2);

    addRod('rodR_top', ix + halfW + thk / 2 + rodMargin, topRodY, halfW - thk * 1.5 - rodMargin * 2);
    addRod('rodR_mid', ix + halfW + thk / 2 + rodMargin, midRodY, subBayW - rodMargin * 2);

    this.models.internalElevation = internal;

    var sx1 = ix + totalW + spacing;
    var sx2 = sx1 + depth + spacing * 0.8;

    function makeSideSection(xOffset, isRightBay) {
        var side = { models: {} };

        side.models.base = makePanel(xOffset, 0, depth, baseH);
        side.models.main = makePanel(xOffset, baseH, depth, mainH);
        side.models.top = makePanel(xOffset, baseH + mainH, depth, topH);

        if (isRightBay) {
            for (var j = 1; j <= 3; j++) {
                var shelfY = baseH + j * (drawerH + thk);
                side.models['sideShelf_' + j] = makePanel(xOffset + thk, shelfY, depth - thk * 2, thk);
            }
        }

        return side;
    }

    this.models.sideSectionLeft = makeSideSection(sx1, false);
    this.models.sideSectionRight = makeSideSection(sx2, true);

    this.notes = '# Wardrobe elevations\nFront / internal / side-section views. Tested via makerjs-playground MCP render_model: 117 paths, 33 models, 28 chains, 614 x 271.5.';
}

Wardrobe.metaParameters = [
    { title: "Total Width (W)", type: "range", min: 120, max: 300, value: 200 },
    { title: "Total Height (H)", type: "range", min: 200, max: 300, value: 271.5 },
    { title: "Base Height", type: "range", min: 5, max: 15, value: 10 },
    { title: "Top Box Height", type: "range", min: 30, max: 70, value: 48.5 },
    { title: "Board Thickness", type: "range", min: 1.2, max: 2.5, step: 0.1, value: 1.8 },
    { title: "Cabinet Depth", type: "range", min: 40, max: 70, value: 58 },
    { title: "View Spacing", type: "range", min: 10, max: 60, value: 35 }
];

module.exports = Wardrobe;