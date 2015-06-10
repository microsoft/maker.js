/// <reference path="rectangle.ts" />

module Maker.models {
    export class Square extends Rectangle {
        constructor(public side: number) {
            super(side, side);
        }
    }
} 