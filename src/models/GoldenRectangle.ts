/// <reference path="rectangle.ts" />

module MakerJs.models {
    export class GoldenRectangle extends Rectangle {
        constructor(public id: string, width: number) {
            super(id, width, width * GoldenRectangle.GoldenRatio);
        }
        static GoldenRatio = (1 + Math.sqrt(5)) / 2;
    }
}