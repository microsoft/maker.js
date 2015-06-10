/// <reference path="connectthedots.ts" />

module Maker.models {
    export class Rectangle extends ConnectTheDots {
        constructor(public width: number, public height: number) {
            super(true, [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }]);
        }
    }
} 