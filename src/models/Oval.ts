/// <reference path="roundrectangle.ts" />

module MakerJs.models {

    export class Oval extends RoundRectangle {

        constructor(width: number, height: number) {
            super(width, height, Math.min(height / 2, width / 2));
        }

    }

} 