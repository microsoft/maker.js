var Pointer;
(function (Pointer) {
    Pointer.wheelZoomDelta = 0.1;
    Pointer.clickDistance = 2;
    function distanceBetweenCurrent2Points(all) {
        if (!all[0].current || !all[1].current) {
            return null;
        }
        return makerjs.measure.pointDistance(all[0].current.fromCanvas, all[1].current.fromCanvas);
    }
    function average(all, fromCanvas) {
        if (all.length == 0)
            return null;
        var x = 0;
        var y = 0;
        for (var i = 0; i < all.length; i++) {
            var p = all[i].current;
            var point = fromCanvas ? p.fromCanvas : p.fromDrawingOrigin;
            x += point[0];
            y += point[1];
        }
        return [x / all.length, y / all.length];
    }
    var Manager = /** @class */ (function () {
        function Manager(view, pointersSelector, margin, getZoom, setZoom, onClick, onReset) {
            var _this = this;
            this.view = view;
            this.pointersSelector = pointersSelector;
            this.margin = margin;
            this.getZoom = getZoom;
            this.setZoom = setZoom;
            this.onClick = onClick;
            this.onReset = onReset;
            this.initialAveragePointFromDrawingOrigin = null;
            this.previousAveragePointFromCanvas = null;
            this.wheelTimeout = 250;
            this.down = {};
            view.addEventListener('wheel', function (e) { _this.viewWheel(e); });
            view.addEventListener('pointerdown', function (e) { _this.viewPointerDown(e); });
            view.addEventListener('pointermove', function (e) { _this.viewPointerMove(e); });
            view.addEventListener('pointerup', function (e) { _this.viewPointerUp(e); });
            //listen to touchend on entire document since we do not always get a pointerup event, as when pointer is released outside of view
            document.addEventListener('touchend', function (e) {
                if (e.touches.length)
                    return;
                _this.reset();
            });
            document.addEventListener('mouseup', function (e) { _this.reset(); });
            document.addEventListener('MSPointerUp', function (e) { _this.reset(); });
        }
        Manager.prototype.getPointRelative = function (ev) {
            var p = makerjs.point;
            var panZoom = this.getZoom();
            var fromCanvas = p.subtract([ev.pageX, ev.pageY], Pointer.pageOffset(this.view));
            var fromView = p.subtract(fromCanvas, this.margin);
            var pannedOrigin = p.add(panZoom.origin, panZoom.pan);
            var fromDrawingOrigin = p.scale(p.subtract(fromView, pannedOrigin), 1 / panZoom.zoom);
            return {
                fromCanvas: fromCanvas,
                fromDrawingOrigin: fromDrawingOrigin,
                panZoom: panZoom
            };
        };
        Manager.prototype.reset = function () {
            document.body.classList.remove('pointing');
            this.erase();
            this.down = {};
            this.count = 0;
            this.onReset();
        };
        Manager.prototype.asArray = function () {
            var result = [];
            for (var id in this.down) {
                result.push(this.down[id]);
            }
            return result;
        };
        Manager.prototype.erase = function () {
            var oldNode = document.querySelector(this.pointersSelector);
            var domPointers = oldNode.cloneNode(false);
            oldNode.parentNode.replaceChild(domPointers, oldNode);
            return domPointers;
        };
        Manager.prototype.drawPointer = function (ns, point, id, isCrossHair) {
            function createElement(tagName, attrs) {
                var el = document.createElementNS(ns, tagName);
                for (var attrName in attrs) {
                    var value = attrs[attrName];
                    el.setAttributeNS(null, attrName, value);
                }
                return el;
            }
            function createCircle(circleId, cx, cy, r) {
                return createElement('circle', {
                    "id": circleId,
                    "cx": cx,
                    "cy": cy,
                    "r": r
                });
            }
            function createLine(lineId, x1, y1, x2, y2) {
                return createElement('line', {
                    "id": lineId,
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                });
            }
            var g = createElement('g', { "id": id });
            if (isCrossHair) {
                var x = createLine('x', point[0], 0, point[0], '100%');
                var y = createLine('y', 0, point[1], '100%', point[1]);
                g.appendChild(x);
                g.appendChild(y);
            }
            else {
                var c = createCircle('c', point[0], point[1], 35);
                g.appendChild(c);
            }
            return g;
        };
        Manager.prototype.draw = function (pointers) {
            //erase all pointers
            var domPointers = this.erase();
            var ns = domPointers.getAttribute('xmlns');
            for (var i = 0; i < pointers.length; i++) {
                var pointer = pointers[i];
                domPointers.appendChild(this.drawPointer(ns, pointer.current.fromCanvas, 'pointer' + i, pointers.length == 1));
            }
            if (pointers.length == 2) {
                domPointers.appendChild(this.drawPointer(ns, this.previousAveragePointFromCanvas, 'pointer' + i, true));
            }
            document.body.classList.add('pointing');
        };
        Manager.prototype.isWithinMargin = function (p) {
            if (!makerjs.measure.isBetween(p.fromCanvas[0], this.margin[0], this.view.offsetWidth - this.margin[0], false))
                return false;
            if (!makerjs.measure.isBetween(p.fromCanvas[1], this.margin[1], this.view.offsetHeight - this.margin[1], false))
                return false;
            return true;
        };
        Manager.prototype.viewPointerDown = function (e) {
            clearTimeout(this.wheelTimer);
            var pointRelative = this.getPointRelative(e);
            if (!this.isWithinMargin(pointRelative))
                return;
            e.preventDefault();
            e.stopPropagation();
            var pointer = {
                id: e.pointerId,
                type: e.pointerType,
                initial: pointRelative,
                previous: pointRelative,
                current: pointRelative,
                srcElement: e.srcElement
            };
            this.down[pointer.id] = pointer;
            this.count++;
            this.isClick = this.count == 1;
            switch (this.count) {
                case 1:
                    this.draw([pointer]);
                    break;
                case 2:
                    var all = this.asArray();
                    this.initialZoom = pointRelative.panZoom.zoom;
                    this.initialDistance = distanceBetweenCurrent2Points(all);
                    this.initialAveragePointFromDrawingOrigin = average(all, false);
                    this.previousAveragePointFromCanvas = average(all, true);
                    this.draw(all);
                    break;
                default:
                    this.erase();
                    break;
            }
        };
        Manager.prototype.viewPointerMove = function (e) {
            var pointer = this.down[e.pointerId];
            if (!pointer)
                return;
            clearTimeout(this.wheelTimer);
            var pointRelative = this.getPointRelative(e);
            if (!this.isWithinMargin(pointRelative))
                return;
            e.stopPropagation();
            e.preventDefault();
            pointer.previous = pointer.current;
            pointer.current = pointRelative;
            var panZoom = pointer.current.panZoom;
            var p = makerjs.point;
            var panDelta;
            if (this.count == 1) {
                //simple pan
                panDelta = p.subtract(pointer.current.fromCanvas, pointer.previous.fromCanvas);
                this.draw([pointer]);
            }
            else if (this.count == 2) {
                //pan with zoom
                var all = this.asArray();
                //pan
                var currentAveragePointFromCanvas = average(all, true);
                panDelta = p.subtract(currentAveragePointFromCanvas, this.previousAveragePointFromCanvas);
                this.previousAveragePointFromCanvas = currentAveragePointFromCanvas;
                //zoom
                var currentDistance = distanceBetweenCurrent2Points(all);
                var zoomDiff = currentDistance / this.initialDistance;
                this.scaleCenterPoint(panZoom, this.initialZoom * zoomDiff, this.initialAveragePointFromDrawingOrigin);
                this.draw(all);
            }
            panZoom.pan = p.add(panZoom.pan, panDelta);
            this.setZoom(panZoom);
        };
        Manager.prototype.viewPointerUp = function (e) {
            clearTimeout(this.wheelTimer);
            var pointer = this.down[e.pointerId];
            if (pointer) {
                e.stopPropagation();
                e.preventDefault();
                delete this.down[e.pointerId];
                this.count--;
                if (this.count == 0) {
                    if (this.isClick) {
                        var clickTravel = makerjs.measure.pointDistance(pointer.initial.fromCanvas, pointer.current.fromCanvas);
                        if (clickTravel <= Pointer.clickDistance) {
                            this.onClick(pointer.srcElement);
                        }
                    }
                    this.reset();
                }
                else {
                    this.draw(this.asArray());
                }
            }
        };
        Manager.prototype.scaleCenterPoint = function (panZoom, newZoom, centerPointFromDrawingOrigin) {
            var p = makerjs.point;
            var previousZoom = panZoom.zoom;
            var zoomDiff = newZoom / previousZoom;
            var previousScaledCenter = p.scale(centerPointFromDrawingOrigin, previousZoom);
            var currentScaledCenter = p.scale(previousScaledCenter, zoomDiff);
            var centerPointDiff = p.subtract(previousScaledCenter, currentScaledCenter);
            panZoom.zoom = newZoom;
            panZoom.pan = p.add(panZoom.pan, centerPointDiff);
        };
        Manager.prototype.viewWheel = function (e) {
            var _this = this;
            this.isClick = false;
            var pointRelative = this.getPointRelative(e);
            if (!this.isWithinMargin(pointRelative))
                return;
            e.preventDefault();
            var pointer = {
                id: 0,
                type: 'wheel',
                initial: pointRelative,
                previous: pointRelative,
                current: pointRelative,
                srcElement: e.srcElement
            };
            var sign = (e.wheelDelta || e['deltaY']) > 0 ? 1 : -1;
            var newZoom = pointRelative.panZoom.zoom * (1 + sign * Pointer.wheelZoomDelta);
            this.scaleCenterPoint(pointRelative.panZoom, newZoom, pointRelative.fromDrawingOrigin);
            this.setZoom(pointRelative.panZoom);
            this.draw([pointer]);
            clearTimeout(this.wheelTimer);
            this.wheelTimer = setTimeout(function () {
                _this.erase();
            }, this.wheelTimeout);
        };
        return Manager;
    }());
    Pointer.Manager = Manager;
    // Find out where an element is on the page
    // From http://www.quirksmode.org/js/findpos.html
    function pageOffset(el) {
        var curleft = 0, curtop = 0;
        if (el.offsetParent) {
            do {
                curleft += el.offsetLeft;
                curtop += el.offsetTop;
            } while (el = el.offsetParent);
        }
        return [curleft, curtop];
    }
    Pointer.pageOffset = pageOffset;
})(Pointer || (Pointer = {}));
//# sourceMappingURL=pointer.js.map