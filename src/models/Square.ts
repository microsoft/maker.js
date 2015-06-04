/// <reference path="rectangle.ts" />

module makerjs.Models {
    export class Square extends Rectangle {
        constructor(public side: number) {
            super(side, side);
        }
    }
} 