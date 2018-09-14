declare var makerjs: typeof MakerJs;

module Pointer {
    export var wheelZoomDelta = 0.1;
    export var clickDistance = 2;

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
        initial: IPointRelative;
        previous: IPointRelative;
        current: IPointRelative;
        srcElement: Element;
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
        if (!all[0].current || !all[1].current) {
            return null;
        }
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
        private isClick: boolean;
        private wheelTimer: NodeJS.Timer;
        private wheelTimeout = 250;

        public down: IPointerMap = {};
        public count: number;

        constructor(
            private view: HTMLDivElement,
            private pointersSelector: string,
            private margin: MakerJs.IPoint,
            private getZoom: () => IPanZoom,
            private setZoom: (panZoom: IPanZoom) => void,
            private onClick: (srcElement: Element) => any,
            private onReset: () => any
        ) {

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
            var oldNode = document.querySelector(this.pointersSelector) as SVGElement;
            var domPointers = oldNode.cloneNode(false) as SVGElement;
            oldNode.parentNode.replaceChild(domPointers, oldNode);
            return domPointers;
        }

        private drawPointer(ns: string, point: MakerJs.IPoint, id: string, isCrossHair: boolean): SVGGElement {

            function createElement(tagName: string, attrs: any) {
                var el = document.createElementNS(ns, tagName);

                for (var attrName in attrs) {
                    var value = attrs[attrName];
                    el.setAttributeNS(null, attrName, value);
                }

                return el;
            }

            function createCircle(circleId: string, cx: number | string, cy: number | string, r: number | string) {
                return createElement('circle', {
                    "id": circleId,
                    "cx": cx,
                    "cy": cy,
                    "r": r
                }) as SVGCircleElement;
            }

            function createLine(lineId: string, x1: number | string, y1: number | string, x2: number | string, y2: number | string) {
                return createElement('line', {
                    "id": lineId,
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                }) as SVGLineElement;
            }

            var g = createElement('g', { "id": id }) as SVGGElement;

            if (isCrossHair) {

                var x = createLine('x', point[0], 0, point[0], '100%');
                var y = createLine('y', 0, point[1], '100%', point[1]);

                g.appendChild(x);
                g.appendChild(y);

            } else {

                var c = createCircle('c', point[0], point[1], 35);
                g.appendChild(c);

            }

            return g;
        }

        public draw(pointers: IPointer[]) {

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
        }

        public isWithinMargin(p: IPointRelative): boolean {

            if (!makerjs.measure.isBetween(p.fromCanvas[0], this.margin[0], this.view.offsetWidth - this.margin[0], false)) return false;
            if (!makerjs.measure.isBetween(p.fromCanvas[1], this.margin[1], this.view.offsetHeight - this.margin[1], false)) return false;

            return true;
        }

        public viewPointerDown(e: IPointerEvent) {

            clearTimeout(this.wheelTimer);

            var pointRelative = this.getPointRelative(e);

            if (!this.isWithinMargin(pointRelative)) return;

            e.preventDefault();
            e.stopPropagation();

            var pointer: IPointer = {
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
            
        }

        public viewPointerMove(e: IPointerEvent) {
            var pointer = this.down[e.pointerId];
            if (!pointer) return;

            clearTimeout(this.wheelTimer);

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

                this.draw([pointer]);

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

                this.draw(all);
            }

            panZoom.pan = p.add(panZoom.pan, panDelta);

            this.setZoom(panZoom);
        }

        public viewPointerUp(e: IPointerEvent) {

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

                        if (clickTravel <= clickDistance) {
                            this.onClick(pointer.srcElement);
                        }
                    }

                    this.reset();

                } else {
                    this.draw(this.asArray());
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

        public viewWheel(e: MouseWheelEvent) {

            this.isClick = false;

            var pointRelative = this.getPointRelative(e);

            if (!this.isWithinMargin(pointRelative)) return;

            e.preventDefault();

            var pointer: IPointer = {
                id: 0,
                type: 'wheel',
                initial: pointRelative,
                previous: pointRelative,
                current: pointRelative,
                srcElement: e.srcElement
            };
            var sign = (e.wheelDelta || e['deltaY']) > 0 ? 1 : -1;
            var newZoom = pointRelative.panZoom.zoom * (1 + sign * wheelZoomDelta);

            this.scaleCenterPoint(pointRelative.panZoom, newZoom, pointRelative.fromDrawingOrigin);

            this.setZoom(pointRelative.panZoom);

            this.draw([pointer]);

            clearTimeout(this.wheelTimer);
            this.wheelTimer = setTimeout(() => {
                this.erase();
            }, this.wheelTimeout);
        }

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
