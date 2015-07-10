/// <reference path="rectangle.ts" />

module MakerJs.models {
    export class Square extends Rectangle {
        constructor(side: number) {
            super(side, side);
        }
    }
} 