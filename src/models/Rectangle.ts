/// <reference path="shapefrompoints.ts" />

module Maker.Models {
    export class Rectangle extends ShapeFromPoints {
        constructor(public width: number, public height: number) {
            super(true, [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }]);
        }
    }
} 