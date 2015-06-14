/// <reference path="roundrectangle.ts" />

module MakerJs.models {

    export class Oval extends RoundRectangle {

        constructor(public id: string, width: number, height: number) {
            super(id, width, height, Math.min(height / 2, width / 2));
        }

    }

} 