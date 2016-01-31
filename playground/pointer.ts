/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/intersect.ts" />
/// <reference path="../src/core/measure.ts" />
/// <reference path="../src/core/units.ts" />

declare var makerjs: typeof MakerJs;

module Pointer {

    export interface IPanZoom {
        origin: MakerJs.IPoint;
        pan: MakerJs.IPoint;
        zoom: number;
    }

    interface IPointRelative {
        fromCanvas: MakerJs.IPoint;
        fromDrawingOrigin: MakerJs.IPoint;
        panZoom: IPanZoom;
    }

    interface IPointer {
        id: number;
        type: string;
        previous: IPointRelative;
        current: IPointRelative;
    }

    interface IPointerMap {
        [id: number]: IPointer;
    }

    //these are the limited subset of props we use
    interface IMouseEvent {
        pageX: number;
        pageY: number;
        preventDefault: Function;
        srcElement: Element,
        stopPropagation: Function;
    }

    interface IPointerEvent extends IMouseEvent {
        pointerId: number;
        pointerType: string;
    }

    function distanceBetweenCurrent2Points(all: IPointer[]) {
        return makerjs.measure.pointDistance(all[0].current.fromCanvas, all[1].current.fromCanvas);
    }

    function average(all: IPointer[], fromCanvas: boolean): MakerJs.IPoint {

        if (all.length == 0) return null;

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

    export class Manager {
        private initialDistance: number;
        private initialZoom: number;
        private initialAveragePointFromDrawingOrigin: MakerJs.IPoint = null;
        private previousAveragePointFromCanvas: MakerJs.IPoint = null;

        public down: IPointerMap = {};
        public count: number;

        constructor(
            private selector,
            private view: HTMLDivElement,
            private margin: MakerJs.IPoint,
            private getZoom: () => IPanZoom,
            private setZoom: (panZoom: IPanZoom) => void,
            private onReset: () => any
        ) {

            //todo - make this work for touch / pointer instead of just click
            //view.addEventListener('click', viewClick);

            view.addEventListener('wheel', (e: MouseWheelEvent) => { this.viewWheel(e); });
            view.addEventListener('pointerdown', (e: PointerEvent) => { this.viewPointerDown(e as IPointerEvent); });
            view.addEventListener('pointermove', (e: PointerEvent) => { this.viewPointerMove(e as IPointerEvent); });
            view.addEventListener('pointerup', (e: PointerEvent) => { this.viewPointerUp(e as IPointerEvent); });

            //listen to touchend on entire document since we do not always get a pointerup event, as when pointer is released outside of view
            document.addEventListener('touchend', (e: TouchEvent) => {
                if (e.touches.length) return;
                this.reset();
            });
            document.addEventListener('mouseup', (e: MouseEvent) => { this.reset(); });
            document.addEventListener('MSPointerUp', (e: MSPointerEvent) => { this.reset(); });
        }

        public getPointRelative(ev: IMouseEvent): IPointRelative {
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
        }

        public reset() {
            document.body.classList.remove('pointing');

            this.erase();
            this.down = {};
            this.count = 0;

            this.onReset();
        }

        public asArray(): IPointer[] {

            var result: IPointer[] = [];

            for (var id in this.down) {
                result.push(this.down[id]);
            }

            return result;
        }

        public erase(): SVGElement {
            var oldNode = document.querySelector(this.selector) as SVGElement;
            var domPointers = oldNode.cloneNode(false) as SVGElement;
            oldNode.parentNode.replaceChild(domPointers, oldNode);
            return domPointers;
        }

        private drawPointer(ns: string, point: MakerJs.IPoint, id: string): SVGGElement {

            function createElement(tagName: string, attrs: any) {
                var el = document.createElementNS(ns, tagName);

                for (var attrName in attrs) {
                    var value = attrs[attrName];
                    el.setAttributeNS(null, attrName, value);
                }

                return el;
            }

            function createLine(lineId: string, x1: number | string, y1: number | string, x2: number | string, y2: number | string) {
                return createElement('line', {
                    "id": lineId,
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                });
            }

            var x = createLine('x', point[0], 0, point[0], '100%');

            var y = createLine('y', 0, point[1], '100%', point[1]);

            var g = createElement('g', { "id": id }) as SVGGElement;

            g.appendChild(x);
            g.appendChild(y);

            return g;
        }

        public draw() {

            //erase all pointers
            var domPointers = this.erase();

            var count = 0;
            var ns = domPointers.getAttribute('xmlns');
            var maxPointers = 2;

            for (var id in this.down) {
                var pointer = this.down[id]
                domPointers.appendChild(this.drawPointer(ns, pointer.current.fromCanvas, 'pointer' + count));
                count++;
                if (count >= maxPointers) break;
            }
        }

        public isWithinMargin(p: IPointRelative): boolean {

            if (!makerjs.measure.isBetween(p.fromCanvas[0], this.margin[0], this.view.offsetWidth - this.margin[0], false)) return false;
            if (!makerjs.measure.isBetween(p.fromCanvas[1], this.margin[1], this.view.offsetHeight - this.margin[1], false)) return false;

            return true;
        }

        public viewPointerDown(e: IPointerEvent) {
            var pointRelative = this.getPointRelative(e);

            if (!this.isWithinMargin(pointRelative)) return;

            e.preventDefault();
            e.stopPropagation();

            var p: IPointer = {
                id: e.pointerId,
                type: e.pointerType,
                previous: pointRelative,
                current: pointRelative
            };

            this.down[p.id] = p;
            this.count++;

            document.body.classList.add('pointing');

            if (this.count == 2) {

                //TODO - fix bug when swithing between 1 and 2 points in IE

                var all = this.asArray();

                this.initialZoom = pointRelative.panZoom.zoom;
                this.initialDistance = distanceBetweenCurrent2Points(all);
                this.initialAveragePointFromDrawingOrigin = average(all, false);
                this.previousAveragePointFromCanvas = average(all, true);
            }

            this.draw();
        }

        public viewPointerMove(e: IPointerEvent) {
            var pointer = this.down[e.pointerId];
            if (!pointer) return;

            var pointRelative = this.getPointRelative(e);
            if (!this.isWithinMargin(pointRelative)) return;

            e.stopPropagation();
            e.preventDefault();

            pointer.previous = pointer.current;
            pointer.current = pointRelative;

            var panZoom = pointer.current.panZoom;
            var p = makerjs.point;
            var panDelta: MakerJs.IPoint;

            if (this.count == 1) {
                //simple pan

                panDelta = p.subtract(pointer.current.fromCanvas, pointer.previous.fromCanvas);

            } else if (this.count == 2) {
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
            }

            panZoom.pan = p.add(panZoom.pan, panDelta);

            this.draw();
            this.setZoom(panZoom);
        }

        public viewPointerUp(e: IPointerEvent) {

            if (this.down[e.pointerId]) {

                e.stopPropagation();
                e.preventDefault();

                delete this.down[e.pointerId];
                this.count--;

                if (this.count == 0) {

                    this.reset();

                } else {
                    this.draw();
                }
            }
        }

        public scaleCenterPoint(panZoom: IPanZoom, newZoom: number, centerPointFromDrawingOrigin: MakerJs.IPoint) {
            var p = makerjs.point;
            var previousZoom = panZoom.zoom;
            var zoomDiff = newZoom / previousZoom;
            var previousScaledCenter = p.scale(centerPointFromDrawingOrigin, previousZoom);
            var currentScaledCenter = p.scale(previousScaledCenter, zoomDiff);
            var centerPointDiff = p.subtract(previousScaledCenter, currentScaledCenter);

            panZoom.zoom = newZoom;
            panZoom.pan = p.add(panZoom.pan, centerPointDiff);
        }

        public viewWheel(ev: MouseWheelEvent) {
            ev.preventDefault();

            var zoomDelta = 1;     //TODO: base the delta, min / max value on model natural size vs window size

            var point = this.getPointRelative(ev);

            var newZoom = Math.max(point.panZoom.zoom + ((ev.wheelDelta || ev['deltaY']) > 0 ? 1 : -1) * zoomDelta, 1);

            this.scaleCenterPoint(point.panZoom, newZoom, point.fromDrawingOrigin);

            this.setZoom(point.panZoom);
        }

        //function viewClick(e: PointerEvent) {

        //    var ev = e as IPointerEvent;

        //    if (ev.srcElement && ev.srcElement.tagName && ev.srcElement.tagName == 'text') {

        //        var text = ev.srcElement as SVGTextElement;
        //        var path = text.previousSibling;

        //        lockToPath(path);
        //    }
        //}
    }

    // Find out where an element is on the page
    // From http://www.quirksmode.org/js/findpos.html
    export function pageOffset(el: HTMLElement): MakerJs.IPoint {
        var curleft = 0, curtop = 0;
        if (el.offsetParent) {
            do {
                curleft += el.offsetLeft;
                curtop += el.offsetTop;
            } while (el = el.offsetParent as HTMLElement);
        }
        return [curleft, curtop];
    }
}