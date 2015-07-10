/// <reference path="rectangle.ts" />

module MakerJs.models {
    export class GoldenRectangle extends Rectangle {
        constructor(width: number) {
            super(width, width * GoldenRectangle.GoldenRatio);
        }
        static GoldenRatio = (1 + Math.sqrt(5)) / 2;
    }
}