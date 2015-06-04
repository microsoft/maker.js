/// <reference path="rectangle.ts" />

module makerjs.models {
    export class Square extends Rectangle {
        constructor(public side: number) {
            super(side, side);
        }
    }
} 